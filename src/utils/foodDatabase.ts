// Food Database Utility - Diyetkolik (1600+ Turkish foods)

import { DIYETKOLIK_FOODS } from '../data/diyetkolikFoods';

export interface FoodItem {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    serving?: string;
}

// Lazy-loaded cache
let _cache: FoodItem[] | null = null;

function getAllFoods(): FoodItem[] {
    if (!_cache) {
        _cache = DIYETKOLIK_FOODS.map(([name, calories, protein, carbs, fat]) => ({
            name, calories, protein, carbs, fat, serving: '100g',
        }));
    }
    return _cache;
}

// Search foods locally (instant, no network)
export function searchLocalFoods(query: string): FoodItem[] {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase().trim();
    return getAllFoods().filter(f => f.name.toLowerCase().includes(q)).slice(0, 12);
}
