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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';

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
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');

    const fetchBookings = useCallback(async () => {
        if (!user?.id) return;

        try {
            const now = new Date().toISOString().split('T')[0];

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
                .eq('student_id', user.id);

            if (activeTab === 'upcoming') {
                query = query
                    .gte('scheduled_date', now)
                    .in('status', ['pending', 'confirmed'])
                    .order('scheduled_date', { ascending: true });
            } else {
                query = query
                    .or(`scheduled_date.lt.${now},status.eq.completed,status.eq.cancelled`)
                    .order('scheduled_date', { ascending: false });
            }

            const { data, error } = await query;

            if (error) throw error;

            const formattedData = data?.map((booking: any) => ({
                ...booking,
                instructor: booking.instructor[0] || booking.instructor,
            })) || [];

            setBookings(formattedData);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id, activeTab]);

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
        const status = getStatusBadge(booking.status);
        const bookingDate = new Date(booking.scheduled_date + 'T00:00:00');
        const isPast = new Date(booking.scheduled_date) < new Date();
        const canCancel = !isPast && ['pending', 'confirmed'].includes(booking.status);

        return (
            <View
                key={booking.id}
                style={[styles.bookingCard, { backgroundColor: theme.card }]}
            >
                <View style={styles.bookingHeader}>
                    {booking.instructor?.photo_url ? (
                        <Image
                            source={{ uri: booking.instructor.photo_url }}
                            style={styles.instructorPhoto}
                        />
                    ) : (
                        <View style={[styles.instructorPhotoPlaceholder, { backgroundColor: theme.primary }]}>
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
                            <Ionicons name="location-outline" size={14} color={theme.textMuted} />
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

                <View style={[styles.bookingDetails, { borderTopColor: theme.cardBorder }]}>
                    <View style={styles.detailItem}>
                        <Ionicons name="calendar-outline" size={18} color={theme.primary} />
                        <Text style={[styles.detailText, { color: theme.text }]}>
                            {bookingDate.toLocaleDateString('pt-BR', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short'
                            })}
                        </Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Ionicons name="time-outline" size={18} color={theme.primary} />
                        <Text style={[styles.detailText, { color: theme.text }]}>
                            {formatTime(booking.scheduled_time)}
                        </Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Ionicons name="cash-outline" size={18} color={theme.primary} />
                        <Text style={[styles.detailText, { color: theme.text }]}>
                            {formatPrice(booking.price)}
                        </Text>
                    </View>
                </View>

                {canCancel && (
                    <TouchableOpacity
                        style={[styles.cancelButton, { borderColor: theme.cardBorder }]}
                        onPress={() => handleCancelBooking(booking.id)}
                    >
                        <Ionicons name="close-circle-outline" size={18} color="#dc2626" />
                        <Text style={styles.cancelButtonText}>Cancelar Aula</Text>
                    </TouchableOpacity>
                )}

                {booking.payment_status === 'paid' && (
                    <View style={styles.contactButtonsRow}>
                        <TouchableOpacity
                            style={[styles.contactBtn, { backgroundColor: theme.card, borderColor: theme.primary }]}
                            onPress={() => {
                                const phone = booking.instructor?.phone?.replace(/\D/g, '');
                                if (phone) Linking.openURL(`tel:${phone}`);
                            }}
                        >
                            <Ionicons name="call-outline" size={18} color={theme.primary} />
                            <Text style={[styles.contactBtnText, { color: theme.primary }]}>Ligar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.contactBtn, { backgroundColor: '#25D366' }]}
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

                {['confirmed'].includes(booking.status) && (
                    <TouchableOpacity
                        style={[styles.confirmButton, { backgroundColor: theme.primary }]}
                        onPress={() => router.push(`/connect/aula/${booking.id}/scan`)}
                    >
                        <Ionicons name="scan-outline" size={20} color="#fff" />
                        <Text style={styles.confirmButtonText}>Confirmar Presença</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            {/* Header - Simplified for Tab */}
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Minhas Aulas</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        { backgroundColor: activeTab === 'upcoming' ? theme.primary : theme.card }
                    ]}
                    onPress={() => setActiveTab('upcoming')}
                >
                    <Text style={[
                        styles.tabText,
                        { color: activeTab === 'upcoming' ? '#fff' : theme.text }
                    ]}>
                        Próximas
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        { backgroundColor: activeTab === 'history' ? theme.primary : theme.card }
                    ]}
                    onPress={() => setActiveTab('history')}
                >
                    <Text style={[
                        styles.tabText,
                        { color: activeTab === 'history' ? '#fff' : theme.text }
                    ]}>
                        Histórico
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    {bookings.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons
                                name={activeTab === 'upcoming' ? 'calendar-outline' : 'time-outline'}
                                size={48}
                                color={theme.textMuted}
                            />
                            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                                {activeTab === 'upcoming'
                                    ? 'Você não tem aulas agendadas.'
                                    : 'Nenhuma aula no histórico.'}
                            </Text>
                            {activeTab === 'upcoming' && (
                                <TouchableOpacity
                                    style={[styles.findButton, { backgroundColor: theme.primary }]}
                                    onPress={() => router.push('/(tabs)/buscar')}
                                >
                                    <Text style={styles.findButtonText}>Encontrar Instrutor</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                        bookings.map(renderBookingCard)
                    )}
                    <View style={{ height: 100 }} />
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 16,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
    },
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
        gap: 16,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
        gap: 12,
    },
    emptyText: {
        fontSize: 15,
        textAlign: 'center',
    },
    findButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
        marginTop: 8,
    },
    findButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    bookingCard: {
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    bookingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    instructorPhoto: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    instructorPhotoPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    instructorInitial: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
    bookingInfo: {
        flex: 1,
        marginLeft: 12,
    },
    instructorName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    locationText: {
        fontSize: 12,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    bookingDetails: {
        flexDirection: 'row',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        gap: 16,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        fontSize: 13,
        fontWeight: '500',
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 16,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
    },
    cancelButtonText: {
        color: '#dc2626',
        fontSize: 14,
        fontWeight: '600',
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
        borderRadius: 10,
        borderWidth: 1,
    },
    contactBtnText: {
        fontSize: 13,
        fontWeight: '600',
    },
    confirmButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 12,
        paddingVertical: 12,
        borderRadius: 10,
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});
