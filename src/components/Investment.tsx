import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { generateId } from '../utils/storage';
import type { Investment } from '../types';
import './Investment.css';

const InvestmentPage: React.FC = () => {
    const { data, updateData } = useApp();
    const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showExpand, setShowExpand] = useState(false);

    // Inline form state
    const [asset, setAsset] = useState('');
    const [invType, setInvType] = useState<Investment['type']>('stock');
    const [quantity, setQuantity] = useState('');
    const [buyPrice, setBuyPrice] = useState('');
    const [currentPrice, setCurrentPrice] = useState('');
    const [notes, setNotes] = useState('');

    const handleAddInline = () => {
        if (!asset.trim() || !quantity || !buyPrice || !currentPrice) return;

        const newInvestment: Investment = {
            id: generateId(),
            asset: asset.trim(),
            type: invType,
            quantity: Number(quantity),
            buyPrice: Number(buyPrice),
            currentPrice: Number(currentPrice),
            notes: notes || undefined,
        };

        updateData({ investments: [...data.investments, newInvestment] });
        setAsset('');
        setQuantity('');
        setBuyPrice('');
        setCurrentPrice('');
        setNotes('');
        setShowExpand(false);
    };

    const handleEditInvestment = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingInvestment) return;
        const formData = new FormData(e.currentTarget);

        const updatedInv: Investment = {
            ...editingInvestment,
            asset: formData.get('asset') as string,
            type: formData.get('type') as Investment['type'],
            quantity: Number(formData.get('quantity')),
            buyPrice: Number(formData.get('buyPrice')),
            currentPrice: Number(formData.get('currentPrice')),
            notes: formData.get('notes') as string || undefined,
        };

        updateData({ investments: data.investments.map((i) => (i.id === editingInvestment.id ? updatedInv : i)) });
        setShowEditModal(false);
        setEditingInvestment(null);
    };

    const handleDeleteInvestment = (id: string) => {
        if (confirm('Bu yatırımı silmek istediğinize emin misiniz?')) {
            updateData({ investments: data.investments.filter((i) => i.id !== id) });
        }
    };

    const stats = useMemo(() => {
        const totalValue = data.investments.reduce((sum, inv) => sum + inv.quantity * inv.currentPrice, 0);
        const totalCost = data.investments.reduce((sum, inv) => sum + inv.quantity * inv.buyPrice, 0);
        const profit = totalValue - totalCost;
        const profitPercent = totalCost > 0 ? ((profit / totalCost) * 100).toFixed(2) : '0.00';

        const byType = {
            stock: 0,
            crypto: 0,
            fund: 0,
            other: 0,
        };

        data.investments.forEach((inv) => {
            byType[inv.type] += inv.quantity * inv.currentPrice;
        });

        return { totalValue, totalCost, profit, profitPercent, byType };
    }, [data.investments]);

    return (
        <div className="investment-page">
            <div className="page-header">
                <h1 className="page-title">💰 Yatırım Portföyü</h1>
                <p className="page-subtitle">Yatırımlarını takip et ve kar/zarar analizi yap</p>
            </div>

            {/* Stats */}
            <div className="investment-stats grid-4">
                <div className="stat-box card">
                    <div className="stat-label">Toplam Değer</div>
                    <div className="stat-value">₺{stats.totalValue.toLocaleString('tr-TR')}</div>
                </div>
                <div className="stat-box card">
                    <div className="stat-label">Toplam Maliyet</div>
                    <div className="stat-value">₺{stats.totalCost.toLocaleString('tr-TR')}</div>
                </div>
                <div className="stat-box card">
                    <div className="stat-label">Kar/Zarar</div>
                    <div className={`stat-value ${stats.profit >= 0 ? 'profit' : 'loss'}`}>
                        {stats.profit >= 0 ? '+' : ''}₺{stats.profit.toLocaleString('tr-TR')}
                    </div>
                </div>
                <div className="stat-box card">
                    <div className="stat-label">Getiri</div>
                    <div className={`stat-value ${stats.profit >= 0 ? 'profit' : 'loss'}`}>
                        {stats.profitPercent}%
                    </div>
                </div>
            </div>

            {/* Portfolio Distribution */}
            <div className="portfolio-distribution card">
                <h3>Portföy Dağılımı</h3>
                <div className="distribution-grid">
                    <div className="distribution-item">
                        <span className="distribution-label">📈 Hisse Senedi</span>
                        <span className="distribution-value">₺{stats.byType.stock.toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="distribution-item">
                        <span className="distribution-label">₿ Kripto</span>
                        <span className="distribution-value">₺{stats.byType.crypto.toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="distribution-item">
                        <span className="distribution-label">📊 Fon</span>
                        <span className="distribution-value">₺{stats.byType.fund.toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="distribution-item">
                        <span className="distribution-label">💼 Diğer</span>
                        <span className="distribution-value">₺{stats.byType.other.toLocaleString('tr-TR')}</span>
                    </div>
                </div>
            </div>

            {/* Inline Quick-Add */}
            <div className="inline-form">
                <div className="inline-form-row">
                    <div className="inline-field">
                        <label>Varlık</label>
                        <input
                            type="text"
                            placeholder="AAPL, BTC..."
                            value={asset}
                            onChange={(e) => setAsset(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddInline(); }}
                        />
                    </div>
                    <div className="inline-field field-select">
                        <label>Tür</label>
                        <select value={invType} onChange={(e) => setInvType(e.target.value as Investment['type'])}>
                            <option value="stock">📈 Hisse</option>
                            <option value="crypto">₿ Kripto</option>
                            <option value="fund">📊 Fon</option>
                            <option value="other">💼 Diğer</option>
                        </select>
                    </div>
                    <div className="inline-field field-sm">
                        <label>Miktar</label>
                        <input type="number" step="0.00000001" placeholder="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                    </div>
                    <div className="inline-field field-sm">
                        <label>Alış ₺</label>
                        <input type="number" step="0.01" placeholder="0" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} />
                    </div>
                    <div className="inline-field field-sm">
                        <label>Güncel ₺</label>
                        <input type="number" step="0.01" placeholder="0" value={currentPrice} onChange={(e) => setCurrentPrice(e.target.value)} />
                    </div>
                    <button className="btn-add" onClick={handleAddInline}>➕ Ekle</button>
                </div>
                <button className="expand-toggle" onClick={() => setShowExpand(!showExpand)}>
                    {showExpand ? '▲ Gizle' : '▼ Not ekle'}
                </button>
                {showExpand && (
                    <div className="expand-area">
                        <div className="inline-form-row">
                            <div className="inline-field">
                                <label>Notlar</label>
                                <input type="text" placeholder="Yatırım hakkında not..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Investments Table */}
            <div className="investments-table">
                {data.investments.length === 0 ? (
                    <div className="empty-state card">
                        <p>💰 Henüz yatırım eklenmemiş</p>
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Varlık</th>
                                <th>Tür</th>
                                <th>Miktar</th>
                                <th>Alış Fiyatı</th>
                                <th>Güncel Fiyat</th>
                                <th>Toplam Değer</th>
                                <th>Kar/Zarar</th>
                                <th>Getiri %</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.investments.map((inv) => {
                                const totalValue = inv.quantity * inv.currentPrice;
                                const totalCost = inv.quantity * inv.buyPrice;
                                const profit = totalValue - totalCost;
                                const profitPercent = totalCost > 0 ? ((profit / totalCost) * 100).toFixed(2) : '0.00';

                                return (
                                    <tr key={inv.id}>
                                        <td>
                                            <strong>{inv.asset}</strong>
                                            {inv.notes && <div className="investment-notes">{inv.notes}</div>}
                                        </td>
                                        <td>
                                            <span className={`type-badge ${inv.type}`}>
                                                {inv.type === 'stock' && '📈 Hisse'}
                                                {inv.type === 'crypto' && '₿ Kripto'}
                                                {inv.type === 'fund' && '📊 Fon'}
                                                {inv.type === 'other' && '💼 Diğer'}
                                            </span>
                                        </td>
                                        <td>{inv.quantity}</td>
                                        <td>₺{inv.buyPrice.toLocaleString('tr-TR')}</td>
                                        <td>₺{inv.currentPrice.toLocaleString('tr-TR')}</td>
                                        <td>₺{totalValue.toLocaleString('tr-TR')}</td>
                                        <td className={profit >= 0 ? 'profit' : 'loss'}>
                                            {profit >= 0 ? '+' : ''}₺{profit.toLocaleString('tr-TR')}
                                        </td>
                                        <td className={profit >= 0 ? 'profit' : 'loss'}>
                                            {profitPercent}%
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                <button className="btn-icon" onClick={() => { setEditingInvestment(inv); setShowEditModal(true); }}>
                                                    ✏️
                                                </button>
                                                <button className="btn-icon delete" onClick={() => handleDeleteInvestment(inv.id)}>
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Edit Modal */}
            {showEditModal && editingInvestment && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Yatırım Düzenle</h2>
                            <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleEditInvestment}>
                            <div className="input-group">
                                <label>Varlık Adı *</label>
                                <input name="asset" type="text" className="input" defaultValue={editingInvestment.asset} required />
                            </div>
                            <div className="input-group">
                                <label>Tür *</label>
                                <select name="type" className="select" defaultValue={editingInvestment.type} required>
                                    <option value="stock">Hisse Senedi</option>
                                    <option value="crypto">Kripto</option>
                                    <option value="fund">Fon</option>
                                    <option value="other">Diğer</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Miktar *</label>
                                <input name="quantity" type="number" step="0.00000001" className="input" defaultValue={editingInvestment.quantity} required />
                            </div>
                            <div className="input-group">
                                <label>Alış Fiyatı (₺) *</label>
                                <input name="buyPrice" type="number" step="0.01" className="input" defaultValue={editingInvestment.buyPrice} required />
                            </div>
                            <div className="input-group">
                                <label>Güncel Fiyat (₺) *</label>
                                <input name="currentPrice" type="number" step="0.01" className="input" defaultValue={editingInvestment.currentPrice} required />
                            </div>
                            <div className="input-group">
                                <label>Notlar</label>
                                <textarea name="notes" className="textarea" defaultValue={editingInvestment.notes}></textarea>
                            </div>
                            <button type="submit" className="btn btn-primary">Güncelle</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvestmentPage;
