import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateId, formatDate } from '../utils/storage';
import type { Goal } from '../types';
import './Goals.css';

const GoalsPage: React.FC = () => {
    const { data, updateData } = useApp();
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
    const [showExpand, setShowExpand] = useState(false);

    // Inline form state
    const [goalTitle, setGoalTitle] = useState('');
    const [goalCategory, setGoalCategory] = useState<Goal['category']>('personal');
    const [goalDeadline, setGoalDeadline] = useState('');
    const [goalNotes, setGoalNotes] = useState('');

    const handleAddGoalInline = () => {
        if (!goalTitle.trim()) return;

        const newGoal: Goal = {
            id: generateId(),
            title: goalTitle.trim(),
            category: goalCategory,
            deadline: goalDeadline || undefined,
            completed: false,
            notes: goalNotes || undefined,
        };

        updateData({ goals: [...data.goals, newGoal] });
        setGoalTitle('');
        setGoalCategory('personal');
        setGoalDeadline('');
        setGoalNotes('');
        setShowExpand(false);
    };

    const handleEditGoal = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingGoal) return;
        const formData = new FormData(e.currentTarget);

        const updatedGoal: Goal = {
            ...editingGoal,
            title: formData.get('title') as string,
            category: formData.get('category') as Goal['category'],
            deadline: formData.get('deadline') as string || undefined,
            notes: formData.get('notes') as string || undefined,
        };

        updateData({ goals: data.goals.map((g) => (g.id === editingGoal.id ? updatedGoal : g)) });
        setShowEditModal(false);
        setEditingGoal(null);
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

            {/* Inline Quick-Add Goal */}
            <div className="inline-form">
                <div className="inline-form-row">
                    <div className="inline-field">
                        <label>Hedef</label>
                        <input
                            type="text"
                            placeholder="Yeni hedef yaz..."
                            value={goalTitle}
                            onChange={(e) => setGoalTitle(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !showExpand) handleAddGoalInline(); }}
                        />
                    </div>
                    <div className="inline-field field-select">
                        <label>Kategori</label>
                        <select value={goalCategory} onChange={(e) => setGoalCategory(e.target.value as Goal['category'])}>
                            <option value="work">💼 İş</option>
                            <option value="health">💪 Sağlık</option>
                            <option value="education">📚 Eğitim</option>
                            <option value="finance">💰 Finans</option>
                            <option value="personal">🌟 Kişisel</option>
                            <option value="other">🎯 Diğer</option>
                        </select>
                    </div>
                    <div className="inline-field field-md">
                        <label>Son Tarih</label>
                        <input type="date" value={goalDeadline} onChange={(e) => setGoalDeadline(e.target.value)} />
                    </div>
                    <button className="btn-add" onClick={handleAddGoalInline}>➕ Ekle</button>
                </div>
                <button className="expand-toggle" onClick={() => setShowExpand(!showExpand)}>
                    {showExpand ? '▲ Gizle' : '▼ Detaylar'}
                </button>
                {showExpand && (
                    <div className="expand-area">
                        <div className="inline-form-row">
                            <div className="inline-field">
                                <label>Notlar</label>
                                <textarea
                                    placeholder="Hedef hakkında notlar..."
                                    value={goalNotes}
                                    onChange={(e) => setGoalNotes(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                )}
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
                                                {isOverdue(goal.deadline) && <span className="overdue-badge">GECİKMİŞ</span>}
                                            </div>
                                        )}
                                        {goal.notes && (
                                            <div className="goal-notes">{goal.notes}</div>
                                        )}
                                    </div>
                                    <div className="goal-actions">
                                        <button className="btn btn-secondary btn-sm" onClick={() => { setEditingGoal(goal); setShowEditModal(true); }}>
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
                                        <button className="btn btn-secondary btn-sm" onClick={() => { setEditingGoal(goal); setShowEditModal(true); }}>
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

            {/* Edit Modal (only for editing existing goals) */}
            {showEditModal && editingGoal && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Hedef Düzenle</h2>
                            <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleEditGoal}>
                            <div className="input-group">
                                <label>Hedef *</label>
                                <input name="title" type="text" className="input" defaultValue={editingGoal.title} required />
                            </div>
                            <div className="input-group">
                                <label>Kategori *</label>
                                <select name="category" className="select" defaultValue={editingGoal.category} required>
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
                                <input name="deadline" type="date" className="input" defaultValue={editingGoal.deadline} />
                            </div>
                            <div className="input-group">
                                <label>Notlar</label>
                                <textarea name="notes" className="textarea" defaultValue={editingGoal.notes}></textarea>
                            </div>
                            <button type="submit" className="btn btn-primary">Güncelle</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GoalsPage;
