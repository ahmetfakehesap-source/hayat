import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateId } from '../utils/storage';
import type { ScheduleEntry } from '../types';
import './Schedule.css';

const SchedulePage: React.FC = () => {
    const { data, updateData } = useApp();
    const [showModal, setShowModal] = useState(false);
    const [editingEntry, setEditingEntry] = useState<ScheduleEntry | null>(null);

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

    const handleAddEntry = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const newEntry: ScheduleEntry = {
            id: editingEntry?.id || generateId(),
            day: formData.get('day') as ScheduleEntry['day'],
            time: formData.get('time') as string,
            activity: formData.get('activity') as string,
            category: formData.get('category') as string || undefined,
        };

        if (editingEntry) {
            updateData({ schedule: data.schedule.map((e) => (e.id === editingEntry.id ? newEntry : e)) });
        } else {
            updateData({ schedule: [...data.schedule, newEntry] });
        }

        setShowModal(false);
        setEditingEntry(null);
        e.currentTarget.reset();
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

            <div className="section-header">
                <h2>Haftalık Planlama</h2>
                <button className="btn btn-primary" onClick={() => { setEditingEntry(null); setShowModal(true); }}>
                    ➕ Etkinlik Ekle
                </button>
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
                                                <button className="btn-icon-small" onClick={() => { setEditingEntry(entry); setShowModal(true); }}>
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

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingEntry ? 'Etkinlik Düzenle' : 'Etkinlik Ekle'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleAddEntry}>
                            <div className="input-group">
                                <label>Gün *</label>
                                <select name="day" className="select" defaultValue={editingEntry?.day || 'monday'} required>
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
                                <input name="time" type="time" className="input" defaultValue={editingEntry?.time} required />
                            </div>
                            <div className="input-group">
                                <label>Etkinlik *</label>
                                <input name="activity" type="text" className="input" placeholder="Örn: Spor, Ders" defaultValue={editingEntry?.activity} required />
                            </div>
                            <div className="input-group">
                                <label>Kategori</label>
                                <input name="category" type="text" className="input" placeholder="Örn: Sağlık, Eğitim" defaultValue={editingEntry?.category} />
                            </div>
                            <button type="submit" className="btn btn-primary">{editingEntry ? 'Güncelle' : 'Ekle'}</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SchedulePage;
