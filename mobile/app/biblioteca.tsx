import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Dimensions,
    Image,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../src/lib/supabase';
import FlashcardMode from '../components/traffic-signs/FlashcardMode';
import TimedChallenge from '../components/traffic-signs/TimedChallenge';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Sign {
    id: string;
    name: string;
    code: string;
    category: string;
    description: string;
    image_url: string | null;
}

export default function BibliotecaScreen() {
    const { theme } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSign, setSelectedSign] = useState<Sign | null>(null);
    const [signs, setSigns] = useState<Sign[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
    const [mode, setMode] = useState<'view' | 'flashcards' | 'challenge'>('view');

    const categories = ['Todas', 'Regulamentação', 'Advertência', 'Serviços Auxiliares', 'Indicação', 'Obras'];

    useEffect(() => {
        fetchSigns();
    }, []);

    const fetchSigns = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('traffic_signs')
                .select('*')
                .order('code');

            if (error) throw error;
            setSigns(data || []);
        } catch (error) {
            console.error('Erro ao carregar placas:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredSigns = signs.filter(sign => {
        const matchesSearch = sign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sign.code.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'Todas' || sign.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'Regulamentação': return '#ef4444';
            case 'Advertência': return '#f59e0b';
            case 'Serviços Auxiliares': return '#3b82f6';
            case 'Indicação': return '#22c55e';
            case 'Obras': return '#f97316';
            default: return '#64748b';
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'Regulamentação': return 'stop-circle';
            case 'Advertência': return 'warning';
            case 'Serviços Auxiliares': return 'business';
            case 'Indicação': return 'checkmark-circle';
            case 'Obras': return 'construct';
            default: return 'help-circle';
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                        Carregando placas...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // Render Game Modes
    if (mode === 'flashcards') {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
                <FlashcardMode
                    signs={filteredSigns.length > 0 ? filteredSigns : signs}
                    onClose={() => setMode('view')}
                    category={selectedCategory !== 'Todas' ? selectedCategory : undefined}
                />
            </SafeAreaView>
        );
    }

    if (mode === 'challenge') {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
                <TimedChallenge
                    signs={signs}
                    category={selectedCategory}
                    onClose={() => setMode('view')}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.card }]} onPress={() => router.replace('/(tabs)')}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Biblioteca de Placas</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Stats */}
                <View style={styles.statsContainer}>
                    <View style={[styles.statBadge, { backgroundColor: theme.primary + '20' }]}>
                        <Text style={[styles.statNumber, { color: theme.primary }]}>{signs.length}</Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>placas</Text>
                    </View>
                </View>

                {/* Feature Buttons */}
                <View style={styles.featuresRow}>
                    <TouchableOpacity
                        style={[styles.featureCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                        onPress={() => setMode('flashcards')}
                    >
                        <View style={[styles.featureIcon, { backgroundColor: '#e0f2fe' }]}>
                            <Ionicons name="documents" size={24} color="#0ea5e9" />
                        </View>
                        <View>
                            <Text style={[styles.featureTitle, { color: theme.text }]}>Flashcards</Text>
                            <Text style={[styles.featureSubtitle, { color: theme.textSecondary }]}>Estudar e decorar</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.featureCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                        onPress={() => setMode('challenge')}
                    >
                        <View style={[styles.featureIcon, { backgroundColor: '#fef3c7' }]}>
                            <Ionicons name="stopwatch" size={24} color="#f59e0b" />
                        </View>
                        <View>
                            <Text style={[styles.featureTitle, { color: theme.text }]}>Desafio 60s</Text>
                            <Text style={[styles.featureSubtitle, { color: theme.textSecondary }]}>Teste rápido</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <View style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                        <Ionicons name="search" size={20} color={theme.textMuted} />
                        <TextInput
                            style={[styles.searchInput, { color: theme.text }]}
                            placeholder="Buscar placa..."
                            placeholderTextColor={theme.textMuted}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={20} color={theme.textMuted} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Category Filter */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoryScroll}
                    contentContainerStyle={styles.categoryContainer}
                >
                    {categories.map((category) => (
                        <TouchableOpacity
                            key={category}
                            style={[
                                styles.categoryChip,
                                {
                                    backgroundColor: selectedCategory === category
                                        ? theme.primary
                                        : theme.card,
                                    borderColor: selectedCategory === category
                                        ? theme.primary
                                        : theme.cardBorder,
                                }
                            ]}
                            onPress={() => setSelectedCategory(category)}
                        >
                            <Text style={[
                                styles.categoryChipText,
                                {
                                    color: selectedCategory === category
                                        ? '#fff'
                                        : theme.text
                                }
                            ]}>
                                {category}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={styles.separator} />

                {/* Signs List */}
                <Text style={[styles.resultCount, { color: theme.textSecondary }]}>
                    {filteredSigns.length} placas encontradas
                </Text>

                <View style={styles.signsGrid}>
                    {filteredSigns.map((sign) => (
                        <TouchableOpacity
                            key={sign.id}
                            style={[styles.signCard, { backgroundColor: theme.card }]}
                            onPress={() => setSelectedSign(sign)}
                            activeOpacity={0.8}
                        >
                            {/* Sign Image */}
                            <View style={[styles.signImageContainer, { backgroundColor: theme.background }]}>
                                {sign.image_url ? (
                                    <Image
                                        source={{ uri: sign.image_url }}
                                        style={styles.signImage}
                                        resizeMode="contain"
                                    />
                                ) : (
                                    <View style={[styles.signPlaceholder, { backgroundColor: getCategoryColor(sign.category) + '20' }]}>
                                        <Text style={[styles.signPlaceholderText, { color: getCategoryColor(sign.category) }]}>
                                            {sign.code}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Sign Info */}
                            <View style={styles.signInfo}>
                                <Text style={[styles.signCode, { color: theme.textSecondary }]}>{sign.code}</Text>
                                <Text style={[styles.signName, { color: theme.text }]} numberOfLines={2}>
                                    {sign.name}
                                </Text>
                                <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(sign.category) + '20' }]}>
                                    <Text style={[styles.categoryText, { color: getCategoryColor(sign.category) }]}>
                                        {sign.category}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Sign Detail Modal */}
            {selectedSign && (
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.modalBackdrop}
                        activeOpacity={1}
                        onPress={() => setSelectedSign(null)}
                    />
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <TouchableOpacity
                            style={[styles.closeButton, { backgroundColor: theme.background }]}
                            onPress={() => setSelectedSign(null)}
                        >
                            <Ionicons name="close" size={24} color={theme.text} />
                        </TouchableOpacity>

                        {/* Modal Image */}
                        <View style={[styles.modalImageContainer, { backgroundColor: theme.background }]}>
                            {selectedSign.image_url ? (
                                <Image
                                    source={{ uri: selectedSign.image_url }}
                                    style={styles.modalImage}
                                    resizeMode="contain"
                                />
                            ) : (
                                <View style={[styles.modalPlaceholder, { backgroundColor: getCategoryColor(selectedSign.category) + '20' }]}>
                                    <Text style={[styles.modalPlaceholderText, { color: getCategoryColor(selectedSign.category) }]}>
                                        {selectedSign.code}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <Text style={[styles.modalCode, { color: theme.textSecondary }]}>{selectedSign.code}</Text>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>{selectedSign.name}</Text>

                        <View style={[styles.modalCategoryBadge, { backgroundColor: getCategoryColor(selectedSign.category) + '20' }]}>
                            <Ionicons
                                name={getCategoryIcon(selectedSign.category) as any}
                                size={16}
                                color={getCategoryColor(selectedSign.category)}
                            />
                            <Text style={[styles.modalCategoryText, { color: getCategoryColor(selectedSign.category) }]}>
                                {selectedSign.category}
                            </Text>
                        </View>

                        <Text style={[styles.modalDescription, { color: theme.textSecondary }]}>
                            {selectedSign.description || 'Sem descrição disponível.'}
                        </Text>
                    </View>
                </View>
            )}
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
        gap: 12,
    },
    loadingText: {
        fontSize: 16,
    },
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
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    statNumber: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 14,
    },
    featuresRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 24,
    },
    featureCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        gap: 12,
    },
    featureIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureTitle: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    featureSubtitle: {
        fontSize: 12,
    },
    searchContainer: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 52,
        gap: 12,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    categoryScroll: {
        maxHeight: 44,
    },
    categoryContainer: {
        paddingHorizontal: 20,
        gap: 8,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    categoryChipText: {
        fontSize: 14,
        fontWeight: '500',
    },
    separator: {
        height: 20,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 0,
    },
    resultCount: {
        fontSize: 14,
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    signsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        paddingHorizontal: 20,
    },
    signCard: {
        width: (SCREEN_WIDTH - 52) / 2,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    signImageContainer: {
        width: '100%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    signImage: {
        width: '100%',
        height: '100%',
    },
    signPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    signPlaceholderText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    signInfo: {
        padding: 12,
    },
    signCode: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    signName: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        lineHeight: 18,
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    categoryText: {
        fontSize: 10,
        fontWeight: '600',
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        zIndex: 100,
    },
    modalBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    modalContent: {
        borderRadius: 24,
        padding: 24,
        width: '100%',
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    modalImageContainer: {
        width: 160,
        height: 160,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        padding: 16,
    },
    modalImage: {
        width: '100%',
        height: '100%',
    },
    modalPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
    },
    modalPlaceholderText: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    modalCode: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
    },
    modalCategoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 16,
    },
    modalCategoryText: {
        fontSize: 14,
        fontWeight: '600',
    },
    modalDescription: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
});
