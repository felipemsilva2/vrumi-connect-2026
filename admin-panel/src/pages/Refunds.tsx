import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, RefreshCw, DollarSign, ArrowDownRight, CheckCircle, XCircle, Clock, Eye, ExternalLink, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Refund {
    id: string;
    booking_id: string;
    amount: number;
    status: 'pending' | 'completed' | 'failed';
    created_at: string;
    description: string | null;
    instructor: { full_name: string } | null;
    booking: {
        student_id: string;
        scheduled_date: string;
        price: number;
        cancellation_reason: string | null;
        student: { full_name: string; email: string } | null;
    } | null;
}

const statusConfig = {
    pending: { label: 'Pendente', class: 'badge-warning', icon: Clock },
    completed: { label: 'Processado', class: 'badge-success', icon: CheckCircle },
    failed: { label: 'Falhou', class: 'badge-danger', icon: XCircle },
};

export function Refunds() {
    const [refunds, setRefunds] = useState<Refund[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchRefunds = async () => {
        setIsLoading(true);
        try {
            // Get refund transactions with booking info
            let query = supabase
                .from('transactions')
                .select(`
          *,
          instructor:instructors!transactions_instructor_id_fkey(full_name),
          booking:bookings!transactions_booking_id_fkey(
            student_id,
            scheduled_date,
            price,
            cancellation_reason,
            student:profiles!bookings_student_id_fkey(full_name, email)
          )
        `)
                .eq('type', 'refund')
                .order('created_at', { ascending: false });

            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            const { data, error } = await query;
            if (error) throw error;
            setRefunds(data || []);
        } catch (error) {
            console.error('Error fetching refunds:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRefunds();
    }, [statusFilter]);

    const filtered = refunds.filter(r =>
        r.instructor?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.booking?.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Stats
    const totalRefunded = refunds
        .filter(r => r.status === 'completed')
        .reduce((sum, r) => sum + Math.abs(Number(r.amount)), 0);

    const pendingRefunds = refunds.filter(r => r.status === 'pending').length;

    const handleViewDetails = (refund: Refund) => {
        setSelectedRefund(refund);
        setIsModalOpen(true);
    };

    return (
        <div>
            <div className="page-header">
                <div className="page-header-content">
                    <h1>Reembolsos</h1>
                    <p>Gestão de reembolsos processados</p>
                </div>
                <button className="btn btn-secondary" onClick={fetchRefunds}>
                    <RefreshCw size={16} />
                    Atualizar
                </button>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: '24px' }}>
                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon red">
                            <ArrowDownRight size={20} />
                        </div>
                    </div>
                    <div className="stat-label">Total Reembolsado</div>
                    <div className="stat-value" style={{ color: 'var(--danger)' }}>
                        R$ {totalRefunded.toFixed(2)}
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon blue">
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <div className="stat-label">Total de Refunds</div>
                    <div className="stat-value">{refunds.length}</div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon yellow">
                            <Clock size={20} />
                        </div>
                    </div>
                    <div className="stat-label">Pendentes</div>
                    <div className="stat-value" style={{ color: 'var(--warning)' }}>
                        {pendingRefunds}
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon green">
                            <CheckCircle size={20} />
                        </div>
                    </div>
                    <div className="stat-label">Processados</div>
                    <div className="stat-value" style={{ color: 'var(--success)' }}>
                        {refunds.filter(r => r.status === 'completed').length}
                    </div>
                </div>
            </div>

            <div className="filters">
                <div className="input-group">
                    <Search size={16} className="input-icon" />
                    <input
                        type="text"
                        className="input"
                        placeholder="Buscar por instrutor, aluno ou descrição..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="all">Todos os Status</option>
                    <option value="pending">Pendentes</option>
                    <option value="completed">Processados</option>
                    <option value="failed">Falhou</option>
                </select>
            </div>

            <div className="card">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Aluno</th>
                            <th>Instrutor</th>
                            <th>Motivo</th>
                            <th style={{ textAlign: 'right' }}>Valor</th>
                            <th>Status</th>
                            <th style={{ width: '80px' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '48px' }}>
                                    <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
                                    <p style={{ color: 'var(--text-muted)' }}>Carregando...</p>
                                </td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={7}>
                                    <div className="empty-state">
                                        <DollarSign size={48} />
                                        <h3>Nenhum reembolso encontrado</h3>
                                        <p>Não há reembolsos registrados</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filtered.map((refund) => {
                                const config = statusConfig[refund.status] || statusConfig.pending;
                                const StatusIcon = config.icon;

                                return (
                                    <tr key={refund.id}>
                                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            {format(new Date(refund.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                        </td>
                                        <td>
                                            <div className="user-cell">
                                                <div className="user-cell-avatar" style={{ width: '28px', height: '28px', fontSize: '10px' }}>
                                                    {refund.booking?.student?.full_name?.substring(0, 2).toUpperCase() || '??'}
                                                </div>
                                                <div className="user-cell-info">
                                                    <div className="user-cell-name" style={{ fontSize: '13px' }}>
                                                        {refund.booking?.student?.full_name || 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)' }}>
                                            {refund.instructor?.full_name || 'N/A'}
                                        </td>
                                        <td>
                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                {refund.booking?.cancellation_reason || refund.description || 'Cancelamento'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <strong style={{ color: 'var(--danger)' }}>
                                                -R$ {Math.abs(Number(refund.amount)).toFixed(2)}
                                            </strong>
                                        </td>
                                        <td>
                                            <span className={`badge ${config.class}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                <StatusIcon size={12} />
                                                {config.label}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-icon btn-ghost"
                                                onClick={() => handleViewDetails(refund)}
                                                title="Ver detalhes"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Details Modal */}
            {isModalOpen && selectedRefund && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Detalhes do Reembolso</h2>
                            <button className="btn btn-icon btn-ghost" onClick={() => setIsModalOpen(false)}>
                                <XCircle size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <div className="detail-label">Aluno</div>
                                    <div className="detail-value">{selectedRefund.booking?.student?.full_name || 'N/A'}</div>
                                </div>

                                <div className="detail-item">
                                    <div className="detail-label">Email do Aluno</div>
                                    <div className="detail-value">{selectedRefund.booking?.student?.email || 'N/A'}</div>
                                </div>

                                <div className="detail-item">
                                    <div className="detail-label">Instrutor</div>
                                    <div className="detail-value">{selectedRefund.instructor?.full_name || 'N/A'}</div>
                                </div>

                                <div className="detail-item">
                                    <div className="detail-label">Valor Original</div>
                                    <div className="detail-value">R$ {selectedRefund.booking?.price?.toFixed(2) || '0.00'}</div>
                                </div>

                                <div className="detail-item">
                                    <div className="detail-label">Valor Reembolsado</div>
                                    <div className="detail-value" style={{ color: 'var(--danger)' }}>
                                        R$ {Math.abs(Number(selectedRefund.amount)).toFixed(2)}
                                    </div>
                                </div>

                                <div className="detail-item">
                                    <div className="detail-label">Status</div>
                                    <div className="detail-value">
                                        <span className={`badge ${statusConfig[selectedRefund.status]?.class}`}>
                                            {statusConfig[selectedRefund.status]?.label}
                                        </span>
                                    </div>
                                </div>

                                <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                                    <div className="detail-label">Motivo do Cancelamento</div>
                                    <div className="detail-value">
                                        {selectedRefund.booking?.cancellation_reason || selectedRefund.description || 'Não informado'}
                                    </div>
                                </div>

                                <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                                    <div className="detail-label">Data do Processamento</div>
                                    <div className="detail-value">
                                        {format(new Date(selectedRefund.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                                    </div>
                                </div>
                            </div>

                            {selectedRefund.status === 'pending' && (
                                <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <AlertTriangle size={18} color="var(--warning)" />
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                                        Este reembolso está aguardando processamento pelo Stripe. Pode levar até 10 dias úteis.
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
