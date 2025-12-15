import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../src/lib/supabase';
import { useAuth } from './AuthContext';

interface StreakData {
    current: number;
    longest: number;
    lastActivity: string | null;
    isActiveToday: boolean;
}

interface XPData {
    total: number;
    level: number;
    today: number;
    xpToNextLevel: number;
}

interface DailyGoalData {
    goalMinutes: number;
    minutesToday: number;
    completed: boolean;
}

interface GamificationStats {
    streak: StreakData;
    xp: XPData;
    dailyGoal: DailyGoalData;
}

interface GamificationContextType {
    stats: GamificationStats | null;
    loading: boolean;
    refreshStats: () => Promise<void>;
    recordActivity: (actionType: string, xpAmount?: number, description?: string) => Promise<void>;
    updateDailyGoal: (minutes: number) => Promise<void>;
}

const defaultStats: GamificationStats = {
    streak: {
        current: 0,
        longest: 0,
        lastActivity: null,
        isActiveToday: false,
    },
    xp: {
        total: 0,
        level: 1,
        today: 0,
        xpToNextLevel: 500,
    },
    dailyGoal: {
        goalMinutes: 10,
        minutesToday: 0,
        completed: false,
    },
};

const XP_VALUES: Record<string, number> = {
    flashcard: 5,
    quiz_correct: 10,
    quiz_wrong: 2,
    challenge: 100,
    note: 3,
    streak_bonus: 50,
    pdf_view: 5,
};

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export function GamificationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [stats, setStats] = useState<GamificationStats | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        if (!user?.id) {
            setStats(defaultStats);
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase.rpc('get_user_gamification_stats', {
                p_user_id: user.id
            });

            if (error) {
                console.error('Error fetching gamification stats:', error);
                // Initialize user records if they don't exist
                await initializeUserRecords();
                return;
            }

            if (data) {
                setStats({
                    streak: {
                        current: (data as any).streak?.current ?? 0,
                        longest: (data as any).streak?.longest ?? 0,
                        lastActivity: (data as any).streak?.last_activity ?? null,
                        isActiveToday: (data as any).streak?.is_active_today ?? false,
                    },
                    xp: {
                        total: (data as any).xp?.total ?? 0,
                        level: (data as any).xp?.level ?? 1,
                        today: (data as any).xp?.today ?? 0,
                        xpToNextLevel: (data as any).xp?.xp_to_next_level ?? 500,
                    },
                    dailyGoal: {
                        goalMinutes: (data as any).daily_goal?.goal_minutes ?? 10,
                        minutesToday: (data as any).daily_goal?.minutes_today ?? 0,
                        completed: (data as any).daily_goal?.completed ?? false,
                    },
                });
            }
        } catch (error) {
            console.error('Error in fetchStats:', error);
            setStats(defaultStats);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    const initializeUserRecords = async () => {
        if (!user?.id) return;

        try {
            // Initialize streak record
            await supabase.from('user_streaks').upsert({
                user_id: user.id,
                current_streak: 0,
                longest_streak: 0,
            }, { onConflict: 'user_id' });

            // Initialize XP record
            await supabase.from('user_xp').upsert({
                user_id: user.id,
                total_xp: 0,
                level: 1,
            }, { onConflict: 'user_id' });

            // Initialize daily goals
            await supabase.from('user_daily_goals').upsert({
                user_id: user.id,
                daily_goal_minutes: 10,
            }, { onConflict: 'user_id' });

            // Refresh stats after initialization
            await fetchStats();
        } catch (error) {
            console.error('Error initializing user records:', error);
        }
    };

    const recordActivity = useCallback(async (
        actionType: string,
        customXP?: number,
        description?: string
    ) => {
        if (!user?.id) return;

        const xpAmount = customXP ?? XP_VALUES[actionType] ?? 5;

        try {
            // Update streak
            await supabase.rpc('update_user_streak', {
                p_user_id: user.id
            });

            // Add XP
            await supabase.rpc('add_user_xp', {
                p_user_id: user.id,
                p_xp_amount: xpAmount,
                p_action_type: actionType,
                p_description: description
            });

            // Refresh stats
            await fetchStats();
        } catch (error) {
            console.error('Error recording activity:', error);
        }
    }, [user?.id, fetchStats]);

    const updateDailyGoal = useCallback(async (minutes: number) => {
        if (!user?.id) return;

        try {
            await supabase.from('user_daily_goals').upsert({
                user_id: user.id,
                daily_goal_minutes: minutes,
            }, { onConflict: 'user_id' });

            await fetchStats();
        } catch (error) {
            console.error('Error updating daily goal:', error);
        }
    }, [user?.id, fetchStats]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return (
        <GamificationContext.Provider
            value={{
                stats,
                loading,
                refreshStats: fetchStats,
                recordActivity,
                updateDailyGoal,
            }}
        >
            {children}
        </GamificationContext.Provider>
    );
}

export function useGamification() {
    const context = useContext(GamificationContext);
    if (context === undefined) {
        throw new Error('useGamification must be used within a GamificationProvider');
    }
    return context;
}

// Helper function to get level title
export function getLevelTitle(level: number): string {
    if (level <= 5) return 'Aprendiz';
    if (level <= 10) return 'Estudante';
    if (level <= 20) return 'Dedicado';
    return 'Mestre do Trânsito';
}

// Helper to calculate XP progress percentage
export function getXPProgress(totalXP: number): number {
    return ((totalXP % 500) / 500) * 100;
}
