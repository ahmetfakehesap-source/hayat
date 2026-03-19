import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { FoodItem, Serving } from '../utils/foodDatabase';
import { searchLocalFoods, calcServingMacros, getRecentFoodsList, getFrequentFoodsList } from '../utils/foodDatabase';
import type { RecentFoodEntry } from '../types';
import './FoodSearch.css';

interface FoodSearchProps {
    onSelect: (food: FoodItem, serving: Serving, macros: { calories: number; protein: number; carbs: number; fat: number; gram: number }) => void;
    customFoods: FoodItem[];
    recentFoodEntries: RecentFoodEntry[];
    onAddRecent: (foodIndex: number) => void;
}

const FoodSearch: React.FC<FoodSearchProps> = ({ onSelect, customFoods, recentFoodEntries, onAddRecent }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<FoodItem[]>([]);
    const [recentFoods, setRecentFoods] = useState<FoodItem[]>([]);
    const [frequentFoods, setFrequentFoods] = useState<FoodItem[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
    const [selectedServing, setSelectedServing] = useState<Serving | null>(null);
    const [quantity, setQuantity] = useState<number | string>(1);
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

    const loadHistory = () => {
        setRecentFoods(getRecentFoodsList(recentFoodEntries, customFoods, 5));
        setFrequentFoods(getFrequentFoodsList(recentFoodEntries, customFoods, 5));
    };

    const handleFocus = () => {
        if (!selectedFood) {
            loadHistory();
            setShowResults(true);
        }
    };

    const handleSearch = useCallback((value: string) => {
        setQuery(value);
        setSelectedFood(null);
        setSelectedServing(null);
        setQuantity(1);
        if (value.trim().length < 2) {
            setResults([]);
            return;
        }
        const found = searchLocalFoods(value, customFoods);
        setResults(found);
    }, [customFoods]);

    const handleFoodClick = (food: FoodItem) => {
        setSelectedFood(food);
        setQuery(food.name);
        setShowResults(false);
        // Auto-select first serving (usually "100 Gram" or "Adet (Orta)")
        const defaultServing = food.servings[0] || { name: '100 Gram', gram: 100 };
        setSelectedServing(defaultServing);
        setQuantity(1);
    };

    const handleServingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (!selectedFood) return;
        const idx = parseInt(e.target.value);
        setSelectedServing(selectedFood.servings[idx]);
    };

    const handleConfirm = () => {
        if (!selectedFood || !selectedServing) return;
        const numQty = typeof quantity === 'string' ? parseFloat(quantity) || 1 : quantity;
        const baseMacros = calcServingMacros(selectedFood, selectedServing);
        const macros = {
            calories: Math.round(baseMacros.calories * numQty),
            protein: Math.round(baseMacros.protein * numQty * 10) / 10,
            carbs: Math.round(baseMacros.carbs * numQty * 10) / 10,
            fat: Math.round(baseMacros.fat * numQty * 10) / 10,
            gram: Math.round(baseMacros.gram * numQty)
        };
        onAddRecent(selectedFood._index); // Save to history via parent
        onSelect(selectedFood, { ...selectedServing, name: numQty === 1 ? selectedServing.name : `${numQty}x ${selectedServing.name}` }, macros);
        // Reset
        setSelectedFood(null);
        setSelectedServing(null);
        setQuantity(1);
        setQuery('');
    };

    const currentMacros = selectedFood && selectedServing
        ? (() => {
            const numQty = typeof quantity === 'string' ? parseFloat(quantity) || 1 : quantity;
            const base = calcServingMacros(selectedFood, selectedServing);
            return {
                calories: Math.round(base.calories * numQty),
                protein: Math.round(base.protein * numQty * 10) / 10,
                carbs: Math.round(base.carbs * numQty * 10) / 10,
                fat: Math.round(base.fat * numQty * 10) / 10,
                gram: Math.round(base.gram * numQty)
            };
        })()
        : null;

    const renderFoodItem = (food: FoodItem, i: number, prefix: string = '') => (
        <button
            key={`${prefix}-${food.name}-${i}`}
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
    );

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
                        onFocus={handleFocus}
                    />
                </div>
            </div>

            {/* Search Results Dropdown */}
            {showResults && (
                <div className="food-search-results">
                    {query.trim().length >= 2 ? (
                        /* Standard Search Results */
                        results.length > 0 ? (
                            results.map((food, i) => renderFoodItem(food, i, 'search'))
                        ) : (
                            <div className="food-result-empty">
                                😕 Sonuç bulunamadı. Manuel olarak girebilirsiniz.
                            </div>
                        )
                    ) : (
                        /* History / Favorites View */
                        <div className="food-history-view">
                            {frequentFoods.length > 0 && (
                                <div className="food-history-section">
                                    <div className="food-history-header">⭐ Sık Kullananlar</div>
                                    {frequentFoods.map((f, i) => renderFoodItem(f, i, 'freq'))}
                                </div>
                            )}
                            {recentFoods.length > 0 && (
                                <div className="food-history-section">
                                    <div className="food-history-header">🕒 Son Kullanılanlar</div>
                                    {recentFoods.filter(f => !frequentFoods.find(ff => ff._index === f._index)).slice(0, 5).map((f, i) => renderFoodItem(f, i, 'rec'))}
                                </div>
                            )}
                            {frequentFoods.length === 0 && recentFoods.length === 0 && (
                                <div className="food-result-empty">
                                    Arama yapmak için yazmaya başlayın.
                                </div>
                            )}
                        </div>
                    )}
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
                        <label>Miktar (x):</label>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                            <input 
                                type="number" 
                                min="0.1" 
                                step="any" 
                                value={quantity} 
                                onChange={(e) => setQuantity(e.target.value)}
                                onFocus={(e) => e.target.select()}
                                style={{ 
                                    width: '70px', 
                                    padding: '0.5rem', 
                                    borderRadius: 'var(--border-radius)', 
                                    border: '1px solid var(--border-color)', 
                                    background: 'var(--bg-primary)', 
                                    color: 'var(--text-primary)',
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    textAlign: 'center'
                                }}
                            />
                            <select 
                                value={selectedFood.servings.indexOf(selectedServing)}
                                onChange={handleServingChange}
                                style={{ flex: 1 }}
                            >
                                {selectedFood.servings.map((s, i) => (
                                    <option key={i} value={i}>
                                        {s.name} ({s.gram}g)
                                    </option>
                                ))}
                            </select>
                        </div>
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
                        ➕ Kaydet + (Listeye Ekle)
                    </button>
                </div>
            )}
        </div>
    );
};

export default FoodSearch;
