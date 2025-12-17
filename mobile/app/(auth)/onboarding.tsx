import { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    Animated,
    FlatList,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        icon: 'car-sport',
        title: 'Aprenda a Dirigir',
        description: 'Encontre os melhores instrutores da sua região e comece sua jornada rumo à habilitação.',
        color: '#10b981',
        bgGradient: ['#064e3b', '#065f46'],
    },
    {
        id: '2',
        icon: 'people',
        title: 'Conecte-se',
        description: 'Agende aulas no horário que preferir com instrutores verificados e bem avaliados.',
        color: '#14b8a6',
        bgGradient: ['#065f46', '#047857'],
    },
    {
        id: '3',
        icon: 'ribbon',
        title: 'Conquiste sua CNH',
        description: 'Faça aulas práticas com segurança, acompanhe seu progresso e realize o sonho de dirigir!',
        color: '#22c55e',
        bgGradient: ['#047857', '#059669'],
    },
];

export default function OnboardingScreen() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    const handleNext = async () => {
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
            setCurrentIndex(currentIndex + 1);
        } else {
            await AsyncStorage.setItem('@vrumi_onboarding_complete', 'true');
            router.replace('/(auth)/login');
        }
    };

    const handleSkip = async () => {
        await AsyncStorage.setItem('@vrumi_onboarding_complete', 'true');
        router.replace('/(auth)/login');
    };

    const renderSlide = ({ item, index }: { item: typeof SLIDES[0]; index: number }) => {
        return (
            <View style={[styles.slide, { width }]}>
                <View style={styles.slideContent}>
                    {/* Icon Container */}
                    <View style={styles.iconContainer}>
                        <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                            <View style={[styles.iconInner, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                <Ionicons name={item.icon as any} size={80} color="#fff" />
                            </View>
                        </View>
                    </View>

                    {/* Text Content */}
                    <View style={styles.textContent}>
                        <Text style={styles.title}>{item.title}</Text>
                        <Text style={styles.description}>{item.description}</Text>
                    </View>
                </View>
            </View>
        );
    };

    const onScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        { useNativeDriver: false }
    );

    const onMomentumScrollEnd = (e: any) => {
        const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
        setCurrentIndex(newIndex);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#064e3b" />

            {/* Skip Button */}
            <SafeAreaView edges={['top']} style={styles.header}>
                <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                    <Text style={styles.skipText}>Pular</Text>
                </TouchableOpacity>
            </SafeAreaView>

            {/* Slides */}
            <Animated.FlatList
                ref={flatListRef}
                data={SLIDES}
                renderItem={renderSlide}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onScroll}
                onMomentumScrollEnd={onMomentumScrollEnd}
                scrollEventThrottle={16}
                style={styles.flatList}
            />

            {/* Bottom Section */}
            <SafeAreaView style={styles.bottomSection} edges={['bottom']}>
                {/* Pagination Dots */}
                <View style={styles.pagination}>
                    {SLIDES.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                currentIndex === index ? styles.dotActive : styles.dotInactive,
                            ]}
                        />
                    ))}
                </View>

                {/* Action Button */}
                <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
                    <Text style={styles.primaryButtonText}>
                        {currentIndex === SLIDES.length - 1 ? 'Começar' : 'Próximo'}
                    </Text>
                    <Ionicons
                        name={currentIndex === SLIDES.length - 1 ? 'checkmark' : 'arrow-forward'}
                        size={20}
                        color="#064e3b"
                    />
                </TouchableOpacity>

                {/* Login Link */}
                <View style={styles.loginRow}>
                    <Text style={styles.loginText}>Já tem conta?</Text>
                    <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                        <Text style={styles.loginLink}> Entrar</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#064e3b',
    },
    header: {
        position: 'absolute',
        top: 0,
        right: 0,
        zIndex: 10,
        paddingHorizontal: 20,
    },
    skipButton: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    skipText: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '500',
    },
    flatList: {
        flex: 1,
    },
    slide: {
        flex: 1,
        justifyContent: 'center',
    },
    slideContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    iconContainer: {
        marginBottom: 48,
    },
    iconCircle: {
        width: 200,
        height: 200,
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconInner: {
        width: 160,
        height: 160,
        borderRadius: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContent: {
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    bottomSection: {
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    dot: {
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    dotActive: {
        width: 24,
        backgroundColor: '#fff',
    },
    dotInactive: {
        width: 8,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    primaryButton: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 20,
    },
    primaryButtonText: {
        color: '#064e3b',
        fontSize: 17,
        fontWeight: '700',
    },
    loginRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
    },
    loginLink: {
        fontSize: 14,
        color: '#fff',
        fontWeight: '600',
    },
});
