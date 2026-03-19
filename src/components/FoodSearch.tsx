import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { FoodItem, Serving } from '../utils/foodDatabase';
import { searchLocalFoods, calcServingMacros } from '../utils/foodDatabase';
import './FoodSearch.css';

interface FoodSearchProps {
    onSelect: (food: FoodItem, serving: Serving, macros: { calories: number; protein: number; carbs: number; fat: number; gram: number }) => void;
}

const FoodSearch: React.FC<FoodSearchProps> = ({ onSelect }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<FoodItem[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
    const [selectedServing, setSelectedServing] = useState<Serving | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSearch = useCallback((value: string) => {
        setQuery(value);
        setSelectedFood(null);
        setSelectedServing(null);
        if (value.length < 2) {
            setResults([]);
            setShowResults(false);
            return;
        }
        const found = searchLocalFoods(value);
        setResults(found);
        setShowResults(true);
    }, []);

    const handleFoodClick = (food: FoodItem) => {
        setSelectedFood(food);
        setQuery(food.name);
        setShowResults(false);
        // Auto-select first serving (usually "100 Gram" or "Adet (Orta)")
        const defaultServing = food.servings[0] || { name: '100 Gram', gram: 100 };
        setSelectedServing(defaultServing);
    };

    const handleServingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (!selectedFood) return;
        const idx = parseInt(e.target.value);
        setSelectedServing(selectedFood.servings[idx]);
    };

    const handleConfirm = () => {
        if (!selectedFood || !selectedServing) return;
        const macros = calcServingMacros(selectedFood, selectedServing);
        onSelect(selectedFood, selectedServing, macros);
        // Reset
        setSelectedFood(null);
        setSelectedServing(null);
        setQuery('');
    };

    const currentMacros = selectedFood && selectedServing
        ? calcServingMacros(selectedFood, selectedServing)
        : null;

    return (
        <div className="food-search" ref={containerRef}>
            <div className="food-search-bar">
                <div className="food-search-input-wrap">
                    <span className="food-search-icon">🔍</span>
                    <input
                        type="text"
                        className="food-search-input"
                        placeholder="Yemek ara... (örn: yumurta, pilav, döner)"
                        value={query}
                        onChange={(e) => handleSearch(e.target.value)}
                        onFocus={() => results.length > 0 && !selectedFood && setShowResults(true)}
                    />
                </div>
            </div>

            {/* Search Results Dropdown */}
            {showResults && results.length > 0 && (
                <div className="food-search-results">
                    {results.map((food, i) => (
                        <button
                            key={`${food.name}-${i}`}
                            className="food-result-item"
                            onClick={() => handleFoodClick(food)}
                        >
                            <div className="food-result-left">
                                <span className="food-result-badge">🍽️</span>
                                <div className="food-result-info">
                                    <span className="food-result-name">{food.name}</span>
                                    <span className="food-result-serving">
                                        {food.servings.length > 1 
                                            ? `${food.servings.length} porsiyon seçeneği` 
                                            : '100g başına'}
                                    </span>
                                </div>
                            </div>
                            <div className="food-result-nutrition">
                                <span className="food-result-cal">{food.calories} kcal</span>
                                <span className="food-result-per100">/ 100g</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {showResults && query.length >= 2 && results.length === 0 && (
                <div className="food-search-results">
                    <div className="food-result-empty">
                        😕 Sonuç bulunamadı. Manuel olarak girebilirsiniz.
                    </div>
                </div>
            )}

            {/* Serving Size Selector - appears after food selection */}
            {selectedFood && selectedServing && currentMacros && (
                <div className="food-serving-panel">
                    <div className="food-serving-header">
                        <span className="food-serving-name">{selectedFood.name}</span>
                        <button className="food-serving-clear" onClick={() => {
                            setSelectedFood(null);
                            setSelectedServing(null);
                            setQuery('');
                        }}>✕</button>
                    </div>

                    <div className="food-serving-selector">
                        <label>Porsiyon:</label>
                        <select 
                            value={selectedFood.servings.indexOf(selectedServing)}
                            onChange={handleServingChange}
                        >
                            {selectedFood.servings.map((s, i) => (
                                <option key={i} value={i}>
                                    {s.name} ({s.gram}g)
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="food-serving-macros">
                        <div className="macro-box macro-cal">
                            <span className="macro-value">{currentMacros.calories}</span>
                            <span className="macro-label">kcal</span>
                        </div>
                        <div className="macro-box macro-protein">
                            <span className="macro-value">{currentMacros.protein}g</span>
                            <span className="macro-label">Protein</span>
                        </div>
                        <div className="macro-box macro-carb">
                            <span className="macro-value">{currentMacros.carbs}g</span>
                            <span className="macro-label">Karb</span>
                        </div>
                        <div className="macro-box macro-fat">
                            <span className="macro-value">{currentMacros.fat}g</span>
                            <span className="macro-label">Yağ</span>
                        </div>
                    </div>

                    <button className="food-serving-confirm" onClick={handleConfirm}>
                        ✅ Kaydet
                    </button>
                </div>
            )}
        </div>
    );
};

export default FoodSearch;
