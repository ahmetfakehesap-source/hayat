import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { generateId, formatDate, getLocalDate } from '../utils/storage';
import type { Book } from '../types';
import './Books.css';

const Books: React.FC = () => {
    const { data, updateData, settings, updateSettings } = useApp();

    useEffect(() => {
        if (settings.yearlyBookGoal === 50) {
            updateSettings({ yearlyBookGoal: 9 });
        }
    }, [settings.yearlyBookGoal, updateSettings]);

    const [editingBook, setEditingBook] = useState<Book | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'reading' | 'completed' | 'want-to-read'>('reading');
    const [showAddForm, setShowAddForm] = useState(false);
    const [editNotesId, setEditNotesId] = useState<string | null>(null);
    const [noteText, setNoteText] = useState('');

    // Add form state
    const [bookTitle, setBookTitle] = useState('');
    const [bookAuthor, setBookAuthor] = useState('');
    const [bookStatus, setBookStatus] = useState<Book['status']>('want-to-read');
    const [bookPages, setBookPages] = useState('');

    // Edit form state
    const [editTitle, setEditTitle] = useState('');
    const [editAuthor, setEditAuthor] = useState('');
    const [editStatus, setEditStatus] = useState<Book['status']>('reading');
    const [editTotalPages, setEditTotalPages] = useState('');
    const [editCurrentPage, setEditCurrentPage] = useState('');
    const [editStartDate, setEditStartDate] = useState('');
    const [editFinishDate, setEditFinishDate] = useState('');
    const [editRating, setEditRating] = useState('');
    const [editReview, setEditReview] = useState('');
    const [editNotes, setEditNotes] = useState('');

    const handleAddBook = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!bookTitle.trim() || !bookAuthor.trim()) return;

        const newBook: Book = {
            id: generateId(),
            title: bookTitle.trim(),
            author: bookAuthor.trim(),
            status: bookStatus,
            totalPages: bookPages ? Number(bookPages) : undefined,
            currentPage: bookStatus === 'reading' ? 0 : undefined,
            startDate: bookStatus === 'reading' ? getLocalDate() : undefined,
        };

        updateData({ books: [...data.books, newBook] });
        setBookTitle('');
        setBookAuthor('');
        setBookStatus('want-to-read');
        setBookPages('');
        setShowAddForm(false);
    };

    const handleUpdatePage = (bookId: string, page: number) => {
        const book = data.books.find((b) => b.id === bookId);
        if (!book) return;
        const maxPage = book.totalPages || 9999;
        const clampedPage = Math.max(0, Math.min(page, maxPage));

        if (book.totalPages && clampedPage >= book.totalPages) {
            updateData({
                books: data.books.map((b) => b.id === bookId ? {
                    ...b, currentPage: book.totalPages, status: 'completed' as const, finishDate: getLocalDate()
                } : b)
            });
        } else {
            updateData({ books: data.books.map((b) => b.id === bookId ? { ...b, currentPage: clampedPage } : b) });
        }
    };

    const handleStartReading = (bookId: string) => {
        updateData({
            books: data.books.map((b) => b.id === bookId ? {
                ...b, status: 'reading' as const, startDate: getLocalDate(), currentPage: 0
            } : b)
        });
    };

    const openEditModal = (book: Book) => {
        setEditingBook(book);
        setEditTitle(book.title);
        setEditAuthor(book.author);
        setEditStatus(book.status);
        setEditTotalPages(book.totalPages?.toString() || '');
        setEditCurrentPage(book.currentPage?.toString() || '');
        setEditStartDate(book.startDate || '');
        setEditFinishDate(book.finishDate || '');
        setEditRating(book.rating?.toString() || '');
        setEditReview(book.review || '');
        setEditNotes(book.notes || '');
        setShowEditModal(true);
    };

    const handleSaveEdit = () => {
        if (!editingBook) return;

        const updatedBook: Book = {
            ...editingBook,
            title: editTitle,
            author: editAuthor,
            status: editStatus,
            totalPages: editTotalPages ? Number(editTotalPages) : undefined,
            currentPage: editStatus === 'reading' ? (Number(editCurrentPage) || 0) : undefined,
            rating: editStatus === 'completed' && editRating ? Number(editRating) : undefined,
            review: editReview || undefined,
            notes: editNotes || undefined,
            startDate: editStartDate || undefined,
            finishDate: editStatus === 'completed' ? editFinishDate || undefined : undefined,
        };

        updateData({ books: data.books.map((b) => (b.id === editingBook.id ? updatedBook : b)) });
        setShowEditModal(false);
        setEditingBook(null);
    };

    const handleDeleteBook = (id: string) => {
        if (confirm('Bu kitabı silmek istediğinize emin misiniz?')) {
            updateData({ books: data.books.filter((b) => b.id !== id) });
        }
    };

    const handleSaveNote = (bookId: string) => {
        updateData({
            books: data.books.map((b) => b.id === bookId ? { ...b, notes: noteText || undefined } : b)
        });
        setEditNotesId(null);
        setNoteText('');
    };

    const openNotes = (book: Book) => {
        setEditNotesId(book.id);
        setNoteText(book.notes || '');
    };

    const stats = useMemo(() => {
        const completed = data.books.filter((b) => b.status === 'completed');
        const currentYear = new Date().getFullYear();
        const completedThisYear = completed.filter((b) => {
            if (!b.finishDate) return false;
            return new Date(b.finishDate).getFullYear() === currentYear;
        });
        const totalPagesRead = data.books.reduce((sum, b) => {
            if (b.status === 'completed' && b.totalPages) return sum + b.totalPages;
            if (b.status === 'reading' && b.currentPage) return sum + b.currentPage;
            return sum;
        }, 0);

        return {
            reading: data.books.filter((b) => b.status === 'reading').length,
            completed: completed.length,
            completedThisYear: completedThisYear.length,
            wantToRead: data.books.filter((b) => b.status === 'want-to-read').length,
            yearlyGoal: settings.yearlyBookGoal,
            totalPagesRead,
        };
    }, [data.books, settings.yearlyBookGoal]);

    const readingBooks = data.books.filter((b) => b.status === 'reading');
    const completedBooks = data.books.filter((b) => b.status === 'completed').sort((a, b) =>
        (b.finishDate || '').localeCompare(a.finishDate || '')
    );
    const wantToReadBooks = data.books.filter((b) => b.status === 'want-to-read');
    const yearProgress = stats.yearlyGoal > 0 ? Math.min((stats.completedThisYear / stats.yearlyGoal) * 100, 100) : 0;

    const renderStars = (rating: number, interactive?: boolean, onChange?: (r: number) => void) => {
        return Array.from({ length: 5 }, (_, i) => (
            <span
                key={i}
                className={`star ${i < rating ? 'filled' : ''} ${interactive ? 'interactive' : ''}`}
                onClick={() => interactive && onChange && onChange(i + 1)}
            >★</span>
        ));
    };

    return (
        <div className="books-page">
            <div className="page-header">
                <h1 className="page-title">📚 Kitaplar</h1>
                <p className="page-subtitle">Bilgi güçtür — okumaya devam et</p>
            </div>

            {/* Dashboard Strip */}
            <div className="books-dashboard">
                <div className="book-stat-card accent">
                    <div className="bs-ring-wrap">
                        <svg viewBox="0 0 36 36" className="bs-ring">
                            <path className="bs-ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <path className="bs-ring-fill" strokeDasharray={`${yearProgress}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        </svg>
                        <span className="bs-ring-val">{stats.completedThisYear}/{stats.yearlyGoal}</span>
                    </div>
                    <span className="bs-label">Bu Yıl</span>
                </div>
                <div className="book-stat-card">
                    <span className="bs-icon">📖</span>
                    <span className="bs-value">{stats.reading}</span>
                    <span className="bs-label">Okunuyor</span>
                </div>
                <div className="book-stat-card">
                    <span className="bs-icon">✅</span>
                    <span className="bs-value">{stats.completed}</span>
                    <span className="bs-label">Okunan</span>
                </div>
                <div className="book-stat-card">
                    <span className="bs-icon">📋</span>
                    <span className="bs-value">{stats.wantToRead}</span>
                    <span className="bs-label">Bekleyen</span>
                </div>
                <div className="book-stat-card">
                    <span className="bs-icon">📄</span>
                    <span className="bs-value">{stats.totalPagesRead.toLocaleString('tr-TR')}</span>
                    <span className="bs-label">Sayfa</span>
                </div>
            </div>

            {/* Add Book */}
            {!showAddForm ? (
                <button className="books-add-trigger" onClick={() => setShowAddForm(true)}>
                    <span>＋</span> Yeni Kitap Ekle
                </button>
            ) : (
                <form className="books-add-form" onSubmit={handleAddBook}>
                    <div className="baf-row">
                        <input type="text" placeholder="Kitap adı..." value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} autoFocus />
                        <input type="text" placeholder="Yazar..." value={bookAuthor} onChange={(e) => setBookAuthor(e.target.value)} />
                    </div>
                    <div className="baf-row">
                        <input type="number" placeholder="Sayfa sayısı" value={bookPages} onChange={(e) => setBookPages(e.target.value)} className="baf-small" />
                        <select value={bookStatus} onChange={(e) => setBookStatus(e.target.value as Book['status'])}>
                            <option value="want-to-read">📋 Okunacak</option>
                            <option value="reading">📖 Okunuyor</option>
                            <option value="completed">✅ Tamamlandı</option>
                        </select>
                        <button type="submit" className="baf-submit" disabled={!bookTitle.trim() || !bookAuthor.trim()}>Ekle</button>
                        <button type="button" className="baf-cancel" onClick={() => setShowAddForm(false)}>×</button>
                    </div>
                </form>
            )}

            {/* Tabs */}
            <div className="books-tabs">
                <button className={`btab ${activeTab === 'reading' ? 'active' : ''}`} onClick={() => setActiveTab('reading')}>
                    📖 Okunuyor <span className="btab-count">{stats.reading}</span>
                </button>
                <button className={`btab ${activeTab === 'completed' ? 'active' : ''}`} onClick={() => setActiveTab('completed')}>
                    ✅ Okunan <span className="btab-count">{stats.completed}</span>
                </button>
                <button className={`btab ${activeTab === 'want-to-read' ? 'active' : ''}`} onClick={() => setActiveTab('want-to-read')}>
                    📋 Bekleyen <span className="btab-count">{stats.wantToRead}</span>
                </button>
            </div>

            {/* Reading Tab */}
            {activeTab === 'reading' && (
                <div className="books-content">
                    {readingBooks.length === 0 ? (
                        <div className="books-empty">
                            <div className="empty-icon">📖</div>
                            <p>Şu an okuduğun kitap yok</p>
                            <span>Bekleyen listesinden başlayabilir veya yeni ekleyebilirsin</span>
                        </div>
                    ) : (
                        <div className="reading-list">
                            {readingBooks.map((book) => {
                                const progress = book.totalPages ? Math.round(((book.currentPage || 0) / book.totalPages) * 100) : 0;
                                const isNotesOpen = editNotesId === book.id;
                                return (
                                    <div key={book.id} className="reading-card">
                                        <div className="rc-top">
                                            <div className="rc-info">
                                                <h3 className="rc-title">{book.title}</h3>
                                                <span className="rc-author">{book.author}</span>
                                            </div>
                                            <div className="rc-actions">
                                                <button className="rc-note-btn" onClick={() => isNotesOpen ? setEditNotesId(null) : openNotes(book)} title="Notlar">📝</button>
                                                <button className="rc-edit" onClick={() => openEditModal(book)} title="Düzenle">✏️</button>
                                                <button className="rc-del" onClick={() => handleDeleteBook(book.id)} title="Sil">×</button>
                                            </div>
                                        </div>

                                        {book.totalPages && (
                                            <div className="rc-progress-section">
                                                <div className="rc-progress-header">
                                                    <span className="rc-pages">{book.currentPage || 0} / {book.totalPages} sayfa</span>
                                                    <span className="rc-percent">{progress}%</span>
                                                </div>
                                                <div className="rc-progress-bar">
                                                    <div className="rc-progress-fill" style={{ width: `${progress}%` }} />
                                                </div>
                                                <div className="rc-page-controls">
                                                    <button onClick={() => handleUpdatePage(book.id, (book.currentPage || 0) - 10)}>-10</button>
                                                    <button onClick={() => handleUpdatePage(book.id, (book.currentPage || 0) - 1)}>-1</button>
                                                    <span className="rc-current-page">{book.currentPage || 0}</span>
                                                    <button onClick={() => handleUpdatePage(book.id, (book.currentPage || 0) + 1)}>+1</button>
                                                    <button onClick={() => handleUpdatePage(book.id, (book.currentPage || 0) + 10)}>+10</button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Inline Notes */}
                                        {isNotesOpen && (
                                            <div className="rc-notes-section">
                                                <textarea
                                                    className="rc-notes-textarea"
                                                    placeholder="Bu kitap hakkında notlarını yaz... Önemli fikirler, alıntılar, düşünceler..."
                                                    value={noteText}
                                                    onChange={(e) => setNoteText(e.target.value)}
                                                    rows={4}
                                                    autoFocus
                                                />
                                                <div className="rc-notes-actions">
                                                    <button className="rc-notes-save" onClick={() => handleSaveNote(book.id)}>💾 Kaydet</button>
                                                    <button className="rc-notes-cancel" onClick={() => setEditNotesId(null)}>İptal</button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Show existing notes (collapsed) */}
                                        {!isNotesOpen && book.notes && (
                                            <div className="rc-notes-preview" onClick={() => openNotes(book)}>
                                                <span className="notes-icon">📝</span>
                                                <p>{book.notes}</p>
                                            </div>
                                        )}

                                        {book.startDate && (
                                            <div className="rc-meta">🗓️ Başlangıç: {formatDate(book.startDate)}</div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Completed Tab */}
            {activeTab === 'completed' && (
                <div className="books-content">
                    {completedBooks.length === 0 ? (
                        <div className="books-empty">
                            <div className="empty-icon">✅</div>
                            <p>Henüz tamamlanmış kitap yok</p>
                        </div>
                    ) : (
                        <div className="completed-grid">
                            {completedBooks.map((book) => (
                                <div key={book.id} className="completed-card">
                                    <div className="cc-top">
                                        <div>
                                            <h3 className="cc-title">{book.title}</h3>
                                            <span className="cc-author">{book.author}</span>
                                        </div>
                                        <div className="cc-actions">
                                            <button onClick={() => openEditModal(book)}>✏️</button>
                                            <button onClick={() => handleDeleteBook(book.id)}>×</button>
                                        </div>
                                    </div>
                                    {book.rating && <div className="cc-rating">{renderStars(book.rating)}</div>}
                                    {book.review && <div className="cc-review"><p>"{book.review}"</p></div>}
                                    {book.notes && <div className="cc-notes"><span>📝</span><p>{book.notes}</p></div>}
                                    <div className="cc-footer">
                                        {book.finishDate && <span>📅 {formatDate(book.finishDate)}</span>}
                                        {book.totalPages && <span>📄 {book.totalPages} sayfa</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Want to Read Tab */}
            {activeTab === 'want-to-read' && (
                <div className="books-content">
                    {wantToReadBooks.length === 0 ? (
                        <div className="books-empty">
                            <div className="empty-icon">📋</div>
                            <p>Okumak istediğin kitap listesi boş</p>
                        </div>
                    ) : (
                        <div className="wishlist">
                            {wantToReadBooks.map((book) => (
                                <div key={book.id} className="wish-card">
                                    <div className="wc-info">
                                        <h3 className="wc-title">{book.title}</h3>
                                        <span className="wc-author">{book.author}</span>
                                        {book.totalPages && <span className="wc-pages">{book.totalPages} sayfa</span>}
                                    </div>
                                    <div className="wc-actions">
                                        <button className="wc-start" onClick={() => handleStartReading(book.id)}>📖 Başla</button>
                                        <button className="wc-edit" onClick={() => openEditModal(book)}>✏️</button>
                                        <button className="wc-del" onClick={() => handleDeleteBook(book.id)}>×</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ===== Redesigned Edit Panel ===== */}
            {showEditModal && editingBook && (
                <div className="edit-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="edit-panel" onClick={(e) => e.stopPropagation()}>
                        <div className="ep-header">
                            <h2>Kitap Düzenle</h2>
                            <button className="ep-close" onClick={() => setShowEditModal(false)}>×</button>
                        </div>

                        <div className="ep-body">
                            {/* Title & Author */}
                            <div className="ep-group">
                                <label>Kitap Adı</label>
                                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                            </div>
                            <div className="ep-group">
                                <label>Yazar</label>
                                <input type="text" value={editAuthor} onChange={(e) => setEditAuthor(e.target.value)} />
                            </div>

                            {/* Status */}
                            <div className="ep-group">
                                <label>Durum</label>
                                <div className="ep-status-pills">
                                    {(['want-to-read', 'reading', 'completed'] as const).map((s) => (
                                        <button
                                            key={s}
                                            className={`ep-pill ${editStatus === s ? 'active' : ''} ${s}`}
                                            onClick={() => setEditStatus(s)}
                                        >
                                            {s === 'want-to-read' ? '📋 Okunacak' : s === 'reading' ? '📖 Okunuyor' : '✅ Tamamlandı'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Pages */}
                            <div className="ep-row">
                                <div className="ep-group half">
                                    <label>Toplam Sayfa</label>
                                    <input type="number" value={editTotalPages} onChange={(e) => setEditTotalPages(e.target.value)} placeholder="0" />
                                </div>
                                {editStatus === 'reading' && (
                                    <div className="ep-group half">
                                        <label>Şu Anki Sayfa</label>
                                        <input type="number" value={editCurrentPage} onChange={(e) => setEditCurrentPage(e.target.value)} placeholder="0" />
                                    </div>
                                )}
                            </div>

                            {/* Dates */}
                            <div className="ep-row">
                                <div className="ep-group half">
                                    <label>Başlangıç</label>
                                    <input type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} />
                                </div>
                                {editStatus === 'completed' && (
                                    <div className="ep-group half">
                                        <label>Bitiş</label>
                                        <input type="date" value={editFinishDate} onChange={(e) => setEditFinishDate(e.target.value)} />
                                    </div>
                                )}
                            </div>

                            {/* Rating (only for completed) */}
                            {editStatus === 'completed' && (
                                <div className="ep-group">
                                    <label>Puan</label>
                                    <div className="ep-stars">
                                        {renderStars(Number(editRating) || 0, true, (r) => setEditRating(r.toString()))}
                                    </div>
                                </div>
                            )}

                            {/* Review */}
                            {editStatus === 'completed' && (
                                <div className="ep-group">
                                    <label>Yorum</label>
                                    <textarea value={editReview} onChange={(e) => setEditReview(e.target.value)} placeholder="Bu kitap hakkında yorumun..." rows={3} />
                                </div>
                            )}

                            {/* Notes */}
                            <div className="ep-group">
                                <label>📝 Notlar</label>
                                <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Alıntılar, fikirler, önemli noktalar..." rows={4} />
                            </div>
                        </div>

                        <div className="ep-footer">
                            <button className="ep-save" onClick={handleSaveEdit}>💾 Kaydet</button>
                            <button className="ep-cancel" onClick={() => setShowEditModal(false)}>İptal</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Books;
