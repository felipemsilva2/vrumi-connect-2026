import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
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
const DAY_FULL_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function BookingScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { theme, isDark } = useTheme();
    const { user } = useAuth();
    const [instructor, setInstructor] = useState<Instructor | null>(null);
    const [availability, setAvailability] = useState<Availability[]>([]);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1); // 1: Date, 2: Time, 3: Confirm
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [vehicleType, setVehicleType] = useState<'instructor' | 'student'>('instructor');
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
                .select('id, full_name, photo_url, city, state, price_per_lesson, price_instructor_car, price_student_car, lesson_duration_minutes')
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

            if (data) {
                setActivePackage(data as ActivePackage);
                // Auto-select vehicle type from package
                setVehicleType(data.vehicle_type as 'instructor' | 'student');
            }
        } catch (error) {
            // No active package - that's fine
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
        const dayAvailability = availability.filter(a => a.day_of_week === dayOfWeek);
        const slots: string[] = [];

        dayAvailability.forEach(a => {
            const [startHour] = a.start_time.split(':').map(Number);
            const [endHour] = a.end_time.split(':').map(Number);

            for (let hour = startHour; hour < endHour; hour++) {
                const timeStr = `${hour.toString().padStart(2, '0')}:00:00`;
                if (!bookedSlots.includes(timeStr)) {
                    slots.push(timeStr);
                }
            }
        });

        return slots;
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(price);
    };

    const formatTime = (time: string) => time.substring(0, 5);

    // Get price based on selected vehicle type
    const getCurrentPrice = () => {
        if (!instructor) return 0;
        if (vehicleType === 'student' && instructor.price_student_car) {
            return instructor.price_student_car;
        }
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

            // Create booking
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
                vehicle_type: isUsingPackage ? activePackage.vehicle_type : vehicleType,
            });

            if (bookingError) throw bookingError;

            // If using package, increment lessons_used
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

            const remainingCredits = activePackage
                ? activePackage.lessons_total - activePackage.lessons_used - 1
                : 0;

            Alert.alert(
                'Aula Confirmada! 🎉',
                isUsingPackage
                    ? `Você usou 1 crédito do seu pacote. Restam ${remainingCredits} aulas.`
                    : 'Sua aula foi agendada e confirmada automaticamente!',
                [{ text: 'OK', onPress: () => router.push('/(tabs)/aulas') }]
            );
        } catch (error) {
            console.error('Error booking:', error);
            Alert.alert('Erro', 'Não foi possível agendar a aula. Tente novamente.');
        } finally {
            setSubmitting(false);
        }
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

    if (!instructor) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <Text style={{ color: theme.text }}>Instrutor não encontrado</Text>
                </View>
            </SafeAreaView>
        );
    }

    const timeSlots = selectedDate ? getAvailableTimeSlots(selectedDate) : [];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: theme.card }]}
                    onPress={() => step > 1 ? setStep(step - 1) : router.back()}
                >
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Agendar Aula</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
                        Etapa {step} de 3
                    </Text>
                </View>
                <View style={{ width: 44 }} />
            </View>

            {/* Progress */}
            <View style={styles.progressContainer}>
                {[1, 2, 3].map((s) => (
                    <View
                        key={s}
                        style={[
                            styles.progressDot,
                            { backgroundColor: s <= step ? theme.primary : theme.cardBorder }
                        ]}
                    />
                ))}
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Step 1: Select Date */}
                {step === 1 && (
                    <View>
                        <Text style={[styles.stepTitle, { color: theme.text }]}>
                            Escolha uma Data
                        </Text>
                        <Text style={[styles.stepSubtitle, { color: theme.textMuted }]}>
                            Selecione o dia para sua aula
                        </Text>

                        <View style={styles.datesGrid}>
                            {availableDates.map((date, index) => {
                                const isAvailable = isDateAvailable(date);
                                const isSelected = selectedDate?.toDateString() === date.toDateString();

                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.dateCard,
                                            {
                                                backgroundColor: isSelected ? theme.primary : theme.card,
                                                opacity: isAvailable ? 1 : 0.4,
                                            }
                                        ]}
                                        onPress={() => isAvailable && setSelectedDate(date)}
                                        disabled={!isAvailable}
                                    >
                                        <Text style={[
                                            styles.dateDay,
                                            { color: isSelected ? '#fff' : theme.textMuted }
                                        ]}>
                                            {DAY_NAMES[date.getDay()]}
                                        </Text>
                                        <Text style={[
                                            styles.dateNumber,
                                            { color: isSelected ? '#fff' : theme.text }
                                        ]}>
                                            {date.getDate()}
                                        </Text>
                                        <Text style={[
                                            styles.dateMonth,
                                            { color: isSelected ? '#fff' : theme.textMuted }
                                        ]}>
                                            {date.toLocaleDateString('pt-BR', { month: 'short' })}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {selectedDate && (
                            <TouchableOpacity
                                style={[styles.nextButton, { backgroundColor: theme.primary }]}
                                onPress={() => setStep(2)}
                            >
                                <Text style={styles.nextButtonText}>Escolher Horário</Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" />
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Step 2: Select Time */}
                {step === 2 && (
                    <View>
                        <Text style={[styles.stepTitle, { color: theme.text }]}>
                            Escolha um Horário
                        </Text>
                        <Text style={[styles.stepSubtitle, { color: theme.textMuted }]}>
                            {selectedDate && DAY_FULL_NAMES[selectedDate.getDay()]}, {selectedDate?.toLocaleDateString('pt-BR')}
                        </Text>

                        {timeSlots.length === 0 ? (
                            <View style={[styles.noSlotsCard, { backgroundColor: theme.card }]}>
                                <Ionicons name="calendar-outline" size={40} color={theme.textMuted} />
                                <Text style={[styles.noSlotsText, { color: theme.textMuted }]}>
                                    Não há horários disponíveis para esta data
                                </Text>
                            </View>
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
                                            <Ionicons
                                                name="time-outline"
                                                size={18}
                                                color={isSelected ? '#fff' : theme.textMuted}
                                            />
                                            <Text style={[
                                                styles.timeSlotText,
                                                { color: isSelected ? '#fff' : theme.text }
                                            ]}>
                                                {formatTime(time)}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}

                        {selectedTime && (
                            <TouchableOpacity
                                style={[styles.nextButton, { backgroundColor: theme.primary }]}
                                onPress={() => setStep(3)}
                            >
                                <Text style={styles.nextButtonText}>Revisar Agendamento</Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" />
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Step 3: Confirm */}
                {step === 3 && (
                    <View>
                        <Text style={[styles.stepTitle, { color: theme.text }]}>
                            Confirmar Agendamento
                        </Text>
                        <Text style={[styles.stepSubtitle, { color: theme.textMuted }]}>
                            Revise os detalhes da sua aula
                        </Text>

                        <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
                            <View style={styles.summaryRow}>
                                <Ionicons name="person-outline" size={20} color={theme.primary} />
                                <View style={styles.summaryInfo}>
                                    <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Instrutor</Text>
                                    <Text style={[styles.summaryValue, { color: theme.text }]}>
                                        {instructor.full_name}
                                    </Text>
                                </View>
                            </View>

                            <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

                            <View style={styles.summaryRow}>
                                <Ionicons name="calendar-outline" size={20} color={theme.primary} />
                                <View style={styles.summaryInfo}>
                                    <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Data</Text>
                                    <Text style={[styles.summaryValue, { color: theme.text }]}>
                                        {selectedDate?.toLocaleDateString('pt-BR', {
                                            weekday: 'long',
                                            day: 'numeric',
                                            month: 'long'
                                        })}
                                    </Text>
                                </View>
                            </View>

                            <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

                            <View style={styles.summaryRow}>
                                <Ionicons name="time-outline" size={20} color={theme.primary} />
                                <View style={styles.summaryInfo}>
                                    <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Horário</Text>
                                    <Text style={[styles.summaryValue, { color: theme.text }]}>
                                        {selectedTime && formatTime(selectedTime)} ({instructor.lesson_duration_minutes}min)
                                    </Text>
                                </View>
                            </View>

                            <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

                            <View style={styles.summaryRow}>
                                <Ionicons name="location-outline" size={20} color={theme.primary} />
                                <View style={styles.summaryInfo}>
                                    <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Local</Text>
                                    <Text style={[styles.summaryValue, { color: theme.text }]}>
                                        {instructor.city}, {instructor.state}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Vehicle Selection */}
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            Tipo de Veículo
                        </Text>

                        <TouchableOpacity
                            style={[
                                styles.vehicleCard,
                                {
                                    backgroundColor: vehicleType === 'instructor' ? theme.primaryLight : theme.card,
                                    borderColor: vehicleType === 'instructor' ? theme.primary : theme.cardBorder,
                                }
                            ]}
                            onPress={() => setVehicleType('instructor')}
                            activeOpacity={0.7}
                        >
                            <View style={[
                                styles.radioOuter,
                                { borderColor: vehicleType === 'instructor' ? theme.primary : theme.textMuted }
                            ]}>
                                {vehicleType === 'instructor' && (
                                    <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />
                                )}
                            </View>
                            <View style={styles.vehicleInfo}>
                                <Text style={[styles.vehicleTitle, { color: theme.text }]}>
                                    Carro do Instrutor
                                </Text>
                                <Text style={[styles.vehicleSubtitle, { color: theme.textMuted }]}>
                                    Veículo incluso no preço
                                </Text>
                            </View>
                            <Ionicons name="car-sport" size={24} color={theme.primary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.vehicleCard,
                                {
                                    backgroundColor: vehicleType === 'student' ? theme.primaryLight : theme.card,
                                    borderColor: vehicleType === 'student' ? theme.primary : theme.cardBorder,
                                }
                            ]}
                            onPress={() => setVehicleType('student')}
                            activeOpacity={0.7}
                        >
                            <View style={[
                                styles.radioOuter,
                                { borderColor: vehicleType === 'student' ? theme.primary : theme.textMuted }
                            ]}>
                                {vehicleType === 'student' && (
                                    <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />
                                )}
                            </View>
                            <View style={styles.vehicleInfo}>
                                <Text style={[styles.vehicleTitle, { color: theme.text }]}>
                                    Meu Próprio Carro
                                </Text>
                                <Text style={[styles.vehicleSubtitle, { color: theme.textMuted }]}>
                                    Traga seu veículo
                                </Text>
                            </View>
                            <Ionicons name="key" size={24} color={theme.primary} />
                        </TouchableOpacity>

                        {/* Package Credit Banner */}
                        {activePackage && activePackage.instructor_id === instructor.id && (
                            <View style={[styles.packageBanner, { backgroundColor: '#dcfce7' }]}>
                                <Ionicons name="pricetag" size={20} color="#166534" />
                                <View style={styles.packageBannerInfo}>
                                    <Text style={styles.packageBannerTitle}>Usando Crédito do Pacote</Text>
                                    <Text style={styles.packageBannerSubtitle}>
                                        Restam {activePackage.lessons_total - activePackage.lessons_used} de {activePackage.lessons_total} aulas
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Price Card */}
                        <View style={[
                            styles.priceCard,
                            { backgroundColor: activePackage ? '#dcfce7' : theme.primaryLight }
                        ]}>
                            <Text style={[
                                styles.priceLabel,
                                { color: activePackage ? '#166534' : theme.primary }
                            ]}>
                                {activePackage ? 'Usando Pacote' : 'Valor da Aula'}
                            </Text>
                            <Text style={[
                                styles.priceValue,
                                { color: activePackage ? '#166534' : theme.primary }
                            ]}>
                                {activePackage ? 'GRÁTIS' : formatPrice(getCurrentPrice())}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.confirmButton,
                                { backgroundColor: theme.primary },
                                submitting && { opacity: 0.7 }
                            ]}
                            onPress={handleConfirmBooking}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={22} color="#fff" />
                                    <Text style={styles.confirmButtonText}>Confirmar Agendamento</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
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
    // Header
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
    headerCenter: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    headerSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    // Progress
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 20,
    },
    progressDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    // Scroll
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    // Steps
    stepTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 8,
    },
    stepSubtitle: {
        fontSize: 14,
        marginBottom: 24,
    },
    // Dates
    datesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 24,
    },
    dateCard: {
        width: 70,
        paddingVertical: 12,
        borderRadius: 14,
        alignItems: 'center',
    },
    dateDay: {
        fontSize: 11,
        marginBottom: 4,
    },
    dateNumber: {
        fontSize: 20,
        fontWeight: '700',
    },
    dateMonth: {
        fontSize: 11,
        marginTop: 2,
    },
    // Time Slots
    noSlotsCard: {
        padding: 40,
        borderRadius: 16,
        alignItems: 'center',
        gap: 12,
    },
    noSlotsText: {
        fontSize: 14,
        textAlign: 'center',
    },
    timeSlotsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 24,
    },
    timeSlot: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
    },
    timeSlotText: {
        fontSize: 15,
        fontWeight: '600',
    },
    // Buttons
    nextButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
        borderRadius: 14,
        marginTop: 8,
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    // Summary
    summaryCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    summaryInfo: {
        flex: 1,
    },
    summaryLabel: {
        fontSize: 12,
        marginBottom: 2,
    },
    summaryValue: {
        fontSize: 15,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        marginVertical: 14,
    },
    // Price
    priceCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderRadius: 16,
        marginBottom: 24,
    },
    priceLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    priceValue: {
        fontSize: 24,
        fontWeight: '700',
    },
    // Confirm Button
    confirmButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 18,
        borderRadius: 16,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    // Vehicle Selection
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 20,
        marginBottom: 12,
    },
    vehicleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 14,
        borderWidth: 2,
        marginBottom: 12,
        gap: 14,
    },
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    vehicleInfo: {
        flex: 1,
    },
    vehicleTitle: {
        fontSize: 15,
        fontWeight: '600',
    },
    vehicleSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    // Package Banner
    packageBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        marginBottom: 16,
        gap: 12,
    },
    packageBannerInfo: {
        flex: 1,
    },
    packageBannerTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#166534',
    },
    packageBannerSubtitle: {
        fontSize: 12,
        color: '#15803d',
        marginTop: 2,
    },
});
