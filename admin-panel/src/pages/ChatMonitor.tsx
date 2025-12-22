import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, RefreshCw, MessageCircle, X, User, GraduationCap, AlertTriangle, Shield, Ban } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatRoom {
    id: string;
    student_id: string;
    instructor_id: string;
    last_message: string;
    last_message_at: string;
    created_at: string;
    student?: { full_name: string };
    instructor?: { full_name: string };
}

interface ChatMessage {
    id: string;
    room_id: string;
    sender_id: string;
    content: string;
    is_read: boolean;
    created_at: string;
}

interface ChatViolation {
    id: string;
    room_id: string;
    sender_id: string;
    message_content: string;
    violation_type: 'contact_attempt' | 'harassment' | 'threat' | 'offensive';
    severity: 'low' | 'medium' | 'high';
    keywords_matched: string[];
    reviewed: boolean;
    created_at: string;
    sender?: { full_name: string };
    room?: { student_id: string; instructor_id: string };
}

export function ChatMonitor() {
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [violations, setViolations] = useState<ChatViolation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [activeTab, setActiveTab] = useState<'conversations' | 'violations'>('conversations');

    const fetchRooms = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('connect_chat_rooms')
                .select('*')
                .order('last_message_at', { ascending: false })
                .limit(100);

            if (error) throw error;

            // Fetch student and instructor names
            const studentIds = [...new Set(data?.map(r => r.student_id) || [])];
            const instructorIds = [...new Set(data?.map(r => r.instructor_id) || [])];

            const { data: students } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', studentIds);

            const { data: instructors } = await supabase
                .from('instructors')
                .select('id, full_name')
                .in('id', instructorIds);

            const studentMap = new Map(students?.map(s => [s.id, s]) || []);
            const instructorMap = new Map(instructors?.map(i => [i.id, i]) || []);

            const roomsWithNames = data?.map(r => ({
                ...r,
                student: studentMap.get(r.student_id),
                instructor: instructorMap.get(r.instructor_id)
            })) || [];

            setRooms(roomsWithNames);
        } catch (error) {
            console.error('Error fetching chat rooms:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchViolations = async () => {
        try {
            const { data, error } = await supabase
                .from('connect_chat_violations')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(200);

            if (error) throw error;

            // Fetch sender names
            const senderIds = [...new Set(data?.map(v => v.sender_id) || [])];

            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', senderIds);

            const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

            const violationsWithNames = data?.map(v => ({
                ...v,
                sender: profileMap.get(v.sender_id)
            })) || [];

            setViolations(violationsWithNames);
        } catch (error) {
            console.error('Error fetching violations:', error);
        }
    };

    const handleRefresh = () => {
        fetchRooms();
        fetchViolations();
    };

    useEffect(() => {
        fetchRooms();
        fetchViolations();
    }, []);

    const handleViewRoom = async (room: ChatRoom) => {
        setSelectedRoom(room);
        setIsModalOpen(true);
        setIsLoadingMessages(true);

        try {
            const { data, error } = await supabase
                .from('connect_chat_messages')
                .select('*')
                .eq('room_id', room.id)
                .order('created_at', { ascending: true })
                .limit(100);

            if (error) throw error;
            setMessages(data || []);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setIsLoadingMessages(false);
        }
    };

    const getInitials = (name: string | undefined) => {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    };

    const getViolationTypeLabel = (type: string) => {
        const labels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
            contact_attempt: { label: 'Contato Externo', icon: <Shield size={14} />, color: '#f59e0b' },
            harassment: { label: 'Assédio', icon: <AlertTriangle size={14} />, color: '#ef4444' },
            threat: { label: 'Ameaça', icon: <Ban size={14} />, color: '#dc2626' },
            offensive: { label: 'Ofensivo', icon: <AlertTriangle size={14} />, color: '#f97316' }
        };
        return labels[type] || { label: type, icon: null, color: '#6b7280' };
    };

    const getSeverityBadge = (severity: string) => {
        const styles: Record<string, { bg: string; text: string; label: string }> = {
            low: { bg: '#dcfce7', text: '#166534', label: 'Baixa' },
            medium: { bg: '#fef3c7', text: '#92400e', label: 'Média' },
            high: { bg: '#fee2e2', text: '#991b1b', label: 'Alta' }
        };
        return styles[severity] || styles.medium;
    };

    const filteredViolations = violations.filter(v =>
        v.sender?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.message_content?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filtered = rooms.filter(r =>
        r.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.instructor?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.last_message?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="page-header">
                <div className="page-header-content">
                    <h1>Chat Monitor</h1>
                    <p>Visualizar conversas e violações de política</p>
                </div>
                <button className="btn btn-secondary" onClick={handleRefresh}>
                    <RefreshCw size={16} />
                    Atualizar
                </button>
            </div>

            {/* Quick Stats */}
            <div className="quick-stats" style={{ marginBottom: '24px' }}>
                <div className="quick-stat">
                    <div className="value">{rooms.length}</div>
                    <div className="label">Conversas</div>
                </div>
                <div className="quick-stat">
                    <div className="value">
                        {rooms.filter(r => {
                            const date = new Date(r.last_message_at);
                            const now = new Date();
                            return (now.getTime() - date.getTime()) < 24 * 60 * 60 * 1000;
                        }).length}
                    </div>
                    <div className="label">Ativas (24h)</div>
                </div>
                <div className="quick-stat" style={{ borderLeft: '3px solid #ef4444' }}>
                    <div className="value" style={{ color: '#ef4444' }}>{violations.length}</div>
                    <div className="label">Violações</div>
                </div>
                <div className="quick-stat">
                    <div className="value" style={{ color: '#f59e0b' }}>
                        {violations.filter(v => v.violation_type === 'harassment').length}
                    </div>
                    <div className="label">Assédio</div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <button
                    className={`btn ${activeTab === 'conversations' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('conversations')}
                >
                    <MessageCircle size={16} />
                    Conversas ({rooms.length})
                </button>
                <button
                    className={`btn ${activeTab === 'violations' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('violations')}
                    style={violations.length > 0 ? { position: 'relative' } : {}}
                >
                    <AlertTriangle size={16} />
                    Violações ({violations.length})
                    {violations.filter(v => !v.reviewed).length > 0 && (
                        <span style={{
                            position: 'absolute',
                            top: '-4px',
                            right: '-4px',
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            background: '#ef4444',
                            color: 'white',
                            fontSize: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '600'
                        }}>
                            {violations.filter(v => !v.reviewed).length}
                        </span>
                    )}
                </button>
            </div>

            <div className="filters">
                <div className="input-group">
                    <Search size={16} className="input-icon" />
                    <input
                        type="text"
                        className="input"
                        placeholder={activeTab === 'conversations' ? "Buscar por nome ou mensagem..." : "Buscar violações..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="card">
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '48px' }}>
                        <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
                        <p style={{ color: 'var(--text-muted)' }}>Carregando...</p>
                    </div>
                ) : activeTab === 'conversations' ? (
                    // Conversations Tab
                    filtered.length === 0 ? (
                        <div className="empty-state">
                            <MessageCircle size={48} />
                            <h3>Nenhuma conversa encontrada</h3>
                            <p>As conversas entre alunos e instrutores aparecerão aqui</p>
                        </div>
                    ) : (
                        <div className="chat-room-list">
                            {filtered.map((room) => (
                                <div
                                    key={room.id}
                                    className="chat-room-item"
                                    onClick={() => handleViewRoom(room)}
                                >
                                    <div className="chat-room-avatar">
                                        {getInitials(room.student?.full_name)}
                                    </div>
                                    <div className="chat-room-content">
                                        <div className="chat-room-header">
                                            <div className="chat-room-name">
                                                <User size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                                {room.student?.full_name || 'Aluno'}
                                                <span style={{ color: 'var(--text-muted)', margin: '0 6px' }}>↔</span>
                                                <GraduationCap size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                                {room.instructor?.full_name || 'Instrutor'}
                                            </div>
                                            <span className="chat-room-time">
                                                {room.last_message_at && formatDistanceToNow(new Date(room.last_message_at), { addSuffix: true, locale: ptBR })}
                                            </span>
                                        </div>
                                        <div className="chat-room-preview">
                                            {room.last_message || 'Sem mensagens'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    // Violations Tab
                    filteredViolations.length === 0 ? (
                        <div className="empty-state">
                            <Shield size={48} />
                            <h3>Nenhuma violação registrada</h3>
                            <p>As violações de política serão listadas aqui</p>
                        </div>
                    ) : (
                        <div className="chat-room-list">
                            {filteredViolations.map((violation) => {
                                const typeInfo = getViolationTypeLabel(violation.violation_type);
                                const severityInfo = getSeverityBadge(violation.severity);
                                return (
                                    <div key={violation.id} className="chat-room-item" style={{ cursor: 'default' }}>
                                        <div
                                            className="chat-room-avatar"
                                            style={{ background: typeInfo.color, color: 'white' }}
                                        >
                                            {typeInfo.icon}
                                        </div>
                                        <div className="chat-room-content">
                                            <div className="chat-room-header">
                                                <div className="chat-room-name" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span>{violation.sender?.full_name || 'Usuário'}</span>
                                                    <span style={{
                                                        fontSize: '10px',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        background: typeInfo.color,
                                                        color: 'white'
                                                    }}>
                                                        {typeInfo.label}
                                                    </span>
                                                    <span style={{
                                                        fontSize: '10px',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        background: severityInfo.bg,
                                                        color: severityInfo.text
                                                    }}>
                                                        {severityInfo.label}
                                                    </span>
                                                </div>
                                                <span className="chat-room-time">
                                                    {formatDistanceToNow(new Date(violation.created_at), { addSuffix: true, locale: ptBR })}
                                                </span>
                                            </div>
                                            <div className="chat-room-preview" style={{ color: '#ef4444' }}>
                                                "{violation.message_content}"
                                            </div>
                                            {violation.keywords_matched?.length > 0 && (
                                                <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                                                    Palavras: {violation.keywords_matched.join(', ')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                )}
            </div>

            {/* Chat Messages Modal */}
            {isModalOpen && selectedRoom && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal" style={{ maxWidth: '640px', maxHeight: '80vh' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2 style={{ marginBottom: '4px' }}>Conversa</h2>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    <User size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                    {selectedRoom.student?.full_name || 'Aluno'}
                                    <span style={{ margin: '0 8px' }}>↔</span>
                                    <GraduationCap size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                    {selectedRoom.instructor?.full_name || 'Instrutor'}
                                </div>
                            </div>
                            <button className="btn btn-icon btn-ghost" onClick={() => setIsModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body" style={{ padding: 0 }}>
                            {isLoadingMessages ? (
                                <div style={{ textAlign: 'center', padding: '48px' }}>
                                    <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
                                    <p style={{ color: 'var(--text-muted)' }}>Carregando mensagens...</p>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="empty-state" style={{ padding: '48px' }}>
                                    <MessageCircle size={48} />
                                    <h3>Sem mensagens</h3>
                                </div>
                            ) : (
                                <div className="chat-messages">
                                    {messages.map((msg) => {
                                        const isStudent = msg.sender_id === selectedRoom.student_id;
                                        return (
                                            <div key={msg.id} className={`chat-message ${isStudent ? 'student' : 'instructor'}`}>
                                                <div className="chat-message-header">
                                                    {isStudent ? (
                                                        <><User size={10} /> Aluno</>
                                                    ) : (
                                                        <><GraduationCap size={10} /> Instrutor</>
                                                    )}
                                                </div>
                                                <div>{msg.content}</div>
                                                <div className="chat-message-time">
                                                    {format(new Date(msg.created_at), 'HH:mm', { locale: ptBR })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="modal-footer" style={{ justifyContent: 'center' }}>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                Visualização apenas - admins não podem enviar mensagens
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
