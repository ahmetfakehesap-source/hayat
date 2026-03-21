import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateId, getLocalDate } from '../utils/storage';
import type { Habit, HabitLog } from '../types';
import './Habits.css';

const Habits: React.FC = () => {
    const { data, updateData } = useApp();
    const [activeTab, setActiveTab] = useState<'good' | 'bad'>('good');
    const [newHabitName, setNewHabitName] = useState('');

    const today = getLocalDate();

    // Handlers
    const handleAddHabit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newHabitName.trim()) return;

        const newHabit: Habit = {
            id: generateId(),
            name: newHabitName.trim(),
            type: activeTab,
            createdAt: new Date().toISOString(),
        };

        updateData({ habits: [...(data.habits || []), newHabit] });
        setNewHabitName('');
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
            // Remove log (uncheck)
            updateData({ habitLogs: logs.filter((l) => l.id !== existing.id) });
        } else {
            // Add log (check)
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

    const getLast7Days = (): string[] => {
        const days: string[] = [];
        for (let i = 6; i >= 0; i--) {
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

    const habits = data.habits || [];
    const goodHabits = habits.filter((h) => h.type === 'good');
    const badHabits = habits.filter((h) => h.type === 'bad');
    const currentHabits = activeTab === 'good' ? goodHabits : badHabits;
    const last7 = getLast7Days();

    const totalCheckedToday = habits.filter((h) => isCheckedToday(h.id)).length;

    return (
        <div className="habits-page">
            <div className="page-header">
                <h1 className="page-title">🔄 Alışkanlıklar</h1>
                <p className="page-subtitle">Küçük adımlar, büyük dönüşümler — Atomik Alışkanlıklar</p>
            </div>

            {/* Dashboard Widgets */}
            <div className="habits-dashboard">
                <div className="habit-stat-card">
                    <span className="stat-icon">✅</span>
                    <span className="stat-value">{totalCheckedToday}</span>
                    <span className="stat-label">Bugün Yapılan</span>
                </div>
                <div className="habit-stat-card">
                    <span className="stat-icon">🌱</span>
                    <span className="stat-value">{goodHabits.length}</span>
                    <span className="stat-label">İyi Alışkanlık</span>
                </div>
                <div className="habit-stat-card">
                    <span className="stat-icon">🚫</span>
                    <span className="stat-value">{badHabits.length}</span>
                    <span className="stat-label">Kötü Alışkanlık</span>
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
                {/* Add Habit Input */}
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
                            <button type="submit" className="habit-add-btn">
                                Ekle ↵
                            </button>
                        )}
                    </div>
                </form>

                {/* Habits List */}
                <div className="habits-list">
                    {currentHabits.length === 0 ? (
                        <div className="habits-empty">
                            <p>{activeTab === 'good' ? '🌱 Henüz iyi alışkanlık eklenmemiş' : '🚫 Henüz kötü alışkanlık eklenmemiş'}</p>
                            <span>Yukarıdaki kutucuktan ekleyebilirsin</span>
                        </div>
                    ) : (
                        currentHabits.map((habit) => {
                            const streak = getStreak(habit.id);
                            const checked = isCheckedToday(habit.id);

                            return (
                                <div key={habit.id} className={`habit-card ${activeTab} ${checked ? 'done' : ''}`}>
                                    <div className="habit-main">
                                        <label className="habit-check-label" onClick={() => handleToggleToday(habit.id)}>
                                            <div className={`habit-checkbox ${activeTab} ${checked ? 'checked' : ''}`}>
                                                {checked && <span className="check-mark">✓</span>}
                                            </div>
                                            <div className="habit-info">
                                                <span className={`habit-name ${checked ? 'completed' : ''}`}>{habit.name}</span>
                                                {streak > 0 && (
                                                    <span className="habit-streak">
                                                        🔥 {streak} gün seri
                                                    </span>
                                                )}
                                            </div>
                                        </label>

                                        <button
                                            className="habit-delete-btn"
                                            onClick={() => handleDeleteHabit(habit.id)}
                                            title="Sil"
                                        >
                                            ×
                                        </button>
                                    </div>

                                    {/* Last 7 Days Mini Tracker */}
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
