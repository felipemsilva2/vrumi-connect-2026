import { useState, useEffect, useCallback } from 'react';
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
import { supabase } from '../../src/lib/supabase';
import { Alert } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.45;
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
    const [cards, setCards] = useState<Flashcard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);

    const position = useState(new Animated.ValueXY())[0];

    const fetchCards = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('flashcards')
                .select('id, question, answer')
                .limit(20);

            if (error) throw error;
            setCards(data || []);
        } catch (error) {
            console.error('Error fetching flashcards:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCards();
    }, [fetchCards]);

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
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
                    useNativeDriver: false,
                }).start();
            }
        },
    });

    const handleSwipe = (direction: 'left' | 'right') => {
        const toValue = direction === 'right' ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100;

        Animated.timing(position, {
            toValue: { x: toValue, y: 0 },
            duration: 250,
            useNativeDriver: false,
        }).start(() => {
            nextCard();
        });
    };

    const nextCard = () => {
        setIsFlipped(false);
        position.setValue({ x: 0, y: 0 });
        if (currentIndex < cards.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            setCurrentIndex(0);
        }
    };

    const flipCard = () => {
        setIsFlipped(!isFlipped);
    };

    const handleDifficulty = async (difficulty: 'easy' | 'medium' | 'hard') => {
        if (!user?.id || !currentCard) return;

        const isCorrect = difficulty === 'easy';

        try {
            // Update stats in Supabase
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

            // Log activity
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

            // Show feedback and go to next card
            const messages = {
                easy: 'Este card será mostrado com menos frequência.',
                medium: 'Vamos revisar este card novamente em breve.',
                hard: 'Este card aparecerá com mais frequência.'
            };

            Alert.alert('Progresso salvo!', messages[difficulty]);

            // Record XP for gamification
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
        outputRange: ['-10deg', '0deg', '10deg'],
    });

    const cardStyle = {
        transform: [
            { translateX: position.x },
            { rotate: cardRotation },
        ],
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (cards.length === 0) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.text }]}>Flashcards</Text>
                </View>
                <View style={styles.emptyContainer}>
                    <View style={[styles.emptyIcon, { backgroundColor: theme.card }]}>
                        <Ionicons name="layers-outline" size={48} color={theme.textMuted} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: theme.text }]}>Nenhum flashcard</Text>
                    <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>Os cards serão adicionados em breve</Text>
                </View>
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
                <Text style={[styles.title, { color: theme.text }]}>Flashcards</Text>
                <View style={[styles.progressBadge, { backgroundColor: theme.primaryLight }]}>
                    <Text style={[styles.progressText, { color: theme.primary }]}>{currentIndex + 1}/{cards.length}</Text>
                </View>
            </View>

            {/* Progress Bar */}
            <View style={[styles.progressBarContainer, { backgroundColor: theme.cardBorder }]}>
                <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: theme.primary }]} />
            </View>

            {/* Card Stack */}
            <View style={styles.cardContainer}>
                <Animated.View
                    {...panResponder.panHandlers}
                    style={[styles.card, { backgroundColor: theme.card }, cardStyle]}
                >
                    <TouchableOpacity
                        style={styles.cardTouchable}
                        onPress={flipCard}
                        activeOpacity={0.95}
                    >
                        {!isFlipped ? (
                            <View style={styles.cardContent}>
                                <View style={[styles.cardLabelBadge, { backgroundColor: theme.background }]}>
                                    <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>PERGUNTA</Text>
                                </View>
                                <Text style={[styles.cardText, { color: theme.text }]}>{currentCard?.question}</Text>
                                <Text style={[styles.tapHint, { color: theme.textMuted }]}>Toque para ver resposta</Text>
                            </View>
                        ) : (
                            <View style={[styles.cardContent, { backgroundColor: isDark ? '#064e3b' : '#f0fdf4', borderRadius: 24 }]}>
                                <View style={[styles.cardLabelBadge, { backgroundColor: theme.primaryLight }]}>
                                    <Text style={[styles.cardLabel, { color: theme.primary }]}>RESPOSTA</Text>
                                </View>
                                <Text style={[styles.cardText, { color: theme.text }]}>{currentCard?.answer}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </Animated.View>
            </View>

            {/* Action Buttons - 3 Colored Difficulty Buttons */}
            <View style={styles.actionContainer}>
                {isFlipped ? (
                    <View style={styles.difficultyButtons}>
                        <TouchableOpacity
                            style={[styles.difficultyButton, styles.hardButton]}
                            onPress={() => handleDifficulty('hard')}
                        >
                            <Ionicons name="close-circle" size={20} color="#fff" />
                            <Text style={styles.difficultyButtonText}>Difícil</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.difficultyButton, styles.mediumButton]}
                            onPress={() => handleDifficulty('medium')}
                        >
                            <Ionicons name="help-circle" size={20} color="#fff" />
                            <Text style={styles.difficultyButtonText}>Médio</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.difficultyButton, styles.easyButton]}
                            onPress={() => handleDifficulty('easy')}
                        >
                            <Ionicons name="checkmark-circle" size={20} color="#fff" />
                            <Text style={styles.difficultyButtonText}>Fácil</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.flipPrompt} onPress={flipCard}>
                        <Ionicons name="sync" size={20} color={theme.primary} />
                        <Text style={[styles.flipPromptText, { color: theme.primary }]}>Toque no card para ver resposta</Text>
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
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    emptySubtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 20,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
    },
    progressBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    progressText: {
        fontSize: 14,
        fontWeight: '600',
    },
    progressBarContainer: {
        height: 4,
        marginHorizontal: 24,
        borderRadius: 2,
    },
    progressBar: {
        height: '100%',
        borderRadius: 2,
    },
    cardContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 8,
    },
    cardTouchable: {
        flex: 1,
        borderRadius: 24,
    },
    cardContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    cardLabelBadge: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 24,
    },
    cardLabel: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
    },
    cardText: {
        fontSize: 20,
        fontWeight: '500',
        textAlign: 'center',
        lineHeight: 30,
    },
    tapHint: {
        position: 'absolute',
        bottom: 32,
        fontSize: 13,
    },
    swipeHints: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: CARD_WIDTH,
        marginTop: 24,
    },
    swipeHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    swipeHintIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    swipeHintTextRed: {
        fontSize: 14,
        fontWeight: '500',
        color: '#ef4444',
    },
    swipeHintTextGreen: {
        fontSize: 14,
        fontWeight: '500',
        color: '#10b981',
    },
    actionContainer: {
        paddingHorizontal: 24,
        paddingBottom: 24,
        marginTop: 20,
    },
    nextButton: {
        flexDirection: 'row',
        backgroundColor: '#10b981',
        borderRadius: 16,
        padding: 18,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    nextButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    // Difficulty buttons styles
    difficultyButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    difficultyButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 14,
        gap: 8,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    hardButton: {
        backgroundColor: '#ef4444',
        shadowColor: '#ef4444',
    },
    mediumButton: {
        backgroundColor: '#f59e0b',
        shadowColor: '#f59e0b',
    },
    easyButton: {
        backgroundColor: '#10b981',
        shadowColor: '#10b981',
    },
    difficultyButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    flipPrompt: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
    },
    flipPromptText: {
        fontSize: 15,
        fontWeight: '500',
    },
});
