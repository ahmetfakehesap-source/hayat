import requests, json, re

def get_food_urls_from_sitemap():
    urls = set()
    r = requests.get('https://www.diyetkolik.com/sitemap.xml', timeout=15)
    for m in re.finditer(r'<loc>(https?://www\.diyetkolik\.com/kac-kalori/[^<]+)</loc>', r.text):
        url = m.group(1)
        if '/kategori/' not in url:
            urls.add(url)
    return urls

urls = list(get_food_urls_from_sitemap())
print('Total sitemap urls:', len(urls))

with open('scripts/diyetkolik_foods_v2.json', 'r', encoding='utf-8') as f:
    existing_foods = json.load(f)

def normalize_name_for_url(name):
    n = name.lower()
    rep = {'ı':'i', 'ğ':'g', 'ü':'u', 'ş':'s', 'ö':'o', 'ç':'c', 'â':'a', 'î':'i'}
    for k, v in rep.items(): n = n.replace(k, v)
    n = re.sub(r'[^a-z0-9\s-]', '', n)
    return re.sub(r'\s+', '-', n.strip())

db_slugs = {normalize_name_for_url(f['name']) for f in existing_foods}

missing = [u for u in urls if u.rstrip('/').split('/')[-1] not in db_slugs]
print('Missing:', len(missing))
print('Sample missing:', missing[:5])

# Test one missing
if missing:
    test_url = missing[0]
    print(f"Testing {test_url}")
    r = requests.get(test_url, headers={'User-Agent': 'Mozilla/5.0'})
    print(f"Status: {r.status_code}")
    print(f"Has calories? {'lbl_prot100' in r.text}")
