import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateId } from '../utils/storage';
import type { ScheduleEntry } from '../types';
import './Schedule.css';

const SchedulePage: React.FC = () => {
    const { data, updateData } = useApp();
    const [editingEntry, setEditingEntry] = useState<ScheduleEntry | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    // Inline form state
    const [entryDay, setEntryDay] = useState<ScheduleEntry['day']>('monday');
    const [entryTime, setEntryTime] = useState('');
    const [entryActivity, setEntryActivity] = useState('');
    const [entryCategory, setEntryCategory] = useState('');
    const [showExpand, setShowExpand] = useState(false);

    const days: ScheduleEntry['day'][] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    const dayNames = {
        monday: 'Pazartesi',
        tuesday: 'Salı',
        wednesday: 'Çarşamba',
        thursday: 'Perşembe',
        friday: 'Cuma',
        saturday: 'Cumartesi',
        sunday: 'Pazar',
    };

    const handleAddInline = () => {
        if (!entryActivity.trim() || !entryTime) return;

        const newEntry: ScheduleEntry = {
            id: generateId(),
            day: entryDay,
            time: entryTime,
            activity: entryActivity.trim(),
            category: entryCategory || undefined,
        };

        updateData({ schedule: [...data.schedule, newEntry] });
        setEntryActivity('');
        setEntryTime('');
        setEntryCategory('');
    };

    const handleEditEntry = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingEntry) return;
        const formData = new FormData(e.currentTarget);

        const updatedEntry: ScheduleEntry = {
            ...editingEntry,
            day: formData.get('day') as ScheduleEntry['day'],
            time: formData.get('time') as string,
            activity: formData.get('activity') as string,
            category: formData.get('category') as string || undefined,
        };

        updateData({ schedule: data.schedule.map((e) => (e.id === editingEntry.id ? updatedEntry : e)) });
        setShowEditModal(false);
        setEditingEntry(null);
    };

    const handleDeleteEntry = (id: string) => {
        if (confirm('Bu program girişini silmek istediğinize emin misiniz?')) {
            updateData({ schedule: data.schedule.filter((e) => e.id !== id) });
        }
    };

    const getEntriesForDay = (day: ScheduleEntry['day']) => {
        return data.schedule
            .filter((e) => e.day === day)
            .sort((a, b) => a.time.localeCompare(b.time));
    };

    return (
        <div className="schedule-page">
            <div className="page-header">
                <h1 className="page-title">📅 Haftalık Program</h1>
                <p className="page-subtitle">Haftanı planla ve düzenli ol</p>
            </div>

            {/* Inline Quick-Add */}
            <div className="inline-form">
                <div className="inline-form-row">
                    <div className="inline-field field-select">
                        <label>Gün</label>
                        <select value={entryDay} onChange={(e) => setEntryDay(e.target.value as ScheduleEntry['day'])}>
                            <option value="monday">Pazartesi</option>
                            <option value="tuesday">Salı</option>
                            <option value="wednesday">Çarşamba</option>
                            <option value="thursday">Perşembe</option>
                            <option value="friday">Cuma</option>
                            <option value="saturday">Cumartesi</option>
                            <option value="sunday">Pazar</option>
                        </select>
                    </div>
                    <div className="inline-field field-sm">
                        <label>Saat</label>
                        <input type="time" value={entryTime} onChange={(e) => setEntryTime(e.target.value)} />
                    </div>
                    <div className="inline-field">
                        <label>Etkinlik</label>
                        <input
                            type="text"
                            placeholder="Spor, Ders, Toplantı..."
                            value={entryActivity}
                            onChange={(e) => setEntryActivity(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddInline(); }}
                        />
                    </div>
                    <button className="btn-add" onClick={handleAddInline}>➕ Ekle</button>
                </div>
                <button className="expand-toggle" onClick={() => setShowExpand(!showExpand)}>
                    {showExpand ? '▲ Gizle' : '▼ Kategori'}
                </button>
                {showExpand && (
                    <div className="expand-area">
                        <div className="inline-form-row">
                            <div className="inline-field">
                                <label>Kategori</label>
                                <input
                                    type="text"
                                    placeholder="Sağlık, Eğitim, İş..."
                                    value={entryCategory}
                                    onChange={(e) => setEntryCategory(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="schedule-grid">
                {days.map((day) => {
                    const entries = getEntriesForDay(day);
                    return (
                        <div key={day} className="day-card card">
                            <div className="day-header">
                                <h3 className="day-name">{dayNames[day]}</h3>
                                <span className="entry-count">{entries.length}</span>
                            </div>
                            <div className="day-entries">
                                {entries.length === 0 ? (
                                    <div className="no-entries">Etkinlik yok</div>
                                ) : (
                                    entries.map((entry) => (
                                        <div key={entry.id} className="schedule-entry">
                                            <div className="entry-time">{entry.time}</div>
                                            <div className="entry-content">
                                                <div className="entry-activity">{entry.activity}</div>
                                                {entry.category && (
                                                    <div className="entry-category">{entry.category}</div>
                                                )}
                                            </div>
                                            <div className="entry-actions">
                                                <button className="btn-icon-small" onClick={() => { setEditingEntry(entry); setShowEditModal(true); }}>
                                                    ✏️
                                                </button>
                                                <button className="btn-icon-small delete" onClick={() => handleDeleteEntry(entry.id)}>
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Edit Modal */}
            {showEditModal && editingEntry && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Etkinlik Düzenle</h2>
                            <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleEditEntry}>
                            <div className="input-group">
                                <label>Gün *</label>
                                <select name="day" className="select" defaultValue={editingEntry.day} required>
                                    <option value="monday">Pazartesi</option>
                                    <option value="tuesday">Salı</option>
                                    <option value="wednesday">Çarşamba</option>
                                    <option value="thursday">Perşembe</option>
                                    <option value="friday">Cuma</option>
                                    <option value="saturday">Cumartesi</option>
                                    <option value="sunday">Pazar</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Saat *</label>
                                <input name="time" type="time" className="input" defaultValue={editingEntry.time} required />
                            </div>
                            <div className="input-group">
                                <label>Etkinlik *</label>
                                <input name="activity" type="text" className="input" defaultValue={editingEntry.activity} required />
                            </div>
                            <div className="input-group">
                                <label>Kategori</label>
                                <input name="category" type="text" className="input" defaultValue={editingEntry.category} />
                            </div>
                            <button type="submit" className="btn btn-primary">Güncelle</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SchedulePage;
