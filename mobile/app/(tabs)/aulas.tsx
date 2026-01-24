import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    Alert,
    StatusBar,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import BookingCard from '../../components/vrumi/BookingCard';
import { getCache, setCache } from '../../utils/cacheUtils';
import { logError, parseError } from '../../utils/errorUtils';

// --- Types ---
interface Instructor {
    id: string;
    full_name: string;
    photo_url: string | null;
    city: string;
    state: string;
    phone: string;
}

interface Booking {
    id: string;
    scheduled_date: string;
    scheduled_time: string;
    duration_minutes: number;
    price: number;
    status: string;
    payment_status: string;
    instructor: Instructor;
    student?: {
        full_name: string;
        avatar_url: string | null;
    };
    student_id: string;
    instructor_id: string;
    unread_messages?: number;
    chat_room_id?: string;
    isInstructorRole?: boolean;
}

// --- Sub-components ---

const EmptyState = memo(({ theme, tab }: any) => (
    <View style={styles.emptyContainer}>
        <View style={[styles.emptyIconContainer, { backgroundColor: theme.primarySoft }]}>
            <Ionicons
                name={tab === 'upcoming' ? "calendar-outline" : "archive-outline"}
                size={48}
                color={theme.primary}
            />
        </View>
        <Text style={[styles.emptyTitle, { color: theme.text }]}>
            {tab === 'upcoming' ? "Nenhuma aula agendada" : "Histórico vazio"}
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            {tab === 'upcoming'
                ? "Que tal agendar sua primeira aula prática hoje?"
                : "Suas aulas concluídas aparecerão aqui."}
        </Text>
        {tab === 'upcoming' && (
            <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: theme.primary }]}
                onPress={() => router.push('/(tabs)/buscar')}
            >
                <Text style={styles.emptyButtonText}>Agendar Aula</Text>
            </TouchableOpacity>
        )}
    </View>
));

