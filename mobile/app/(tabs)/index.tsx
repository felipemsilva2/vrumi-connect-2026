import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    RefreshControl,
    Image,
    Linking,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { isLessonExpired } from '../../utils/dateUtils';
import NotificationModal from '../../components/NotificationModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

const SERVICES = [
    { id: 'aulas', icon: 'car', label: 'Aulas', color: '#10b981' },
    { id: 'teoria', icon: 'book', label: 'Teoria', color: '#3b82f6' },
    { id: 'simulado', icon: 'timer', label: 'Simulado', color: '#f59e0b' },
    { id: 'agendados', icon: 'calendar', label: 'Agendados', color: '#8b5cf6' },
];

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
            const { data: profile } = await supabase
                .from('profiles')
                .select('avatar_url')
                .eq('id', user.id)
                .single();

            if (profile?.avatar_url) {
                setAvatarUrl(profile.avatar_url);
            }

            const { data: instructors } = await supabase
                .from('instructors')
                .select('id, full_name, photo_url, city, state, price_per_lesson, average_rating, is_verified')
                .eq('status', 'approved')
                .order('average_rating', { ascending: false })
                .limit(4);

            setFeaturedInstructors(instructors || []);

            const now = new Date().toISOString().split('T')[0];
            // Fetch slightly more to filter locally if needed
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
                .order('scheduled_time', { ascending: true }) // Order by time too
                .limit(5); // Fetch a few to find the first non-expired one

            if (lessons && lessons.length > 0) {
                // Find first non-expired lesson
                const validLesson = lessons.find(l => !isLessonExpired(l.scheduled_date, l.scheduled_time));

                if (validLesson) {
                    // Supabase join returns an array if one-to-many, or object?
                    // Usually it returns an array unless .single() is used on the join or if it's declared strictly.
                    // However, TS inference might see it as an array if not typed.
                    // Given the error: "Property '0' does not exist on type '{ full_name: string; photo_url: string | null; }'"
                    // It means TS thinks 'instructor' IS the object, not an array.
                    // So we should access it directly.
                    const instructorData = validLesson.instructor as any;
                    const instructor = Array.isArray(instructorData) ? instructorData[0] : instructorData;

                    setUpcomingLesson({
                        id: validLesson.id,
                        scheduled_date: validLesson.scheduled_date,
                        scheduled_time: validLesson.scheduled_time,
                        instructor: instructor || { full_name: 'Instrutor', photo_url: null },
                    });
                } else {
                    setUpcomingLesson(null);
                }
            } else {
                setUpcomingLesson(null);
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

    const handleServicePress = (serviceId: string) => {
        switch (serviceId) {
            case 'aulas':
                router.push('/(tabs)/buscar');
                break;
            case 'teoria':
                Linking.openURL('https://vrumi.com.br/dashboard');
                break;
            case 'simulado':
                Linking.openURL('https://vrumi.com.br/simulado');
                break;
            case 'agendados':
                router.push('/(tabs)/aulas');
                break;
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#10b981" />
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle="light-content" backgroundColor="#064e3b" translucent />

            {/* Header with Gradient */}
            <View style={styles.headerSection}>
                <SafeAreaView edges={['top']} style={styles.safeHeader}>
                    {/* Top Bar */}
                    <View style={styles.topBar}>
                        <TouchableOpacity
                            style={styles.profileButton}
                            onPress={() => router.push('/(tabs)/perfil')}
                        >
                            {avatarUrl ? (
                                <Image source={{ uri: avatarUrl }} style={styles.profileAvatar} />
                            ) : (
                                <View style={styles.profileAvatarPlaceholder}>
                                    <Text style={styles.profileInitial}>{firstName.charAt(0)}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <View style={styles.userInfo}>
                            <Text style={styles.greeting}>{greeting},</Text>
                            <Text style={styles.userName}>{firstName}!</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.notificationBtn}
                            onPress={() => setNotificationModalVisible(true)}
                        >
                            <Ionicons name="notifications" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Search Bar */}
                    <TouchableOpacity
                        style={[styles.searchBar, { backgroundColor: theme.card }]}
                        onPress={() => router.push('/(tabs)/buscar')}
                    >
                        <Ionicons name="search" size={20} color={theme.textMuted} />
                        <Text style={[styles.searchPlaceholder, { color: theme.textMuted }]}>Buscar instrutor...</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </View>

            {/* Content */}
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#10b981"
                        colors={['#10b981']}
                    />
                }
            >
                {/* Upcoming Lesson Card */}
                {upcomingLesson && (
                    <TouchableOpacity
                        style={styles.upcomingCard}
                        onPress={() => router.push('/(tabs)/aulas')}
                        activeOpacity={0.95}
                    >
                        <LinearGradient
                            colors={['#10b981', '#059669']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.upcomingGradient}
                        >
                            <View style={styles.upcomingContent}>
                                <View style={styles.upcomingInfo}>
                                    <Text style={styles.upcomingLabel}>Próxima Aula</Text>
                                    <Text style={styles.upcomingInstructor}>
                                        {upcomingLesson.instructor?.full_name || 'Instrutor'}
                                    </Text>
                                    <Text style={styles.upcomingDate}>
                                        {formatLessonDate(upcomingLesson.scheduled_date, upcomingLesson.scheduled_time)}
                                    </Text>
                                </View>
                                <View style={styles.upcomingIcon}>
                                    <Ionicons name="car-sport" size={40} color="rgba(255,255,255,0.9)" />
                                </View>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {/* Services Grid */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Serviços</Text>
                <View style={styles.servicesGrid}>
                    {SERVICES.map((service) => (
                        <TouchableOpacity
                            key={service.id}
                            style={styles.serviceCard}
                            onPress={() => handleServicePress(service.id)}
                        >
                            <View style={[styles.serviceIcon, { backgroundColor: `${service.color}15` }]}>
                                <Ionicons name={service.icon as any} size={24} color={service.color} />
                            </View>
                            <Text style={[styles.serviceLabel, { color: theme.textSecondary }]}>{service.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Featured Instructors */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Instrutores em Destaque</Text>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/buscar')}>
                        <Text style={styles.seeAllText}>Ver todos</Text>
                    </TouchableOpacity>
                </View>

                {featuredInstructors.length > 0 ? (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.instructorsScroll}
                        contentContainerStyle={styles.instructorsContent}
                    >
                        {featuredInstructors.map((instructor) => (
                            <TouchableOpacity
                                key={instructor.id}
                                style={[styles.instructorCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}
                                onPress={() => router.push(`/connect/instrutor/${instructor.id}`)}
                                activeOpacity={0.9}
                            >
                                <View style={styles.photoContainer}>
                                    {instructor.photo_url ? (
                                        <Image source={{ uri: instructor.photo_url }} style={styles.photo} />
                                    ) : (
                                        <View style={styles.photoPlaceholder}>
                                            <Text style={styles.photoInitial}>
                                                {instructor.full_name.charAt(0)}
                                            </Text>
                                        </View>
                                    )}
                                    {instructor.is_verified && (
                                        <View style={[styles.verifiedBadge, { backgroundColor: theme.card }]}>
                                            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                                        </View>
                                    )}
                                </View>
                                <View style={styles.cardInfo}>
                                    <Text style={[styles.instructorName, { color: theme.text }]} numberOfLines={1}>
                                        {instructor.full_name}
                                    </Text>
                                    <View style={styles.ratingRow}>
                                        <Ionicons name="star" size={12} color="#f59e0b" />
                                        <Text style={[styles.ratingText, { color: theme.textSecondary }]}>
                                            {Number(instructor.average_rating || 0).toFixed(1)}
                                        </Text>
                                    </View>
                                    <Text style={styles.priceText}>
                                        {formatPrice(instructor.price_per_lesson)}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                ) : (
                    <View style={[styles.emptyCard, { backgroundColor: theme.card }]}>
                        <Ionicons name="people-outline" size={40} color={theme.textMuted} />
                        <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                            Nenhum instrutor disponível ainda
                        </Text>
                    </View>
                )}

                {/* PWA Banner */}
                <TouchableOpacity
                    style={[styles.pwaBanner, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}
                    onPress={() => Linking.openURL('https://vrumi.com.br/dashboard')}
                >
                    <View style={[styles.pwaIcon, { backgroundColor: isDark ? theme.primaryLight : '#ecfdf5' }]}>
                        <Ionicons name="book" size={24} color="#10b981" />
                    </View>
                    <View style={styles.pwaContent}>
                        <Text style={[styles.pwaTitle, { color: theme.text }]}>Estudar para prova teórica?</Text>
                        <Text style={[styles.pwaSubtitle, { color: theme.textMuted }]}>Acesse o Vrumi Education pelo site</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                </TouchableOpacity>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Notification Modal */}
            <NotificationModal
                visible={notificationModalVisible}
                onClose={() => setNotificationModalVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Header Section
    headerSection: {
        backgroundColor: '#064e3b',
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    safeHeader: {
        paddingHorizontal: 20,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 20,
    },
    profileButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    profileAvatar: {
        width: '100%',
        height: '100%',
    },
    profileAvatarPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#10b981',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInitial: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
    userInfo: {
        flex: 1,
        marginLeft: 12,
    },
    greeting: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
    },
    userName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
    },
    notificationBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Search Bar
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 14,
        gap: 10,
    },
    searchPlaceholder: {
        fontSize: 15,
        color: '#9ca3af',
    },
    // Content
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    // Upcoming Lesson Card
    upcomingCard: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 24,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    upcomingGradient: {
        padding: 20,
    },
    upcomingContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    upcomingInfo: {
        flex: 1,
    },
    upcomingLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    upcomingInstructor: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 4,
    },
    upcomingDate: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
    },
    upcomingIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Services
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 16,
    },
    servicesGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    serviceCard: {
        alignItems: 'center',
        width: (SCREEN_WIDTH - 60) / 4,
    },
    serviceIcon: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    serviceLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4b5563',
    },
    // Section Header
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    seeAllText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#10b981',
    },
    // Instructors
    instructorsScroll: {
        marginHorizontal: -20,
    },
    instructorsContent: {
        paddingHorizontal: 20,
        gap: 12,
    },
    instructorCard: {
        width: 160,
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    photoContainer: {
        position: 'relative',
    },
    photo: {
        width: '100%',
        height: 100,
    },
    photoPlaceholder: {
        width: '100%',
        height: 100,
        backgroundColor: '#10b981',
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
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 2,
    },
    cardInfo: {
        padding: 12,
    },
    instructorName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
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
        color: '#1f2937',
    },
    priceText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#10b981',
    },
    // Empty State
    emptyCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
    },
    // PWA Banner
    pwaBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        gap: 12,
        marginTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    pwaIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#ecfdf5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pwaContent: {
        flex: 1,
    },
    pwaTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 2,
    },
    pwaSubtitle: {
        fontSize: 13,
        color: '#6b7280',
    },
});
