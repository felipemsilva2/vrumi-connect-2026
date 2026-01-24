import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    Image,
    ActivityIndicator,
    Dimensions,
    StatusBar,
    RefreshControl,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';

// Components
import InstructorListItem from '../../components/vrumi/InstructorListItem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// --- Types ---
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

// --- Data ---
const CNH_CATEGORIES = [
    { id: 'A', label: 'Moto', icon: 'bicycle-outline' as const },
    { id: 'B', label: 'Carro', icon: 'car-outline' as const },
    { id: 'AB', label: 'Moto+Carro', icon: 'car-sport-outline' as const },
    { id: 'D', label: 'Ônibus', icon: 'bus-outline' as const },
];

const FilterChip = memo(({ label, icon, active, onPress, theme }: any) => (
    <TouchableOpacity
        style={[
            styles.filterChip,
            { backgroundColor: active ? theme.primary : theme.card, borderColor: active ? theme.primary : theme.cardBorder }
        ]}
        onPress={() => {
            Haptics.selectionAsync();
            onPress();
        }}
        activeOpacity={0.7}
    >
        <Ionicons name={icon} size={15} color={active ? '#fff' : theme.textSecondary} />
        <Text style={[styles.filterChipText, { color: active ? '#fff' : theme.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
));

export default function BuscarScreen() {
    const { theme, isDark } = useTheme();
    const { user } = useAuth();

    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchCity, setSearchCity] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [sortBy, setSortBy] = useState<'rating' | 'price'>('rating');

    const fetchInstructors = useCallback(async () => {
        try {
            let query = supabase
                .from('instructors')
                .select('id, full_name, photo_url, city, state, categories, price_per_lesson, average_rating, total_reviews, is_verified, vehicle_model, vehicle_transmission')
                .eq('status', 'approved')
                .order(sortBy === 'price' ? 'price_per_lesson' : 'average_rating', { ascending: sortBy === 'price' });

            if (searchCity) query = query.ilike('city', `%${searchCity}%`);
            if (selectedCategory) query = query.contains('categories', [selectedCategory]);

            const { data, error } = await query.limit(20);
            if (error) throw error;
            setInstructors(data || []);
        } catch (error) {
            console.error('Error fetching instructors:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [searchCity, selectedCategory, sortBy]);

    useFocusEffect(
        useCallback(() => {
            fetchInstructors();
        }, [fetchInstructors])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchInstructors();
    }, [fetchInstructors]);

    const handleInstructorPress = useCallback((id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/connect/instrutor/${id}`);
    }, []);

    const toggleCategory = (catId: string) => {
        Haptics.selectionAsync();
        setSelectedCategory(selectedCategory === catId ? '' : catId);
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Buscar Instrutores</Text>

            <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <Ionicons name="search" size={20} color={theme.textMuted} style={styles.searchIcon} />
                <TextInput
                    style={[styles.searchInput, { color: theme.text }]}
                    placeholder="Cidade ou região..."
                    placeholderTextColor={theme.textMuted}
                    value={searchCity}
                    onChangeText={setSearchCity}
                />
                {searchCity.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchCity('')}>
                        <Ionicons name="close-circle" size={18} color={theme.textMuted} />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.categoriesSection}>
                <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>Categorias CNH</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesList}>
                    {CNH_CATEGORIES.map(cat => (
                        <TouchableOpacity
                            key={cat.id}
                            style={[
                                styles.categoryItem,
                                { backgroundColor: theme.card, borderColor: selectedCategory === cat.id ? theme.primary : theme.cardBorder }
                            ]}
                            onPress={() => toggleCategory(cat.id)}
                        >
                            <View style={[styles.categoryIcon, { backgroundColor: selectedCategory === cat.id ? theme.primarySoft : isDark ? theme.background : '#f3f4f6' }]}>
                                <Ionicons name={cat.icon} size={20} color={selectedCategory === cat.id ? theme.primary : theme.textSecondary} />
                            </View>
                            <Text style={[styles.categoryText, { color: selectedCategory === cat.id ? theme.primary : theme.textSecondary }]}>{cat.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <View style={styles.filtersRow}>
                <FilterChip
                    label="Melhor Avaliação"
                    icon="star"
                    active={sortBy === 'rating'}
                    onPress={() => setSortBy('rating')}
                    theme={theme}
                />
                <FilterChip
                    label="Menor Preço"
                    icon="cash-outline"
                    active={sortBy === 'price'}
                    onPress={() => setSortBy('price')}
                    theme={theme}
                />
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            <FlatList
                data={instructors}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={renderHeader}
                renderItem={({ item }) => (
                    <InstructorListItem
                        instructor={item}
                        theme={theme}
                        onPress={() => handleInstructorPress(item.id)}
                    />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="search-outline" size={64} color={theme.textMuted} />
                            <Text style={[styles.emptyTitle, { color: theme.text }]}>Nenhum instrutor encontrado</Text>
                            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>Tente ajustar os filtros de busca.</Text>
                        </View>
                    ) : null
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        paddingBottom: 40,
        paddingHorizontal: 24,
    },
    header: {
        paddingTop: 16,
        paddingBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 24,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 56,
        borderRadius: 18,
        borderWidth: 1,
        marginBottom: 24,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },
    categoriesSection: {
        marginBottom: 24,
    },
    sectionSubtitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    categoriesList: {
        gap: 12,
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14, // Increased for 48pt+ touch target
        borderRadius: 16,
        borderWidth: 1,
        gap: 8,
    },
    categoryIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryText: {
        fontSize: 13,
        fontWeight: '700',
    },
    filtersRow: {
        flexDirection: 'row',
        gap: 10,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 14, // Increased for 48pt+ touch target
        borderRadius: 18,
        borderWidth: 1,
        gap: 6,
    },
    filterChipText: {
        fontSize: 13,
        fontWeight: '700',
    },
    emptyContainer: {
        paddingTop: 60,
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
    },
});