export default function AulasScreen() {
    const { theme, isDark } = useTheme();
    const { user } = useAuth();

    const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
    const [historyBookings, setHistoryBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');

    // Modal states for cancellation (simplified for now to focus on UI)
    const [processingAction, setProcessingAction] = useState(false);

    const fetchBookings = useCallback(async (isSilent = false) => {
        if (!user?.id) return;
        if (!isSilent) setLoading(true);

        try {
            const { data: instructorProfile } = await supabase
                .from('instructors')
                .select('id')
                .eq('user_id', user.id)
                .single();

            let orFilter = `student_id.eq.${user.id}`;
            if (instructorProfile?.id) orFilter += `,instructor_id.eq.${instructorProfile.id}`;

            const [bookingsRes, chatRoomsRes] = await Promise.all([
                supabase.from('bookings').select(`
                    id, scheduled_date, scheduled_time, duration_minutes, price, status, payment_status, instructor_id, student_id,
                    instructor:instructors(id, full_name, photo_url, city, state, phone),
                    student:profiles(id, full_name, avatar_url)
                `).or(orFilter).order('scheduled_date', { ascending: true }).order('scheduled_time', { ascending: true }),
                supabase.from('connect_chat_rooms').select('id, student_id, instructor_id, unread_count_student, unread_count_instructor')
                    .or(`student_id.eq.${user.id}${instructorProfile?.id ? `,instructor_id.eq.${instructorProfile.id}` : ''}`)
            ]);

            if (bookingsRes.error) throw bookingsRes.error;

            if (bookingsRes.data) {
                const formattedData = bookingsRes.data.map((booking: any) => {
                    const isInstructorRole = instructorProfile?.id === booking.instructor_id;
                    const instructor = Array.isArray(booking.instructor) ? booking.instructor[0] : booking.instructor;
                    const student = Array.isArray(booking.student) ? booking.student[0] : booking.student;
                    const chatRoom = chatRoomsRes.data?.find(room => room.student_id === booking.student_id && room.instructor_id === booking.instructor_id);
                    const unreadCount = isInstructorRole ? (chatRoom?.unread_count_instructor || 0) : (chatRoom?.unread_count_student || 0);

                    return { ...booking, instructor, student, unread_messages: unreadCount, chat_room_id: chatRoom?.id, isInstructorRole };
                }) || [];

                const todayStr = new Date().toISOString().split('T')[0];
                setUpcomingBookings(formattedData.filter(b => ['pending', 'confirmed'].includes(b.status) && b.scheduled_date >= todayStr));
                setHistoryBookings(formattedData.filter(b => ['completed', 'cancelled'].includes(b.status) || (['pending', 'confirmed'].includes(b.status) && b.scheduled_date < todayStr)).reverse());

                // Cache the processed data
                await setCache(`bookings_data_${user.id}`, formattedData);
            }
        } catch (error) {
            logError(error, 'AulasScreen.fetchBookings');
            const appError = parseError(error);
            // Only alert if not a silent update
            if (!isSilent) {
                Alert.alert(appError.message, appError.description);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => {
        const loadCacheAndFetch = async () => {
            if (!user?.id) return;

            // 1. Try to load from cache
            const cachedData = await getCache<any>(`bookings_data_${user.id}`);
            if (cachedData) {
                const todayStr = new Date().toISOString().split('T')[0];
                setUpcomingBookings(cachedData.filter((b: any) => ['pending', 'confirmed'].includes(b.status) && b.scheduled_date >= todayStr));
                setHistoryBookings(cachedData.filter((b: any) => ['completed', 'cancelled'].includes(b.status) || (['pending', 'confirmed'].includes(b.status) && b.scheduled_date < todayStr)).reverse());
                setLoading(false);
            }

            // 2. Fetch fresh data
            fetchBookings(!!cachedData);
        };

        loadCacheAndFetch();
    }, [user?.id, fetchBookings]);

    const handleOpenChat = useCallback((booking: Booking) => {
        Haptics.selectionAsync();
        if (booking.chat_room_id) {
            router.push(`/connect/chat/${booking.chat_room_id}`);
        } else {
            // Logic to create room would go here, but for simplicity:
            Alert.alert('Chat', 'Iniciando conversa...');
        }
    }, []);

    const handleBookingPress = useCallback((booking: Booking) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Navigate to booking details (hypothetical or existing)
        // router.push(`/booking/${booking.id}`); 
        Alert.alert('Detalhes', `Aula com ${booking.isInstructorRole ? booking.student?.full_name : booking.instructor.full_name}`);
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchBookings();
    }, [fetchBookings]);

    const changeTab = (tab: 'upcoming' | 'history') => {
        if (activeTab === tab) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setActiveTab(tab);
    };

    const renderBookingItem = ({ item }: { item: Booking }) => (
        <BookingCard
            booking={item}
            theme={theme}
            onOpenChat={() => handleOpenChat(item)}
            onPress={() => handleBookingPress(item)}
        />
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>Minhas Aulas</Text>

                <View style={[styles.tabContainer, { backgroundColor: theme.cardBorder }]}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'upcoming' && { backgroundColor: theme.card }]}
                        onPress={() => changeTab('upcoming')}
                    >
                        <Text style={[styles.tabText, { color: activeTab === 'upcoming' ? theme.primary : theme.textMuted }]}>
                            Agendadas
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'history' && { backgroundColor: theme.card }]}
                        onPress={() => changeTab('history')}
                    >
                        <Text style={[styles.tabText, { color: activeTab === 'history' ? theme.primary : theme.textMuted }]}>
                            Histórico
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <FlatList
                    data={activeTab === 'upcoming' ? upcomingBookings : historyBookings}
                    keyExtractor={(item) => item.id}
                    renderItem={renderBookingItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                    }
                    ListEmptyComponent={<EmptyState theme={theme} tab={activeTab} />}
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
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 20,
    },
    tabContainer: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: 16,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '700',
    },
    listContent: {
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 40,
        flexGrow: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 40,
        marginBottom: 32,
    },
    emptyButton: {
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    emptyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
