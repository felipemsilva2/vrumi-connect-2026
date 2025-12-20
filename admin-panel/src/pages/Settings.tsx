import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
    Settings as SettingsIcon,
    Percent,
    Tag,
    Plus,
    Edit2,
    Trash2,
    RefreshCw,
    X,
    Check
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Coupon {
    id: string;
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    max_uses: number | null;
    used_count: number;
    expires_at: string | null;
    is_active: boolean;
    created_at: string;
}

interface PlatformSettings {
    platform_fee_percentage: number;
    min_lesson_price: number;
    max_lesson_price: number;
}

export function Settings() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Coupon form
    const [code, setCode] = useState('');
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
    const [discountValue, setDiscountValue] = useState('');
    const [maxUses, setMaxUses] = useState('');
    const [expiresAt, setExpiresAt] = useState('');

    // Platform settings (for display - actually stored in code/env)
    const platformSettings: PlatformSettings = {
        platform_fee_percentage: 15,
        min_lesson_price: 50,
        max_lesson_price: 500
    };

    const fetchCoupons = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCoupons(data || []);
        } catch (error) {
            console.error('Error fetching coupons:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const openCreateModal = () => {
        setEditingCoupon(null);
        setCode('');
        setDiscountType('percentage');
        setDiscountValue('');
        setMaxUses('');
        setExpiresAt('');
        setIsModalOpen(true);
    };

    const openEditModal = (coupon: Coupon) => {
        setEditingCoupon(coupon);
        setCode(coupon.code);
        setDiscountType(coupon.discount_type);
        setDiscountValue(coupon.discount_value.toString());
        setMaxUses(coupon.max_uses?.toString() || '');
        setExpiresAt(coupon.expires_at?.split('T')[0] || '');
        setIsModalOpen(true);
    };

    const handleSaveCoupon = async () => {
        if (!code.trim() || !discountValue) {
            alert('Preencha código e valor do desconto');
            return;
        }

        setIsSaving(true);
        try {
            const couponData = {
                code: code.toUpperCase().trim(),
                discount_type: discountType,
                discount_value: parseFloat(discountValue),
                max_uses: maxUses ? parseInt(maxUses) : null,
                expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
                is_active: true
            };

            if (editingCoupon) {
                const { error } = await supabase
                    .from('coupons')
                    .update(couponData)
                    .eq('id', editingCoupon.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('coupons')
                    .insert(couponData);
                if (error) throw error;
            }

            setIsModalOpen(false);
            fetchCoupons();
        } catch (error: any) {
            console.error('Error saving coupon:', error);
            alert('Erro ao salvar cupom: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleActive = async (coupon: Coupon) => {
        const { error } = await supabase
            .from('coupons')
            .update({ is_active: !coupon.is_active })
            .eq('id', coupon.id);

        if (!error) fetchCoupons();
    };

    const handleDeleteCoupon = async (id: string) => {
        if (!confirm('Excluir este cupom permanentemente?')) return;

        const { error } = await supabase
            .from('coupons')
            .delete()
            .eq('id', id);

        if (!error) fetchCoupons();
    };

    return (
        <div>
            <div className="page-header">
                <div className="page-header-content">
                    <h1>Configurações</h1>
                    <p>Configurações da plataforma e cupons</p>
                </div>
            </div>

            {/* Platform Settings Card */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <SettingsIcon size={18} />
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Configurações da Plataforma</h3>
                    </div>
                </div>
                <div style={{ padding: '20px' }}>
                    <div className="stats-grid" style={{ marginBottom: 0 }}>
                        <div className="stat-card" style={{ textAlign: 'center' }}>
                            <div className="stat-icon green" style={{ margin: '0 auto 12px' }}>
                                <Percent size={20} />
                            </div>
                            <div className="stat-value">{platformSettings.platform_fee_percentage}%</div>
                            <div className="stat-label">Taxa da Plataforma</div>
                        </div>
                        <div className="stat-card" style={{ textAlign: 'center' }}>
                            <div className="stat-icon blue" style={{ margin: '0 auto 12px' }}>
                                <Tag size={20} />
                            </div>
                            <div className="stat-value">R$ {platformSettings.min_lesson_price}</div>
                            <div className="stat-label">Preço Mínimo</div>
                        </div>
                        <div className="stat-card" style={{ textAlign: 'center' }}>
                            <div className="stat-icon purple" style={{ margin: '0 auto 12px' }}>
                                <Tag size={20} />
                            </div>
                            <div className="stat-value">R$ {platformSettings.max_lesson_price}</div>
                            <div className="stat-label">Preço Máximo</div>
                        </div>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '16px', textAlign: 'center' }}>
                        Para alterar estas configurações, edite as variáveis de ambiente ou contate o desenvolvedor.
                    </p>
                </div>
            </div>

            {/* Coupons Section */}
            <div className="card">
                <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Tag size={18} />
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Cupons de Desconto</h3>
                        <span className="badge badge-default">{coupons.length}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={fetchCoupons}>
                            <RefreshCw size={14} />
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
                            <Plus size={14} />
                            Novo Cupom
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '48px' }}>
                        <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
                        <p style={{ color: 'var(--text-muted)' }}>Carregando...</p>
                    </div>
                ) : coupons.length === 0 ? (
                    <div className="empty-state" style={{ padding: '48px' }}>
                        <Tag size={48} />
                        <h3>Nenhum cupom criado</h3>
                        <p>Crie cupons de desconto para seus usuários</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Desconto</th>
                                <th>Uso</th>
                                <th>Validade</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {coupons.map((coupon) => {
                                const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
                                const isMaxedOut = coupon.max_uses && coupon.used_count >= coupon.max_uses;

                                return (
                                    <tr key={coupon.id}>
                                        <td>
                                            <code style={{
                                                padding: '4px 8px',
                                                background: 'var(--bg-tertiary)',
                                                borderRadius: '4px',
                                                fontSize: '13px',
                                                fontWeight: 600
                                            }}>
                                                {coupon.code}
                                            </code>
                                        </td>
                                        <td style={{ fontWeight: 500, color: 'var(--success)' }}>
                                            {coupon.discount_type === 'percentage'
                                                ? `${coupon.discount_value}%`
                                                : `R$ ${coupon.discount_value.toFixed(2)}`
                                            }
                                        </td>
                                        <td>
                                            {coupon.used_count}
                                            {coupon.max_uses && <span style={{ color: 'var(--text-muted)' }}> / {coupon.max_uses}</span>}
                                        </td>
                                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            {coupon.expires_at
                                                ? format(new Date(coupon.expires_at), 'dd/MM/yyyy', { locale: ptBR })
                                                : 'Sem limite'
                                            }
                                        </td>
                                        <td>
                                            {isExpired ? (
                                                <span className="badge badge-danger">Expirado</span>
                                            ) : isMaxedOut ? (
                                                <span className="badge badge-warning">Esgotado</span>
                                            ) : coupon.is_active ? (
                                                <span className="badge badge-success">Ativo</span>
                                            ) : (
                                                <span className="badge badge-default">Inativo</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="btn btn-icon btn-ghost"
                                                    onClick={() => handleToggleActive(coupon)}
                                                    title={coupon.is_active ? 'Desativar' : 'Ativar'}
                                                >
                                                    <Check size={16} style={{ color: coupon.is_active ? 'var(--success)' : 'var(--text-muted)' }} />
                                                </button>
                                                <button
                                                    className="btn btn-icon btn-ghost"
                                                    onClick={() => openEditModal(coupon)}
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    className="btn btn-icon btn-ghost"
                                                    onClick={() => handleDeleteCoupon(coupon.id)}
                                                    title="Excluir"
                                                    style={{ color: 'var(--danger)' }}
                                                >
                                                    <Trash2 size={16} />
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

            {/* Coupon Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}</h2>
                            <button className="btn btn-icon btn-ghost" onClick={() => setIsModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label>Código do Cupom *</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Ex: PRIMEIRAULA"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    style={{ textTransform: 'uppercase' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group">
                                    <label>Tipo de Desconto *</label>
                                    <select
                                        className="select"
                                        value={discountType}
                                        onChange={(e) => setDiscountType(e.target.value as any)}
                                    >
                                        <option value="percentage">Porcentagem (%)</option>
                                        <option value="fixed">Valor Fixo (R$)</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Valor *</label>
                                    <input
                                        type="number"
                                        className="input"
                                        placeholder={discountType === 'percentage' ? 'Ex: 10' : 'Ex: 25.00'}
                                        value={discountValue}
                                        onChange={(e) => setDiscountValue(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group">
                                    <label>Limite de Uso</label>
                                    <input
                                        type="number"
                                        className="input"
                                        placeholder="Ilimitado"
                                        value={maxUses}
                                        onChange={(e) => setMaxUses(e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Data de Expiração</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={expiresAt}
                                        onChange={(e) => setExpiresAt(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                                Cancelar
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSaveCoupon}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Salvando...' : editingCoupon ? 'Salvar Alterações' : 'Criar Cupom'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
