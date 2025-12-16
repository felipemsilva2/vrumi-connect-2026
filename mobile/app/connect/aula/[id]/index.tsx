import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Image,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../../../src/lib/supabase';
import { useAuth } from '../../../../contexts/AuthContext';
import { useTheme } from '../../../../contexts/ThemeContext';
import { isCheckInAvailable } from '../../../../utils/dateUtils';

interface BookingDetails {
    id: string;
    status: string;
    scheduled_date: string;
    scheduled_time: string;
    instructor: {
        full_name: string | null;
        photo_url: string | null;
    } | null;
    student: {
        full_name: string | null;
    } | null;
}

export default function CheckInScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuth();
    const { theme, isDark } = useTheme();
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState<BookingDetails | null>(null);
    const [isInstructor, setIsInstructor] = useState(false);
    const [checkInStatus, setCheckInStatus] = useState<{ available: boolean; reason: 'too_early' | 'too_late' | 'available' }>({ available: false, reason: 'available' });

    useEffect(() => {
        if (booking) {
            const status = isCheckInAvailable(booking.scheduled_date, booking.scheduled_time);
            setCheckInStatus(status);

            // Re-check every minute
            const interval = setInterval(() => {
                const newStatus = isCheckInAvailable(booking.scheduled_date, booking.scheduled_time);
                setCheckInStatus(newStatus);
            }, 60000);

            return () => clearInterval(interval);
        }
    }, [booking]);

    useEffect(() => {
        fetchBookingDetails();
    }, [id]);

    const fetchBookingDetails = async () => {
        if (!id || !user?.id) {
            setLoading(false);
            return;
        }

        try {
            // Get booking first
            const { data: bookingData, error: bookingError } = await supabase
                .from('bookings')
                .select('id, status, scheduled_date, scheduled_time, instructor_id, student_id')
                .eq('id', id)
                .single();

            if (bookingError || !bookingData) {
                console.error('Booking error:', bookingError);
                setBooking(null);
                setLoading(false);
                return;
            }

            // Get instructor info
            let instructorData = null;
            let instructorUserId = null;
            if (bookingData.instructor_id) {
                const { data: instructor } = await supabase
                    .from('instructors')
                    .select('full_name, photo_url, user_id')
                    .eq('id', bookingData.instructor_id)
                    .single();
                instructorData = instructor;
                instructorUserId = instructor?.user_id;
            }

            // Get student info
            let studentData = null;
            if (bookingData.student_id) {
                const { data: student } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', bookingData.student_id)
                    .single();
                studentData = student;
            }

            setBooking({
                id: bookingData.id,
                status: bookingData.status || 'pending',
                scheduled_date: bookingData.scheduled_date,
                scheduled_time: bookingData.scheduled_time,
                instructor: instructorData,
                student: studentData,
            });

            // Check if current user is the instructor
            setIsInstructor(instructorUserId === user.id);
        } catch (error) {
            console.error('Error fetching booking:', error);
            setBooking(null);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: string, time: string) => {
        const d = new Date(date + 'T00:00:00');
        return `${d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })} às ${time.slice(0, 5)}`;
    };

    const handleRoleSelect = (role: 'instructor' | 'student') => {
        if (role === 'instructor') {
            router.push(`/connect/aula/${id}/qrcode`);
        } else {
            router.push(`/connect/aula/${id}/scan`);
        }
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color="#10b981" />
            </View>
        );
    }

    if (!booking) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={64} color="#ef4444" />
                    <Text style={[styles.errorText, { color: theme.text }]}>Aula não encontrada</Text>
                    <TouchableOpacity style={[styles.backBtn, { backgroundColor: isDark ? theme.card : '#e5e7eb' }]} onPress={() => router.back()}>
                        <Text style={[styles.backBtnText, { color: theme.textSecondary }]}>Voltar</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (booking.status === 'completed') {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.completedContainer}>
                    <View style={styles.completedIcon}>
                        <Ionicons name="checkmark-circle" size={80} color="#10b981" />
                    </View>
                    <Text style={[styles.completedTitle, { color: theme.text }]}>Aula Concluída!</Text>
                    <Text style={[styles.completedSubtitle, { color: theme.textSecondary }]}>Esta aula já foi finalizada</Text>
                    <TouchableOpacity
                        style={styles.doneButton}
                        onPress={() => router.push('/(tabs)/aulas')}
                    >
                        <Text style={styles.doneButtonText}>Ver Minhas Aulas</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.closeBtn, { backgroundColor: isDark ? theme.card : '#f3f4f6' }]}>
                    <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Check-in da Aula</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Lesson Info Card */}
            <View style={[styles.lessonCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
                <View style={styles.lessonHeader}>
                    <View style={styles.statusBadge}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>Aula Agendada</Text>
                    </View>
                </View>
                <View style={styles.lessonInfo}>
                    <View style={styles.avatarContainer}>
                        {booking.instructor?.photo_url ? (
                            <Image
                                source={{ uri: booking.instructor.photo_url }}
                                style={styles.avatar}
                            />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Ionicons name="person" size={32} color="#fff" />
                            </View>
                        )}
                    </View>
                    <View style={styles.lessonDetails}>
                        <Text style={[styles.instructorName, { color: theme.text }]}>
                            {booking.instructor?.full_name || 'Instrutor'}
                        </Text>
                        <Text style={[styles.lessonDate, { color: theme.textSecondary }]}>
                            {formatDate(booking.scheduled_date, booking.scheduled_time)}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Role Specific Action */}
            <View style={styles.rolesContainer}>
                {/* Status Message if not available */}
                {!checkInStatus.available && (
                    <View style={[styles.statusMessage, { backgroundColor: checkInStatus.reason === 'too_early' ? '#eff6ff' : '#fee2e2' }]}>
                        <Ionicons
                            name={checkInStatus.reason === 'too_early' ? 'time' : 'alert-circle'}
                            size={20}
                            color={checkInStatus.reason === 'too_early' ? '#3b82f6' : '#ef4444'}
                        />
                        <Text style={[styles.statusMessageText, { color: checkInStatus.reason === 'too_early' ? '#1d4ed8' : '#b91c1c' }]}>
                            {checkInStatus.reason === 'too_early'
                                ? 'Aguarde: O check-in libera 15min antes da aula'
                                : 'Prazo de check-in expirado (30min tol.)'}
                        </Text>
                    </View>
                )}

                {isInstructor ? (
                    /* Instructor View */
                    <TouchableOpacity
                        style={[
                            styles.roleCard,
                            {
                                backgroundColor: theme.card,
                                borderColor: checkInStatus.available ? '#10b981' : theme.cardBorder,
                                opacity: checkInStatus.available ? 1 : 0.6
                            }
                        ]}
                        onPress={() => checkInStatus.available && router.push(`/connect/aula/${id}/qrcode`)}
                        activeOpacity={checkInStatus.available ? 0.9 : 1}
                        disabled={!checkInStatus.available}
                    >
                        <View style={[styles.recommendedBadge, { backgroundColor: checkInStatus.available ? '#10b981' : '#9ca3af' }]}>
                            <Text style={styles.recommendedText}>Sua Ação</Text>
                        </View>
                        <LinearGradient
                            colors={checkInStatus.available ? ['#064e3b', '#065f46'] : ['#4b5563', '#6b7280']}
                            style={styles.roleIconBg}
                        >
                            <Ionicons name="qr-code" size={32} color="#fff" />
                        </LinearGradient>
                        <Text style={[styles.roleTitle, { color: theme.text }]}>Realizar Check-in</Text>
                        <Text style={[styles.roleDescription, { color: theme.textSecondary }]}>
                            Gerar QR Code para o aluno escanear
                        </Text>
                        <View style={styles.roleAction}>
                            <Text style={[styles.roleActionText, !checkInStatus.available && { color: theme.textMuted }]}>
                                {checkInStatus.available ? 'Gerar QR Code' : 'Indisponível'}
                            </Text>
                            {checkInStatus.available && <Ionicons name="arrow-forward" size={16} color="#10b981" />}
                        </View>
                    </TouchableOpacity>
                ) : (
                    /* Student View */
                    <TouchableOpacity
                        style={[
                            styles.roleCard,
                            {
                                backgroundColor: theme.card,
                                borderColor: checkInStatus.available ? '#3b82f6' : theme.cardBorder,
                                opacity: checkInStatus.available ? 1 : 0.6
                            }
                        ]}
                        onPress={() => checkInStatus.available && router.push(`/connect/aula/${id}/scan`)}
                        activeOpacity={checkInStatus.available ? 0.9 : 1}
                        disabled={!checkInStatus.available}
                    >
                        <View style={[styles.recommendedBadge, { backgroundColor: checkInStatus.available ? '#dbeafe' : '#f3f4f6' }]}>
                            <Text style={[styles.recommendedText, { color: checkInStatus.available ? '#2563eb' : '#6b7280' }]}>Sua Ação</Text>
                        </View>
                        <LinearGradient
                            colors={checkInStatus.available ? ['#3b82f6', '#2563eb'] : ['#4b5563', '#6b7280']}
                            style={styles.roleIconBg}
                        >
                            <Ionicons name="scan" size={32} color="#fff" />
                        </LinearGradient>
                        <Text style={[styles.roleTitle, { color: theme.text }]}>Realizar Check-in</Text>
                        <Text style={[styles.roleDescription, { color: theme.textSecondary }]}>
                            Escanear QR Code do instrutor
                        </Text>
                        <View style={styles.roleAction}>
                            <Text style={[styles.roleActionText, { color: checkInStatus.available ? '#3b82f6' : theme.textMuted }]}>
                                {checkInStatus.available ? 'Abrir Câmera' : 'Indisponível'}
                            </Text>
                            {checkInStatus.available && <Ionicons name="arrow-forward" size={16} color="#3b82f6" />}
                        </View>
                    </TouchableOpacity>
                )}
            </View>

            {/* Help Text */}
            <View style={styles.helpContainer}>
                <Ionicons name="information-circle" size={18} color={theme.textMuted} />
                <Text style={[styles.helpText, { color: theme.textMuted }]}>
                    O check-in confirma a presença de ambos e finaliza a aula
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        color: '#1f2937',
        marginTop: 16,
    },
    backBtn: {
        marginTop: 20,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#e5e7eb',
        borderRadius: 12,
    },
    backBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#4b5563',
    },
    // Completed State
    completedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    completedIcon: {
        marginBottom: 20,
    },
    completedTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1f2937',
        marginBottom: 8,
    },
    completedSubtitle: {
        fontSize: 15,
        color: '#6b7280',
        marginBottom: 32,
    },
    doneButton: {
        backgroundColor: '#10b981',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 14,
    },
    doneButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    closeBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
    },
    // Lesson Card
    lessonCard: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginTop: 8,
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    lessonHeader: {
        marginBottom: 16,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: '#fef3c7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#f59e0b',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#d97706',
    },
    lessonInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {},
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 16,
    },
    avatarPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 16,
        backgroundColor: '#10b981',
        justifyContent: 'center',
        alignItems: 'center',
    },
    lessonDetails: {
        flex: 1,
        marginLeft: 14,
    },
    instructorName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 4,
    },
    lessonDate: {
        fontSize: 14,
        color: '#6b7280',
    },
    // Question
    questionText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1f2937',
        textAlign: 'center',
        marginTop: 32,
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    // Roles
    rolesContainer: {
        paddingHorizontal: 20,
        gap: 16,
        marginTop: 24,
    },
    roleCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
    },
    roleCardRecommended: {
        borderColor: '#10b981',
    },
    recommendedBadge: {
        position: 'absolute',
        top: -10,
        backgroundColor: '#10b981',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    recommendedText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    roleIconBg: {
        width: 64,
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    roleTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 4,
    },
    roleDescription: {
        fontSize: 13,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 12,
    },
    roleAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    roleActionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#10b981',
    },
    // Help
    helpContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 32,
        paddingHorizontal: 40,
    },
    helpText: {
        fontSize: 13,
        color: '#9ca3af',
        textAlign: 'center',
        flex: 1,
    },
    statusMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    statusMessageText: {
        fontSize: 13,
        fontWeight: '600',
        flex: 1,
    },
});
