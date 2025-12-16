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
    StatusBar,
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
    vehicle_model?: string;
    vehicle_transmission?: string;
}

const CNH_CATEGORIES = [
    { id: 'A', label: 'Moto', icon: 'bicycle-outline' as const },
    { id: 'B', label: 'Carro', icon: 'car-outline' as const },
    { id: 'C', label: 'Caminhão', icon: 'bus-outline' as const },
    { id: 'D', label: 'Ônibus', icon: 'bus' as const },
    { id: 'E', label: 'Articulado', icon: 'train-outline' as const },
];

export default function ConnectHomeScreen() {
    const { theme, isDark } = useTheme();
    const { user, profile } = useAuth();
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchCity, setSearchCity] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    const fetchInstructors = useCallback(async () => {
        try {
            let query = supabase
                .from('instructors')
                .select('id, full_name, photo_url, city, state, categories, price_per_lesson, average_rating, total_reviews, is_verified, vehicle_model, vehicle_transmission')
                .eq('status', 'approved')
                .order('average_rating', { ascending: false });

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
    }, [searchCity, selectedCategory]);

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

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
    };

    const firstName = profile?.full_name?.split(' ')[0] || 'Aluno';

    const renderInstructorCard = (instructor: Instructor, index: number) => (
        <TouchableOpacity
            key={instructor.id}
            style={styles.instructorCard}
            onPress={() => router.push(`/connect/instrutor/${instructor.id}`)}
            activeOpacity={0.9}
        >
            {/* Photo */}
            <View style={styles.instructorPhotoContainer}>
                {instructor.photo_url ? (
                    <Image
                        source={{ uri: instructor.photo_url }}
                        style={styles.instructorPhoto}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.instructorPhotoPlaceholder, { backgroundColor: '#10b981' }]}>
                        <Text style={styles.instructorInitial}>
                            {instructor.full_name.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}
            </View>

            {/* Info */}
            <View style={styles.instructorInfo}>
                <View style={styles.instructorHeader}>
                    <Text style={styles.instructorName} numberOfLines={1}>
                        {instructor.full_name}
                    </Text>
                    {instructor.is_verified && (
                        <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                        </View>
                    )}
                </View>

                <View style={styles.instructorMeta}>
                    <Ionicons name="location" size={12} color="#9ca3af" />
                    <Text style={styles.instructorLocation}>
                        {instructor.city}, {instructor.state}
                    </Text>
                </View>

                {instructor.vehicle_model && (
                    <View style={styles.instructorMeta}>
                        <Ionicons name="car-sport" size={12} color="#9ca3af" />
                        <Text style={styles.instructorVehicle}>
                            {instructor.vehicle_model} • {instructor.vehicle_transmission === 'automatic' ? 'Automático' : 'Manual'}
                        </Text>
                    </View>
                )}

                <View style={styles.instructorFooter}>
                    <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={14} color="#f59e0b" />
                        <Text style={styles.ratingText}>
                            {(instructor.average_rating || 0).toFixed(1)}
                        </Text>
                        <Text style={styles.reviewCount}>
                            ({instructor.total_reviews || 0})
                        </Text>
                    </View>
                    <Text style={styles.priceText}>
                        {formatPrice(instructor.price_per_lesson)}
                    </Text>
                </View>
            </View>

            {/* Arrow */}
            <View style={styles.arrowContainer}>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#064e3b" />

            {/* Dark Green Header */}
            <View style={styles.headerSection}>
                <SafeAreaView edges={['top']} style={styles.safeHeader}>
                    {/* Top Bar */}
                    <View style={styles.topBar}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.back()}
                        >
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.userInfo}>
                            <Text style={styles.greeting}>{getGreeting()},</Text>
                            <Text style={styles.userName}>{firstName}</Text>
                        </View>
                        <TouchableOpacity style={styles.profileButton}>
                            {profile?.avatar_url ? (
                                <Image
                                    source={{ uri: profile.avatar_url }}
                                    style={styles.profileAvatar}
                                />
                            ) : (
                                <View style={styles.profileAvatarPlaceholder}>
                                    <Ionicons name="person" size={18} color="#064e3b" />
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Hero Text */}
                    <Text style={styles.heroTitle}>Encontre seu{'\n'}instrutor ideal</Text>

                    {/* Search Card */}
                    <View style={styles.searchCard}>
                        <View style={styles.searchInputContainer}>
                            <Ionicons name="location-outline" size={20} color="#9ca3af" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Digite sua cidade..."
                                placeholderTextColor="#9ca3af"
                                value={searchCity}
                                onChangeText={setSearchCity}
                            />
                        </View>
                        <View style={styles.searchDivider} />
                        <View style={styles.searchInputContainer}>
                            <Ionicons name="car-outline" size={20} color="#9ca3af" />
                            <Text style={styles.categoryPlaceholder}>
                                {selectedCategory ? `Categoria ${selectedCategory}` : 'Selecione a categoria'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.searchButton}
                            onPress={fetchInstructors}
                        >
                            <Text style={styles.searchButtonText}>Buscar Instrutores</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>

            {/* Content */}
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#10b981"
                        colors={['#10b981']}
                    />
                }
            >
                {/* Categories */}
                <Text style={styles.sectionTitle}>Categorias CNH</Text>
                <View style={styles.categoriesGrid}>
                    {CNH_CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            style={[
                                styles.categoryCard,
                                selectedCategory === cat.id && styles.categoryCardActive,
                            ]}
                            onPress={() => setSelectedCategory(
                                selectedCategory === cat.id ? '' : cat.id
                            )}
                        >
                            <View style={[
                                styles.categoryIcon,
                                selectedCategory === cat.id && styles.categoryIconActive,
                            ]}>
                                <Ionicons
                                    name={cat.icon}
                                    size={24}
                                    color={selectedCategory === cat.id ? '#fff' : '#064e3b'}
                                />
                            </View>
                            <Text style={[
                                styles.categoryLabel,
                                selectedCategory === cat.id && styles.categoryLabelActive,
                            ]}>
                                {cat.label}
                            </Text>
                            <Text style={styles.categoryBadge}>{cat.id}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Instructors */}
                <View style={styles.instructorsHeader}>
                    <Text style={styles.sectionTitle}>Instrutores disponíveis</Text>
                    {instructors.length > 0 && (
                        <Text style={styles.instructorCount}>
                            {instructors.length} encontrado(s)
                        </Text>
                    )}
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#10b981" />
                    </View>
                ) : instructors.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIcon}>
                            <Ionicons name="search-outline" size={48} color="#9ca3af" />
                        </View>
                        <Text style={styles.emptyTitle}>Nenhum instrutor encontrado</Text>
                        <Text style={styles.emptySubtitle}>
                            Tente buscar em outra cidade ou categoria
                        </Text>
                    </View>
                ) : (
                    <View style={styles.instructorsList}>
                        {instructors.map(renderInstructorCard)}
                    </View>
                )}

                <View style={{ height: 32 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    // Header Section
    headerSection: {
        backgroundColor: '#064e3b',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        paddingBottom: 80,
    },
    safeHeader: {
        paddingHorizontal: 20,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
        marginBottom: 24,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    userInfo: {
        flex: 1,
        marginLeft: 16,
    },
    greeting: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
    },
    userName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    profileButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
    },
    profileAvatar: {
        width: '100%',
        height: '100%',
    },
    profileAvatarPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
        lineHeight: 40,
        marginBottom: 24,
    },
    // Search Card
    searchCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: -60,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1f2937',
    },
    categoryPlaceholder: {
        flex: 1,
        fontSize: 16,
        color: '#9ca3af',
    },
    searchDivider: {
        height: 1,
        backgroundColor: '#e5e7eb',
    },
    searchButton: {
        backgroundColor: '#10b981',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 16,
    },
    searchButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    // Content
    content: {
        flex: 1,
        marginTop: 20,
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingTop: 60,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 16,
    },
    // Categories
    categoriesGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 28,
    },
    categoryCard: {
        width: (SCREEN_WIDTH - 40 - 32) / 5,
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 16,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    categoryCardActive: {
        backgroundColor: '#064e3b',
    },
    categoryIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#ecfdf5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    categoryIconActive: {
        backgroundColor: '#10b981',
    },
    categoryLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#6b7280',
        marginBottom: 2,
    },
    categoryLabelActive: {
        color: '#fff',
    },
    categoryBadge: {
        fontSize: 12,
        fontWeight: '800',
        color: '#064e3b',
    },
    // Instructors
    instructorsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    instructorCount: {
        fontSize: 14,
        color: '#6b7280',
    },
    instructorsList: {
        gap: 12,
    },
    instructorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    instructorPhotoContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        overflow: 'hidden',
    },
    instructorPhoto: {
        width: '100%',
        height: '100%',
    },
    instructorPhotoPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    instructorInitial: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
    },
    instructorInfo: {
        flex: 1,
        marginLeft: 12,
    },
    instructorHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    instructorName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
        flex: 1,
    },
    verifiedBadge: {
        marginLeft: 4,
    },
    instructorMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 2,
    },
    instructorLocation: {
        fontSize: 12,
        color: '#6b7280',
    },
    instructorVehicle: {
        fontSize: 12,
        color: '#6b7280',
    },
    instructorFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 6,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
    },
    reviewCount: {
        fontSize: 12,
        color: '#9ca3af',
    },
    priceText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#10b981',
    },
    arrowContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    // Loading & Empty
    loadingContainer: {
        paddingVertical: 48,
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 48,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
    },
});
