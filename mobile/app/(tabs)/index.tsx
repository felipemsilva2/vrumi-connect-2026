import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, RefreshControl, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import NotificationModal from '../../components/NotificationModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48 - 12) / 2;

interface Instructor {
    id: string;
    full_name: string;
    photo_url: string | null;
    city: string;
    state: string;
    price_per_lesson: number;
    average_rating: number | null;
    is_verified: boolean | null;
}

interface UpcomingLesson {
    id: string;
    scheduled_date: string;
    scheduled_time: string;
    instructor: {
        full_name: string;
        photo_url: string | null;
    };
}

export default function HomeScreen() {
    const { user } = useAuth();
    const { theme, isDark } = useTheme();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [notificationModalVisible, setNotificationModalVisible] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [featuredInstructors, setFeaturedInstructors] = useState<Instructor[]>([]);
    const [upcomingLesson, setUpcomingLesson] = useState<UpcomingLesson | null>(null);

    const firstName = user?.user_metadata?.full_name?.split(' ')[0] ||
        user?.email?.split('@')[0] ||
        'Motorista';

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

    const fetchData = useCallback(async () => {
        if (!user?.id) return;

        try {
            // Fetch profile for avatar
            const { data: profile } = await supabase
                .from('profiles')
                .select('avatar_url')
                .eq('id', user.id)
                .single();

            if (profile?.avatar_url) {
                setAvatarUrl(profile.avatar_url);
            }

            // Fetch top rated instructors
            const { data: instructors } = await supabase
                .from('instructors')
                .select('id, full_name, photo_url, city, state, price_per_lesson, average_rating, is_verified')
                .eq('status', 'approved')
                .order('average_rating', { ascending: false })
                .limit(4);

            setFeaturedInstructors(instructors || []);

            // Fetch next upcoming lesson
            const now = new Date().toISOString().split('T')[0];
            const { data: lessons } = await supabase
                .from('bookings')
                .select(`
                    id,
                    scheduled_date,
                    scheduled_time,
                    instructor:instructors(full_name, photo_url)
                `)
                .eq('student_id', user.id)
                .gte('scheduled_date', now)
                .in('status', ['confirmed'])
                .order('scheduled_date', { ascending: true })
                .limit(1);

            if (lessons && lessons.length > 0) {
                const lesson = lessons[0] as any;
                setUpcomingLesson({
                    id: lesson.id,
                    scheduled_date: lesson.scheduled_date,
                    scheduled_time: lesson.scheduled_time,
                    instructor: lesson.instructor[0] || lesson.instructor,
                });
            }
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

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(price);
    };

    const formatLessonDate = (dateStr: string, timeStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        const formattedDate = date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
        const formattedTime = timeStr.substring(0, 5);
        return `${formattedDate} às ${formattedTime}`;
    };

    const openPWA = () => {
        Linking.openURL('https://vrumi.com.br/dashboard');
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
                    />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/perfil')}>
                        {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
                                <Text style={styles.avatarInitial}>{firstName.charAt(0)}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={[styles.greeting, { color: theme.textMuted }]}>{greeting},</Text>
                        <Text style={[styles.userName, { color: theme.text }]}>{firstName}!</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.notificationBtn, { backgroundColor: theme.card }]}
                        onPress={() => setNotificationModalVisible(true)}
                    >
                        <Ionicons name="notifications-outline" size={22} color={theme.text} />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <TouchableOpacity
                    style={[styles.searchBar, { backgroundColor: theme.card }]}
                    onPress={() => router.push('/(tabs)/buscar')}
                >
                    <Ionicons name="search-outline" size={20} color={theme.textMuted} />
                    <Text style={[styles.searchPlaceholder, { color: theme.textMuted }]}>
                        Buscar instrutor...
                    </Text>
                </TouchableOpacity>

                {/* Upcoming Lesson (if any) */}
                {upcomingLesson && (
                    <TouchableOpacity
                        style={[styles.upcomingCard]}
                        onPress={() => router.push('/(tabs)/aulas')}
                    >
                        <LinearGradient
                            colors={isDark ? ['#065f46', '#047857'] : ['#10b981', '#059669']}
                            style={styles.upcomingGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={styles.upcomingContent}>
                                <View>
                                    <Text style={styles.upcomingLabel}>Próxima Aula</Text>
                                    <Text style={styles.upcomingInstructor}>
                                        {upcomingLesson.instructor?.full_name || 'Instrutor'}
                                    </Text>
                                    <Text style={styles.upcomingDate}>
                                        {formatLessonDate(upcomingLesson.scheduled_date, upcomingLesson.scheduled_time)}
                                    </Text>
                                </View>
                                <Ionicons name="car-sport" size={48} color="rgba(255,255,255,0.3)" />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {/* Featured Instructors */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Instrutores em Destaque</Text>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/buscar')}>
                        <Text style={[styles.seeAllText, { color: theme.primary }]}>Ver todos</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.instructorsGrid}>
                    {featuredInstructors.map((instructor) => (
                        <TouchableOpacity
                            key={instructor.id}
                            style={[styles.instructorCard, { backgroundColor: theme.card }]}
                            onPress={() => router.push(`/connect/instrutor/${instructor.id}`)}
                        >
                            <View style={styles.photoContainer}>
                                {instructor.photo_url ? (
                                    <Image source={{ uri: instructor.photo_url }} style={styles.photo} />
                                ) : (
                                    <View style={[styles.photoPlaceholder, { backgroundColor: theme.primary }]}>
                                        <Text style={styles.photoInitial}>
                                            {instructor.full_name.charAt(0)}
                                        </Text>
                                    </View>
                                )}
                                {instructor.is_verified && (
                                    <View style={[styles.verifiedBadge, { backgroundColor: theme.primary }]}>
                                        <Ionicons name="checkmark" size={10} color="#fff" />
                                    </View>
                                )}
                            </View>
                            <View style={styles.cardInfo}>
                                <Text style={[styles.instructorName, { color: theme.text }]} numberOfLines={1}>
                                    {instructor.full_name}
                                </Text>
                                <View style={styles.ratingRow}>
                                    <Ionicons name="star" size={12} color="#f59e0b" />
                                    <Text style={[styles.ratingText, { color: theme.text }]}>
                                        {Number(instructor.average_rating || 0).toFixed(1)}
                                    </Text>
                                </View>
                                <Text style={[styles.priceText, { color: theme.primary }]}>
                                    {formatPrice(instructor.price_per_lesson)}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {featuredInstructors.length === 0 && (
                    <View style={[styles.emptyCard, { backgroundColor: theme.card }]}>
                        <Ionicons name="people-outline" size={40} color={theme.textMuted} />
                        <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                            Nenhum instrutor disponível ainda
                        </Text>
                    </View>
                )}

                {/* PWA Banner */}
                <TouchableOpacity
                    style={[styles.pwaBanner, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                    onPress={openPWA}
                >
                    <View style={[styles.pwaIcon, { backgroundColor: theme.primaryLight }]}>
                        <Ionicons name="book" size={24} color={theme.primary} />
                    </View>
                    <View style={styles.pwaContent}>
                        <Text style={[styles.pwaTitle, { color: theme.text }]}>
                            Estudar para prova teórica?
                        </Text>
                        <Text style={[styles.pwaSubtitle, { color: theme.textMuted }]}>
                            Acesse o Vrumi Education pelo site
                        </Text>
                    </View>
                    <Ionicons name="open-outline" size={20} color={theme.textMuted} />
                </TouchableOpacity>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Notification Modal */}
            <NotificationModal
                visible={notificationModalVisible}
                onClose={() => setNotificationModalVisible(false)}
            />
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
    },
    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
    headerCenter: {
        flex: 1,
        marginLeft: 12,
    },
    greeting: {
        fontSize: 14,
    },
    userName: {
        fontSize: 20,
        fontWeight: '700',
    },
    notificationBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Search
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 14,
        gap: 10,
        marginBottom: 20,
    },
    searchPlaceholder: {
        fontSize: 15,
    },
    // Upcoming Lesson
    upcomingCard: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 24,
    },
    upcomingGradient: {
        padding: 20,
    },
    upcomingContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    upcomingLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
        marginBottom: 4,
    },
    upcomingInstructor: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    upcomingDate: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
    },
    // Section
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    seeAllText: {
        fontSize: 14,
        fontWeight: '600',
    },
    // Instructors Grid
    instructorsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    instructorCard: {
        width: CARD_WIDTH,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    photoContainer: {
        position: 'relative',
    },
    photo: {
        width: '100%',
        height: CARD_WIDTH * 0.7,
    },
    photoPlaceholder: {
        width: '100%',
        height: CARD_WIDTH * 0.7,
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoInitial: {
        fontSize: 32,
        fontWeight: '700',
        color: '#fff',
    },
    verifiedBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardInfo: {
        padding: 12,
    },
    instructorName: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '600',
    },
    priceText: {
        fontSize: 15,
        fontWeight: '700',
    },
    // Empty
    emptyCard: {
        padding: 40,
        borderRadius: 16,
        alignItems: 'center',
        gap: 12,
        marginBottom: 24,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
    },
    // PWA Banner
    pwaBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        gap: 12,
    },
    pwaIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pwaContent: {
        flex: 1,
    },
    pwaTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    pwaSubtitle: {
        fontSize: 13,
    },
});
