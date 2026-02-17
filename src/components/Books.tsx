import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { generateId, formatDate } from '../utils/storage';
import type { Book } from '../types';
import './Books.css';

const Books: React.FC = () => {
    const { data, updateData, settings } = useApp();
    const [showModal, setShowModal] = useState(false);
    const [editingBook, setEditingBook] = useState<Book | null>(null);
    const [activeTab, setActiveTab] = useState<'reading' | 'completed' | 'want-to-read'>('reading');

    const handleAddBook = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const newBook: Book = {
            id: editingBook?.id || generateId(),
            title: formData.get('title') as string,
            author: formData.get('author') as string,
            status: formData.get('status') as Book['status'],
            totalPages: Number(formData.get('totalPages')) || undefined,
            currentPage: formData.get('status') === 'reading' ? Number(formData.get('currentPage')) || 0 : undefined,
            rating: formData.get('status') === 'completed' ? Number(formData.get('rating')) || undefined : undefined,
            review: formData.get('review') as string || undefined,
            startDate: formData.get('startDate') as string || undefined,
            finishDate: formData.get('status') === 'completed' ? formData.get('finishDate') as string || undefined : undefined,
        };

        if (editingBook) {
            updateData({ books: data.books.map((b) => (b.id === editingBook.id ? newBook : b)) });
        } else {
            updateData({ books: [...data.books, newBook] });
        }

        setShowModal(false);
        setEditingBook(null);
        e.currentTarget.reset();
    };

    const handleDeleteBook = (id: string) => {
        if (confirm('Bu kitabı silmek istediğinize emin misiniz?')) {
            updateData({ books: data.books.filter((b) => b.id !== id) });
        }
    };

    const stats = useMemo(() => {
        const completed = data.books.filter((b) => b.status === 'completed');
        const currentYear = new Date().getFullYear();
        const completedThisYear = completed.filter((b) => {
            if (!b.finishDate) return false;
            return new Date(b.finishDate).getFullYear() === currentYear;
        });

        return {
            reading: data.books.filter((b) => b.status === 'reading').length,
            completed: completed.length,
            completedThisYear: completedThisYear.length,
            wantToRead: data.books.filter((b) => b.status === 'want-to-read').length,
            yearlyGoal: settings.yearlyBookGoal,
        };
    }, [data.books, settings.yearlyBookGoal]);

    const readingBooks = data.books.filter((b) => b.status === 'reading');
    const completedBooks = data.books.filter((b) => b.status === 'completed').sort((a, b) =>
        (b.finishDate || '').localeCompare(a.finishDate || '')
    );
    const wantToReadBooks = data.books.filter((b) => b.status === 'want-to-read');

    return (
        <div className="books-page">
            <div className="page-header">
                <h1 className="page-title">📚 Kitaplar</h1>
                <p className="page-subtitle">Okuma takibinizi yapın ve hedeflere ulaşın</p>
            </div>

            {/* Stats */}
            <div className="books-stats grid-4">
                <div className="stat-box card">
                    <div className="stat-label">Bu Yıl Okunan</div>
                    <div className="stat-value">{stats.completedThisYear} / {stats.yearlyGoal}</div>
                    <div className="progress-bar">
                        <div
                            className="progress-fill success"
                            style={{ width: `${Math.min((stats.completedThisYear / stats.yearlyGoal) * 100, 100)}%` }}
                        />
                    </div>
                </div>
                <div className="stat-box card">
                    <div className="stat-label">Okunuyor</div>
                    <div className="stat-value">{stats.reading}</div>
                </div>
                <div className="stat-box card">
                    <div className="stat-label">Toplam Okunan</div>
                    <div className="stat-value">{stats.completed}</div>
                </div>
                <div className="stat-box card">
                    <div className="stat-label">Okunacak</div>
                    <div className="stat-value">{stats.wantToRead}</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'reading' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reading')}
                >
                    📖 Okunuyor ({stats.reading})
                </button>
                <button
                    className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
                    onClick={() => setActiveTab('completed')}
                >
                    ✅ Tamamlanan ({stats.completed})
                </button>
                <button
                    className={`tab ${activeTab === 'want-to-read' ? 'active' : ''}`}
                    onClick={() => setActiveTab('want-to-read')}
                >
                    📋 Okunacak ({stats.wantToRead})
                </button>
            </div>

            <div className="section-header">
                <h2>{activeTab === 'reading' ? 'Okunuyor' : activeTab === 'completed' ? 'Tamamlanan' : 'Okunacak'}</h2>
                <button className="btn btn-primary" onClick={() => { setEditingBook(null); setShowModal(true); }}>
                    ➕ Kitap Ekle
                </button>
            </div>

            {/* Reading Books */}
            {activeTab === 'reading' && (
                <div className="tab-content fade-in">
                    <div className="books-list">
                        {readingBooks.length === 0 ? (
                            <div className="empty-state card">
                                <p>📖 Şu an okuduğun kitap yok</p>
                            </div>
                        ) : (
                            readingBooks.map((book) => (
                                <div key={book.id} className="book-card card">
                                    <div className="book-icon">📖</div>
                                    <div className="book-content">
                                        <h3 className="book-title">{book.title}</h3>
                                        <div className="book-author">{book.author}</div>
                                        {book.totalPages && (
                                            <div className="book-progress">
                                                <div className="progress-info">
                                                    <span>Sayfa {book.currentPage || 0} / {book.totalPages}</span>
                                                    <span>{Math.round(((book.currentPage || 0) / book.totalPages) * 100)}%</span>
                                                </div>
                                                <div className="progress-bar">
                                                    <div
                                                        className="progress-fill"
                                                        style={{ width: `${((book.currentPage || 0) / book.totalPages) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {book.startDate && (
                                            <div className="book-date">Başlangıç: {formatDate(book.startDate)}</div>
                                        )}
                                    </div>
                                    <div className="book-actions">
                                        <button className="btn btn-secondary btn-sm" onClick={() => { setEditingBook(book); setShowModal(true); }}>
                                            ✏️ Düzenle
                                        </button>
                                        <button className="btn btn-secondary btn-sm delete" onClick={() => handleDeleteBook(book.id)}>
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Completed Books */}
            {activeTab === 'completed' && (
                <div className="tab-content fade-in">
                    <div className="books-grid">
                        {completedBooks.length === 0 ? (
                            <div className="empty-state card">
                                <p>✅ Henüz tamamlanmış kitap yok</p>
                            </div>
                        ) : (
                            completedBooks.map((book) => (
                                <div key={book.id} className="completed-book-card card">
                                    <div className="book-header">
                                        <h3 className="book-title">{book.title}</h3>
                                        {book.rating && (
                                            <div className="book-rating">
                                                {'⭐'.repeat(book.rating)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="book-author">{book.author}</div>
                                    {book.finishDate && (
                                        <div className="book-date">Bitiş: {formatDate(book.finishDate)}</div>
                                    )}
                                    {book.review && (
                                        <div className="book-review">
                                            <strong>Yorum:</strong>
                                            <p>{book.review}</p>
                                        </div>
                                    )}
                                    <div className="book-actions">
                                        <button className="btn btn-secondary btn-sm" onClick={() => { setEditingBook(book); setShowModal(true); }}>
                                            ✏️ Düzenle
                                        </button>
                                        <button className="btn btn-secondary btn-sm delete" onClick={() => handleDeleteBook(book.id)}>
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Want to Read Books */}
            {activeTab === 'want-to-read' && (
                <div className="tab-content fade-in">
                    <div className="books-list">
                        {wantToReadBooks.length === 0 ? (
                            <div className="empty-state card">
                                <p>📋 Okumak istediğin kitap listesi boş</p>
                            </div>
                        ) : (
                            wantToReadBooks.map((book) => (
                                <div key={book.id} className="book-card simple card">
                                    <div className="book-icon">📋</div>
                                    <div className="book-content">
                                        <h3 className="book-title">{book.title}</h3>
                                        <div className="book-author">{book.author}</div>
                                    </div>
                                    <div className="book-actions">
                                        <button className="btn btn-secondary btn-sm" onClick={() => { setEditingBook(book); setShowModal(true); }}>
                                            ✏️ Düzenle
                                        </button>
                                        <button className="btn btn-secondary btn-sm delete" onClick={() => handleDeleteBook(book.id)}>
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
                            <h2 className="modal-title">{editingBook ? 'Kitap Düzenle' : 'Kitap Ekle'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleAddBook}>
                            <div className="input-group">
                                <label>Kitap Adı *</label>
                                <input name="title" type="text" className="input" defaultValue={editingBook?.title} required />
                            </div>
                            <div className="input-group">
                                <label>Yazar *</label>
                                <input name="author" type="text" className="input" defaultValue={editingBook?.author} required />
                            </div>
                            <div className="input-group">
                                <label>Durum *</label>
                                <select name="status" className="select" defaultValue={editingBook?.status || 'want-to-read'} required>
                                    <option value="reading">Okunuyor</option>
                                    <option value="completed">Tamamlandı</option>
                                    <option value="want-to-read">Okunacak</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Toplam Sayfa</label>
                                <input name="totalPages" type="number" className="input" defaultValue={editingBook?.totalPages} />
                            </div>
                            <div className="input-group">
                                <label>Şu Anki Sayfa (Okunuyor ise)</label>
                                <input name="currentPage" type="number" className="input" defaultValue={editingBook?.currentPage} />
                            </div>
                            <div className="input-group">
                                <label>Başlangıç Tarihi</label>
                                <input name="startDate" type="date" className="input" defaultValue={editingBook?.startDate} />
                            </div>
                            <div className="input-group">
                                <label>Bitiş Tarihi (Tamamlandı ise)</label>
                                <input name="finishDate" type="date" className="input" defaultValue={editingBook?.finishDate} />
                            </div>
                            <div className="input-group">
                                <label>Puan (1-5)</label>
                                <select name="rating" className="select" defaultValue={editingBook?.rating}>
                                    <option value="">Seçiniz</option>
                                    <option value="1">⭐ 1</option>
                                    <option value="2">⭐⭐ 2</option>
                                    <option value="3">⭐⭐⭐ 3</option>
                                    <option value="4">⭐⭐⭐⭐ 4</option>
                                    <option value="5">⭐⭐⭐⭐⭐ 5</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Yorum</label>
                                <textarea name="review" className="textarea" defaultValue={editingBook?.review}></textarea>
                            </div>
                            <button type="submit" className="btn btn-primary">{editingBook ? 'Güncelle' : 'Ekle'}</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Books;
