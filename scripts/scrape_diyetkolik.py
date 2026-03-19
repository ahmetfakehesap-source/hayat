"""
Diyetkolik.com Food Database Scraper - Fast Version
Uses concurrent requests to scrape all food items quickly
"""
import requests
from bs4 import BeautifulSoup
import json
import time
import re
import os
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_URL = "https://www.diyetkolik.com"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "tr-TR,tr;q=0.9",
}

session = requests.Session()
session.headers.update(HEADERS)


def get_food_urls_from_sitemap():
    """Get food URLs from sitemap"""
    urls = set()
    try:
        r = session.get(f"{BASE_URL}/sitemap.xml", timeout=15)
        if r.status_code == 200:
            # Try XML parser
            try:
                soup = BeautifulSoup(r.text, 'xml')
                for loc in soup.find_all('loc'):
                    url = loc.text.strip()
                    if '/kac-kalori/' in url and '/kategori/' not in url:
                        urls.add(url)
            except:
                # Fallback: regex
                for match in re.finditer(r'<loc>(https?://www\.diyetkolik\.com/kac-kalori/[^<]+)</loc>', r.text):
                    url = match.group(1)
                    if '/kategori/' not in url:
                        urls.add(url)
    except Exception as e:
        print(f"  Sitemap hatası: {e}")
    
    return urls


def scrape_food_page(url):
    """Scrape nutritional data from a single food page"""
    try:
        r = session.get(url, timeout=8)
        if r.status_code != 200:
            return None
        
        soup = BeautifulSoup(r.text, 'html.parser')
        text = soup.get_text(' ', strip=True)
        
        # Get food name
        name = None
        h1 = soup.find('h1')
        if h1:
            name = h1.get_text(strip=True)
            name = re.sub(r'\s*Kaç\s*Kalori\s*\??', '', name).strip()
        
        if not name:
            slug = url.rstrip('/').split('/')[-1]
            name = slug.replace('-', ' ').title()
        
        calories = 0
        protein = 0
        carbs = 0
        fat = 0
        
        # Method 1: Look for tables with nutritional info
        tables = soup.find_all('table')
        for table in tables:
            rows = table.find_all('tr')
            for row in rows:
                cells = row.find_all(['td', 'th'])
                if len(cells) >= 2:
                    label = cells[0].get_text(strip=True).lower()
                    value_text = cells[-1].get_text(strip=True)
                    val_match = re.search(r'(\d+[\.,]?\d*)', value_text)
                    if val_match:
                        val = float(val_match.group(1).replace(',', '.'))
                        if ('kalori' in label or 'enerji' in label) and 'kcal' not in label.lower():
                            if val > 0: calories = val
                        elif 'kcal' in label.lower():
                            if val > 0: calories = val
                        elif 'protein' in label:
                            protein = val
                        elif 'karbonhidrat' in label:
                            carbs = val
                        elif 'yağ' in label and 'doymuş' not in label and 'doymamış' not in label and 'trans' not in label:
                            fat = val
        
        # Method 2: Regex from text
        if not calories:
            cal_match = re.search(r'100\s*gram[ıi]nda\s*(\d+[\.,]?\d*)\s*kalori', text, re.IGNORECASE)
            if cal_match:
                calories = float(cal_match.group(1).replace(',', '.'))
        
        if not protein:
            prot_match = re.search(r'(\d+[\.,]?\d*)\s*gram\s*protein', text, re.IGNORECASE)
            if prot_match:
                protein = float(prot_match.group(1).replace(',', '.'))
        
        if not carbs:
            carb_match = re.search(r'(\d+[\.,]?\d*)\s*gram\s*karbonhidrat', text, re.IGNORECASE)
            if carb_match:
                carbs = float(carb_match.group(1).replace(',', '.'))
        
        if not fat:
            fat_match = re.search(r'(\d+[\.,]?\d*)\s*gram\s*yağ', text, re.IGNORECASE)
            if fat_match:
                fat = float(fat_match.group(1).replace(',', '.'))
        
        if not calories:
            return None
        
        return {
            "name": name,
            "calories": round(calories),
            "protein": round(protein, 1),
            "carbs": round(carbs, 1),
            "fat": round(fat, 1),
        }
        
    except Exception:
        return None


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_json = os.path.join(script_dir, "diyetkolik_foods.json")
    
    print("🍽️ Diyetkolik.com Fast Scraper")
    print("=" * 50)
    
    # Step 1: Get URLs
    print("📥 Sitemap'ten URL'ler alınıyor...")
    urls = get_food_urls_from_sitemap()
    print(f"  {len(urls)} URL bulundu")
    
    if not urls:
        print("❌ URL bulunamadı!")
        return
    
    url_list = list(urls)
    
    # Step 2: Scrape with thread pool (10 concurrent)
    print(f"\n🔄 {len(url_list)} sayfa taranıyor (10 paralel)...\n")
    foods = []
    done = 0
    errors = 0
    start_time = time.time()
    
    with ThreadPoolExecutor(max_workers=10) as executor:
        future_to_url = {executor.submit(scrape_food_page, url): url for url in url_list}
        
        for future in as_completed(future_to_url):
            done += 1
            result = future.result()
            if result:
                foods.append(result)
            else:
                errors += 1
            
            if done % 100 == 0:
                elapsed = time.time() - start_time
                rate = done / elapsed if elapsed > 0 else 0
                eta = (len(url_list) - done) / rate if rate > 0 else 0
                print(f"  [{done}/{len(url_list)}] ✅ {len(foods)} yemek | ❌ {errors} hata | ⏱️ {eta:.0f}s kaldı")
    
    # Step 3: Deduplicate and sort
    seen = set()
    unique_foods = []
    for food in foods:
        key = food['name'].lower().strip()
        if key not in seen:
            seen.add(key)
            unique_foods.append(food)
    
    unique_foods.sort(key=lambda f: f['name'])
    
    # Step 4: Save
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(unique_foods, f, ensure_ascii=False, indent=2)
    
    elapsed = time.time() - start_time
    print(f"\n{'=' * 50}")
    print(f"✅ Tamamlandı! ({elapsed:.1f} saniye)")
    print(f"📊 Toplam URL: {len(url_list)}")
    print(f"📋 Başarılı yemek: {len(unique_foods)}")
    print(f"❌ Başarısız: {errors}")
    print(f"💾 Kaydedildi: {output_json}")


if __name__ == "__main__":
    main()
