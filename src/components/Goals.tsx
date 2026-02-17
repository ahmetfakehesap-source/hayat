import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateId, formatDate } from '../utils/storage';
import type { Goal } from '../types';
import './Goals.css';

const GoalsPage: React.FC = () => {
    const { data, updateData } = useApp();
    const [showModal, setShowModal] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

    const handleAddGoal = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const newGoal: Goal = {
            id: editingGoal?.id || generateId(),
            title: formData.get('title') as string,
            category: formData.get('category') as Goal['category'],
            deadline: formData.get('deadline') as string || undefined,
            completed: editingGoal?.completed || false,
            completedDate: editingGoal?.completedDate,
            notes: formData.get('notes') as string || undefined,
        };

        if (editingGoal) {
            updateData({ goals: data.goals.map((g) => (g.id === editingGoal.id ? newGoal : g)) });
        } else {
            updateData({ goals: [...data.goals, newGoal] });
        }

        setShowModal(false);
        setEditingGoal(null);
        e.currentTarget.reset();
    };

    const handleToggleComplete = (id: string) => {
        updateData({
            goals: data.goals.map((g) => {
                if (g.id === id) {
                    return {
                        ...g,
                        completed: !g.completed,
                        completedDate: !g.completed ? new Date().toISOString().split('T')[0] : undefined,
                    };
                }
                return g;
            }),
        });
    };

    const handleDeleteGoal = (id: string) => {
        if (confirm('Bu hedefi silmek istediğinize emin misiniz?')) {
            updateData({ goals: data.goals.filter((g) => g.id !== id) });
        }
    };

    const activeGoals = data.goals.filter((g) => !g.completed);
    const completedGoals = data.goals.filter((g) => g.completed).sort((a, b) =>
        (b.completedDate || '').localeCompare(a.completedDate || '')
    );

    const getCategoryIcon = (category: Goal['category']) => {
        const icons = {
            work: '💼',
            health: '💪',
            education: '📚',
            finance: '💰',
            personal: '🌟',
            other: '🎯',
        };
        return icons[category];
    };

    const isOverdue = (deadline?: string) => {
        if (!deadline) return false;
        return new Date(deadline) < new Date();
    };

    return (
        <div className="goals-page">
            <div className="page-header">
                <h1 className="page-title">🎯 Hedefler</h1>
                <p className="page-subtitle">Hayat hedeflerini belirle ve takip et</p>
            </div>

            {/* Stats */}
            <div className="goals-stats grid-3">
                <div className="stat-box card">
                    <div className="stat-label">Aktif Hedefler</div>
                    <div className="stat-value">{activeGoals.length}</div>
                </div>
                <div className="stat-box card">
                    <div className="stat-label">Tamamlanan</div>
                    <div className="stat-value success">{completedGoals.length}</div>
                </div>
                <div className="stat-box card">
                    <div className="stat-label">Toplam</div>
                    <div className="stat-value">{data.goals.length}</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'active' ? 'active' : ''}`}
                    onClick={() => setActiveTab('active')}
                >
                    🎯 Aktif ({activeGoals.length})
                </button>
                <button
                    className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
                    onClick={() => setActiveTab('completed')}
                >
                    ✅ Tamamlanan ({completedGoals.length})
                </button>
            </div>

            <div className="section-header">
                <h2>{activeTab === 'active' ? 'Aktif Hedefler' : 'Tamamlanan Hedefler'}</h2>
                <button className="btn btn-primary" onClick={() => { setEditingGoal(null); setShowModal(true); }}>
                    ➕ Hedef Ekle
                </button>
            </div>

            {/* Active Goals */}
            {activeTab === 'active' && (
                <div className="tab-content fade-in">
                    <div className="goals-list">
                        {activeGoals.length === 0 ? (
                            <div className="empty-state card">
                                <p>🎯 Henüz aktif hedef yok</p>
                            </div>
                        ) : (
                            activeGoals.map((goal) => (
                                <div key={goal.id} className={`goal-card card ${isOverdue(goal.deadline) ? 'overdue' : ''}`}>
                                    <div className="goal-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={goal.completed}
                                            onChange={() => handleToggleComplete(goal.id)}
                                        />
                                    </div>
                                    <div className="goal-content">
                                        <div className="goal-header">
                                            <span className="goal-icon">{getCategoryIcon(goal.category)}</span>
                                            <h3 className="goal-title">{goal.title}</h3>
                                        </div>
                                        {goal.deadline && (
                                            <div className={`goal-deadline ${isOverdue(goal.deadline) ? 'overdue' : ''}`}>
                                                📅 {formatDate(goal.deadline)}
                                                {isOverdue(goal.deadline) && <span className="overdue-badge">GECIKMIŞ</span>}
                                            </div>
                                        )}
                                        {goal.notes && (
                                            <div className="goal-notes">{goal.notes}</div>
                                        )}
                                    </div>
                                    <div className="goal-actions">
                                        <button className="btn btn-secondary btn-sm" onClick={() => { setEditingGoal(goal); setShowModal(true); }}>
                                            ✏️ Düzenle
                                        </button>
                                        <button className="btn btn-secondary btn-sm delete" onClick={() => handleDeleteGoal(goal.id)}>
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Completed Goals */}
            {activeTab === 'completed' && (
                <div className="tab-content fade-in">
                    <div className="goals-list">
                        {completedGoals.length === 0 ? (
                            <div className="empty-state card">
                                <p>✅ Henüz tamamlanmış hedef yok</p>
                            </div>
                        ) : (
                            completedGoals.map((goal) => (
                                <div key={goal.id} className="goal-card card completed">
                                    <div className="goal-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={goal.completed}
                                            onChange={() => handleToggleComplete(goal.id)}
                                        />
                                    </div>
                                    <div className="goal-content">
                                        <div className="goal-header">
                                            <span className="goal-icon">{getCategoryIcon(goal.category)}</span>
                                            <h3 className="goal-title">{goal.title}</h3>
                                        </div>
                                        {goal.completedDate && (
                                            <div className="goal-completed">
                                                ✅ Tamamlandı: {formatDate(goal.completedDate)}
                                            </div>
                                        )}
                                        {goal.notes && (
                                            <div className="goal-notes">{goal.notes}</div>
                                        )}
                                    </div>
                                    <div className="goal-actions">
                                        <button className="btn btn-secondary btn-sm" onClick={() => { setEditingGoal(goal); setShowModal(true); }}>
                                            ✏️ Düzenle
                                        </button>
                                        <button className="btn btn-secondary btn-sm delete" onClick={() => handleDeleteGoal(goal.id)}>
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingGoal ? 'Hedef Düzenle' : 'Hedef Ekle'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleAddGoal}>
                            <div className="input-group">
                                <label>Hedef *</label>
                                <input name="title" type="text" className="input" placeholder="Hedefini açıkla" defaultValue={editingGoal?.title} required />
                            </div>
                            <div className="input-group">
                                <label>Kategori *</label>
                                <select name="category" className="select" defaultValue={editingGoal?.category || 'personal'} required>
                                    <option value="work">💼 İş</option>
                                    <option value="health">💪 Sağlık</option>
                                    <option value="education">📚 Eğitim</option>
                                    <option value="finance">💰 Finans</option>
                                    <option value="personal">🌟 Kişisel</option>
                                    <option value="other">🎯 Diğer</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Son Tarih</label>
                                <input name="deadline" type="date" className="input" defaultValue={editingGoal?.deadline} />
                            </div>
                            <div className="input-group">
                                <label>Notlar</label>
                                <textarea name="notes" className="textarea" placeholder="Hedef hakkında notlar..." defaultValue={editingGoal?.notes}></textarea>
                            </div>
                            <button type="submit" className="btn btn-primary">{editingGoal ? 'Güncelle' : 'Ekle'}</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GoalsPage;
