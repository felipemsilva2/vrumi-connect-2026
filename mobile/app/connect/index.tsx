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
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48 - 12) / 2;

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
}

const BRAZILIAN_STATES = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const CNH_CATEGORIES = ['A', 'B', 'AB', 'C', 'D', 'E'];

export default function ConnectHomeScreen() {
    const { theme, isDark } = useTheme();
    const { user } = useAuth();
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchCity, setSearchCity] = useState('');
    const [selectedState, setSelectedState] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const fetchInstructors = useCallback(async () => {
        try {
            let query = supabase
                .from('instructors')
                .select('id, full_name, photo_url, city, state, categories, price_per_lesson, average_rating, total_reviews, is_verified')
                .eq('status', 'approved')
                .order('average_rating', { ascending: false });

            if (selectedState) {
                query = query.eq('state', selectedState);
            }
            if (searchCity) {
                query = query.ilike('city', `%${searchCity}%`);
            }
            if (selectedCategory) {
                query = query.contains('categories', [selectedCategory]);
            }

            const { data, error } = await query.limit(20);

            if (error) throw error;
            setInstructors(data || []);
        } catch (error) {
            console.error('Error fetching instructors:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedState, searchCity, selectedCategory]);

    useEffect(() => {
        fetchInstructors();
    }, [fetchInstructors]);

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

    const clearFilters = () => {
        setSelectedState('');
        setSearchCity('');
        setSelectedCategory('');
    };

    const hasActiveFilters = selectedState || searchCity || selectedCategory;

    const renderInstructorCard = (instructor: Instructor) => (
        <TouchableOpacity
            key={instructor.id}
            style={[styles.instructorCard, { backgroundColor: theme.card }]}
            onPress={() => router.push(`/connect/instrutor/${instructor.id}`)}
            activeOpacity={0.8}
        >
            {/* Photo */}
            <View style={styles.photoContainer}>
                {instructor.photo_url ? (
                    <Image
                        source={{ uri: instructor.photo_url }}
                        style={styles.photo}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.photoPlaceholder, { backgroundColor: theme.primary }]}>
                        <Text style={styles.photoInitial}>
                            {instructor.full_name.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}
                {instructor.is_verified && (
                    <View style={[styles.verifiedBadge, { backgroundColor: theme.primary }]}>
                        <Ionicons name="checkmark" size={10} color="#fff" />
                    </View>
                )}
            </View>

            {/* Info */}
            <View style={styles.cardInfo}>
                <Text style={[styles.instructorName, { color: theme.text }]} numberOfLines={1}>
                    {instructor.full_name}
                </Text>

                <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={12} color={theme.textMuted} />
                    <Text style={[styles.locationText, { color: theme.textMuted }]} numberOfLines={1}>
                        {instructor.city}, {instructor.state}
                    </Text>
                </View>

                <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color="#f59e0b" />
                    <Text style={[styles.ratingText, { color: theme.text }]}>
                        {Number(instructor.average_rating).toFixed(1)}
                    </Text>
                    <Text style={[styles.reviewCount, { color: theme.textMuted }]}>
                        ({instructor.total_reviews})
                    </Text>
                </View>

                <View style={styles.categoriesRow}>
                    {instructor.categories.slice(0, 2).map((cat) => (
                        <View
                            key={cat}
                            style={[styles.categoryBadge, { backgroundColor: theme.primaryLight }]}
                        >
                            <Text style={[styles.categoryText, { color: theme.primary }]}>{cat}</Text>
                        </View>
                    ))}
                </View>

                <Text style={[styles.priceText, { color: theme.primary }]}>
                    {formatPrice(instructor.price_per_lesson)}
                    <Text style={[styles.priceLabel, { color: theme.textMuted }]}>/aula</Text>
                </Text>
            </View>
        </TouchableOpacity>
    );

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
                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Vrumi Connect</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
                        Encontre seu instrutor
                    </Text>
                </View>
                <TouchableOpacity
                    style={[
                        styles.filterButton,
                        { backgroundColor: showFilters ? theme.primary : theme.card }
                    ]}
                    onPress={() => setShowFilters(!showFilters)}
                >
                    <Ionicons
                        name="options-outline"
                        size={22}
                        color={showFilters ? '#fff' : theme.text}
                    />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <Ionicons name="search" size={20} color={theme.textMuted} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.text }]}
                        placeholder="Buscar por cidade..."
                        placeholderTextColor={theme.textMuted}
                        value={searchCity}
                        onChangeText={setSearchCity}
                        onSubmitEditing={fetchInstructors}
                        returnKeyType="search"
                    />
                    {searchCity.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchCity('')}>
                            <Ionicons name="close-circle" size={20} color={theme.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Filters */}
            {showFilters && (
                <View style={[styles.filtersContainer, { backgroundColor: theme.card }]}>
                    <Text style={[styles.filterLabel, { color: theme.textSecondary }]}>Estado</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.filterScroll}
                    >
                        {BRAZILIAN_STATES.map((state) => (
                            <TouchableOpacity
                                key={state}
                                style={[
                                    styles.filterChip,
                                    {
                                        backgroundColor: selectedState === state
                                            ? theme.primary
                                            : theme.background,
                                        borderColor: selectedState === state
                                            ? theme.primary
                                            : theme.cardBorder,
                                    }
                                ]}
                                onPress={() => setSelectedState(selectedState === state ? '' : state)}
                            >
                                <Text style={[
                                    styles.filterChipText,
                                    { color: selectedState === state ? '#fff' : theme.text }
                                ]}>
                                    {state}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Text style={[styles.filterLabel, { color: theme.textSecondary, marginTop: 12 }]}>
                        Categoria CNH
                    </Text>
                    <View style={styles.categoryFilters}>
                        {CNH_CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                style={[
                                    styles.filterChip,
                                    {
                                        backgroundColor: selectedCategory === cat
                                            ? theme.primary
                                            : theme.background,
                                        borderColor: selectedCategory === cat
                                            ? theme.primary
                                            : theme.cardBorder,
                                    }
                                ]}
                                onPress={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
                            >
                                <Text style={[
                                    styles.filterChipText,
                                    { color: selectedCategory === cat ? '#fff' : theme.text }
                                ]}>
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {hasActiveFilters && (
                        <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                            <Ionicons name="close" size={16} color={theme.primary} />
                            <Text style={[styles.clearButtonText, { color: theme.primary }]}>
                                Limpar filtros
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Results Count */}
            <View style={styles.resultsHeader}>
                <Text style={[styles.resultsText, { color: theme.textSecondary }]}>
                    {loading ? 'Carregando...' : `${instructors.length} instrutor(es) encontrado(s)`}
                </Text>
            </View>

            {/* Instructors List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : instructors.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={[styles.emptyIcon, { backgroundColor: theme.card }]}>
                        <Ionicons name="car-outline" size={48} color={theme.textMuted} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: theme.text }]}>
                        Nenhum instrutor encontrado
                    </Text>
                    <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
                        Tente ajustar os filtros de busca
                    </Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[theme.primary]}
                            tintColor={theme.primary}
                        />
                    }
                >
                    <View style={styles.instructorsGrid}>
                        {instructors.map(renderInstructorCard)}
                    </View>
                    <View style={{ height: 24 }} />
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    headerSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    filterButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Search
    searchContainer: {
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        borderWidth: 1,
        paddingHorizontal: 16,
        height: 52,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    // Filters
    filtersContainer: {
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    filterLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
    },
    filterScroll: {
        flexDirection: 'row',
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 8,
    },
    filterChipText: {
        fontSize: 13,
        fontWeight: '500',
    },
    categoryFilters: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        gap: 6,
    },
    clearButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    // Results
    resultsHeader: {
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    resultsText: {
        fontSize: 14,
    },
    // Loading & Empty
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    emptyIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
    },
    // Grid
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
    },
    instructorsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    // Instructor Card
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
        width: '100%',
        height: 120,
        position: 'relative',
    },
    photo: {
        width: '100%',
        height: '100%',
    },
    photoPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoInitial: {
        fontSize: 40,
        fontWeight: '700',
        color: '#fff',
    },
    verifiedBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
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
        fontWeight: '700',
        marginBottom: 4,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 6,
    },
    locationText: {
        fontSize: 11,
        flex: 1,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 8,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '600',
    },
    reviewCount: {
        fontSize: 11,
    },
    categoriesRow: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 8,
    },
    categoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    categoryText: {
        fontSize: 10,
        fontWeight: '600',
    },
    priceText: {
        fontSize: 16,
        fontWeight: '700',
    },
    priceLabel: {
        fontSize: 12,
        fontWeight: '400',
    },
});
