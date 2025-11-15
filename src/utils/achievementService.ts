import { supabase } from '@/integrations/supabase/client';

export interface AchievementProgress {
  achievement_id: string;
  progress: number;
  completed: boolean;
}

export interface AchievementUpdate {
  type: 'study' | 'quiz' | 'memory' | 'streak' | 'mastery' | 'social';
  value: number;
  metadata?: Record<string, any>;
}

/**
 * Update user achievement progress based on activity
 */
export const updateAchievementProgress = async (userId: string, update: AchievementUpdate) => {
  try {
    // Get all user achievements
    const { data: userAchievements, error: fetchError } = await supabase
      .from('user_traffic_sign_achievements')
      .select('*, achievement:traffic_sign_achievements(*)')
      .eq('user_id', userId);

    if (fetchError) throw fetchError;

    const updates: Promise<any>[] = [];

    for (const userAchievement of userAchievements || []) {
      const achievement = userAchievement.achievement;
      
      // Skip if already completed
      if (userAchievement.completed) continue;

      let newProgress = userAchievement.progress;
      let shouldComplete = false;

      // Update progress based on achievement type and update type
      switch (achievement.requirement_type) {
        case 'signs_studied':
          if (update.type === 'study') {
            newProgress += update.value;
          }
          break;

        case 'quiz_completed':
          if (update.type === 'quiz') {
            newProgress += update.value;
          }
          break;

        case 'memory_games_completed':
          if (update.type === 'memory') {
            newProgress += update.value;
          }
          break;

        case 'study_streak':
          if (update.type === 'streak') {
            newProgress = Math.max(newProgress, update.value);
          }
          break;

        case 'category_mastered':
          if (update.type === 'mastery' && update.metadata?.category) {
            newProgress += update.value;
          }
          break;

        case 'social_share':
          if (update.type === 'social') {
            newProgress += update.value;
          }
          break;

        case 'perfect_quiz':
          if (update.type === 'quiz' && update.metadata?.score === 100) {
            newProgress += update.value;
          }
          break;
      }

      // Check if achievement should be completed
      shouldComplete = newProgress >= achievement.requirement_value;

      // Prepare update
      const updateData: any = {
        progress: newProgress,
        updated_at: new Date().toISOString()
      };

      if (shouldComplete && !userAchievement.completed) {
        updateData.completed = true;
        updateData.completed_at = new Date().toISOString();
      }

      updates.push(
        supabase
          .from('user_traffic_sign_achievements')
          .update(updateData)
          .eq('id', userAchievement.id)
      );
    }

    // Execute all updates
    await Promise.all(updates);

    // Award points for completed achievements
    await awardPointsForCompletedAchievements(userId);

    return { success: true };
  } catch (error) {
    console.error('Error updating achievement progress:', error);
    return { success: false, error };
  }
};

/**
 * Award points and experience for completed achievements
 */
