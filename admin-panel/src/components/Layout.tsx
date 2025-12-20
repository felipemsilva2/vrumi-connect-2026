import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    Calendar,
    DollarSign,
    LogOut,
    Shield,
    RotateCcw,
    Activity,
    Headphones,
    MessageCircle,
    Settings,
    Bell
} from 'lucide-react';

const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/instructors', label: 'Instrutores', icon: GraduationCap, badgeKey: 'pendingInstructors' },
    { path: '/bookings', label: 'Agendamentos', icon: Calendar },
    { path: '/transactions', label: 'Transações', icon: DollarSign },
    { path: '/refunds', label: 'Reembolsos', icon: RotateCcw },
    { path: '/support', label: 'Suporte', icon: Headphones },
    { path: '/chat', label: 'Chat Monitor', icon: MessageCircle },
    { path: '/notifications', label: 'Notificações', icon: Bell },
    { path: '/activity', label: 'Atividades', icon: Activity },
    { path: '/users', label: 'Usuários', icon: Users },
    { path: '/settings', label: 'Configurações', icon: Settings },
];

export function Layout() {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [pendingInstructors, setPendingInstructors] = useState(0);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user);
        });

        // Get pending instructors count
        supabase
            .from('instructors')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending')
            .then(({ count }) => {
                setPendingInstructors(count || 0);
            });
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const getInitials = (email: string) => {
        return email?.substring(0, 2).toUpperCase() || 'AD';
    };

    return (
        <div className="layout">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <div className="sidebar-logo-icon">
                            <Shield size={18} />
                        </div>
                        <h1>Vrumi</h1>
                        <span>Admin</span>
                    </div>
                </div>

                <nav>
                    <div className="nav-section">
                        <div className="nav-section-title">Menu</div>
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/'}
                                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            >
                                <item.icon size={18} />
                                {item.label}
                                {item.badgeKey === 'pendingInstructors' && pendingInstructors > 0 && (
                                    <span className="nav-badge">{pendingInstructors}</span>
                                )}
                            </NavLink>
                        ))}
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-menu">
                        <div className="user-avatar">
                            {getInitials(user?.email)}
                        </div>
                        <div className="user-info">
                            <div className="user-name">{user?.email?.split('@')[0]}</div>
                            <div className="user-role">Administrador</div>
                        </div>
                        <button className="logout-btn" onClick={handleLogout} title="Sair">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}
