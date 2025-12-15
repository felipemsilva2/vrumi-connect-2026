import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useGamification } from '../../contexts/GamificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface Achievement {
    id: string;
    key: string;
    name: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    iconBg: string;
    requirement: number;
    category: 'streak' | 'xp' | 'flashcards' | 'quizzes' | 'signs' | 'special';
}

export const ACHIEVEMENTS: Achievement[] = [
    // Streak Achievements
    {
        id: '1',
        key: 'streak_3',
        name: 'Primeiro Passo',
        description: '3 dias de streak',
        icon: 'flame',
        iconColor: '#f97316',
        iconBg: '#fff7ed',
        requirement: 3,
        category: 'streak',
    },
    {
        id: '2',
        key: 'streak_7',
        name: 'Semana de Fogo',
        description: '7 dias consecutivos',
        icon: 'flame',
        iconColor: '#ef4444',
        iconBg: '#fef2f2',
        requirement: 7,
        category: 'streak',
    },
    {
        id: '3',
        key: 'streak_30',
        name: 'Compromisso Total',
        description: '30 dias de streak',
        icon: 'diamond',
        iconColor: '#8b5cf6',
        iconBg: '#f5f3ff',
        requirement: 30,
        category: 'streak',
    },
    // XP Achievements
    {
        id: '4',
        key: 'xp_500',
        name: 'Aprendiz',
        description: 'Atingir 500 XP',
        icon: 'star',
        iconColor: '#eab308',
        iconBg: '#fefce8',
        requirement: 500,
        category: 'xp',
    },
    {
        id: '5',
        key: 'xp_2500',
        name: 'Estudante Dedicado',
        description: 'Atingir 2.500 XP',
        icon: 'star',
        iconColor: '#f59e0b',
        iconBg: '#fffbeb',
        requirement: 2500,
        category: 'xp',
    },
    {
        id: '6',
        key: 'xp_10000',
        name: 'Mestre do Trânsito',
        description: 'Atingir 10.000 XP',
        icon: 'trophy',
        iconColor: '#d97706',
        iconBg: '#fef3c7',
        requirement: 10000,
        category: 'xp',
    },
    // Flashcard Achievements
    {
        id: '7',
        key: 'flashcards_10',
        name: 'Memorizador',
        description: 'Estudar 10 flashcards',
        icon: 'layers',
        iconColor: '#10b981',
        iconBg: '#ecfdf5',
        requirement: 10,
        category: 'flashcards',
    },
    {
        id: '8',
        key: 'flashcards_100',
        name: 'Memória de Elefante',
        description: 'Estudar 100 flashcards',
        icon: 'layers',
        iconColor: '#059669',
        iconBg: '#d1fae5',
        requirement: 100,
        category: 'flashcards',
    },
    // Quiz Achievements
    {
        id: '9',
        key: 'quiz_1',
        name: 'Primeiro Simulado',
        description: 'Completar 1 simulado',
        icon: 'clipboard',
        iconColor: '#3b82f6',
        iconBg: '#eff6ff',
        requirement: 1,
        category: 'quizzes',
    },
    {
        id: '10',
        key: 'quiz_10',
        name: 'Praticante',
        description: 'Completar 10 simulados',
        icon: 'clipboard',
        iconColor: '#2563eb',
        iconBg: '#dbeafe',
        requirement: 10,
        category: 'quizzes',
    },
    {
        id: '11',
        key: 'quiz_pass',
        name: 'Aprovado!',
        description: 'Passar em um simulado (70%+)',
        icon: 'checkmark-circle',
        iconColor: '#22c55e',
        iconBg: '#dcfce7',
        requirement: 1,
        category: 'quizzes',
    },
    // Signs Achievements
    {
        id: '12',
        key: 'signs_50',
        name: 'Estudante de Placas',
        description: 'Ver 50 placas',
        icon: 'warning',
        iconColor: '#ec4899',
        iconBg: '#fce7f3',
        requirement: 50,
        category: 'signs',
    },
];

interface UserAchievement {
    achievement_key: string;
    unlocked_at: string;
}

