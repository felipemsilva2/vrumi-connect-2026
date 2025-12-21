import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, RefreshCw, MessageSquare, AlertCircle, CheckCircle, Clock, X, Send, User, Calendar } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Ticket {
    id: string;
    user_id: string;
    user_email: string;
    subject: string;
    message: string;
    priority: 'normal' | 'high' | 'critical';
    status: 'open' | 'in_progress' | 'resolved';
    created_at: string;
    updated_at: string;
    user?: { full_name: string };
    responses?: TicketResponse[];
}

interface TicketResponse {
    id: string;
    ticket_id: string;
    admin_id: string;
    admin_email: string;
    message: string;
    created_at: string;
}

const priorityConfig = {
    normal: { label: 'Normal', class: 'badge-default' },
    high: { label: 'Alta', class: 'badge-warning' },
    critical: { label: 'Crítica', class: 'badge-danger' },
};

const statusConfig = {
    open: { label: 'Aberto', class: 'badge-danger', icon: AlertCircle },
    in_progress: { label: 'Em Andamento', class: 'badge-warning', icon: Clock },
    resolved: { label: 'Resolvido', class: 'badge-success', icon: CheckCircle },
};

export function SupportTickets() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [responseText, setResponseText] = useState('');
    const [isSending, setIsSending] = useState(false);

    const fetchTickets = async () => {
        setIsLoading(true);
        try {
            let query = supabase
                .from('support_tickets')
                .select('*')
                .order('created_at', { ascending: false });

            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            const { data, error } = await query;
            if (error) throw error;

            // Fetch user names
            const userIds = [...new Set(data?.map(t => t.user_id) || [])];
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', userIds);

            const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
            const ticketsWithUsers = data?.map(t => ({
                ...t,
                user: profileMap.get(t.user_id)
            })) || [];

            setTickets(ticketsWithUsers);
        } catch (error) {
            console.error('Error fetching tickets:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, [statusFilter]);

    const handleViewTicket = async (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setIsModalOpen(true);
        setResponseText('');

        // Mark as in_progress if open
        if (ticket.status === 'open') {
            await supabase
                .from('support_tickets')
                .update({ status: 'in_progress' })
                .eq('id', ticket.id);
            fetchTickets();
        }
    };

    const handleSendResponse = async () => {
        if (!selectedTicket || !responseText.trim()) return;

        setIsSending(true);
        try {
            const { data: { user: _user } } = await supabase.auth.getUser();

            // For now, we'll just update the ticket status
            // In a full implementation, you'd have a ticket_responses table
            const { error } = await supabase
                .from('support_tickets')
                .update({
                    status: 'in_progress',
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedTicket.id);

            if (!error) {
                setResponseText('');
                alert('Resposta enviada! (Em produção, seria enviado email ao usuário)');
                fetchTickets();
            }
        } catch (error) {
            console.error('Error sending response:', error);
        } finally {
            setIsSending(false);
        }
    };

    const handleResolve = async () => {
        if (!selectedTicket) return;

        const { error } = await supabase
            .from('support_tickets')
            .update({ status: 'resolved', updated_at: new Date().toISOString() })
            .eq('id', selectedTicket.id);

        if (!error) {
            setIsModalOpen(false);
            fetchTickets();
        }
    };

    const handleReopen = async () => {
        if (!selectedTicket) return;

        const { error } = await supabase
            .from('support_tickets')
            .update({ status: 'open', updated_at: new Date().toISOString() })
            .eq('id', selectedTicket.id);

        if (!error) {
            fetchTickets();
            setSelectedTicket({ ...selectedTicket, status: 'open' });
        }
    };

    const handleChangePriority = async (priority: 'normal' | 'high' | 'critical') => {
        if (!selectedTicket) return;

        const { error } = await supabase
            .from('support_tickets')
            .update({ priority })
            .eq('id', selectedTicket.id);

        if (!error) {
            fetchTickets();
            setSelectedTicket({ ...selectedTicket, priority });
        }
    };

    const filtered = tickets.filter(t =>
        t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="page-header">
                <div className="page-header-content">
                    <h1>Tickets de Suporte</h1>
                    <p>{tickets.filter(t => t.status !== 'resolved').length} tickets abertos</p>
                </div>
                <button className="btn btn-secondary" onClick={fetchTickets}>
                    <RefreshCw size={16} />
                    Atualizar
                </button>
            </div>

            {/* Quick Stats */}
            <div className="quick-stats" style={{ marginBottom: '24px' }}>
                <div className="quick-stat">
                    <div className="value" style={{ color: 'var(--danger)' }}>
                        {tickets.filter(t => t.status === 'open').length}
                    </div>
                    <div className="label">Abertos</div>
                </div>
                <div className="quick-stat">
                    <div className="value" style={{ color: 'var(--warning)' }}>
                        {tickets.filter(t => t.status === 'in_progress').length}
                    </div>
                    <div className="label">Em Andamento</div>
                </div>
                <div className="quick-stat">
                    <div className="value" style={{ color: 'var(--success)' }}>
                        {tickets.filter(t => t.status === 'resolved').length}
                    </div>
                    <div className="label">Resolvidos</div>
                </div>
                <div className="quick-stat">
                    <div className="value" style={{ color: 'var(--danger)' }}>
                        {tickets.filter(t => t.priority === 'critical').length}
                    </div>
                    <div className="label">Críticos</div>
                </div>
            </div>

            <div className="filters">
                <div className="input-group">
                    <Search size={16} className="input-icon" />
                    <input
                        type="text"
                        className="input"
                        placeholder="Buscar por assunto, email ou nome..."
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
                    <option value="open">Abertos</option>
                    <option value="in_progress">Em Andamento</option>
                    <option value="resolved">Resolvidos</option>
                </select>
            </div>

            <div className="card">
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '48px' }}>
                        <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
                        <p style={{ color: 'var(--text-muted)' }}>Carregando...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state">
                        <MessageSquare size={48} />
                        <h3>Nenhum ticket encontrado</h3>
                        <p>Os tickets de suporte aparecerão aqui</p>
                    </div>
                ) : (
                    <div className="ticket-list">
                        {filtered.map((ticket) => {
                            const status = statusConfig[ticket.status];
                            const priority = priorityConfig[ticket.priority];
                            const StatusIcon = status.icon;

                            return (
                                <div
                                    key={ticket.id}
                                    className="ticket-item"
                                    onClick={() => handleViewTicket(ticket)}
                                >
                                    <div className="ticket-status-icon" style={{
                                        background: `var(--${ticket.status === 'open' ? 'danger' : ticket.status === 'in_progress' ? 'warning' : 'success'})20`,
                                        color: `var(--${ticket.status === 'open' ? 'danger' : ticket.status === 'in_progress' ? 'warning' : 'success'})`
                                    }}>
                                        <StatusIcon size={18} />
                                    </div>
                                    <div className="ticket-content">
                                        <div className="ticket-header">
                                            <h4>{ticket.subject}</h4>
                                            <div className="ticket-badges">
                                                <span className={`badge ${priority.class}`}>{priority.label}</span>
                                                <span className={`badge ${status.class}`}>{status.label}</span>
                                            </div>
                                        </div>
                                        <p className="ticket-preview">{ticket.message.substring(0, 100)}...</p>
                                        <div className="ticket-meta">
                                            <span><User size={12} /> {ticket.user?.full_name || ticket.user_email}</span>
                                            <span><Calendar size={12} /> {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: ptBR })}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Ticket Detail Modal */}
            {isModalOpen && selectedTicket && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Ticket #{selectedTicket.id.substring(0, 8)}</h2>
                            <button className="btn btn-icon btn-ghost" onClick={() => setIsModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            {/* Status & Priority */}
                            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                <select
                                    className="select"
                                    value={selectedTicket.priority}
                                    onChange={(e) => handleChangePriority(e.target.value as any)}
                                    style={{ flex: 1 }}
                                >
                                    <option value="normal">Prioridade: Normal</option>
                                    <option value="high">Prioridade: Alta</option>
                                    <option value="critical">Prioridade: Crítica</option>
                                </select>
                                <span className={`badge ${statusConfig[selectedTicket.status].class}`} style={{ padding: '8px 16px' }}>
                                    {statusConfig[selectedTicket.status].label}
                                </span>
                            </div>

                            {/* User Info */}
                            <div className="detail-grid" style={{ marginBottom: '20px' }}>
                                <div className="detail-item">
                                    <div className="detail-label">Usuário</div>
                                    <div className="detail-value">{selectedTicket.user?.full_name || 'N/A'}</div>
                                </div>
                                <div className="detail-item">
                                    <div className="detail-label">Email</div>
                                    <div className="detail-value">{selectedTicket.user_email}</div>
                                </div>
                                <div className="detail-item">
                                    <div className="detail-label">Data</div>
                                    <div className="detail-value">
                                        {format(new Date(selectedTicket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    </div>
                                </div>
                            </div>

                            {/* Subject & Message */}
                            <div style={{ marginBottom: '20px' }}>
                                <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>{selectedTicket.subject}</h3>
                                <div style={{
                                    padding: '16px',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: '13px',
                                    lineHeight: '1.6',
                                    color: 'var(--text-secondary)'
                                }}>
                                    {selectedTicket.message}
                                </div>
                            </div>

                            {/* Response */}
                            {selectedTicket.status !== 'resolved' && (
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '8px' }}>
                                        Responder ao usuário
                                    </label>
                                    <textarea
                                        className="input"
                                        style={{ minHeight: '100px', resize: 'vertical' }}
                                        placeholder="Digite sua resposta..."
                                        value={responseText}
                                        onChange={(e) => setResponseText(e.target.value)}
                                    />
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleSendResponse}
                                        disabled={isSending || !responseText.trim()}
                                        style={{ marginTop: '8px' }}
                                    >
                                        <Send size={16} />
                                        {isSending ? 'Enviando...' : 'Enviar Resposta'}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            {selectedTicket.status === 'resolved' ? (
                                <button className="btn btn-secondary" onClick={handleReopen}>
                                    Reabrir Ticket
                                </button>
                            ) : (
                                <button className="btn btn-success" onClick={handleResolve}>
                                    <CheckCircle size={16} />
                                    Marcar como Resolvido
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
