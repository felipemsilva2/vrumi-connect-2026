import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, RefreshCw, Eye, Shield, UserX, Users as UsersIcon, X, Calendar, Mail, Phone, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface User {
    id: string;
    full_name: string | null;
    email?: string;
    created_at: string;
    roles: string[];
    avatar_url?: string;
    // Instructor data if available
    instructor?: {
        phone?: string;
        city?: string;
        state?: string;
        status?: string;
        price_per_lesson?: number;
    };
}

export function Users() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            // Fetch profiles
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, created_at')
                .order('created_at', { ascending: false })
                .limit(100);

            if (profilesError) {
                console.error('Error fetching profiles:', profilesError);
                throw profilesError;
            }

            // Fetch all user_roles
            const { data: userRoles } = await supabase
                .from('user_roles')
                .select('user_id, role');

            // Fetch instructor data
            const { data: instructors } = await supabase
                .from('instructors')
                .select('user_id, email, phone, city, state, status, price_per_lesson');

            // Fetch emails from auth.users via edge function
            let emailsMap = new Map<string, string>();
            try {
                const { data: emailData, error: emailError } = await supabase.functions.invoke('admin-get-users');
                if (!emailError && emailData?.users) {
                    emailData.users.forEach((u: { id: string; email: string }) => {
                        if (u.email) emailsMap.set(u.id, u.email);
                    });
                }
            } catch (e) {
                console.warn('Could not fetch user emails:', e);
            }

            // Create maps
            const rolesMap = new Map<string, string[]>();
            userRoles?.forEach(r => {
                const existing = rolesMap.get(r.user_id) || [];
                existing.push(r.role);
                rolesMap.set(r.user_id, existing);
            });

            const instructorMap = new Map<string, any>();
            instructors?.forEach(i => {
                if (i.user_id) {
                    instructorMap.set(i.user_id, i);
                }
            });

            // Merge data
            const mergedUsers: User[] = (profiles || []).map(profile => {
                const instructor = instructorMap.get(profile.id);
                return {
                    ...profile,
                    email: emailsMap.get(profile.id) || instructor?.email || undefined,
                    roles: rolesMap.get(profile.id) || [],
                    instructor: instructor ? {
                        phone: instructor.phone,
                        city: instructor.city,
                        state: instructor.state,
                        status: instructor.status,
                        price_per_lesson: instructor.price_per_lesson
                    } : undefined
                };
            });

            setUsers(mergedUsers);
        } catch (error) {
            console.error('Error fetching users:', error);
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleMakeAdmin = async (userId: string) => {
        if (!confirm('Tornar este usuário administrador?')) return;

        const { error } = await supabase
            .from('user_roles')
            .insert({ user_id: userId, role: 'admin' });

        if (!error) {
            fetchUsers();
            if (selectedUser?.id === userId) {
                setSelectedUser({ ...selectedUser, roles: [...selectedUser.roles, 'admin'] });
            }
        } else {
            alert('Erro ao adicionar role: ' + error.message);
        }
    };

    const handleRemoveAdmin = async (userId: string) => {
        if (!confirm('Remover permissão de administrador?')) return;

        const { error } = await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', userId)
            .eq('role', 'admin');

        if (!error) {
            fetchUsers();
            if (selectedUser?.id === userId) {
                setSelectedUser({ ...selectedUser, roles: selectedUser.roles.filter(r => r !== 'admin') });
            }
        }
    };

    const handleViewDetails = (user: User) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const filtered = users.filter(u =>
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getInitials = (name: string | null) => {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    };

    return (
        <div>
            <div className="page-header">
                <div className="page-header-content">
                    <h1>Usuários</h1>
                    <p>{users.length} usuários cadastrados</p>
                </div>
                <button className="btn btn-secondary" onClick={fetchUsers}>
                    <RefreshCw size={16} />
                    Atualizar
                </button>
            </div>

            {/* Quick Stats */}
            <div className="quick-stats" style={{ marginBottom: '24px' }}>
                <div className="quick-stat">
                    <div className="value">{users.length}</div>
                    <div className="label">Total</div>
                </div>
                <div className="quick-stat">
                    <div className="value" style={{ color: 'var(--warning)' }}>
                        {users.filter(u => u.roles.includes('admin')).length}
                    </div>
                    <div className="label">Admins</div>
                </div>
                <div className="quick-stat">
                    <div className="value" style={{ color: 'var(--info)' }}>
                        {users.filter(u => u.roles.includes('instructor')).length}
                    </div>
                    <div className="label">Instrutores</div>
                </div>
                <div className="quick-stat">
                    <div className="value" style={{ color: 'var(--text-secondary)' }}>
                        {users.filter(u => u.roles.length === 0).length}
                    </div>
                    <div className="label">Usuários</div>
                </div>
            </div>

            <div className="filters">
                <div className="input-group">
                    <Search size={16} className="input-icon" />
                    <input
                        type="text"
                        className="input"
                        placeholder="Buscar por nome ou email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="card">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Usuário</th>
                            <th>Email</th>
                            <th>Roles</th>
                            <th>Data Cadastro</th>
                            <th style={{ width: '100px' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '48px' }}>
                                    <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
                                    <p style={{ color: 'var(--text-muted)' }}>Carregando...</p>
                                </td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={5}>
                                    <div className="empty-state">
                                        <UsersIcon size={48} />
                                        <h3>Nenhum usuário encontrado</h3>
                                        <p>Tente ajustar a busca</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filtered.map((user) => {
                                const isAdmin = user.roles.includes('admin');

                                return (
                                    <tr key={user.id}>
                                        <td>
                                            <div className="user-cell">
                                                <div className="user-cell-avatar">
                                                    {getInitials(user.full_name)}
                                                </div>
                                                <div className="user-cell-info">
                                                    <div className="user-cell-name">
                                                        {user.full_name || 'Sem nome'}
                                                    </div>
                                                    <div className="user-cell-sub" style={{ fontSize: '10px' }}>
                                                        {user.id.substring(0, 8)}...
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            {user.email ? (
                                                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                                                    {user.email}
                                                </span>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                {user.roles.length > 0 ? (
                                                    user.roles.map((role) => (
                                                        <span
                                                            key={role}
                                                            className={`badge ${role === 'admin' ? 'badge-warning' : role === 'instructor' ? 'badge-success' : 'badge-default'}`}
                                                        >
                                                            {role}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="badge badge-default">user</span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                {isAdmin ? (
                                                    <button
                                                        className="btn btn-icon btn-ghost"
                                                        onClick={() => handleRemoveAdmin(user.id)}
                                                        title="Remover admin"
                                                        style={{ color: 'var(--danger)' }}
                                                    >
                                                        <UserX size={18} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="btn btn-icon btn-ghost"
                                                        onClick={() => handleMakeAdmin(user.id)}
                                                        title="Tornar admin"
                                                        style={{ color: 'var(--warning)' }}
                                                    >
                                                        <Shield size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    className="btn btn-icon btn-ghost"
                                                    title="Ver detalhes"
                                                    onClick={() => handleViewDetails(user)}
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* User Details Modal */}
            {isModalOpen && selectedUser && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Detalhes do Usuário</h2>
                            <button className="btn btn-icon btn-ghost" onClick={() => setIsModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            {/* Header */}
                            <div className="detail-header">
                                <div className="user-cell-avatar" style={{ width: '64px', height: '64px', fontSize: '20px' }}>
                                    {getInitials(selectedUser.full_name)}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>{selectedUser.full_name || 'Sem nome'}</h3>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        {selectedUser.roles.length > 0 ? (
                                            selectedUser.roles.map(role => (
                                                <span key={role} className={`badge ${role === 'admin' ? 'badge-warning' : role === 'instructor' ? 'badge-success' : 'badge-default'}`}>
                                                    {role}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="badge badge-default">user</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="detail-grid" style={{ marginTop: '20px' }}>
                                <div className="detail-item">
                                    <div className="detail-label"><Mail size={14} /> Email</div>
                                    <div className="detail-value">{selectedUser.email || 'Não disponível'}</div>
                                </div>
                                <div className="detail-item">
                                    <div className="detail-label"><Calendar size={14} /> Cadastro</div>
                                    <div className="detail-value">
                                        {format(new Date(selectedUser.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                    </div>
                                </div>
                                {selectedUser.instructor && (
                                    <>
                                        <div className="detail-item">
                                            <div className="detail-label"><Phone size={14} /> Telefone</div>
                                            <div className="detail-value">{selectedUser.instructor.phone || '—'}</div>
                                        </div>
                                        <div className="detail-item">
                                            <div className="detail-label"><MapPin size={14} /> Local</div>
                                            <div className="detail-value">
                                                {selectedUser.instructor.city}, {selectedUser.instructor.state}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Instructor Stats */}
                            {selectedUser.instructor && (
                                <div style={{ marginTop: '24px' }}>
                                    <h4 style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Dados do Instrutor
                                    </h4>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <div style={{ flex: 1, padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Status</div>
                                            <span className={`badge ${selectedUser.instructor.status === 'approved' ? 'badge-success' : selectedUser.instructor.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
                                                {selectedUser.instructor.status}
                                            </span>
                                        </div>
                                        <div style={{ flex: 1, padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Preço/Aula</div>
                                            <div style={{ fontSize: '16px', fontWeight: 600 }}>
                                                R$ {selectedUser.instructor.price_per_lesson?.toFixed(2) || '0.00'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            {selectedUser.roles.includes('admin') ? (
                                <button className="btn btn-danger" onClick={() => handleRemoveAdmin(selectedUser.id)}>
                                    <UserX size={16} /> Remover Admin
                                </button>
                            ) : (
                                <button className="btn btn-primary" onClick={() => handleMakeAdmin(selectedUser.id)}>
                                    <Shield size={16} /> Tornar Admin
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
