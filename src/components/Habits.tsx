import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateId, getLocalDate } from '../utils/storage';
import type { Habit, HabitLog } from '../types';
import './Habits.css';

const Habits: React.FC = () => {
    const { data, updateData } = useApp();
    const [activeTab, setActiveTab] = useState<'good' | 'bad'>('good');
    const [newHabitName, setNewHabitName] = useState('');
    const [newTrigger, setNewTrigger] = useState('');
    const [newReward, setNewReward] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [expandedHabit, setExpandedHabit] = useState<string | null>(null);

    const today = getLocalDate();

    // Handlers
    const handleAddHabit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newHabitName.trim()) return;

        const newHabit: Habit = {
            id: generateId(),
            name: newHabitName.trim(),
            type: activeTab,
            trigger: newTrigger.trim() || undefined,
            reward: newReward.trim() || undefined,
            createdAt: new Date().toISOString(),
        };

        updateData({ habits: [...(data.habits || []), newHabit] });
        setNewHabitName('');
        setNewTrigger('');
        setNewReward('');
        setShowAdvanced(false);
    };

    const handleDeleteHabit = (id: string) => {
        if (confirm('Bu alışkanlığı silmek istediğinize emin misiniz?')) {
            updateData({
                habits: (data.habits || []).filter((h) => h.id !== id),
                habitLogs: (data.habitLogs || []).filter((l) => l.habitId !== id),
            });
        }
    };

    const handleToggleToday = (habitId: string) => {
        const logs = data.habitLogs || [];
        const existing = logs.find((l) => l.habitId === habitId && l.date === today);

        if (existing) {
            updateData({ habitLogs: logs.filter((l) => l.id !== existing.id) });
        } else {
            const newLog: HabitLog = {
                id: generateId(),
                habitId,
                date: today,
                completed: true,
            };
            updateData({ habitLogs: [...logs, newLog] });
        }
    };

    const isCheckedToday = (habitId: string): boolean => {
        return (data.habitLogs || []).some((l) => l.habitId === habitId && l.date === today && l.completed);
    };

    const getStreak = (habitId: string): number => {
        const logs = (data.habitLogs || []).filter((l) => l.habitId === habitId && l.completed);
        const dates = logs.map((l) => l.date).sort().reverse();
        if (dates.length === 0) return 0;

        let streak = 0;
        const d = new Date();
        for (let i = 0; i < 365; i++) {
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            if (dates.includes(dateStr)) {
                streak++;
            } else if (i > 0) {
                break;
            }
            d.setDate(d.getDate() - 1);
        }
        return streak;
    };

    const getBestStreak = (habitId: string): number => {
        const logs = (data.habitLogs || []).filter((l) => l.habitId === habitId && l.completed);
        const dates = [...new Set(logs.map((l) => l.date))].sort();
        if (dates.length === 0) return 0;

        let best = 1;
        let current = 1;
        for (let i = 1; i < dates.length; i++) {
            const prev = new Date(dates[i - 1] + 'T00:00:00');
            const curr = new Date(dates[i] + 'T00:00:00');
            const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
            if (diff === 1) {
                current++;
                if (current > best) best = current;
            } else {
                current = 1;
            }
        }
        return best;
    };

    const getLast7Days = (): string[] => {
        const days: string[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
        }
        return days;
    };

    const getLast30Days = (): string[] => {
        const days: string[] = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
        }
        return days;
    };

    const isDayLogged = (habitId: string, date: string): boolean => {
        return (data.habitLogs || []).some((l) => l.habitId === habitId && l.date === date && l.completed);
    };

    const getDayLabel = (dateStr: string): string => {
        const d = new Date(dateStr + 'T00:00:00');
        const days = ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'];
        return days[d.getDay()];
    };

    const getCompletionRate = (habitId: string): number => {
        const last30 = getLast30Days();
        const completed = last30.filter((day) => isDayLogged(habitId, day)).length;
        return Math.round((completed / 30) * 100);
    };

    const habits = data.habits || [];
    const goodHabits = habits.filter((h) => h.type === 'good');
    const badHabits = habits.filter((h) => h.type === 'bad');
    const currentHabits = activeTab === 'good' ? goodHabits : badHabits;
    const last7 = getLast7Days();

    const totalCheckedToday = habits.filter((h) => isCheckedToday(h.id)).length;
    const totalHabits = habits.length;
    const todayPercent = totalHabits > 0 ? Math.round((totalCheckedToday / totalHabits) * 100) : 0;

    // Find best overall streak
    const maxStreak = habits.reduce((max, h) => {
        const s = getStreak(h.id);
        return s > max ? s : max;
    }, 0);

    return (
        <div className="habits-page">
            <div className="page-header">
                <h1 className="page-title">🔄 Alışkanlıklar</h1>
                <p className="page-subtitle">Küçük adımlar, büyük dönüşümler — Atomik Alışkanlıklar</p>
            </div>

            {/* Identity Statement */}
            <div className="identity-card">
                <div className="identity-quote">
                    <span className="identity-icon">🪞</span>
                    <div className="identity-text">
                        <strong>Kimlik Hatırlatıcısı</strong>
                        <p>"Hedefini değil, <em>kim olmak istediğini</em> düşün. Davranışlar kimliği takip eder."</p>
                    </div>
                </div>
            </div>

            {/* Dashboard Widgets */}
            <div className="habits-dashboard">
                <div className="habit-stat-card accent-blue">
                    <div className="stat-ring">
                        <svg viewBox="0 0 36 36" className="stat-circle">
                            <path className="stat-circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <path className="stat-circle-fill" strokeDasharray={`${todayPercent}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        </svg>
                        <span className="ring-value">{todayPercent}%</span>
                    </div>
                    <span className="stat-label">Bugün</span>
                </div>
                <div className="habit-stat-card">
                    <span className="stat-icon">🔥</span>
                    <span className="stat-value">{maxStreak}</span>
                    <span className="stat-label">En İyi Seri</span>
                </div>
                <div className="habit-stat-card">
                    <span className="stat-icon">🌱</span>
                    <span className="stat-value">{goodHabits.length}</span>
                    <span className="stat-label">İyi Alışkanlık</span>
                </div>
                <div className="habit-stat-card">
                    <span className="stat-icon">🚫</span>
                    <span className="stat-value">{badHabits.length}</span>
                    <span className="stat-label">Bırakılacak</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="habits-tabs">
                <button
                    className={`habit-tab good ${activeTab === 'good' ? 'active' : ''}`}
                    onClick={() => setActiveTab('good')}
                >
                    🌱 İyi Alışkanlıklar ({goodHabits.length})
                </button>
                <button
                    className={`habit-tab bad ${activeTab === 'bad' ? 'active' : ''}`}
                    onClick={() => setActiveTab('bad')}
                >
                    🚫 Kötü Alışkanlıklar ({badHabits.length})
                </button>
            </div>

            {/* Content */}
            <div className="habits-content">
                {/* Add Habit Form */}
                <form className="habit-add-form" onSubmit={handleAddHabit}>
                    <div className="habit-input-wrapper">
                        <span className="habit-input-icon">{activeTab === 'good' ? '🌱' : '🚫'}</span>
                        <input
                            type="text"
                            placeholder={activeTab === 'good' ? 'Yeni iyi alışkanlık ekle...' : 'Bırakmak istediğin alışkanlığı yaz...'}
                            value={newHabitName}
                            onChange={(e) => setNewHabitName(e.target.value)}
                        />
                        {newHabitName && (
                            <>
                                <button type="button" className="habit-advanced-toggle" onClick={() => setShowAdvanced(!showAdvanced)} title="Tetikleyici & Ödül">
                                    ⚙️
                                </button>
                                <button type="submit" className="habit-add-btn">
                                    Ekle ↵
                                </button>
                            </>
                        )}
                    </div>

                    {/* Advanced: Trigger & Reward */}
                    {showAdvanced && newHabitName && (
                        <div className="habit-advanced-fields">
                            <div className="advanced-field">
                                <span className="adv-icon">⛓️</span>
                                <input
                                    type="text"
                                    placeholder="Tetikleyici: Ne zaman yapacaksın? (ör: Kahve yaptıktan sonra)"
                                    value={newTrigger}
                                    onChange={(e) => setNewTrigger(e.target.value)}
                                />
                            </div>
                            <div className="advanced-field">
                                <span className="adv-icon">🎁</span>
                                <input
                                    type="text"
                                    placeholder="Ödül: Bunu yapınca kendine ne vereceksin? (ör: 10dk oyun)"
                                    value={newReward}
                                    onChange={(e) => setNewReward(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </form>

                {/* Habits List */}
                <div className="habits-list">
                    {currentHabits.length === 0 ? (
                        <div className="habits-empty">
                            <div className="empty-icon">{activeTab === 'good' ? '🌱' : '🚫'}</div>
                            <p>{activeTab === 'good' ? 'Henüz iyi alışkanlık eklenmemiş' : 'Henüz kötü alışkanlık eklenmemiş'}</p>
                            <span>Yukarıdaki kutucuktan ekleyebilirsin</span>
                        </div>
                    ) : (
                        currentHabits.map((habit) => {
                            const streak = getStreak(habit.id);
                            const bestStreak = getBestStreak(habit.id);
                            const checked = isCheckedToday(habit.id);
                            const rate = getCompletionRate(habit.id);
                            const isExpanded = expandedHabit === habit.id;

                            return (
                                <div key={habit.id} className={`habit-card ${activeTab} ${checked ? 'done' : ''}`}>
                                    {/* Main Row */}
                                    <div className="habit-main">
                                        <div className="habit-check-label" onClick={() => handleToggleToday(habit.id)}>
                                            <div className={`habit-checkbox ${activeTab} ${checked ? 'checked' : ''}`}>
                                                {checked && <span className="check-mark">✓</span>}
                                            </div>
                                            <div className="habit-info">
                                                <span className={`habit-name ${checked ? 'completed' : ''}`}>{habit.name}</span>
                                                <div className="habit-meta">
                                                    {streak > 0 && (
                                                        <span className="habit-streak">🔥 {streak} gün</span>
                                                    )}
                                                    <span className="habit-rate">{rate}% (30 gün)</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="habit-actions-right">
                                            <button
                                                className="habit-expand-btn"
                                                onClick={() => setExpandedHabit(isExpanded ? null : habit.id)}
                                                title="Detaylar"
                                            >
                                                {isExpanded ? '▲' : '▼'}
                                            </button>
                                            <button
                                                className="habit-delete-btn"
                                                onClick={() => handleDeleteHabit(habit.id)}
                                                title="Sil"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>

                                    {/* 7 Day Mini Tracker */}
                                    <div className="habit-week">
                                        {last7.map((day) => {
                                            const logged = isDayLogged(habit.id, day);
                                            const isToday = day === today;
                                            return (
                                                <div key={day} className={`week-dot-container ${isToday ? 'today' : ''}`}>
                                                    <div className={`week-dot ${activeTab} ${logged ? 'filled' : ''}`} />
                                                    <span className="week-label">{getDayLabel(day)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div className="habit-expanded">
                                            {/* Trigger & Reward */}
                                            {(habit.trigger || habit.reward) && (
                                                <div className="habit-atomic-info">
                                                    {habit.trigger && (
                                                        <div className="atomic-tag trigger">
                                                            <span className="atomic-icon">⛓️</span>
                                                            <span><strong>Tetikleyici:</strong> {habit.trigger}</span>
                                                        </div>
                                                    )}
                                                    {habit.reward && (
                                                        <div className="atomic-tag reward">
                                                            <span className="atomic-icon">🎁</span>
                                                            <span><strong>Ödül:</strong> {habit.reward}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Stats */}
                                            <div className="habit-stats-row">
                                                <div className="mini-stat">
                                                    <span className="mini-stat-val">{streak}</span>
                                                    <span className="mini-stat-label">Mevcut Seri</span>
                                                </div>
                                                <div className="mini-stat">
                                                    <span className="mini-stat-val">{bestStreak}</span>
                                                    <span className="mini-stat-label">En İyi Seri</span>
                                                </div>
                                                <div className="mini-stat">
                                                    <span className="mini-stat-val">{rate}%</span>
                                                    <span className="mini-stat-label">30 Gün</span>
                                                </div>
                                            </div>

                                            {/* 30-Day Heat Map */}
                                            <div className="habit-heatmap">
                                                <span className="heatmap-title">Son 30 Gün</span>
                                                <div className="heatmap-grid">
                                                    {getLast30Days().map((day) => {
                                                        const logged = isDayLogged(habit.id, day);
                                                        const isToday = day === today;
                                                        const dayNum = new Date(day + 'T00:00:00').getDate();
                                                        return (
                                                            <div
                                                                key={day}
                                                                className={`heatmap-cell ${activeTab} ${logged ? 'filled' : ''} ${isToday ? 'today' : ''}`}
                                                                title={`${dayNum} - ${logged ? 'Yapıldı ✓' : 'Yapılmadı'}`}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default Habits;
