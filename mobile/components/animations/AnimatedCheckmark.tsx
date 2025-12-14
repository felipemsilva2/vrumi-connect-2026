import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSequence,
    withTiming,
    withSpring,
    withDelay,
    Easing,
    interpolate,
} from 'react-native-reanimated';

interface AnimatedCheckmarkProps {
    visible: boolean;
    size?: number;
    color?: string;
    backgroundColor?: string;
    onComplete?: () => void;
}

export default function AnimatedCheckmark({
    visible,
    size = 80,
    color = '#22c55e',
    backgroundColor = '#dcfce7',
    onComplete,
}: AnimatedCheckmarkProps) {
    const scale = useSharedValue(0);
    const checkProgress = useSharedValue(0);
    const circleOpacity = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            // Circle appears
            scale.value = withSpring(1, { damping: 8, stiffness: 100 });
            circleOpacity.value = withTiming(1, { duration: 200 });

            // Checkmark draws
            checkProgress.value = withDelay(
                200,
                withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) })
            );

            if (onComplete) {
                setTimeout(onComplete, 800);
            }
        } else {
            scale.value = 0;
            checkProgress.value = 0;
            circleOpacity.value = 0;
        }
    }, [visible]);

    const containerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: circleOpacity.value,
    }));

    const checkStyle = useAnimatedStyle(() => {
        const strokeDashoffset = interpolate(
            checkProgress.value,
            [0, 1],
            [50, 0]
        );
        return {
            opacity: checkProgress.value > 0 ? 1 : 0,
        };
    });

    if (!visible) return null;

    return (
        <Animated.View style={[styles.container, { width: size, height: size }, containerStyle]}>
            {/* Background circle */}
            <View style={[styles.circle, { backgroundColor, width: size, height: size, borderRadius: size / 2 }]}>
                {/* Ring */}
                <View style={[styles.ring, { borderColor: color, width: size, height: size, borderRadius: size / 2 }]} />

                {/* Checkmark using View */}
                <Animated.View style={[styles.checkContainer, checkStyle]}>
                    <View style={[styles.checkShort, { backgroundColor: color, width: size * 0.2, height: size * 0.08 }]} />
                    <View style={[styles.checkLong, { backgroundColor: color, width: size * 0.4, height: size * 0.08 }]} />
                </Animated.View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    circle: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    ring: {
        position: 'absolute',
        borderWidth: 3,
    },
    checkContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        transform: [{ rotate: '-45deg' }],
    },
    checkShort: {
        borderRadius: 2,
        marginRight: -2,
    },
    checkLong: {
        borderRadius: 2,
        transform: [{ rotate: '90deg' }, { translateY: -6 }],
    },
});
