"""Convert diyetkolik_foods.json to TypeScript data file"""
import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
input_file = os.path.join(script_dir, "diyetkolik_foods.json")
output_file = os.path.join(script_dir, "..", "src", "data", "diyetkolikFoods.ts")

# Ensure output directory exists
os.makedirs(os.path.dirname(output_file), exist_ok=True)

# Load JSON
with open(input_file, 'r', encoding='utf-8') as f:
    foods = json.load(f)

# Filter: only items with calories > 0
valid = [f for f in foods if f['calories'] > 0]

print(f"Total: {len(foods)}, Valid (with calories): {len(valid)}")

# Generate TypeScript
lines = [
    "// Auto-generated from Diyetkolik.com scrape",
    f"// Total: {len(valid)} foods",
    "// Format: [name, calories, protein, carbs, fat] (per 100g)",
    "",
    "export const DIYETKOLIK_FOODS: [string, number, number, number, number][] = [",
]

for f in valid:
    name = f['name'].replace("'", "\\'").replace('"', '\\"')
    lines.append(f'  ["{name}", {f["calories"]}, {f["protein"]}, {f["carbs"]}, {f["fat"]}],')

lines.append("];")

with open(output_file, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines) + '\n')

print(f"Written to: {output_file}")
print(f"Sample entries:")
for f in valid[:5]:
    print(f"  {f['name']}: {f['calories']}kcal P:{f['protein']}g K:{f['carbs']}g Y:{f['fat']}g")
