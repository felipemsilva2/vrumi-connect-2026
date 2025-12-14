import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    withDelay,
    Easing,
    interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface AnimatedFireProps {
    size?: number;
    isActive?: boolean;
}

export default function AnimatedFire({ size = 60, isActive = true }: AnimatedFireProps) {
    const flicker = useSharedValue(0);
    const scale = useSharedValue(1);

    useEffect(() => {
        if (isActive) {
            // Flicker animation
            flicker.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 150, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0.7, { duration: 100, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0.9, { duration: 120, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0.6, { duration: 80, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                false
            );

            // Pulse scale
            scale.value = withRepeat(
                withSequence(
                    withTiming(1.1, { duration: 400 }),
                    withTiming(0.95, { duration: 400 })
                ),
                -1,
                true
            );
        }
    }, [isActive]);

    const mainFlameStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { translateY: interpolate(flicker.value, [0, 1], [0, -3]) },
        ],
        opacity: interpolate(flicker.value, [0, 1], [0.8, 1]),
    }));

    const innerFlameStyle = useAnimatedStyle(() => ({
        opacity: interpolate(flicker.value, [0, 1], [0.9, 1]),
        transform: [
            { scale: interpolate(flicker.value, [0, 1], [0.85, 1]) },
        ],
    }));

    const coreStyle = useAnimatedStyle(() => ({
        opacity: interpolate(flicker.value, [0, 1], [0.7, 1]),
    }));

    if (!isActive) {
        return (
            <View style={[styles.container, { width: size, height: size }]}>
                <View style={[styles.inactiveFlame, { width: size * 0.6, height: size * 0.8 }]} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            {/* Glow effect */}
            <View style={[styles.glow, {
                width: size * 1.5,
                height: size * 1.5,
                borderRadius: size * 0.75,
            }]} />

            {/* Main flame */}
            <Animated.View style={[styles.flameContainer, mainFlameStyle]}>
                <View style={[styles.flame, {
                    width: size * 0.6,
                    height: size * 0.85,
                    borderRadius: size * 0.3,
                    backgroundColor: '#f97316',
                }]}>
                    <LinearGradient
                        colors={['#fbbf24', '#f97316', '#dc2626']}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 1 }}
                    />
                </View>
            </Animated.View>

            {/* Inner flame */}
            <Animated.View style={[styles.innerFlameContainer, innerFlameStyle]}>
                <View style={[styles.flame, {
                    width: size * 0.35,
                    height: size * 0.55,
                    borderRadius: size * 0.18,
                    backgroundColor: '#fbbf24',
                }]}>
                    <LinearGradient
                        colors={['#fef3c7', '#fbbf24', '#f97316']}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 1 }}
                    />
                </View>
            </Animated.View>

            {/* Core */}
            <Animated.View style={[styles.core, coreStyle, {
                width: size * 0.15,
                height: size * 0.25,
                borderRadius: size * 0.08,
            }]} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    glow: {
        position: 'absolute',
        backgroundColor: 'rgba(251, 191, 36, 0.2)',
    },
    flameContainer: {
        position: 'absolute',
        bottom: '10%',
    },
    flame: {
        overflow: 'hidden',
        transform: [{ rotate: '180deg' }],
    },
    innerFlameContainer: {
        position: 'absolute',
        bottom: '15%',
    },
    core: {
        position: 'absolute',
        bottom: '18%',
        backgroundColor: '#fef9c3',
    },
    inactiveFlame: {
        backgroundColor: '#9ca3af',
        borderRadius: 20,
        opacity: 0.3,
        transform: [{ rotate: '180deg' }],
    },
});
