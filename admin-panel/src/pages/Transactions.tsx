import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, RefreshCw, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Transaction {
    id: string;
    amount: number;
    type: 'earning' | 'refund' | 'payout';
    status: 'pending' | 'completed' | 'failed';
    description: string | null;
    created_at: string;
    instructor: { full_name: string } | null;
}

const typeConfig = {
    earning: { label: 'Receita', class: 'badge-success', icon: TrendingUp },
    refund: { label: 'Reembolso', class: 'badge-danger', icon: TrendingDown },
    payout: { label: 'Repasse', class: 'badge-default', icon: DollarSign },
};

export function Transactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    const fetchTransactions = async () => {
        setIsLoading(true);
        try {
            let query = supabase
                .from('transactions')
                .select(`
          *,
          instructor:instructors!transactions_instructor_id_fkey(full_name)
        `)
                .order('created_at', { ascending: false })
                .limit(100);

            if (typeFilter !== 'all') {
                query = query.eq('type', typeFilter);
            }

            const { data, error } = await query;
            if (error) throw error;
            setTransactions(data || []);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [typeFilter]);

    const filtered = transactions.filter(t =>
        t.instructor?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate stats
    const earnings = transactions
        .filter(t => t.type === 'earning' && t.status === 'completed')
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const refunds = Math.abs(transactions
        .filter(t => t.type === 'refund')
        .reduce((sum, t) => sum + Number(t.amount), 0));

    const grossRevenue = earnings / 0.85;
    const platformFees = grossRevenue - earnings;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Transações</h1>
                    <p className="page-subtitle">Histórico financeiro</p>
                </div>
                <button className="btn btn-outline" onClick={fetchTransactions}>
                    <RefreshCw size={18} />
                    Atualizar
                </button>
            </div>

            {/* Financial Stats */}
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card">
                    <div className="label">Receita Instrutores (85%)</div>
                    <div className="value" style={{ color: 'var(--success)' }}>
                        R$ {earnings.toFixed(2)}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="label">Taxa Plataforma (15%)</div>
                    <div className="value" style={{ color: 'var(--primary)' }}>
                        R$ {platformFees.toFixed(2)}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="label">Reembolsos</div>
                    <div className="value" style={{ color: 'var(--danger)' }}>
                        R$ {refunds.toFixed(2)}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="label">Receita Líquida Plataforma</div>
                    <div className="value" style={{ color: 'var(--text)' }}>
                        R$ {(platformFees - (refunds * 0.15)).toFixed(2)}
                    </div>
                </div>
            </div>

            <div className="filters">
                <div className="input-group">
                    <Search size={18} className="icon" />
                    <input
                        type="text"
                        className="input"
                        placeholder="Buscar por instrutor ou descrição..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="select"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                >
                    <option value="all">Todos os Tipos</option>
                    <option value="earning">Receitas</option>
                    <option value="refund">Reembolsos</option>
                    <option value="payout">Repasses</option>
                </select>
            </div>

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Instrutor</th>
                                <th>Descrição</th>
                                <th>Tipo</th>
                                <th style={{ textAlign: 'right' }}>Valor</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                                        Carregando...
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                        Nenhuma transação encontrada
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((tx) => {
                                    const config = typeConfig[tx.type] || typeConfig.earning;
                                    const Icon = config.icon;

                                    return (
                                        <tr key={tx.id}>
                                            <td>
                                                {format(new Date(tx.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                            </td>
                                            <td>{tx.instructor?.full_name || 'N/A'}</td>
                                            <td style={{ color: 'var(--text-muted)' }}>
                                                {tx.description || 'Sem descrição'}
                                            </td>
                                            <td>
                                                <span className={`badge ${config.class}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <Icon size={14} />
                                                    {config.label}
                                                </span>
                                            </td>
                                            <td style={{
                                                textAlign: 'right',
                                                fontWeight: 'bold',
                                                color: Number(tx.amount) >= 0 ? 'var(--success)' : 'var(--danger)'
                                            }}>
                                                {Number(tx.amount) >= 0 ? '+' : ''}R$ {Number(tx.amount).toFixed(2)}
                                            </td>
                                            <td>
                                                <span className={`badge ${tx.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                                                    {tx.status === 'completed' ? 'Concluído' : tx.status === 'pending' ? 'Pendente' : 'Falhou'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
