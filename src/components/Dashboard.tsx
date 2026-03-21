import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getLocalDate, dateToLocalString } from '../utils/storage';
import './Dashboard.css';

const Dashboard: React.FC = () => {
    const { data, settings } = useApp();

    const stats = useMemo(() => {
        const today = getLocalDate();
        const thisWeek = getThisWeekDates();

        // Tasks
        const activeTasks = data.tasks.filter((t) => !t.completed);
        const completedTasks = data.tasks.filter((t) => t.completed);

        // Projects
        const activeProjects = data.projects.filter(
            (p) => p.status === 'in-progress' || p.status === 'planning'
        );

        // Calories
        const todayCalories = data.calorieEntries
            .filter((c) => c.date === today)
            .reduce((sum, c) => sum + c.calories, 0);
        const todayProtein = data.calorieEntries
            .filter((c) => c.date === today)
            .reduce((sum, c) => sum + c.protein, 0);

        // Workouts
        const weekWorkouts = data.workoutEntries.filter((w) =>
            thisWeek.includes(w.date)
        ).length;
        const todayWorkedOut = data.workoutEntries.some((w) => w.date === today);

        // Books
        const readingBooks = data.books.filter((b) => b.status === 'reading');
        const completedThisYear = data.books.filter((b) => {
            if (!b.finishDate) return false;
            return new Date(b.finishDate).getFullYear() === new Date().getFullYear() && b.status === 'completed';
        }).length;

        // Goals
        const activeGoals = data.goals.filter((g) => !g.completed);
        const completedGoals = data.goals.filter((g) => g.completed);

        // Journal
        const hasJournalToday = data.journalEntries.some((j) => j.date === today);
        const journalStreak = getJournalStreak(data.journalEntries);

        // Investment
        const totalInvestmentValue = data.investments.reduce((sum, inv) => sum + inv.quantity * inv.currentPrice, 0);
        const totalInvestmentCost = data.investments.reduce((sum, inv) => sum + inv.quantity * inv.buyPrice, 0);
        const investmentProfit = totalInvestmentValue - totalInvestmentCost;
        const investmentProfitPercent = totalInvestmentCost > 0 ? ((investmentProfit / totalInvestmentCost) * 100).toFixed(1) : '0.0';

        // Habits
        const habits = data.habits || [];
        const habitLogs = data.habitLogs || [];
        const todayHabitsChecked = habits.filter((h) =>
            habitLogs.some((l) => l.habitId === h.id && l.date === today && l.completed)
        ).length;
        const habitsTotal = habits.length;

        // Best habit streak
        let bestHabitStreak = 0;
        habits.forEach((h) => {
            const logs = habitLogs.filter((l) => l.habitId === h.id && l.completed);
            const dates = logs.map((l) => l.date).sort().reverse();
            let streak = 0;
            const d = new Date();
            for (let i = 0; i < 365; i++) {
                const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                if (dates.includes(ds)) { streak++; } else if (i > 0) { break; }
                d.setDate(d.getDate() - 1);
            }
            if (streak > bestHabitStreak) bestHabitStreak = streak;
        });

        return {
            activeTasks: activeTasks.length,
            completedTasks: completedTasks.length,
            activeProjects: activeProjects.length,
            todayCalories,
            todayProtein,
            calorieGoal: settings.dailyCalorieGoal,
            proteinGoal: settings.dailyProteinGoal,
            weekWorkouts,
            workoutGoal: settings.weeklyWorkoutGoal,
            todayWorkedOut,
            readingBooks: readingBooks.length,
            booksThisYear: completedThisYear,
            bookGoal: settings.yearlyBookGoal,
            activeGoals: activeGoals.length,
            completedGoals: completedGoals.length,
            hasJournalToday,
            journalStreak,
            totalInvestmentValue,
            investmentProfit,
            investmentProfitPercent,
            todayHabitsChecked,
            habitsTotal,
            bestHabitStreak,
        };
    }, [data, settings]);

    // Greeting based on time
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 6) return { text: 'İyi geceler', emoji: '🌙' };
        if (hour < 12) return { text: 'Günaydın', emoji: '☀️' };
        if (hour < 18) return { text: 'İyi günler', emoji: '🌤️' };
        return { text: 'İyi akşamlar', emoji: '🌆' };
    };

    const greeting = getGreeting();

    // Today's date formatted
    const todayFormatted = new Date().toLocaleDateString('tr-TR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    // Daily score (out of 100)
    const dailyScore = useMemo(() => {
        let score = 0;
        const maxScore = 100;

        // Calories (max 25 pts)
        if (stats.calorieGoal > 0) {
            const calRatio = stats.todayCalories / stats.calorieGoal;
            if (calRatio >= 0.8 && calRatio <= 1.1) score += 25;
            else if (calRatio > 0) score += Math.round(15 * Math.min(calRatio, 1));
        }

        // Workout (max 20 pts)
        if (stats.todayWorkedOut) score += 20;

        // Habits (max 30 pts)
        if (stats.habitsTotal > 0) {
            score += Math.round((stats.todayHabitsChecked / stats.habitsTotal) * 30);
        }

        // Journal (max 10 pts)
        if (stats.hasJournalToday) score += 10;

        // Tasks completed today (max 15 pts)
        if (stats.activeTasks > 0 || stats.completedTasks > 0) {
            const taskRatio = stats.completedTasks / (stats.activeTasks + stats.completedTasks);
            score += Math.round(taskRatio * 15);
        }

        return Math.min(score, maxScore);
    }, [stats]);

    const motivationalQuotes = [
        { text: "Her gün %1 daha iyi ol. Bir yılda 37 kat daha iyi olursun.", author: "James Clear" },
        { text: "Disiplinli insanlar ortamlarını öyle tasarlar ki disipline ihtiyaç duymazlar.", author: "Atomic Habits" },
        { text: "Hedefin seni yönlendirsin, ama sistemi kur.", author: "James Clear" },
        { text: "Küçük adımlar, büyük dönüşümler yaratır.", author: "Atomic Habits" },
        { text: "Motivasyon geçicidir, sistemler kalıcıdır.", author: "James Clear" },
        { text: "Bir günü kaçırmak normal. İki günü kaçırmak yeni bir alışkanlıktır.", author: "Atomic Habits" },
        { text: "Kim olmak istediğini düşün. Davranışlar kimliği takip eder.", author: "James Clear" },
    ];

    const todayQuote = motivationalQuotes[new Date().getDate() % motivationalQuotes.length];

    return (
        <div className="dashboard">
            {/* Hero Greeting */}
            <div className="dash-hero">
                <div className="hero-left">
                    <span className="hero-emoji">{greeting.emoji}</span>
                    <div>
                        <h1 className="hero-greeting">{greeting.text}</h1>
                        <p className="hero-date">{todayFormatted}</p>
                    </div>
                </div>
                <div className="hero-score">
                    <svg viewBox="0 0 36 36" className="score-ring">
                        <path className="score-ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="score-ring-fill" strokeDasharray={`${dailyScore}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <div className="score-text">
                        <span className="score-value">{dailyScore}</span>
                        <span className="score-label">Günlük<br />Skor</span>
                    </div>
                </div>
            </div>

            {/* Motivational Quote */}
            <div className="dash-quote">
                <span className="quote-mark">"</span>
                <p>{todayQuote.text}</p>
                <span className="quote-author">— {todayQuote.author}</span>
            </div>

            {/* Today's Progress Strip */}
            <div className="today-strip">
                <div className={`strip-item ${stats.todayCalories > 0 ? 'done' : ''}`}>
                    <span className="strip-icon">🍽️</span>
                    <span className="strip-label">Kalori</span>
                    <span className="strip-val">{stats.todayCalories}/{stats.calorieGoal}</span>
                </div>
                <div className={`strip-item ${stats.todayWorkedOut ? 'done' : ''}`}>
                    <span className="strip-icon">🏋️</span>
                    <span className="strip-label">Spor</span>
                    <span className="strip-val">{stats.todayWorkedOut ? '✓' : '—'}</span>
                </div>
                <div className={`strip-item ${stats.habitsTotal > 0 && stats.todayHabitsChecked === stats.habitsTotal ? 'done' : ''}`}>
                    <span className="strip-icon">🔄</span>
                    <span className="strip-label">Alışkanlık</span>
                    <span className="strip-val">{stats.todayHabitsChecked}/{stats.habitsTotal}</span>
                </div>
                <div className={`strip-item ${stats.hasJournalToday ? 'done' : ''}`}>
                    <span className="strip-icon">📔</span>
                    <span className="strip-label">Günlük</span>
                    <span className="strip-val">{stats.hasJournalToday ? '✓' : '—'}</span>
                </div>
            </div>

            {/* Main Cards Grid */}
            <div className="dash-grid">
                {/* Work Card */}
                <div className="dash-card">
                    <div className="dash-card-header">
                        <span className="dc-icon">💼</span>
                        <span className="dc-title">Kendi İşim</span>
                    </div>
                    <div className="dash-card-body">
                        <div className="dc-big-number">{stats.activeTasks}</div>
                        <div className="dc-sub">Aktif Görev</div>
                        <div className="dc-detail">
                            <span>{stats.activeProjects} proje devam ediyor</span>
                        </div>
                    </div>
                </div>

                {/* Health Card */}
                <div className="dash-card">
                    <div className="dash-card-header">
                        <span className="dc-icon">💪</span>
                        <span className="dc-title">Sağlık</span>
                    </div>
                    <div className="dash-card-body">
                        <div className="dc-progress-row">
                            <div className="dc-progress-info">
                                <span className="dc-prog-label">Kalori</span>
                                <span className="dc-prog-val">{stats.todayCalories} / {stats.calorieGoal}</span>
                            </div>
                            <div className="dc-progress-bar">
                                <div className="dc-progress-fill calorie" style={{ width: `${Math.min((stats.todayCalories / stats.calorieGoal) * 100, 100)}%` }} />
                            </div>
                        </div>
                        <div className="dc-progress-row">
                            <div className="dc-progress-info">
                                <span className="dc-prog-label">Protein</span>
                                <span className="dc-prog-val">{stats.todayProtein}g / {stats.proteinGoal}g</span>
                            </div>
                            <div className="dc-progress-bar">
                                <div className="dc-progress-fill protein" style={{ width: `${Math.min((stats.todayProtein / stats.proteinGoal) * 100, 100)}%` }} />
                            </div>
                        </div>
                        <div className="dc-detail">
                            <span>Bu hafta {stats.weekWorkouts}/{stats.workoutGoal} antrenman</span>
                        </div>
                    </div>
                </div>

                {/* Habits Card */}
                <div className="dash-card">
                    <div className="dash-card-header">
                        <span className="dc-icon">🔄</span>
                        <span className="dc-title">Alışkanlıklar</span>
                    </div>
                    <div className="dash-card-body">
                        <div className="dc-big-number">{stats.todayHabitsChecked}<span className="dc-big-sub">/{stats.habitsTotal}</span></div>
                        <div className="dc-sub">Bugün Yapılan</div>
                        {stats.bestHabitStreak > 0 && (
                            <div className="dc-detail streak">
                                <span>🔥 En iyi seri: {stats.bestHabitStreak} gün</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Books Card */}
                <div className="dash-card">
                    <div className="dash-card-header">
                        <span className="dc-icon">📚</span>
                        <span className="dc-title">Kitaplar</span>
                    </div>
                    <div className="dash-card-body">
                        <div className="dc-progress-row">
                            <div className="dc-progress-info">
                                <span className="dc-prog-label">Bu Yıl</span>
                                <span className="dc-prog-val">{stats.booksThisYear} / {stats.bookGoal}</span>
                            </div>
                            <div className="dc-progress-bar">
                                <div className="dc-progress-fill books" style={{ width: `${Math.min((stats.booksThisYear / stats.bookGoal) * 100, 100)}%` }} />
                            </div>
                        </div>
                        <div className="dc-detail">
                            <span>{stats.readingBooks} kitap okunuyor</span>
                        </div>
                    </div>
                </div>

                {/* Goals Card */}
                <div className="dash-card">
                    <div className="dash-card-header">
                        <span className="dc-icon">🎯</span>
                        <span className="dc-title">Hedefler</span>
                    </div>
                    <div className="dash-card-body">
                        <div className="dc-big-number">{stats.activeGoals}</div>
                        <div className="dc-sub">Aktif Hedef</div>
                        <div className="dc-detail">
                            <span>{stats.completedGoals} hedef tamamlandı</span>
                        </div>
                    </div>
                </div>

                {/* Investment Card */}
                <div className="dash-card">
                    <div className="dash-card-header">
                        <span className="dc-icon">💰</span>
                        <span className="dc-title">Yatırım</span>
                    </div>
                    <div className="dash-card-body">
                        <div className="dc-big-number small">₺{stats.totalInvestmentValue.toLocaleString('tr-TR')}</div>
                        <div className="dc-sub">Toplam Değer</div>
                        <div className={`dc-detail ${stats.investmentProfit >= 0 ? 'profit' : 'loss'}`}>
                            <span>{stats.investmentProfit >= 0 ? '▲' : '▼'} ₺{Math.abs(stats.investmentProfit).toLocaleString('tr-TR')} ({stats.investmentProfitPercent}%)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper functions
function getThisWeekDates(): string[] {
    const dates: string[] = [];
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        dates.push(dateToLocalString(date));
    }
    return dates;
}

function getJournalStreak(entries: { date: string }[]): number {
    const dates = [...new Set(entries.map((e) => e.date))].sort().reverse();
    if (dates.length === 0) return 0;
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
        const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (dates.includes(ds)) { streak++; } else if (i > 0) { break; }
        d.setDate(d.getDate() - 1);
    }
    return streak;
}

export default Dashboard;
