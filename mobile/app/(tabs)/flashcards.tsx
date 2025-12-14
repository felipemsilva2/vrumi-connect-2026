import { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Animated,
    PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useGamification } from '../../contexts/GamificationContext';
import { useCache } from '../../contexts/CacheContext';
import { supabase } from '../../src/lib/supabase';
import { Alert } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_HEIGHT = Math.min(SCREEN_HEIGHT * 0.45, 380);
const SWIPE_THRESHOLD = 100;

interface Flashcard {
    id: string;
    question: string;
    answer: string;
}

export default function FlashcardsScreen() {
    const { theme, isDark } = useTheme();
    const { user } = useAuth();
    const { recordActivity } = useGamification();
    const { isOffline, cacheFlashcards, getCachedFlashcards } = useCache();
    const [cards, setCards] = useState<Flashcard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);

    const position = useRef(new Animated.ValueXY()).current;
    const flipAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    // Flip interpolations
    const frontRotate = flipAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });
    const backRotate = flipAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['180deg', '360deg'],
    });
    const frontOpacity = flipAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 0, 0],
    });
    const backOpacity = flipAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0, 1],
    });

    const fetchCards = useCallback(async () => {
        try {
            if (isOffline) {
                const cached = await getCachedFlashcards();
                if (cached.length > 0) {
                    setCards(cached.map(c => ({ id: c.id, question: c.front, answer: c.back })));
                }
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('flashcards')
                .select('id, question, answer')
                .limit(20);

            if (error) throw error;

            const flashcards = data || [];
            setCards(flashcards);

            if (flashcards.length > 0) {
                await cacheFlashcards(flashcards.map(fc => ({
                    id: fc.id,
                    front: fc.question,
                    back: fc.answer,
                    category: 'general',
                })));
            }
        } catch (error) {
            console.error('Error fetching flashcards:', error);
            const cached = await getCachedFlashcards();
            if (cached.length > 0) {
                setCards(cached.map(c => ({ id: c.id, question: c.front, answer: c.back })));
            }
        } finally {
            setLoading(false);
        }
    }, [isOffline, cacheFlashcards, getCachedFlashcards]);

    useEffect(() => {
        fetchCards();
    }, [fetchCards]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => !isFlipped,
            onPanResponderMove: (_, gesture) => {
                position.setValue({ x: gesture.dx, y: 0 });
            },
            onPanResponderRelease: (_, gesture) => {
                if (gesture.dx > SWIPE_THRESHOLD) {
                    handleSwipe('right');
                } else if (gesture.dx < -SWIPE_THRESHOLD) {
                    handleSwipe('left');
                } else {
                    Animated.spring(position, {
                        toValue: { x: 0, y: 0 },
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    const handleSwipe = (direction: 'left' | 'right') => {
        const toValue = direction === 'right' ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100;

        Animated.timing(position, {
            toValue: { x: toValue, y: 0 },
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            nextCard();
        });
    };

    const nextCard = () => {
        setIsFlipped(false);
        flipAnim.setValue(0);
        position.setValue({ x: 0, y: 0 });
        if (currentIndex < cards.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            setCurrentIndex(0);
        }
    };

    const flipCard = () => {
        setIsFlipped(!isFlipped);

        // Scale animation
        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
        ]).start();

        Animated.spring(flipAnim, {
            toValue: isFlipped ? 0 : 1,
            friction: 6,
            tension: 25,
            useNativeDriver: true,
        }).start();
    };

    const handleDifficulty = async (difficulty: 'easy' | 'medium' | 'hard') => {
        if (!user?.id || !currentCard) return;

        const isCorrect = difficulty === 'easy';

        try {
            await supabase
                .from('user_flashcard_stats')
                .upsert({
                    user_id: user.id,
                    flashcard_id: currentCard.id,
                    times_reviewed: 1,
                    times_correct: isCorrect ? 1 : 0,
                    times_incorrect: isCorrect ? 0 : 1,
                    last_reviewed: new Date().toISOString(),
                }, {
                    onConflict: 'user_id,flashcard_id'
                });

            await supabase.from('user_activities').insert({
                user_id: user.id,
                activity_type: 'flashcard_studied',
                metadata: {
                    flashcard_id: currentCard.id,
                    correct: isCorrect,
                    difficulty: difficulty
                },
                created_at: new Date().toISOString(),
            });

            const xpAmount = isCorrect ? 10 : 5;
            await recordActivity('flashcard', xpAmount, 'Flashcard estudado');

            nextCard();
        } catch (error) {
            console.error('Error saving flashcard stats:', error);
            nextCard();
        }
    };

    const currentCard = cards[currentIndex];
    const progress = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;

    const cardRotation = position.x.interpolate({
        inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
        outputRange: ['-8deg', '0deg', '8deg'],
    });

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                        Carregando flashcards...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    if (cards.length === 0) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={[styles.backButton, { backgroundColor: theme.card }]}
                        onPress={() => router.replace('/(tabs)')}
                    >
                        <Ionicons name="arrow-back" size={22} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: theme.text }]}>Flashcards</Text>
                    <View style={{ width: 44 }} />
                </View>
                <View style={styles.emptyContainer}>
                    <View style={[styles.emptyIcon, { backgroundColor: theme.card }]}>
                        <Ionicons name="layers-outline" size={48} color={theme.textMuted} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: theme.text }]}>Nenhum flashcard</Text>
                    <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
                        Os cards serão adicionados em breve
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: theme.card }]}
                    onPress={() => router.replace('/(tabs)')}
                >
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <Text style={[styles.title, { color: theme.text }]}>Flashcards</Text>
                    <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                        {currentIndex + 1} de {cards.length}
                    </Text>
                </View>

                <View style={[styles.offlineBadge, { opacity: isOffline ? 1 : 0 }]}>
                    <Ionicons name="cloud-offline-outline" size={18} color={theme.warning} />
                </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressWrapper}>
                <View style={[styles.progressBar, { backgroundColor: theme.cardBorder }]}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${progress}%`, backgroundColor: theme.primary }
                        ]}
                    />
                </View>
            </View>

            {/* Card Stack */}
            <View style={styles.cardContainer}>
                <Animated.View
                    {...panResponder.panHandlers}
                    style={[
                        styles.cardWrapper,
                        {
                            transform: [
                                { translateX: position.x },
                                { rotate: cardRotation },
                                { scale: scaleAnim },
                            ],
                        },
                    ]}
                >
                    {/* Front */}
                    <Animated.View
                        style={[
                            styles.card,
                            {
                                backgroundColor: theme.card,
                                transform: [{ rotateY: frontRotate }],
                                opacity: frontOpacity,
                            },
                        ]}
                    >
                        <TouchableOpacity
                            style={styles.cardTouchable}
                            onPress={flipCard}
                            activeOpacity={0.98}
                        >
                            <View style={styles.cardContent}>
                                <View style={[styles.labelBadge, { backgroundColor: theme.primaryLight }]}>
                                    <Text style={[styles.labelText, { color: theme.primary }]}>PERGUNTA</Text>
                                </View>
                                <Text style={[styles.cardText, { color: theme.text }]}>
                                    {currentCard?.question}
                                </Text>
                                <View style={styles.hintRow}>
                                    <Ionicons name="hand-left-outline" size={14} color={theme.textMuted} />
                                    <Text style={[styles.hintText, { color: theme.textMuted }]}>
                                        Toque para ver a resposta
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Back */}
                    <Animated.View
                        style={[
                            styles.card,
                            styles.cardBack,
                            {
                                backgroundColor: isDark ? '#064e3b' : '#ecfdf5',
                                transform: [{ rotateY: backRotate }],
                                opacity: backOpacity,
                            },
                        ]}
                    >
                        <TouchableOpacity
                            style={styles.cardTouchable}
                            onPress={flipCard}
                            activeOpacity={0.98}
                        >
                            <View style={styles.cardContent}>
                                <View style={[styles.labelBadge, { backgroundColor: theme.primary + '30' }]}>
                                    <Text style={[styles.labelText, { color: theme.primary }]}>RESPOSTA</Text>
                                </View>
                                <Text style={[styles.cardText, { color: isDark ? '#fff' : theme.text }]}>
                                    {currentCard?.answer}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                </Animated.View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
                {isFlipped ? (
                    <View style={styles.difficultyRow}>
                        <TouchableOpacity
                            style={[styles.difficultyButton, styles.difficultyHard]}
                            onPress={() => handleDifficulty('hard')}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="close" size={24} color="#fff" />
                            <Text style={styles.difficultyText}>Difícil</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.difficultyButton, styles.difficultyMedium]}
                            onPress={() => handleDifficulty('medium')}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="help" size={24} color="#fff" />
                            <Text style={styles.difficultyText}>Médio</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.difficultyButton, styles.difficultyEasy]}
                            onPress={() => handleDifficulty('easy')}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="checkmark" size={24} color="#fff" />
                            <Text style={styles.difficultyText}>Fácil</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={[styles.flipButton, { backgroundColor: theme.primary }]}
                        onPress={flipCard}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="eye-outline" size={20} color="#fff" />
                        <Text style={styles.flipButtonText}>Ver Resposta</Text>
                    </TouchableOpacity>
                )}
            </View>
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
        fontSize: 15,
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
    title: {
        fontSize: 18,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    offlineBadge: {
        width: 44,
        alignItems: 'center',
    },
    // Progress
    progressWrapper: {
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    // Empty State
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
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 15,
        textAlign: 'center',
    },
    // Card
    cardContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    cardWrapper: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
    },
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 24,
        position: 'absolute',
        backfaceVisibility: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 8,
    },
    cardBack: {},
    cardTouchable: {
        flex: 1,
        borderRadius: 24,
    },
    cardContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 28,
    },
    labelBadge: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 24,
    },
    labelText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.5,
    },
    cardText: {
        fontSize: 20,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 30,
    },
    hintRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        position: 'absolute',
        bottom: 28,
    },
    hintText: {
        fontSize: 13,
        fontWeight: '500',
    },
    // Actions
    actionsContainer: {
        paddingHorizontal: 24,
        paddingBottom: 32,
        paddingTop: 16,
    },
    flipButton: {
        height: 58,
        borderRadius: 29,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    flipButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    // Difficulty
    difficultyRow: {
        flexDirection: 'row',
        gap: 12,
    },
    difficultyButton: {
        flex: 1,
        height: 64,
        borderRadius: 16,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    difficultyHard: {
        backgroundColor: '#ef4444',
        shadowColor: '#ef4444',
    },
    difficultyMedium: {
        backgroundColor: '#f59e0b',
        shadowColor: '#f59e0b',
    },
    difficultyEasy: {
        backgroundColor: '#22c55e',
        shadowColor: '#22c55e',
    },
    difficultyText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
});
