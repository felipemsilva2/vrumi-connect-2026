import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withSequence,
    withDelay,
    withRepeat,
    Easing,
    runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ConfettiPiece {
    id: number;
    x: number;
    delay: number;
    color: string;
    size: number;
    rotation: number;
}

interface ConfettiCelebrationProps {
    visible: boolean;
    onComplete?: () => void;
    duration?: number;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444'];
const PIECE_COUNT = 50;

function ConfettiPieceComponent({ piece, duration }: { piece: ConfettiPiece; duration: number }) {
    const translateY = useSharedValue(-50);
    const translateX = useSharedValue(0);
    const rotate = useSharedValue(0);
    const opacity = useSharedValue(1);

    useEffect(() => {
        translateY.value = withDelay(
            piece.delay,
            withTiming(SCREEN_HEIGHT + 100, {
                duration: duration,
                easing: Easing.out(Easing.quad),
            })
        );

        translateX.value = withDelay(
            piece.delay,
            withRepeat(
                withSequence(
                    withTiming(30, { duration: 200 }),
                    withTiming(-30, { duration: 200 })
                ),
                -1,
                true
            )
        );

        rotate.value = withDelay(
            piece.delay,
            withRepeat(
                withTiming(360, { duration: 1000 }),
                -1,
                false
            )
        );

        opacity.value = withDelay(
            duration - 500,
            withTiming(0, { duration: 500 })
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { translateX: translateX.value },
            { rotate: `${rotate.value}deg` },
        ],
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                styles.piece,
                {
                    left: piece.x,
                    backgroundColor: piece.color,
                    width: piece.size,
                    height: piece.size * 2,
                    borderRadius: piece.size / 4,
                },
                animatedStyle,
            ]}
        />
    );
}

export default function ConfettiCelebration({
    visible,
    onComplete,
    duration = 3000
}: ConfettiCelebrationProps) {
    const pieces = useRef<ConfettiPiece[]>([]);

    useEffect(() => {
        if (visible) {
            pieces.current = Array.from({ length: PIECE_COUNT }, (_, i) => ({
                id: i,
                x: Math.random() * SCREEN_WIDTH,
                delay: Math.random() * 500,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                size: 8 + Math.random() * 8,
                rotation: Math.random() * 360,
            }));

            if (onComplete) {
                setTimeout(onComplete, duration + 500);
            }
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <View style={styles.container} pointerEvents="none">
            {pieces.current.map((piece) => (
                <ConfettiPieceComponent key={piece.id} piece={piece} duration={duration} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
    },
    piece: {
        position: 'absolute',
        top: -20,
    },
});
