import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
    withTiming,
    withDelay,
    Easing,
} from 'react-native-reanimated';

interface XPGainPopupProps {
    visible: boolean;
    amount: number;
    onComplete?: () => void;
}

export default function XPGainPopup({ visible, amount, onComplete }: XPGainPopupProps) {
    const translateY = useSharedValue(20);
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.5);

    useEffect(() => {
        if (visible) {
            // Pop up animation
            translateY.value = withSequence(
                withSpring(-20, { damping: 8 }),
                withDelay(1000, withTiming(-50, { duration: 300 }))
            );

            opacity.value = withSequence(
                withTiming(1, { duration: 200 }),
                withDelay(1000, withTiming(0, { duration: 300 }))
            );

            scale.value = withSequence(
                withSpring(1.2, { damping: 6 }),
                withSpring(1, { damping: 10 })
            );

            if (onComplete) {
                setTimeout(onComplete, 1500);
            }
        } else {
            translateY.value = 20;
            opacity.value = 0;
            scale.value = 0.5;
        }
    }, [visible]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { scale: scale.value },
        ],
        opacity: opacity.value,
    }));

    if (!visible) return null;

    return (
        <Animated.View style={[styles.container, animatedStyle]}>
            <View style={styles.badge}>
                <Text style={styles.plus}>+</Text>
                <Text style={styles.amount}>{amount}</Text>
                <Text style={styles.xp}>XP</Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        alignSelf: 'center',
        zIndex: 9999,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eab308',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    plus: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    amount: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginHorizontal: 2,
    },
    xp: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 2,
    },
});
