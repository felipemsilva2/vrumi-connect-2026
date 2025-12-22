import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedScrollHandler,
    interpolate,
    withSpring,
    withTiming,
    Extrapolation,
    FadeInDown,
    FadeInUp
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BENEFITS = [
    {
        id: 'earnings',
        icon: 'cash',
        title: 'Renda Extra Garantida',
        description: 'Ganhe até R$ 4.000/mês dando aulas no seu tempo livre com seu veículo.',
        color: '#10b981',
    },
    {
        id: 'flexibility',
        icon: 'time',
        title: 'Liberdade Total',
        description: 'Você define seus horários, dias de trabalho e o preço da sua hora/aula.',
        color: '#3b82f6',
    },
    {
        id: 'app',
        icon: 'phone-portrait',
        title: 'Gestão Completa',
        description: 'App exclusivo para gerenciar agendamentos, alunos e pagamentos.',
        color: '#8b5cf6',
    },
    {
        id: 'security',
        icon: 'shield-checkmark',
        title: 'Segurança',
        description: 'Alunos verificados e pagamentos processados via Stripe com garantia de recebimento.',
        color: '#ef4444',
    },
];

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function IntroInstrutorScreen() {
    const { theme, isDark } = useTheme();
    const scrollY = useSharedValue(0);
    const contentOpacity = useSharedValue(0);
    const floatY = useSharedValue(100);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    useEffect(() => {
        contentOpacity.value = withTiming(1, { duration: 800 });
        floatY.value = withSpring(0, { damping: 15 });
    }, []);

    const headerStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateY: interpolate(
                        scrollY.value,
                        [-100, 0, 100],
                        [-50, 0, 50], // Parallax effect
                        Extrapolation.CLAMP
                    ),
                },
                {
                    scale: interpolate(
                        scrollY.value,
                        [-100, 0],
                        [1.2, 1], // Zoom on bounce
                        Extrapolation.CLAMP
                    ),
                },
            ],
        };
    });

    const contentStyle = useAnimatedStyle(() => {
        return {
            opacity: contentOpacity.value,
            transform: [{ translateY: floatY.value }],
        };
    });

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle="light-content" backgroundColor="#7e22ce" />

            <Animated.ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
            >
                {/* Parallax Hero Section */}
                <Animated.View style={[styles.heroContainer, headerStyle]}>
                    <LinearGradient
                        colors={['#7e22ce', '#6b21a8']}
                        style={styles.hero}
                    >
                        <SafeAreaView edges={['top']} style={styles.safeArea}>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => router.back()}
                            >
                                <Ionicons name="arrow-back" size={24} color="#fff" />
                            </TouchableOpacity>

                            <View style={styles.heroContent}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="school" size={48} color="#7e22ce" />
                                </View>
                                <Text style={styles.heroTitle}>Torne-se um Instrutor Vrumi</Text>
                                <Text style={styles.heroSubtitle}>
                                    Transforme seu carro em uma ferramenta de renda e ajude novos motoristas.
                                </Text>
                            </View>
                        </SafeAreaView>

                        {/* Curve Detail */}
                        <View style={[styles.curve, { backgroundColor: theme.background }]} />
                    </LinearGradient>
                </Animated.View>

                {/* Content with Entry Animation */}
                <Animated.View style={[styles.content, contentStyle]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Por que ser um instrutor?</Text>

                    <View style={styles.benefitsGrid}>
                        {BENEFITS.map((item, index) => (
                            <Animated.View
                                key={item.id}
                                entering={FadeInDown.delay(index * 100).springify()}
                                style={[styles.benefitCard, { backgroundColor: theme.card }]}
                            >
                                <View style={[styles.benefitIcon, { backgroundColor: `${item.color}15` }]}>
                                    <Ionicons name={item.icon as any} size={28} color={item.color} />
                                </View>
                                <Text style={[styles.benefitTitle, { color: theme.text }]}>{item.title}</Text>
                                <Text style={[styles.benefitDesc, { color: theme.textSecondary }]}>
                                    {item.description}
                                </Text>
                            </Animated.View>
                        ))}
                    </View>

                    {/* How it Works */}
                    <View style={[styles.stepsCard, { backgroundColor: isDark ? theme.card : '#f8fafc' }]}>
                        <Text style={[styles.stepsTitle, { color: theme.text }]}>Como funciona?</Text>

                        <View style={styles.stepRow}>
                            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
                            <Text style={styles.stepText}>Cadastre seus dados e documentos</Text>
                        </View>
                        <View style={styles.stepLine} />

                        <View style={styles.stepRow}>
                            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
                            <Text style={styles.stepText}>Aguarde a aprovação da equipe</Text>
                        </View>
                        <View style={styles.stepLine} />

                        <View style={styles.stepRow}>
                            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
                            <Text style={styles.stepText}>Configure sua agenda e preço</Text>
                        </View>
                        <View style={styles.stepLine} />

                        <View style={styles.stepRow}>
                            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>4</Text></View>
                            <Text style={styles.stepText}>Comece a receber alunos!</Text>
                        </View>
                    </View>
                </Animated.View>

                <View style={{ height: 100 }} />
            </Animated.ScrollView>

            {/* Bottom Button */}
            <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.cardBorder }]}>
                <AnimatedTouchable
                    style={styles.startButton}
                    entering={FadeInUp.delay(600).springify()}
                    onPress={() => router.push('/connect/cadastro-instrutor')}
                >
                    <Text style={styles.startButtonText}>Quero ser Instrutor</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                </AnimatedTouchable>
            </View>
        </View>
    );
}

