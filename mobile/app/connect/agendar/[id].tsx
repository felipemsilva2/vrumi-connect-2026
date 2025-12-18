import { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Image,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../src/lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
    average_rating: number | null;
    total_reviews: number | null;
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
const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function BookingScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { theme } = useTheme();
    const { user } = useAuth();

    const [instructor, setInstructor] = useState<Instructor | null>(null);
    const [availability, setAvailability] = useState<Availability[]>([]);
    const [activePackage, setActivePackage] = useState<ActivePackage | null>(null);
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    // Generate dates for the next 14 days
    const availableDates = useMemo(() => {
        const dates = [];
        for (let i = 0; i < 14; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            dates.push(date);
        }
        return dates;
    }, []);

    useEffect(() => {
        if (id) {
            fetchInstructorData();
            fetchActivePackage();
        }
    }, [id]);

    useEffect(() => {
        if (selectedDate) {
            fetchBookedSlots(selectedDate);
            setSelectedTime(null);
        }
    }, [selectedDate]);

    const fetchInstructorData = async () => {
        try {
            const { data: instructorData, error: instructorError } = await supabase
                .from('instructors')
                .select('*')
                .eq('id', id)
                .single();

            if (instructorError) throw instructorError;
            setInstructor(instructorData as unknown as Instructor);

            const { data: availData } = await supabase
                .from('instructor_availability')
                .select('*')
                .eq('instructor_id', id);

            setAvailability(availData || []);
        } catch (error) {
            console.error('Error fetching instructor:', error);
            Alert.alert('Erro', 'Não foi possível carregar os dados do instrutor');
        } finally {
            setLoading(false);
        }
    };

    const fetchActivePackage = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('student_packages')
                .select('id, lessons_total, lessons_used, vehicle_type, instructor_id')
                .eq('student_id', user.id)
                .eq('instructor_id', id)
                .eq('status', 'active')
                .single();

            if (data) setActivePackage(data as unknown as ActivePackage);
        } catch (error) {
            console.error('Error fetching package:', error);
        }
    };

    const fetchBookedSlots = async (date: Date) => {
        const dateString = date.toISOString().split('T')[0];
        try {
            const { data } = await supabase
                .from('bookings')
                .select('scheduled_time')
                .eq('instructor_id', id)
                .eq('scheduled_date', dateString)
                .not('status', 'eq', 'cancelled');

            setBookedSlots(data?.map(b => b.scheduled_time) || []);
        } catch (error) {
            console.error('Error fetching booked slots:', error);
        }
    };

    const isDateAvailable = (date: Date) => {
        const dayOfWeek = date.getDay();
        return availability.some(a => a.day_of_week === dayOfWeek);
    };

    const getAvailableTimeSlots = (date: Date) => {
        const dayOfWeek = date.getDay();
        const dayAvail = availability.filter(a => a.day_of_week === dayOfWeek);
        const slots: string[] = [];

        dayAvail.forEach(avail => {
            const startHour = parseInt(avail.start_time.split(':')[0]);
            const endHour = parseInt(avail.end_time.split(':')[0]);

            for (let h = startHour; h < endHour; h++) {
                const time = `${h.toString().padStart(2, '0')}:00:00`;
                // Check if slot is already booked
                if (!bookedSlots.includes(time)) {
                    // Check if slot is in the future if date is today
                    if (date.toDateString() === new Date().toDateString()) {
                        const currentHour = new Date().getHours();
                        if (h > currentHour) slots.push(time);
                    } else {
                        slots.push(time);
                    }
                }
            }
        });

        return slots.sort();
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(price);
    };

    const getCurrentPrice = () => {
        if (!instructor) return 0;
        return instructor.price_per_lesson;
    };

    const handleConfirmBooking = async () => {
        if (!user || !instructor || !selectedDate || !selectedTime) return;

        setSubmitting(true);
        try {
            const dateString = selectedDate.toISOString().split('T')[0];
            const price = activePackage ? 0 : getCurrentPrice();

            // Calculate fees (15% platform fee)
            const platformFee = price * 0.15;
            const instructorAmount = price - platformFee;

            const { data, error } = await supabase
                .from('bookings')
                .insert({
                    student_id: user.id,
                    instructor_id: instructor.id,
                    scheduled_date: dateString,
                    scheduled_time: selectedTime,
                    duration_minutes: instructor.lesson_duration_minutes || 50,
                    vehicle_type: activePackage?.vehicle_type || 'instructor',
                    price: price,
                    platform_fee: platformFee,
                    instructor_amount: instructorAmount,
                    status: 'pending',
                    payment_status: activePackage ? 'paid' : 'pending',
                    use_package_id: activePackage?.id || null,
                })
                .select()
                .single();

            if (error) throw error;

            // If using package, increment used count
            if (activePackage) {
                const { error: pkgError } = await supabase
                    .from('student_packages')
                    .update({ lessons_used: activePackage.lessons_used + 1 })
                    .eq('id', activePackage.id);

                if (pkgError) console.error('Error updating package:', pkgError);
            }

            Alert.alert(
                'Sucesso! 🚗',
                'Sua aula foi agendada. Você receberá uma notificação quando o instrutor confirmar.',
                [{ text: 'Ver Minhas Aulas', onPress: () => router.push('/(tabs)/aulas') }]
            );
        } catch (error) {
            console.error('Booking error:', error);
            Alert.alert('Erro', 'Não foi possível realizar o agendamento');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (!instructor) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.loadingContainer}>
                    <Ionicons name="alert-circle-outline" size={48} color={theme.textMuted} />
                    <Text style={{ color: theme.text, textAlign: 'center', marginTop: 16 }}>
                        Instrutor não encontrado
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    const timeSlots = selectedDate ? getAvailableTimeSlots(selectedDate) : [];
    const morningSlots = timeSlots.filter(t => parseInt(t.split(':')[0]) < 12);
    const afternoonSlots = timeSlots.filter(t => parseInt(t.split(':')[0]) >= 12 && parseInt(t.split(':')[0]) < 18);
    const nightSlots = timeSlots.filter(t => parseInt(t.split(':')[0]) >= 18);

    const canConfirm = selectedDate && selectedTime;

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                {/* Compact Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={[styles.backButton, { backgroundColor: theme.card }]}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={22} color={theme.text} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={[styles.headerTitle, { color: theme.text }]}>Agendar Aula</Text>
                        <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>Com {instructor.full_name.split(' ')[0]}</Text>
                    </View>
                    <Image
                        source={{ uri: instructor.photo_url || 'https://via.placeholder.com/40' }}
                        style={styles.instructorMiniPhoto}
                    />
                </View>

                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Active Package Banner */}
                    {activePackage && (
                        <View style={[styles.packageBannerPremium, { backgroundColor: theme.primaryLight }]}>
                            <View style={[styles.packageIconBox, { backgroundColor: theme.primary }]}>
                                <Ionicons name="pricetag" size={20} color="#fff" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.packageLabel, { color: theme.primary }]}>Plano de Aulas Ativo</Text>
                                <Text style={[styles.packageValue, { color: theme.text }]}>
                                    {activePackage.lessons_total - activePackage.lessons_used} aulas restantes disponíveis
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Date Selector Smart */}
                    <View style={styles.sectionMargin}>
                        <Text style={[styles.sectionTitlePremium, { color: theme.text }]}>Data da aula</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesScrollAlt}>
                            {availableDates.map((date, index) => {
                                const isAvailable = isDateAvailable(date);
                                const isSelected = selectedDate?.toDateString() === date.toDateString();
                                const isToday = date.toDateString() === new Date().toDateString();
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.dateChipAlt,
                                            {
                                                backgroundColor: isSelected ? theme.primary : theme.card,
                                                borderColor: isSelected ? theme.primary : theme.cardBorder,
                                                opacity: isAvailable ? 1 : 0.4,
                                            }
                                        ]}
                                        onPress={() => isAvailable && setSelectedDate(date)}
                                        disabled={!isAvailable}
                                    >
                                        <Text style={[styles.dateMonthAlt, { color: isSelected ? 'rgba(255,255,255,0.8)' : theme.textMuted }]}>
                                            {MONTH_NAMES[date.getMonth()]}
                                        </Text>
                                        <Text style={[styles.dateNumberAlt, { color: isSelected ? '#fff' : theme.text }]}>
                                            {date.getDate()}
                                        </Text>
                                        <Text style={[styles.dateDayAlt, { color: isSelected ? '#fff' : theme.textMuted }]}>
                                            {isToday ? 'Hoje' : DAY_NAMES[date.getDay()]}
                                        </Text>
                                        {isSelected && <View style={styles.selectedDot} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>

                    {/* Time Selection by Period */}
                    {selectedDate && (
                        <View style={styles.sectionMargin}>
                            <Text style={[styles.sectionTitlePremium, { color: theme.text }]}>Escolha o melhor horário</Text>

                            {timeSlots.length === 0 ? (
                                <View style={[styles.emptySlotsBox, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                                    <Ionicons name="calendar-outline" size={32} color={theme.textMuted} />
                                    <Text style={[styles.noSlotsText, { color: theme.textMuted }]}>
                                        Sem horários para este dia. Tente outra data.
                                    </Text>
                                </View>
                            ) : (
                                <>
                                    {morningSlots.length > 0 && (
                                        <PeriodSection title="Manhã" icon="sunny-outline" slots={morningSlots} selected={selectedTime} onSelect={setSelectedTime} theme={theme} />
                                    )}
                                    {afternoonSlots.length > 0 && (
                                        <PeriodSection title="Tarde" icon="partly-sunny-outline" slots={afternoonSlots} selected={selectedTime} onSelect={setSelectedTime} theme={theme} />
                                    )}
                                    {nightSlots.length > 0 && (
                                        <PeriodSection title="Noite" icon="moon-outline" slots={nightSlots} selected={selectedTime} onSelect={setSelectedTime} theme={theme} />
                                    )}
                                </>
                            )}
                        </View>
                    )}

                    <View style={{ height: 120 }} />
                </ScrollView>

                {/* Smart Footer Action Button */}
                <View style={[styles.footerAlt, { backgroundColor: theme.background, borderTopColor: theme.cardBorder }]}>
                    <View style={styles.footerInfoBox}>
                        {canConfirm ? (
                            <View>
                                <Text style={[styles.footerSummaryText, { color: theme.textMuted }]}>
                                    {selectedDate?.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} • {selectedTime?.substring(0, 5)}
                                </Text>
                                <Text style={[styles.footerPriceText, { color: theme.text }]}>
                                    {activePackage ? 'Usar Pacote' : formatPrice(instructor.price_per_lesson)}
                                </Text>
                            </View>
                        ) : (
                            <Text style={[styles.selectPrompt, { color: theme.textMuted }]}>
                                Selecione data e hora
                            </Text>
                        )}
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.smartConfirmBtn,
                            { backgroundColor: canConfirm ? theme.primary : theme.cardBorder }
                        ]}
                        onPress={handleConfirmBooking}
                        disabled={!canConfirm || submitting}
                        activeOpacity={0.8}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={[styles.smartConfirmBtnText, { color: canConfirm ? '#fff' : theme.textMuted }]}>
                                {canConfirm ? 'Agendar' : 'Aguardando'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

function PeriodSection({ title, icon, slots, selected, onSelect, theme }: any) {
    return (
        <View style={styles.periodContainer}>
            <View style={styles.periodHeader}>
                <Ionicons name={icon} size={18} color={theme.primary} />
                <Text style={[styles.periodTitle, { color: theme.textSecondary }]}>{title}</Text>
            </View>
            <View style={styles.slotsGridAlt}>
                {slots.map((time: string) => {
                    const isSelected = selected === time;
                    return (
                        <TouchableOpacity
                            key={time}
                            style={[
                                styles.slotChipAlt,
                                {
                                    backgroundColor: isSelected ? theme.primary : theme.card,
                                    borderColor: isSelected ? theme.primary : theme.cardBorder,
                                }
                            ]}
                            onPress={() => onSelect(time)}
                        >
                            <Text style={[styles.slotTextAlt, { color: isSelected ? '#fff' : theme.text }]}>
                                {time.substring(0, 5)}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Header
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 12 },
    backButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    headerTitleContainer: { flex: 1 },
    headerTitle: { fontSize: 18, fontWeight: '800' },
    headerSubtitle: { fontSize: 13, fontWeight: '600', marginTop: 1 },
    instructorMiniPhoto: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eee' },

    // Scroll
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 10 },

    // Package Banner
    packageBannerPremium: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, gap: 16, marginBottom: 8 },
    packageIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    packageLabel: { fontSize: 13, fontWeight: '800', marginBottom: 2 },
    packageValue: { fontSize: 14, fontWeight: '600' },

    // Sections
    sectionMargin: { marginTop: 24 },
    sectionTitlePremium: { fontSize: 18, fontWeight: '800', marginBottom: 16 },

    // Date Chips
    datesScrollAlt: { marginHorizontal: -20, paddingHorizontal: 20 },
    dateChipAlt: { width: 85, height: 110, borderRadius: 20, padding: 12, marginRight: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
    dateMonthAlt: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginBottom: 4 },
    dateNumberAlt: { fontSize: 24, fontWeight: '800', marginBottom: 2 },
    dateDayAlt: { fontSize: 13, fontWeight: '600' },
    selectedDot: { position: 'absolute', bottom: 10, width: 4, height: 4, borderRadius: 2, backgroundColor: '#fff' },

    // Time Slots
    emptySlotsBox: { padding: 32, borderRadius: 20, borderWidth: 1, alignItems: 'center', gap: 12, borderStyle: 'dashed' },
    noSlotsText: { fontSize: 15, textAlign: 'center', fontWeight: '500' },
    periodContainer: { marginTop: 24 },
    periodHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    periodTitle: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase' },
    slotsGridAlt: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    slotChipAlt: { width: (SCREEN_WIDTH - 60) / 3, height: 48, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    slotTextAlt: { fontSize: 15, fontWeight: '700' },

    // Smart Footer
    footerAlt: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 20, borderTopWidth: 1, gap: 16 },
    footerInfoBox: { flex: 1 },
    footerSummaryText: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
    footerPriceText: { fontSize: 24, fontWeight: '800' },
    selectPrompt: { fontSize: 15, fontWeight: '600' },
    smartConfirmBtn: { flex: 1.2, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    smartConfirmBtnText: { fontSize: 18, fontWeight: '800' },
});
