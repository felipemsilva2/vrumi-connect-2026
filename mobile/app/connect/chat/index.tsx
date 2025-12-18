import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../../src/lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';

interface ChatRoom {
    id: string;
    student_id: string;
    instructor_id: string;
    last_message: string | null;
    last_message_at: string | null;
    unread_count_student: number;
    unread_count_instructor: number;
    other_party_name: string;
    other_party_avatar: string | null;
    unread_count: number;
}

export default function ChatInbox() {
    const { user } = useAuth();
    const { theme, isDark } = useTheme();
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchRooms = useCallback(async () => {
        if (!user) return;

        try {
            // Check if user is an instructor
            const { data: instructor } = await supabase
                .from('instructors')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle();

            const instructorId = instructor?.id;

            // Query rooms
            let query = supabase
                .from('connect_chat_rooms')
                .select(`
                    *,
                    student:profiles(full_name, avatar_url),
                    instructor:instructors(full_name, photo_url)
                `)
                .order('last_message_at', { ascending: false });

            if (instructorId) {
                query = query.or(`student_id.eq.${user.id},instructor_id.eq.${instructorId}`);
            } else {
                query = query.eq('student_id', user.id);
            }

            const { data, error } = await query;

            if (error) throw error;

            const processedRooms = (data || []).map((room: any) => {
                const isStudent = room.student_id === user.id;
                const otherParty = isStudent ? room.instructor : room.student;

                return {
                    ...room,
                    other_party_name: otherParty?.full_name || 'Usuário',
                    other_party_avatar: isStudent ? otherParty?.photo_url : otherParty?.avatar_url,
                    unread_count: isStudent ? room.unread_count_student : room.unread_count_instructor
                };
            });

            setRooms(processedRooms);
        } catch (error) {
            console.error('Error fetching rooms:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    useEffect(() => {
        fetchRooms();
    }, [fetchRooms]);

    const formatTime = (dateStr: string | null) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } else if (days === 1) {
            return 'Ontem';
        } else if (days < 7) {
            return date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace(/^\w/, c => c.toUpperCase());
        } else {
            return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
        }
    };

    const renderRoom = ({ item }: { item: ChatRoom }) => {
        return (
            <TouchableOpacity
                style={[styles.roomItem, { backgroundColor: theme.card, borderBottomColor: theme.cardBorder }]}
                onPress={() => router.push(`/connect/chat/${item.id}`)}
                activeOpacity={0.7}
            >
                {item.other_party_avatar ? (
                    <Image source={{ uri: item.other_party_avatar }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primaryLight }]}>
                        <Text style={[styles.avatarText, { color: theme.primary }]}>
                            {item.other_party_name.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}

                <View style={styles.roomInfo}>
                    <View style={styles.roomHeader}>
                        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                            {item.other_party_name}
                        </Text>
                        <Text style={[styles.time, { color: theme.textSecondary }]}>
                            {formatTime(item.last_message_at)}
                        </Text>
                    </View>
                    <View style={styles.roomFooter}>
                        <Text
                            style={[
                                styles.lastMessage,
                                { color: theme.textSecondary, fontWeight: item.unread_count > 0 ? '700' : '400' }
                            ]}
                            numberOfLines={1}
                        >
                            {item.last_message || 'Inicie uma conversa'}
                        </Text>
                        {item.unread_count > 0 && (
                            <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
                                <Text style={styles.unreadText}>{item.unread_count}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.text }]}>Mensagens</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <FlatList
                    data={rooms}
                    renderItem={renderRoom}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); fetchRooms(); }}
                            tintColor={theme.primary}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={[styles.emptyIconContainer, { backgroundColor: theme.card }]}>
                                <Ionicons name="chatbubble-ellipses-outline" size={48} color={theme.textMuted} />
                            </View>
                            <Text style={[styles.emptyTitle, { color: theme.text }]}>Nenhuma conversa</Text>
                            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                                Suas conversas com instrutores aparecerão aqui.
                            </Text>
                        </View>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        flexGrow: 1,
    },
    roomItem: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
        borderBottomWidth: 0.5,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    avatarPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    roomInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center',
    },
    roomHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
        flex: 1,
        marginRight: 8,
    },
    time: {
        fontSize: 12,
    },
    roomFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lastMessage: {
        fontSize: 14,
        flex: 1,
        marginRight: 12,
    },
    unreadBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        minWidth: 24,
        alignItems: 'center',
    },
    unreadText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        marginTop: 60,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
});
