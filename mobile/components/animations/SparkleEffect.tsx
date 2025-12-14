import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    withDelay,
    withSpring,
    Easing,
} from 'react-native-reanimated';

interface SparkleEffectProps {
    visible: boolean;
    size?: number;
    color?: string;
    onComplete?: () => void;
}

interface Sparkle {
    id: number;
    angle: number;
    delay: number;
}

const SPARKLE_COUNT = 8;

function SparkleParticle({ sparkle, size, color }: { sparkle: Sparkle; size: number; color: string }) {
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    useEffect(() => {
        const radians = (sparkle.angle * Math.PI) / 180;
        const distance = size * 0.8;

        scale.value = withDelay(
            sparkle.delay,
            withSequence(
                withSpring(1, { damping: 6 }),
                withDelay(300, withTiming(0, { duration: 200 }))
            )
        );

        opacity.value = withDelay(
            sparkle.delay,
            withSequence(
                withTiming(1, { duration: 100 }),
                withDelay(400, withTiming(0, { duration: 200 }))
            )
        );

        translateX.value = withDelay(
            sparkle.delay,
            withTiming(Math.cos(radians) * distance, { duration: 600 })
        );

        translateY.value = withDelay(
            sparkle.delay,
            withTiming(Math.sin(radians) * distance, { duration: 600 })
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
            { rotate: '45deg' },
        ],
        opacity: opacity.value,
    }));

    return (
        <Animated.View style={[styles.sparkle, { backgroundColor: color }, animatedStyle]}>
            <View style={[styles.sparkleArm, styles.horizontal, { backgroundColor: color }]} />
            <View style={[styles.sparkleArm, styles.vertical, { backgroundColor: color }]} />
        </Animated.View>
    );
}

export default function SparkleEffect({
    visible,
    size = 100,
    color = '#eab308',
    onComplete
}: SparkleEffectProps) {
    const sparkles: Sparkle[] = Array.from({ length: SPARKLE_COUNT }, (_, i) => ({
        id: i,
        angle: (360 / SPARKLE_COUNT) * i,
        delay: i * 50,
    }));

    useEffect(() => {
        if (visible && onComplete) {
            setTimeout(onComplete, 1000);
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            {sparkles.map((sparkle) => (
                <SparkleParticle key={sparkle.id} sparkle={sparkle} size={size} color={color} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    sparkle: {
        position: 'absolute',
        width: 12,
        height: 12,
    },
    sparkleArm: {
        position: 'absolute',
    },
    horizontal: {
        width: 12,
        height: 4,
        top: 4,
        left: 0,
        borderRadius: 2,
    },
    vertical: {
        width: 4,
        height: 12,
        top: 0,
        left: 4,
        borderRadius: 2,
    },
});
