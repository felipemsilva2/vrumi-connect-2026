import { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    Image,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';

interface Message {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    room_id: string;
    is_read?: boolean;
}

interface ChatRoom {
    id: string;
    student_id: string;
    instructor_id: string;
    student_name: string;
    student_avatar: string | null;
    instructor_name: string;
    instructor_avatar: string | null;
    is_student_view: boolean;
}

export default function ChatScreen() {
    const { id } = useLocalSearchParams();
    const roomId = Array.isArray(id) ? id[0] : (id as string);
    const { user } = useAuth();
    const { theme, isDark } = useTheme();
    const [messages, setMessages] = useState<Message[]>([]);
    const [room, setRoom] = useState<ChatRoom | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        fetchRoomDetails();
        fetchMessages();
        subscribeToMessages();

        return () => {
            supabase.channel(`room-${roomId}`).unsubscribe();
        };
    }, [roomId]);

    const fetchRoomDetails = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('connect_chat_rooms')
                .select(`
                    id,
                    student_id,
                    instructor_id,
                    student:profiles(full_name, avatar_url),
                    instructor:instructors(full_name, photo_url)
                `)
                .eq('id', roomId)
                .single();

            if (error) throw error;

            if (data) {
                const isStudent = data.student_id === user.id;
                setRoom({
                    id: data.id,
                    student_id: data.student_id,
                    instructor_id: data.instructor_id,
                    is_student_view: isStudent,
                    student_name: (data.student as any)?.full_name || 'Aluno',
                    student_avatar: (data.student as any)?.avatar_url,
                    instructor_name: (data.instructor as any)?.full_name || 'Instrutor',
                    instructor_avatar: (data.instructor as any)?.photo_url
                });

                // Reset unread count for current user
                await supabase
                    .from('connect_chat_rooms')
                    .update(isStudent ? { unread_count_student: 0 } : { unread_count_instructor: 0 })
                    .eq('id', roomId);
            }
        } catch (error) {
            console.error('Error fetching room:', error);
            Alert.alert('Erro', 'Não foi possível carregar os detalhes da conversa.');
        }
    };

    const fetchMessages = async () => {
        try {
            const { data, error } = await supabase
                .from('connect_chat_messages')
                .select('*')
                .eq('room_id', roomId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMessages((data as any) || []);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const subscribeToMessages = () => {
        const channel = supabase
            .channel(`room-${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'connect_chat_messages',
                    filter: `room_id=eq.${roomId}`,
                },
                (payload) => {
                    const newMsg = payload.new as Message;
                    setMessages((current) => [...current, newMsg]);
                }
            )
            .subscribe();
    };

    // Violation types and detection patterns
    type ViolationType = 'contact_attempt' | 'harassment' | 'threat' | 'offensive' | null;
    type ViolationSeverity = 'low' | 'medium' | 'high';

    interface ViolationResult {
        isViolation: boolean;
        type: ViolationType;
        severity: ViolationSeverity;
        matchedKeywords: string[];
    }

    const validateMessage = (text: string): ViolationResult => {
        const lowerText = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const matchedKeywords: string[] = [];

        // 1. Phone number detection
        const phoneRegex = /(\(?\d{2}\)?\s?\d{4,5}-?\d{4})/g;
        if (phoneRegex.test(text)) {
            return { isViolation: true, type: 'contact_attempt', severity: 'medium', matchedKeywords: ['telefone'] };
        }

        // 2. Contact attempt keywords
        const contactKeywords = [
            'whatsapp', 'insta', 'instagram', 'zap', 'contato', 'fone', 'celular',
            'me passa seu', 'meu numero', 'meu telefone', 'liga pra mim', 'me liga',
            'telegram', 'facebook', 'meu face', '@gmail', '@hotmail', 'meu email'
        ];
        for (const word of contactKeywords) {
            if (lowerText.includes(word)) {
                matchedKeywords.push(word);
            }
        }
        if (matchedKeywords.length > 0) {
            return { isViolation: true, type: 'contact_attempt', severity: 'medium', matchedKeywords };
        }

        // 3. Harassment detection
        const harassmentKeywords = [
            'gostosa', 'gostoso', 'delicia', 'gatinha', 'gatinho', 'gracinha',
            'vem ca', 'vamos sair', 'me manda foto', 'manda nudes', 'so nos dois',
            'te pegar', 'te quero', 'fica comigo', 'gata demais', 'tesao',
            'sua linda', 'seu lindo', 'que corpo', 'corpao', 'bundao', 'bundinha',
            'peitao', 'gostosao', 'gostosona', 'sarada', 'sarado', 'bonitao',
            'ta solteira', 'ta solteiro', 'tem namorado', 'tem namorada',
            'namora comigo', 'quer sair', 'sair comigo', 'encontro', 'a sos',
            'em particular', 'no sigilo', 'sem ninguem saber', 'entre nos'
        ];
        for (const word of harassmentKeywords) {
            if (lowerText.includes(word)) {
                matchedKeywords.push(word);
            }
        }
        if (matchedKeywords.length > 0) {
            const severity: ViolationSeverity = matchedKeywords.some(k =>
                ['manda nudes', 'te pegar', 'tesao', 'bundao', 'peitao'].includes(k)
            ) ? 'high' : 'medium';
            return { isViolation: true, type: 'harassment', severity, matchedKeywords };
        }

        // 4. Threat detection
        const threatKeywords = [
            'vou te encontrar', 'sei onde voce mora', 'vou te pegar', 'cuidado',
            'voce vai ver', 'vai se arrepender', 'te mato', 'vou acabar com voce',
            'minha vinganca', 'uma hora te pego', 'nao vai escapar', 'vou denunciar'
        ];
        for (const word of threatKeywords) {
            if (lowerText.includes(word)) {
                matchedKeywords.push(word);
            }
        }
        if (matchedKeywords.length > 0) {
            return { isViolation: true, type: 'threat', severity: 'high', matchedKeywords };
        }

        // 5. Offensive language detection
        const offensiveKeywords = [
            'idiota', 'imbecil', 'estupido', 'burro', 'otario', 'babaca', 'fdp',
            'puta', 'vagabunda', 'vagabundo', 'merda', 'bosta', 'cuzao', 'arrombado',
            'desgraca', 'maldito', 'inferno', 'vtnc', 'vsf', 'pqp', 'caralho',
            'filho da puta', 'va se foder', 'vai tomar', 'lixo', 'nojento', 'nojenta'
        ];
        for (const word of offensiveKeywords) {
            if (lowerText.includes(word)) {
                matchedKeywords.push(word);
            }
        }
        if (matchedKeywords.length > 0) {
            const severity: ViolationSeverity = matchedKeywords.length > 2 ? 'high' : 'medium';
            return { isViolation: true, type: 'offensive', severity, matchedKeywords };
        }

        return { isViolation: false, type: null, severity: 'low', matchedKeywords: [] };
    };

    const logViolation = async (
        content: string,
        violationType: ViolationType,
        severity: ViolationSeverity,
        keywords: string[]
    ) => {
        if (!user || !roomId || !violationType) return;

        try {
            await supabase.from('connect_chat_violations').insert({
                room_id: roomId,
                sender_id: user.id,
                message_content: content,
                violation_type: violationType,
                severity: severity,
                keywords_matched: keywords
            });
        } catch (error) {
            console.error('Error logging violation:', error);
        }
    };

    const getViolationAlert = (type: ViolationType): { title: string; message: string } => {
        switch (type) {
            case 'contact_attempt':
                return {
                    title: 'Aviso de Segurança 🛡️',
                    message: 'Para sua segurança e conformidade com os termos de uso, não é permitido compartilhar dados de contato direto (WhatsApp, telefone, etc). Todas as comunicações devem ser feitas pelo nosso chat oficial.'
                };
            case 'harassment':
                return {
                    title: 'Comportamento Inadequado ⚠️',
                    message: 'Esta mensagem foi bloqueada pois viola nossos termos de uso. Mantenha uma comunicação respeitosa e profissional. Reincidências podem resultar em suspensão da conta.'
                };
            case 'threat':
                return {
                    title: 'Mensagem Bloqueada 🚫',
                    message: 'Ameaças ou intimidações não são toleradas em nossa plataforma. Esta ocorrência foi registrada e pode resultar em banimento permanente.'
                };
            case 'offensive':
                return {
                    title: 'Linguagem Inapropriada ⚠️',
                    message: 'Linguagem ofensiva não é permitida. Por favor, mantenha o respeito na comunicação. Violações repetidas resultarão em suspensão.'
                };
            default:
                return {
                    title: 'Mensagem Bloqueada',
                    message: 'Esta mensagem viola nossos termos de uso.'
                };
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !user || !roomId || sending) return;

        const validation = validateMessage(newMessage);

        if (validation.isViolation) {
            const alert = getViolationAlert(validation.type);
            Alert.alert(alert.title, alert.message);

            // Log the violation to database
            await logViolation(
                newMessage.trim(),
                validation.type,
                validation.severity,
                validation.matchedKeywords
            );

            return;
        }

        setSending(true);
        try {
            const { error } = await supabase
                .from('connect_chat_messages')
                .insert({
                    room_id: roomId as string,
                    sender_id: user.id,
                    content: newMessage.trim(),
                } as any);

            if (error) throw error;
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            Alert.alert('Erro', 'Não foi possível enviar sua mensagem.');
        } finally {
            setSending(false);
        }
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isMyMessage = item.sender_id === user?.id;

        return (
            <View style={[
                styles.messageContainer,
                isMyMessage ? styles.myMessage : styles.theirMessage,
                { backgroundColor: isMyMessage ? theme.primary : (isDark ? theme.card : '#f3f4f6') }
            ]}>
                <Text style={[
                    styles.messageText,
                    { color: isMyMessage ? '#fff' : theme.text }
                ]}>
                    {item.content}
                </Text>
                <Text style={[
                    styles.messageTime,
                    { color: isMyMessage ? 'rgba(255,255,255,0.7)' : theme.textSecondary }
                ]}>
                    {new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>

                {room?.is_student_view ? (
                    room.instructor_avatar ? (
                        <Image source={{ uri: room.instructor_avatar }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
                            <Text style={styles.avatarInitial}>{room.instructor_name.charAt(0)}</Text>
                        </View>
                    )
                ) : (
                    room?.student_avatar ? (
                        <Image source={{ uri: room.student_avatar }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
                            <Text style={styles.avatarInitial}>{room?.student_name.charAt(0)}</Text>
                        </View>
                    )
                )}

                <View style={styles.headerInfo}>
                    <Text style={[styles.instructorName, { color: theme.text }]}>
                        {room?.is_student_view ? room.instructor_name : room?.student_name}
                    </Text>
                    <Text style={[styles.statusTextHeader, { color: theme.success }]}>Online</Text>
                </View>
            </View>

            {/* Messages */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messageList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            {/* Input */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <View style={[styles.inputContainer, { backgroundColor: theme.card, borderTopColor: theme.cardBorder }]}>
                    <TextInput
                        style={[styles.input, { color: theme.text, backgroundColor: isDark ? theme.background : '#f9fafb' }]}
                        placeholder="Digite sua mensagem..."
                        placeholderTextColor={theme.textSecondary}
                        value={newMessage}
                        onChangeText={setNewMessage}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, { backgroundColor: theme.primary, opacity: newMessage.trim() ? 1 : 0.6 }]}
                        onPress={handleSendMessage}
                        disabled={!newMessage.trim() || sending}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Ionicons name="send" size={20} color="#fff" />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    backButton: {
        marginRight: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    headerInfo: {
        marginLeft: 12,
        flex: 1,
    },
    instructorName: {
        fontSize: 16,
        fontWeight: '700',
    },
    statusTextHeader: {
        fontSize: 12,
        fontWeight: '500',
    },
    messageList: {
        padding: 16,
        gap: 12,
    },
    messageContainer: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
        marginBottom: 4,
    },
    myMessage: {
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4,
    },
    theirMessage: {
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    messageTime: {
        fontSize: 10,
        alignSelf: 'flex-end',
        marginTop: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        paddingBottom: Platform.OS === 'ios' ? 24 : 12,
        borderTopWidth: 1,
    },
    input: {
        flex: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        maxHeight: 100,
        fontSize: 15,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
