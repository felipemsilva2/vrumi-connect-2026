import { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
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
    FlatList,
    Modal,
    Platform,
    Animated,
    Share,
    Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { isLessonExpired } from '../../utils/dateUtils';
import { getTimeBasedGreeting } from '../../utils/greetingUtils';
import NotificationModal from '../../components/NotificationModal';
import { useInstructorStatus } from '../../hooks/useInstructorStatus';
import { getCache, setCache } from '../../utils/cacheUtils';
import { logError, parseError } from '../../utils/errorUtils';


// Custom Components
import ServiceItem from '../../components/vrumi/ServiceItem';
import InstructorCard from '../../components/vrumi/InstructorCard';
import InstructorContextMenu from '../../components/vrumi/InstructorContextMenu';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// --- Types ---
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

// --- Data ---
const SERVICES = [
    { id: 'aulas', icon: 'car', label: 'Praticar', color: '#10b981' },
    { id: 'teoria', icon: 'book', label: 'Estudar', color: '#3b82f6' },
    { id: 'chat', icon: 'chatbubbles', label: 'Chat', color: '#8b5cf6' },
    { id: 'agendados', icon: 'calendar', label: 'Histórico', color: '#f59e0b' },
];

const DETRAN_SERVICES = [
    { id: 'cnh-digital', icon: 'card-outline', label: 'CNH Digital', color: '#0ea5e9', url: 'https://www.gov.br/pt-br/apps/cnh-do-brasil' },
    { id: 'consulta-pontos', icon: 'analytics-outline', label: 'Pontos', color: '#ef4444', url: 'https://portalservicos.senatran.serpro.gov.br' },
    { id: 'consulta-multas', icon: 'warning-outline', label: 'Multas', color: '#f97316', url: 'https://portalservicos.senatran.serpro.gov.br' },
    { id: 'agendamento-detran', icon: 'calendar-number-outline', label: 'Agendar', color: '#6366f1' },
    { id: 'cnh-social', icon: 'people-outline', label: 'CNH Social', color: '#22c55e' },
    { id: 'clinicas-medicas', icon: 'medkit-outline', label: 'Clínicas', color: '#ec4899', url: 'https://www.google.com/maps/search/clinica+exame+medico+detran' },
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

// --- Sub-components ---

const SectionHeader = memo(({ title, actionLabel, onAction, theme }: any) => (
    <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text, fontSize: theme.typography.sizes.bodyLarge, fontWeight: theme.typography.weights.extraBold }]}>{title}</Text>
        {actionLabel && (
            <TouchableOpacity onPress={onAction} style={styles.sectionAction}>
                <Text style={[styles.sectionActionText, { color: theme.primary, fontSize: theme.typography.sizes.bodySmall, fontWeight: theme.typography.weights.semibold }]}>{actionLabel}</Text>
                <Ionicons name="chevron-forward" size={16} color={theme.primary} />
            </TouchableOpacity>
        )}
    </View>
));

