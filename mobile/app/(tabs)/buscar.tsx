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

export default function BuscarScreen() {
    const { theme, isDark } = useTheme();
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
                        {Number(instructor.average_rating || 0).toFixed(1)}
                    </Text>
                    <Text style={[styles.reviewCount, { color: theme.textMuted }]}>
                        ({instructor.total_reviews || 0})
                    </Text>
                </View>

                <View style={styles.categoriesRow}>
                    {instructor.categories?.slice(0, 2).map((cat) => (
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
            {/* Header - Simplified for Tab */}
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Buscar Instrutores</Text>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={[styles.filterButton, { backgroundColor: theme.card }]}
                        onPress={() => router.push('/connect/mapa')}
                    >
                        <Ionicons name="map-outline" size={20} color={theme.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.filterButton,
                            { backgroundColor: showFilters ? theme.primary : theme.card }
                        ]}
                        onPress={() => setShowFilters(!showFilters)}
                    >
                        <Ionicons
                            name="options-outline"
                            size={20}
                            color={showFilters ? '#fff' : theme.text}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
                <Ionicons name="search-outline" size={20} color={theme.textMuted} />
                <TextInput
                    style={[styles.searchInput, { color: theme.text }]}
                    placeholder="Buscar por cidade..."
                    placeholderTextColor={theme.textMuted}
                    value={searchCity}
                    onChangeText={setSearchCity}
                    onSubmitEditing={fetchInstructors}
                />
                {searchCity.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchCity('')}>
                        <Ionicons name="close-circle" size={18} color={theme.textMuted} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Filters */}
            {showFilters && (
                <View style={styles.filtersContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                        <Text style={[styles.filterLabel, { color: theme.textMuted }]}>Estado:</Text>
                        {BRAZILIAN_STATES.slice(0, 10).map((state) => (
                            <TouchableOpacity
                                key={state}
                                style={[
                                    styles.filterChip,
                                    {
                                        backgroundColor: selectedState === state ? theme.primary : theme.card,
                                        borderColor: theme.cardBorder,
                                    }
                                ]}
                                onPress={() => setSelectedState(selectedState === state ? '' : state)}
                            >
                                <Text style={{
                                    color: selectedState === state ? '#fff' : theme.text,
                                    fontSize: 13,
                                    fontWeight: '500',
                                }}>
                                    {state}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                        <Text style={[styles.filterLabel, { color: theme.textMuted }]}>Categoria:</Text>
                        {CNH_CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                style={[
                                    styles.filterChip,
                                    {
                                        backgroundColor: selectedCategory === cat ? theme.primary : theme.card,
                                        borderColor: theme.cardBorder,
                                    }
                                ]}
                                onPress={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
                            >
                                <Text style={{
                                    color: selectedCategory === cat ? '#fff' : theme.text,
                                    fontSize: 13,
                                    fontWeight: '500',
                                }}>
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {hasActiveFilters && (
                        <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                            <Text style={[styles.clearButtonText, { color: theme.primary }]}>
                                Limpar filtros
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Instructors Grid */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.instructorsGrid}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    {instructors.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="search-outline" size={48} color={theme.textMuted} />
                            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                                Nenhum instrutor encontrado
                            </Text>
                        </View>
                    ) : (
                        instructors.map(renderInstructorCard)
                    )}
                    <View style={{ height: 100 }} />
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    filterButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 14,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
    },
    filtersContainer: {
        paddingVertical: 12,
    },
    filterRow: {
        paddingHorizontal: 20,
        marginBottom: 8,
    },
    filterLabel: {
        marginRight: 10,
        fontSize: 13,
        alignSelf: 'center',
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
    },
    clearButton: {
        alignSelf: 'center',
        paddingVertical: 8,
    },
    clearButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    instructorsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 20,
        gap: 12,
        paddingTop: 16,
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
        height: CARD_WIDTH * 0.8,
    },
    photoPlaceholder: {
        width: '100%',
        height: CARD_WIDTH * 0.8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoInitial: {
        fontSize: 36,
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
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    locationText: {
        fontSize: 11,
        flex: 1,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 6,
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
        gap: 4,
        marginBottom: 8,
    },
    categoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
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
    emptyState: {
        flex: 1,
        width: SCREEN_WIDTH - 40,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        gap: 12,
    },
    emptyText: {
        fontSize: 15,
        textAlign: 'center',
    },
});
