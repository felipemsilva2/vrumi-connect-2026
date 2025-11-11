import { supabase } from "@/integrations/supabase/client";

export type ActivityType = 
  | "flashcard_studied"
  | "question_answered"
  | "simulado_started"
  | "simulado_completed"
  | "material_viewed"
  | "login"
  | "achievement_unlocked";

interface ActivityData {
  userId: string;
  activityType: ActivityType;
  metadata?: Record<string, any>;
}

export const trackActivity = async ({ userId, activityType, metadata }: ActivityData) => {
  try {
    const { error } = await supabase
      .from("user_activities")
      .insert({
        user_id: userId,
        activity_type: activityType,
        metadata: metadata || {},
      });

    if (error) {
      console.error("Error tracking activity:", error);
    }
  } catch (error) {
    console.error("Error tracking activity:", error);
  }
};

export const getRecentActivities = async (userId: string, limit = 10) => {
  try {
    const { data, error } = await supabase
      .from("user_activities")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching activities:", error);
    return [];
  }
};

export const getActivityStats = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("user_activities")
      .select("activity_type, created_at")
      .eq("user_id", userId)
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      byType: {} as Record<string, number>,
      byDay: {} as Record<string, number>,
    };

    data?.forEach((activity) => {
      // Count by type
      stats.byType[activity.activity_type] = (stats.byType[activity.activity_type] || 0) + 1;

      // Count by day
      const day = new Date(activity.created_at).toLocaleDateString("pt-BR");
      stats.byDay[day] = (stats.byDay[day] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error("Error fetching activity stats:", error);
    return { total: 0, byType: {}, byDay: {} };
  }
};
