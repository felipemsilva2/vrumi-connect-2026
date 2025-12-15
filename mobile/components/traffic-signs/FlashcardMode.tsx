import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Image,
    Dimensions,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_HEIGHT = Math.min(SCREEN_HEIGHT * 0.5, 400);

interface Sign {
    id: string;
    name: string;
    code: string;
    category: string;
    description: string | null;
    image_url: string | null;
}

interface FlashcardModeProps {
    signs: Sign[];
    initialIndex?: number;
    onClose: () => void;
    category?: string;
}

const categoryColors: Record<string, string> = {
    'Regulamentação': '#ef4444',
    'Advertência': '#f59e0b',
    'Serviços Auxiliares': '#3b82f6',
    'Indicação': '#22c55e',
    'Obras': '#f97316',
};

const categoryIcons: Record<string, string> = {
    'Regulamentação': 'stop-circle',
    'Advertência': 'warning',
    'Serviços Auxiliares': 'business',
    'Indicação': 'checkmark-circle',
    'Obras': 'construct',
};

export default function FlashcardMode({ signs, initialIndex = 0, onClose, category }: FlashcardModeProps) {
    const { theme, isDark } = useTheme();
    const { user } = useAuth();
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    const flipAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    // Interpolations
    const frontInterpolate = flipAnim.interpolate({
        inputRange: [0, 180],
        outputRange: ['0deg', '180deg'],
    });

    const backInterpolate = flipAnim.interpolate({
        inputRange: [0, 180],
        outputRange: ['180deg', '360deg'],
    });

    const frontOpacity = flipAnim.interpolate({
        inputRange: [89, 90],
        outputRange: [1, 0]
    });

    const backOpacity = flipAnim.interpolate({
        inputRange: [89, 90],
        outputRange: [0, 1]
    });

    const currentSign = signs[currentIndex];
    const progress = signs.length > 0 ? ((currentIndex + 1) / signs.length) * 100 : 0;

    const handleFlip = () => {
        if (isAnimating) return;

        setIsFlipped(!isFlipped);
        setIsAnimating(true);

        // Subtle scale animation on flip
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();

        Animated.spring(flipAnim, {
            toValue: isFlipped ? 0 : 180,
            friction: 6,
            tension: 25,
            useNativeDriver: true,
        }).start(() => {
            setIsAnimating(false);
        });
    };

    const resetCard = (callback?: () => void) => {
        if (isFlipped) {
            setIsAnimating(true);
            setIsFlipped(false);
            Animated.timing(flipAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start(() => {
                setIsAnimating(false);
                if (callback) callback();
            });
        } else {
            if (callback) callback();
        }
    };

    const handleNext = () => {
        if (isAnimating) return;
        resetCard(() => {
            setCurrentIndex((prev) => (prev < signs.length - 1 ? prev + 1 : 0));
        });
    };

    const handlePrevious = () => {
        if (isAnimating) return;
        resetCard(() => {
            setCurrentIndex((prev) => (prev > 0 ? prev - 1 : signs.length - 1));
        });
    };

    const handleDifficultyResponse = async (response: 'easy' | 'medium' | 'hard') => {
        if (!user) {
            Alert.alert("Erro", "Você precisa estar logado para salvar o progresso.");
            return;
        }

        try {
            const { error } = await supabase.rpc('update_user_sign_progress', {
                p_user_id: user.id,
                p_sign_id: currentSign.id,
                p_correct: response === 'easy'
            });

            if (error) {
                console.error('Erro ao atualizar progresso:', error);
            }

            handleNext();

        } catch (error) {
            console.error('Erro ao processar resposta:', error);
        }
    };

    if (!currentSign) return null;

    const currentCategoryColor = categoryColors[currentSign.category] || '#64748b';

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={onClose}
                    style={[styles.closeButton, { backgroundColor: theme.card }]}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="close" size={22} color={theme.text} />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Flashcards</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
                        {currentIndex + 1} de {signs.length}
                    </Text>
                </View>

                <View style={{ width: 44 }} />
            </View>

            {/* Progress Bar */}
            <View style={styles.progressWrapper}>
                <View style={[styles.progressBarBg, { backgroundColor: theme.cardBorder }]}>
                    <View
                        style={[
                            styles.progressBarFill,
                            { backgroundColor: theme.primary, width: `${progress}%` }
                        ]}
                    />
                </View>
            </View>

            {/* Card Container */}
            <View style={styles.cardArea}>
                <TouchableOpacity
                    activeOpacity={0.95}
                    onPress={handleFlip}
                    style={styles.cardTouchArea}
                >
                    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                        {/* Front of Card - Image */}
                        <Animated.View style={[
                            styles.card,
                            {
                                backgroundColor: theme.card,
                                transform: [{ rotateY: frontInterpolate }],
                                opacity: frontOpacity,
                            }
                        ]}>
                            <View style={styles.cardInner}>
                                {/* Category Badge */}
                                <View style={[styles.categoryBadgeSmall, { backgroundColor: currentCategoryColor + '20' }]}>
                                    <Text style={[styles.categoryBadgeText, { color: currentCategoryColor }]}>
                                        {currentSign.category}
                                    </Text>
                                </View>

                                {/* Sign Image */}
                                <View style={[styles.imageContainer, { backgroundColor: isDark ? theme.background : '#f8fafc' }]}>
                                    {currentSign.image_url ? (
                                        <Image
                                            source={{ uri: currentSign.image_url }}
                                            style={styles.cardImage}
                                            resizeMode="contain"
                                        />
                                    ) : (
                                        <View style={[styles.placeholderContainer, { backgroundColor: currentCategoryColor + '20' }]}>
                                            <Text style={[styles.placeholderText, { color: currentCategoryColor }]}>
                                                {currentSign.code}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* Hint */}
                                <View style={styles.hintContainer}>
                                    <Ionicons name="hand-left-outline" size={16} color={theme.textMuted} />
                                    <Text style={[styles.hintText, { color: theme.textMuted }]}>
                                        Toque para ver a resposta
                                    </Text>
                                </View>
                            </View>
                        </Animated.View>

                        {/* Back of Card - Answer */}
                        <Animated.View style={[
                            styles.card,
                            styles.cardBack,
                            {
                                backgroundColor: theme.card,
                                transform: [{ rotateY: backInterpolate }],
                                opacity: backOpacity,
                            }
                        ]}>
                            <View style={styles.cardInner}>
                                {/* Category Badge */}
                                <View style={[styles.categoryBadge, { backgroundColor: currentCategoryColor + '20' }]}>
                                    <Ionicons
                                        name={categoryIcons[currentSign.category] as any}
                                        size={18}
                                        color={currentCategoryColor}
                                    />
                                    <Text style={[styles.categoryText, { color: currentCategoryColor }]}>
                                        {currentSign.category}
                                    </Text>
                                </View>

                                {/* Code */}
                                <Text style={[styles.signCode, { color: theme.textSecondary }]}>
                                    {currentSign.code}
                                </Text>

                                {/* Name */}
                                <Text style={[styles.signName, { color: theme.text }]}>
                                    {currentSign.name}
                                </Text>

                                {/* Description */}
                                <Text style={[styles.signDescription, { color: theme.textSecondary }]}>
                                    {currentSign.description || 'Sem descrição disponível.'}
                                </Text>
                            </View>
                        </Animated.View>
                    </Animated.View>
                </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsArea}>
                {!isFlipped ? (
                    // Navigation when not flipped
                    <View style={styles.navigationRow}>
                        <TouchableOpacity
                            style={[
                                styles.navButton,
                                { backgroundColor: theme.card },
                                currentIndex === 0 && styles.navButtonDisabled
                            ]}
                            onPress={handlePrevious}
                            disabled={currentIndex === 0}
                        >
                            <Ionicons
                                name="chevron-back"
                                size={24}
                                color={currentIndex === 0 ? theme.textMuted : theme.text}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.mainButton, { backgroundColor: theme.primary }]}
                            onPress={handleFlip}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="eye-outline" size={20} color="#fff" />
                            <Text style={styles.mainButtonText}>Ver Resposta</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.navButton,
                                { backgroundColor: theme.card },
                                currentIndex === signs.length - 1 && styles.navButtonDisabled
                            ]}
                            onPress={handleNext}
                            disabled={currentIndex === signs.length - 1}
                        >
                            <Ionicons
                                name="chevron-forward"
                                size={24}
                                color={currentIndex === signs.length - 1 ? theme.textMuted : theme.text}
                            />
                        </TouchableOpacity>
                    </View>
                ) : (
                    // Difficulty buttons when flipped
                    <View style={styles.difficultyRow}>
                        <TouchableOpacity
                            style={[styles.difficultyButton, styles.difficultyHard]}
                            onPress={() => handleDifficultyResponse('hard')}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="close" size={22} color="#fff" />
                            <Text style={styles.difficultyText}>Errei</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.difficultyButton, styles.difficultyMedium]}
                            onPress={() => handleDifficultyResponse('medium')}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="help" size={22} color="#fff" />
                            <Text style={styles.difficultyText}>Dúvida</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.difficultyButton, styles.difficultyEasy]}
                            onPress={() => handleDifficultyResponse('easy')}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="checkmark" size={22} color="#fff" />
                            <Text style={styles.difficultyText}>Acertei</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
    },
    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 16,
    },
    closeButton: {
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
        fontSize: 13,
        marginTop: 2,
    },
    // Progress
    progressWrapper: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    progressBarBg: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    // Card Area
    cardArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    cardTouchArea: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
    },
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 24,
        backfaceVisibility: 'hidden',
        position: 'absolute',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
    },
    cardBack: {},
    cardInner: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Front Card
    categoryBadgeSmall: {
        position: 'absolute',
        top: 20,
        right: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    categoryBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    imageContainer: {
        width: 180,
        height: 180,
        borderRadius: 20,
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    placeholderContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
    },
    placeholderText: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    hintContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
    },
    hintText: {
        fontSize: 14,
        fontWeight: '500',
    },
    // Back Card
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 16,
        gap: 8,
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '600',
    },
    signCode: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    signName: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 28,
    },
    signDescription: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 8,
    },
    // Actions
    actionsArea: {
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 16,
    },
    navigationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    navButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    navButtonDisabled: {
        opacity: 0.5,
    },
    mainButton: {
        flex: 1,
        height: 56,
        borderRadius: 28,
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
    mainButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    // Difficulty Buttons
    difficultyRow: {
        flexDirection: 'row',
        gap: 12,
    },
    difficultyButton: {
        flex: 1,
        height: 60,
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
