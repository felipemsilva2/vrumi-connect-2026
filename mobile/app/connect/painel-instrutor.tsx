import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    Image,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';

interface DashboardStats {
    totalLessons: number;
    totalEarnings: number;
    rating: number;
    reviewCount: number;
}

interface UpcomingLesson {
    id: string;
    student_name: string;
    scheduled_date: string;
    scheduled_time: string;
    status: string;
    price: number;
}

interface LessonPackage {
    id: string;
    name: string;
    total_lessons: number;
    vehicle_type: string;
    total_price: number;
    discount_percent: number;
    is_active: boolean;
}

export default function InstructorDashboardScreen() {
    const { theme, isDark } = useTheme();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [instructorId, setInstructorId] = useState<string | null>(null);
    const [stats, setStats] = useState<DashboardStats>({
        totalLessons: 0,
        totalEarnings: 0,
        rating: 0,
        reviewCount: 0,
    });
    const [upcomingLessons, setUpcomingLessons] = useState<UpcomingLesson[]>([]);
    const [packages, setPackages] = useState<LessonPackage[]>([]);

    const fetchDashboardData = useCallback(async () => {
        if (!user?.id) return;

        try {
            // 1. Get Instructor ID & Basic Stats
            const { data: instructor, error: instructorError } = await supabase
                .from('instructors')
                .select('id, total_lessons, average_rating, total_reviews')
                .eq('user_id', user.id)
                .single();

            if (instructorError) throw instructorError;
            setInstructorId(instructor.id);

            // 2. Calculate Earnings (completed lessons * price * 0.85)
            // Note: In a real app, this should be a separate table or aggregate query
            const { data: completedBookings } = await supabase
                .from('bookings')
                .select('price')
                .eq('instructor_id', instructor.id)
                .eq('status', 'completed');

            const totalEarnings = completedBookings?.reduce((acc, curr) => acc + (curr.price * 0.85), 0) || 0;

            setStats({
                totalLessons: instructor.total_lessons || 0,
                rating: instructor.average_rating || 0,
                reviewCount: instructor.total_reviews || 0,
                totalEarnings,
            });

            // 3. Get Upcoming Lessons
            const now = new Date().toISOString().split('T')[0];
            const { data: bookings } = await supabase
                .from('bookings')
                .select(`
                    id,
                    scheduled_date,
                    scheduled_time,
                    status,
                    price,
                    student:profiles(full_name)
                `)
                .eq('instructor_id', instructor.id)
                .in('status', ['confirmed', 'pending'])
                .gte('scheduled_date', now)
                .order('scheduled_date', { ascending: true })
                .limit(5);

            if (bookings) {
                setUpcomingLessons(bookings.map((b: any) => ({
                    id: b.id,
                    student_name: b.student?.full_name || 'Aluno',
                    scheduled_date: b.scheduled_date,
                    scheduled_time: b.scheduled_time,
                    status: b.status,
                    price: b.price
                })));
            }

            // 4. Get Instructor's Packages
            const { data: packagesData } = await supabase
                .from('lesson_packages')
                .select('*')
                .eq('instructor_id', instructor.id)
                .order('created_at', { ascending: false });

            if (packagesData) {
                setPackages(packagesData);
            }

        } catch (error) {
            console.error('Error fetching dashboard:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const formatDate = (date: string) => {
        const d = new Date(date + 'T00:00:00');
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };

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
                <Text style={[styles.headerTitle, { color: theme.text }]}>Painel do Instrutor</Text>
                <TouchableOpacity
                    style={[styles.profileButton, { backgroundColor: theme.card }]}
                    onPress={() => instructorId && router.push(`/connect/instrutor/${instructorId}`)}
                >
                    <Ionicons name="eye-outline" size={22} color={theme.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                }
            >
                {/* Stats Cards */}
                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { backgroundColor: theme.card }]}>
                        <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
                            <Ionicons name="cash-outline" size={20} color="#15803d" />
                        </View>
                        <Text style={[styles.statValue, { color: theme.text }]}>
                            {formatCurrency(stats.totalEarnings)}
                        </Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Ganhos</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: theme.card }]}>
                        <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
                            <Ionicons name="checkmark-circle-outline" size={20} color="#1d4ed8" />
                        </View>
                        <Text style={[styles.statValue, { color: theme.text }]}>
                            {stats.totalLessons}
                        </Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Aulas Dadas</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: theme.card }]}>
                        <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
                            <Ionicons name="star" size={20} color="#b45309" />
                        </View>
                        <Text style={[styles.statValue, { color: theme.text }]}>
                            {stats.rating.toFixed(1)}
                        </Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Nota Geral</Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Acesso Rápido</Text>
                <View style={styles.actionsGrid}>
                    <TouchableOpacity
                        onPress={() => router.push('/connect/agenda')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#f3e8ff' }]}>
                            <Ionicons name="calendar" size={24} color="#7e22ce" />
                        </View>
                        <Text style={[styles.actionLabel, { color: theme.text }]}>Agenda</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push('/connect/financeiro')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#ecfccb' }]}>
                            <Ionicons name="wallet" size={24} color="#4d7c0f" />
                        </View>
                        <Text style={[styles.actionLabel, { color: theme.text }]}>Financeiro</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionCard, { backgroundColor: theme.card }]}
                        onPress={() => router.push('/connect/horarios')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: isDark ? theme.primaryLight : '#ecfdf5' }]}>
                            <Ionicons name="time" size={24} color="#10b981" />
                        </View>
                        <Text style={[styles.actionLabel, { color: theme.textSecondary }]}>Horários</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push('/connect/alunos')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#ffedd5' }]}>
                            <Ionicons name="people" size={24} color="#c2410c" />
                        </View>
                        <Text style={[styles.actionLabel, { color: theme.text }]}>Alunos</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionCard, { backgroundColor: theme.card }]}
                        onPress={() => router.push('/connect/documentos')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#fce7f3' }]}>
                            <Ionicons name="shield-checkmark" size={24} color="#be185d" />
                        </View>
                        <Text style={[styles.actionLabel, { color: theme.text }]}>Documentos</Text>
                    </TouchableOpacity>
                </View>

                {/* My Packages */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Meus Pacotes</Text>
                    <TouchableOpacity
                        style={[styles.addButton, { backgroundColor: theme.primary }]}
                        onPress={() => router.push('/connect/criar-pacote')}
                    >
                        <Ionicons name="add" size={18} color="#fff" />
                    </TouchableOpacity>
                </View>

                {packages.length === 0 ? (
                    <TouchableOpacity
                        style={[styles.emptyCard, { backgroundColor: theme.card }]}
                        onPress={() => router.push('/connect/criar-pacote')}
                    >
                        <Ionicons name="pricetag-outline" size={40} color={theme.textMuted} />
                        <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                            Crie pacotes de aulas com desconto para seus alunos.
                        </Text>
                        <Text style={[styles.emptyAction, { color: theme.primary }]}>+ Criar Pacote</Text>
                    </TouchableOpacity>
                ) : (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.packagesScroll}
                    >
                        {packages.map(pkg => (
                            <TouchableOpacity
                                key={pkg.id}
                                style={[
                                    styles.packageCard,
                                    {
                                        backgroundColor: pkg.is_active ? theme.card : theme.background,
                                        borderColor: pkg.is_active ? theme.primaryLight : theme.cardBorder,
                                        opacity: pkg.is_active ? 1 : 0.6,
                                    }
                                ]}
                                onPress={() => router.push(`/connect/criar-pacote?id=${pkg.id}`)}
                            >
                                <View style={styles.packageHeader}>
                                    <Text style={[styles.packageName, { color: theme.text }]}>{pkg.name}</Text>
                                    <View style={[
                                        styles.discountBadge,
                                        { backgroundColor: pkg.is_active ? '#dcfce7' : '#f3f4f6' }
                                    ]}>
                                        <Text style={[
                                            styles.discountText,
                                            { color: pkg.is_active ? '#166534' : '#6b7280' }
                                        ]}>
                                            -{pkg.discount_percent}%
                                        </Text>
                                    </View>
                                </View>
                                <Text style={[styles.packageLessons, { color: theme.textSecondary }]}>
                                    {pkg.total_lessons} aulas • {pkg.vehicle_type === 'instructor' ? '🚗' : '🔑'}
                                </Text>
                                <Text style={[styles.packagePrice, { color: theme.primary }]}>
                                    {formatCurrency(pkg.total_price)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                {/* Upcoming Lessons */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Próximas Aulas</Text>
                {upcomingLessons.length === 0 ? (
                    <View style={[styles.emptyCard, { backgroundColor: theme.card }]}>
                        <Ionicons name="calendar-outline" size={48} color={theme.textMuted} />
                        <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                            Nenhuma aula agendada para os próximos dias.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.lessonsList}>
                        {upcomingLessons.map(lesson => (
                            <View key={lesson.id} style={[styles.lessonCard, { backgroundColor: theme.card }]}>
                                <View style={styles.lessonDate}>
                                    <Text style={[styles.dateDay, { color: theme.primary }]}>
                                        {formatDate(lesson.scheduled_date)}
                                    </Text>
                                    <Text style={[styles.dateTime, { color: theme.textSecondary }]}>
                                        {lesson.scheduled_time.substring(0, 5)}
                                    </Text>
                                </View>
                                <View style={styles.lessonInfo}>
                                    <Text style={[styles.studentName, { color: theme.text }]}>
                                        {lesson.student_name}
                                    </Text>
                                    <View style={[
                                        styles.statusBadge,
                                        { backgroundColor: lesson.status === 'confirmed' ? '#dcfce7' : '#fef9c3' }
                                    ]}>
                                        <Text style={[
                                            styles.statusText,
                                            { color: lesson.status === 'confirmed' ? '#166534' : '#854d0e' }
                                        ]}>
                                            {lesson.status === 'confirmed' ? 'Confirmada' : 'Pendente'}
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={[styles.detailsButton, { backgroundColor: theme.background }]}
                                    onPress={() => {
                                        if (lesson.status === 'confirmed') {
                                            router.push(`/connect/aula/${lesson.id}`);
                                        } else {
                                            Alert.alert('Detalhes', `Aula com ${lesson.student_name} às ${lesson.scheduled_time}`);
                                        }
                                    }}
                                >
                                    <Ionicons
                                        name={lesson.status === 'confirmed' ? "qr-code" : "chevron-forward"}
                                        size={20}
                                        color={lesson.status === 'confirmed' ? theme.primary : theme.textMuted}
                                    />
                                </TouchableOpacity>
                            </View>
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
    profileButton: {
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
        flex: 1,
        paddingHorizontal: 20,
    },
    // Stats Grid
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 11,
    },
    // Actions Grid
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    actionCard: {
        width: '48%',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    actionLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    // Headings
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    // Lessons List
    lessonsList: {
        gap: 12,
    },
    lessonCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    lessonDate: {
        alignItems: 'center',
        paddingRight: 16,
        borderRightWidth: 1,
        borderRightColor: '#e2e8f0',
        marginRight: 16,
    },
    dateDay: {
        fontSize: 16,
        fontWeight: '700',
    },
    dateTime: {
        fontSize: 12,
    },
    lessonInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 6,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    detailsButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyCard: {
        padding: 40,
        borderRadius: 16,
        alignItems: 'center',
        gap: 12,
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 14,
        lineHeight: 20,
    },
    emptyAction: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 4,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 16,
    },
    addButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    packagesScroll: {
        paddingRight: 20,
        gap: 12,
    },
    packageCard: {
        width: 160,
        padding: 16,
        borderRadius: 14,
        borderWidth: 2,
    },
    packageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    packageName: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    discountBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        marginLeft: 6,
    },
    discountText: {
        fontSize: 11,
        fontWeight: '700',
    },
    packageLessons: {
        fontSize: 12,
        marginBottom: 8,
    },
    packagePrice: {
        fontSize: 18,
        fontWeight: '700',
    },
});
