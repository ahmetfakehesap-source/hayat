import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { generateId, formatDate, getThisWeekDates } from '../utils/storage';
import type { CalorieEntry, WorkoutEntry, BodyMeasurement, Recipe, HealthProduct, DailyScore } from '../types';
import './Health.css';

const Health: React.FC = () => {
    const { data, updateData, settings, updateSettings } = useApp();
    const [activeTab, setActiveTab] = useState<'calories' | 'workout' | 'recipes' | 'products' | 'settings' | 'history' | 'analytics'>('calories');
    const [showCalorieModal, setShowCalorieModal] = useState(false);
    const [showRecipeModal, setShowRecipeModal] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
    const [editingCalorie, setEditingCalorie] = useState<CalorieEntry | null>(null);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState<'7' | '30' | '90' | 'all'>('30');

    // Inline calorie form state
    const [calMeal, setCalMeal] = useState<CalorieEntry['meal']>('breakfast');
    const [calFood, setCalFood] = useState('');
    const [calCalories, setCalCalories] = useState('');
    const [calProtein, setCalProtein] = useState('');
    const [calCarbs, setCalCarbs] = useState('');
    const [calFat, setCalFat] = useState('');
    const [showCalExpand, setShowCalExpand] = useState(false);

    // Inline workout form state
    const [wkType, setWkType] = useState('');
    const [wkDuration, setWkDuration] = useState('');
    const [wkCalBurned, setWkCalBurned] = useState('');
    const [wkNotes, setWkNotes] = useState('');
    const [showWkExpand, setShowWkExpand] = useState(false);

    // Inline measurement form state
    const [measWeight, setMeasWeight] = useState('');
    const [measBodyFat, setMeasBodyFat] = useState('');
    const [showMeasExpand, setShowMeasExpand] = useState(false);
    const [measChest, setMeasChest] = useState('');
    const [measWaist, setMeasWaist] = useState('');
    const [measHips, setMeasHips] = useState('');
    const [measArms, setMeasArms] = useState('');

    // Inline calorie add
    const handleAddCalorieInline = () => {
        if (!calFood.trim() || !calCalories) return;

        const now = new Date();
        const entry: CalorieEntry = {
            id: generateId(),
            date: now.toISOString().split('T')[0],
            time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
            meal: calMeal,
            food: calFood.trim(),
            calories: Number(calCalories),
            protein: Number(calProtein) || 0,
            carbs: Number(calCarbs) || 0,
            fat: Number(calFat) || 0,
        };

        updateData({ calorieEntries: [...data.calorieEntries, entry] });
        setCalFood('');
        setCalCalories('');
        setCalProtein('');
        setCalCarbs('');
        setCalFat('');
        setShowCalExpand(false);
    };

    // Edit calorie (modal)
    const handleEditCalorie = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingCalorie) return;
        const formData = new FormData(e.currentTarget);

        const entry: CalorieEntry = {
            ...editingCalorie,
            date: formData.get('date') as string,
            meal: formData.get('meal') as CalorieEntry['meal'],
            food: formData.get('food') as string,
            calories: Number(formData.get('calories')),
            protein: Number(formData.get('protein')) || 0,
            carbs: Number(formData.get('carbs')) || 0,
            fat: Number(formData.get('fat')) || 0,
        };

        updateData({ calorieEntries: data.calorieEntries.map(c => c.id === editingCalorie.id ? entry : c) });
        setShowCalorieModal(false);
        setEditingCalorie(null);
    };

    const handleDeleteCalorie = (id: string) => {
        if (confirm('Bu kalori kaydını silmek istediğinize emin misiniz?')) {
            updateData({ calorieEntries: data.calorieEntries.filter((c) => c.id !== id) });
        }
    };

    // Inline workout add
    const handleAddWorkoutInline = () => {
        if (!wkType.trim() || !wkDuration || !wkCalBurned) return;

        const newEntry: WorkoutEntry = {
            id: generateId(),
            date: new Date().toISOString().split('T')[0],
            type: wkType.trim(),
            duration: Number(wkDuration),
            caloriesBurned: Number(wkCalBurned),
            notes: wkNotes || undefined,
        };

        updateData({ workoutEntries: [...data.workoutEntries, newEntry] });
        setWkType('');
        setWkDuration('');
        setWkCalBurned('');
        setWkNotes('');
        setShowWkExpand(false);
    };

    const handleDeleteWorkout = (id: string) => {
        if (confirm('Bu antrenman kaydını silmek istediğinize emin misiniz?')) {
            updateData({ workoutEntries: data.workoutEntries.filter((w) => w.id !== id) });
        }
    };

    // Inline measurement add
    const handleAddMeasurementInline = () => {
        if (!measWeight) return;

        const newEntry: BodyMeasurement = {
            id: generateId(),
            date: new Date().toISOString().split('T')[0],
            weight: Number(measWeight),
            bodyFat: Number(measBodyFat) || undefined,
            measurements: {
                chest: Number(measChest) || undefined,
                waist: Number(measWaist) || undefined,
                hips: Number(measHips) || undefined,
                arms: Number(measArms) || undefined,
            },
        };

        updateData({ bodyMeasurements: [...data.bodyMeasurements, newEntry] });
        setMeasWeight('');
        setMeasBodyFat('');
        setMeasChest('');
        setMeasWaist('');
        setMeasHips('');
        setMeasArms('');
        setShowMeasExpand(false);
    };

    const handleDeleteMeasurement = (id: string) => {
        if (confirm('Bu vücut ölçümünü silmek istediğinize emin misiniz?')) {
            updateData({ bodyMeasurements: data.bodyMeasurements.filter((m) => m.id !== id) });
        }
    };

    const handleSaveSettings = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        updateSettings({
            ...settings,
            dailyCalorieGoal: Number(formData.get('dailyCalorieGoal')),
            dailyProteinGoal: Number(formData.get('dailyProteinGoal')),
            dailyCarbsGoal: Number(formData.get('dailyCarbsGoal')),
            dailyFatGoal: Number(formData.get('dailyFatGoal')),
        });

        setShowSettingsModal(false);
    };

    // Daily Score Calculation
    const calculateProximityScore = (actual: number, goal: number, maxPoints: number): number => {
        if (goal === 0) return maxPoints;
        const ratio = actual / goal;
        // Perfect score if within 90-110% of goal
        if (ratio >= 0.9 && ratio <= 1.1) return maxPoints;
        // Partial score based on proximity
        const distance = Math.abs(1 - ratio);
        const score = Math.max(0, maxPoints * (1 - distance));
        return Math.round(score);
    };

    const calculateDailyScore = (date: string): DailyScore => {
        // Get all entries for this date
        const dayCalories = data.calorieEntries.filter(c => c.date === date);
        const calorieIntake = dayCalories.reduce((sum, c) => sum + c.calories, 0);
        const proteinIntake = dayCalories.reduce((sum, c) => sum + c.protein, 0);
        const carbsIntake = dayCalories.reduce((sum, c) => sum + c.carbs, 0);
        const fatIntake = dayCalories.reduce((sum, c) => sum + c.fat, 0);

        // Nutrition scoring (70 points total)
        const calorieScore = calculateProximityScore(calorieIntake, settings.dailyCalorieGoal, 25);
        const proteinScore = calculateProximityScore(proteinIntake, settings.dailyProteinGoal, 30);
        const carbsScore = calculateProximityScore(carbsIntake, settings.dailyCarbsGoal, 10);
        const fatScore = calculateProximityScore(fatIntake, settings.dailyFatGoal, 5);
        const nutritionScore = calorieScore + proteinScore + carbsScore + fatScore;

        // Workout scoring (30 points)
        const dayOfWeek = new Date(date).getDay();
        const isPlannedWorkoutDay = settings.workoutDays.length > 0 && settings.workoutDays.includes(dayOfWeek);
        const workedOut = data.workoutEntries.some(w => w.date === date);

        let workoutScore = 30; // Default: no specific workout plan
        if (settings.workoutDays.length > 0) {
            // User has planned workout days
            if (isPlannedWorkoutDay) {
                workoutScore = workedOut ? 30 : 0;
            } else {
                // Not a planned workout day, give full points
                workoutScore = 30;
            }
        }

        const totalScore = nutritionScore + workoutScore;

        return {
            date,
            nutritionScore,
            workoutScore,
            totalScore,
            calorieIntake,
            proteinIntake,
            carbsIntake,
            fatIntake,
            workedOut,
        };
    };

    // Get historical daily scores
    const getDailyScores = (): DailyScore[] => {
        const scores: DailyScore[] = [];
        const daysToShow = dateRange === '7' ? 7 : dateRange === '30' ? 30 : dateRange === '90' ? 90 : 365;
        const today = new Date();

        // Get all unique dates that have either calorie or workout entries
        const datesWithData = new Set<string>();
        data.calorieEntries.forEach(entry => datesWithData.add(entry.date));
        data.workoutEntries.forEach(entry => datesWithData.add(entry.date));

        // If no data at all, return empty array
        if (datesWithData.size === 0) {
            return [];
        }

        // Calculate scores only for days with data, limited by date range
        for (let i = 0; i < daysToShow; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            // Only include days that have actual data
            if (datesWithData.has(dateStr)) {
                scores.push(calculateDailyScore(dateStr));
            }
        }

        return scores.reverse(); // Oldest first for charts
    };

    // Recipe handlers
    const handleAddRecipe = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const ingredientsText = formData.get('ingredients') as string;

        const newRecipe: Recipe = {
            id: editingRecipe?.id || generateId(),
            title: formData.get('title') as string,
            ingredients: ingredientsText.split('\n').filter((i) => i.trim()),
            instructions: formData.get('instructions') as string,
            calories: Number(formData.get('calories')),
            prepTime: Number(formData.get('prepTime')) || undefined,
            favorite: editingRecipe?.favorite || false,
            category: formData.get('category') as string || undefined,
        };

        if (editingRecipe) {
            updateData({
                recipes: data.recipes.map((r) => (r.id === editingRecipe.id ? newRecipe : r)),
            });
        } else {
            updateData({ recipes: [...data.recipes, newRecipe] });
        }

        setShowRecipeModal(false);
        setEditingRecipe(null);
        e.currentTarget.reset();
    };

    const handleToggleFavorite = (id: string) => {
        updateData({
            recipes: data.recipes.map((r) => (r.id === id ? { ...r, favorite: !r.favorite } : r)),
        });
    };

    const handleDeleteRecipe = (id: string) => {
        if (confirm('Bu tarifi silmek istediğinize emin misiniz?')) {
            updateData({ recipes: data.recipes.filter((r) => r.id !== id) });
            if (selectedRecipe?.id === id) setSelectedRecipe(null);
        }
    };

    // Product handlers
    const handleAddProduct = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const newProduct: HealthProduct = {
            id: generateId(),
            name: formData.get('name') as string,
            category: formData.get('category') as string,
            location: formData.get('location') as string,
            price: Number(formData.get('price')),
        };

        updateData({ healthProducts: [...data.healthProducts, newProduct] });
        setShowProductModal(false);
        e.currentTarget.reset();
    };

    const handleDeleteProduct = (id: string) => {
        if (confirm('Bu ürünü silmek istediğinize emin misiniz?')) {
            updateData({ healthProducts: data.healthProducts.filter((p) => p.id !== id) });
        }
    };

    // Calculate statistics
    const stats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];

        // Today's calories
        const todayCalories = data.calorieEntries
            .filter((c) => c.date === today)
            .reduce((sum, c) => sum + c.calories, 0);

        const todayProtein = data.calorieEntries
            .filter((c) => c.date === today)
            .reduce((sum, c) => sum + c.protein, 0);

        const todayCarbs = data.calorieEntries
            .filter((c) => c.date === today)
            .reduce((sum, c) => sum + c.carbs, 0);

        const todayFat = data.calorieEntries
            .filter((c) => c.date === today)
            .reduce((sum, c) => sum + c.fat, 0);

        // This week workouts
        const thisWeek = getThisWeekDates();
        const weekWorkouts = data.workoutEntries.filter((w) => thisWeek.includes(w.date));

        // Latest measurement
        const latestMeasurement = data.bodyMeasurements.sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0];

        return {
            todayCalories,
            todayProtein,
            todayCarbs,
            todayFat,
            weekWorkouts: weekWorkouts.length,
            totalWorkoutMinutes: weekWorkouts.reduce((sum, w) => sum + w.duration, 0),
            totalCaloriesBurned: weekWorkouts.reduce((sum, w) => sum + w.caloriesBurned, 0),
            latestWeight: latestMeasurement?.weight,
            favoriteRecipes: data.recipes.filter((r) => r.favorite).length,
        };
    }, [data]);

    const filteredRecipes = data.recipes.filter((r) =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredProducts = data.healthProducts.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="health-page">
            <div className="page-header">
                <h1 className="page-title">💪 Sağlık & Spor</h1>
                <p className="page-subtitle">Kalori, antrenman, tarifler ve sağlıklı ürünler</p>
            </div>

            {/* Stats Overview */}
            <div className="health-stats" style={{ marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div className="stat-box card" style={{ flex: 1 }}>
                        <div className="stat-label">Bugünkü Kalori</div>
                        <div className="stat-value">{stats.todayCalories} / {settings.dailyCalorieGoal}</div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${Math.min((stats.todayCalories / settings.dailyCalorieGoal) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                    <div className="stat-box card" style={{ flex: 1 }}>
                        <div className="stat-label">Bu Hafta Antrenman</div>
                        <div className="stat-value">{stats.weekWorkouts} gün</div>
                        <div className="stat-sublabel">{stats.totalWorkoutMinutes} dakika</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div className="stat-box card" style={{ flex: 1 }}>
                        <div className="stat-label">Yakılan Kalori</div>
                        <div className="stat-value">{stats.totalCaloriesBurned} kcal</div>
                        <div className="stat-sublabel">Bu hafta</div>
                    </div>
                    <div className="stat-box card" style={{ flex: 1 }}>
                        <div className="stat-label">Son Kilo</div>
                        <div className="stat-value">{stats.latestWeight ? `${stats.latestWeight} kg` : '-'}</div>
                        <div className="stat-sublabel">Güncel</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'calories' ? 'active' : ''}`}
                    onClick={() => setActiveTab('calories')}
                >
                    🍽️ Kalori Takibi
                </button>
                <button
                    className={`tab ${activeTab === 'workout' ? 'active' : ''}`}
                    onClick={() => setActiveTab('workout')}
                >
                    🏋️ Antrenman
                </button>
                <button
                    className={`tab ${activeTab === 'recipes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('recipes')}
                >
                    📖 Tarifler ({data.recipes.length})
                </button>
                <button
                    className={`tab ${activeTab === 'products' ? 'active' : ''}`}
                    onClick={() => setActiveTab('products')}
                >
                    🛒 Ürünler ({data.healthProducts.length})
                </button>
                <button
                    className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    ⚙️ Hedefler
                </button>
                <button
                    className={`tab ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    📅 Geçmiş
                </button>
                <button
                    className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
                    onClick={() => setActiveTab('analytics')}
                >
                    📊 Analiz
                </button>
            </div>

            {/* Calorie Tab */}
            {activeTab === 'calories' && (
                <div className="tab-content fade-in">
                    <div className="section-header">
                        <h2>Kalori Takibi</h2>
                    </div>

                    {/* Inline Quick-Add Calorie */}
                    <div className="inline-form">
                        <div className="inline-form-row">
                            <div className="inline-field field-select">
                                <label>Öğün</label>
                                <select value={calMeal} onChange={(e) => setCalMeal(e.target.value as CalorieEntry['meal'])}>
                                    <option value="breakfast">🌅 Kahvaltı</option>
                                    <option value="lunch">🌞 Öğle</option>
                                    <option value="dinner">🌙 Akşam</option>
                                    <option value="snack">🍎 Ara Öğün</option>
                                </select>
                            </div>
                            <div className="inline-field">
                                <label>Yemek/İçecek</label>
                                <input
                                    type="text"
                                    placeholder="Yulaf + Muz..."
                                    value={calFood}
                                    onChange={(e) => setCalFood(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddCalorieInline(); }}
                                />
                            </div>
                            <div className="inline-field field-sm">
                                <label>Kalori</label>
                                <input type="number" placeholder="kcal" value={calCalories} onChange={(e) => setCalCalories(e.target.value)} />
                            </div>
                            <button className="btn-add" onClick={handleAddCalorieInline}>➕ Ekle</button>
                        </div>
                        <button className="expand-toggle" onClick={() => setShowCalExpand(!showCalExpand)}>
                            {showCalExpand ? '▲ Gizle' : '▼ Makrolar'}
                        </button>
                        {showCalExpand && (
                            <div className="expand-area">
                                <div className="inline-form-row">
                                    <div className="inline-field field-sm">
                                        <label>🥩 Protein (g)</label>
                                        <input type="number" placeholder="0" value={calProtein} onChange={(e) => setCalProtein(e.target.value)} />
                                    </div>
                                    <div className="inline-field field-sm">
                                        <label>🍞 Karb (g)</label>
                                        <input type="number" placeholder="0" value={calCarbs} onChange={(e) => setCalCarbs(e.target.value)} />
                                    </div>
                                    <div className="inline-field field-sm">
                                        <label>🧈 Yağ (g)</label>
                                        <input type="number" placeholder="0" value={calFat} onChange={(e) => setCalFat(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Macros */}
                    <div className="macros-grid">
                        <div className="macro-card card">
                            <div className="macro-icon">🥩</div>
                            <div className="macro-label">Protein</div>
                            <div className="macro-value">{stats.todayProtein}g / {settings.dailyProteinGoal}g</div>
                            <div className="macro-progress-bar">
                                <div
                                    className={`macro-progress-fill ${stats.todayProtein >= settings.dailyProteinGoal ? 'goal-met' : ''}`}
                                    style={{ width: `${Math.min((stats.todayProtein / settings.dailyProteinGoal) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                        <div className="macro-card card">
                            <div className="macro-icon">🍞</div>
                            <div className="macro-label">Karbonhidrat</div>
                            <div className="macro-value">{stats.todayCarbs}g / {settings.dailyCarbsGoal}g</div>
                            <div className="macro-progress-bar">
                                <div
                                    className={`macro-progress-fill ${stats.todayCarbs >= settings.dailyCarbsGoal ? 'goal-met' : ''}`}
                                    style={{ width: `${Math.min((stats.todayCarbs / settings.dailyCarbsGoal) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                        <div className="macro-card card">
                            <div className="macro-icon">🥑</div>
                            <div className="macro-label">Yağ</div>
                            <div className="macro-value">{stats.todayFat}g / {settings.dailyFatGoal}g</div>
                            <div className="macro-progress-bar">
                                <div
                                    className={`macro-progress-fill ${stats.todayFat >= settings.dailyFatGoal ? 'goal-met' : ''}`}
                                    style={{ width: `${Math.min((stats.todayFat / settings.dailyFatGoal) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Calorie Entries */}
                    <h3 className="subsection-title">Son Kayıtlar</h3>
                    <div className="entries-list-modern">
                        {data.calorieEntries.length === 0 ? (
                            <div className="empty-state card">
                                <p>🍽️ Henüz kalori kaydı eklenmemiş</p>
                            </div>
                        ) : (
                            data.calorieEntries
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .slice(0, 20)
                                .map((entry) => {
                                    const handleFieldUpdate = (field: keyof CalorieEntry, value: any) => {
                                        const updatedEntry = { ...entry, [field]: value };
                                        updateData({
                                            calorieEntries: data.calorieEntries.map(c =>
                                                c.id === entry.id ? updatedEntry : c
                                            )
                                        });
                                    };

                                    return (
                                        <div key={entry.id} className="entry-card-modern">
                                            <div className="entry-card-header">
                                                <div className="entry-meta">
                                                    <span className="entry-date-modern">{formatDate(entry.date)}</span>
                                                    <span className="entry-time-modern">🕐 {entry.time || '00:00'}</span>
                                                    <span className="entry-meal-badge">
                                                        {entry.meal === 'breakfast' && '🌅 Kahvaltı'}
                                                        {entry.meal === 'lunch' && '🌞 Öğle'}
                                                        {entry.meal === 'dinner' && '🌙 Akşam'}
                                                        {entry.meal === 'snack' && '🍎 Ara Öğün'}
                                                    </span>
                                                </div>
                                                <button
                                                    className="btn-delete-modern"
                                                    onClick={() => handleDeleteCalorie(entry.id)}
                                                    title="Sil"
                                                >
                                                    🗑️
                                                </button>
                                            </div>

                                            <div className="entry-content-row">
                                                <div
                                                    className="entry-food-modern"
                                                    contentEditable
                                                    suppressContentEditableWarning
                                                    onBlur={(e) => handleFieldUpdate('food', e.currentTarget.textContent || '')}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            e.currentTarget.blur();
                                                        }
                                                    }}
                                                >
                                                    {entry.food}
                                                </div>

                                                <div className="entry-macros-modern">
                                                    <div className="macro-editable">
                                                        <span className="macro-icon-modern">🥩</span>
                                                        <input
                                                            type="number"
                                                            className="macro-input"
                                                            value={entry.protein}
                                                            onChange={(e) => handleFieldUpdate('protein', Number(e.target.value))}
                                                            onFocus={(e) => e.target.select()}
                                                        />
                                                        <span className="macro-unit">g</span>
                                                    </div>
                                                    <div className="macro-editable">
                                                        <span className="macro-icon-modern">🍞</span>
                                                        <input
                                                            type="number"
                                                            className="macro-input"
                                                            value={entry.carbs}
                                                            onChange={(e) => handleFieldUpdate('carbs', Number(e.target.value))}
                                                            onFocus={(e) => e.target.select()}
                                                        />
                                                        <span className="macro-unit">g</span>
                                                    </div>
                                                    <div className="macro-editable">
                                                        <span className="macro-icon-modern">🧈</span>
                                                        <input
                                                            type="number"
                                                            className="macro-input"
                                                            value={entry.fat}
                                                            onChange={(e) => handleFieldUpdate('fat', Number(e.target.value))}
                                                            onFocus={(e) => e.target.select()}
                                                        />
                                                        <span className="macro-unit">g</span>
                                                    </div>
                                                    <div className="calorie-editable">
                                                        <input
                                                            type="number"
                                                            className="calorie-input"
                                                            value={entry.calories}
                                                            onChange={(e) => handleFieldUpdate('calories', Number(e.target.value))}
                                                            onFocus={(e) => e.target.select()}
                                                        />
                                                        <span className="calorie-unit">kcal</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                        )}
                    </div>

                    {/* Inline Quick-Add Measurement */}
                    <h3 className="subsection-title">Vücut Ölçümleri</h3>
                    <div className="inline-form">
                        <div className="inline-form-row">
                            <div className="inline-field field-sm">
                                <label>Kilo (kg)</label>
                                <input type="number" step="0.1" placeholder="0" value={measWeight} onChange={(e) => setMeasWeight(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAddMeasurementInline(); }} />
                            </div>
                            <div className="inline-field field-sm">
                                <label>Yağ %</label>
                                <input type="number" step="0.1" placeholder="0" value={measBodyFat} onChange={(e) => setMeasBodyFat(e.target.value)} />
                            </div>
                            <button className="btn-add" onClick={handleAddMeasurementInline}>⚖️ Kaydet</button>
                        </div>
                        <button className="expand-toggle" onClick={() => setShowMeasExpand(!showMeasExpand)}>
                            {showMeasExpand ? '▲ Gizle' : '▼ Detaylı Ölçüm'}
                        </button>
                        {showMeasExpand && (
                            <div className="expand-area">
                                <div className="inline-form-row">
                                    <div className="inline-field field-sm">
                                        <label>Göğüs (cm)</label>
                                        <input type="number" step="0.1" placeholder="0" value={measChest} onChange={(e) => setMeasChest(e.target.value)} />
                                    </div>
                                    <div className="inline-field field-sm">
                                        <label>Bel (cm)</label>
                                        <input type="number" step="0.1" placeholder="0" value={measWaist} onChange={(e) => setMeasWaist(e.target.value)} />
                                    </div>
                                    <div className="inline-field field-sm">
                                        <label>Kalça (cm)</label>
                                        <input type="number" step="0.1" placeholder="0" value={measHips} onChange={(e) => setMeasHips(e.target.value)} />
                                    </div>
                                    <div className="inline-field field-sm">
                                        <label>Kol (cm)</label>
                                        <input type="number" step="0.1" placeholder="0" value={measArms} onChange={(e) => setMeasArms(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Measurement History */}
                    {data.bodyMeasurements.length > 0 && (
                        <div className="measurements-grid">
                            {data.bodyMeasurements
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .slice(0, 10)
                                .map((m) => (
                                    <div key={m.id} className="measurement-card card">
                                        <div className="measurement-header">
                                            <div className="measurement-date">{formatDate(m.date)}</div>
                                            <button className="btn-icon delete" onClick={() => handleDeleteMeasurement(m.id)}>🗑️</button>
                                        </div>
                                        <div className="measurement-main">
                                            <strong>{m.weight} kg</strong>
                                            {m.bodyFat && <span>{m.bodyFat}% yağ</span>}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            )}

            {/* Workout Tab */}
            {activeTab === 'workout' && (
                <div className="tab-content fade-in">
                    <div className="section-header">
                        <h2>Antrenman Takibi</h2>
                    </div>

                    {/* Inline Quick-Add Workout */}
                    <div className="inline-form">
                        <div className="inline-form-row">
                            <div className="inline-field">
                                <label>Antrenman</label>
                                <input
                                    type="text"
                                    placeholder="Koşu, Ağırlık, Yoga..."
                                    value={wkType}
                                    onChange={(e) => setWkType(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddWorkoutInline(); }}
                                />
                            </div>
                            <div className="inline-field field-sm">
                                <label>Süre (dk)</label>
                                <input type="number" placeholder="0" value={wkDuration} onChange={(e) => setWkDuration(e.target.value)} />
                            </div>
                            <div className="inline-field field-sm">
                                <label>Kalori</label>
                                <input type="number" placeholder="kcal" value={wkCalBurned} onChange={(e) => setWkCalBurned(e.target.value)} />
                            </div>
                            <button className="btn-add" onClick={handleAddWorkoutInline}>➕ Ekle</button>
                        </div>
                        <button className="expand-toggle" onClick={() => setShowWkExpand(!showWkExpand)}>
                            {showWkExpand ? '▲ Gizle' : '▼ Not ekle'}
                        </button>
                        {showWkExpand && (
                            <div className="expand-area">
                                <div className="inline-form-row">
                                    <div className="inline-field">
                                        <label>Notlar</label>
                                        <input type="text" placeholder="Antrenman hakkında not..." value={wkNotes} onChange={(e) => setWkNotes(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="entries-list">
                        {data.workoutEntries.length === 0 ? (
                            <div className="empty-state card">
                                <p>🏋️ Henüz antrenman kaydı eklenmemiş</p>
                            </div>
                        ) : (
                            data.workoutEntries
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .map((entry) => (
                                    <div key={entry.id} className="workout-item card">
                                        <div className="workout-main">
                                            <div className="workout-header">
                                                <span className="workout-type">{entry.type}</span>
                                                <span className="workout-date">{formatDate(entry.date)}</span>
                                            </div>
                                            <div className="workout-stats">
                                                ⏱️ {entry.duration} dk • 🔥 {entry.caloriesBurned} kcal
                                            </div>
                                            {entry.notes && (
                                                <div className="workout-notes">{entry.notes}</div>
                                            )}
                                        </div>
                                        <button
                                            className="btn-icon delete"
                                            onClick={() => handleDeleteWorkout(entry.id)}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                ))
                        )}
                    </div>
                </div>
            )}

            {/* Recipes Tab */}
            {activeTab === 'recipes' && (
                <div className="tab-content fade-in">
                    <div className="section-header">
                        <h2>Yemek Tariflerim</h2>
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                setEditingRecipe(null);
                                setShowRecipeModal(true);
                            }}
                        >
                            ➕ Tarif Ekle
                        </button>
                    </div>

                    <div className="search-box">
                        <input
                            type="text"
                            className="input"
                            placeholder="🔍 Tarif ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="recipes-grid">
                        {filteredRecipes.length === 0 ? (
                            <div className="empty-state card">
                                <p>📖 {searchQuery ? 'Tarif bulunamadı' : 'Henüz tarif eklenmemiş'}</p>
                            </div>
                        ) : (
                            filteredRecipes.map((recipe) => (
                                <div key={recipe.id} className="recipe-card card">
                                    <div className="recipe-header">
                                        <h3 className="recipe-title">{recipe.title}</h3>
                                        <button
                                            className={`btn-fav ${recipe.favorite ? 'active' : ''}`}
                                            onClick={() => handleToggleFavorite(recipe.id)}
                                        >
                                            {recipe.favorite ? '⭐' : '☆'}
                                        </button>
                                    </div>
                                    {recipe.category && (
                                        <div className="recipe-category">{recipe.category}</div>
                                    )}
                                    <div className="recipe-info">
                                        {recipe.prepTime && <span>⏱️ {recipe.prepTime} dk</span>}
                                        <span>🔥 {recipe.calories} kcal</span>
                                    </div>
                                    <div className="recipe-actions">
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => setSelectedRecipe(recipe)}
                                        >
                                            👁️ Görüntüle
                                        </button>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => {
                                                setEditingRecipe(recipe);
                                                setShowRecipeModal(true);
                                            }}
                                        >
                                            ✏️ Düzenle
                                        </button>
                                        <button
                                            className="btn btn-secondary btn-sm delete"
                                            onClick={() => handleDeleteRecipe(recipe.id)}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
                <div className="tab-content fade-in">
                    <div className="section-header">
                        <h2>Sağlıklı Ürünler</h2>
                        <button className="btn btn-primary" onClick={() => setShowProductModal(true)}>
                            ➕ Ürün Ekle
                        </button>
                    </div>

                    <div className="search-box">
                        <input
                            type="text"
                            className="input"
                            placeholder="🔍 Ürün ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="products-table">
                        {filteredProducts.length === 0 ? (
                            <div className="empty-state card">
                                <p>🛒 {searchQuery ? 'Ürün bulunamadı' : 'Henüz ürün eklenmemiş'}</p>
                            </div>
                        ) : (
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Ürün Adı</th>
                                        <th>Kategori</th>
                                        <th>Nerede Bulunur</th>
                                        <th>Fiyat</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map((product) => (
                                        <tr key={product.id}>
                                            <td>{product.name}</td>
                                            <td>{product.category}</td>
                                            <td>{product.location}</td>
                                            <td>₺{product.price.toFixed(2)}</td>
                                            <td>
                                                <button
                                                    className="btn-icon delete"
                                                    onClick={() => handleDeleteProduct(product.id)}
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
                <div className="tab-content fade-in">
                    <div className="section-header">
                        <h2>Günlük Hedefler</h2>
                    </div>

                    <div className="settings-content card">
                        <p className="settings-description">
                            Günlük kalori ve makro hedeflerinizi buradan ayarlayabilirsiniz. Bu hedefler ana sayfadaki ilerleme çubuklarını ve makro kartlarını etkiler.
                        </p>

                        <div className="settings-form">
                            <div className="settings-row">
                                <div className="settings-item">
                                    <div className="settings-label">🔥 Günlük Kalori Hedefi</div>
                                    <div className="settings-value">{settings.dailyCalorieGoal} kcal</div>
                                </div>
                                <div className="settings-item">
                                    <div className="settings-label">🥩 Günlük Protein Hedefi</div>
                                    <div className="settings-value">{settings.dailyProteinGoal}g</div>
                                </div>
                            </div>

                            <div className="settings-row">
                                <div className="settings-item">
                                    <div className="settings-label">🍞 Günlük Karbonhidrat Hedefi</div>
                                    <div className="settings-value">{settings.dailyCarbsGoal}g</div>
                                </div>
                                <div className="settings-item">
                                    <div className="settings-label">🥑 Günlük Yağ Hedefi</div>
                                    <div className="settings-value">{settings.dailyFatGoal}g</div>
                                </div>
                            </div>

                            <h3 className="subsection-title">🏋️ Antrenman Günleri</h3>
                            <p className="settings-description">
                                Hangi günler antrenman yapacağınızı seçin. Bu günlerde antrenman yapmazsanız günlük skorunuzdan -30 puan düşer.
                            </p>

                            <div className="workout-days-selector">
                                {[
                                    { day: 0, name: 'Pazar', short: 'Paz' },
                                    { day: 1, name: 'Pazartesi', short: 'Pzt' },
                                    { day: 2, name: 'Salı', short: 'Sal' },
                                    { day: 3, name: 'Çarşamba', short: 'Çar' },
                                    { day: 4, name: 'Perşembe', short: 'Per' },
                                    { day: 5, name: 'Cuma', short: 'Cum' },
                                    { day: 6, name: 'Cumartesi', short: 'Cmt' },
                                ].map(({ day, name, short }) => (
                                    <button
                                        key={day}
                                        className={`workout-day-btn ${settings.workoutDays.includes(day) ? 'active' : ''}`}
                                        onClick={() => {
                                            const newDays = settings.workoutDays.includes(day)
                                                ? settings.workoutDays.filter(d => d !== day)
                                                : [...settings.workoutDays, day].sort();
                                            updateSettings({ ...settings, workoutDays: newDays });
                                        }}
                                    >
                                        <span className="day-short">{short}</span>
                                        <span className="day-full">{name}</span>
                                    </button>
                                ))}
                            </div>

                            <button className="btn btn-primary" onClick={() => setShowSettingsModal(true)}>
                                ✏️ Hedefleri Düzenle
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
                <div className="tab-content fade-in">
                    <div className="section-header">
                        <h2>Geçmiş Günler</h2>
                        <div className="history-controls">
                            <button
                                className={`btn ${dateRange === '7' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setDateRange('7')}
                            >
                                Son 7 Gün
                            </button>
                            <button
                                className={`btn ${dateRange === '30' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setDateRange('30')}
                            >
                                Son 30 Gün
                            </button>
                        </div>
                    </div>

                    <div className="history-list">
                        {getDailyScores().length === 0 ? (
                            <div className="empty-state card">
                                <p>📊 Henüz veri kaydedilmemiş</p>
                                <p className="empty-state-subtitle">Kalori veya antrenman kaydı eklediğinizde geçmiş veriler burada görünecek</p>
                            </div>
                        ) : (
                            getDailyScores().slice(-30).reverse().map((dayScore) => {
                                const scoreClass =
                                    dayScore.totalScore >= 80 ? 'excellent' :
                                        dayScore.totalScore >= 60 ? 'good' : 'poor';

                                return (
                                    <div key={dayScore.date} className={`day-score-card card ${scoreClass}`}>
                                        <div className="day-score-header">
                                            <div className="day-score-date">
                                                {formatDate(dayScore.date)} - {['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'][new Date(dayScore.date).getDay()]}
                                            </div>
                                            <div className={`day-score-badge ${scoreClass}`}>
                                                {dayScore.totalScore}/100
                                            </div>
                                        </div>

                                        <div className="day-score-progress">
                                            <div
                                                className={`day-score-fill ${scoreClass}`}
                                                style={{ width: `${dayScore.totalScore}%` }}
                                            />
                                        </div>

                                        <div className="day-score-details">
                                            <div className="day-score-stat">
                                                <span>Beslenme (70pt):</span>
                                                <strong>{dayScore.nutritionScore}</strong>
                                            </div>
                                            <div className="day-score-stat">
                                                <span>Antrenman (30pt):</span>
                                                <strong>{dayScore.workoutScore}</strong>
                                            </div>
                                            <div className="day-score-stat">
                                                <span>🔥 Kalori:</span>
                                                <strong>{dayScore.calorieIntake}/{settings.dailyCalorieGoal}</strong>
                                            </div>
                                            <div className="day-score-stat">
                                                <span>🥩 Protein:</span>
                                                <strong>{dayScore.proteinIntake}/{settings.dailyProteinGoal}g</strong>
                                            </div>
                                            <div className="day-score-stat">
                                                <span>🍞 Karb:</span>
                                                <strong>{dayScore.carbsIntake}/{settings.dailyCarbsGoal}g</strong>
                                            </div>
                                            <div className="day-score-stat">
                                                <span>🧈 Yağ:</span>
                                                <strong>{dayScore.fatIntake}/{settings.dailyFatGoal}g</strong>
                                            </div>
                                            <div className="day-score-stat">
                                                <span>🏋️ Antrenman:</span>
                                                <strong>{dayScore.workedOut ? '✓ Evet' : '✗ Hayır'}</strong>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (() => {
                const scores = getDailyScores();

                if (scores.length === 0) {
                    return (
                        <div className="tab-content fade-in">
                            <div className="section-header">
                                <h2>Analiz & İstatistikler</h2>
                            </div>
                            <div className="empty-state card">
                                <p>📈 Henüz analiz yapılacak veri yok</p>
                                <p className="empty-state-subtitle">Kalori veya antrenman kaydı eklediğinizde analiz ve istatistikler burada görünecek</p>
                            </div>
                        </div>
                    );
                }

                const avgScore = scores.length > 0 ? scores.reduce((sum, s) => sum + s.totalScore, 0) / scores.length : 0;
                const bestDay = scores.length > 0 ? scores.reduce((best, s) => s.totalScore > best.totalScore ? s : best, scores[0]) : null;
                const totalWorkouts = scores.filter(s => s.workedOut).length;

                const sortedMeasurements = data.bodyMeasurements
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                const firstWeight = sortedMeasurements[0]?.weight || 0;
                const latestWeight = sortedMeasurements[sortedMeasurements.length - 1]?.weight || 0;
                const totalWeightChange = latestWeight - firstWeight;

                return (
                    <div className="tab-content fade-in">
                        <div className="section-header">
                            <h2>Analiz & İstatistikler</h2>
                        </div>

                        <div className="analytics-grid">
                            <div className="analytics-stat-card card">
                                <div className="analytics-stat-icon">📊</div>
                                <div className="analytics-stat-value">{avgScore.toFixed(0)}</div>
                                <div className="analytics-stat-label">Ortalama Skor</div>
                            </div>
                            <div className="analytics-stat-card card">
                                <div className="analytics-stat-icon">🏆</div>
                                <div className="analytics-stat-value">{bestDay?.totalScore || 0}</div>
                                <div className="analytics-stat-label">En İyi Gün</div>
                            </div>
                            <div className="analytics-stat-card card">
                                <div className="analytics-stat-icon">🏋️</div>
                                <div className="analytics-stat-value">{totalWorkouts}</div>
                                <div className="analytics-stat-label">Toplam Antrenman</div>
                            </div>
                            <div className="analytics-stat-card card">
                                <div className="analytics-stat-icon">⚖️</div>
                                <div className="analytics-stat-value">
                                    {totalWeightChange > 0 ? '+' : ''}{totalWeightChange.toFixed(1)}
                                </div>
                                <div className="analytics-stat-label">Kilo Değişimi (kg)</div>
                            </div>
                        </div>

                        {/* Weight Tracking Table */}
                        {sortedMeasurements.length > 0 && (
                            <>
                                <h3 className="subsection-title">Kilo Takibi</h3>
                                <div className="weight-table-container">
                                    <table className="weight-table card">
                                        <thead>
                                            <tr>
                                                <th>Tarih</th>
                                                <th>Kilo (kg)</th>
                                                <th>Fark</th>
                                                <th>Toplam Değişim</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sortedMeasurements.map((m, index) => {
                                                const prevWeight = index > 0 ? sortedMeasurements[index - 1].weight : m.weight;
                                                const diff = m.weight - prevWeight;
                                                const totalChange = m.weight - firstWeight;
                                                const diffClass = diff < 0 ? 'down' : diff > 0 ? 'up' : 'same';
                                                const totalClass = totalChange < 0 ? 'down' : totalChange > 0 ? 'up' : 'same';

                                                return (
                                                    <tr key={m.id}>
                                                        <td>{formatDate(m.date)}</td>
                                                        <td><strong>{m.weight}</strong></td>
                                                        <td className={`weight-diff ${diffClass}`}>
                                                            {diff !== 0 && (diff > 0 ? '+' : '')}{diff.toFixed(1)}
                                                            {diff < 0 ? ' 🟢' : diff > 0 ? ' 🔴' : ''}
                                                        </td>
                                                        <td className={`weight-diff ${totalClass}`}>
                                                            {totalChange !== 0 && (totalChange > 0 ? '+' : '')}{totalChange.toFixed(1)}
                                                            {totalChange < 0 ? ' 🟢' : totalChange > 0 ? ' 🔴' : ''}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                );
            })()}

            {/* Calorie Edit Modal (only for editing existing entries) */}
            {showCalorieModal && editingCalorie && (
                <div className="modal-overlay" onClick={() => { setShowCalorieModal(false); setEditingCalorie(null); }}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Öğün Düzenle</h2>
                            <button className="modal-close" onClick={() => { setShowCalorieModal(false); setEditingCalorie(null); }}>×</button>
                        </div>
                        <form onSubmit={handleEditCalorie}>
                            <div className="input-group">
                                <label>Tarih *</label>
                                <input name="date" type="date" className="input" defaultValue={editingCalorie.date} required />
                            </div>
                            <div className="input-group">
                                <label>Öğün *</label>
                                <select name="meal" className="select" defaultValue={editingCalorie.meal} required>
                                    <option value="breakfast">Kahvaltı</option>
                                    <option value="lunch">Öğle Yemeği</option>
                                    <option value="dinner">Akşam Yemeği</option>
                                    <option value="snack">Ara Öğün</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Yemek/İçecek *</label>
                                <input name="food" type="text" className="input" defaultValue={editingCalorie.food} required />
                            </div>
                            <div className="input-group">
                                <label>Kalori (kcal) *</label>
                                <input name="calories" type="number" className="input" defaultValue={editingCalorie.calories} required />
                            </div>
                            <div className="input-group">
                                <label>Protein (g)</label>
                                <input name="protein" type="number" className="input" defaultValue={editingCalorie.protein || 0} />
                            </div>
                            <div className="input-group">
                                <label>Karbonhidrat (g)</label>
                                <input name="carbs" type="number" className="input" defaultValue={editingCalorie.carbs || 0} />
                            </div>
                            <div className="input-group">
                                <label>Yağ (g)</label>
                                <input name="fat" type="number" className="input" defaultValue={editingCalorie.fat || 0} />
                            </div>
                            <button type="submit" className="btn btn-primary">Kaydet</button>
                        </form>
                    </div>
                </div>
            )}

            {showRecipeModal && (
                <div className="modal-overlay" onClick={() => setShowRecipeModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingRecipe ? 'Tarifi Düzenle' : 'Yeni Tarif'}</h2>
                            <button className="modal-close" onClick={() => setShowRecipeModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleAddRecipe}>
                            <div className="input-group">
                                <label>Tarif Adı *</label>
                                <input name="title" type="text" className="input" defaultValue={editingRecipe?.title} required />
                            </div>
                            <div className="input-group">
                                <label>Kategori</label>
                                <input name="category" type="text" className="input" defaultValue={editingRecipe?.category} placeholder="Örn: Ana Yemek, Tatlı" />
                            </div>
                            <div className="input-group">
                                <label>Malzemeler (Her satırda bir malzeme) *</label>
                                <textarea name="ingredients" className="textarea" defaultValue={editingRecipe?.ingredients.join('\n')} required></textarea>
                            </div>
                            <div className="input-group">
                                <label>Yapılışı *</label>
                                <textarea name="instructions" className="textarea" defaultValue={editingRecipe?.instructions} required></textarea>
                            </div>
                            <div className="input-group">
                                <label>Toplam Kalori (kcal) *</label>
                                <input name="calories" type="number" className="input" defaultValue={editingRecipe?.calories} required />
                            </div>
                            <div className="input-group">
                                <label>Hazırlama Süresi (dakika)</label>
                                <input name="prepTime" type="number" className="input" defaultValue={editingRecipe?.prepTime} />
                            </div>
                            <button type="submit" className="btn btn-primary">{editingRecipe ? 'Kaydet' : 'Ekle'}</button>
                        </form>
                    </div>
                </div>
            )}

            {showProductModal && (
                <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Ürün Ekle</h2>
                            <button className="modal-close" onClick={() => setShowProductModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleAddProduct}>
                            <div className="input-group">
                                <label>Ürün Adı *</label>
                                <input name="name" type="text" className="input" required />
                            </div>
                            <div className="input-group">
                                <label>Kategori *</label>
                                <input name="category" type="text" className="input" placeholder="Örn: Protein Tozu, Vitamin" required />
                            </div>
                            <div className="input-group">
                                <label>Nerede Bulunur *</label>
                                <input name="location" type="text" className="input" placeholder="Örn: Migros, GNC" required />
                            </div>
                            <div className="input-group">
                                <label>Fiyat (₺) *</label>
                                <input name="price" type="number" step="0.01" className="input" required />
                            </div>
                            <button type="submit" className="btn btn-primary">Ekle</button>
                        </form>
                    </div>
                </div>
            )}

            {selectedRecipe && (
                <div className="modal-overlay" onClick={() => setSelectedRecipe(null)}>
                    <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{selectedRecipe.title}</h2>
                            <button className="modal-close" onClick={() => setSelectedRecipe(null)}>×</button>
                        </div>
                        <div className="recipe-view">
                            {selectedRecipe.category && <div className="recipe-category">{selectedRecipe.category}</div>}
                            <div className="recipe-stats">
                                {selectedRecipe.prepTime && <span>⏱️ {selectedRecipe.prepTime} dakika</span>}
                                <span>🔥 {selectedRecipe.calories} kcal</span>
                            </div>
                            <h3>Malzemeler</h3>
                            <ul>
                                {selectedRecipe.ingredients.map((ingredient, i) => (
                                    <li key={i}>{ingredient}</li>
                                ))}
                            </ul>
                            <h3>Yapılışı</h3>
                            <p>{selectedRecipe.instructions}</p>
                        </div>
                    </div>
                </div>
            )}

            {showSettingsModal && (
                <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Günlük Hedefler</h2>
                            <button className="modal-close" onClick={() => setShowSettingsModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSaveSettings}>
                            <div className="input-group">
                                <label>🔥 Günlük Kalori Hedefi (kcal) *</label>
                                <input
                                    name="dailyCalorieGoal"
                                    type="number"
                                    className="input"
                                    defaultValue={settings.dailyCalorieGoal}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label>🥩 Günlük Protein Hedefi (g) *</label>
                                <input
                                    name="dailyProteinGoal"
                                    type="number"
                                    className="input"
                                    defaultValue={settings.dailyProteinGoal}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label>🍞 Günlük Karbonhidrat Hedefi (g) *</label>
                                <input
                                    name="dailyCarbsGoal"
                                    type="number"
                                    className="input"
                                    defaultValue={settings.dailyCarbsGoal}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label>🥑 Günlük Yağ Hedefi (g) *</label>
                                <input
                                    name="dailyFatGoal"
                                    type="number"
                                    className="input"
                                    defaultValue={settings.dailyFatGoal}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary">Kaydet</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Health;
