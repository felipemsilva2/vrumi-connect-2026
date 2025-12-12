import React, { useState, useEffect, useRef } from 'react';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Sign {
    id: string;
    name: string;
    code: string;
    category: string;
    description: string;
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
    const { theme } = useTheme();
    const { user } = useAuth();
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // Animation specific
    const flipAnim = useRef(new Animated.Value(0)).current;

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

    const handleFlip = () => {
        if (isAnimating) return;
        setIsAnimating(true);

        Animated.spring(flipAnim, {
            toValue: isFlipped ? 0 : 180,
            friction: 8,
            tension: 10,
            useNativeDriver: true,
        }).start(() => {
            setIsAnimating(false);
            setIsFlipped(!isFlipped);
        });
    };

    const resetCard = (callback?: () => void) => {
        if (isFlipped) {
            setIsAnimating(true);
            Animated.spring(flipAnim, {
                toValue: 0,
                friction: 8,
                tension: 10,
                useNativeDriver: true,
            }).start(() => {
                setIsAnimating(false);
                setIsFlipped(false);
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
                <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: theme.card }]}>
                    <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.progressContainer}>
                    <Text style={[styles.progressText, { color: theme.textSecondary }]}>
                        {currentIndex + 1} / {signs.length}
                    </Text>
                    <View style={[styles.progressBarBg, { backgroundColor: theme.cardBorder }]}>
                        <View
                            style={[
                                styles.progressBarFill,
                                {
                                    backgroundColor: theme.primary,
                                    width: `${((currentIndex + 1) / signs.length) * 100}%`
                                }
                            ]}
                        />
                    </View>
                </View>
            </View>

            {/* Card Container */}
            <View style={styles.cardArea}>
                <TouchableOpacity activeOpacity={0.9} onPress={handleFlip} style={styles.cardTouchArea}>

                    {/* Front of Card */}
                    <Animated.View style={[
                        styles.card,
                        {
                            backgroundColor: theme.card,
                            transform: [{ rotateY: frontInterpolate }],
                            opacity: frontOpacity,
                            zIndex: isFlipped ? 0 : 1
                        }
                    ]}>
                        <View style={[styles.cardContent, { backgroundColor: theme.card }]}>
                            <View style={[styles.imageContainer, { borderColor: theme.cardBorder }]}>
                                {currentSign.image_url ? (
                                    <Image
                                        source={{ uri: currentSign.image_url }}
                                        style={styles.cardImage}
                                        resizeMode="contain"
                                    />
                                ) : (
                                    <View style={styles.placeholderContainer}>
                                        <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>
                                            {currentSign.code}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <Text style={[styles.cardInstruction, { color: theme.textSecondary }]}>
                                Toque para ver o significado
                            </Text>
                        </View>
                    </Animated.View>

                    {/* Back of Card */}
                    <Animated.View style={[
                        styles.card,
                        styles.cardBack,
                        {
                            backgroundColor: theme.card,
                            transform: [{ rotateY: backInterpolate }],
                            opacity: backOpacity,
                            zIndex: isFlipped ? 1 : 0
                        }
                    ]}>
                        <View style={[styles.cardContent, { backgroundColor: theme.card }]}>
                            <View style={[styles.categoryBadge, { backgroundColor: currentCategoryColor + '20' }]}>
                                <Ionicons name={categoryIcons[currentSign.category] as any} size={16} color={currentCategoryColor} />
                                <Text style={[styles.categoryText, { color: currentCategoryColor }]}>
                                    {currentSign.category}
                                </Text>
                            </View>

                            <Text style={[styles.signCode, { color: theme.textSecondary }]}>
                                {currentSign.code}
                            </Text>

                            <Text style={[styles.signName, { color: theme.text }]}>
                                {currentSign.name}
                            </Text>

                            <Text style={[styles.signDescription, { color: theme.textSecondary }]}>
                                {currentSign.description}
                            </Text>
                        </View>
                    </Animated.View>

                </TouchableOpacity>
            </View>

            {/* Controls */}
            <View style={styles.controlsArea}>
                {!isFlipped ? (
                    <View style={styles.navigationControls}>
                        <TouchableOpacity
                            style={[styles.navButton, { backgroundColor: theme.card }]}
                            onPress={handlePrevious}
                            disabled={currentIndex === 0}
                        >
                            <Ionicons name="chevron-back" size={24} color={currentIndex === 0 ? theme.textMuted : theme.text} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.flipButton, { backgroundColor: theme.primary }]}
                            onPress={handleFlip}
                        >
                            <Text style={styles.flipButtonText}>Ver Resposta</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.navButton, { backgroundColor: theme.card }]}
                            onPress={handleNext}
                            disabled={currentIndex === signs.length - 1}
                        >
                            <Ionicons name="chevron-forward" size={24} color={currentIndex === signs.length - 1 ? theme.textMuted : theme.text} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.responseControls}>
                        <TouchableOpacity
                            style={[styles.responseButton, { backgroundColor: '#fee2e2', borderColor: '#ef4444' }]}
                            onPress={() => handleDifficultyResponse('hard')}
                        >
                            <Text style={[styles.responseText, { color: '#ef4444' }]}>Errei</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.responseButton, { backgroundColor: '#fef3c7', borderColor: '#f59e0b' }]}
                            onPress={() => handleDifficultyResponse('medium')}
                        >
                            <Text style={[styles.responseText, { color: '#f59e0b' }]}>Dúvida</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.responseButton, { backgroundColor: '#dcfce7', borderColor: '#22c55e' }]}
                            onPress={() => handleDifficultyResponse('easy')}
                        >
                            <Text style={[styles.responseText, { color: '#22c55e' }]}>Acertei</Text>
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
        paddingTop: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    progressContainer: {
        flex: 1,
    },
    progressText: {
        fontSize: 12,
        marginBottom: 6,
        textAlign: 'center',
    },
    progressBarBg: {
        height: 6,
        borderRadius: 3,
        width: '100%',
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    cardArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    cardTouchArea: {
        width: '100%',
        height: 420,
        alignItems: 'center',
        justifyContent: 'center',
    },
    card: {
        width: '100%',
        height: '100%',
        borderRadius: 24,
        backfaceVisibility: 'hidden',
        position: 'absolute',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    cardBack: {

    },
    cardContent: {
        flex: 1,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageContainer: {
        width: 200,
        height: 200,
        marginBottom: 24,
        borderWidth: 1,
        borderRadius: 20,
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
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
    },
    placeholderText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    cardInstruction: {
        fontSize: 16,
        fontWeight: '500',
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 16,
        gap: 8,
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '600',
    },
    signCode: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    signName: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
    },
    signDescription: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
    controlsArea: {
        padding: 24,
        paddingBottom: 40,
    },
    navigationControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    navButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    flipButton: {
        flex: 1,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    flipButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    responseControls: {
        flexDirection: 'row',
        gap: 12,
    },
    responseButton: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
    responseText: {
        fontSize: 14,
        fontWeight: '700',
    },
});
