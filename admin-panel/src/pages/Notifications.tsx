import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Bell, Send, Users, GraduationCap, User, RefreshCw } from 'lucide-react';

type Audience = 'all' | 'students' | 'instructors';

export function Notifications() {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [audience, setAudience] = useState<Audience>('all');
    const [isSending, setIsSending] = useState(false);
    const [sentHistory, setSentHistory] = useState<Array<{
        id: string;
        title: string;
        audience: Audience;
        sentAt: Date;
    }>>([]);

    const handleSendNotification = async () => {
        if (!title.trim() || !message.trim()) {
            alert('Preencha título e mensagem');
            return;
        }

        if (!confirm(`Enviar notificação para ${audience === 'all' ? 'TODOS os usuários' : audience === 'students' ? 'alunos' : 'instrutores'}?`)) {
            return;
        }

        setIsSending(true);
        try {
            // Get user tokens based on audience
            let query = supabase
                .from('push_tokens')
                .select('token, user_id');

            if (audience === 'instructors') {
                // Get instructor user_ids first
                const { data: instructors } = await supabase
                    .from('instructors')
                    .select('user_id');

                const instructorIds = instructors?.map(i => i.user_id) || [];
                query = query.in('user_id', instructorIds);
            } else if (audience === 'students') {
                // Get all users that are NOT instructors
                const { data: instructors } = await supabase
                    .from('instructors')
                    .select('user_id');

                const instructorIds = instructors?.map(i => i.user_id) || [];
                if (instructorIds.length > 0) {
                    query = query.not('user_id', 'in', `(${instructorIds.join(',')})`);
                }
            }

            const { data: tokens } = await query;

            if (!tokens || tokens.length === 0) {
                alert('Nenhum dispositivo encontrado para este público');
                setIsSending(false);
                return;
            }

            // Call edge function to send notifications
            const { data, error } = await supabase.functions.invoke('send-push-notification', {
                body: {
                    tokens: tokens.map(t => t.token),
                    title,
                    body: message,
                    data: { type: 'admin_broadcast' }
                }
            });

            if (error) throw error;

            // Add to history
            setSentHistory(prev => [{
                id: Date.now().toString(),
                title,
                audience,
                sentAt: new Date()
            }, ...prev]);

            setTitle('');
            setMessage('');
            alert(`Notificação enviada para ${tokens.length} dispositivos!`);
        } catch (error) {
            console.error('Error sending notification:', error);
            alert('Erro ao enviar notificação');
        } finally {
            setIsSending(false);
        }
    };

    const audienceConfig = {
        all: { label: 'Todos', icon: Users, color: 'var(--accent)' },
        students: { label: 'Alunos', icon: User, color: 'var(--info)' },
        instructors: { label: 'Instrutores', icon: GraduationCap, color: 'var(--success)' },
    };

    return (
        <div>
            <div className="page-header">
                <div className="page-header-content">
                    <h1>Push Notifications</h1>
                    <p>Enviar notificações para usuários</p>
                </div>
            </div>

            {/* Send Notification Card */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Bell size={18} />
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Nova Notificação</h3>
                    </div>
                </div>

                <div style={{ padding: '20px' }}>
                    {/* Audience Selection */}
                    <div className="form-group">
                        <label style={{ marginBottom: '8px', display: 'block' }}>Público Alvo</label>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {(Object.keys(audienceConfig) as Audience[]).map((key) => {
                                const config = audienceConfig[key];
                                const Icon = config.icon;
                                const isSelected = audience === key;

                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setAudience(key)}
                                        style={{
                                            flex: 1,
                                            padding: '16px',
                                            border: `2px solid ${isSelected ? config.color : 'var(--border)'}`,
                                            borderRadius: 'var(--radius-md)',
                                            background: isSelected ? `${config.color}10` : 'transparent',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '8px',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <Icon size={24} style={{ color: isSelected ? config.color : 'var(--text-muted)' }} />
                                        <span style={{
                                            fontSize: '13px',
                                            fontWeight: isSelected ? 600 : 400,
                                            color: isSelected ? config.color : 'var(--text-secondary)'
                                        }}>
                                            {config.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Title */}
                    <div className="form-group">
                        <label>Título *</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="Ex: Novidade no Vrumi!"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={50}
                        />
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                            {title.length}/50 caracteres
                        </span>
                    </div>

                    {/* Message */}
                    <div className="form-group">
                        <label>Mensagem *</label>
                        <textarea
                            className="input"
                            style={{ minHeight: '100px', resize: 'vertical' }}
                            placeholder="Digite a mensagem da notificação..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            maxLength={200}
                        />
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                            {message.length}/200 caracteres
                        </span>
                    </div>

                    {/* Send Button */}
                    <button
                        className="btn btn-primary"
                        onClick={handleSendNotification}
                        disabled={isSending || !title.trim() || !message.trim()}
                        style={{ width: '100%', marginTop: '8px' }}
                    >
                        {isSending ? (
                            <>
                                <RefreshCw size={16} className="spinning" />
                                Enviando...
                            </>
                        ) : (
                            <>
                                <Send size={16} />
                                Enviar Notificação
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Recent Notifications */}
            {sentHistory.length > 0 && (
                <div className="card">
                    <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Enviadas Recentemente</h3>
                    </div>
                    <div style={{ padding: '0' }}>
                        {sentHistory.map((item) => {
                            const config = audienceConfig[item.audience];
                            const Icon = config.icon;

                            return (
                                <div key={item.id} style={{
                                    padding: '12px 20px',
                                    borderBottom: '1px solid var(--border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}>
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        background: `${config.color}20`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <Icon size={16} style={{ color: config.color }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '13px', fontWeight: 500 }}>{item.title}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                            Enviada para {config.label.toLowerCase()}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                        {item.sentAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
