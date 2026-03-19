import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { FoodItem } from '../utils/foodDatabase';
import { searchLocalFoods, searchOpenFoodFacts, lookupBarcode, saveCustomFood } from '../utils/foodDatabase';
import './FoodSearch.css';

interface FoodSearchProps {
    onSelect: (food: FoodItem) => void;
}

const FoodSearch: React.FC<FoodSearchProps> = ({ onSelect }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<FoodItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'found' | 'not-found'>('idle');
    const [scannedFood, setScannedFood] = useState<FoodItem | null>(null);
    const [scannedBarcode, setScannedBarcode] = useState('');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const scannerRef = useRef<any>(null);

    // Close results on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search
    const handleSearch = useCallback((value: string) => {
        setQuery(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (value.length < 2) {
            setResults([]);
            setShowResults(false);
            return;
        }

        // Show local results immediately
        const local = searchLocalFoods(value);
        setResults(local);
        setShowResults(true);

        // Debounce API search
        debounceRef.current = setTimeout(async () => {
            if (value.length >= 3) {
                setLoading(true);
                try {
                    const apiResults = await searchOpenFoodFacts(value);
                    const localNames = new Set(local.map(f => f.name.toLowerCase()));
                    const filtered = apiResults.filter(f => !localNames.has(f.name.toLowerCase()));
                    setResults([...local, ...filtered].slice(0, 15));
                } catch (e) {
                    // Keep local results on API error
                }
                setLoading(false);
            }
        }, 500);
    }, []);

    const handleSelectFood = (food: FoodItem) => {
        onSelect(food);
        setQuery(food.name);
        setShowResults(false);
    };

    // Barcode Scanner
    const startScanner = async () => {
        setShowScanner(true);
        setScanStatus('scanning');
        setScannedFood(null);
        setScannedBarcode('');

        // Dynamic import to avoid SSR issues
        const { Html5Qrcode } = await import('html5-qrcode');

        // Small delay to let the DOM render
        setTimeout(async () => {
            try {
                const scanner = new Html5Qrcode('barcode-reader');
                scannerRef.current = scanner;

                await scanner.start(
                    { facingMode: 'environment' },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 150 },
                    },
                    async (decodedText) => {
                        // Barcode found!
                        try {
                            await scanner.stop();
                        } catch (e) { /* ignore */ }
                        scannerRef.current = null;

                        setScannedBarcode(decodedText);
                        setScanStatus('idle');

                        // Look up the barcode
                        setLoading(true);
                        const food = await lookupBarcode(decodedText);
                        setLoading(false);

                        if (food) {
                            setScanStatus('found');
                            setScannedFood(food);
                        } else {
                            setScanStatus('not-found');
                        }
                    },
                    () => { /* ignore scan errors */ }
                );
            } catch (error) {
                console.error('Scanner error:', error);
                setScanStatus('not-found');
            }
        }, 300);
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
            } catch (e) { /* ignore */ }
            scannerRef.current = null;
        }
        setShowScanner(false);
        setScanStatus('idle');
    };

    const handleSaveCustom = (food: FoodItem) => {
        saveCustomFood(food);
        onSelect(food);
        stopScanner();
    };

    // Custom food form for barcode not found
    const [customName, setCustomName] = useState('');
    const [customCalories, setCustomCalories] = useState('');
    const [customProtein, setCustomProtein] = useState('');
    const [customCarbs, setCustomCarbs] = useState('');
    const [customFat, setCustomFat] = useState('');

    const handleSaveCustomForm = () => {
        if (!customName || !customCalories) return;
        const food: FoodItem = {
            name: customName,
            calories: Number(customCalories),
            protein: Number(customProtein) || 0,
            carbs: Number(customCarbs) || 0,
            fat: Number(customFat) || 0,
            barcode: scannedBarcode,
            source: 'custom',
        };
        handleSaveCustom(food);
        setCustomName('');
        setCustomCalories('');
        setCustomProtein('');
        setCustomCarbs('');
        setCustomFat('');
    };

    const getSourceBadge = (source: FoodItem['source']) => {
        switch (source) {
            case 'builtin': return '📋';
            case 'openfoodfacts': return '🌐';
            case 'custom': return '⭐';
        }
    };

    return (
        <div className="food-search" ref={searchContainerRef}>
            {/* Search Bar */}
            <div className="food-search-bar">
                <div className="food-search-input-wrap">
                    <span className="food-search-icon">🔍</span>
                    <input
                        type="text"
                        className="food-search-input"
                        placeholder="Yemek ara... (örn: yumurta, pilav, muz)"
                        value={query}
                        onChange={(e) => handleSearch(e.target.value)}
                        onFocus={() => results.length > 0 && setShowResults(true)}
                    />
                    {loading && <span className="food-search-spinner">⏳</span>}
                </div>
                <button className="food-scan-btn" onClick={startScanner} title="Barkod Tara">
                    📷
                </button>
            </div>

            {/* Search Results Dropdown */}
            {showResults && results.length > 0 && (
                <div className="food-search-results">
                    {results.map((food, i) => (
                        <button
                            key={`${food.name}-${i}`}
                            className="food-result-item"
                            onClick={() => handleSelectFood(food)}
                        >
                            <div className="food-result-left">
                                <span className="food-result-badge">{getSourceBadge(food.source)}</span>
                                <div className="food-result-info">
                                    <span className="food-result-name">
                                        {food.brand ? `${food.brand} - ` : ''}{food.name}
                                    </span>
                                    {food.serving && (
                                        <span className="food-result-serving">{food.serving}</span>
                                    )}
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
                    {loading && (
                        <div className="food-result-loading">
                            🌐 Online veritabanında aranıyor...
                        </div>
                    )}
                </div>
            )}

            {showResults && query.length >= 2 && results.length === 0 && !loading && (
                <div className="food-search-results">
                    <div className="food-result-empty">
                        😕 Sonuç bulunamadı. Manuel olarak girebilirsiniz.
                    </div>
                </div>
            )}

            {/* Barcode Scanner Modal */}
            {showScanner && (
                <div className="scanner-overlay" onClick={stopScanner}>
                    <div className="scanner-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="scanner-header">
                            <h3>📷 Barkod Tara</h3>
                            <button className="scanner-close" onClick={stopScanner}>✕</button>
                        </div>

                        {scanStatus === 'scanning' && (
                            <>
                                <div id="barcode-reader" className="scanner-viewport"></div>
                                <p className="scanner-hint">📱 Ürünün barkodunu kameraya gösterin</p>
                            </>
                        )}

                        {loading && (
                            <div className="scanner-loading">
                                <span className="scanner-spinner">⏳</span>
                                <p>Ürün bilgileri aranıyor...</p>
                            </div>
                        )}

                        {scanStatus === 'found' && scannedFood && (
                            <div className="scanner-found">
                                <div className="scanner-found-header">
                                    <span className="scanner-found-icon">✅</span>
                                    <h4>Ürün Bulundu!</h4>
                                </div>
                                <div className="scanner-product-card">
                                    {scannedFood.image && (
                                        <img src={scannedFood.image} alt={scannedFood.name} className="scanner-product-img" />
                                    )}
                                    <div className="scanner-product-info">
                                        <div className="scanner-product-name">
                                            {scannedFood.brand && <span className="scanner-brand">{scannedFood.brand}</span>}
                                            {scannedFood.name}
                                        </div>
                                        <div className="scanner-product-nutrition">
                                            <span className="scanner-cal">🔥 {scannedFood.calories} kcal</span>
                                            <div className="scanner-macros">
                                                <span>🥩 P: {scannedFood.protein}g</span>
                                                <span>🍞 K: {scannedFood.carbs}g</span>
                                                <span>🧈 Y: {scannedFood.fat}g</span>
                                            </div>
                                            <span className="scanner-per">100g başına</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="scanner-actions">
                                    <button className="scanner-use-btn" onClick={() => { onSelect(scannedFood); stopScanner(); }}>
                                        ✅ Bu Ürünü Kullan
                                    </button>
                                    <button className="scanner-save-btn" onClick={() => handleSaveCustom(scannedFood)}>
                                        ⭐ Kaydet & Kullan
                                    </button>
                                </div>
                            </div>
                        )}

                        {scanStatus === 'not-found' && (
                            <div className="scanner-not-found">
                                <div className="scanner-not-found-header">
                                    <span className="scanner-not-found-icon">😕</span>
                                    <h4>Ürün Veritabanında Bulunamadı</h4>
                                    {scannedBarcode && <p className="scanner-barcode-text">Barkod: {scannedBarcode}</p>}
                                </div>
                                <p className="scanner-not-found-hint">Bilgileri kendin gir, bir daha taradığında otomatik gelsin!</p>
                                <div className="scanner-custom-form">
                                    <input type="text" placeholder="Ürün adı *" value={customName}
                                        onChange={(e) => setCustomName(e.target.value)} className="scanner-input" />
                                    <div className="scanner-input-row">
                                        <input type="number" placeholder="Kalori *" value={customCalories}
                                            onChange={(e) => setCustomCalories(e.target.value)} className="scanner-input" />
                                        <input type="number" placeholder="Protein (g)" value={customProtein}
                                            onChange={(e) => setCustomProtein(e.target.value)} className="scanner-input" />
                                    </div>
                                    <div className="scanner-input-row">
                                        <input type="number" placeholder="Karb (g)" value={customCarbs}
                                            onChange={(e) => setCustomCarbs(e.target.value)} className="scanner-input" />
                                        <input type="number" placeholder="Yağ (g)" value={customFat}
                                            onChange={(e) => setCustomFat(e.target.value)} className="scanner-input" />
                                    </div>
                                    <button className="scanner-save-custom-btn" onClick={handleSaveCustomForm}
                                        disabled={!customName || !customCalories}>
                                        💾 Kaydet & Kullan
                                    </button>
                                </div>
                                <div className="scanner-alt-actions">
                                    <button className="scanner-retry-btn" onClick={() => { setScanStatus('idle'); startScanner(); }}>
                                        🔄 Tekrar Tara
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FoodSearch;
