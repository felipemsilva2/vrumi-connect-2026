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
}

interface ChatRoom {
    id: string;
    student_id: string;
    instructor_id: string;
    instructor: {
        full_name: string;
        photo_url: string | null;
    };
}

export default function ChatScreen() {
    const { id: roomId } = useLocalSearchParams();
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
        try {
            const { data, error } = await supabase
                .from('connect_chat_rooms')
                .select(`
                    id,
                    student_id,
                    instructor_id,
                    instructor:instructors(full_name, photo_url)
                `)
                .eq('id', roomId)
                .single();

            if (error) throw error;
            setRoom(data as any);
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
            setMessages(data || []);
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

    const validateMessage = (text: string) => {
        // Regex to detect:
        // 1. Phone numbers (e.g., (11) 99999-9999, 11999999999, etc.)
        const phoneRegex = /(\(?\d{2}\)?\s?\d{4,5}-?\d{4})/g;
        // 2. Keywords related to external contact
        const keywords = ['whatsapp', 'insta', 'instagram', 'zap', 'contato', 'fone', 'celular', 'me passa seu'];

        if (phoneRegex.test(text)) return false;

        const lowerText = text.toLowerCase();
        for (const word of keywords) {
            if (lowerText.includes(word)) return false;
        }

        return true;
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !user || !roomId || sending) return;

        if (!validateMessage(newMessage)) {
            Alert.alert(
                'Aviso de Segurança 🛡️',
                'Para sua segurança e conformidade com os termos de uso, não é permitido compartilhar dados de contato direto (WhatsApp, telefone, etc). Todas as comunicações devem ser feitas pelo nosso chat oficial.'
            );
            return;
        }

        setSending(true);
        try {
            const { error } = await supabase
                .from('connect_chat_messages')
                .insert({
                    room_id: roomId,
                    sender_id: user.id,
                    content: newMessage.trim(),
                });

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

                {room?.instructor?.photo_url ? (
                    <Image source={{ uri: room.instructor.photo_url }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
                        <Text style={styles.avatarInitial}>{room?.instructor?.full_name?.charAt(0)}</Text>
                    </View>
                )}

                <View style={styles.headerInfo}>
                    <Text style={[styles.instructorName, { color: theme.text }]}>{room?.instructor?.full_name}</Text>
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
