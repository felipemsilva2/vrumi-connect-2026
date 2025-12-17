import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../src/lib/supabase';

interface Instructor {
    id: string;
    full_name: string;
    photo_url: string | null;
    city: string;
    state: string;
    price_per_lesson: number;
    price_instructor_car: number | null;
    price_student_car: number | null;
    lesson_duration_minutes: number;
    average_rating: number;
    total_reviews: number;
}

interface Availability {
    day_of_week: number;
    start_time: string;
    end_time: string;
}

interface ActivePackage {
    id: string;
    lessons_total: number;
    lessons_used: number;
    vehicle_type: string;
    instructor_id: string;
}

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function BookingScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { theme } = useTheme();
    const { user } = useAuth();
    const [instructor, setInstructor] = useState<Instructor | null>(null);
    const [availability, setAvailability] = useState<Availability[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [activePackage, setActivePackage] = useState<ActivePackage | null>(null);

    // Generate next 14 days
    const availableDates = Array.from({ length: 14 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i + 1);
        return date;
    });

    useEffect(() => {
        if (id) {
            fetchInstructorData();
            fetchActivePackage();
        }
    }, [id]);

    useEffect(() => {
        if (selectedDate && id) fetchBookedSlots(selectedDate);
    }, [selectedDate, id]);

    const fetchInstructorData = async () => {
        try {
            const { data: instructorData, error: instructorError } = await supabase
                .from('instructors')
                .select('id, full_name, photo_url, city, state, price_per_lesson, price_instructor_car, price_student_car, lesson_duration_minutes, average_rating, total_reviews')
                .eq('id', id)
                .single();

            if (instructorError) throw instructorError;
            setInstructor(instructorData);

            const { data: availabilityData } = await supabase
                .from('instructor_availability')
                .select('day_of_week, start_time, end_time')
                .eq('instructor_id', id);

            setAvailability(availabilityData || []);
        } catch (error) {
            console.error('Error fetching instructor:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchActivePackage = async () => {
        if (!user) return;
        try {
            const { data } = await supabase
                .from('student_packages')
                .select('id, lessons_total, lessons_used, vehicle_type, instructor_id')
                .eq('student_id', user.id)
                .eq('instructor_id', id)
                .eq('status', 'active')
                .single();
            if (data) setActivePackage(data as ActivePackage);
        } catch {
            setActivePackage(null);
        }
    };

    const fetchBookedSlots = async (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        const { data } = await supabase
            .from('bookings')
            .select('scheduled_time')
            .eq('instructor_id', id)
            .eq('scheduled_date', dateStr)
            .in('status', ['pending', 'confirmed']);
        setBookedSlots(data?.map(b => b.scheduled_time) || []);
    };

    const isDateAvailable = (date: Date): boolean => {
        const dayOfWeek = date.getDay();
        return availability.some(a => a.day_of_week === dayOfWeek);
    };

    const getAvailableTimeSlots = (date: Date): string[] => {
        const dayOfWeek = date.getDay();
        const daySlots = availability.filter(a => a.day_of_week === dayOfWeek);
        const slots: string[] = [];
        daySlots.forEach(slot => {
            const start = parseInt(slot.start_time.split(':')[0]);
            const end = parseInt(slot.end_time.split(':')[0]);
            for (let hour = start; hour < end; hour++) {
                const time = `${hour.toString().padStart(2, '0')}:00:00`;
                if (!bookedSlots.includes(time)) slots.push(time);
            }
        });
        return slots;
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
    };

    const getCurrentPrice = () => {
        if (!instructor) return 0;
        return instructor.price_instructor_car || instructor.price_per_lesson;
    };

    const handleConfirmBooking = async () => {
        if (!user || !instructor || !selectedDate || !selectedTime) return;

        setSubmitting(true);
        try {
            const isUsingPackage = activePackage && activePackage.instructor_id === instructor.id;
            const currentPrice = isUsingPackage ? 0 : getCurrentPrice();
            const platformFee = currentPrice * 0.15;
            const instructorAmount = currentPrice - platformFee;

            const { error: bookingError } = await supabase.from('bookings').insert({
                student_id: user.id,
                instructor_id: instructor.id,
                scheduled_date: selectedDate.toISOString().split('T')[0],
                scheduled_time: selectedTime,
                duration_minutes: instructor.lesson_duration_minutes,
                price: currentPrice,
                platform_fee: platformFee,
                instructor_amount: instructorAmount,
                status: 'confirmed',
                payment_status: isUsingPackage ? 'paid' : 'pending',
                vehicle_type: isUsingPackage ? activePackage.vehicle_type : 'instructor',
            });

            if (bookingError) throw bookingError;

            if (isUsingPackage && activePackage) {
                const newLessonsUsed = activePackage.lessons_used + 1;
                const isCompleted = newLessonsUsed >= activePackage.lessons_total;
                await supabase
                    .from('student_packages')
                    .update({
                        lessons_used: newLessonsUsed,
                        status: isCompleted ? 'completed' : 'active',
                        completed_at: isCompleted ? new Date().toISOString() : null,
                    })
                    .eq('id', activePackage.id);
            }

            const remainingCredits = activePackage ? activePackage.lessons_total - activePackage.lessons_used - 1 : 0;

            Alert.alert(
                'Aula Confirmada! 🎉',
                isUsingPackage
                    ? `Você usou 1 crédito do seu pacote. Restam ${remainingCredits} aulas.`
                    : 'Sua aula foi agendada com sucesso!',
                [{ text: 'OK', onPress: () => router.push('/(tabs)/aulas') }]
            );
        } catch (error) {
            console.error('Error booking:', error);
            Alert.alert('Erro', 'Não foi possível agendar a aula.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 100 }} />
            </SafeAreaView>
        );
    }

    if (!instructor) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <Text style={{ color: theme.text, textAlign: 'center', marginTop: 100 }}>
                    Instrutor não encontrado
                </Text>
            </SafeAreaView>
        );
    }

    const timeSlots = selectedDate ? getAvailableTimeSlots(selectedDate) : [];
    const canConfirm = selectedDate && selectedTime;

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
                <Text style={[styles.headerTitle, { color: theme.text }]}>Agendar Aula</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Instructor Card */}
                <View style={[styles.instructorCard, { backgroundColor: theme.card }]}>
                    <Image
                        source={{ uri: instructor.photo_url || 'https://via.placeholder.com/60' }}
                        style={styles.instructorPhoto}
                    />
                    <View style={styles.instructorInfo}>
                        <Text style={[styles.instructorName, { color: theme.text }]}>
                            {instructor.full_name}
                        </Text>
                        <View style={styles.ratingRow}>
                            <Ionicons name="star" size={14} color="#f59e0b" />
                            <Text style={[styles.ratingText, { color: theme.textMuted }]}>
                                {instructor.average_rating?.toFixed(1) || '5.0'} ({instructor.total_reviews || 0})
                            </Text>
                            <Text style={[styles.locationText, { color: theme.textMuted }]}>
                                • {instructor.city}, {instructor.state}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Package Banner */}
                {activePackage && (
                    <View style={[styles.packageBanner, { backgroundColor: '#dcfce7' }]}>
                        <Ionicons name="pricetag" size={20} color="#166534" />
                        <Text style={styles.packageText}>
                            Pacote ativo: {activePackage.lessons_total - activePackage.lessons_used} aulas restantes
                        </Text>
                    </View>
                )}

                {/* Date Selection */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>📅 Escolha a Data</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesScroll}>
                    {availableDates.map((date, index) => {
                        const isAvailable = isDateAvailable(date);
                        const isSelected = selectedDate?.toDateString() === date.toDateString();
                        return (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.dateChip,
                                    {
                                        backgroundColor: isSelected ? theme.primary : theme.card,
                                        borderColor: isSelected ? theme.primary : theme.cardBorder,
                                        opacity: isAvailable ? 1 : 0.4,
                                    }
                                ]}
                                onPress={() => isAvailable && setSelectedDate(date)}
                                disabled={!isAvailable}
                            >
                                <Text style={[styles.dateDay, { color: isSelected ? '#fff' : theme.textMuted }]}>
                                    {DAY_NAMES[date.getDay()]}
                                </Text>
                                <Text style={[styles.dateNumber, { color: isSelected ? '#fff' : theme.text }]}>
                                    {date.getDate()}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Time Selection */}
                {selectedDate && (
                    <>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>⏰ Horário</Text>
                        {timeSlots.length === 0 ? (
                            <Text style={[styles.noSlots, { color: theme.textMuted }]}>
                                Nenhum horário disponível nesta data
                            </Text>
                        ) : (
                            <View style={styles.timeSlotsGrid}>
                                {timeSlots.map((time) => {
                                    const isSelected = selectedTime === time;
                                    return (
                                        <TouchableOpacity
                                            key={time}
                                            style={[
                                                styles.timeSlot,
                                                {
                                                    backgroundColor: isSelected ? theme.primary : theme.card,
                                                    borderColor: isSelected ? theme.primary : theme.cardBorder,
                                                }
                                            ]}
                                            onPress={() => setSelectedTime(time)}
                                        >
                                            <Text style={[styles.timeText, { color: isSelected ? '#fff' : theme.text }]}>
                                                {time.substring(0, 5)}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    </>
                )}

                {/* Summary */}
                {canConfirm && (
                    <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
                        <Text style={[styles.summaryTitle, { color: theme.text }]}>Resumo</Text>
                        <View style={styles.summaryRow}>
                            <Text style={{ color: theme.textMuted }}>Data</Text>
                            <Text style={{ color: theme.text, fontWeight: '600' }}>
                                {selectedDate?.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
                            </Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={{ color: theme.textMuted }}>Horário</Text>
                            <Text style={{ color: theme.text, fontWeight: '600' }}>{selectedTime?.substring(0, 5)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={{ color: theme.textMuted }}>Duração</Text>
                            <Text style={{ color: theme.text, fontWeight: '600' }}>{instructor.lesson_duration_minutes} min</Text>
                        </View>
                        <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
                        <View style={styles.summaryRow}>
                            <Text style={[styles.priceLabel, { color: theme.text }]}>Total</Text>
                            <Text style={[styles.priceValue, { color: activePackage ? '#166534' : theme.primary }]}>
                                {activePackage ? 'GRÁTIS (Pacote)' : formatPrice(getCurrentPrice())}
                            </Text>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Fixed Footer */}
            <View style={[styles.footer, { backgroundColor: theme.background }]}>
                <TouchableOpacity
                    style={[
                        styles.confirmButton,
                        { backgroundColor: canConfirm ? theme.primary : theme.textMuted }
                    ]}
                    onPress={handleConfirmBooking}
                    disabled={!canConfirm || submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.confirmButtonText}>
                            {canConfirm ? 'Confirmar Aula' : 'Selecione data e horário'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
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
    headerTitle: { fontSize: 18, fontWeight: '700' },
    scrollView: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 100 },
    instructorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
    },
    instructorPhoto: { width: 56, height: 56, borderRadius: 28 },
    instructorInfo: { marginLeft: 14, flex: 1 },
    instructorName: { fontSize: 17, fontWeight: '600' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    ratingText: { fontSize: 13, marginLeft: 4 },
    locationText: { fontSize: 13, marginLeft: 6 },
    packageBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        gap: 10,
    },
    packageText: { color: '#166534', fontSize: 14, fontWeight: '600' },
    sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, marginTop: 8 },
    datesScroll: { marginBottom: 20 },
    dateChip: {
        width: 56,
        height: 72,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        borderWidth: 2,
    },
    dateDay: { fontSize: 12, fontWeight: '500' },
    dateNumber: { fontSize: 20, fontWeight: '700', marginTop: 4 },
    noSlots: { textAlign: 'center', fontStyle: 'italic', marginBottom: 20 },
    timeSlotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    timeSlot: {
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 2,
    },
    timeText: { fontSize: 15, fontWeight: '600' },
    summaryCard: { padding: 20, borderRadius: 16, marginTop: 8 },
    summaryTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    divider: { height: 1, marginVertical: 12 },
    priceLabel: { fontSize: 16, fontWeight: '600' },
    priceValue: { fontSize: 20, fontWeight: '700' },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 30 },
    confirmButton: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    confirmButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
