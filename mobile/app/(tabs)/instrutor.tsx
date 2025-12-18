import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';

interface Stats {
    totalEarnings: number;
    todayLessons: number;
    totalLessons: number;
    rating: number;
}

interface NextLesson {
    id: string;
    student_id: string; // Added student ID
    student_name: string;
    scheduled_date: string;
    scheduled_time: string;
    price: number;
    isToday: boolean;
    unread_messages?: number;
    chat_room_id?: string;
}

export default function InstrutorTab() {
    const { theme, isDark } = useTheme();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [instructorId, setInstructorId] = useState<string | null>(null);
    const [stats, setStats] = useState<Stats>({ totalEarnings: 0, todayLessons: 0, totalLessons: 0, rating: 0 });
    const [nextLesson, setNextLesson] = useState<NextLesson | null>(null);

    const fetchData = useCallback(async () => {
        if (!user?.id) return;

        try {
            // Get instructor
            const { data: instructor, error } = await supabase
                .from('instructors')
                .select('id, total_lessons, average_rating')
                .eq('user_id', user.id)
                .single();

            if (error || !instructor) {
                router.replace('/connect/cadastro-instrutor');
                return;
            }
            setInstructorId(instructor.id);

            const today = new Date().toISOString().split('T')[0];

            // Get earnings
            const { data: completedBookings } = await supabase
                .from('bookings')
                .select('price')
                .eq('instructor_id', instructor.id)
                .eq('status', 'completed');

            const totalEarnings = completedBookings?.reduce((acc, b) => acc + (b.price * 0.85), 0) || 0;

            // Get today's lessons count
            const { count: todayCount } = await supabase
                .from('bookings')
                .select('id', { count: 'exact', head: true })
                .eq('instructor_id', instructor.id)
                .eq('scheduled_date', today)
                .in('status', ['confirmed', 'pending']);

            // Get next lesson
            const { data: upcomingBookings } = await supabase
                .from('bookings')
                .select(`id, scheduled_date, scheduled_time, price, student:profiles(full_name)`)
                .eq('instructor_id', instructor.id)
                .gte('scheduled_date', today)
                .in('status', ['confirmed', 'pending'])
                .order('scheduled_date', { ascending: true })
                .order('scheduled_time', { ascending: true })
                .limit(1);

            setStats({
                totalEarnings,
                todayLessons: todayCount || 0,
                totalLessons: instructor.total_lessons || 0,
                rating: instructor.average_rating || 5.0,
            });

            if (upcomingBookings && upcomingBookings.length > 0) {
                const b = upcomingBookings[0];
                const studentId = (b.student as any)?.id;

                // Fetch chat room for this specific student
                const { data: chatRoom } = await supabase
                    .from('connect_chat_rooms')
                    .select('id, unread_count_instructor')
                    .eq('instructor_id', instructor.id)
                    .eq('student_id', studentId)
                    .maybeSingle();

                setNextLesson({
                    id: b.id,
                    student_id: studentId,
                    student_name: (b.student as any)?.full_name || 'Aluno',
                    scheduled_date: b.scheduled_date,
                    scheduled_time: b.scheduled_time,
                    price: b.price,
                    isToday: b.scheduled_date === today,
                    unread_messages: chatRoom?.unread_count_instructor || 0,
                    chat_room_id: chatRoom?.id
                });
            } else {
                setNextLesson(null);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const formatDate = (date: string, time: string) => {
        const d = new Date(date + 'T00:00:00');
        const today = new Date();
        const isToday = d.toDateString() === today.toDateString();

        if (isToday) return `Hoje às ${time.substring(0, 5)}`;
        return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }) + ` às ${time.substring(0, 5)}`;
    };

    const actions = [
        { icon: 'calendar', label: 'Agenda', color: '#7e22ce', bg: '#f3e8ff', route: '/connect/agenda' },
        { icon: 'wallet', label: 'Financeiro', color: '#4d7c0f', bg: '#ecfccb', route: '/connect/financeiro' },
        { icon: 'time', label: 'Horários', color: '#0891b2', bg: '#cffafe', route: '/connect/horarios' },
        { icon: 'pricetag', label: 'Preços', color: '#166534', bg: '#dcfce7', route: '/connect/precos-pacotes' },
        { icon: 'chatbubble-ellipses', label: 'Mensagens', color: '#ea580c', bg: '#ffedd5', route: '/connect/chat' },
    ];

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.loadingContainer}>
                    <Text style={{ color: theme.textMuted }}>Carregando...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={theme.primary} />}
            >
                {/* Header Stats */}
                <View style={[styles.headerCard, { backgroundColor: theme.primary }]}>
                    <View style={styles.headerRow}>
                        <View>
                            <Text style={styles.headerLabel}>Ganhos este mês</Text>
                            <Text style={styles.headerValue}>{formatCurrency(stats.totalEarnings)}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.settingsButton}
                            onPress={() => router.push('/connect/cadastro-instrutor')}
                        >
                            <Ionicons name="settings-outline" size={24} color="rgba(255,255,255,0.9)" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.headerDivider} />
                    <View style={styles.headerStats}>
                        <View style={styles.headerStat}>
                            <Text style={styles.headerStatValue}>{stats.todayLessons}</Text>
                            <Text style={styles.headerStatLabel}>Aulas hoje</Text>
                        </View>
                        <View style={styles.headerStatSeparator} />
                        <View style={styles.headerStat}>
                            <Text style={styles.headerStatValue}>{stats.totalLessons}</Text>
                            <Text style={styles.headerStatLabel}>Total de aulas</Text>
                        </View>
                        <View style={styles.headerStatSeparator} />
                        <View style={styles.headerStat}>
                            <Text style={styles.headerStatValue}>⭐ {stats.rating.toFixed(1)}</Text>
                            <Text style={styles.headerStatLabel}>Avaliação</Text>
                        </View>
                    </View>
                </View>

                {/* Next Lesson Card */}
                <View style={[styles.nextLessonCard, { backgroundColor: theme.card }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>📚 Próxima Aula</Text>

                    {nextLesson ? (
                        <TouchableOpacity
                            style={[styles.lessonContent, { backgroundColor: nextLesson.isToday ? '#dcfce7' : theme.background }]}
                            onPress={() => router.push({
                                pathname: '/connect/agenda',
                                params: { date: nextLesson.scheduled_date }
                            })}
                        >
                            <View style={styles.lessonTime}>
                                <Ionicons name="time" size={20} color={nextLesson.isToday ? '#166534' : theme.primary} />
                                <Text style={[styles.lessonTimeText, { color: nextLesson.isToday ? '#166534' : theme.text }]}>
                                    {formatDate(nextLesson.scheduled_date, nextLesson.scheduled_time)}
                                </Text>
                            </View>
                            <View style={styles.lessonDetails}>
                                <Text style={[styles.studentName, { color: nextLesson.isToday ? '#166534' : theme.text }]}>
                                    {nextLesson.student_name}
                                </Text>
                                <Text style={[styles.lessonPrice, { color: theme.textMuted }]}>
                                    {formatCurrency(nextLesson.price)}
                                </Text>
                            </View>
                            <View style={styles.lessonArrow}>
                                {(nextLesson.unread_messages ?? 0) > 0 && (
                                    <TouchableOpacity
                                        style={[styles.lessonChatBadge, { backgroundColor: theme.primary }]}
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            if (nextLesson.chat_room_id) {
                                                router.push(`/connect/chat/${nextLesson.chat_room_id}`);
                                            }
                                        }}
                                    >
                                        <Ionicons name="chatbubble-ellipses" size={16} color="#fff" />
                                        <Text style={styles.lessonChatBadgeText}>{nextLesson.unread_messages}</Text>
                                    </TouchableOpacity>
                                )}
                                <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                            </View>
                        </TouchableOpacity>
                    ) : (
                        <View style={[styles.emptyLesson, { backgroundColor: theme.background }]}>
                            <Ionicons name="calendar-outline" size={32} color={theme.textMuted} />
                            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                                Nenhuma aula agendada
                            </Text>
                        </View>
                    )}
                </View>

                {/* Quick Actions */}
                <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>⚡ Acesso Rápido</Text>
                <View style={styles.actionsGrid}>
                    {actions.map((action, idx) => (
                        <TouchableOpacity
                            key={idx}
                            style={[styles.actionCard, { backgroundColor: theme.card }]}
                            onPress={() => router.push(action.route as any)}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: action.bg }]}>
                                <Ionicons name={action.icon as any} size={24} color={action.color} />
                            </View>
                            <Text style={[styles.actionLabel, { color: theme.text }]}>{action.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* More Options */}
                <View style={[styles.moreOptions, { backgroundColor: theme.card }]}>
                    <TouchableOpacity style={styles.moreOption} onPress={() => router.push('/connect/alunos')}>
                        <Ionicons name="people-outline" size={20} color={theme.textMuted} />
                        <Text style={[styles.moreOptionText, { color: theme.text }]}>Meus Alunos</Text>
                        <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                    </TouchableOpacity>
                    <View style={[styles.optionDivider, { backgroundColor: theme.cardBorder }]} />
                    <TouchableOpacity style={styles.moreOption} onPress={() => router.push('/connect/documentos')}>
                        <Ionicons name="document-outline" size={20} color={theme.textMuted} />
                        <Text style={[styles.moreOptionText, { color: theme.text }]}>Documentos</Text>
                        <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                    </TouchableOpacity>
                    <View style={[styles.optionDivider, { backgroundColor: theme.cardBorder }]} />
                    <TouchableOpacity style={styles.moreOption} onPress={() => instructorId && router.push(`/connect/instrutor/${instructorId}`)}>
                        <Ionicons name="eye-outline" size={20} color={theme.textMuted} />
                        <Text style={[styles.moreOptionText, { color: theme.text }]}>Ver Meu Perfil Público</Text>
                        <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollView: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 100 },

    // Header
    headerCard: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
    },
    headerValue: {
        color: '#fff',
        fontSize: 32,
        fontWeight: '800',
        marginTop: 4,
    },
    settingsButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginVertical: 16,
    },
    headerStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    headerStat: {
        alignItems: 'center',
    },
    headerStatValue: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    headerStatLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 11,
        marginTop: 2,
    },
    headerStatSeparator: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },

    // Next Lesson
    nextLessonCard: {
        borderRadius: 16,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    lessonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
    },
    lessonTime: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    lessonTimeText: {
        fontSize: 14,
        fontWeight: '600',
    },
    lessonDetails: {
        flex: 1,
        marginLeft: 16,
    },
    studentName: {
        fontSize: 15,
        fontWeight: '600',
    },
    lessonPrice: {
        fontSize: 13,
        marginTop: 2,
    },
    lessonArrow: {
        marginLeft: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    lessonChatBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 14,
        gap: 6,
    },
    lessonChatBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    emptyLesson: {
        alignItems: 'center',
        padding: 24,
        borderRadius: 12,
        gap: 8,
    },
    emptyText: {
        fontSize: 14,
    },

    // Actions
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 12,
    },
    actionCard: {
        width: '47%',
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    actionLabel: {
        fontSize: 14,
        fontWeight: '600',
    },

    // More Options
    moreOptions: {
        borderRadius: 14,
        marginTop: 24,
        overflow: 'hidden',
    },
    moreOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    moreOptionText: {
        flex: 1,
        fontSize: 15,
    },
    optionDivider: {
        height: 1,
        marginLeft: 48,
    },
});
