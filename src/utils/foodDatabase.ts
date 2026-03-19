// Food Database Utility
// Combines: Diyetkolik (1600+ Turkish foods) + Open Food Facts API + Custom saved products

import { DIYETKOLIK_FOODS } from '../data/diyetkolikFoods';

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

// ===== Convert Diyetkolik data to FoodItem array (lazy, cached) =====
let _diyetkolikCache: FoodItem[] | null = null;

function getDiyetkolikFoods(): FoodItem[] {
    if (!_diyetkolikCache) {
        _diyetkolikCache = DIYETKOLIK_FOODS.map(([name, calories, protein, carbs, fat]) => ({
            name,
            calories,
            protein,
            carbs,
            fat,
            serving: '100g',
            source: 'builtin' as const,
        }));
    }
    return _diyetkolikCache;
}

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

// Search Diyetkolik + custom foods locally (instant, no network)
export function searchLocalFoods(query: string): FoodItem[] {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase().trim();

    // Search custom foods first (they should appear on top)
    const customResults = getCustomFoods().filter(food =>
        food.name.toLowerCase().includes(q)
    );

    // Search Diyetkolik foods
    const diyetkolikResults = getDiyetkolikFoods().filter(food =>
        food.name.toLowerCase().includes(q)
    );

    return [...customResults, ...diyetkolikResults].slice(0, 12);
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
