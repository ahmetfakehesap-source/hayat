"""Convert diyetkolik_foods_v2.json (with servings) to TypeScript data file"""
import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
input_file = os.path.join(script_dir, "diyetkolik_foods_v2.json")
output_file = os.path.join(script_dir, "..", "src", "data", "diyetkolikFoods.ts")

os.makedirs(os.path.dirname(output_file), exist_ok=True)

with open(input_file, 'r', encoding='utf-8') as f:
    foods = json.load(f)

valid = [f for f in foods if f['calories'] > 0]
print(f"Total: {len(foods)}, Valid: {len(valid)}")

with_srv = sum(1 for f in valid if 'servings' in f)
total_srv = sum(len(f.get('servings', [])) for f in valid)
print(f"With servings: {with_srv}, Total serving types: {total_srv}")

lines = [
    "// Auto-generated from Diyetkolik.com scrape",
    f"// Total: {len(valid)} foods, {with_srv} with serving info",
    "",
    "// [name, calories, protein, carbs, fat] per 100g",
    "export type FoodTuple = [string, number, number, number, number];",
    "",
    "// [serving_name, gram_weight]",
    "export type ServingTuple = [string, number];",
    "",
    "// Map from food index to serving options",
    "export const DIYETKOLIK_SERVINGS: Record<number, ServingTuple[]> = {",
]

food_lines = []
serving_entries = []

for i, f in enumerate(valid):
    name = f['name'].replace('"', '\\"')
    food_lines.append(f'  ["{name}", {f["calories"]}, {f["protein"]}, {f["carbs"]}, {f["fat"]}],')
    
    if 'servings' in f and f['servings']:
        parts = []
        for s in f['servings']:
            sname = s['name'].replace('"', '\\"')
            parts.append(f'["{sname}", {s["gram"]}]')
        serving_entries.append(f'  {i}: [{", ".join(parts)}],')

for entry in serving_entries:
    lines.append(entry)

lines.append("};")
lines.append("")
lines.append("export const DIYETKOLIK_FOODS: FoodTuple[] = [")
lines.extend(food_lines)
lines.append("];")

with open(output_file, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines) + '\n')

print(f"Written to: {output_file}")
print(f"Sample:")
for f in valid[:3]:
    print(f"  {f['name']}: {f['calories']}kcal, servings: {[s['name'] for s in f.get('servings', [])]}")
