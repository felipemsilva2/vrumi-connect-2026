import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    GraduationCap,
    Calendar,
    DollarSign,
    TrendingUp,
    CheckCircle,
    Clock,
    XCircle,
    RefreshCw,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    AlertCircle,
    ChevronRight
} from 'lucide-react';
import { subDays, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Stats {
    totalUsers: number;
    recentUsers: number;
    usersLast7Days: number;
    totalInstructors: number;
    approvedInstructors: number;
    pendingInstructors: number;
    instructorsLast7Days: number;
    totalBookings: number;
    confirmedBookings: number;
    pendingBookings: number;
    cancelledBookings: number;
    bookingsLast7Days: number;
    bookingsLast30Days: number;
    totalRevenue: number;
    platformFees: number;
    refundedAmount: number;
    revenueLast7Days: number;
    revenueLast30Days: number;
}

interface RecentActivity {
    id: string;
    type: 'instructor' | 'booking' | 'user';
    action: string;
    name: string;
    created_at: string;
}

export function Dashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [pendingInstructorsList, setPendingInstructorsList] = useState<any[]>([]);
    const navigate = useNavigate();

    const fetchStats = async () => {
        setIsLoading(true);
        try {
            const now = new Date();
            const sevenDaysAgo = subDays(now, 7);
            const thirtyDaysAgo = subDays(now, 30);

            // Users
            const { count: usersCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            const { count: recentUsersCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', thirtyDaysAgo.toISOString());

            const { count: usersLast7Days } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', sevenDaysAgo.toISOString());

            // Instructors
            const { count: totalInstructors } = await supabase
                .from('instructors')
                .select('*', { count: 'exact', head: true });

            const { count: approvedInstructors } = await supabase
                .from('instructors')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'approved');

            const { count: pendingInstructors } = await supabase
                .from('instructors')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');

            const { count: instructorsLast7Days } = await supabase
                .from('instructors')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', sevenDaysAgo.toISOString());

            // Pending instructors list
            const { data: pendingList } = await supabase
                .from('instructors')
                .select('id, full_name, city, created_at')
                .eq('status', 'pending')
                .order('created_at', { ascending: false })
                .limit(5);

            setPendingInstructorsList(pendingList || []);

            // Bookings
            const { count: totalBookings } = await supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true });

            const { count: confirmedBookings } = await supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'confirmed');

            const { count: pendingBookings } = await supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');

            const { count: cancelledBookings } = await supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'cancelled');

            const { count: bookingsLast7Days } = await supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', sevenDaysAgo.toISOString());

            const { count: bookingsLast30Days } = await supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', thirtyDaysAgo.toISOString());

            // Revenue
            const { data: earningsData } = await supabase
                .from('transactions')
                .select('amount, created_at')
                .eq('type', 'earning')
                .eq('status', 'completed');

            const totalRevenue = earningsData?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;
            const grossRevenue = totalRevenue / 0.85;
            const platformFees = grossRevenue - totalRevenue;

            const revenueLast7Days = earningsData
                ?.filter(tx => new Date(tx.created_at) >= sevenDaysAgo)
                .reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;

            const revenueLast30Days = earningsData
                ?.filter(tx => new Date(tx.created_at) >= thirtyDaysAgo)
                .reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;

            const { data: refundsData } = await supabase
                .from('transactions')
                .select('amount')
                .eq('type', 'refund');

            const refundedAmount = Math.abs(refundsData?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0);

            // Recent Activity (latest bookings and instructors)
            const activities: RecentActivity[] = [];

            const { data: recentBookings } = await supabase
                .from('bookings')
                .select(`
                    id, status, created_at,
                    instructor:instructors!bookings_instructor_id_fkey(full_name)
                `)
                .order('created_at', { ascending: false })
                .limit(3);

            recentBookings?.forEach(b => {
                activities.push({
                    id: b.id,
                    type: 'booking',
                    action: b.status === 'confirmed' ? 'Nova aula confirmada' : b.status === 'cancelled' ? 'Aula cancelada' : 'Nova aula agendada',
                    name: (b.instructor as any)?.full_name || 'Instrutor',
                    created_at: b.created_at
                });
            });

            const { data: recentInstructors } = await supabase
                .from('instructors')
                .select('id, full_name, status, created_at')
                .order('created_at', { ascending: false })
                .limit(3);

            recentInstructors?.forEach(i => {
                activities.push({
                    id: i.id,
                    type: 'instructor',
                    action: i.status === 'pending' ? 'Novo cadastro' : i.status === 'approved' ? 'Aprovado' : 'Instrutor atualizado',
                    name: i.full_name,
                    created_at: i.created_at
                });
            });

            activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setRecentActivity(activities.slice(0, 5));

            setStats({
                totalUsers: usersCount || 0,
                recentUsers: recentUsersCount || 0,
                usersLast7Days: usersLast7Days || 0,
                totalInstructors: totalInstructors || 0,
                approvedInstructors: approvedInstructors || 0,
                pendingInstructors: pendingInstructors || 0,
                instructorsLast7Days: instructorsLast7Days || 0,
                totalBookings: totalBookings || 0,
                confirmedBookings: confirmedBookings || 0,
                pendingBookings: pendingBookings || 0,
                cancelledBookings: cancelledBookings || 0,
                bookingsLast7Days: bookingsLast7Days || 0,
                bookingsLast30Days: bookingsLast30Days || 0,
                totalRevenue,
                platformFees,
                refundedAmount,
                revenueLast7Days,
                revenueLast30Days,
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (isLoading) {
        return (
            <div className="loading-screen" style={{ height: 'auto', padding: '100px' }}>
                <div className="spinner"></div>
                <p style={{ color: 'var(--text-muted)' }}>Carregando estatísticas...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <div className="page-header-content">
                    <h1>Dashboard</h1>
                    <p>Visão geral do Vrumi Connect</p>
                </div>
                <button className="btn btn-secondary" onClick={fetchStats}>
                    <RefreshCw size={16} />
                    Atualizar
                </button>
            </div>

            {/* Quick Stats Bar */}
            <div className="quick-stats">
                <div className="quick-stat">
                    <div className="value">{stats?.totalUsers}</div>
                    <div className="label">Usuários</div>
                </div>
                <div className="quick-stat">
                    <div className="value">{stats?.totalInstructors}</div>
                    <div className="label">Instrutores</div>
                </div>
                <div className="quick-stat">
                    <div className="value">{stats?.totalBookings}</div>
                    <div className="label">Aulas</div>
                </div>
                <div className="quick-stat">
                    <div className="value" style={{ color: 'var(--success)' }}>R$ {stats?.platformFees.toFixed(0)}</div>
                    <div className="label">Receita</div>
                </div>
                <div className="quick-stat">
                    <div className="value" style={{ color: 'var(--warning)' }}>{stats?.pendingInstructors}</div>
                    <div className="label">Pendentes</div>
                </div>
            </div>

            {/* Dashboard Grid */}
            <div className="dashboard-grid">
                {/* Main Stats */}
                <div className="dashboard-main">
                    {/* Users & Instructors */}
                    <div className="section-header">
                        <Users size={18} />
                        <h3>Usuários & Instrutores</h3>
                    </div>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-icon blue">
                                    <Users size={20} />
                                </div>
                            </div>
                            <div className="stat-label">Total de Usuários</div>
                            <div className="stat-value">{stats?.totalUsers}</div>
                            <div className="stat-trend positive">
                                <ArrowUpRight size={14} />
                                +{stats?.usersLast7Days} esta semana
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-icon green">
                                    <GraduationCap size={20} />
                                </div>
                            </div>
                            <div className="stat-label">Instrutores Aprovados</div>
                            <div className="stat-value">{stats?.approvedInstructors}</div>
                            <div className="stat-trend positive">
                                <ArrowUpRight size={14} />
                                +{stats?.instructorsLast7Days} esta semana
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-icon yellow">
                                    <Clock size={20} />
                                </div>
                            </div>
                            <div className="stat-label">Aguardando Aprovação</div>
                            <div className="stat-value">{stats?.pendingInstructors}</div>
                            {(stats?.pendingInstructors || 0) > 0 && (
                                <div className="stat-trend negative">
                                    <AlertCircle size={14} />
                                    Requer ação
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bookings */}
                    <div className="section-header" style={{ marginTop: '24px' }}>
                        <Calendar size={18} />
                        <h3>Agendamentos</h3>
                    </div>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-icon purple">
                                    <Calendar size={20} />
                                </div>
                            </div>
                            <div className="stat-label">Total de Aulas</div>
                            <div className="stat-value">{stats?.totalBookings}</div>
                            <div className="stat-compare">
                                <span>7 dias: {stats?.bookingsLast7Days}</span>
                                <span>30 dias: {stats?.bookingsLast30Days}</span>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-icon green">
                                    <CheckCircle size={20} />
                                </div>
                            </div>
                            <div className="stat-label">Confirmadas</div>
                            <div className="stat-value">{stats?.confirmedBookings}</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-icon red">
                                    <XCircle size={20} />
                                </div>
                            </div>
                            <div className="stat-label">Canceladas</div>
                            <div className="stat-value">{stats?.cancelledBookings}</div>
                        </div>
                    </div>

                    {/* Financial */}
                    <div className="section-header" style={{ marginTop: '24px' }}>
                        <DollarSign size={18} />
                        <h3>Financeiro</h3>
                    </div>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-icon green">
                                    <TrendingUp size={20} />
                                </div>
                            </div>
                            <div className="stat-label">Receita Plataforma (15%)</div>
                            <div className="stat-value" style={{ color: 'var(--success)' }}>
                                R$ {stats?.platformFees.toFixed(2)}
                            </div>
                            <div className="stat-compare">
                                <span>7 dias: R$ {((stats?.revenueLast7Days || 0) * 0.15 / 0.85).toFixed(0)}</span>
                                <span>30 dias: R$ {((stats?.revenueLast30Days || 0) * 0.15 / 0.85).toFixed(0)}</span>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-icon blue">
                                    <DollarSign size={20} />
                                </div>
                            </div>
                            <div className="stat-label">Receita Instrutores (85%)</div>
                            <div className="stat-value" style={{ color: 'var(--info)' }}>
                                R$ {stats?.totalRevenue.toFixed(2)}
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-icon red">
                                    <ArrowDownRight size={20} />
                                </div>
                            </div>
                            <div className="stat-label">Reembolsos</div>
                            <div className="stat-value" style={{ color: 'var(--danger)' }}>
                                R$ {stats?.refundedAmount.toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="dashboard-sidebar">
                    {/* Pending Instructors */}
                    {pendingInstructorsList.length > 0 && (
                        <div className="card sidebar-card">
                            <div className="card-header">
                                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <AlertCircle size={16} color="var(--warning)" />
                                    Aguardando Aprovação
                                </div>
                            </div>
                            <div className="card-content">
                                {pendingInstructorsList.map(instructor => (
                                    <div
                                        key={instructor.id}
                                        className="pending-item"
                                        onClick={() => navigate('/instructors')}
                                    >
                                        <div className="pending-info">
                                            <div className="pending-name">{instructor.full_name}</div>
                                            <div className="pending-sub">{instructor.city}</div>
                                        </div>
                                        <div className="pending-time">
                                            {formatDistanceToNow(new Date(instructor.created_at), { addSuffix: true, locale: ptBR })}
                                        </div>
                                    </div>
                                ))}
                                <button
                                    className="btn btn-ghost"
                                    style={{ width: '100%', marginTop: '8px' }}
                                    onClick={() => navigate('/instructors')}
                                >
                                    Ver todos
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Recent Activity */}
                    <div className="card sidebar-card">
                        <div className="card-header">
                            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Activity size={16} />
                                Atividade Recente
                            </div>
                        </div>
                        <div className="card-content">
                            {recentActivity.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Nenhuma atividade recente</p>
                            ) : (
                                recentActivity.map(activity => (
                                    <div key={activity.id} className="activity-mini">
                                        <div className="activity-mini-icon" style={{
                                            background: activity.type === 'booking' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                            color: activity.type === 'booking' ? '#8b5cf6' : 'var(--accent)'
                                        }}>
                                            {activity.type === 'booking' ? <Calendar size={14} /> : <GraduationCap size={14} />}
                                        </div>
                                        <div className="activity-mini-content">
                                            <div className="activity-mini-action">{activity.action}</div>
                                            <div className="activity-mini-name">{activity.name}</div>
                                        </div>
                                        <div className="activity-mini-time">
                                            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: ptBR })}
                                        </div>
                                    </div>
                                ))
                            )}
                            <button
                                className="btn btn-ghost"
                                style={{ width: '100%', marginTop: '8px' }}
                                onClick={() => navigate('/activity')}
                            >
                                Ver histórico
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
