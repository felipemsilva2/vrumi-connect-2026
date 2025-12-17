import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';

// Configure Portuguese Locale
LocaleConfig.locales['pt-br'] = {
    monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
    monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    dayNames: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
    dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
    today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';

interface Booking {
    id: string;
    scheduled_date: string;
    scheduled_time: string;
    status: string;
    student: {
        full_name: string;
        photo_url: string | null;
        phone?: string;
    };
}

export default function InstructorAgendaScreen() {
    const { theme, isDark } = useTheme();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [markedDates, setMarkedDates] = useState<any>({});
    const [dayBookings, setDayBookings] = useState<Booking[]>([]);

    const fetchBookings = useCallback(async () => {
        if (!user?.id) return;

        try {
            // Get instructor ID
            const { data: instructor } = await supabase
                .from('instructors')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!instructor) {
                Alert.alert('Erro', 'Perfil não encontrado.');
                router.back();
                return;
            }

            // Fetch all bookings for this instructor
            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    id,
                    scheduled_date,
                    scheduled_time,
                    status,
                    student:profiles(full_name, avatar_url)
                `)
                .eq('instructor_id', instructor.id)
                .in('status', ['confirmed', 'pending', 'completed'])
                .order('scheduled_time');

            if (error) throw error;

            setBookings((data as any)
                ?.map((b: any) => ({
                    ...b,
                    status: b.status || 'pending',
                    student: Array.isArray(b.student) ? b.student[0] : b.student
                }))
                .filter((b: any) => b.student && b.student.full_name) || []);

            // Process for calendar dots
            const marks: any = {};
            data?.forEach((b: any) => {
                const date = b.scheduled_date;
                if (!marks[date]) {
                    marks[date] = { marked: true, dotColor: theme.primary };
                }
            });

            // Highlight selected date
            marks[selectedDate] = {
                ...(marks[selectedDate] || {}),
                selected: true,
                selectedColor: theme.primary
            };

            setMarkedDates(marks);

            const processedBookings = (data as any)
                ?.map((b: any) => ({
                    ...b,
                    status: b.status || 'pending',
                    student: Array.isArray(b.student) ? b.student[0] : b.student
                }))
                .filter((b: any) => b.student && b.student.full_name) || [];

            updateDayBookings(selectedDate, processedBookings);

        } catch (error) {
            console.error('Error fetching bookings:', error);
            Alert.alert('Erro', 'Não foi possível carregar a agenda.');
        } finally {
            setLoading(false);
        }
    }, [user?.id, selectedDate, theme.primary]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const updateDayBookings = (date: string, allBookings: Booking[]) => {
        const filtered = allBookings.filter(b => b.scheduled_date === date);
        setDayBookings(filtered);
    };

    const handleDayPress = (day: any) => {
        const date = day.dateString;
        setSelectedDate(date);

        // Update marks to move selection
        const newMarks = { ...markedDates };
        // Remove selection from previous
        Object.keys(newMarks).forEach(key => {
            if (newMarks[key].selected) {
                delete newMarks[key].selected;
                delete newMarks[key].selectedColor;
            }
        });
        // Add to new
        newMarks[date] = {
            ...(newMarks[date] || {}),
            selected: true,
            selectedColor: theme.primary
        };
        setMarkedDates(newMarks);

        updateDayBookings(date, bookings);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return '#10b981';
            case 'pending': return '#f59e0b';
            case 'completed': return '#3b82f6';
            default: return '#9ca3af';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'confirmed': return 'Confirmada';
            case 'pending': return 'Pendente';
            case 'completed': return 'Concluída';
            default: return status;
        }
    };

    const formatDate = (dateStr: string) => {
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}`;
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
                <Text style={[styles.headerTitle, { color: theme.text }]}>Minha Agenda</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={[styles.calendarContainer, { backgroundColor: theme.card }]}>
                    <Calendar
                        current={selectedDate}
                        onDayPress={handleDayPress}
                        markedDates={markedDates}
                        theme={{
                            backgroundColor: theme.card,
                            calendarBackground: theme.card,
                            textSectionTitleColor: theme.textSecondary,
                            selectedDayBackgroundColor: theme.primary,
                            selectedDayTextColor: '#ffffff',
                            todayTextColor: theme.primary,
                            dayTextColor: theme.text,
                            textDisabledColor: theme.textMuted,
                            dotColor: theme.primary,
                            selectedDotColor: '#ffffff',
                            arrowColor: theme.primary,
                            monthTextColor: theme.text,
                            indicatorColor: theme.primary,
                        }}
                    />
                </View>

                <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    Aulas em {formatDate(selectedDate)}
                </Text>

                {dayBookings.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="calendar-outline" size={48} color={theme.textMuted} />
                        <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                            Nenhuma aula neste dia.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.bookingList}>
                        {dayBookings.map((param) => ( // Using param to avoid conflict/shadowing if any
                            <TouchableOpacity
                                key={param.id}
                                style={[styles.bookingCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}
                                onPress={() => router.push(`/connect/aula/${param.id}`)}
                            >
                                <View style={styles.bookingLeft}>
                                    <Text style={[styles.bookingTime, { color: theme.text }]}>
                                        {param.scheduled_time.substring(0, 5)}
                                    </Text>
                                    <View style={[styles.verticalLine, { backgroundColor: getStatusColor(param.status) }]} />
                                </View>

                                <View style={styles.bookingContent}>
                                    <View style={styles.studentRow}>
                                        {param.student.photo_url ? ( // Assuming avatar_url is mapped to photo_url in type or query
                                            <Image source={{ uri: param.student.photo_url }} style={styles.avatar} />
                                        ) : (
                                            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
                                                <Text style={styles.avatarInitial}>
                                                    {param.student.full_name.charAt(0)}
                                                </Text>
                                            </View>
                                        )}
                                        <View>
                                            <Text style={[styles.studentName, { color: theme.text }]}>
                                                {param.student.full_name}
                                            </Text>
                                            <Text style={[styles.statusText, { color: getStatusColor(param.status) }]}>
                                                {getStatusLabel(param.status)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <View style={{ height: 40 }} />
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    calendarContainer: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        marginBottom: 20,
    },
    divider: {
        height: 1,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
        gap: 12,
    },
    emptyText: {
        fontSize: 14,
    },
    bookingList: {
        gap: 12,
    },
    bookingCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    bookingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
        height: '100%',
    },
    bookingTime: {
        fontSize: 16,
        fontWeight: '700',
        marginRight: 12,
        width: 45,
    },
    verticalLine: {
        width: 4,
        borderRadius: 2,
        height: 40,
    },
    bookingContent: {
        flex: 1,
    },
    studentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    studentName: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
    },
});
