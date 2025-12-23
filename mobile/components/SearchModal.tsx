import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../src/lib/supabase';
import { router } from 'expo-router';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SearchResult {
    id: string;
    type: 'flashcard' | 'question' | 'sign';
    title: string;
    description: string;
}

interface SearchModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function SearchModal({ visible, onClose }: SearchModalProps) {
    const { theme, isDark } = useTheme();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    useEffect(() => {
        if (!visible) {
            setQuery('');
            setResults([]);
            setHasSearched(false);
        }
    }, [visible]);

    const handleSearch = async () => {
        if (!query.trim()) return;

        setLoading(true);
        setHasSearched(true);
        const searchResults: SearchResult[] = [];

        try {
            // Search flashcards
            const { data: flashcards } = await supabase
                .from('flashcards')
                .select('id, front, back')
                .or(`front.ilike.%${query}%,back.ilike.%${query}%`)
                .limit(5);

            if (flashcards) {
                flashcards.forEach((f: any) => {
                    searchResults.push({
                        id: f.id,
                        type: 'flashcard',
                        title: f.front,
                        description: f.back?.substring(0, 80) + '...' || '',
                    });
                });
            }

            // Search quiz questions
            const { data: questions } = await supabase
                .from('quiz_questions')
                .select('id, question_text')
                .ilike('question_text', `%${query}%`)
                .limit(5);

            if (questions) {
                questions.forEach((q: any) => {
                    searchResults.push({
                        id: q.id,
                        type: 'question',
                        title: q.question_text.substring(0, 60) + '...',
                        description: 'Questão de Simulado',
                    });
                });
            }

            // Search traffic signs
            const { data: signs } = await supabase
                .from('traffic_signs')
                .select('id, name, description')
                .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
                .limit(5);

            if (signs) {
                signs.forEach((s: any) => {
                    searchResults.push({
                        id: s.id,
                        type: 'sign',
                        title: s.name,
                        description: s.description?.substring(0, 80) + '...' || 'Placa de trânsito',
                    });
                });
            }

            setResults(searchResults);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResultPress = (result: SearchResult) => {
        onClose();
        switch (result.type) {
            case 'flashcard':
                router.push('/(tabs)/flashcards');
                break;
            case 'question':
                router.push('/(tabs)/simulados');
                break;
            case 'sign':
                router.push('/biblioteca');
                break;
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'flashcard':
                return 'layers';
            case 'question':
                return 'clipboard';
            case 'sign':
                return 'warning';
            default:
                return 'document';
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'flashcard':
                return 'Flashcard';
            case 'question':
                return 'Simulado';
            case 'sign':
                return 'Placa';
            default:
                return 'Conteúdo';
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
            accessibilityViewIsModal={true}
        >
            <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                <View style={[styles.container, { backgroundColor: theme.background }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text }]}>Buscar</Text>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.closeButton}
                            accessibilityLabel="Fechar busca"
                            accessibilityRole="button"
                        >
                            <Ionicons name="close" size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Search Input */}
                    <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
                        <Ionicons name="search" size={20} color={theme.textSecondary} />
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="Digite para buscar..."
                            placeholderTextColor={theme.textSecondary}
                            value={query}
                            onChangeText={setQuery}
                            onSubmitEditing={handleSearch}
                            returnKeyType="search"
                            autoFocus
                        />
                        {query.length > 0 && (
                            <TouchableOpacity onPress={() => setQuery('')}>
                                <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Search Button */}
                    <TouchableOpacity
                        style={[styles.searchButton, { backgroundColor: theme.primary }]}
                        onPress={handleSearch}
                        disabled={!query.trim()}
                    >
                        <Ionicons name="search" size={18} color="#fff" />
                        <Text style={styles.searchButtonText}>Buscar</Text>
                    </TouchableOpacity>

                    {/* Results */}
                    <ScrollView style={styles.results} showsVerticalScrollIndicator={false}>
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={theme.primary} />
                                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                                    Buscando...
                                </Text>
                            </View>
                        ) : hasSearched && results.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <View style={[styles.emptyIcon, { backgroundColor: theme.card }]}>
                                    <Ionicons name="search-outline" size={40} color={theme.textSecondary} />
                                </View>
                                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                                    Nenhum resultado encontrado
                                </Text>
                                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                                    Tente buscar por outro termo
                                </Text>
                            </View>
                        ) : (
                            results.map((result) => (
                                <TouchableOpacity
                                    key={`${result.type}-${result.id}`}
                                    style={[styles.resultItem, { backgroundColor: theme.card }]}
                                    onPress={() => handleResultPress(result)}
                                    accessibilityLabel={`${getTypeLabel(result.type)}: ${result.title}`}
                                    accessibilityRole="button"
                                    accessibilityHint="Toque para ver detalhes"
                                >
                                    <View style={[styles.resultIcon, { backgroundColor: theme.primaryLight }]}>
                                        <Ionicons name={getIcon(result.type) as any} size={20} color={theme.primary} />
                                    </View>
                                    <View style={styles.resultContent}>
                                        <View style={styles.resultHeader}>
                                            <Text style={[styles.resultTitle, { color: theme.text }]} numberOfLines={2}>
                                                {result.title}
                                            </Text>
                                            <View style={[styles.typeBadge, { backgroundColor: theme.primaryLight }]}>
                                                <Text style={[styles.typeText, { color: theme.primary }]}>
                                                    {getTypeLabel(result.type)}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={[styles.resultDescription, { color: theme.textSecondary }]} numberOfLines={1}>
                                            {result.description}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                                </TouchableOpacity>
                            ))
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    container: {
        height: SCREEN_HEIGHT * 0.85,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 4,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
        marginBottom: 16,
    },
    input: {
        flex: 1,
        fontSize: 16,
    },
    searchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        paddingVertical: 14,
        gap: 8,
        marginBottom: 20,
    },
    searchButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    results: {
        flex: 1,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingTop: 40,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 40,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        gap: 12,
    },
    resultIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    resultContent: {
        flex: 1,
    },
    resultHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 8,
        marginBottom: 4,
    },
    resultTitle: {
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    typeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    resultDescription: {
        fontSize: 13,
    },
});
