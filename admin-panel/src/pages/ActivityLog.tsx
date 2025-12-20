import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, RefreshCw, User, Calendar, FileText, CreditCard, CheckCircle, XCircle, Ban, Clock, Activity, Filter } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ActivityLog {
    id: string;
    admin_id: string;
    admin_email: string;
    action: string;
    entity_type: string;
    entity_id: string;
    entity_name: string;
    details: Record<string, any>;
    created_at: string;
}

const actionConfig: Record<string, { label: string; icon: any; color: string }> = {
    approve: { label: 'Aprovado', icon: CheckCircle, color: 'var(--success)' },
    reject: { label: 'Rejeitado', icon: XCircle, color: 'var(--danger)' },
    suspend: { label: 'Suspenso', icon: Ban, color: 'var(--warning)' },
    reactivate: { label: 'Reativado', icon: CheckCircle, color: 'var(--success)' },
    update: { label: 'Atualizado', icon: FileText, color: 'var(--info)' },
    create: { label: 'Criado', icon: FileText, color: 'var(--accent)' },
    cancel: { label: 'Cancelado', icon: XCircle, color: 'var(--danger)' },
    refund: { label: 'Reembolso', icon: CreditCard, color: 'var(--danger)' },
};

const entityConfig: Record<string, { label: string; icon: any }> = {
    instructor: { label: 'Instrutor', icon: User },
    booking: { label: 'Agendamento', icon: Calendar },
    user: { label: 'Usuário', icon: User },
    transaction: { label: 'Transação', icon: CreditCard },
};

export function ActivityLog() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionFilter, setActionFilter] = useState<string>('all');
    const [entityFilter, setEntityFilter] = useState<string>('all');

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            let query = supabase
                .from('admin_activity_log')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (actionFilter !== 'all') {
                query = query.eq('action', actionFilter);
            }
            if (entityFilter !== 'all') {
                query = query.eq('entity_type', entityFilter);
            }

            const { data, error } = await query;
            if (error) throw error;
            setLogs(data || []);
        } catch (error) {
            console.error('Error fetching activity logs:', error);
            setLogs([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [actionFilter, entityFilter]);

    const filtered = logs.filter(log =>
        searchTerm === '' ||
        log.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.admin_email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getActionConfig = (action: string) => {
        return actionConfig[action] || { label: action, icon: Activity, color: 'var(--text-muted)' };
    };

    const getEntityConfig = (entityType: string) => {
        return entityConfig[entityType] || { label: entityType, icon: FileText };
    };

    return (
        <div>
            <div className="page-header">
                <div className="page-header-content">
                    <h1>Histórico de Atividades</h1>
                    <p>Auditoria de ações administrativas</p>
                </div>
                <button className="btn btn-secondary" onClick={fetchLogs}>
                    <RefreshCw size={16} />
                    Atualizar
                </button>
            </div>

            {/* Stats */}
            <div className="quick-stats" style={{ marginBottom: '24px' }}>
                <div className="quick-stat">
                    <div className="value">{logs.length}</div>
                    <div className="label">Total</div>
                </div>
                <div className="quick-stat">
                    <div className="value" style={{ color: 'var(--success)' }}>
                        {logs.filter(l => l.action === 'approve').length}
                    </div>
                    <div className="label">Aprovações</div>
                </div>
                <div className="quick-stat">
                    <div className="value" style={{ color: 'var(--danger)' }}>
                        {logs.filter(l => l.action === 'reject').length}
                    </div>
                    <div className="label">Rejeições</div>
                </div>
                <div className="quick-stat">
                    <div className="value" style={{ color: 'var(--warning)' }}>
                        {logs.filter(l => l.action === 'suspend').length}
                    </div>
                    <div className="label">Suspensões</div>
                </div>
            </div>

            <div className="filters">
                <div className="input-group">
                    <Search size={16} className="input-icon" />
                    <input
                        type="text"
                        className="input"
                        placeholder="Buscar por nome ou admin..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="select"
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                >
                    <option value="all">Todas as Ações</option>
                    <option value="approve">Aprovações</option>
                    <option value="reject">Rejeições</option>
                    <option value="suspend">Suspensões</option>
                    <option value="reactivate">Reativações</option>
                    <option value="update">Atualizações</option>
                </select>
                <select
                    className="select"
                    value={entityFilter}
                    onChange={(e) => setEntityFilter(e.target.value)}
                >
                    <option value="all">Todas as Entidades</option>
                    <option value="instructor">Instrutores</option>
                    <option value="booking">Agendamentos</option>
                    <option value="user">Usuários</option>
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
                        <Activity size={48} />
                        <h3>Nenhuma atividade registrada</h3>
                        <p>Ações administrativas aparecerão aqui</p>
                    </div>
                ) : (
                    <div className="activity-list">
                        {filtered.map((log) => {
                            const action = getActionConfig(log.action);
                            const entity = getEntityConfig(log.entity_type);
                            const ActionIcon = action.icon;
                            const EntityIcon = entity.icon;

                            return (
                                <div key={log.id} className="activity-item">
                                    <div className="activity-icon" style={{ background: `${action.color}20`, color: action.color }}>
                                        <ActionIcon size={18} />
                                    </div>
                                    <div className="activity-content">
                                        <div className="activity-title">
                                            <strong>{action.label}</strong>
                                            <span className="activity-entity">
                                                <EntityIcon size={12} />
                                                {entity.label}: {log.entity_name || 'N/A'}
                                            </span>
                                        </div>
                                        <div className="activity-meta">
                                            <span className="activity-admin">{log.admin_email}</span>
                                            <span className="activity-time">
                                                <Clock size={12} />
                                                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                                            </span>
                                        </div>
                                        {log.details?.reason && (
                                            <div className="activity-details">
                                                Motivo: {log.details.reason}
                                            </div>
                                        )}
                                    </div>
                                    <div className="activity-date">
                                        {format(new Date(log.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
