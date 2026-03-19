import requests, re
from bs4 import BeautifulSoup

r = requests.get('https://www.diyetkolik.com/kac-kalori/yumurta', headers={'User-Agent':'Mozilla/5.0'}, timeout=10)
soup = BeautifulSoup(r.text, 'html.parser')

# Find ALL spans with class containing 'lbl'
for s in soup.find_all('span'):
    cls = s.get('class', [])
    cls_str = ' '.join(cls) if cls else ''
    if 'lbl' in cls_str or 'calorie' in cls_str or 'protein' in cls_str:
        print(f"class={cls_str:40s} text={s.get_text(strip=True)}")

# Also check itemProp attributes
print("\n--- itemProp spans ---")
for s in soup.find_all(attrs={'itemprop': True}):
    print(f"itemProp={s.get('itemprop'):30s} class={' '.join(s.get('class',[]))} text={s.get_text(strip=True)}")