export default function AchievementsScreen() {
    const { theme, isDark } = useTheme();
    const { user } = useAuth();
    const { stats: gamificationStats } = useGamification();
    const [unlockedAchievements, setUnlockedAchievements] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUnlockedAchievements();
    }, [user?.id]);

    const fetchUnlockedAchievements = async () => {
        if (!user?.id) return;

        try {
            const { data, error } = await supabase
                .from('user_achievements')
                .select('achievement_key')
                .eq('user_id', user.id);

            if (data) {
                setUnlockedAchievements(new Set(data.map((a: { achievement_key: string }) => a.achievement_key)));
            }
        } catch (error) {
            console.error('Error fetching achievements:', error);
        } finally {
            setLoading(false);
        }
    };

    const getProgress = (achievement: Achievement): number => {
        if (!gamificationStats) return 0;

        switch (achievement.category) {
            case 'streak':
                return Math.min((gamificationStats.streak.current / achievement.requirement) * 100, 100);
            case 'xp':
                return Math.min((gamificationStats.xp.total / achievement.requirement) * 100, 100);
            default:
                return unlockedAchievements.has(achievement.key) ? 100 : 0;
        }
    };

    const isUnlocked = (achievement: Achievement): boolean => {
        return unlockedAchievements.has(achievement.key) || getProgress(achievement) >= 100;
    };

    const unlockedCount = ACHIEVEMENTS.filter(a => isUnlocked(a)).length;
    const totalCount = ACHIEVEMENTS.length;

    const categoryLabels: Record<string, string> = {
        streak: '🔥 Sequência',
        xp: '⭐ Experiência',
        flashcards: '📚 Flashcards',
        quizzes: '📋 Simulados',
        signs: '🚦 Placas',
        special: '✨ Especial',
    };

    const groupedAchievements = ACHIEVEMENTS.reduce((acc, achievement) => {
        if (!acc[achievement.category]) {
            acc[achievement.category] = [];
        }
        acc[achievement.category].push(achievement);
        return acc;
    }, {} as Record<string, Achievement[]>);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: theme.card }]}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Conquistas</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Progress Summary */}
                <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
                    <View style={styles.summaryIcon}>
                        <Ionicons name="trophy" size={32} color="#eab308" />
                    </View>
                    <View style={styles.summaryText}>
                        <Text style={[styles.summaryTitle, { color: theme.text }]}>
                            {unlockedCount} de {totalCount}
                        </Text>
                        <Text style={[styles.summarySubtitle, { color: theme.textSecondary }]}>
                            conquistas desbloqueadas
                        </Text>
                    </View>
                    <View style={[styles.summaryProgress, { backgroundColor: theme.cardBorder }]}>
                        <View
                            style={[
                                styles.summaryProgressFill,
                                { width: `${(unlockedCount / totalCount) * 100}%` }
                            ]}
                        />
                    </View>
                </View>

                {/* Achievements by Category */}
                {Object.entries(groupedAchievements).map(([category, achievements]) => (
                    <View key={category} style={styles.categorySection}>
                        <Text style={[styles.categoryTitle, { color: theme.text }]}>
                            {categoryLabels[category]}
                        </Text>
                        <View style={styles.achievementsGrid}>
                            {achievements.map((achievement) => {
                                const unlocked = isUnlocked(achievement);
                                const progress = getProgress(achievement);

                                return (
                                    <View
                                        key={achievement.id}
                                        style={[
                                            styles.achievementCard,
                                            {
                                                backgroundColor: theme.card,
                                                opacity: unlocked ? 1 : 0.6,
                                            }
                                        ]}
                                    >
                                        <View style={[
                                            styles.achievementIconBg,
                                            { backgroundColor: unlocked ? achievement.iconBg : theme.cardBorder }
                                        ]}>
                                            <Ionicons
                                                name={achievement.icon}
                                                size={28}
                                                color={unlocked ? achievement.iconColor : theme.textMuted}
                                            />
                                            {unlocked && (
                                                <View style={styles.checkBadge}>
                                                    <Ionicons name="checkmark" size={12} color="#fff" />
                                                </View>
                                            )}
                                        </View>
                                        <Text style={[styles.achievementName, { color: theme.text }]} numberOfLines={1}>
                                            {achievement.name}
                                        </Text>
                                        <Text style={[styles.achievementDesc, { color: theme.textSecondary }]} numberOfLines={2}>
                                            {achievement.description}
                                        </Text>
                                        {!unlocked && progress > 0 && (
                                            <View style={[styles.progressBar, { backgroundColor: theme.cardBorder }]}>
                                                <View
                                                    style={[
                                                        styles.progressFill,
                                                        { width: `${progress}%`, backgroundColor: theme.primary }
                                                    ]}
                                                />
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                ))}

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const CARD_SIZE = (SCREEN_WIDTH - 60) / 3;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
    },
    scrollContent: {
        paddingHorizontal: 20,
    },
    summaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 20,
        marginBottom: 24,
        flexWrap: 'wrap',
    },
    summaryIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#fef3c7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    summaryText: {
        flex: 1,
    },
    summaryTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    summarySubtitle: {
        fontSize: 14,
    },
    summaryProgress: {
        width: '100%',
        height: 6,
        borderRadius: 3,
        marginTop: 16,
    },
    summaryProgressFill: {
        height: '100%',
        borderRadius: 3,
        backgroundColor: '#eab308',
    },
    categorySection: {
        marginBottom: 24,
    },
    categoryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    achievementsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    achievementCard: {
        width: CARD_SIZE,
        padding: 12,
        borderRadius: 16,
        alignItems: 'center',
    },
    achievementIconBg: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        position: 'relative',
    },
    checkBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#22c55e',
        justifyContent: 'center',
        alignItems: 'center',
    },
    achievementName: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 4,
    },
    achievementDesc: {
        fontSize: 10,
        textAlign: 'center',
        lineHeight: 14,
    },
    progressBar: {
        width: '100%',
        height: 4,
        borderRadius: 2,
        marginTop: 8,
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
});
