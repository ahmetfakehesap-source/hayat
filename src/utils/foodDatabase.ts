// Food Database Utility
// Combines: Built-in common foods + Open Food Facts API + Custom saved products

export interface FoodItem {
    name: string;
    calories: number;  // per 100g or per serving
    protein: number;
    carbs: number;
    fat: number;
    serving?: string;  // e.g. "1 adet (50g)", "100g"
    source: 'builtin' | 'openfoodfacts' | 'custom';
    barcode?: string;
    brand?: string;
    image?: string;
}

// ===== Built-in Common Foods Database =====
const COMMON_FOODS: FoodItem[] = [
    // Kahvaltılık
    { name: 'Yumurta (haşlanmış, 1 adet)', calories: 72, protein: 6.3, carbs: 0.4, fat: 4.8, serving: '1 adet (50g)', source: 'builtin' },
    { name: 'Yumurta (sahanda, 1 adet)', calories: 90, protein: 6.3, carbs: 0.4, fat: 7, serving: '1 adet', source: 'builtin' },
    { name: 'Omlet (2 yumurta)', calories: 180, protein: 13, carbs: 1, fat: 14, serving: '2 yumurta', source: 'builtin' },
    { name: 'Beyaz Peynir (30g)', calories: 80, protein: 5, carbs: 1, fat: 6, serving: '30g', source: 'builtin' },
    { name: 'Kaşar Peyniri (30g)', calories: 110, protein: 7, carbs: 0.5, fat: 9, serving: '30g', source: 'builtin' },
    { name: 'Bal (1 yemek kaşığı)', calories: 64, protein: 0, carbs: 17, fat: 0, serving: '1 yk (21g)', source: 'builtin' },
    { name: 'Zeytin (5 adet)', calories: 25, protein: 0.2, carbs: 1, fat: 2.3, serving: '5 adet', source: 'builtin' },
    { name: 'Domates (1 orta)', calories: 22, protein: 1, carbs: 5, fat: 0.2, serving: '1 adet (120g)', source: 'builtin' },
    { name: 'Salatalık (1 adet)', calories: 15, protein: 0.6, carbs: 3.6, fat: 0.1, serving: '1 adet (100g)', source: 'builtin' },
    { name: 'Ekmek (1 dilim)', calories: 80, protein: 3, carbs: 15, fat: 1, serving: '1 dilim (30g)', source: 'builtin' },
    { name: 'Tam Buğday Ekmek (1 dilim)', calories: 70, protein: 3.5, carbs: 12, fat: 1, serving: '1 dilim (30g)', source: 'builtin' },
    { name: 'Simit', calories: 350, protein: 10, carbs: 60, fat: 8, serving: '1 adet (120g)', source: 'builtin' },
    { name: 'Poğaça', calories: 250, protein: 5, carbs: 30, fat: 12, serving: '1 adet', source: 'builtin' },

    // Tahıllar & Karbonhidratlar
    { name: 'Pilav (1 porsiyon)', calories: 200, protein: 4, carbs: 44, fat: 1, serving: '1 porsiyon (150g)', source: 'builtin' },
    { name: 'Makarna (1 porsiyon)', calories: 220, protein: 8, carbs: 43, fat: 1.3, serving: '1 porsiyon (150g)', source: 'builtin' },
    { name: 'Bulgur Pilavı (1 porsiyon)', calories: 170, protein: 6, carbs: 35, fat: 1.5, serving: '1 porsiyon (150g)', source: 'builtin' },
    { name: 'Yulaf Ezmesi (40g)', calories: 150, protein: 5, carbs: 27, fat: 3, serving: '40g', source: 'builtin' },
    { name: 'Patates (haşlanmış, 1 orta)', calories: 130, protein: 3, carbs: 30, fat: 0.1, serving: '1 adet (150g)', source: 'builtin' },
    { name: 'Patates Kızartması (1 porsiyon)', calories: 320, protein: 4, carbs: 40, fat: 17, serving: '1 porsiyon', source: 'builtin' },

    // Et & Protein
    { name: 'Tavuk Göğsü (ızgara, 100g)', calories: 165, protein: 31, carbs: 0, fat: 3.6, serving: '100g', source: 'builtin' },
    { name: 'Tavuk But (100g)', calories: 210, protein: 26, carbs: 0, fat: 11, serving: '100g', source: 'builtin' },
    { name: 'Köfte (2 adet)', calories: 200, protein: 16, carbs: 5, fat: 13, serving: '2 adet (80g)', source: 'builtin' },
    { name: 'Dana Kıyma (100g)', calories: 250, protein: 20, carbs: 0, fat: 18, serving: '100g', source: 'builtin' },
    { name: 'Balık (ızgara, 100g)', calories: 130, protein: 25, carbs: 0, fat: 3, serving: '100g', source: 'builtin' },
    { name: 'Ton Balığı (konserve, 100g)', calories: 130, protein: 28, carbs: 0, fat: 1.5, serving: '100g', source: 'builtin' },
    { name: 'Sucuk (3 dilim)', calories: 150, protein: 7, carbs: 1, fat: 13, serving: '3 dilim (30g)', source: 'builtin' },
    { name: 'Sosis (2 adet)', calories: 180, protein: 7, carbs: 2, fat: 16, serving: '2 adet', source: 'builtin' },

    // Sebze Yemekleri
    { name: 'Mercimek Çorbası (1 kase)', calories: 140, protein: 9, carbs: 22, fat: 2, serving: '1 kase (250ml)', source: 'builtin' },
    { name: 'Kuru Fasulye (1 porsiyon)', calories: 200, protein: 12, carbs: 30, fat: 4, serving: '1 porsiyon', source: 'builtin' },
    { name: 'Nohut (1 porsiyon)', calories: 180, protein: 10, carbs: 28, fat: 3, serving: '1 porsiyon', source: 'builtin' },
    { name: 'Salata (karışık)', calories: 50, protein: 2, carbs: 8, fat: 1, serving: '1 tabak', source: 'builtin' },
    { name: 'Zeytinyağlı Dolma (3 adet)', calories: 180, protein: 3, carbs: 25, fat: 8, serving: '3 adet', source: 'builtin' },

    // Süt Ürünleri
    { name: 'Süt (1 bardak)', calories: 120, protein: 6, carbs: 9, fat: 6, serving: '200ml', source: 'builtin' },
    { name: 'Yoğurt (1 kase)', calories: 100, protein: 5, carbs: 7, fat: 5, serving: '1 kase (150g)', source: 'builtin' },
    { name: 'Ayran (1 bardak)', calories: 60, protein: 3, carbs: 4, fat: 3, serving: '200ml', source: 'builtin' },

    // Meyveler
    { name: 'Muz (1 adet)', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, serving: '1 adet (120g)', source: 'builtin' },
    { name: 'Elma (1 adet)', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, serving: '1 adet (180g)', source: 'builtin' },
    { name: 'Portakal (1 adet)', calories: 62, protein: 1.2, carbs: 15, fat: 0.2, serving: '1 adet (130g)', source: 'builtin' },
    { name: 'Çilek (1 kase)', calories: 50, protein: 1, carbs: 12, fat: 0.5, serving: '1 kase (150g)', source: 'builtin' },
    { name: 'Karpuz (1 dilim)', calories: 85, protein: 1.7, carbs: 21, fat: 0.4, serving: '1 dilim (280g)', source: 'builtin' },

    // Atıştırmalıklar
    { name: 'Badem (30g)', calories: 170, protein: 6, carbs: 6, fat: 15, serving: '30g (23 adet)', source: 'builtin' },
    { name: 'Ceviz (30g)', calories: 185, protein: 4, carbs: 4, fat: 18, serving: '30g (7 adet)', source: 'builtin' },
    { name: 'Fıstık (30g)', calories: 160, protein: 7, carbs: 5, fat: 14, serving: '30g', source: 'builtin' },
    { name: 'Çikolata (sütlü, 30g)', calories: 160, protein: 2, carbs: 18, fat: 9, serving: '30g', source: 'builtin' },
    { name: 'Bisküvi (3 adet)', calories: 130, protein: 2, carbs: 20, fat: 5, serving: '3 adet', source: 'builtin' },

    // İçecekler
    { name: 'Çay (şekerli)', calories: 30, protein: 0, carbs: 8, fat: 0, serving: '1 bardak', source: 'builtin' },
    { name: 'Çay (şekersiz)', calories: 2, protein: 0, carbs: 0, fat: 0, serving: '1 bardak', source: 'builtin' },
    { name: 'Türk Kahvesi', calories: 5, protein: 0.3, carbs: 0.7, fat: 0, serving: '1 fincan', source: 'builtin' },
    { name: 'Latte (sütle)', calories: 190, protein: 10, carbs: 15, fat: 9, serving: '350ml', source: 'builtin' },
    { name: 'Kola (1 kutu)', calories: 140, protein: 0, carbs: 39, fat: 0, serving: '330ml', source: 'builtin' },
    { name: 'Meyve Suyu (1 bardak)', calories: 110, protein: 0.5, carbs: 27, fat: 0, serving: '200ml', source: 'builtin' },
    { name: 'Su', calories: 0, protein: 0, carbs: 0, fat: 0, serving: '1 bardak', source: 'builtin' },

    // Fast Food
    { name: 'Hamburger', calories: 350, protein: 17, carbs: 30, fat: 18, serving: '1 adet', source: 'builtin' },
    { name: 'Döner (yarım)', calories: 400, protein: 25, carbs: 35, fat: 18, serving: '1 yarım', source: 'builtin' },
    { name: 'Döner (tam)', calories: 700, protein: 40, carbs: 60, fat: 32, serving: '1 tam', source: 'builtin' },
    { name: 'Lahmacun', calories: 250, protein: 12, carbs: 35, fat: 7, serving: '1 adet', source: 'builtin' },
    { name: 'Pizza (1 dilim)', calories: 270, protein: 12, carbs: 33, fat: 10, serving: '1 dilim', source: 'builtin' },
    { name: 'Pide (kıymalı)', calories: 450, protein: 22, carbs: 50, fat: 18, serving: '1 porsiyon', source: 'builtin' },
    { name: 'Tost (kaşarlı)', calories: 300, protein: 12, carbs: 30, fat: 15, serving: '1 adet', source: 'builtin' },
];

