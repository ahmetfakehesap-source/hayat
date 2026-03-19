import requests, json

with open('scripts/diyetkolik_foods_v2.json', 'r', encoding='utf-8') as f:
    foods = json.load(f)

db_names = {f['name'].lower() for f in foods}

# Let's test a couple URLs that failed
urls = [
    "https://www.diyetkolik.com/kac-kalori/1-kase-kelloggsc-coco-pops-cokotop",
    "https://www.diyetkolik.com/kac-kalori/tavuk-suyuna-sehriye-corbasi",
    "https://www.diyetkolik.com/kac-kalori/uno-denge-tam-bugdayli-ekmek",
    "https://www.diyetkolik.com/kac-kalori/yulaf-ezmesi-1"
]

for url in urls:
    try:
        r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, allow_redirects=False, timeout=5)
        print(f"URL: {url}")
        print(f"Status: {r.status_code}")
        if r.status_code != 200:
            print(f"Location: {r.headers.get('Location', 'No location header')}")
        print("---")
    except Exception as e:
        print(f"Error {url}: {e}")
