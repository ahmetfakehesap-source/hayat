import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import './Dashboard.css';

const Dashboard: React.FC = () => {
    const { data, settings } = useApp();

    // Calculate statistics
    const stats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const thisWeek = getThisWeekDates();

        // Tasks
        const activeTasks = data.tasks.filter((t) => !t.completed);
        const todayTasks = activeTasks.filter((t) =>
            t.createdAt?.startsWith(today)
        );

        // Projects
        const activeProjects = data.projects.filter(
            (p) => p.status === 'in-progress' || p.status === 'planning'
        );

        // Calories
        const todayCalories = data.calorieEntries
            .filter((c) => c.date === today)
            .reduce((sum, c) => sum + c.calories, 0);

        // Workouts
        const weekWorkouts = data.workoutEntries.filter((w) =>
            thisWeek.includes(w.date)
        ).length;

        // Books
        const readingBooks = data.books.filter((b) => b.status === 'reading');
        const completedThisYear = data.books.filter((b) => {
            if (!b.finishDate) return false;
            const year = new Date(b.finishDate).getFullYear();
            return year === new Date().getFullYear() && b.status === 'completed';
        }).length;

        // Goals
        const activeGoals = data.goals.filter((g) => !g.completed);

        // Journal
        const hasJournalToday = data.journalEntries.some((j) => j.date === today);

        // Investment
        const totalInvestmentValue = data.investments.reduce((sum, inv) => {
            return sum + inv.quantity * inv.currentPrice;
        }, 0);

        const totalInvestmentCost = data.investments.reduce((sum, inv) => {
            return sum + inv.quantity * inv.buyPrice;
        }, 0);

        const investmentProfit = totalInvestmentValue - totalInvestmentCost;
        const investmentProfitPercent =
            totalInvestmentCost > 0
                ? ((investmentProfit / totalInvestmentCost) * 100).toFixed(2)
                : '0.00';

        return {
            todayTasks: todayTasks.length,
            activeTasks: activeTasks.length,
            activeProjects: activeProjects.length,
            todayCalories,
            calorieGoal: settings.dailyCalorieGoal,
            weekWorkouts,
            workoutGoal: settings.weeklyWorkoutGoal,
            readingBooks: readingBooks.length,
            booksThisYear: completedThisYear,
            bookGoal: settings.yearlyBookGoal,
            activeGoals: activeGoals.length,
            hasJournalToday,
            totalInvestmentValue,
            investmentProfit,
            investmentProfitPercent,
        };
    }, [data, settings]);

    const motivationalMessages = [
        '🌟 Her gün bir adım daha yakınsın hedeflerine!',
        '💪 Bugün harika bir gün, başarıya ulaşmak için!',
        '🎯 Küçük adımlar büyük değişimlere yol açar!',
        '✨ Kendine inan, her şeyin üstesinden gelebilirsin!',
        '🚀 Bugün dünden daha iyi ol!',
        '🌈 Başarı sabır ve azimle gelir!',
        '💎 Sen değerlisin ve başarıyı hak ediyorsun!',
    ];

    const randomMessage =
        motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Kişisel gelişim yolculuğuna hoş geldin!</p>
                </div>
                <div className="motivational-card card-glass">
                    <p className="motivational-message">{randomMessage}</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {/* Work Card */}
                <div className="stat-card card">
                    <div className="stat-header">
                        <span className="stat-icon">💼</span>
                        <h3 className="stat-title">Kendi İşim</h3>
                    </div>
                    <div className="stat-content">
                        <div className="stat-row">
                            <span>Bugünün Görevleri:</span>
                            <strong>{stats.todayTasks}</strong>
                        </div>
                        <div className="stat-row">
                            <span>Aktif Görevler:</span>
                            <strong>{stats.activeTasks}</strong>
                        </div>
                        <div className="stat-row">
                            <span>Aktif Projeler:</span>
                            <strong>{stats.activeProjects}</strong>
                        </div>
                    </div>
                </div>

                {/* Health Card */}
                <div className="stat-card card">
                    <div className="stat-header">
                        <span className="stat-icon">💪</span>
                        <h3 className="stat-title">Sağlık & Spor</h3>
                    </div>
                    <div className="stat-content">
                        <div className="stat-row">
                            <span>Bugünkü Kalori:</span>
                            <strong>
                                {stats.todayCalories} / {stats.calorieGoal}
                            </strong>
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{
                                    width: `${Math.min((stats.todayCalories / stats.calorieGoal) * 100, 100)}%`,
                                }}
                            />
                        </div>
                        <div className="stat-row">
                            <span>Bu Hafta Antrenman:</span>
                            <strong>
                                {stats.weekWorkouts} / {stats.workoutGoal}
                            </strong>
                        </div>
                    </div>
                </div>

                {/* Books Card */}
                <div className="stat-card card">
                    <div className="stat-header">
                        <span className="stat-icon">📚</span>
                        <h3 className="stat-title">Kitaplar</h3>
                    </div>
                    <div className="stat-content">
                        <div className="stat-row">
                            <span>Okunan (Bu Yıl):</span>
                            <strong>
                                {stats.booksThisYear} / {stats.bookGoal}
                            </strong>
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill success"
                                style={{
                                    width: `${Math.min((stats.booksThisYear / stats.bookGoal) * 100, 100)}%`,
                                }}
                            />
                        </div>
                        <div className="stat-row">
                            <span>Okunuyor:</span>
                            <strong>{stats.readingBooks}</strong>
                        </div>
                    </div>
                </div>

                {/* Goals Card */}
                <div className="stat-card card">
                    <div className="stat-header">
                        <span className="stat-icon">🎯</span>
                        <h3 className="stat-title">Hedeflerim</h3>
                    </div>
                    <div className="stat-content">
                        <div className="stat-row">
                            <span>Aktif Hedefler:</span>
                            <strong>{stats.activeGoals}</strong>
                        </div>
                        {stats.activeGoals > 0 && (
                            <div className="stat-message">
                                Hedeflerine doğru ilerliyorsun! 🚀
                            </div>
                        )}
                    </div>
                </div>

                {/* Journal Card */}
                <div className="stat-card card">
                    <div className="stat-header">
                        <span className="stat-icon">📔</span>
                        <h3 className="stat-title">Günlüğüm</h3>
                    </div>
                    <div className="stat-content">
                        <div className="stat-row">
                            <span>Bugün:</span>
                            <strong>{stats.hasJournalToday ? '✅ Yazıldı' : '❌ Yazılmadı'}</strong>
                        </div>
                        {!stats.hasJournalToday && (
                            <div className="stat-message warning">
                                Bugünkü günlüğünü yazmayı unutma! ✍️
                            </div>
                        )}
                    </div>
                </div>

                {/* Investment Card */}
                <div className="stat-card card">
                    <div className="stat-header">
                        <span className="stat-icon">💰</span>
                        <h3 className="stat-title">Yatırım</h3>
                    </div>
                    <div className="stat-content">
                        <div className="stat-row">
                            <span>Toplam Değer:</span>
                            <strong>₺{stats.totalInvestmentValue.toLocaleString('tr-TR')}</strong>
                        </div>
                        <div className="stat-row">
                            <span>Kar/Zarar:</span>
                            <strong
                                className={stats.investmentProfit >= 0 ? 'profit' : 'loss'}
                            >
                                {stats.investmentProfit >= 0 ? '+' : ''}
                                ₺{stats.investmentProfit.toLocaleString('tr-TR')} (
                                {stats.investmentProfitPercent}%)
                            </strong>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <h2 className="section-title">Hızlı Erişim</h2>
                <div className="action-buttons">
                    <button className="action-btn card">
                        <span className="action-icon">✅</span>
                        <span>Görev Ekle</span>
                    </button>
                    <button className="action-btn card">
                        <span className="action-icon">🍽️</span>
                        <span>Kalori Gir</span>
                    </button>
                    <button className="action-btn card">
                        <span className="action-icon">🏋️</span>
                        <span>Antrenman Ekle</span>
                    </button>
                    <button className="action-btn card">
                        <span className="action-icon">✍️</span>
                        <span>Günlük Yaz</span>
                    </button>
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
        dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
}

export default Dashboard;
