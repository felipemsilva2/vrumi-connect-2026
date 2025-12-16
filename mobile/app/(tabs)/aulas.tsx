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
            // Fetch all relevant bookings without pre-filtering by date/status for tabs
            let query = supabase
                .from('bookings')
                .select(`
                    id,
                    scheduled_date,
                    scheduled_time,
                    duration_minutes,
                    price,
                    status,
                    payment_status,
                    instructor:instructors(id, full_name, photo_url, city, state, phone)
                `)
                .eq('student_id', user.id)
                .order('scheduled_date', { ascending: true }) // Order by date for consistent processing
                .order('scheduled_time', { ascending: true });

            const { data, error } = await query;

            if (error) throw error;

            if (data) {
                const formattedData = data.map((booking: any) => ({
                    ...booking,
                    instructor: booking.instructor[0] || booking.instructor,
                })) || [];

                // Separate bookings into upcoming and history
                const upcoming = formattedData.filter(booking => {
                    // Check if lesson is expired (past time + 30min tolerance)
                    const expired = isLessonExpired(booking.scheduled_date, booking.scheduled_time);

                    // Lesson is upcoming if status is confirmed/pending AND not expired
                    return ['pending', 'confirmed'].includes(booking.status) && !expired;
                });

                const history = formattedData.filter(booking => {
                    const expired = isLessonExpired(booking.scheduled_date, booking.scheduled_time);
                    // History includes:
                    // 1. Completed/Cancelled lessons
                    // 2. Confirmed/Pending lessons that are EXPIRED
                    return ['completed', 'cancelled'].includes(booking.status) ||
                        (['pending', 'confirmed'].includes(booking.status) && expired);
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

    const handleCancelBooking = async (bookingId: string) => {
        Alert.alert(
            'Cancelar Aula',
            'Tem certeza que deseja cancelar esta aula?',
            [
                { text: 'Não', style: 'cancel' },
                {
                    text: 'Sim, cancelar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('bookings')
                                .update({ status: 'cancelled' })
                                .eq('id', bookingId);

                            if (error) throw error;
                            fetchBookings();
                        } catch (error) {
                            Alert.alert('Erro', 'Não foi possível cancelar a aula.');
                        }
                    },
                },
            ]
        );
    };

    const renderBookingCard = (booking: Booking) => {
        // Check if expired to adjust badge visualization
        const expired = isLessonExpired(booking.scheduled_date, booking.scheduled_time);
        const displayStatus = (['pending', 'confirmed'].includes(booking.status) && expired)
            ? 'expired'
            : booking.status;

        const status = getStatusBadge(displayStatus);
        const bookingDate = new Date(booking.scheduled_date + 'T00:00:00');
        const isPast = new Date(booking.scheduled_date) < new Date();
        const canCancel = !isPast && ['pending', 'confirmed'].includes(booking.status);

        return (
            <View key={booking.id} style={[styles.bookingCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
                {/* Header Row */}
                <View style={styles.bookingHeader}>
                    {booking.instructor?.photo_url ? (
                        <Image
                            source={{ uri: booking.instructor.photo_url }}
                            style={styles.instructorPhoto}
                        />
                    ) : (
                        <View style={styles.instructorPhotoPlaceholder}>
                            <Text style={styles.instructorInitial}>
                                {booking.instructor?.full_name?.charAt(0) || 'I'}
                            </Text>
                        </View>
                    )}

                    <View style={styles.bookingInfo}>
                        <Text style={[styles.instructorName, { color: theme.text }]}>
                            {booking.instructor?.full_name || 'Instrutor'}
                        </Text>
                        <View style={styles.locationRow}>
                            <Ionicons name="location" size={12} color={theme.textMuted} />
                            <Text style={[styles.locationText, { color: theme.textMuted }]}>
                                {booking.instructor?.city}, {booking.instructor?.state}
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

                {/* Actions */}
                {['confirmed'].includes(booking.status) && !expired && (
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => router.push(`/connect/aula/${booking.id}`)}
                    >
                        <Ionicons name="scan-outline" size={20} color="#fff" />
                        <Text style={styles.primaryButtonText}>Confirmar Presença</Text>
                    </TouchableOpacity>
                )}

                {/* Expired Lesson Recovery Actions */}
                {expired && ['confirmed', 'pending'].includes(booking.status) && (
                    <View style={styles.recoveryActions}>
                        <TouchableOpacity
                            style={styles.rebookButton}
                            onPress={() => router.push(`/connect/instrutor/${booking.instructor.id}`)}
                        >
                            <Ionicons name="calendar" size={20} color="#fff" />
                            <Text style={styles.rebookButtonText}>Reagendar Aula</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.whatsappOutlineBtn}
                            onPress={() => {
                                const phone = booking.instructor?.phone?.replace(/\D/g, '');
                                if (phone) Linking.openURL(`https://wa.me/55${phone}`);
                            }}
                        >
                            <Ionicons name="logo-whatsapp" size={20} color="#10b981" />
                            <Text style={styles.whatsappOutlineText}>Falar com Instrutor</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {booking.payment_status === 'paid' && (
                    <View style={styles.contactButtonsRow}>
                        <TouchableOpacity
                            style={styles.contactBtn}
                            onPress={() => {
                                const phone = booking.instructor?.phone?.replace(/\D/g, '');
                                if (phone) Linking.openURL(`tel:${phone}`);
                            }}
                        >
                            <Ionicons name="call" size={18} color="#10b981" />
                            <Text style={styles.contactBtnText}>Ligar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.contactBtn, styles.whatsappBtn]}
                            onPress={() => {
                                const phone = booking.instructor?.phone?.replace(/\D/g, '');
                                if (phone) Linking.openURL(`https://wa.me/55${phone}`);
                            }}
                        >
                            <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                            <Text style={[styles.contactBtnText, { color: '#fff' }]}>WhatsApp</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {canCancel && (
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => handleCancelBooking(booking.id)}
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
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 16,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: '#10b981',
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    contactButtonsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
    },
    contactBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#ecfdf5',
    },
    whatsappBtn: {
        backgroundColor: '#25D366',
    },
    contactBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#10b981',
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
    // Recovery Actions
    recoveryActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    rebookButton: {
        flex: 1.2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#10b981',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    rebookButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    whatsappOutlineBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#10b981',
        backgroundColor: 'transparent',
    },
    whatsappOutlineText: {
        color: '#10b981',
        fontSize: 12,
        fontWeight: '600',
    },
});
