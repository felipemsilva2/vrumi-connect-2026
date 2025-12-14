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
                    <View style={styles.headerRight}>
                        <TouchableOpacity
                            style={[styles.headerButton, { backgroundColor: theme.card }]}
                            onPress={() => setSearchModalVisible(true)}
                        >
                            <Ionicons name="search-outline" size={20} color={theme.text} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.headerButton, { backgroundColor: theme.card }]}
                            onPress={() => setNotificationModalVisible(true)}
                        >
                            <Ionicons name="notifications-outline" size={20} color={theme.text} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Gamification Row - Compact */}
                {gamificationStats && (
                    <View style={styles.gamificationCompact}>
                        <View style={[styles.gamificationCard, { backgroundColor: theme.card }]}>
                            <View style={styles.streakCompact}>
                                <Ionicons
                                    name={gamificationStats.streak.current > 0 ? "flame" : "flame-outline"}
                                    size={22}
                                    color={gamificationStats.streak.current > 0 ? '#f97316' : theme.textMuted}
                                />
                                <Text style={[styles.streakNumber, { color: gamificationStats.streak.current > 0 ? '#f97316' : theme.textMuted }]}>
                                    {gamificationStats.streak.current}
                                </Text>
                                <Text style={[styles.streakLabel, { color: theme.textSecondary }]}>
                                    {gamificationStats.streak.current === 1 ? 'dia' : 'dias'}
                                </Text>
                            </View>
                            <View style={[styles.dividerVertical, { backgroundColor: theme.cardBorder }]} />
                            <View style={styles.xpCompact}>
                                <Ionicons name="star" size={20} color="#eab308" />
                                <Text style={[styles.xpNumber, { color: theme.text }]}>
                                    {gamificationStats.xp.total.toLocaleString()}
                                </Text>
                                <Text style={[styles.xpLabel, { color: theme.textSecondary }]}>XP</Text>
                            </View>
                            <View style={[styles.dividerVertical, { backgroundColor: theme.cardBorder }]} />
                            <View style={styles.levelCompact}>
                                <View style={[styles.levelBadge, { backgroundColor: theme.primary + '20' }]}>
                                    <Text style={[styles.levelText, { color: theme.primary }]}>
                                        Nv {gamificationStats.xp.level}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* Stats Card */}
                <View style={styles.statsSection}>
                    <LinearGradient
                        colors={isDark ? ['#047857', '#065f46'] : ['#10b981', '#059669']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.statsCard}
                    >
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <View style={styles.statIcon}>
                                    <Ionicons name="layers" size={18} color="#10b981" />
                                </View>
                                <Text style={styles.statValue}>{stats.cardsReviewed}</Text>
                                <Text style={styles.statLabel}>Cards</Text>
                            </View>
                            <View style={styles.statItem}>
                                <View style={styles.statIcon}>
                                    <Ionicons name="time" size={18} color="#10b981" />
                                </View>
                                <Text style={styles.statValue}>{stats.hoursStudied}h</Text>
                                <Text style={styles.statLabel}>Estudo</Text>
                            </View>
                            <View style={styles.statItem}>
                                <View style={styles.statIcon}>
                                    <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                                </View>
                                <Text style={styles.statValue}>{stats.questionsAnswered}</Text>
                                <Text style={styles.statLabel}>Questões</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

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

                {/* Recent Activity */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Atividade Recente</Text>

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
                                            size={18}
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
        paddingBottom: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#10b981',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    avatarImage: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    greeting: {
        fontSize: 17,
        fontWeight: '600',
    },
    subtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    // Compact gamification
    gamificationCompact: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    gamificationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        borderRadius: 16,
        padding: 14,
    },
    streakCompact: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    streakNumber: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    streakLabel: {
        fontSize: 13,
    },
    dividerVertical: {
        width: 1,
        height: 28,
    },
    xpCompact: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    xpNumber: {
        fontSize: 16,
        fontWeight: '600',
    },
    xpLabel: {
        fontSize: 12,
    },
    levelCompact: {
        alignItems: 'center',
    },
    levelBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    levelText: {
        fontSize: 13,
        fontWeight: '600',
    },
    // Stats section
    statsSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    statsCard: {
        borderRadius: 16,
        padding: 16,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    statLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
    // Sections
    section: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 14,
    },
    // Actions grid
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    actionCard: {
        width: (SCREEN_WIDTH - 50) / 2,
        borderRadius: 14,
        padding: 16,
    },
    actionIconBg: {
        width: 44,
        height: 44,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    actionTitle: {
        fontSize: 14,
        fontWeight: '600',
    },
    // Activity styles
    activityLoadingRow: {
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyActivityCompact: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        padding: 14,
        gap: 10,
    },
    emptyActivityText: {
        flex: 1,
        fontSize: 13,
    },
    activityHorizontalScroll: {
        paddingRight: 20,
        gap: 10,
    },
    activityCard: {
        width: 100,
        borderRadius: 14,
        padding: 12,
        alignItems: 'center',
    },
    activityCardIcon: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    activityCardLabel: {
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 3,
    },
    activityCardTime: {
        fontSize: 10,
    },
});
