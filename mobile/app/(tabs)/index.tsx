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
                    <TouchableOpacity onPress={() => router.push('/(tabs)/perfil')}>
                        <View style={styles.avatarContainer}>
                            {avatarUrl ? (
                                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                            ) : (
                                <Text style={styles.avatarText}>
                                    {firstName.charAt(0).toUpperCase()}
                                </Text>
                            )}
                        </View>
                    </TouchableOpacity>

                    <View style={{ flex: 1, paddingHorizontal: 10 }}>
                        <Text style={[styles.greeting, { color: theme.textSecondary }]}>{greeting},</Text>
                        <Text style={[styles.userName, { color: theme.text }]}>{firstName}</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.headerButton, { backgroundColor: theme.card }]}
                        onPress={() => setNotificationModalVisible(true)}
                    >
                        <Ionicons name="notifications-outline" size={20} color={theme.text} />
                        {/* Red dot if needed */}
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <TouchableOpacity
                        style={[styles.searchBar, { backgroundColor: theme.card }]}
                        onPress={() => setSearchModalVisible(true)}
                    >
                        <Ionicons name="search-outline" size={20} color={theme.textSecondary} />
                        <Text style={[styles.searchPlaceholder, { color: theme.textSecondary }]}>
                            O que vamos estudar hoje?
                        </Text>
                        <View style={[styles.filterButton, { backgroundColor: theme.primary }]}>
                            <Ionicons name="options-outline" size={18} color="#fff" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Featured Card - Vrumi Connect */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Destaque</Text>
                    <TouchableOpacity
                        style={[
                            styles.featuredCard,
                            { backgroundColor: isDark ? '#1e293b' : '#FEF3C7' }
                        ]}
                        onPress={() => router.push('/connect')}
                    >
                        <View style={styles.featuredHeader}>
                            <View>
                                <Text style={[styles.featuredLabel, { color: isDark ? '#cbd5e1' : '#92400E' }]}>Vrumi Connect</Text>
                                <Text style={[styles.featuredTitle, { color: isDark ? '#fff' : '#451a03' }]}>Encontre seu Instrutor</Text>
                            </View>
                            <View style={[styles.featuredIcon, { backgroundColor: isDark ? '#334155' : '#FDE68A' }]}>
                                <Ionicons name="car-sport" size={24} color={isDark ? '#e2e8f0' : '#D97706'} />
                            </View>
                        </View>

                        <View style={styles.featuredTags}>
                            <View style={[styles.tag, { backgroundColor: isDark ? '#334155' : '#FFFBEB' }]}>
                                <Text style={[styles.tagText, { color: isDark ? '#e2e8f0' : '#92400E' }]}>Aulas Práticas</Text>
                            </View>
                            <View style={[styles.tag, { backgroundColor: isDark ? '#334155' : '#FFFBEB' }]}>
                                <Text style={[styles.tagText, { color: isDark ? '#e2e8f0' : '#92400E' }]}>Verificados</Text>
                            </View>
                        </View>

                        <View style={styles.featuredFooter}>
                            <View style={styles.instructorAvatars}>
                                {/* Mockup avatars using simple circles */}
                                <View style={[styles.miniAvatar, { backgroundColor: '#FF6B6B', marginLeft: 0 }]} />
                                <View style={[styles.miniAvatar, { backgroundColor: '#4ECDC4', marginLeft: -8 }]} />
                                <View style={[styles.miniAvatar, { backgroundColor: '#FFE66D', marginLeft: -8 }]} />
                            </View>
                            <Text style={[styles.featuredFooterText, { color: isDark ? '#94a3b8' : '#92400E' }]}>
                                Instrutores disponíveis na sua região
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Categories - Horizontal Scroll */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Categorias</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoriesScroll}
                    >
                        <TouchableOpacity
                            style={[styles.categoryCard, { backgroundColor: isDark ? '#1e293b' : '#EFF6FF' }]} // Blue tint
                            onPress={() => router.push('/(tabs)/simulados')}
                        >
                            <View style={[styles.categoryIcon, { backgroundColor: isDark ? '#1e3a5f' : '#BFDBFE' }]}>
                                <Ionicons name="clipboard" size={24} color="#2563EB" />
                            </View>
                            <Text style={[styles.categoryTitle, { color: theme.text }]}>Simulados</Text>
                            <Text style={[styles.categoryCount, { color: theme.textSecondary }]}>30+ Provas</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.categoryCard, { backgroundColor: isDark ? '#1e293b' : '#ECFDF5' }]} // Green tint
                            onPress={() => router.push('/(tabs)/flashcards')}
                        >
                            <View style={[styles.categoryIcon, { backgroundColor: isDark ? '#064e3b' : '#A7F3D0' }]}>
                                <Ionicons name="layers" size={24} color="#059669" />
                            </View>
                            <Text style={[styles.categoryTitle, { color: theme.text }]}>Flashcards</Text>
                            <Text style={[styles.categoryCount, { color: theme.textSecondary }]}>500+ Cards</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.categoryCard, { backgroundColor: isDark ? '#1e293b' : '#FDF2F8' }]} // Pink tint
                            onPress={() => router.push('/biblioteca')}
                        >
                            <View style={[styles.categoryIcon, { backgroundColor: isDark ? '#4a1d4e' : '#FBCFE8' }]}>
                                <Ionicons name="warning" size={24} color="#DB2777" />
                            </View>
                            <Text style={[styles.categoryTitle, { color: theme.text }]}>Placas</Text>
                            <Text style={[styles.categoryCount, { color: theme.textSecondary }]}>Biblioteca</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.categoryCard, { backgroundColor: isDark ? '#1e293b' : '#FFFBEB' }]} // Yellow tint
                            onPress={() => router.push('/(tabs)/estudos')}
                        >
                            <View style={[styles.categoryIcon, { backgroundColor: isDark ? '#451a03' : '#FDE68A' }]}>
                                <Ionicons name="book" size={24} color="#D97706" />
                            </View>
                            <Text style={[styles.categoryTitle, { color: theme.text }]}>Estudos</Text>
                            <Text style={[styles.categoryCount, { color: theme.textSecondary }]}>Aulas</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* Gamification/Stats - Bottom */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Seu Progresso</Text>

                    {gamificationStats && (
                        <View style={[styles.statsRowCard, { backgroundColor: theme.card }]}>
                            <View style={styles.startRowLeft}>
                                <Text style={[styles.statsTitle, { color: theme.text }]}>Nível {gamificationStats.xp.level}</Text>
                                <Text style={[styles.statsSubtitle, { color: theme.textSecondary }]}>
                                    {gamificationStats.xp.current} / {gamificationStats.xp.nextLevel} XP para o próximo nível
                                </Text>
                                <View style={styles.progressBarBg}>
                                    <View
                                        style={[
                                            styles.progressBarFill,
                                            {
                                                width: `${(gamificationStats.xp.current / gamificationStats.xp.nextLevel) * 100}%`,
                                                backgroundColor: theme.primary
                                            }
                                        ]}
                                    />
                                </View>
                            </View>
                            <View style={[styles.levelCircle, { borderColor: theme.primary }]}>
                                <Ionicons name="star" size={24} color={theme.primary} />
                            </View>
                        </View>
                    )}

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
                        <View style={[styles.miniStatCard, { backgroundColor: theme.card }]}>
                            <Text style={[styles.miniStatValue, { color: theme.text }]}>{stats.questionsAnswered}</Text>
                            <Text style={[styles.miniStatLabel, { color: theme.textSecondary }]}>Questões</Text>
                        </View>
                        <View style={[styles.miniStatCard, { backgroundColor: theme.card }]}>
                            <Text style={[styles.miniStatValue, { color: theme.text }]}>{stats.hoursStudied}h</Text>
                            <Text style={[styles.miniStatLabel, { color: theme.textSecondary }]}>Estudo</Text>
                        </View>
                        <View style={[styles.miniStatCard, { backgroundColor: theme.card }]}>
                            <Text style={[styles.miniStatValue, { color: theme.text }]}>{stats.cardsReviewed}</Text>
                            <Text style={[styles.miniStatLabel, { color: theme.textSecondary }]}>Cards</Text>
                        </View>
                    </ScrollView>
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
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 10,
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#64748B',
    },
    avatarImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    greeting: {
        fontSize: 14,
        fontWeight: '500',
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Search
    searchContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
        marginTop: 10,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 50,
        borderRadius: 14,
        paddingLeft: 16,
        paddingRight: 6,
    },
    searchPlaceholder: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
    },
    filterButton: {
        width: 38,
        height: 38,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Sections
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        paddingHorizontal: 20,
    },

    // Featured Card
    featuredCard: {
        marginHorizontal: 20,
        borderRadius: 24,
        padding: 20,
    },
    featuredHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    featuredLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    featuredTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    featuredIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    featuredTags: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
    },
    tag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    tagText: {
        fontSize: 12,
        fontWeight: '500',
    },
    featuredFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    instructorAvatars: {
        flexDirection: 'row',
    },
    miniAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#fff',
    },
    featuredFooterText: {
        fontSize: 12,
        fontWeight: '500',
    },

    // Categories
    categoriesScroll: {
        paddingHorizontal: 20,
        gap: 16,
    },
    categoryCard: {
        width: 140,
        height: 160,
        borderRadius: 20,
        padding: 16,
        justifyContent: 'space-between',
    },
    categoryIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 10,
    },
    categoryCount: {
        fontSize: 12,
        fontWeight: '500',
    },

    // Stats
    statsRowCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 20,
        marginBottom: 16,
    },
    startRowLeft: {
        flex: 1,
        marginRight: 16,
    },
    statsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statsSubtitle: {
        fontSize: 12,
        marginBottom: 10,
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#E2E8F0',
        borderRadius: 3,
        width: '100%',
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    levelCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsScroll: {
        paddingHorizontal: 20,
        gap: 12,
    },
    miniStatCard: {
        width: 100,
        padding: 12,
        borderRadius: 14,
        alignItems: 'center',
    },
    miniStatValue: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    miniStatLabel: {
        fontSize: 12,
    },
});
