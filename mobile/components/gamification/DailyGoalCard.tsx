import React from 'react';
import {
    View,
    Text,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface DailyGoalCardProps {
    goalMinutes: number;
    minutesToday: number;
    completed: boolean;
}

export default function DailyGoalCard({
    goalMinutes,
    minutesToday,
    completed
}: DailyGoalCardProps) {
    const { theme } = useTheme();

    const progress = Math.min((minutesToday / goalMinutes) * 100, 100);
    const circumference = 2 * Math.PI * 45; // radius = 45
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.content}>
                {/* Circular Progress */}
                <View style={styles.circleContainer}>
                    <View style={styles.circleOuter}>
                        <View style={[styles.circleBg, { borderColor: theme.cardBorder }]} />
                        <View
                            style={[
                                styles.circleProgress,
                                {
                                    borderColor: completed ? '#22c55e' : theme.primary,
                                    transform: [{ rotate: '-90deg' }],
                                }
                            ]}
                        >
                            <View
                                style={[
                                    styles.progressArc,
                                    {
                                        borderTopColor: completed ? '#22c55e' : theme.primary,
                                        borderRightColor: progress > 25 ? (completed ? '#22c55e' : theme.primary) : 'transparent',
                                        borderBottomColor: progress > 50 ? (completed ? '#22c55e' : theme.primary) : 'transparent',
                                        borderLeftColor: progress > 75 ? (completed ? '#22c55e' : theme.primary) : 'transparent',
                                    }
                                ]}
                            />
                        </View>
                    </View>
                    <View style={styles.circleInner}>
                        {completed ? (
                            <Ionicons name="checkmark-circle" size={32} color="#22c55e" />
                        ) : (
                            <>
                                <Text style={[styles.progressPercent, { color: theme.text }]}>
                                    {Math.round(progress)}%
                                </Text>
                            </>
                        )}
                    </View>
                </View>

                {/* Text Info */}
                <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: theme.text }]}>
                        {completed ? 'Meta Concluída! 🎉' : 'Meta Diária'}
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        {minutesToday} de {goalMinutes} minutos
                    </Text>
                    {!completed && (
                        <Text style={[styles.encouragement, { color: theme.primary }]}>
                            Faltam {goalMinutes - minutesToday} min
                        </Text>
                    )}
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
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    circleContainer: {
        width: 80,
        height: 80,
        marginRight: 20,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    circleOuter: {
        position: 'absolute',
        width: 80,
        height: 80,
    },
    circleBg: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 6,
    },
    circleProgress: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    progressArc: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 6,
    },
    circleInner: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressPercent: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 4,
    },
    encouragement: {
        fontSize: 14,
        fontWeight: '600',
    },
});
