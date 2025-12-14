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
    runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface BadgeUnlockProps {
    visible: boolean;
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    backgroundColor: string;
    onComplete?: () => void;
}

export default function BadgeUnlock({
    visible,
    icon,
    iconColor,
    backgroundColor,
    onComplete
}: BadgeUnlockProps) {
    const scale = useSharedValue(0);
    const rotate = useSharedValue(0);
    const opacity = useSharedValue(0);
    const ringScale = useSharedValue(0);
    const ringOpacity = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            // Initial bounce in
            scale.value = withSequence(
                withSpring(1.3, { damping: 4, stiffness: 100 }),
                withSpring(1, { damping: 8 })
            );

            // Rotation wiggle
            rotate.value = withDelay(
                300,
                withSequence(
                    withTiming(15, { duration: 100 }),
                    withTiming(-15, { duration: 100 }),
                    withTiming(10, { duration: 80 }),
                    withTiming(-10, { duration: 80 }),
                    withTiming(0, { duration: 60 })
                )
            );

            opacity.value = withTiming(1, { duration: 200 });

            // Ring pulse
            ringScale.value = withDelay(
                200,
                withSequence(
                    withTiming(1.5, { duration: 400 }),
                    withTiming(2, { duration: 400 })
                )
            );

            ringOpacity.value = withDelay(
                200,
                withSequence(
                    withTiming(0.8, { duration: 200 }),
                    withTiming(0, { duration: 600 })
                )
            );

            if (onComplete) {
                setTimeout(onComplete, 1500);
            }
        } else {
            scale.value = 0;
            opacity.value = 0;
            rotate.value = 0;
            ringScale.value = 0;
            ringOpacity.value = 0;
        }
    }, [visible]);

    const badgeStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { rotate: `${rotate.value}deg` },
        ],
        opacity: opacity.value,
    }));

    const ringStyle = useAnimatedStyle(() => ({
        transform: [{ scale: ringScale.value }],
        opacity: ringOpacity.value,
    }));

    if (!visible) return null;

    return (
        <View style={styles.container}>
            {/* Expanding ring */}
            <Animated.View style={[styles.ring, { borderColor: iconColor }, ringStyle]} />

            {/* Badge */}
            <Animated.View style={[styles.badge, { backgroundColor }, badgeStyle]}>
                <Ionicons name={icon} size={48} color={iconColor} />
                <View style={[styles.shine, { backgroundColor: iconColor }]} />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badge: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        overflow: 'hidden',
    },
    shine: {
        position: 'absolute',
        top: 10,
        left: 15,
        width: 20,
        height: 20,
        borderRadius: 10,
        opacity: 0.3,
    },
    ring: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
    },
});
