import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Image,
    ActivityIndicator,
    Dimensions,
    StatusBar,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Instructor {
    id: string;
    full_name: string;
    photo_url: string | null;
    city: string;
    state: string;
    categories: string[];
    price_per_lesson: number;
    average_rating: number | null;
    total_reviews: number | null;
    is_verified: boolean | null;
    vehicle_model?: string | null;
    vehicle_transmission?: string | null;
}

const CNH_CATEGORIES = [
    { id: 'A', label: 'Moto', icon: 'bicycle' as const },
    { id: 'B', label: 'Carro', icon: 'car' as const },
    { id: 'AB', label: 'Moto+Carro', icon: 'car-sport' as const },
    { id: 'C', label: 'Caminhão', icon: 'bus' as const },
    { id: 'D', label: 'Ônibus', icon: 'bus' as const },
    { id: 'E', label: 'Articulado', icon: 'train' as const },
];

export default function BuscarScreen() {
    const { theme, isDark } = useTheme();
    const { user } = useAuth();
    const [profile, setProfile] = useState<{ full_name?: string | null; avatar_url?: string | null } | null>(null);
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchCity, setSearchCity] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [sortBy, setSortBy] = useState<'rating' | 'price' | 'distance'>('rating');

    const fetchInstructors = useCallback(async () => {
        try {
            let query = supabase
                .from('instructors')
                .select('id, full_name, photo_url, city, state, categories, price_per_lesson, average_rating, total_reviews, is_verified, vehicle_model, vehicle_transmission')
                .eq('status', 'approved')
                .eq('stripe_onboarding_complete', true) // Only show instructors who can receive payments
                .order(sortBy === 'price' ? 'price_per_lesson' : 'average_rating', { ascending: sortBy === 'price' });

            if (searchCity) {
                query = query.ilike('city', `%${searchCity}%`);
            }
            if (selectedCategory) {
                query = query.contains('categories', [selectedCategory]);
            }

            const { data, error } = await query.limit(10);

            if (error) throw error;
            setInstructors(data || []);
        } catch (error) {
            console.error('Error fetching instructors:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [searchCity, selectedCategory, sortBy]);

    useEffect(() => {
        fetchInstructors();
    }, [fetchInstructors]);

    useEffect(() => {
        if (user?.id) {
            supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single()
                .then(({ data }) => {
                    if (data) setProfile(data);
                });
        }
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchInstructors();
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(price);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#064e3b" />

            {/* Fixed Header Bar */}
            <View style={styles.headerBar}>
                <SafeAreaView edges={['top']} style={styles.safeHeader}>
                    <View style={styles.headerRow}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="search" size={24} color="#fff" />
                        </View>
                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.headerTitle}>Encontrar Instrutor</Text>
                            <Text style={styles.headerSubtitle}>Escolha o melhor para você</Text>
                        </View>
                        <View style={styles.weatherBadge}>
                            <Ionicons name="sunny" size={14} color="#f59e0b" />
                            <Text style={styles.weatherText}>28°C</Text>
                        </View>
                    </View>
                </SafeAreaView>
            </View>

            {/* Scrollable Content */}
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
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <Text style={styles.heroTitle}>Onde você quer{'\n'}ter sua aula?</Text>

                    {/* Search Card */}
                    <View style={[styles.searchCard, { backgroundColor: theme.card }]}>
                        <View style={styles.searchRow}>
                            <View style={styles.searchDot} />
                            <TextInput
                                style={[styles.searchInput, { color: theme.text }]}
                                placeholder="Buscar por cidade..."
                                placeholderTextColor={theme.textMuted}
                                value={searchCity}
                                onChangeText={setSearchCity}
                            />
                        </View>
                        <View style={[styles.searchDivider, { backgroundColor: theme.cardBorder }]} />
                        <View style={styles.searchRow}>
                            <View style={[styles.searchDot, styles.searchDotSecondary]} />
                            <Text style={[styles.categorySelectorText, { color: theme.textMuted }]}>
                                {selectedCategory ? `Categoria ${selectedCategory}` : 'Selecionar categoria CNH'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.findButton}
                            onPress={fetchInstructors}
                        >
                            <Ionicons name="search" size={18} color="#fff" />
                            <Text style={styles.findButtonText}>Buscar</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Content Card */}
                <View style={[styles.contentCard, { backgroundColor: theme.background }]}>
                    {/* Promo Banner */}
                    <TouchableOpacity style={[styles.promoBanner, { backgroundColor: isDark ? theme.primaryLight : '#ecfdf5' }]}>
                        <View style={styles.promoIcon}>
                            <Ionicons name="gift" size={18} color="#10b981" />
                        </View>
                        <View style={styles.promoContent}>
                            <Text style={[styles.promoTitle, { color: isDark ? theme.primaryDark : '#065f46' }]}>Primeira aula com 10% OFF!</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                    </TouchableOpacity>

                    {/* CNH Categories */}
                    <Text style={[styles.sectionLabel, { color: theme.text }]}>Categorias CNH</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.categoriesScroll}
                        contentContainerStyle={styles.categoriesContent}
                    >
                        {CNH_CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[
                                    styles.categoryCard,
                                    { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 },
                                    selectedCategory === cat.id && styles.categoryCardActive
                                ]}
                                onPress={() => setSelectedCategory(
                                    selectedCategory === cat.id ? '' : cat.id
                                )}
                            >
                                <View style={[
                                    styles.categoryIcon,
                                    { backgroundColor: isDark ? theme.card : '#f3f4f6' },
                                    selectedCategory === cat.id && styles.categoryIconActive
                                ]}>
                                    <Ionicons
                                        name={cat.icon}
                                        size={22}
                                        color={selectedCategory === cat.id ? '#fff' : theme.primary}
                                    />
                                </View>
                                <Text style={[
                                    styles.categoryLabel,
                                    { color: theme.textSecondary },
                                    selectedCategory === cat.id && styles.categoryLabelActive
                                ]}>
                                    {cat.label}
                                </Text>
                                <Text style={[
                                    styles.categoryBadge,
                                    { color: isDark ? theme.primary : '#064e3b' },
                                    selectedCategory === cat.id && styles.categoryBadgeActive
                                ]}>
                                    {cat.id}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Filter Chips */}
                    <View style={styles.filterSection}>
                        <Text style={[styles.sectionLabel, { color: theme.text }]}>Instrutores disponíveis</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.filterScroll}
                        >
                            <TouchableOpacity
                                style={[styles.filterChip, sortBy === 'rating' && styles.filterChipActive]}
                                onPress={() => setSortBy('rating')}
                            >
                                <Ionicons name="star" size={12} color={sortBy === 'rating' ? '#fff' : theme.textSecondary} />
                                <Text style={[styles.filterChipText, sortBy === 'rating' && styles.filterChipTextActive]}>Melhor avaliação</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.filterChip, sortBy === 'price' ? styles.filterChipActive : { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                                onPress={() => setSortBy('price')}
                            >
                                <Ionicons name="cash-outline" size={12} color={sortBy === 'price' ? '#fff' : theme.textSecondary} />
                                <Text style={[styles.filterChipText, sortBy === 'price' ? styles.filterChipTextActive : { color: theme.textSecondary }]}>Menor preço</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.filterChip, sortBy === 'distance' ? styles.filterChipActive : { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                                onPress={() => setSortBy('distance')}
                            >
                                <Ionicons name="location-outline" size={12} color={sortBy === 'distance' ? '#fff' : theme.textSecondary} />
                                <Text style={[styles.filterChipText, sortBy === 'distance' ? styles.filterChipTextActive : { color: theme.textSecondary }]}>Mais próximo</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>

                    {/* Instructor List */}
                    {loading ? (
                        <ActivityIndicator size="large" color="#10b981" style={{ marginVertical: 40 }} />
                    ) : instructors.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="car-outline" size={48} color={theme.textMuted} />
                            <Text style={[styles.emptyTitle, { color: theme.text }]}>Nenhum instrutor encontrado</Text>
                            <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>Tente alterar os filtros de busca</Text>
                        </View>
                    ) : (
                        <View style={styles.instructorsList}>
                            {instructors.map((instructor, index) => (
                                <TouchableOpacity
                                    key={instructor.id}
                                    style={[styles.instructorCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}
                                    onPress={() => router.push(`/connect/instrutor/${instructor.id}`)}
                                    activeOpacity={0.95}
                                >
                                    {/* Availability Badge */}
                                    <View style={[styles.availabilityBadge, { backgroundColor: isDark ? theme.primaryLight : '#ecfdf5' }]}>
                                        <View style={styles.availabilityDot} />
                                        <Text style={[styles.availabilityText, { color: isDark ? theme.primaryDark : '#065f46' }]}>Disponível hoje</Text>
                                    </View>

                                    <View style={styles.instructorRow}>
                                        {/* Photo */}
                                        <View style={styles.photoWrapper}>
                                            {instructor.photo_url ? (
                                                <Image
                                                    source={{ uri: instructor.photo_url }}
                                                    style={styles.instructorPhoto}
                                                />
                                            ) : (
                                                <View style={styles.instructorPhotoPlaceholder}>
                                                    <Text style={styles.instructorInitial}>
                                                        {instructor.full_name.charAt(0)}
                                                    </Text>
                                                </View>
                                            )}
                                            {instructor.is_verified && (
                                                <View style={[styles.verifiedBadge, { backgroundColor: theme.card }]}>
                                                    <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                                                </View>
                                            )}
                                        </View>

                                        {/* Info */}
                                        <View style={styles.instructorInfo}>
                                            <View style={styles.nameRow}>
                                                <Text style={[styles.instructorName, { color: theme.text }]} numberOfLines={1}>
                                                    {instructor.full_name}
                                                </Text>
                                                {index === 0 && (
                                                    <View style={styles.topBadge}>
                                                        <Ionicons name="trophy" size={10} color="#d97706" />
                                                        <Text style={styles.topBadgeText}>TOP</Text>
                                                    </View>
                                                )}
                                            </View>

                                            {/* Rating */}
                                            <View style={styles.ratingContainer}>
                                                <View style={styles.starsRow}>
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Ionicons
                                                            key={star}
                                                            name={star <= Math.round(instructor.average_rating || 0) ? 'star' : 'star-outline'}
                                                            size={12}
                                                            color="#f59e0b"
                                                        />
                                                    ))}
                                                </View>
                                                <Text style={[styles.ratingText, { color: theme.text }]}>
                                                    {(instructor.average_rating || 0).toFixed(1)}
                                                </Text>
                                                <Text style={[styles.reviewsText, { color: theme.textMuted }]}>
                                                    ({instructor.total_reviews || 0} avaliações)
                                                </Text>
                                            </View>

                                            {/* Location */}
                                            <View style={styles.metaRow}>
                                                <Ionicons name="location" size={13} color={theme.textSecondary} />
                                                <Text style={[styles.metaText, { color: theme.textSecondary }]}>{instructor.city}, {instructor.state}</Text>
                                                <Text style={styles.distanceText}>~2.5 km</Text>
                                            </View>

                                            {/* Vehicle */}
                                            <View style={styles.metaRow}>
                                                <Ionicons name="car" size={13} color={theme.textSecondary} />
                                                <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                                                    {instructor.vehicle_model || 'Veículo padrão'}
                                                </Text>
                                                <View style={[styles.transmissionBadge, { backgroundColor: isDark ? theme.cardBorder : '#f3f4f6' }]}>
                                                    <Text style={[styles.transmissionText, { color: theme.textSecondary }]}>
                                                        {instructor.vehicle_transmission === 'automatic' ? 'AUTO' : 'MANUAL'}
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* Categories */}
                                            <View style={styles.categoriesRow}>
                                                {(instructor.categories || ['B']).slice(0, 3).map((cat) => (
                                                    <View key={cat} style={styles.categoryChip}>
                                                        <Text style={styles.categoryChipText}>{cat}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    </View>

                                    {/* Price Footer */}
                                    <View style={[styles.priceFooter, { borderTopColor: theme.cardBorder }]}>
                                        <View style={styles.priceInfo}>
                                            <Text style={styles.priceValue}>{formatPrice(instructor.price_per_lesson)}</Text>
                                            <Text style={[styles.priceLabel, { color: theme.textMuted }]}>por aula de 50min</Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.bookButton}
                                            onPress={() => router.push(`/connect/instrutor/${instructor.id}`)}
                                        >
                                            <Text style={styles.bookButtonText}>Ver perfil</Text>
                                            <Ionicons name="arrow-forward" size={16} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <View style={{ height: 100 }} />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#064e3b',
    },
    // Fixed Header
    headerBar: {
        backgroundColor: '#064e3b',
    },
    safeHeader: {
        paddingHorizontal: 20,
        paddingBottom: 12,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    profileBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    profileImg: {
        width: '100%',
        height: '100%',
    },
    profilePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#10b981',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInitial: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        flex: 1,
        marginLeft: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 13,
        fontWeight: '400',
        color: 'rgba(255,255,255,0.7)',
        marginTop: 2,
    },
    weatherBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4,
    },
    weatherText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
    },
    // Scrollable Content
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    // Hero Section
    heroSection: {
        backgroundColor: '#064e3b',
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    heroTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#fff',
        lineHeight: 32,
        marginBottom: 16,
    },
    // Search Card
    searchCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    searchDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#10b981',
        marginRight: 12,
    },
    searchDotSecondary: {
        backgroundColor: '#d1d5db',
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#1f2937',
    },
    searchDivider: {
        height: 1,
        backgroundColor: '#f3f4f6',
        marginVertical: 4,
        marginLeft: 22,
    },
    categorySelectorText: {
        flex: 1,
        fontSize: 15,
        color: '#9ca3af',
    },
    findButton: {
        flexDirection: 'row',
        backgroundColor: '#10b981',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        gap: 8,
    },
    findButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    // Content Card
    contentCard: {
        flex: 1,
        backgroundColor: '#f9fafb',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 20,
        paddingHorizontal: 20,
        marginTop: -10,
    },
    // Promo Banner
    promoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ecfdf5',
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
    },
    promoIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#d1fae5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    promoContent: {
        flex: 1,
        marginLeft: 10,
    },
    promoTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#065f46',
    },
    // Categories
    sectionLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 12,
    },
    categoriesScroll: {
        marginHorizontal: -20,
        marginBottom: 20,
    },
    categoriesContent: {
        paddingHorizontal: 20,
        gap: 10,
    },
    categoryCard: {
        alignItems: 'center',
        width: 70,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderRadius: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    categoryCardActive: {
        backgroundColor: '#10b981',
    },
    categoryIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    categoryIconActive: {
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    categoryLabel: {
        fontSize: 10,
        color: '#6b7280',
        marginBottom: 2,
    },
    categoryLabelActive: {
        color: 'rgba(255,255,255,0.8)',
    },
    categoryBadge: {
        fontSize: 14,
        fontWeight: '800',
        color: '#064e3b',
    },
    categoryBadgeActive: {
        color: '#fff',
    },
    // Filters
    filterSection: {
        marginBottom: 16,
    },
    filterScroll: {
        marginTop: 8,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    filterChipActive: {
        backgroundColor: '#10b981',
        borderColor: '#10b981',
    },
    filterChipText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#6b7280',
    },
    filterChipTextActive: {
        color: '#fff',
    },
    // Instructor List
    instructorsList: {
        gap: 12,
    },
    instructorCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    availabilityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: '#ecfdf5',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 12,
        gap: 6,
    },
    availabilityDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10b981',
    },
    availabilityText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#065f46',
    },
    instructorRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    photoWrapper: {
        position: 'relative',
    },
    instructorPhoto: {
        width: 80,
        height: 80,
        borderRadius: 16,
    },
    instructorPhotoPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 16,
        backgroundColor: '#10b981',
        justifyContent: 'center',
        alignItems: 'center',
    },
    instructorInitial: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '700',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 1,
    },
    instructorInfo: {
        flex: 1,
        marginLeft: 14,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    instructorName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
        flex: 1,
    },
    topBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: '#fef3c7',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    topBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#d97706',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    starsRow: {
        flexDirection: 'row',
        gap: 1,
        marginRight: 6,
    },
    ratingText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1f2937',
        marginRight: 4,
    },
    reviewsText: {
        fontSize: 11,
        color: '#9ca3af',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    metaText: {
        fontSize: 12,
        color: '#6b7280',
        flex: 1,
    },
    distanceText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#10b981',
    },
    transmissionBadge: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    transmissionText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#4b5563',
    },
    categoriesRow: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 6,
    },
    categoryChip: {
        backgroundColor: '#064e3b',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    categoryChipText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#fff',
    },
    priceFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 16,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    priceInfo: {},
    priceValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#10b981',
    },
    priceLabel: {
        fontSize: 11,
        color: '#9ca3af',
    },
    bookButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#10b981',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
    },
    bookButtonText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#fff',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    priceSection: {
        alignItems: 'flex-end',
    },
    // Empty State
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
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
        marginTop: 4,
    },
});
