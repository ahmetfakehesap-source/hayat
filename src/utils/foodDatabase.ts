// Food Database Utility - Diyetkolik (1600+ Turkish foods with serving sizes)

import { DIYETKOLIK_FOODS, DIYETKOLIK_SERVINGS } from '../data/diyetkolikFoods';
import type { ServingTuple } from '../data/diyetkolikFoods';

export interface Serving {
    name: string;
    gram: number;
}

export interface FoodItem {
    name: string;
    calories: number;   // per 100g
    protein: number;
    carbs: number;
    fat: number;
    servings: Serving[]; // available portion sizes
    _index: number;      // internal index for serving lookup
}

// Lazy-loaded cache
let _cache: FoodItem[] | null = null;

function getAllFoods(): FoodItem[] {
    if (!_cache) {
        _cache = DIYETKOLIK_FOODS.map(([name, calories, protein, carbs, fat], index) => {
            const servingTuples: ServingTuple[] = DIYETKOLIK_SERVINGS[index] || [];
            const servings: Serving[] = servingTuples.map(([sname, gram]) => ({ name: sname, gram }));
            
            // Always add 100g option if not present
            if (!servings.some(s => s.name === '100 Gram' || (s.name === 'Gram' && s.gram === 100))) {
                servings.unshift({ name: '100 Gram', gram: 100 });
            }
            
            return { name, calories, protein, carbs, fat, servings, _index: index };
        });
    }
    return _cache;
}

// Calculate macros for a specific serving
export function calcServingMacros(food: FoodItem, serving: Serving) {
    const ratio = serving.gram / 100;
    return {
        calories: Math.round(food.calories * ratio),
        protein: Math.round(food.protein * ratio * 10) / 10,
        carbs: Math.round(food.carbs * ratio * 10) / 10,
        fat: Math.round(food.fat * ratio * 10) / 10,
        gram: serving.gram,
    };
}

// Search foods locally (instant)
export function searchLocalFoods(query: string): FoodItem[] {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase().trim();
    return getAllFoods().filter(f => f.name.toLowerCase().includes(q)).slice(0, 12);
}