// ===== Custom Products (localStorage) =====
const CUSTOM_PRODUCTS_KEY = 'lifeos_custom_foods';

export function getCustomFoods(): FoodItem[] {
    try {
        const data = localStorage.getItem(CUSTOM_PRODUCTS_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

export function saveCustomFood(food: FoodItem): void {
    const foods = getCustomFoods();
    foods.push({ ...food, source: 'custom' });
    localStorage.setItem(CUSTOM_PRODUCTS_KEY, JSON.stringify(foods));
}

export function deleteCustomFood(name: string): void {
    const foods = getCustomFoods().filter(f => f.name !== name);
    localStorage.setItem(CUSTOM_PRODUCTS_KEY, JSON.stringify(foods));
}

// ===== Search Functions =====

// Search built-in + custom foods locally (instant, no network)
export function searchLocalFoods(query: string): FoodItem[] {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase().trim();

    const allLocal = [...COMMON_FOODS, ...getCustomFoods()];

    return allLocal
        .filter(food =>
            food.name.toLowerCase().includes(q) ||
            (food.brand && food.brand.toLowerCase().includes(q))
        )
        .slice(0, 10);
}

// Search Open Food Facts API
export async function searchOpenFoodFacts(query: string): Promise<FoodItem[]> {
    if (!query || query.length < 3) return [];

    try {
        const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=8&fields=product_name,nutriments,code,brands,image_front_small_url`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.products) return [];

        return data.products
            .filter((p: any) => p.product_name && p.nutriments?.['energy-kcal_100g'])
            .map((p: any): FoodItem => ({
                name: p.product_name,
                calories: Math.round(p.nutriments['energy-kcal_100g'] || 0),
                protein: Math.round((p.nutriments.proteins_100g || 0) * 10) / 10,
                carbs: Math.round((p.nutriments.carbohydrates_100g || 0) * 10) / 10,
                fat: Math.round((p.nutriments.fat_100g || 0) * 10) / 10,
                serving: '100g',
                source: 'openfoodfacts',
                barcode: p.code,
                brand: p.brands || undefined,
                image: p.image_front_small_url || undefined,
            }))
            .slice(0, 8);
    } catch (error) {
        console.error('Open Food Facts search error:', error);
        return [];
    }
}

// Lookup barcode from Open Food Facts
export async function lookupBarcode(barcode: string): Promise<FoodItem | null> {
    // First check custom foods
    const custom = getCustomFoods().find(f => f.barcode === barcode);
    if (custom) return custom;

    try {
        const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,nutriments,brands,image_front_small_url`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== 1 || !data.product) return null;

        const p = data.product;
        if (!p.product_name) return null;

        return {
            name: p.product_name,
            calories: Math.round(p.nutriments?.['energy-kcal_100g'] || p.nutriments?.['energy-kcal'] || 0),
            protein: Math.round((p.nutriments?.proteins_100g || 0) * 10) / 10,
            carbs: Math.round((p.nutriments?.carbohydrates_100g || 0) * 10) / 10,
            fat: Math.round((p.nutriments?.fat_100g || 0) * 10) / 10,
            serving: '100g',
            source: 'openfoodfacts',
            barcode: barcode,
            brand: p.brands || undefined,
            image: p.image_front_small_url || undefined,
        };
    } catch (error) {
        console.error('Barcode lookup error:', error);
        return null;
    }
}

// Combined search: local first, then API
export async function searchAllFoods(query: string): Promise<FoodItem[]> {
    const local = searchLocalFoods(query);

    // Start API search in parallel
    const apiResults = await searchOpenFoodFacts(query);

    // Combine: local first, then API results (deduplicated)
    const localNames = new Set(local.map(f => f.name.toLowerCase()));
    const filtered = apiResults.filter(f => !localNames.has(f.name.toLowerCase()));

    return [...local, ...filtered].slice(0, 15);
}
