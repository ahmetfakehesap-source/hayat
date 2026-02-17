import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateId, formatDate, downloadFile } from '../utils/storage';
import type { JournalEntry } from '../types';
import './Journal.css';

const Journal: React.FC = () => {
    const { data, updateData } = useApp();
    const [showModal, setShowModal] = useState(false);
    const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

    const handleAddEntry = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const newEntry: JournalEntry = {
            id: editingEntry?.id || generateId(),
            date: formData.get('date') as string,
            content: formData.get('content') as string,
            mood: formData.get('mood') as JournalEntry['mood'],
            tags: (formData.get('tags') as string).split(',').map(t => t.trim()).filter(t => t),
        };

        if (editingEntry) {
            updateData({ journalEntries: data.journalEntries.map((e) => (e.id === editingEntry.id ? newEntry : e)) });
        } else {
            updateData({ journalEntries: [...data.journalEntries, newEntry] });
        }

        setShowModal(false);
        setEditingEntry(null);
        e.currentTarget.reset();
    };

    const handleDeleteEntry = (id: string) => {
        if (confirm('Bu günlük girişini silmek istediğinize emin misiniz?')) {
            updateData({ journalEntries: data.journalEntries.filter((e) => e.id !== id) });
        }
    };

    const handleExport = () => {
        const content = data.journalEntries
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((entry) => {
                const moodEmoji = {
                    'very-happy': '😄',
                    'happy': '😊',
                    'neutral': '😐',
                    'sad': '😢',
                    'very-sad': '😭',
                }[entry.mood];

                return `\n${formatDate(entry.date)} ${moodEmoji}\n${entry.tags?.length ? `Etiketler: ${entry.tags.join(', ')}\n` : ''}\n${entry.content}\n${'='.repeat(50)}`;
            })
            .join('\n');

        downloadFile(content, `gunlugum-${new Date().toISOString().split('T')[0]}.txt`);
    };

    const filteredEntries = data.journalEntries
        .filter((e) => {
            if (searchQuery && !e.content.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }
            if (selectedMonth && !e.date.startsWith(selectedMonth)) {
                return false;
            }
            return true;
        })
        .sort((a, b) => b.date.localeCompare(a.date));

    const moodStats = () => {
        const counts = {
            'very-happy': 0,
            'happy': 0,
            'neutral': 0,
            'sad': 0,
            'very-sad': 0,
        };
        data.journalEntries.forEach((e) => counts[e.mood]++);
        return counts;
    };

    const stats = moodStats();

    return (
        <div className="journal-page">
            <div className="page-header">
                <h1 className="page-title">📔 Günlüğüm</h1>
                <p className="page-subtitle">Günlük yazılarını kaydet ve ruh halini takip et</p>
            </div>

            {/* Stats */}
            <div className="mood-stats grid-5">
                <div className="mood-box card">
                    <div className="mood-emoji">😄</div>
                    <div className="mood-count">{stats['very-happy']}</div>
                    <div className="mood-label">Çok Mutlu</div>
                </div>
                <div className="mood-box card">
                    <div className="mood-emoji">😊</div>
                    <div className="mood-count">{stats['happy']}</div>
                    <div className="mood-label">Mutlu</div>
                </div>
                <div className="mood-box card">
                    <div className="mood-emoji">😐</div>
                    <div className="mood-count">{stats['neutral']}</div>
                    <div className="mood-label">Normal</div>
                </div>
                <div className="mood-box card">
                    <div className="mood-emoji">😢</div>
                    <div className="mood-count">{stats['sad']}</div>
                    <div className="mood-label">Üzgün</div>
                </div>
                <div className="mood-box card">
                    <div className="mood-emoji">😭</div>
                    <div className="mood-count">{stats['very-sad']}</div>
                    <div className="mood-label">Çok Üzgün</div>
                </div>
            </div>

            <div className="section-header">
                <div className="controls">
                    <input
                        type="text"
                        placeholder="🔍 Ara..."
                        className="input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <input
                        type="month"
                        className="input"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    />
                </div>
                <div className="header-actions">
                    <button className="btn btn-secondary" onClick={handleExport}>
                        💾 Dışa Aktar
                    </button>
                    <button className="btn btn-primary" onClick={() => { setEditingEntry(null); setShowModal(true); }}>
                        ➕ Günlük Yaz
                    </button>
                </div>
            </div>

            <div className="entries-list">
                {filteredEntries.length === 0 ? (
                    <div className="empty-state card">
                        <p>📔 {searchQuery || selectedMonth ? 'Giriş bulunamadı' : 'Henüz günlük girişi yok'}</p>
                    </div>
                ) : (
                    filteredEntries.map((entry) => (
                        <div key={entry.id} className="journal-entry card">
                            <div className="entry-header">
                                <div className="entry-info">
                                    <span className="entry-date">{formatDate(entry.date)}</span>
                                    <span className="entry-mood">
                                        {entry.mood === 'very-happy' && '😄'}
                                        {entry.mood === 'happy' && '😊'}
                                        {entry.mood === 'neutral' && '😐'}
                                        {entry.mood === 'sad' && '😢'}
                                        {entry.mood === 'very-sad' && '😭'}
                                    </span>
                                </div>
                                <div className="entry-actions">
                                    <button className="btn-icon" onClick={() => { setEditingEntry(entry); setShowModal(true); }}>
                                        ✏️
                                    </button>
                                    <button className="btn-icon delete" onClick={() => handleDeleteEntry(entry.id)}>
                                        🗑️
                                    </button>
                                </div>
                            </div>
                            <div className="entry-content">{entry.content}</div>
                            {entry.tags && entry.tags.length > 0 && (
                                <div className="entry-tags">
                                    {entry.tags.map((tag, i) => (
                                        <span key={i} className="tag">{tag}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal large" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingEntry ? 'Günlük Düzenle' : 'Günlük Yaz'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleAddEntry}>
                            <div className="input-group">
                                <label>Tarih *</label>
                                <input
                                    name="date"
                                    type="date"
                                    className="input"
                                    defaultValue={editingEntry?.date || new Date().toISOString().split('T')[0]}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label>Ruh Hali *</label>
                                <select name="mood" className="select" defaultValue={editingEntry?.mood || 'neutral'} required>
                                    <option value="very-happy">😄 Çok Mutlu</option>
                                    <option value="happy">😊 Mutlu</option>
                                    <option value="neutral">😐 Normal</option>
                                    <option value="sad">😢 Üzgün</option>
                                    <option value="very-sad">😭 Çok Üzgün</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Günlük *</label>
                                <textarea
                                    name="content"
                                    className="textarea journal-textarea"
                                    defaultValue={editingEntry?.content}
                                    placeholder="Bugün neler oldu?..."
                                    required
                                ></textarea>
                            </div>
                            <div className="input-group">
                                <label>Etiketler (virgülle ayırın)</label>
                                <input
                                    name="tags"
                                    type="text"
                                    className="input"
                                    placeholder="Örn: iş, spor, aile"
                                    defaultValue={editingEntry?.tags?.join(', ')}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary">{editingEntry ? 'Güncelle' : 'Kaydet'}</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Journal;
