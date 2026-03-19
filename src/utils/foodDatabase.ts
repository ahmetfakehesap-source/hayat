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

// ============================================
// Recent & Frequent Foods (localStorage)
// ============================================

interface RecentFoodEntry {
    foodIndex: number;
    count: number;
    lastUsed: number;
}

const RECENT_FOODS_KEY = 'hayat_recent_foods_v2';

function loadRecentEntries(): RecentFoodEntry[] {
    try {
        const data = localStorage.getItem(RECENT_FOODS_KEY);
        if (data) return JSON.parse(data);
    } catch (e) {
        console.error("Failed to load recent foods", e);
    }
    return [];
}

function saveRecentEntries(entries: RecentFoodEntry[]) {
    try {
        localStorage.setItem(RECENT_FOODS_KEY, JSON.stringify(entries));
    } catch (e) {
        console.error("Failed to save recent foods", e);
    }
}

export function addRecentFood(food: FoodItem) {
    const entries = loadRecentEntries();
    const existing = entries.find(e => e.foodIndex === food._index);
    
    if (existing) {
        existing.count += 1;
        existing.lastUsed = Date.now();
    } else {
        entries.push({
            foodIndex: food._index,
            count: 1,
            lastUsed: Date.now()
        });
    }
    
    // Keep max 100 tracking entries
    if (entries.length > 100) {
        entries.sort((a, b) => b.lastUsed - a.lastUsed);
        entries.length = 100;
    }
    saveRecentEntries(entries);
}

export function getRecentFoods(limit: number = 5): FoodItem[] {
    const entries = loadRecentEntries();
    const sorted = [...entries].sort((a, b) => b.lastUsed - a.lastUsed).slice(0, limit);
    const all = getAllFoods();
    return sorted.map(e => all[e.foodIndex]).filter(Boolean);
}

export function getFrequentFoods(limit: number = 5): FoodItem[] {
    const entries = loadRecentEntries();
    // Sort by count descending, then by lastUsed
    const sorted = [...entries].sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return b.lastUsed - a.lastUsed;
    }).slice(0, limit);
    
    const all = getAllFoods();
    return sorted.map(e => all[e.foodIndex]).filter(Boolean);
}
