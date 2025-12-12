import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useGamification } from '../../contexts/GamificationContext';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import NotificationModal from '../../components/NotificationModal';
import SearchModal from '../../components/SearchModal';
import StreakCard from '../../components/gamification/StreakCard';
import XPBadge from '../../components/gamification/XPBadge';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface UserStats {
    cardsReviewed: number;
    hoursStudied: number;
    questionsAnswered: number;
}

interface Activity {
    id: string;
    activity_type: string;
    metadata: any;
    created_at: string;
}

export default function DashboardScreen() {
    const { user } = useAuth();
    const { theme, isDark } = useTheme();
    const { stats: gamificationStats, refreshStats } = useGamification();
    const [stats, setStats] = useState<UserStats>({ cardsReviewed: 0, hoursStudied: 0, questionsAnswered: 0 });
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [notificationModalVisible, setNotificationModalVisible] = useState(false);
    const [searchModalVisible, setSearchModalVisible] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    const firstName = user?.user_metadata?.full_name?.split(' ')[0] ||
        user?.email?.split('@')[0] ||
        'Estudante';

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

    const fetchUserData = useCallback(async () => {
        if (!user?.id) return;

        try {
            // Fetch profile data including avatar
            const { data: profile } = await supabase
                .from('profiles')
                .select('total_flashcards_studied, total_questions_answered, avatar_url')
                .eq('id', user.id)
                .single();

            if (profile?.avatar_url) {
                setAvatarUrl(profile.avatar_url);
            }

            // Fetch study hours from last 7 days
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            // Using type assertion since this table exists but isn't in generated types
            const { data: studyData } = await (supabase as any)
                .from('daily_study_activities')
                .select('hours_studied')
                .eq('user_id', user.id)
                .gte('study_date', sevenDaysAgo.toISOString().split('T')[0]);

            const totalHours = studyData?.reduce((sum: number, day: any) => sum + (Number(day.hours_studied) || 0), 0) || 0;

            // Fetch recent activities
            const { data: activityData } = await supabase
                .from('user_activities')
                .select('id, activity_type, metadata, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            setStats({
                cardsReviewed: profile?.total_flashcards_studied || 0,
                hoursStudied: Math.round(totalHours * 10) / 10,
                questionsAnswered: profile?.total_questions_answered || 0,
            });

            setActivities(activityData || []);
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchUserData();
    }, [fetchUserData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchUserData();
    }, [fetchUserData]);

    const getActivityIcon = (type: string): keyof typeof Ionicons.glyphMap => {
        switch (type) {
            case 'flashcard_review': return 'layers';
            case 'quiz_complete': return 'clipboard';
            case 'traffic_sign_study': return 'warning';
            case 'lesson_complete': return 'book';
            default: return 'time';
        }
    };

    const getActivityLabel = (type: string): string => {
        switch (type) {
            case 'flashcard_review': return 'Flashcard revisado';
            case 'quiz_complete': return 'Simulado concluído';
            case 'traffic_sign_study': return 'Placa estudada';
            case 'lesson_complete': return 'Lição concluída';
            default: return 'Atividade';
        }
    };

    const formatTimeAgo = (dateStr: string): string => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMinutes < 1) return 'agora';
        if (diffMinutes < 60) return `${diffMinutes}min`;
        if (diffHours < 24) return `${diffHours}h`;
        return `${diffDays}d`;
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.primary}
                        colors={[theme.primary]}
                    />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={styles.avatarContainer}>
                            {avatarUrl ? (
                                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                            ) : (
                                <Text style={styles.avatarText}>
                                    {firstName.charAt(0).toUpperCase()}
                                </Text>
                            )}
                        </View>
                        <View>
                            <Text style={[styles.greeting, { color: theme.text }]}>{greeting}, {firstName}!</Text>
                            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Vamos estudar hoje?</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[styles.notificationButton, { backgroundColor: theme.card }]}
                        onPress={() => setNotificationModalVisible(true)}
                    >
                        <Ionicons name="notifications-outline" size={22} color={theme.text} />
                    </TouchableOpacity>
                </View>

                {/* Hero Card */}
                <LinearGradient
                    colors={isDark ? ['#047857', '#065f46'] : ['#10b981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroCard}
                >
                    <View style={styles.heroContent}>
                        <Text style={styles.heroTitle}>Continue estudando</Text>
                        <TouchableOpacity
                            style={styles.searchBar}
                            onPress={() => setSearchModalVisible(true)}
                        >
                            <Ionicons name="search" size={18} color="#6b7280" />
                            <Text style={styles.searchPlaceholder}>Buscar conteúdo...</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <View style={styles.statIcon}>
                                <Ionicons name="layers" size={20} color="#10b981" />
                            </View>
                            <Text style={styles.statValue}>{stats.cardsReviewed}</Text>
                            <Text style={styles.statLabel}>Cards</Text>
                        </View>
                        <View style={styles.statItem}>
                            <View style={styles.statIcon}>
                                <Ionicons name="time" size={20} color="#10b981" />
                            </View>
                            <Text style={styles.statValue}>{stats.hoursStudied}h</Text>
                            <Text style={styles.statLabel}>Estudo</Text>
                        </View>
                        <View style={styles.statItem}>
                            <View style={styles.statIcon}>
                                <Ionicons name="help-circle" size={20} color="#10b981" />
                            </View>
                            <Text style={styles.statValue}>{stats.questionsAnswered}</Text>
                            <Text style={styles.statLabel}>Questões</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Gamification Section */}
                {gamificationStats && (
                    <View style={styles.gamificationSection}>
                        {/* Streak and XP Row */}
                        <View style={styles.gamificationRow}>
                            <View style={styles.streakMini}>
                                <StreakCard
                                    currentStreak={gamificationStats.streak.current}
                                    longestStreak={gamificationStats.streak.longest}
                                    isActiveToday={gamificationStats.streak.isActiveToday}
                                    compact={false}
                                />
                            </View>
                        </View>
                        <View style={{ height: 12 }} />
                        <XPBadge
                            totalXP={gamificationStats.xp.total}
                            level={gamificationStats.xp.level}
                            xpToday={gamificationStats.xp.today}
                        />
                    </View>
                )}

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Ações Rápidas</Text>
                    <View style={styles.actionsGrid}>
                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: theme.card }]}
                            onPress={() => router.push('/(tabs)/flashcards')}
                        >
                            <View style={[styles.actionIconBg, { backgroundColor: isDark ? '#064e3b' : '#ecfdf5' }]}>
                                <Ionicons name="layers" size={24} color="#10b981" />
                            </View>
                            <Text style={[styles.actionTitle, { color: theme.text }]}>Flashcards</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: theme.card }]}
                            onPress={() => router.push('/(tabs)/simulados')}
                        >
                            <View style={[styles.actionIconBg, { backgroundColor: isDark ? '#1e3a5f' : '#eff6ff' }]}>
                                <Ionicons name="clipboard" size={24} color="#3b82f6" />
                            </View>
                            <Text style={[styles.actionTitle, { color: theme.text }]}>Simulados</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: theme.card }]}
                            onPress={() => router.push('/(tabs)/estudos')}
                        >
                            <View style={[styles.actionIconBg, { backgroundColor: isDark ? '#451a03' : '#fef3c7' }]}>
                                <Ionicons name="book" size={24} color="#f59e0b" />
                            </View>
                            <Text style={[styles.actionTitle, { color: theme.text }]}>Estudos</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: theme.card }]}
                            onPress={() => router.push('/biblioteca')}
                        >
                            <View style={[styles.actionIconBg, { backgroundColor: isDark ? '#4a1d4e' : '#fce7f3' }]}>
                                <Ionicons name="warning" size={24} color="#ec4899" />
                            </View>
                            <Text style={[styles.actionTitle, { color: theme.text }]}>Placas</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Recent Activity - Modern Horizontal Cards */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Atividade Recente</Text>
                    </View>

                    {loading ? (
                        <View style={styles.activityLoadingRow}>
                            <ActivityIndicator size="small" color={theme.primary} />
                        </View>
                    ) : activities.length === 0 ? (
                        <View style={[styles.emptyActivityCompact, { backgroundColor: theme.card }]}>
                            <Ionicons name="sparkles-outline" size={24} color={theme.primary} />
                            <Text style={[styles.emptyActivityText, { color: theme.textSecondary }]}>
                                Comece a estudar para ver sua atividade aqui
                            </Text>
                        </View>
                    ) : (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.activityHorizontalScroll}
                        >
                            {activities.map((activity) => (
                                <View
                                    key={activity.id}
                                    style={[styles.activityCard, { backgroundColor: theme.card }]}
                                >
                                    <View style={[styles.activityCardIcon, { backgroundColor: theme.primary + '15' }]}>
                                        <Ionicons
                                            name={getActivityIcon(activity.activity_type)}
                                            size={20}
                                            color={theme.primary}
                                        />
                                    </View>
                                    <Text style={[styles.activityCardLabel, { color: theme.text }]} numberOfLines={1}>
                                        {getActivityLabel(activity.activity_type)}
                                    </Text>
                                    <Text style={[styles.activityCardTime, { color: theme.textMuted }]}>
                                        {formatTimeAgo(activity.created_at)}
                                    </Text>
                                </View>
                            ))}
                        </ScrollView>
                    )}
                </View>
            </ScrollView>

            {/* Notification Modal */}
            <NotificationModal
                visible={notificationModalVisible}
                onClose={() => setNotificationModalVisible(false)}
                userId={user?.id}
            />

            {/* Search Modal */}
            <SearchModal
                visible={searchModalVisible}
                onClose={() => setSearchModalVisible(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 20,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#10b981',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    avatarImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    greeting: {
        fontSize: 18,
        fontWeight: '600',
    },
    subtitle: {
        fontSize: 14,
        marginTop: 2,
    },
    notificationButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    heroCard: {
        marginHorizontal: 20,
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
    },
    heroContent: {
        marginBottom: 20,
    },
    heroTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 16,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 10,
    },
    searchPlaceholder: {
        fontSize: 15,
        color: '#6b7280',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 16,
        padding: 16,
    },
    statItem: {
        alignItems: 'center',
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    seeAllText: {
        fontSize: 14,
        fontWeight: '500',
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    actionCard: {
        width: (SCREEN_WIDTH - 52) / 2,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    actionIconBg: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    actionTitle: {
        fontSize: 15,
        fontWeight: '600',
    },
    // Activity styles - Modern horizontal cards
    activityLoadingRow: {
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyActivityCompact: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        padding: 16,
        gap: 12,
    },
    emptyActivityText: {
        flex: 1,
        fontSize: 14,
    },
    activityHorizontalScroll: {
        paddingRight: 20,
        gap: 12,
    },
    activityCard: {
        width: 120,
        borderRadius: 16,
        padding: 14,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    activityCardIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    activityCardLabel: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 4,
    },
    activityCardTime: {
        fontSize: 11,
    },
    // Gamification styles
    gamificationSection: {
        paddingHorizontal: 20,
        marginTop: 20,
    },
    gamificationRow: {
        flexDirection: 'row',
        gap: 12,
    },
    streakMini: {
        flex: 1,
    },
});
