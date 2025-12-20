import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Linking,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { isLessonExpired } from '../../utils/dateUtils';

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

export default function AulasScreen() {
    const { theme, isDark } = useTheme();
    const { user } = useAuth();
    const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
    const [historyBookings, setHistoryBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');

    const fetchBookings = useCallback(async () => {
        if (!user?.id) return;

        try {
            // 1. Check if user is an instructor
            const { data: instructorProfile } = await supabase
                .from('instructors')
                .select('id')
                .eq('user_id', user.id)
                .single();

            // 2. Build or filter for both roles
            let orFilter = `student_id.eq.${user.id}`;
            if (instructorProfile?.id) {
                orFilter += `,instructor_id.eq.${instructorProfile.id}`;
            }

            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    id,
                    scheduled_date,
                    scheduled_time,
                    duration_minutes,
                    price,
                    status,
                    payment_status,
                    instructor_id,
                    student_id,
                    instructor:instructors(id, full_name, photo_url, city, state, phone),
                    student:profiles(id, full_name, avatar_url)
                `)
                .or(orFilter)
                .order('scheduled_date', { ascending: true })
                .order('scheduled_time', { ascending: true });

            if (error) throw error;

            if (data) {
                // Fetch chat rooms for counts
                const { data: chatRooms } = await supabase
                    .from('connect_chat_rooms')
                    .select('id, student_id, instructor_id, unread_count_student, unread_count_instructor')
                    .or(`student_id.eq.${user.id}${instructorProfile?.id ? `,instructor_id.eq.${instructorProfile.id}` : ''}`);

                const formattedData = data.map((booking: any) => {
                    const isInstructorRole = instructorProfile?.id === booking.instructor_id;
                    const instructor = Array.isArray(booking.instructor) ? booking.instructor[0] : booking.instructor;
                    const student = Array.isArray(booking.student) ? booking.student[0] : booking.student;

                    const chatRoom = chatRooms?.find(room =>
                        room.student_id === booking.student_id &&
                        room.instructor_id === booking.instructor_id
                    );

                    const unreadCount = isInstructorRole
                        ? (chatRoom?.unread_count_instructor || 0)
                        : (chatRoom?.unread_count_student || 0);

                    return {
                        ...booking,
                        instructor: instructor,
                        student: student,
                        unread_messages: unreadCount,
                        chat_room_id: chatRoom?.id,
                        isInstructorRole
                    };
                }) || [];

                // Separate bookings into upcoming and history
                const now = new Date();
                const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

                const upcoming = formattedData.filter(booking => {
                    // Keep in upcoming if:
                    // 1. Status is confirmed or pending
                    // 2. AND (it's today OR it's in the future OR it's not explicitly cancelled/completed)
                    // We only move to history if it's explicitly done, cancelled, or from a past date.
                    const isFutureOrToday = booking.scheduled_date >= todayStr;
                    return ['pending', 'confirmed'].includes(booking.status) && isFutureOrToday;
                });

                const history = formattedData.filter(booking => {
                    const isPast = booking.scheduled_date < todayStr;
                    return ['completed', 'cancelled'].includes(booking.status) ||
                        (['pending', 'confirmed'].includes(booking.status) && isPast);
                });

                setUpcomingBookings(upcoming);
                setHistoryBookings(history);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]); // Removed activeTab from dependency array as filtering is now client-side

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const handleOpenChat = async (studentId: string, instructorId: string) => {
        if (!user) return;

        try {
            // Find existing room
            const { data: room } = await supabase
                .from('connect_chat_rooms')
                .select('id')
                .eq('student_id', studentId)
                .eq('instructor_id', instructorId)
                .single();

            if (room) {
                router.push(`/connect/chat/${room.id}`);
                return;
            }

            // Create new room if not exists
            const { data: newRoom, error: createError } = await supabase
                .from('connect_chat_rooms')
                .insert({
                    student_id: studentId,
                    instructor_id: instructorId
                })
                .select()
                .single();

            if (createError) throw createError;
            if (newRoom) router.push(`/connect/chat/${newRoom.id}`);

        } catch (error) {
            console.error('Error opening chat:', error);
            Alert.alert('Erro', 'Não foi possível iniciar a conversa.');
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchBookings();
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(price);
    };

    const formatTime = (time: string) => time.substring(0, 5);

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
            pending: { bg: '#fef3c7', text: '#d97706', label: 'Pendente' },
            confirmed: { bg: '#d1fae5', text: '#059669', label: 'Confirmada' },
            completed: { bg: '#dbeafe', text: '#2563eb', label: 'Concluída' },
            cancelled: { bg: '#fee2e2', text: '#dc2626', label: 'Cancelada' },
            expired: { bg: '#f3f4f6', text: '#6b7280', label: 'Não Realizada' },
        };
        return statusConfig[status] || statusConfig.pending;
    };

    const handleCancelBooking = async (bookingId: string, paymentStatus: string) => {
        const reasons = [
            'Mudança de horário',
            'Imprevisto pessoal',
            'Problema com transporte',
            'Condições climáticas',
            'Outro motivo',
        ];

        // Helper function to process cancellation
        const processCancellation = async (reason: string, withRefund: boolean) => {
            try {
                if (withRefund && paymentStatus === 'completed') {
                    // Process automatic refund via Edge Function
                    const session = await supabase.auth.getSession();
                    const response = await fetch(
                        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/connect-refund`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${session.data.session?.access_token}`,
                            },
                            body: JSON.stringify({ bookingId, reason }),
                        }
                    );

                    const result = await response.json();

                    if (response.ok && result.success) {
                        Alert.alert(
                            'Reembolso Processado! ✅',
                            `Sua aula foi cancelada e o reembolso de R$ ${result.amount_refunded?.toFixed(2)} foi processado. O valor será creditado em até 10 dias úteis.`,
                            [{ text: 'Entendi' }]
                        );
                        fetchBookings();
                    } else {
                        throw new Error(result.error || 'Erro ao processar reembolso');
                    }
                } else {
                    // Cancel without refund (RPC function)
                    // @ts-ignore - cancel_booking function added via migration
                    const { data, error } = await supabase.rpc('cancel_booking', {
                        p_booking_id: bookingId,
                        p_cancelled_by: user?.id,
                        p_reason: reason,
                    });

                    if (error) throw error;

                    const result = data as any;
                    if (result?.success) {
                        Alert.alert('Sucesso', 'Aula cancelada com sucesso.');
                        fetchBookings();
                    } else {
                        throw new Error(result?.error || 'Erro ao cancelar');
                    }
                }
            } catch (error: any) {
                console.error('Cancel/Refund error:', error);
                Alert.alert('Erro', error.message || 'Não foi possível processar a solicitação.');
            }
        };

        // Different flow for paid vs unpaid bookings
        if (paymentStatus === 'completed') {
            // Paid booking - offer refund option
            Alert.alert(
                'Cancelar Aula Paga',
                'Esta aula já foi paga. Deseja solicitar o reembolso automático?',
                [
                    { text: 'Voltar', style: 'cancel' },
                    {
                        text: 'Cancelar sem reembolso',
                        onPress: () => {
                            Alert.alert(
                                'Motivo do Cancelamento',
                                'Selecione o motivo:',
                                reasons.map(reason => ({
                                    text: reason,
                                    onPress: () => processCancellation(reason, false),
                                }))
                            );
                        },
                    },
                    {
                        text: 'Cancelar com reembolso',
                        style: 'destructive',
                        onPress: () => {
                            Alert.alert(
                                'Confirmar Reembolso',
                                'O valor será estornado para o método de pagamento original em até 10 dias úteis. Selecione o motivo:',
                                reasons.map(reason => ({
                                    text: reason,
                                    onPress: () => processCancellation(reason, true),
                                }))
                            );
                        },
                    },
                ]
            );
        } else {
            // Unpaid booking - simple cancellation
            Alert.alert(
                'Cancelar Aula',
                'Tem certeza que deseja cancelar esta aula?',
                [
                    { text: 'Voltar', style: 'cancel' },
                    {
                        text: 'Sim, cancelar',
                        style: 'destructive',
                        onPress: () => {
                            Alert.alert(
                                'Motivo do Cancelamento',
                                'Selecione o motivo:',
                                reasons.map(reason => ({
                                    text: reason,
                                    onPress: () => processCancellation(reason, false),
                                }))
                            );
                        },
                    },
                ]
            );
        }
    };

    const renderBookingCard = (booking: Booking & { isInstructorRole?: boolean, student?: any }) => {
        // Check if expired to adjust badge visualization
        const expired = isLessonExpired(booking.scheduled_date, booking.scheduled_time);
        const displayStatus = (['pending', 'confirmed'].includes(booking.status) && expired)
            ? 'expired'
            : booking.status;

        const status = getStatusBadge(displayStatus);
        const bookingDate = new Date(booking.scheduled_date + 'T00:00:00');
        const isPast = new Date(booking.scheduled_date) < new Date();
        const canCancel = !isPast && ['pending', 'confirmed'].includes(booking.status);

        // UI adaptation based on role
        const otherPartyName = booking.isInstructorRole
            ? booking.student?.full_name || 'Aluno'
            : booking.instructor?.full_name || 'Instrutor';

        const otherPartyPhoto = booking.isInstructorRole
            ? booking.student?.avatar_url
            : booking.instructor?.photo_url;

        return (
            <View key={booking.id} style={[styles.bookingCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
                {/* Header Row */}
                <View style={styles.bookingHeader}>
                    {otherPartyPhoto ? (
                        <Image
                            source={{ uri: otherPartyPhoto }}
                            style={styles.instructorPhoto}
                        />
                    ) : (
                        <View style={[styles.instructorPhotoPlaceholder, { backgroundColor: theme.primary }]}>
                            <Text style={styles.instructorInitial}>
                                {otherPartyName.charAt(0) || '?'}
                            </Text>
                        </View>
                    )}

                    <View style={styles.bookingInfo}>
                        <Text style={[styles.instructorName, { color: theme.text }]}>
                            {otherPartyName}
                        </Text>
                        <View style={styles.locationRow}>
                            <Ionicons name="location" size={12} color={theme.textMuted} />
                            <Text style={[styles.locationText, { color: theme.textMuted }]}>
                                {booking.isInstructorRole ? 'Sua aula' : `${booking.instructor?.city}, ${booking.instructor?.state}`}
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                        <Text style={[styles.statusText, { color: status.text }]}>
                            {status.label}
                        </Text>
                    </View>
                </View>

                {/* Details Row */}
                <View style={styles.bookingDetails}>
                    <View style={styles.detailItem}>
                        <Ionicons name="calendar" size={16} color="#10b981" />
                        <Text style={[styles.detailText, { color: theme.text }]}>
                            {bookingDate.toLocaleDateString('pt-BR', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short'
                            })}
                        </Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Ionicons name="time" size={16} color="#10b981" />
                        <Text style={[styles.detailText, { color: theme.text }]}>
                            {formatTime(booking.scheduled_time)}
                        </Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Ionicons name="cash" size={16} color="#10b981" />
                        <Text style={[styles.detailText, { color: theme.text }]}>
                            {formatPrice(booking.price)}
                        </Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtonsContainer}>
                    {['confirmed'].includes(booking.status) && !expired && (
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => router.push(`/connect/aula/${booking.id}`)}
                        >
                            <Ionicons name="scan-outline" size={20} color="#fff" />
                            <Text style={styles.primaryButtonText}>Confirmar Presença</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[styles.chatButton, { borderColor: theme.primary, borderWidth: 1 }]}
                        onPress={() => handleOpenChat(booking.student_id, booking.instructor_id)}
                    >
                        <Ionicons name="chatbubble-ellipses-outline" size={20} color={theme.primary} />
                        <Text style={[styles.chatButtonText, { color: theme.primary }]}>Conversar pelo Vrumi</Text>
                        {(booking.unread_messages ?? 0) > 0 && (
                            <View style={[styles.chatBadge, { backgroundColor: theme.primary }]}>
                                <Text style={styles.chatBadgeText}>{booking.unread_messages}</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {expired && ['confirmed', 'pending'].includes(booking.status) && (
                        <TouchableOpacity
                            style={styles.rebookButton}
                            onPress={() => router.push(`/connect/instrutor/${booking.instructor.id}`)}
                        >
                            <Ionicons name="calendar" size={20} color="#fff" />
                            <Text style={styles.rebookButtonText}>Reagendar Aula</Text>
                        </TouchableOpacity>
                    )}
                </View>


                {canCancel && (
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => handleCancelBooking(booking.id, booking.payment_status)}
                    >
                        <Ionicons name="close-circle-outline" size={18} color="#dc2626" />
                        <Text style={styles.cancelButtonText}>Cancelar Aula</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: isDark ? theme.card : '#ffffff' }]}>
                {activeTab === 'upcoming' ? (
                    <Ionicons name="calendar-outline" size={48} color={isDark ? theme.textMuted : '#9ca3af'} />
                ) : (
                    <Ionicons name="time-outline" size={48} color={isDark ? theme.textMuted : '#9ca3af'} />
                )}
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
                {activeTab === 'upcoming' ? 'Nenhuma aula agendada' : 'Histórico vazio'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
                {activeTab === 'upcoming'
                    ? 'Suas próximas aulas aparecerão aqui.'
                    : 'Suas aulas passadas aparecerão aqui.'}
            </Text>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle="light-content" backgroundColor="#064e3b" />

            {/* Dark Green Header */}
            <View style={styles.headerSection}>
                <SafeAreaView edges={['top']} style={styles.safeHeader}>
                    <Text style={styles.headerTitle}>Minhas Aulas</Text>
                    <Text style={styles.headerSubtitle}>
                        Gerencie suas aulas agendadas
                    </Text>
                </SafeAreaView>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 },
                        activeTab === 'upcoming' && styles.tabActive,
                    ]}
                    onPress={() => setActiveTab('upcoming')}
                >
                    <Ionicons
                        name="calendar"
                        size={18}
                        color={activeTab === 'upcoming' ? '#fff' : theme.textSecondary}
                    />
                    <Text style={[
                        styles.tabText,
                        activeTab === 'upcoming' && styles.tabTextActive,
                    ]}>
                        Próximas
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 },
                        activeTab === 'history' && styles.tabActive,
                    ]}
                    onPress={() => setActiveTab('history')}
                >
                    <Ionicons
                        name="time"
                        size={18}
                        color={activeTab === 'history' ? '#fff' : theme.textSecondary}
                    />
                    <Text style={[
                        styles.tabText,
                        activeTab === 'history' && styles.tabTextActive,
                    ]}>
                        Histórico
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#10b981" />
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={isDark ? theme.primary : '#10b981'}
                            colors={[isDark ? theme.primary : '#10b981']}
                        />
                    }
                >
                    {activeTab === 'upcoming' ? (
                        upcomingBookings.length > 0 ? (
                            upcomingBookings.map((booking) => (
                                <View key={booking.id} style={{ marginBottom: 16 }}>
                                    {renderBookingCard(booking)}
                                </View>
                            ))
                        ) : (
                            renderEmptyState()
                        )
                    ) : (
                        historyBookings.length > 0 ? (
                            historyBookings.map((booking) => (
                                <View key={booking.id} style={{ marginBottom: 16 }}>
                                    {renderBookingCard(booking)}
                                </View>
                            ))
                        ) : (
                            renderEmptyState()
                        )
                    )}

                    <View style={{ height: 120 }} />
                </ScrollView>
            )}
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    // Header Section
    headerSection: {
        backgroundColor: '#064e3b',
        paddingBottom: 24,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    safeHeader: {
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
    },
    // Tabs
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginTop: 20,
        marginBottom: 16,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    tabActive: {
        backgroundColor: '#10b981',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
    },
    tabTextActive: {
        color: '#fff',
    },
    // Content
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
    },
    // Empty State
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    findButton: {
        backgroundColor: '#10b981',
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 14,
    },
    findButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
    // Bookings List
    bookingsList: {
        gap: 16,
    },
    bookingCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    bookingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    instructorPhoto: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    instructorPhotoPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#10b981',
        justifyContent: 'center',
        alignItems: 'center',
    },
    instructorInitial: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '700',
    },
    bookingInfo: {
        flex: 1,
        marginLeft: 12,
    },
    instructorName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 4,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    locationText: {
        fontSize: 12,
        color: '#6b7280',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
    },
    bookingDetails: {
        flexDirection: 'row',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        gap: 20,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1f2937',
    },
    // Buttons
    actionButtonsContainer: {
        gap: 12,
        marginTop: 16,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: '#10b981',
    },
    chatButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 14,
    },
    chatButtonText: {
        fontSize: 15,
        fontWeight: '700',
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 12,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fee2e2',
        backgroundColor: '#fef2f2',
    },
    cancelButtonText: {
        color: '#dc2626',
        fontSize: 13,
        fontWeight: '600',
    },
    rebookButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: '#064e3b',
    },
    rebookButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    chatBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: '#fff',
    },
    chatBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
});
