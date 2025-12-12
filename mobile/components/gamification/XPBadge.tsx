import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { getLevelTitle, getXPProgress } from '../../contexts/GamificationContext';

interface XPBadgeProps {
    totalXP: number;
    level: number;
    xpToday: number;
    compact?: boolean;
}

export default function XPBadge({
    totalXP,
    level,
    xpToday,
    compact = false
}: XPBadgeProps) {
    const { theme } = useTheme();
    const progressAnim = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    const xpProgress = getXPProgress(totalXP);
    const levelTitle = getLevelTitle(level);

    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: xpProgress,
            duration: 1000,
            useNativeDriver: false,
        }).start();

        // Glow animation when XP increases
        if (xpToday > 0) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(glowAnim, {
                        toValue: 1,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(glowAnim, {
                        toValue: 0,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [xpProgress, xpToday]);

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
    });

    const glowOpacity = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.8],
    });

    if (compact) {
        return (
            <View style={[styles.compactContainer, { backgroundColor: theme.card }]}>
                <Ionicons name="star" size={16} color="#eab308" />
                <Text style={[styles.compactLevel, { color: '#eab308' }]}>Nv.{level}</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.header}>
                <View style={styles.levelBadge}>
                    <Animated.View
                        style={[
                            styles.levelGlow,
                            { opacity: glowOpacity }
                        ]}
                    />
                    <Text style={styles.levelNumber}>{level}</Text>
                </View>
                <View style={styles.textContainer}>
                    <Text style={[styles.levelTitle, { color: theme.text }]}>{levelTitle}</Text>
                    <Text style={[styles.xpText, { color: theme.textSecondary }]}>
                        {totalXP.toLocaleString()} XP total
                    </Text>
                </View>
                {xpToday > 0 && (
                    <View style={styles.todayBadge}>
                        <Text style={styles.todayText}>+{xpToday} hoje</Text>
                    </View>
                )}
            </View>

            {/* XP Progress Bar */}
            <View style={styles.progressSection}>
                <View style={[styles.progressBarBg, { backgroundColor: theme.cardBorder }]}>
                    <Animated.View
                        style={[
                            styles.progressBarFill,
                            { width: progressWidth }
                        ]}
                    />
                </View>
                <Text style={[styles.progressText, { color: theme.textSecondary }]}>
                    {Math.round(xpProgress)}% para Nível {level + 1}
                </Text>
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
    levelBadge: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#fef3c7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        position: 'relative',
    },
    levelGlow: {
        position: 'absolute',
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#eab308',
    },
    levelNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#b45309',
    },
    textContainer: {
        flex: 1,
    },
    levelTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    xpText: {
        fontSize: 14,
    },
    todayBadge: {
        backgroundColor: '#dcfce7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    todayText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#16a34a',
    },
    progressSection: {
        gap: 8,
    },
    progressBarBg: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
        backgroundColor: '#eab308',
    },
    progressText: {
        fontSize: 12,
        textAlign: 'center',
    },
    compactContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    compactLevel: {
        fontSize: 12,
        fontWeight: 'bold',
    },
});