// I need to add isDark to the component to use it in stepsCard style or just use theme.card for dark mode
// Re-reading code, I missed isDark from useTheme. Adding it.

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingTop: 380, // CRITICAL FIX: Increased to clear the 350px header + overlay
    },
    heroContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 350,
        zIndex: 1,
    },
    safeArea: {
        paddingHorizontal: 20,
    },
    hero: {
        height: '100%',
        paddingBottom: 40,
        position: 'relative',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
    },
    heroContent: {
        alignItems: 'center',
        marginTop: 20,
        paddingBottom: 20,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: '80%',
    },
    curve: {
        position: 'absolute',
        bottom: -1, // Matched with previous attempt to hide gap
        left: 0,
        right: 0,
        height: 40,
        backgroundColor: '#fff', // This should match theme background if dynamic? 
        // Actually for the curve effect on top of content, it usually matches content background.
        // If content background is theme.background, this should probably receive style override or be dynamic.
        // For now, let's keep it white as the screenshot showed white curve on dark content, which looked okayish? 
        // No, user complained about white bar.
        // If theme is dark, curve should be dark.
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
    },
    content: {
        padding: 20,
        paddingTop: 0,
        // backgroundColor is handled by the parent container style usually, but here the curve needs to match.
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 20,
        textAlign: 'center',
    },
    benefitsGrid: {
        gap: 16,
    },
    benefitCard: {
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    benefitIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    benefitTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 6,
    },
    benefitDesc: {
        fontSize: 14,
        lineHeight: 20,
    },
    stepsCard: {
        marginTop: 30,
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    stepsTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 20,
        textAlign: 'center',
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    stepNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#7e22ce',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepNumberText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    stepText: {
        flex: 1,
        fontSize: 15,
        color: '#475569',
        fontWeight: '500',
    },
    stepLine: {
        width: 2,
        height: 20,
        backgroundColor: '#e2e8f0',
        marginLeft: 15,
        marginVertical: 4,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: 30,
        borderTopWidth: 1,
        zIndex: 10,
    },
    startButton: {
        backgroundColor: '#7e22ce',
        borderRadius: 16,
        paddingVertical: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#7e22ce',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    startButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
});
