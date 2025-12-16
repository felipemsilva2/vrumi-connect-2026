import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';

interface Conversation {
    id: string;
    other_user_id: string;
    other_user_name: string;
    other_user_photo: string | null;
    last_message: string | null;
    last_message_at: string;
    unread_count: number;
}

export default function ConversationsScreen() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchConversations = useCallback(async () => {
        if (!user?.id) return;

        try {
            // Fetch conversations where user is a participant
            const { data, error } = await (supabase as any)
                .from('conversations')
                .select(`
                    id,
                    participant_1,
                    participant_2,
                    last_message_at
                `)
                .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
                .order('last_message_at', { ascending: false });

            if (error) throw error;

            // Get other user details and last message for each conversation
            const conversationsWithDetails = await Promise.all(
                (data || []).map(async (conv: any) => {
                    const otherUserId = conv.participant_1 === user.id
                        ? conv.participant_2
                        : conv.participant_1;

                    // Get other user's profile
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('full_name, avatar_url')
                        .eq('id', otherUserId)
                        .single();

                    // Try to get instructor info if no profile name
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

                    // Get last message
                    const { data: lastMsg } = await (supabase as any)
                        .from('messages')
                        .select('content')
                        .eq('conversation_id', conv.id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single();

                    // Count unread messages
                    const { count } = await (supabase as any)
                        .from('messages')
                        .select('*', { count: 'exact', head: true })
                        .eq('conversation_id', conv.id)
                        .neq('sender_id', user.id)
                        .is('read_at', null);

                    return {
                        id: conv.id,
                        other_user_id: otherUserId,
                        other_user_name: name || 'Usuário',
                        other_user_photo: photo,
                        last_message: lastMsg?.content || null,
                        last_message_at: conv.last_message_at,
                        unread_count: count || 0,
                    };
                })
            );

            setConversations(conversationsWithDetails);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchConversations();
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Ontem';
        } else if (diffDays < 7) {
            return date.toLocaleDateString('pt-BR', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        }
    };

    const renderConversation = ({ item }: { item: Conversation }) => (
        <TouchableOpacity
            style={[styles.conversationItem, { backgroundColor: theme.card }]}
            onPress={() => router.push(`/connect/chat/${item.id}`)}
        >
            {item.other_user_photo ? (
                <Image source={{ uri: item.other_user_photo }} style={styles.avatar} />
            ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
                    <Text style={styles.avatarInitial}>
                        {item.other_user_name.charAt(0).toUpperCase()}
                    </Text>
                </View>
            )}
            <View style={styles.conversationDetails}>
                <View style={styles.conversationHeader}>
                    <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>
                        {item.other_user_name}
                    </Text>
                    <Text style={[styles.timestamp, { color: theme.textMuted }]}>
                        {formatTime(item.last_message_at)}
                    </Text>
                </View>
                <View style={styles.messageRow}>
                    <Text
                        style={[
                            styles.lastMessage,
                            { color: item.unread_count > 0 ? theme.text : theme.textMuted }
                        ]}
                        numberOfLines={1}
                    >
                        {item.last_message || 'Inicie uma conversa'}
                    </Text>
                    {item.unread_count > 0 && (
                        <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
                            <Text style={styles.unreadCount}>{item.unread_count}</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

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
            <View style={styles.header}>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: theme.card }]}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Mensagens</Text>
                <View style={{ width: 44 }} />
            </View>

            {conversations.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="chatbubbles-outline" size={64} color={theme.textMuted} />
                    <Text style={[styles.emptyTitle, { color: theme.text }]}>
                        Nenhuma conversa
                    </Text>
                    <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
                        Inicie uma conversa com um instrutor
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    keyExtractor={(item) => item.id}
                    renderItem={renderConversation}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={theme.primary}
                        />
                    }
                />
            )}
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
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    listContent: {
        paddingHorizontal: 16,
    },
    conversationItem: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
    conversationDetails: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    conversationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    timestamp: {
        fontSize: 12,
        marginLeft: 8,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    lastMessage: {
        fontSize: 14,
        flex: 1,
    },
    unreadBadge: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
        marginLeft: 8,
    },
    unreadCount: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
    },
});