export const awardPointsForCompletedAchievements = async (userId: string) => {
  try {
    // Get user points
    const { data: userPoints, error: pointsError } = await supabase
      .from('user_traffic_sign_points')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (pointsError && pointsError.code !== 'PGRST116') throw pointsError;

    // Get newly completed but unclaimed achievements
    const { data: completedAchievements, error: achievementsError } = await supabase
      .from('user_traffic_sign_achievements')
      .select('*, achievement:traffic_sign_achievements(*)')
      .eq('user_id', userId)
      .eq('completed', true)
      .eq('claimed', false);

    if (achievementsError) throw achievementsError;

    if (!completedAchievements || completedAchievements.length === 0) {
      return { success: true, pointsAwarded: 0 };
    }

    // Calculate total points
    const totalPoints = completedAchievements.reduce((sum, ua) => {
      return sum + (ua.achievement.points_reward || 0);
    }, 0);

    if (totalPoints === 0) return { success: true, pointsAwarded: 0 };

    // Update user points and experience
    let currentPoints = userPoints?.total_points || 0;
    let currentExperience = userPoints?.current_experience || 0;
    let currentLevel = userPoints?.current_level || 1;
    let experienceToNext = userPoints?.experience_to_next_level || 100;

    currentPoints += totalPoints;
    currentExperience += totalPoints;

    // Check for level up
    let leveledUp = false;
    while (currentExperience >= experienceToNext) {
      currentExperience -= experienceToNext;
      currentLevel += 1;
      experienceToNext = currentLevel * 100; // Progressive difficulty
      leveledUp = true;
    }

    // Update user points
    const updateData = {
      total_points: currentPoints,
      current_experience: currentExperience,
      current_level: currentLevel,
      experience_to_next_level: experienceToNext,
      updated_at: new Date().toISOString()
    };

    if (userPoints) {
      await supabase
        .from('user_traffic_sign_points')
        .update(updateData)
        .eq('user_id', userId);
    } else {
      await supabase
        .from('user_traffic_sign_points')
        .insert({ ...updateData, user_id: userId });
    }

    // Mark achievements as claimed
    const achievementIds = completedAchievements.map(a => a.id);
    await supabase
      .from('user_traffic_sign_achievements')
      .update({ 
        claimed: true, 
        claimed_at: new Date().toISOString() 
      })
      .in('id', achievementIds);

    return { 
      success: true, 
      pointsAwarded: totalPoints,
      leveledUp,
      newLevel: currentLevel
    };
  } catch (error) {
    console.error('Error awarding points:', error);
    return { success: false, error };
  }
};

/**
 * Update user streak
 */
export const updateUserStreak = async (userId: string, streak: number) => {
  try {
    const { data, error } = await supabase
      .from('user_traffic_sign_points')
      .update({ 
        study_streak: streak,
        longest_streak: Math.max(streak, 0),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) throw error;

    // Check for streak achievements
    await updateAchievementProgress(userId, { type: 'streak', value: streak });

    return { success: true };
  } catch (error) {
    console.error('Error updating user streak:', error);
    return { success: false, error };
  }
};

/**
 * Initialize user achievements
 */
export const initializeUserAchievements = async (userId: string) => {
  try {
    // Get all available achievements
    const { data: achievements, error: achievementsError } = await supabase
      .from('traffic_sign_achievements')
      .select('*')
      .eq('is_active', true);

    if (achievementsError) throw achievementsError;

    // Check if user already has achievements
    const { data: existingAchievements, error: existingError } = await supabase
      .from('user_traffic_sign_achievements')
      .select('achievement_id')
      .eq('user_id', userId);

    if (existingError) throw existingError;

    const existingAchievementIds = new Set(existingAchievements?.map(a => a.achievement_id) || []);

    // Create missing user achievements
    const newAchievements = achievements?.filter(a => !existingAchievementIds.has(a.id)) || [];

    if (newAchievements.length === 0) {
      return { success: true, created: 0 };
    }

    const achievementsToCreate = newAchievements.map(achievement => ({
      user_id: userId,
      achievement_id: achievement.id,
      progress: 0,
      completed: false,
      claimed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { error: createError } = await supabase
      .from('user_traffic_sign_achievements')
      .insert(achievementsToCreate);

    if (createError) throw createError;

    // Initialize user points if not exists
    const { data: userPoints, error: pointsError } = await supabase
      .from('user_traffic_sign_points')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (pointsError && pointsError.code === 'PGRST116') {
      await supabase
        .from('user_traffic_sign_points')
        .insert({
          user_id: userId,
          total_points: 0,
          current_level: 1,
          current_experience: 0,
          experience_to_next_level: 100,
          study_streak: 0,
          longest_streak: 0,
          total_signs_studied: 0,
          total_quiz_completed: 0,
          total_memory_games_completed: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    }

    return { success: true, created: newAchievements.length };
  } catch (error) {
    console.error('Error initializing user achievements:', error);
    return { success: false, error };
  }
};