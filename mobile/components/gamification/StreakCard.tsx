import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface StreakCardProps {
    currentStreak: number;
    longestStreak: number;
    isActiveToday: boolean;
    compact?: boolean;
}

export default function StreakCard({
    currentStreak,
    longestStreak,
    isActiveToday,
    compact = false
}: StreakCardProps) {
    const { theme } = useTheme();
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isActiveToday && currentStreak > 0) {
            // Pulse animation for active streak
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [isActiveToday, currentStreak]);

    if (compact) {
        return (
            <View style={[styles.compactContainer, { backgroundColor: theme.card }]}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <Ionicons
                        name={currentStreak > 0 ? "flame" : "flame-outline"}
                        size={20}
                        color={currentStreak > 0 ? '#f97316' : theme.textMuted}
                    />
                </Animated.View>
                <Text style={[
                    styles.compactNumber,
                    { color: currentStreak > 0 ? '#f97316' : theme.textMuted }
                ]}>
                    {currentStreak}
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <Ionicons
                            name={currentStreak > 0 ? "flame" : "flame-outline"}
                            size={32}
                            color={currentStreak > 0 ? '#f97316' : theme.textMuted}
                        />
                    </Animated.View>
                </View>
                <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: theme.text }]}>
                        {currentStreak > 0 ? `${currentStreak} dias de Streak!` : 'Comece seu Streak!'}
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        {isActiveToday
                            ? '🎉 Você estudou hoje!'
                            : 'Estude hoje para manter o streak'}
                    </Text>
                </View>
            </View>

            {/* Streak visual indicator */}
            <View style={styles.streakDots}>
                {[...Array(7)].map((_, i) => (
                    <View
                        key={i}
                        style={[
                            styles.dot,
                            {
                                backgroundColor: i < (currentStreak % 7) || (currentStreak >= 7 && i < 7)
                                    ? '#f97316'
                                    : theme.cardBorder,
                            },
                        ]}
                    />
                ))}
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: theme.text }]}>{currentStreak}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Atual</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: theme.text }]}>{longestStreak}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Recorde</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#fff7ed',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
    },
    streakDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 16,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statItem: {
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 12,
        marginTop: 2,
    },
    divider: {
        width: 1,
        height: 32,
    },
    compactContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 4,
    },
    compactNumber: {
        fontSize: 14,
        fontWeight: 'bold',
    },
});
