"""
Diyetkolik.com Complete Scraper v4
Extracts ALL foods with serving sizes, with retry logic
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


def scrape_food_page(url, retries=2):
    """Scrape food with all serving sizes, retries on failure"""
    for attempt in range(retries + 1):
        try:
            r = session.get(url, timeout=10)
            if r.status_code != 200:
                if attempt < retries:
                    time.sleep(1)
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

            # Get calories from RSC Gram portion (calorie per 1g * 100)
            calories_100 = 0.0
            gram_cal = re.search(
                r'\\\\?"name\\\\?":\\\\?"Gram\\\\?"[^}]*?\\\\?"calorie\\\\?":\s*(\d+(?:\.\d+)?)',
                html
            )
            if gram_cal:
                calories_100 = round(float(gram_cal.group(1)) * 100)
            else:
                # Fallback: text pattern
                text = soup.get_text(' ', strip=True)
                m = re.search(r'100\s*gram[ıi]nda\s*(\d+[\.,]?\d*)\s*kalori', text, re.IGNORECASE)
                if m:
                    calories_100 = float(m.group(1).replace(',', '.'))

            if not calories_100:
                if attempt < retries:
                    time.sleep(1)
                    continue
                return None

            # Extract serving sizes from RSC payload
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
                time.sleep(1)
                continue
            return None

    return None


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_json = os.path.join(script_dir, "diyetkolik_foods_v2.json")

    print("🍽️ Diyetkolik.com Complete Scraper v4")
    print("=" * 50)

    # Test mode
    import sys
    if '--test' in sys.argv:
        print("\n🧪 TEST: Yumurta")
        r = scrape_food_page("https://www.diyetkolik.com/kac-kalori/yumurta")
        if r: print(json.dumps(r, ensure_ascii=False, indent=2))
        print("\n🧪 TEST: Lahmacun")
        r = scrape_food_page("https://www.diyetkolik.com/kac-kalori/lahmacun")
        if r: print(json.dumps(r, ensure_ascii=False, indent=2))
        print("\n🧪 TEST: Tavuk Göğüs")
        r = scrape_food_page("https://www.diyetkolik.com/kac-kalori/tavuk-gogus-derisiz-cig")
        if r: print(json.dumps(r, ensure_ascii=False, indent=2))
        return

    # Full scrape
    print("📥 Sitemap'ten URL'ler alınıyor...")
    urls = get_food_urls_from_sitemap()
    print(f"  {len(urls)} URL bulundu")

    if not urls:
        print("❌ URL bulunamadı!")
        return

    url_list = list(urls)
    print(f"\n🔄 {len(url_list)} sayfa taranıyor (10 paralel, retry=2)...\n")
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
            if done % 200 == 0:
                elapsed = time.time() - start_time
                rate = done / elapsed if elapsed > 0 else 0
                eta = (len(url_list) - done) / rate if rate > 0 else 0
                with_srv = sum(1 for f in foods if 'servings' in f)
                print(f"  [{done}/{len(url_list)}] ✅ {len(foods)} yemek ({with_srv} porsiyon) | ❌ {errors} | ⏱️ {eta:.0f}s")

    # Deduplicate
    seen = set()
    unique_foods = []
    for food in foods:
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
    print(f"📋 Toplam yemek: {len(unique_foods)}")
    print(f"📏 Porsiyon bilgisi olan: {with_servings}")
    print(f"📐 Toplam porsiyon: {total_servings}")
    print(f"❌ Başarısız: {errors}")
    print(f"💾 {output_json}")


if __name__ == "__main__":
    main()
