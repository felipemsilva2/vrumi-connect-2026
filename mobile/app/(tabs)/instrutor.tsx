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
    StatusBar,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DashboardStats {
    totalLessons: number;
    pendingLessons: number;
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

export default function InstrutorTab() {
    const { theme, isDark } = useTheme();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [instructorInfo, setInstructorInfo] = useState<any>(null);
    const [stats, setStats] = useState<DashboardStats>({
        totalLessons: 0,
        pendingLessons: 0,
        totalEarnings: 0,
        rating: 0,
        reviewCount: 0,
    });
    const [upcomingLessons, setUpcomingLessons] = useState<UpcomingLesson[]>([]);

    const fetchData = useCallback(async () => {
        if (!user?.id) return;

        try {
            // Get instructor info
            const { data: instructor } = await supabase
                .from('instructors')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (!instructor) {
                router.replace('/(tabs)/perfil');
                return;
            }

            setInstructorInfo(instructor);

            // Get stats
            const { data: bookings } = await supabase
                .from('bookings')
                .select('id, status, price, scheduled_date, scheduled_time, student:profiles(full_name)')
                .eq('instructor_id', instructor.id);

            const completed = bookings?.filter(b => b.status === 'completed') || [];
            const pending = bookings?.filter(b => ['pending', 'confirmed'].includes(b.status || '')) || [];
            const totalEarnings = completed.reduce((sum, b) => sum + (b.price || 0), 0);

            setStats({
                totalLessons: completed.length,
                pendingLessons: pending.length,
                totalEarnings,
                rating: instructor.average_rating || 0,
                reviewCount: instructor.total_reviews || 0,
            });

            // Get upcoming lessons
            const now = new Date().toISOString().split('T')[0];
            const upcoming = bookings
                ?.filter(b =>
                    ['pending', 'confirmed'].includes(b.status || '') &&
                    b.scheduled_date >= now
                )
                .slice(0, 5)
                .map(b => ({
                    id: b.id,
                    student_name: (b.student as any)?.full_name || 'Aluno',
                    scheduled_date: b.scheduled_date,
                    scheduled_time: b.scheduled_time,
                    status: b.status || 'pending',
                    price: b.price,
                })) || [];

            setUpcomingLessons(upcoming);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const formatDate = (date: string) => {
        return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return '#10b981';
            case 'pending': return '#f59e0b';
            default: return '#6b7280';
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle="light-content" backgroundColor="#064e3b" />

            {/* Header */}
            <View style={styles.headerSection}>
                <SafeAreaView edges={['top']} style={styles.safeHeader}>
                    <View style={styles.headerRow}>
                        <View style={styles.headerInfo}>
                            <Text style={styles.headerTitle}>Painel do Instrutor</Text>
                            <Text style={styles.headerSubtitle}>
                                Olá, {instructorInfo?.full_name?.split(' ')[0] || 'Instrutor'}!
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.settingsBtn}
                            onPress={() => router.push('/connect/documentos')}
                        >
                            <Ionicons name="settings-outline" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#10b981"
                    />
                }
            >
                {/* Stats Cards */}
                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
                        <View style={[styles.statIcon, { backgroundColor: isDark ? theme.primaryLight : '#ecfdf5' }]}>
                            <Ionicons name="cash" size={20} color="#10b981" />
                        </View>
                        <Text style={[styles.statValue, { color: theme.text }]}>{formatCurrency(stats.totalEarnings)}</Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Ganho</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
                        <View style={[styles.statIcon, { backgroundColor: isDark ? theme.warningLight : '#fef3c7' }]}>
                            <Ionicons name="calendar" size={20} color="#f59e0b" />
                        </View>
                        <Text style={[styles.statValue, { color: theme.text }]}>{stats.pendingLessons}</Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Aulas Pendentes</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
                        <View style={[styles.statIcon, { backgroundColor: isDark ? theme.infoLight : '#dbeafe' }]}>
                            <Ionicons name="checkmark-circle" size={20} color="#3b82f6" />
                        </View>
                        <Text style={[styles.statValue, { color: theme.text }]}>{stats.totalLessons}</Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Aulas Concluídas</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
                        <View style={[styles.statIcon, { backgroundColor: isDark ? theme.warningLight : '#fef3c7' }]}>
                            <Ionicons name="star" size={20} color="#f59e0b" />
                        </View>
                        <Text style={[styles.statValue, { color: theme.text }]}>{stats.rating.toFixed(1)}</Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{stats.reviewCount} avaliações</Text>
                    </View>
                </View>

                {/* Quick Actions */}
                {/* Quick Actions */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Acesso Rápido</Text>
                <View style={styles.actionsGrid}>
                    <TouchableOpacity
                        style={styles.actionCardWrapper}
                        onPress={() => router.push('/connect/agenda')}
                    >
                        <View style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
                            <View style={[styles.actionIcon, { backgroundColor: '#f3e8ff' }]}>
                                <Ionicons name="calendar" size={24} color="#7e22ce" />
                            </View>
                            <Text style={[styles.actionLabel, { color: theme.text }]}>Agenda</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCardWrapper}
                        onPress={() => router.push('/connect/financeiro')}
                    >
                        <View style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
                            <View style={[styles.actionIcon, { backgroundColor: '#ecfccb' }]}>
                                <Ionicons name="wallet" size={24} color="#4d7c0f" />
                            </View>
                            <Text style={[styles.actionLabel, { color: theme.text }]}>Financeiro</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCardWrapper}
                        onPress={() => router.push('/connect/horarios')}
                    >
                        <View style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
                            <View style={[styles.actionIcon, { backgroundColor: isDark ? theme.primaryLight : '#ecfdf5' }]}>
                                <Ionicons name="time" size={24} color="#10b981" />
                            </View>
                            <Text style={[styles.actionLabel, { color: theme.textSecondary }]}>Horários</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCardWrapper}
                        onPress={() => router.push('/connect/alunos')}
                    >
                        <View style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
                            <View style={[styles.actionIcon, { backgroundColor: '#ffedd5' }]}>
                                <Ionicons name="people" size={24} color="#c2410c" />
                            </View>
                            <Text style={[styles.actionLabel, { color: theme.text }]}>Alunos</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCardWrapper}
                        onPress={() => router.push('/connect/documentos')}
                    >
                        <View style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
                            <View style={[styles.actionIcon, { backgroundColor: '#fce7f3' }]}>
                                <Ionicons name="shield-checkmark" size={24} color="#be185d" />
                            </View>
                            <Text style={[styles.actionLabel, { color: theme.text }]}>Documentos</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCardWrapper}
                        onPress={() => router.push('/connect/cadastro-instrutor')}
                    >
                        <View style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
                            <View style={[styles.actionIcon, { backgroundColor: isDark ? theme.infoLight : '#e0f2fe' }]}>
                                <Ionicons name="person" size={24} color="#0284c7" />
                            </View>
                            <Text style={[styles.actionLabel, { color: theme.textSecondary }]}>Editar Perfil</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Upcoming Lessons */}
                <View style={styles.lessonsHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Próximas Aulas</Text>
                    {upcomingLessons.length > 0 && (
                        <View style={styles.lessonCountBadge}>
                            <Text style={styles.lessonCountText}>{upcomingLessons.length}</Text>
                        </View>
                    )}
                </View>

                {upcomingLessons.length === 0 ? (
                    <View style={[styles.emptyState, { backgroundColor: theme.card }]}>
                        <Ionicons name="calendar-outline" size={48} color={theme.textMuted} />
                        <Text style={[styles.emptyTitle, { color: theme.text }]}>Nenhuma aula agendada</Text>
                        <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
                            Novas aulas aparecerão aqui quando alunos agendarem
                        </Text>
                    </View>
                ) : (
                    <View style={styles.lessonsList}>
                        {upcomingLessons.map((lesson) => (
                            <TouchableOpacity
                                key={lesson.id}
                                style={[styles.lessonCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}
                                onPress={() => router.push(`/connect/aula/${lesson.id}`)}
                            >
                                <View style={styles.lessonInfo}>
                                    <Text style={[styles.lessonStudent, { color: theme.text }]}>{lesson.student_name}</Text>
                                    <View style={styles.lessonMeta}>
                                        <Ionicons name="calendar" size={14} color={theme.textSecondary} />
                                        <Text style={[styles.lessonMetaText, { color: theme.textSecondary }]}>
                                            {formatDate(lesson.scheduled_date)} às {lesson.scheduled_time.slice(0, 5)}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.lessonRight}>
                                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(lesson.status) }]} />
                                    <Text style={styles.lessonPrice}>{formatCurrency(lesson.price)}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    // Header
    headerSection: {
        backgroundColor: '#064e3b',
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    safeHeader: {
        paddingHorizontal: 20,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    headerInfo: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 2,
    },
    settingsBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Content
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    // Stats Grid
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        width: (SCREEN_WIDTH - 52) / 2,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1f2937',
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    // Section
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 12,
    },
    // Actions
    // Actions Grid
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    actionCardWrapper: {
        width: '48%', // 2 columns
    },
    actionCard: {
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
        width: '100%',
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    // Lessons
    lessonsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    lessonCountBadge: {
        backgroundColor: '#10b981',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    lessonCountText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    lessonsList: {
        gap: 10,
    },
    lessonCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    lessonInfo: {
        flex: 1,
    },
    lessonStudent: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 4,
    },
    lessonMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    lessonMetaText: {
        fontSize: 13,
        color: '#6b7280',
    },
    lessonRight: {
        alignItems: 'flex-end',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginBottom: 4,
    },
    lessonPrice: {
        fontSize: 14,
        fontWeight: '700',
        color: '#10b981',
    },
    // Empty State
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
        backgroundColor: '#fff',
        borderRadius: 16,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginTop: 12,
    },
    emptySubtitle: {
        fontSize: 13,
        color: '#9ca3af',
        textAlign: 'center',
        marginTop: 4,
        paddingHorizontal: 20,
    },
});
