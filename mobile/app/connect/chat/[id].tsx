import { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Image,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../src/lib/supabase';

interface Message {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    read_at: string | null;
}

interface OtherUser {
    id: string;
    name: string;
    photo: string | null;
}

export default function ChatScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { theme } = useTheme();
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
    const flatListRef = useRef<FlatList>(null);

    const fetchMessages = useCallback(async () => {
        if (!id) return;

        try {
            // Get conversation participants
            const { data: conv } = await (supabase as any)
                .from('conversations')
                .select('participant_1, participant_2')
                .eq('id', id)
                .single();

            if (conv) {
                const otherUserId = conv.participant_1 === user?.id
                    ? conv.participant_2
                    : conv.participant_1;

                // Get other user's info
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, avatar_url')
                    .eq('id', otherUserId)
                    .single();

                let name = profile?.full_name;
                let photo = profile?.avatar_url;

                if (!name) {
                    const { data: instructor } = await supabase
                        .from('instructors')
                        .select('full_name, photo_url')
                        .eq('user_id', otherUserId)
                        .single();
                    name = instructor?.full_name;
                    photo = instructor?.photo_url || photo;
                }

                setOtherUser({
                    id: otherUserId,
                    name: name || 'Usuário',
                    photo: photo || null,
                });
            }

            // Fetch messages
            const { data, error } = await (supabase as any)
                .from('messages')
                .select('id, content, sender_id, created_at, read_at')
                .eq('conversation_id', id)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMessages((data as Message[]) || []);

            // Mark messages as read
            await (supabase as any)
                .from('messages')
                .update({ read_at: new Date().toISOString() })
                .eq('conversation_id', id)
                .neq('sender_id', user?.id)
                .is('read_at', null);

        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    }, [id, user?.id]);

    useEffect(() => {
        fetchMessages();

        // Subscribe to new messages
        const channel = supabase
            .channel(`chat:${id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${id}`,
                },
                (payload) => {
                    const newMsg = payload.new as Message;
                    setMessages((prev) => [...prev, newMsg]);

                    // Mark as read if from other user
                    if (newMsg.sender_id !== user?.id) {
                        (supabase as any)
                            .from('messages')
                            .update({ read_at: new Date().toISOString() })
                            .eq('id', newMsg.id);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id, fetchMessages, user?.id]);

    const sendMessage = async () => {
        if (!newMessage.trim() || !user?.id || !id || sending) return;

        setSending(true);
        try {
            const { error } = await (supabase as any)
                .from('messages')
                .insert({
                    conversation_id: id,
                    sender_id: user.id,
                    content: newMessage.trim(),
                });

            if (error) throw error;
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const renderMessage = ({ item, index }: { item: Message; index: number }) => {
        const isMe = item.sender_id === user?.id;
        const showTimestamp = index === 0 ||
            new Date(item.created_at).getTime() - new Date(messages[index - 1].created_at).getTime() > 300000;

        return (
            <View>
                {showTimestamp && (
                    <Text style={[styles.timestamp, { color: theme.textMuted }]}>
                        {formatTime(item.created_at)}
                    </Text>
                )}
                <View style={[
                    styles.messageBubble,
                    isMe ? styles.myMessage : styles.theirMessage,
                    { backgroundColor: isMe ? theme.primary : theme.card }
                ]}>
                    <Text style={[
                        styles.messageText,
                        { color: isMe ? '#fff' : theme.text }
                    ]}>
                        {item.content}
                    </Text>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: theme.card }]}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    {otherUser?.photo ? (
                        <Image source={{ uri: otherUser.photo }} style={styles.headerAvatar} />
                    ) : (
                        <View style={[styles.headerAvatarPlaceholder, { backgroundColor: theme.primary }]}>
                            <Text style={styles.headerAvatarInitial}>
                                {otherUser?.name.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                    <Text style={[styles.headerName, { color: theme.text }]} numberOfLines={1}>
                        {otherUser?.name}
                    </Text>
                </View>
                <View style={{ width: 44 }} />
            </View>

            <KeyboardAvoidingView
                style={styles.content}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.messagesList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                    ListEmptyComponent={
                        <View style={styles.emptyChat}>
                            <Ionicons name="chatbubble-outline" size={48} color={theme.textMuted} />
                            <Text style={[styles.emptyChatText, { color: theme.textMuted }]}>
                                Envie uma mensagem para começar
                            </Text>
                        </View>
                    }
                />

                {/* Input */}
                <View style={[styles.inputContainer, { backgroundColor: theme.card, borderTopColor: theme.cardBorder }]}>
                    <TextInput
                        style={[styles.textInput, { backgroundColor: theme.background, color: theme.text }]}
                        placeholder="Digite sua mensagem..."
                        placeholderTextColor={theme.textMuted}
                        value={newMessage}
                        onChangeText={setNewMessage}
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            { backgroundColor: newMessage.trim() ? theme.primary : theme.cardBorder }
                        ]}
                        onPress={sendMessage}
                        disabled={!newMessage.trim() || sending}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Ionicons name="send" size={18} color="#fff" />
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 12,
    },
    headerAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    headerAvatarPlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerAvatarInitial: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    headerName: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
        flex: 1,
    },
    content: {
        flex: 1,
    },
    messagesList: {
        padding: 16,
        flexGrow: 1,
    },
    timestamp: {
        textAlign: 'center',
        fontSize: 12,
        marginVertical: 8,
    },
    messageBubble: {
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
    emptyChat: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyChatText: {
        marginTop: 12,
        fontSize: 14,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 12,
        borderTopWidth: 1,
        gap: 10,
    },
    textInput: {
        flex: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        maxHeight: 100,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
