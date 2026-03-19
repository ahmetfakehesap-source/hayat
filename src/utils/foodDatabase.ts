// Food Database Utility - Diyetkolik (1600+ Turkish foods with serving sizes)

import { DIYETKOLIK_FOODS, DIYETKOLIK_SERVINGS } from '../data/diyetkolikFoods';
import type { ServingTuple } from '../data/diyetkolikFoods';
import type { RecentFoodEntry } from '../types';

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

// Lazy-loaded cache for base foods
let _baseCache: FoodItem[] | null = null;

export function getDefaultFoods(): FoodItem[] {
    if (!_baseCache) {
        _baseCache = DIYETKOLIK_FOODS.map(([name, calories, protein, carbs, fat], index) => {
            const servingTuples: ServingTuple[] = DIYETKOLIK_SERVINGS[index] || [];
            const servings: Serving[] = servingTuples.map(([sname, gram]) => ({ name: sname, gram }));
            
            // Always add 100g option if not present
            if (!servings.some(s => s.name === '100 Gram' || (s.name === 'Gram' && s.gram === 100))) {
                servings.unshift({ name: '100 Gram', gram: 100 });
            }
            
            return { name, calories, protein, carbs, fat, servings, _index: index };
        });
    }
    return _baseCache;
}

export function getCombinedFoods(customFoods: FoodItem[] = []): FoodItem[] {
    return [...customFoods, ...getDefaultFoods()];
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
export function searchLocalFoods(query: string, customFoods: FoodItem[] = []): FoodItem[] {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase().trim();
    const all = getCombinedFoods(customFoods);
    return all.filter(f => f.name.toLowerCase().includes(q)).slice(0, 12);
}

// ============================================
// Recent & Frequent Foods (Pure Functions)
// ============================================

export function recordFoodInteraction(entries: RecentFoodEntry[], foodIndex: number): RecentFoodEntry[] {
    const newEntries = [...entries];
    const existing = newEntries.find(e => e.foodIndex === foodIndex);
    
    if (existing) {
        existing.count += 1;
        existing.lastUsed = Date.now();
    } else {
        newEntries.push({
            foodIndex,
            count: 1,
            lastUsed: Date.now()
        });
    }
    
    // Keep max 100 tracking entries
    if (newEntries.length > 100) {
        newEntries.sort((a, b) => b.lastUsed - a.lastUsed);
        newEntries.length = 100;
    }
    return newEntries;
}

export function getRecentFoodsList(entries: RecentFoodEntry[], customFoods: FoodItem[], limit: number = 5): FoodItem[] {
    const sorted = [...entries].sort((a, b) => b.lastUsed - a.lastUsed).slice(0, limit);
    const all = getCombinedFoods(customFoods);
    return sorted.map(e => all.find(f => f._index === e.foodIndex)).filter(Boolean) as FoodItem[];
}

export function getFrequentFoodsList(entries: RecentFoodEntry[], customFoods: FoodItem[], limit: number = 5): FoodItem[] {
    // Sort by count descending, then by lastUsed
    const sorted = [...entries].sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return b.lastUsed - a.lastUsed;
    }).slice(0, limit);
    
    const all = getCombinedFoods(customFoods);
    return sorted.map(e => all.find(f => f._index === e.foodIndex)).filter(Boolean) as FoodItem[];
}
