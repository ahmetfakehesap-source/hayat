"""
Diyetkolik.com Failed URLs Retry Scraper
Matches sitemap URLs against existing dataset and scrapes only the missing ones, saving explicitly to diyetkolik_foods_v2.json
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
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept-Language": "tr-TR,tr;q=0.9",
}

session = requests.Session()
session.headers.update(HEADERS)


def get_food_urls_from_sitemap():
    urls = set()
    try:
        r = session.get(f"{BASE_URL}/sitemap.xml", timeout=15)
        if r.status_code == 200:
            for m in re.finditer(r'<loc>(https?://www\.diyetkolik\.com/kac-kalori/[^<]+)</loc>', r.text):
                url = m.group(1)
                if '/kategori/' not in url:
                    urls.add(url)
    except Exception as e:
        print(f"  Sitemap error: {e}")
    return urls

def normalize_name_for_url(name):
    # This is a best-effort reverse-engineer of their URL slug logic
    n = name.lower()
    rep = {'ı':'i', 'ğ':'g', 'ü':'u', 'ş':'s', 'ö':'o', 'ç':'c', 'â':'a', 'î':'i'}
    for k, v in rep.items():
        n = n.replace(k, v)
    n = re.sub(r'[^a-z0-9\s-]', '', n)
    n = re.sub(r'\s+', '-', n.strip())
    return n

def scrape_food_page(url, retries=3):
    """Scrape food with all serving sizes, retries on failure"""
    for attempt in range(retries + 1):
        try:
            r = session.get(url, timeout=15)
            if r.status_code != 200:
                if attempt < retries:
                    time.sleep(2)  # Longer delay on retry
                    continue
                return None

            html = r.text
            soup = BeautifulSoup(html, 'html.parser')

            # Get food name
            name = None
            h1 = soup.find('h1')
            if h1:
                name = h1.get_text(strip=True)
                name = re.sub(r'\s*Kaç\s*Kalori\s*\??', '', name).strip()
            if not name:
                slug = url.rstrip('/').split('/')[-1]
                name = slug.replace('-', ' ').title()

            # Extract 100g macros from CSS class spans
            protein_100 = 0.0
            carbs_100 = 0.0
            fat_100 = 0.0

            prot_span = soup.find('span', class_='lbl_prot100')
            if prot_span:
                try: protein_100 = float(prot_span.get_text(strip=True).replace(',', '.'))
                except: pass
            carb_span = soup.find('span', class_='lbl_carb100')
            if carb_span:
                try: carbs_100 = float(carb_span.get_text(strip=True).replace(',', '.'))
                except: pass
            fat_span = soup.find('span', class_='lbl_fat100')
            if fat_span:
                try: fat_100 = float(fat_span.get_text(strip=True).replace(',', '.'))
                except: pass

            # Get calories from RSC Gram portion
            calories_100 = 0.0
            gram_cal = re.search(
                r'\\\\?"name\\\\?":\\\\?"Gram\\\\?"[^}]*?\\\\?"calorie\\\\?":\s*(\d+(?:\.\d+)?)',
                html
            )
            if gram_cal:
                calories_100 = round(float(gram_cal.group(1)) * 100)
            else:
                text = soup.get_text(' ', strip=True)
                m = re.search(r'100\s*gram[ıi]nda\s*(\d+[\.,]?\d*)\s*kalori', text, re.IGNORECASE)
                if m:
                    calories_100 = float(m.group(1).replace(',', '.'))

            if not calories_100:
                if attempt < retries:
                    time.sleep(2)
                    continue
                return None

            # Extract servings
            servings = []
            portion_matches = re.findall(
                r'\\\\?"name\\\\?":\\\\?"([^"\\\\]+)\\\\?"[^}]*?\\\\?"current_amount\\\\?":\s*(\d+(?:\.\d+)?)[^}]*?\\\\?"calorie\\\\?":\s*(\d+(?:\.\d+)?)',
                html
            )
            if portion_matches:
                seen = set()
                for pname, pgram, pcal in portion_matches:
                    if pname not in seen and float(pgram) > 0:
                        seen.add(pname)
                        servings.append({
                            'name': pname,
                            'gram': round(float(pgram)),
                        })

            result = {
                'name': name,
                'calories': round(calories_100),
                'protein': round(protein_100, 1),
                'carbs': round(carbs_100, 1),
                'fat': round(fat_100, 1),
            }

            if servings:
                result['servings'] = servings

            return result

        except Exception:
            if attempt < retries:
                time.sleep(2)
                continue
            return None

    return None

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_json = os.path.join(script_dir, "diyetkolik_foods_v2.json")

    print("🍽️ Diyetkolik.com Retry Scraper")
    print("=" * 50)

    # 1. Load existing data
    try:
        with open(output_json, 'r', encoding='utf-8') as f:
            existing_foods = json.load(f)
    except Exception as e:
        print(f"Error loading {output_json}: {e}")
        return

    print(f"📦 Mevcut db'de {len(existing_foods)} yemek var.")

    # 2. Get all URLs
    print("📥 Sitemap'ten tüm URL'ler alınıyor...")
    all_urls = get_food_urls_from_sitemap()
    print(f"🌍 Sitemap'te toplan {len(all_urls)} URL bulundu.")

    # 3. Find missing URLs
    # Since we only have names in DB, we'll convert names back to URLs to check,
    # and also check simply if we already have 7.2k URLs completed.
    
    # Let's create a reverse mapping: known URLs from DB names
    db_slugs = set()
    for f in existing_foods:
        db_slugs.add(normalize_name_for_url(f['name']))
        
    missing_urls = []
    for url in all_urls:
        slug = url.rstrip('/').split('/')[-1]
        if slug not in db_slugs:
            # Also try exact match just in case
            missing_urls.append(url)
            
    # For safety against slug mismatches, let's keep it to max (total URLS - existing foods) + 500 headroom
    # But usually doing an exact difference is best. Since slugs might not match perfectly,
    # a scrape of missing_urls might include some already in DB. We will deduplicate at the end based on exact Name anyway.
    
    print(f"🔍 Hedeflenen eksik URL sayısı: {len(missing_urls)}")
    
    if not missing_urls:
        print("Tüm URL'ler zaten var gibi görünüyor!")
        return
        
    print(f"\n🔄 {len(missing_urls)} eksik sayfa taranıyor (5 paralel, retry=3, yavaş)...")
    
    new_foods = []
    done = 0
    errors = 0
    start_time = time.time()

    with ThreadPoolExecutor(max_workers=5) as executor:
        future_to_url = {executor.submit(scrape_food_page, url): url for url in missing_urls}
        for future in as_completed(future_to_url):
            done += 1
            result = future.result()
            if result:
                new_foods.append(result)
            else:
                errors += 1
            if done % 50 == 0:
                elapsed = time.time() - start_time
                rate = done / elapsed if elapsed > 0 else 0
                eta = (len(missing_urls) - done) / rate if rate > 0 else 0
                print(f"  [{done}/{len(missing_urls)}] ✅ Yeni: {len(new_foods)} | ❌ Hata: {errors} | ⏱️ {eta:.0f}s")

    # Deduplicate with existing
    all_combined = existing_foods + new_foods
    seen = set()
    unique_foods = []
    
    # Priority to new foods if they have more servings, otherwise keep first seen (existing)
    for food in all_combined:
        key = food['name'].lower().strip()
        if key not in seen:
            seen.add(key)
            unique_foods.append(food)
            
    unique_foods.sort(key=lambda f: f['name'])

    with_servings = sum(1 for f in unique_foods if 'servings' in f)
    total_servings = sum(len(f.get('servings', [])) for f in unique_foods)

    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(unique_foods, f, ensure_ascii=False, indent=2)

    elapsed = time.time() - start_time
    print(f"\n{'=' * 50}")
    print(f"✅ Tamamlandı! ({elapsed:.1f}s)")
    print(f"🆕 Eklenen yeni yemek: {len(unique_foods) - len(existing_foods)}")
    print(f"📋 Toplam veritabanı: {len(unique_foods)}")
    print(f"📏 Porsiyon bilgisi olan: {with_servings}")
    print(f"📐 Toplam porsiyon: {total_servings}")
    print(r"💾 C:\Users\Lery\Desktop\Hayat\scripts\diyetkolik_foods_v2.json kaydedildi.")

if __name__ == "__main__":
    main()
