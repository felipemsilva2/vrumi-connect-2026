import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Animated,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useGamification } from '../../contexts/GamificationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingSlide {
    id: number;
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    iconBg: string;
    title: string;
    description: string;
}

const SLIDES: OnboardingSlide[] = [
    {
        id: 1,
        icon: 'car-sport',
        iconColor: '#10b981',
        iconBg: '#ecfdf5',
        title: 'Bem-vindo ao Vrumi! 🚗',
        description: 'Sua jornada para a CNH começa aqui. Vamos te ajudar a estudar de forma inteligente e eficiente.',
    },
    {
        id: 2,
        icon: 'flame',
        iconColor: '#f97316',
        iconBg: '#fff7ed',
        title: 'Mantenha seu Streak 🔥',
        description: 'Estude todos os dias para manter sua sequência. Quanto maior o streak, mais motivado você fica!',
    },
    {
        id: 3,
        icon: 'star',
        iconColor: '#eab308',
        iconBg: '#fefce8',
        title: 'Ganhe XP e Suba de Nível ⭐',
        description: 'Cada atividade te dá pontos de experiência. Evolua de Aprendiz até Mestre do Trânsito!',
    },
];

const GOAL_OPTIONS = [
    { minutes: 5, label: 'Relaxado', emoji: '🐢', description: '5 min/dia' },
    { minutes: 10, label: 'Regular', emoji: '🚶', description: '10 min/dia' },
    { minutes: 15, label: 'Sério', emoji: '🏃', description: '15 min/dia' },
    { minutes: 20, label: 'Intenso', emoji: '🚀', description: '20 min/dia' },
];

const ONBOARDING_KEY = '@vrumi_onboarding_complete';

export default function OnboardingScreen() {
    const { theme, isDark } = useTheme();
    const { updateDailyGoal } = useGamification();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [selectedGoal, setSelectedGoal] = useState<number | null>(null);
    const [showGoalSelection, setShowGoalSelection] = useState(false);

    const fadeAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;

    const animateTransition = (callback: () => void) => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: -50,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start(() => {
            callback();
            slideAnim.setValue(50);
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        });
    };

    const handleNext = () => {
        if (currentSlide < SLIDES.length - 1) {
            animateTransition(() => setCurrentSlide(currentSlide + 1));
        } else {
            setShowGoalSelection(true);
        }
    };

    const handleSkip = () => {
        setShowGoalSelection(true);
    };

    const handleComplete = async () => {
        if (selectedGoal !== null) {
            await updateDailyGoal(selectedGoal);
        }

        // Mark onboarding as complete
        await AsyncStorage.setItem(ONBOARDING_KEY, 'true');

        // Navigate to main app
        router.replace('/(tabs)');
    };

    const currentSlideData = SLIDES[currentSlide];

    if (showGoalSelection) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.content}>
                    <View style={styles.goalHeader}>
                        <View style={[styles.iconContainer, { backgroundColor: '#dbeafe' }]}>
                            <Ionicons name="flag" size={48} color="#3b82f6" />
                        </View>
                        <Text style={[styles.title, { color: theme.text }]}>
                            Defina sua Meta Diária 🎯
                        </Text>
                        <Text style={[styles.description, { color: theme.textSecondary }]}>
                            Quanto tempo você quer dedicar aos estudos por dia?
                        </Text>
                    </View>

                    <View style={styles.goalOptions}>
                        {GOAL_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.minutes}
                                style={[
                                    styles.goalCard,
                                    {
                                        backgroundColor: theme.card,
                                        borderColor: selectedGoal === option.minutes
                                            ? theme.primary
                                            : theme.cardBorder,
                                        borderWidth: selectedGoal === option.minutes ? 2 : 1,
                                    }
                                ]}
                                onPress={() => setSelectedGoal(option.minutes)}
                            >
                                <Text style={styles.goalEmoji}>{option.emoji}</Text>
                                <View style={styles.goalTextContainer}>
                                    <Text style={[styles.goalLabel, { color: theme.text }]}>
                                        {option.label}
                                    </Text>
                                    <Text style={[styles.goalDescription, { color: theme.textSecondary }]}>
                                        {option.description}
                                    </Text>
                                </View>
                                {selectedGoal === option.minutes && (
                                    <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.completeButton,
                            {
                                backgroundColor: selectedGoal ? theme.primary : theme.cardBorder,
                            }
                        ]}
                        onPress={handleComplete}
                        disabled={!selectedGoal}
                    >
                        <Text style={styles.completeButtonText}>Começar a Estudar!</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleSkip}>
                    <Text style={[styles.skipText, { color: theme.textSecondary }]}>Pular</Text>
                </TouchableOpacity>
            </View>

            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateX: slideAnim }],
                    }
                ]}
            >
                <View style={[styles.iconContainer, { backgroundColor: currentSlideData.iconBg }]}>
                    <Ionicons
                        name={currentSlideData.icon}
                        size={64}
                        color={currentSlideData.iconColor}
                    />
                </View>

                <Text style={[styles.title, { color: theme.text }]}>
                    {currentSlideData.title}
                </Text>

                <Text style={[styles.description, { color: theme.textSecondary }]}>
                    {currentSlideData.description}
                </Text>
            </Animated.View>

            <View style={styles.footer}>
                <View style={styles.dotsContainer}>
                    {SLIDES.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                {
                                    backgroundColor: index === currentSlide
                                        ? theme.primary
                                        : theme.cardBorder,
                                    width: index === currentSlide ? 24 : 8,
                                }
                            ]}
                        />
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.nextButton, { backgroundColor: theme.primary }]}
                    onPress={handleNext}
                >
                    <Text style={styles.nextButtonText}>
                        {currentSlide === SLIDES.length - 1 ? 'Escolher Meta' : 'Próximo'}
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    skipText: {
        fontSize: 16,
        fontWeight: '500',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    iconContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        gap: 8,
    },
    dot: {
        height: 8,
        borderRadius: 4,
    },
    nextButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: 16,
        gap: 8,
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    // Goal Selection Styles
    goalHeader: {
        alignItems: 'center',
        marginBottom: 32,
    },
    goalOptions: {
        width: '100%',
        gap: 12,
        marginBottom: 32,
    },
    goalCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 16,
    },
    goalEmoji: {
        fontSize: 32,
    },
    goalTextContainer: {
        flex: 1,
    },
    goalLabel: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 2,
    },
    goalDescription: {
        fontSize: 14,
    },
    completeButton: {
        width: '100%',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    completeButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
});