export default function HomeScreen() {
    const { user } = useAuth();
    const { theme, isDark } = useTheme();
    const { isInstructor } = useInstructorStatus();
    const insets = useSafeAreaInsets();
    const scrollY = useRef(new Animated.Value(0)).current;

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [featuredInstructors, setFeaturedInstructors] = useState<Instructor[]>([]);
    const [upcomingLesson, setUpcomingLesson] = useState<UpcomingLesson | null>(null);
    const [instructorBannerDismissed, setInstructorBannerDismissed] = useState(false);
    const [stateSelectorVisible, setStateSelectorVisible] = useState(false);
    const [selectedDetranService, setSelectedDetranService] = useState<string | null>(null);
    const [contextMenuVisible, setContextMenuVisible] = useState(false);
    const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);

    const firstName = useMemo(() =>
        user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Motorista',
        [user]
    );

    const greeting = getTimeBasedGreeting();

    const fetchData = useCallback(async (isSilent = false) => {
        if (!user?.id) return;
        if (!isSilent) setLoading(true);

        try {
            const [profileRes, instructorsRes, lessonsRes] = await Promise.all([
                supabase.from('profiles').select('avatar_url').eq('id', user.id).single(),
                supabase.from('instructors').select('id, full_name, photo_url, city, state, price_per_lesson, average_rating, is_verified').eq('status', 'approved').order('average_rating', { ascending: false }).limit(4),
                supabase.from('bookings').select('id, scheduled_date, scheduled_time, instructor:instructors(full_name, photo_url)').eq('student_id', user.id).gte('scheduled_date', new Date().toISOString().split('T')[0]).in('status', ['confirmed']).order('scheduled_date', { ascending: true }).limit(5)
            ]);

            if (profileRes.error) throw profileRes.error;
            if (instructorsRes.error) throw instructorsRes.error;
            if (lessonsRes.error) throw lessonsRes.error;

            const profileAvatar = profileRes.data?.avatar_url;
            const instructors = instructorsRes.data || [];
            let upcomingData: UpcomingLesson | null = null;

            if (profileAvatar) setAvatarUrl(profileAvatar);
            setFeaturedInstructors(instructors);

            if (lessonsRes.data && lessonsRes.data.length > 0) {
                const validLesson = lessonsRes.data.find(l => !isLessonExpired(l.scheduled_date, l.scheduled_time));
                if (validLesson) {
                    const instructorData = validLesson.instructor as any;
                    upcomingData = {
                        id: validLesson.id,
                        scheduled_date: validLesson.scheduled_date,
                        scheduled_time: validLesson.scheduled_time,
                        instructor: Array.isArray(instructorData) ? instructorData[0] : instructorData || { full_name: 'Instrutor', photo_url: null },
                    };
                    setUpcomingLesson(upcomingData);
                } else setUpcomingLesson(null);
            } else setUpcomingLesson(null);

            // Save to cache for offline/instant load
            await setCache(`home_data_${user.id}`, {
                avatarUrl: profileAvatar,
                featuredInstructors: instructors,
                upcomingLesson: upcomingData
            });

        } catch (error) {
            logError(error, 'HomeScreen.fetchData');
            const appError = parseError(error);
            if (!isSilent) {
                Alert.alert(appError.message, appError.description);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => {
        const loadCacheAndFetch = async () => {
            if (!user?.id) return;

            // 1. Try to load from cache for instant UI
            const cachedData = await getCache<any>(`home_data_${user.id}`);
            if (cachedData) {
                if (cachedData.avatarUrl) setAvatarUrl(cachedData.avatarUrl);
                setFeaturedInstructors(cachedData.featuredInstructors || []);
                setUpcomingLesson(cachedData.upcomingLesson);
                setLoading(false); // Can stop loading if cache exists
            }

            // 2. Fetch fresh data in background
            fetchData(!!cachedData);
        };

        loadCacheAndFetch();

        const checkBanner = async () => {
            const dismissed = await AsyncStorage.getItem('instructor_banner_dismissed');
            if (dismissed === 'true') setInstructorBannerDismissed(true);
        };
        checkBanner();
    }, [user?.id, fetchData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    const handleServicePress = (id: string) => {
        Haptics.selectionAsync();
        switch (id) {
            case 'aulas': router.push('/(tabs)/buscar'); break;
            case 'teoria': Linking.openURL('https://www.gov.br/pt-br/apps/cnh-do-brasil'); break;
            case 'chat': router.push('/(tabs)/mensagens'); break;
            case 'agendados': router.push('/(tabs)/aulas'); break;
        }
    };

    const handleInstructorPress = (id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/connect/instrutor/${id}`);
    };

    const handleDetranServicePress = (service: any) => {
        Haptics.selectionAsync();
        if (service.url) {
            Linking.openURL(service.url);
        } else {
            setSelectedDetranService(service.id);
            setStateSelectorVisible(true);
        }
    };

    const handleStateSelect = (stateCode: string) => {
        if (!selectedDetranService) return;
        const urls = DETRAN_URLS[stateCode];
        if (urls) {
            const finalUrl = selectedDetranService === 'agendamento-detran' ? urls.agendamento : urls.cnhSocial;
            Linking.openURL(finalUrl);
        }
        setStateSelectorVisible(false);
        setSelectedDetranService(null);
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <View>
                <View style={[styles.confidenceBadge, { backgroundColor: theme.primary + '15' }]}>
                    <Ionicons name="shield-checkmark" size={12} color={theme.primary} />
                    <Text style={[styles.confidenceText, { color: theme.primary, fontSize: theme.typography.sizes.label, fontWeight: theme.typography.weights.bold }]}>Caminho Seguro Hoje</Text>
                </View>
                <Text style={[styles.greeting, { color: theme.textSecondary, fontSize: theme.typography.sizes.body, fontWeight: theme.typography.weights.medium, lineHeight: theme.typography.sizes.body * theme.typography.lineHeights.normal }]}>{greeting},</Text>
                <Text style={[styles.userName, { color: theme.text, fontSize: theme.typography.sizes.h2, fontWeight: theme.typography.weights.extraBold }]}>{firstName} 👋</Text>
            </View>
            <TouchableOpacity
                onPress={() => router.push('/(tabs)/perfil')}
                activeOpacity={0.7}
                style={styles.avatarWrapper}
            >
                {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primarySoft }]}>
                        <Ionicons name="person" size={24} color={theme.primary} />
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );

    const renderUpcomingLesson = () => {
        if (!upcomingLesson) return null;

        const date = new Date(upcomingLesson.scheduled_date + 'T00:00:00');
        const day = date.getDate();
        const month = date.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase();
        const time = upcomingLesson.scheduled_time.substring(0, 5);

        return (
            <View style={styles.section}>
                <SectionHeader title="Sua próxima aula" theme={theme} />
                <TouchableOpacity
                    style={[styles.nextLessonCard, { backgroundColor: theme.primary }]}
                    onPress={() => router.push('/(tabs)/aulas')}
                    activeOpacity={0.9}
                >
                    <View style={styles.lessonDateBadge}>
                        <Text style={[styles.lessonDay, { fontSize: theme.typography.sizes.h2, fontWeight: theme.typography.weights.extraBold }]}>{day}</Text>
                        <Text style={[styles.lessonMonth, { fontSize: theme.typography.sizes.label, fontWeight: theme.typography.weights.bold }]}>{month}</Text>
                    </View>
                    <View style={styles.lessonInfo}>
                        <Text style={styles.lessonInstructor}>{upcomingLesson.instructor.full_name}</Text>
                        <View style={styles.lessonTimeRow}>
                            <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.lessonTime}>{time}h</Text>
                            <View style={styles.lessonDot} />
                            <Text style={styles.lessonAction}>Toque para ver detalhes</Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#fff" />
                </TouchableOpacity>
            </View>
        );
    };

    const renderServiceGrid = () => (
        <View style={styles.section}>
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={SERVICES}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.horizontalScroll}
                renderItem={({ item }) => (
                    <ServiceItem
                        {...item}
                        theme={theme}
                        onPress={handleServicePress}
                    />
                )}
            />
        </View>
    );

    const renderFeaturedSection = () => (
        <View style={styles.section}>
            <SectionHeader
                title="Instrutores em destaque"
                actionLabel="Ver todos"
                onAction={() => router.push('/(tabs)/buscar')}
                theme={theme}
            />
            {loading ? (
                <ActivityIndicator color={theme.primary} style={{ margin: 20 }} />
            ) : (
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={featuredInstructors}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.horizontalScroll}
                    renderItem={({ item }) => (
                        <InstructorCard
                            instructor={item}
                            theme={theme}
                            onPress={handleInstructorPress}
                            onLongPress={handleInstructorLongPress}
                        />
                    )}
                />
            )}
        </View>
    );

    const renderDetranGrid = () => (
        <View style={styles.section}>
            <SectionHeader title="Serviços Úteis" theme={theme} />
            <View style={styles.detranGrid}>
                {DETRAN_SERVICES.map((service) => (
                    <TouchableOpacity
                        key={service.id}
                        style={[styles.detranItem, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                        onPress={() => handleDetranServicePress(service)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.detranIcon, { backgroundColor: `${service.color}10` }]}>
                            <Ionicons name={service.icon as any} size={22} color={service.color} />
                        </View>
                        <Text style={[styles.detranLabel, { color: theme.textSecondary }]} numberOfLines={1}>
                            {service.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderInstructorBanner = () => {
        if (instructorBannerDismissed || isInstructor) return null;

        return (
            <View style={styles.bannerContainer}>
                <LinearGradient
                    colors={['#10b981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.instructorBanner}
                >
                    <View style={styles.bannerContent}>
                        <Text style={styles.bannerTitle}>Ganhe dinheiro ensinando</Text>
                        <Text style={styles.bannerDesc}>Torne-se um instrutor parceiro Vrumi hoje mesmo.</Text>
                        <TouchableOpacity
                            style={styles.bannerCta}
                            onPress={() => router.push('/connect/intro-instrutor')}
                        >
                            <Text style={styles.bannerCtaText}>Saber mais</Text>
                        </TouchableOpacity>
                    </View>
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400&q=80' }}
                        style={styles.bannerImage}
                    />
                    <TouchableOpacity
                        style={styles.bannerClose}
                        onPress={async () => {
                            await AsyncStorage.setItem('instructor_banner_dismissed', 'true');
                            setInstructorBannerDismissed(true);
                        }}
                    >
                        <Ionicons name="close" size={20} color="#fff" />
                    </TouchableOpacity>
                </LinearGradient>
            </View>
        );
    };

    const handleInstructorLongPress = (id: string) => {
        const instructor = featuredInstructors.find(i => i.id === id);
        if (instructor) {
            setSelectedInstructor(instructor);
            setContextMenuVisible(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
    };

    const handleInstructorShare = async (id: string) => {
        const instructor = featuredInstructors.find(i => i.id === id);
        if (!instructor) return;

        try {
            await Share.share({
                message: `Confira o perfil de ${instructor.full_name} no Vrumi! O melhor instrutor de direção de ${instructor.city}.`,
                url: 'https://vrumi.com.br',
                title: 'Vrumi - Compartilhar Instrutor'
            });
        } catch (error) {
            logError(error, 'handleInstructorShare');
        }
    };

    const handleInstructorFavorite = (id: string) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Mocking favorite action
        Alert.alert(
            "Favoritado",
            "Este instrutor foi adicionado aos seus favoritos!"
        );
    };

    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Sticky Floating Header (iOS Glassmorphism) */}
            <Animated.View style={[
                styles.stickyHeader,
                {
                    paddingTop: insets.top,
                    opacity: headerOpacity,
                    zIndex: 10,
                }
            ]}>
                <BlurView
                    intensity={Platform.OS === 'ios' ? 90 : 0}
                    tint={isDark ? 'dark' : 'light'}
                    style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)' }]}
                />
                <View style={[styles.header, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.cardBorder }]}>
                    <Text style={[styles.userName, { color: theme.text, fontSize: theme.typography.sizes.bodyLarge, fontWeight: theme.typography.weights.extraBold }]}>Vrumi</Text>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/perfil')}>
                        <Ionicons name="person-circle" size={32} color={theme.primary} />
                    </TouchableOpacity>
                </View>
            </Animated.View>

            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                }
                contentContainerStyle={{ paddingTop: insets.top + (upcomingLesson ? 0 : 20) }}
            >
                {renderHeader()}
                {renderUpcomingLesson()}
                {renderServiceGrid()}
                {renderInstructorBanner()}
                {renderFeaturedSection()}
                {renderDetranGrid()}
                <View style={{ height: 100 }} />
            </Animated.ScrollView>

            {/* Modal de Seleção de Estado */}
            <Modal
                visible={stateSelectorVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setStateSelectorVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text, fontSize: theme.typography.sizes.h3, fontWeight: theme.typography.weights.extraBold }]}>Selecione seu Estado</Text>
                            <TouchableOpacity onPress={() => setStateSelectorVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.statesList}>
                            {Object.keys(DETRAN_URLS).map((stateCode) => (
                                <TouchableOpacity
                                    key={stateCode}
                                    style={[styles.stateItem, { borderBottomColor: theme.cardBorder }]}
                                    onPress={() => handleStateSelect(stateCode)}
                                >
                                    <Text style={[styles.stateText, { color: theme.text, fontSize: theme.typography.sizes.body, fontWeight: theme.typography.weights.semibold }]}>{stateCode}</Text>
                                    <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <InstructorContextMenu
                visible={contextMenuVisible}
                instructor={selectedInstructor}
                theme={theme}
                onClose={() => {
                    setContextMenuVisible(false);
                    setSelectedInstructor(null);
                }}
                onViewProfile={handleInstructorPress}
                onShare={handleInstructorShare}
                onFavorite={handleInstructorFavorite}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 24,
    },
    greeting: {
        fontWeight: '500',
    },
    userName: {
        fontWeight: '800',
        marginTop: 4,
    },
    avatar: {
        width: 56, // Increased to 44pt+ safe target
        height: 56,
        borderRadius: 20,
    },
    avatarPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confidenceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 4,
        marginBottom: 8,
        alignSelf: 'flex-start',
    },
    confidenceText: {
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    avatarWrapper: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    sectionTitle: {
        fontWeight: '800',
    },
    sectionAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    sectionActionText: {
        fontWeight: '600',
    },
    nextLessonCard: {
        marginHorizontal: 24,
        borderRadius: 24,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6,
    },
    lessonDateBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    lessonDay: {
        color: '#fff',
        fontWeight: '800',
    },
    lessonMonth: {
        color: '#fff',
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    lessonInfo: {
        flex: 1,
        marginLeft: 16,
    },
    lessonInstructor: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    lessonTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    lessonTime: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 4,
    },
    lessonDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.5)',
        marginHorizontal: 8,
    },
    lessonAction: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: '500',
    },
    horizontalScroll: {
        paddingLeft: 24,
        paddingRight: 8,
    },
    detranGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 20,
        gap: 12,
    },
    detranItem: {
        width: (SCREEN_WIDTH - 40 - 24) / 3,
        padding: 12,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
    },
    detranIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    detranLabel: {
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
    },
    bannerContainer: {
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    instructorBanner: {
        borderRadius: 28,
        padding: 24,
        overflow: 'hidden',
        flexDirection: 'row',
    },
    bannerContent: {
        flex: 1,
        zIndex: 1,
    },
    bannerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 8,
    },
    bannerDesc: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 16,
        lineHeight: 18,
    },
    bannerCta: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    bannerCtaText: {
        color: '#10b981',
        fontSize: 14,
        fontWeight: '700',
    },
    bannerImage: {
        position: 'absolute',
        right: -20,
        bottom: -20,
        width: 140,
        height: 140,
        opacity: 0.15,
        borderRadius: 70,
    },
    bannerClose: {
        position: 'absolute',
        top: 12,
        right: 12,
        padding: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingTop: 24,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
    },
    statesList: {
        paddingHorizontal: 24,
    },
    stateItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 18,
        borderBottomWidth: 1,
    },
    stateText: {
        fontSize: 16,
        fontWeight: '600',
    },
    stickyHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
    },
});
