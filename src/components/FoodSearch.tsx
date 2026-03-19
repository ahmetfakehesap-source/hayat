import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { FoodItem } from '../utils/foodDatabase';
import { searchLocalFoods } from '../utils/foodDatabase';
import './FoodSearch.css';

interface FoodSearchProps {
    onSelect: (food: FoodItem) => void;
}

const FoodSearch: React.FC<FoodSearchProps> = ({ onSelect }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<FoodItem[]>([]);
    const [showResults, setShowResults] = useState(false);
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
        if (value.length < 2) {
            setResults([]);
            setShowResults(false);
            return;
        }
        const found = searchLocalFoods(value);
        setResults(found);
        setShowResults(true);
    }, []);

    const handleSelect = (food: FoodItem) => {
        onSelect(food);
        setQuery(food.name);
        setShowResults(false);
    };

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
                        onFocus={() => results.length > 0 && setShowResults(true)}
                    />
                </div>
            </div>

            {showResults && results.length > 0 && (
                <div className="food-search-results">
                    {results.map((food, i) => (
                        <button
                            key={`${food.name}-${i}`}
                            className="food-result-item"
                            onClick={() => handleSelect(food)}
                        >
                            <div className="food-result-left">
                                <span className="food-result-badge">📋</span>
                                <div className="food-result-info">
                                    <span className="food-result-name">{food.name}</span>
                                    <span className="food-result-serving">100g başına</span>
                                </div>
                            </div>
                            <div className="food-result-nutrition">
                                <span className="food-result-cal">{food.calories} kcal</span>
                                <div className="food-result-macros">
                                    <span className="macro-p">P:{food.protein}g</span>
                                    <span className="macro-c">K:{food.carbs}g</span>
                                    <span className="macro-f">Y:{food.fat}g</span>
                                </div>
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
        </div>
    );
};

export default FoodSearch;
