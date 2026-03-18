import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import './Layout.css';

interface LayoutProps {
    children: React.ReactNode;
    currentPage: string;
    onNavigate: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate }) => {
    const { settings, updateSettings, exportData, importData, user, googleLogin, logout } = useApp();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showImportModal, setShowImportModal] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Primary tabs for bottom nav (max 5)
    const primaryItems = [
        { id: 'dashboard', label: 'Ana Sayfa', icon: '🏠' },
        { id: 'health', label: 'Sağlık', icon: '💪' },
        { id: 'work', label: 'İşim', icon: '💼' },
        { id: 'goals', label: 'Hedefler', icon: '🎯' },
    ];

    // Secondary items accessible via More menu
    const secondaryItems = [
        { id: 'books', label: 'Kitaplar', icon: '📚' },
        { id: 'journal', label: 'Günlüğüm', icon: '📔' },
        { id: 'investment', label: 'Yatırım', icon: '💰' },
        { id: 'schedule', label: 'Program', icon: '📅' },
    ];

    const allMenuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
        { id: 'work', label: 'Kendi İşim', icon: '💼' },
        { id: 'health', label: 'Sağlık & Spor', icon: '💪' },
        { id: 'books', label: 'Kitaplar', icon: '📚' },
        { id: 'journal', label: 'Günlüğüm', icon: '📔' },
        { id: 'investment', label: 'Yatırım', icon: '💰' },
        { id: 'schedule', label: 'Haftalık Program', icon: '📅' },
        { id: 'goals', label: 'Hedeflerim', icon: '🎯' },
    ];

    const toggleTheme = () => {
        updateSettings({ theme: settings.theme === 'light' ? 'dark' : 'light' });
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            importData(file);
            setShowImportModal(false);
        }
    };

    const handleMobileNav = (pageId: string) => {
        onNavigate(pageId);
        setShowMoreMenu(false);
    };

    const isSecondaryActive = secondaryItems.some(item => item.id === currentPage);

    return (
        <div className="layout">
            {/* Desktop Sidebar */}
            {!isMobile && (
                <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                    <div className="sidebar-header">
                        <h1 className="logo">
                            <span className="logo-icon">✨</span>
                            {isSidebarOpen && <span>LifeOS</span>}
                        </h1>
                    </div>

                    <nav className="sidebar-nav">
                        {allMenuItems.map((item) => (
                            <button
                                key={item.id}
                                className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                                onClick={() => onNavigate(item.id)}
                                title={item.label}
                            >
                                <span className="nav-icon">{item.icon}</span>
                                {isSidebarOpen && <span className="nav-label">{item.label}</span>}
                            </button>
                        ))}
                    </nav>

                    <div className="sidebar-footer">
                        <button
                            className="nav-item"
                            onClick={toggleTheme}
                            title={settings.theme === 'light' ? 'Koyu Tema' : 'Açık Tema'}
                        >
                            <span className="nav-icon">{settings.theme === 'light' ? '🌙' : '☀️'}</span>
                            {isSidebarOpen && (
                                <span className="nav-label">
                                    {settings.theme === 'light' ? 'Koyu Tema' : 'Açık Tema'}
                                </span>
                            )}
                        </button>

                        {/* Desktop Auth */}
                        <div className="auth-section">
                            {user ? (
                                <div className="user-profile" onClick={logout} title="Çıkış Yap">
                                    {isSidebarOpen && (
                                        <div className="user-info">
                                            <span className="user-name">{user.displayName}</span>
                                            <span className="user-logout">Çıkış Yap</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button className="nav-item btn-google" onClick={googleLogin}>
                                    <span className="nav-icon">🔑</span>
                                    {isSidebarOpen && <span className="nav-label">Giriş Yap (Google)</span>}
                                </button>
                            )}
                        </div>
                    </div>
                </aside>
            )}

            {/* Main Content */}
            <div className={`main-content ${isMobile ? 'mobile' : (isSidebarOpen ? 'sidebar-open' : 'sidebar-closed')}`}>
                {/* Header */}
                <header className="header">
                    {!isMobile && (
                        <button
                            className="menu-toggle"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        >
                            ☰
                        </button>
                    )}
                    {isMobile && (
                        <h2 className="mobile-page-title">
                            {allMenuItems.find(i => i.id === currentPage)?.icon}{' '}
                            {allMenuItems.find(i => i.id === currentPage)?.label}
                        </h2>
                    )}


                    <div className="header-actions">
                        {isMobile && (
                            <button className="btn btn-secondary btn-sm" onClick={toggleTheme}>
                                {settings.theme === 'light' ? '🌙' : '☀️'}
                            </button>
                        )}
                        {/* Mobile Auth Button */}
                        {isMobile && (
                            user ? (
                                <button className="btn btn-secondary btn-sm" onClick={logout} title="Çıkış Yap">
                                    👤 Çıkış
                                </button>
                            ) : (
                                <button className="btn btn-primary btn-sm btn-google-mobile" onClick={googleLogin}>
                                    Giriş
                                </button>
                            )
                        )}
                        <button className="btn btn-secondary btn-sm" onClick={exportData}>
                            📥
                        </button>
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setShowImportModal(true)}
                        >
                            📤
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className={`page-content ${isMobile ? 'has-bottom-nav' : ''}`}>{children}</main>
            </div>

            {/* Mobile Bottom Navigation */}
            {isMobile && (
                <nav className="bottom-nav">
                    {primaryItems.map((item) => (
                        <button
                            key={item.id}
                            className={`bottom-nav-item ${currentPage === item.id ? 'active' : ''}`}
                            onClick={() => handleMobileNav(item.id)}
                        >
                            <span className="bottom-nav-icon">{item.icon}</span>
                            <span className="bottom-nav-label">{item.label}</span>
                        </button>
                    ))}
                    <button
                        className={`bottom-nav-item ${isSecondaryActive || showMoreMenu ? 'active' : ''}`}
                        onClick={() => setShowMoreMenu(!showMoreMenu)}
                    >
                        <span className="bottom-nav-icon">⋯</span>
                        <span className="bottom-nav-label">Diğer</span>
                    </button>

                    {/* More Menu Popup */}
                    {showMoreMenu && (
                        <>
                            <div className="more-menu-backdrop" onClick={() => setShowMoreMenu(false)} />
                            <div className="more-menu">
                                {secondaryItems.map((item) => (
                                    <button
                                        key={item.id}
                                        className={`more-menu-item ${currentPage === item.id ? 'active' : ''}`}
                                        onClick={() => handleMobileNav(item.id)}
                                    >
                                        <span className="more-menu-icon">{item.icon}</span>
                                        <span className="more-menu-label">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </nav>
            )}

            {/* Import Modal */}
            {showImportModal && (
                <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Veri İçe Aktar</h2>
                            <button
                                className="modal-close"
                                onClick={() => setShowImportModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="input-group">
                            <label htmlFor="import-file">JSON dosyasını seçin:</label>
                            <input
                                id="import-file"
                                type="file"
                                accept=".json"
                                onChange={handleImport}
                                className="input"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Layout;

