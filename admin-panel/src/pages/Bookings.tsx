import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, RefreshCw, Eye, XCircle, X, User, GraduationCap, Calendar, DollarSign, MapPin, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { logAdminActivity } from '../lib/activityLog';

interface Booking {
    id: string;
    scheduled_date: string;
    scheduled_time: string;
    duration_minutes: number;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
    price: number;
    lesson_type: string;
    vehicle_type: string;
    meeting_point: string;
    cancellation_reason?: string;
    cancelled_at?: string;
    created_at: string;
    student_id: string;
    instructor_id: string;
    student: { full_name: string } | null;
    instructor: { full_name: string; phone?: string } | null;
}

const statusConfig = {
    pending: { label: 'Pendente', class: 'badge-warning' },
    confirmed: { label: 'Confirmado', class: 'badge-success' },
    cancelled: { label: 'Cancelado', class: 'badge-danger' },
    completed: { label: 'Concluído', class: 'badge-default' },
};

const paymentConfig = {
    pending: { label: 'Aguardando', class: 'badge-warning' },
    completed: { label: 'Pago', class: 'badge-success' },
    failed: { label: 'Falhou', class: 'badge-danger' },
    refunded: { label: 'Reembolsado', class: 'badge-default' },
};

export function Bookings() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [processRefund, setProcessRefund] = useState(true);
    const [isCancelling, setIsCancelling] = useState(false);

    const fetchBookings = async () => {
        setIsLoading(true);
        try {
            let query = supabase
                .from('bookings')
                .select(`
                    *,
                    student:profiles!bookings_student_id_fkey(full_name),
                    instructor:instructors!bookings_instructor_id_fkey(full_name, phone)
                `)
                .order('created_at', { ascending: false })
                .limit(100);

            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            const { data, error } = await query;
            if (error) throw error;
            setBookings(data || []);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, [statusFilter]);

    const handleViewDetails = (booking: Booking) => {
        setSelectedBooking(booking);
        setIsModalOpen(true);
    };

    const openCancelModal = (booking: Booking) => {
        setSelectedBooking(booking);
        setCancelReason('');
        setProcessRefund(booking.payment_status === 'completed');
        setIsCancelModalOpen(true);
    };

    const handleCancelWithRefund = async () => {
        if (!selectedBooking || !cancelReason.trim()) {
            alert('Por favor, informe o motivo do cancelamento.');
            return;
        }

        setIsCancelling(true);
        try {
            // Update booking status
            const { error: bookingError } = await supabase
                .from('bookings')
                .update({
                    status: 'cancelled',
                    cancellation_reason: `[Admin] ${cancelReason}`,
                    cancelled_at: new Date().toISOString(),
                    payment_status: processRefund ? 'refunded' : selectedBooking.payment_status
                })
                .eq('id', selectedBooking.id);

            if (bookingError) throw bookingError;

            // If refund requested and payment was completed, create refund transaction
            if (processRefund && selectedBooking.payment_status === 'completed') {
                await supabase
                    .from('transactions')
                    .insert({
                        booking_id: selectedBooking.id,
                        user_id: selectedBooking.student_id,
                        type: 'refund',
                        amount: -selectedBooking.price,
                        status: 'completed',
                        description: `Reembolso admin: ${cancelReason}`
                    });
            }

            // Log admin activity
            await logAdminActivity({
                action: 'cancel_booking',
                entityType: 'booking',
                entityId: selectedBooking.id,
                entityName: `${selectedBooking.student?.full_name} - ${selectedBooking.instructor?.full_name}`,
                details: {
                    reason: cancelReason,
                    refunded: processRefund,
                    amount: selectedBooking.price
                }
            });

            setIsCancelModalOpen(false);
            setIsModalOpen(false);
            fetchBookings();
            alert(processRefund ? 'Aula cancelada e reembolso processado!' : 'Aula cancelada com sucesso!');
        } catch (error) {
            console.error('Error cancelling booking:', error);
            alert('Erro ao cancelar aula');
        } finally {
            setIsCancelling(false);
        }
    };

    const filtered = bookings.filter(b =>
        b.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.instructor?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'pending').length,
        confirmed: bookings.filter(b => b.status === 'confirmed').length,
        cancelled: bookings.filter(b => b.status === 'cancelled').length,
    };

    return (
        <div>
            <div className="page-header">
                <div className="page-header-content">
                    <h1>Agendamentos</h1>
                    <p>Gerenciamento de aulas</p>
                </div>
                <button className="btn btn-secondary" onClick={fetchBookings}>
                    <RefreshCw size={16} />
                    Atualizar
                </button>
            </div>

            {/* Quick Stats */}
            <div className="quick-stats" style={{ marginBottom: '24px' }}>
                <div className="quick-stat">
                    <div className="value">{stats.total}</div>
                    <div className="label">Total</div>
                </div>
                <div className="quick-stat">
                    <div className="value" style={{ color: 'var(--warning)' }}>{stats.pending}</div>
                    <div className="label">Pendentes</div>
                </div>
                <div className="quick-stat">
                    <div className="value" style={{ color: 'var(--success)' }}>{stats.confirmed}</div>
                    <div className="label">Confirmados</div>
                </div>
                <div className="quick-stat">
                    <div className="value" style={{ color: 'var(--danger)' }}>{stats.cancelled}</div>
                    <div className="label">Cancelados</div>
                </div>
            </div>

            <div className="filters">
                <div className="input-group">
                    <Search size={16} className="input-icon" />
                    <input
                        type="text"
                        className="input"
                        placeholder="Buscar por aluno ou instrutor..."
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
                    <option value="confirmed">Confirmados</option>
                    <option value="cancelled">Cancelados</option>
                    <option value="completed">Concluídos</option>
                </select>
            </div>

            <div className="card">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Data/Hora</th>
                            <th>Aluno</th>
                            <th>Instrutor</th>
                            <th>Valor</th>
                            <th>Status</th>
                            <th>Pagamento</th>
                            <th>Ações</th>
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
                                        <Calendar size={48} />
                                        <h3>Nenhum agendamento</h3>
                                        <p>Não há agendamentos com esses filtros</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filtered.map((booking) => (
                                <tr key={booking.id}>
                                    <td>
                                        <strong>{format(new Date(booking.scheduled_date), 'dd/MM/yyyy', { locale: ptBR })}</strong>
                                        <br />
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            {booking.scheduled_time?.substring(0, 5)}
                                        </span>
                                    </td>
                                    <td>{booking.student?.full_name || 'N/A'}</td>
                                    <td>{booking.instructor?.full_name || 'N/A'}</td>
                                    <td style={{ fontWeight: 500 }}>R$ {booking.price?.toFixed(2) || '0.00'}</td>
                                    <td>
                                        <span className={`badge ${statusConfig[booking.status]?.class || 'badge-default'}`}>
                                            {statusConfig[booking.status]?.label || booking.status}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${paymentConfig[booking.payment_status]?.class || 'badge-default'}`}>
                                            {paymentConfig[booking.payment_status]?.label || booking.payment_status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                                                <button
                                                    className="btn btn-icon btn-ghost"
                                                    onClick={() => openCancelModal(booking)}
                                                    title="Cancelar"
                                                    style={{ color: 'var(--danger)' }}
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            )}
                                            <button
                                                className="btn btn-icon btn-ghost"
                                                title="Ver detalhes"
                                                onClick={() => handleViewDetails(booking)}
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Booking Details Modal */}
            {isModalOpen && selectedBooking && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Detalhes do Agendamento</h2>
                            <button className="btn btn-icon btn-ghost" onClick={() => setIsModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            {/* Status Badges */}
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                                <span className={`badge ${statusConfig[selectedBooking.status]?.class}`} style={{ padding: '6px 12px' }}>
                                    {statusConfig[selectedBooking.status]?.label}
                                </span>
                                <span className={`badge ${paymentConfig[selectedBooking.payment_status]?.class}`} style={{ padding: '6px 12px' }}>
                                    {paymentConfig[selectedBooking.payment_status]?.label}
                                </span>
                            </div>

                            {/* Details Grid */}
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <div className="detail-label"><User size={14} /> Aluno</div>
                                    <div className="detail-value">{selectedBooking.student?.full_name || 'N/A'}</div>
                                </div>
                                <div className="detail-item">
                                    <div className="detail-label"><GraduationCap size={14} /> Instrutor</div>
                                    <div className="detail-value">{selectedBooking.instructor?.full_name || 'N/A'}</div>
                                </div>
                                <div className="detail-item">
                                    <div className="detail-label"><Calendar size={14} /> Data</div>
                                    <div className="detail-value">
                                        {format(new Date(selectedBooking.scheduled_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                    </div>
                                </div>
                                <div className="detail-item">
                                    <div className="detail-label"><Clock size={14} /> Hora</div>
                                    <div className="detail-value">{selectedBooking.scheduled_time?.substring(0, 5)}</div>
                                </div>
                                <div className="detail-item">
                                    <div className="detail-label"><DollarSign size={14} /> Valor</div>
                                    <div className="detail-value" style={{ fontWeight: 600, color: 'var(--success)' }}>
                                        R$ {selectedBooking.price?.toFixed(2)}
                                    </div>
                                </div>
                                {selectedBooking.meeting_point && (
                                    <div className="detail-item">
                                        <div className="detail-label"><MapPin size={14} /> Local</div>
                                        <div className="detail-value">{selectedBooking.meeting_point}</div>
                                    </div>
                                )}
                            </div>

                            {/* Cancellation Info */}
                            {selectedBooking.status === 'cancelled' && selectedBooking.cancellation_reason && (
                                <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                    <div style={{ fontSize: '12px', color: 'var(--danger)', fontWeight: 500, marginBottom: '4px' }}>
                                        <AlertTriangle size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                        Motivo do Cancelamento
                                    </div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                        {selectedBooking.cancellation_reason}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            {selectedBooking.status !== 'cancelled' && selectedBooking.status !== 'completed' && (
                                <button className="btn btn-danger" onClick={() => {
                                    setIsModalOpen(false);
                                    openCancelModal(selectedBooking);
                                }}>
                                    <XCircle size={16} />
                                    Cancelar Aula
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Booking Modal */}
            {isCancelModalOpen && selectedBooking && (
                <div className="modal-overlay" onClick={() => setIsCancelModalOpen(false)}>
                    <div className="modal" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Cancelar Agendamento</h2>
                            <button className="btn btn-icon btn-ghost" onClick={() => setIsCancelModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                                <div style={{ fontSize: '13px' }}>
                                    <strong>{selectedBooking.student?.full_name}</strong> ↔ <strong>{selectedBooking.instructor?.full_name}</strong>
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    {format(new Date(selectedBooking.scheduled_date), 'dd/MM/yyyy', { locale: ptBR })} às {selectedBooking.scheduled_time?.substring(0, 5)} • R$ {selectedBooking.price?.toFixed(2)}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Motivo do cancelamento *</label>
                                <textarea
                                    className="input"
                                    style={{ minHeight: '80px', resize: 'vertical' }}
                                    placeholder="Descreva o motivo..."
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                />
                            </div>

                            {selectedBooking.payment_status === 'completed' && (
                                <div style={{ marginTop: '16px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={processRefund}
                                            onChange={(e) => setProcessRefund(e.target.checked)}
                                        />
                                        <span style={{ fontSize: '13px' }}>
                                            Processar reembolso de R$ {selectedBooking.price?.toFixed(2)}
                                        </span>
                                    </label>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setIsCancelModalOpen(false)}>
                                Voltar
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={handleCancelWithRefund}
                                disabled={isCancelling || !cancelReason.trim()}
                            >
                                {isCancelling ? 'Cancelando...' : processRefund ? 'Cancelar e Reembolsar' : 'Cancelar Aula'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
