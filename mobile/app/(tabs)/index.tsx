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
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { isLessonExpired } from '../../utils/dateUtils';
import { getTimeBasedGreeting } from '../../utils/greetingUtils';
import NotificationModal from '../../components/NotificationModal';
import { useInstructorStatus } from '../../hooks/useInstructorStatus';

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

const DETRAN_SERVICES = [
    {
        id: 'cnh-digital',
        icon: 'card',
        label: 'CNH Digital',
        color: '#0ea5e9',
        url: 'https://www.gov.br/pt-br/apps/cnh-do-brasil'
    },
    {
        id: 'consulta-pontos',
        icon: 'analytics',
        label: 'Consultar Pontos',
        color: '#ef4444',
        url: 'https://portalservicos.senatran.serpro.gov.br'
    },
    {
        id: 'consulta-multas',
        icon: 'warning',
        label: 'Consultar Multas',
        color: '#f97316',
        url: 'https://portalservicos.senatran.serpro.gov.br'
    },
    {
        id: 'agendamento-detran',
        icon: 'calendar-number',
        label: 'Agendar DETRAN',
        color: '#6366f1',
        url: null // Will open state selector
    },
    {
        id: 'cnh-social',
        icon: 'people',
        label: 'CNH Social',
        color: '#22c55e',
        url: null // Will open state selector
    },
    {
        id: 'clinicas-medicas',
        icon: 'medkit',
        label: 'Clínicas Médicas',
        color: '#ec4899',
        url: 'https://www.google.com/maps/search/clinica+exame+medico+detran'
    },
];

const DETRAN_URLS: Record<string, { agendamento: string; cnhSocial: string }> = {
    'AC': { agendamento: 'https://detran.ac.gov.br', cnhSocial: 'https://detran.ac.gov.br/cnh-social' },
    'AL': { agendamento: 'https://www.detran.al.gov.br', cnhSocial: 'https://www.detran.al.gov.br/cnh-social' },
    'AM': { agendamento: 'https://www.detran.am.gov.br', cnhSocial: 'https://www.detran.am.gov.br' },
    'AP': { agendamento: 'https://www.detran.ap.gov.br', cnhSocial: 'https://www.detran.ap.gov.br' },
    'BA': { agendamento: 'https://www.detran.ba.gov.br', cnhSocial: 'https://www.detran.ba.gov.br/cnh-popular' },
    'CE': { agendamento: 'https://www.detran.ce.gov.br', cnhSocial: 'https://www.detran.ce.gov.br' },
    'DF': { agendamento: 'https://www.detran.df.gov.br', cnhSocial: 'https://www.detran.df.gov.br' },
    'ES': { agendamento: 'https://www.detran.es.gov.br', cnhSocial: 'https://www.detran.es.gov.br' },
    'GO': { agendamento: 'https://www.detran.go.gov.br', cnhSocial: 'https://www.detran.go.gov.br/cnh-social' },
    'MA': { agendamento: 'https://www.detran.ma.gov.br', cnhSocial: 'https://www.detran.ma.gov.br/cnh-social' },
    'MG': { agendamento: 'https://www.detran.mg.gov.br', cnhSocial: 'https://www.detran.mg.gov.br' },
    'MS': { agendamento: 'https://www.detran.ms.gov.br', cnhSocial: 'https://www.detran.ms.gov.br' },
    'MT': { agendamento: 'https://www.detran.mt.gov.br', cnhSocial: 'https://www.detran.mt.gov.br' },
    'PA': { agendamento: 'https://www.detran.pa.gov.br', cnhSocial: 'https://www.detran.pa.gov.br/cnh-pai-degua' },
    'PB': { agendamento: 'https://www.detran.pb.gov.br', cnhSocial: 'https://www.detran.pb.gov.br' },
    'PE': { agendamento: 'https://www.detran.pe.gov.br', cnhSocial: 'https://www.detran.pe.gov.br' },
    'PI': { agendamento: 'https://www.detran.pi.gov.br', cnhSocial: 'https://www.detran.pi.gov.br' },
    'PR': { agendamento: 'https://www.detran.pr.gov.br', cnhSocial: 'https://www.detran.pr.gov.br' },
    'RJ': { agendamento: 'https://www.detran.rj.gov.br', cnhSocial: 'https://www.detran.rj.gov.br' },
    'RN': { agendamento: 'https://www.detran.rn.gov.br', cnhSocial: 'https://www.detran.rn.gov.br' },
    'RO': { agendamento: 'https://www.detran.ro.gov.br', cnhSocial: 'https://www.detran.ro.gov.br' },
    'RR': { agendamento: 'https://www.detran.rr.gov.br', cnhSocial: 'https://www.detran.rr.gov.br/cnh-cidada' },
    'RS': { agendamento: 'https://www.detran.rs.gov.br', cnhSocial: 'https://www.detran.rs.gov.br/cnh-social' },
    'SC': { agendamento: 'https://www.detran.sc.gov.br', cnhSocial: 'https://www.detran.sc.gov.br' },
    'SE': { agendamento: 'https://www.detran.se.gov.br', cnhSocial: 'https://www.detran.se.gov.br' },
    'SP': { agendamento: 'https://www.detran.sp.gov.br', cnhSocial: 'https://www.detran.sp.gov.br' },
    'TO': { agendamento: 'https://www.detran.to.gov.br', cnhSocial: 'https://www.detran.to.gov.br/cnh-cidada' },
};

