import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, RefreshCw, MessageCircle, X, User, GraduationCap } from 'lucide-react';
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

export function ChatMonitor() {
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

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

    useEffect(() => {
        fetchRooms();
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
                    <p>Visualizar conversas entre alunos e instrutores</p>
                </div>
                <button className="btn btn-secondary" onClick={fetchRooms}>
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
            </div>

            <div className="filters">
                <div className="input-group">
                    <Search size={16} className="input-icon" />
                    <input
                        type="text"
                        className="input"
                        placeholder="Buscar por nome ou mensagem..."
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
                ) : filtered.length === 0 ? (
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