export default function HomeScreen() {
    const { user } = useAuth();
    const { theme, isDark } = useTheme();
    const { instructorInfo } = useInstructorStatus();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [notificationModalVisible, setNotificationModalVisible] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [featuredInstructors, setFeaturedInstructors] = useState<Instructor[]>([]);
    const [upcomingLesson, setUpcomingLesson] = useState<UpcomingLesson | null>(null);

    const firstName = user?.user_metadata?.full_name?.split(' ')[0] ||
        user?.email?.split('@')[0] ||
        'Motorista';

    const greeting = getTimeBasedGreeting();

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
                Linking.openURL('https://www.vrumi.com.br');
                break;
            case 'simulado':
                Linking.openURL('https://www.vrumi.com.br');
                break;
            case 'agendados':
                router.push('/(tabs)/aulas');
                break;
        }
    };

    const [stateSelectorVisible, setStateSelectorVisible] = useState(false);
    const [selectedDetranService, setSelectedDetranService] = useState<string | null>(null);

    const handleDetranServicePress = (service: typeof DETRAN_SERVICES[0]) => {
        if (service.url) {
            Linking.openURL(service.url);
        } else {
            // Open state selector for agendamento-detran or cnh-social
            setSelectedDetranService(service.id);
            setStateSelectorVisible(true);
        }
    };

    const handleStateSelect = (stateCode: string) => {
        setStateSelectorVisible(false);
        const urls = DETRAN_URLS[stateCode];
        if (urls) {
            if (selectedDetranService === 'agendamento-detran') {
                Linking.openURL(urls.agendamento);
            } else if (selectedDetranService === 'cnh-social') {
                Linking.openURL(urls.cnhSocial);
            }
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

                {/* Services Grid - All services in one section */}
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
                    {DETRAN_SERVICES.map((service) => (
                        <TouchableOpacity
                            key={service.id}
                            style={styles.serviceCard}
                            onPress={() => handleDetranServicePress(service)}
                        >
                            <View style={[styles.serviceIcon, { backgroundColor: `${service.color}15` }]}>
                                <Ionicons name={service.icon as any} size={24} color={service.color} />
                            </View>
                            <Text style={[styles.serviceLabel, { color: theme.textSecondary }]}>{service.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Become Instructor CTA - Show if not instructor */}
                {!instructorInfo && (
                    <TouchableOpacity
                        style={styles.ctaCard}
                        onPress={() => router.push('/connect/intro-instrutor')}
                        activeOpacity={0.95}
                    >
                        <LinearGradient
                            colors={['#7e22ce', '#6b21a8']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.ctaGradient}
                        >
                            <View style={styles.ctaContent}>
                                <View style={styles.ctaInfo}>
                                    <Text style={styles.ctaTitle}>Torne-se um Instrutor</Text>
                                    <Text style={styles.ctaSubtitle}>
                                        Faça uma renda extra ensinando novos motoristas com seu próprio veículo.
                                    </Text>
                                    <View style={styles.ctaButton}>
                                        <Text style={styles.ctaButtonText}>Começar agora</Text>
                                        <Ionicons name="arrow-forward" size={16} color="#7e22ce" />
                                    </View>
                                </View>
                                <View style={styles.ctaIcon}>
                                    <Ionicons name="school" size={48} color="rgba(255,255,255,0.9)" />
                                </View>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                )}

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

            {/* State Selector Modal */}
            <Modal
                visible={stateSelectorVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setStateSelectorVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>
                                Selecione seu Estado
                            </Text>
                            <TouchableOpacity onPress={() => setStateSelectorVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.stateList}>
                            {Object.keys(DETRAN_URLS).map((stateCode) => (
                                <TouchableOpacity
                                    key={stateCode}
                                    style={[styles.stateItem, { borderBottomColor: theme.cardBorder }]}
                                    onPress={() => handleStateSelect(stateCode)}
                                >
                                    <Text style={[styles.stateText, { color: theme.text }]}>
                                        {stateCode}
                                    </Text>
                                    <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
    // CTA Card
    ctaCard: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 32,
        shadowColor: '#7e22ce',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    ctaGradient: {
        padding: 24,
    },
    ctaContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    ctaInfo: {
        flex: 1,
        marginRight: 16,
    },
    ctaTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 8,
    },
    ctaSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 16,
        lineHeight: 20,
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        alignSelf: 'flex-start',
        gap: 6,
    },
    ctaButtonText: {
        color: '#7e22ce',
        fontWeight: '700',
        fontSize: 14,
    },
    ctaIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // DETRAN Services Styles
    detranServicesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    detranServiceCard: {
        width: (SCREEN_WIDTH - 48) / 3,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    detranServiceIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    detranServiceLabel: {
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 14,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 16,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    stateList: {
        paddingHorizontal: 20,
    },
    stateItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    stateText: {
        fontSize: 16,
        fontWeight: '500',
    },
});
