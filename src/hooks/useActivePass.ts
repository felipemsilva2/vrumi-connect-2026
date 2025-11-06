import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ActivePass {
  id: string;
  pass_type: "30_days" | "90_days";
  expires_at: string;
  purchased_at: string;
}

export const useActivePass = (userId: string | undefined) => {
  const [hasActivePass, setHasActivePass] = useState(false);
  const [activePass, setActivePass] = useState<ActivePass | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    checkActivePass();

    // Set up real-time subscription
    const channel = supabase
      .channel('user_passes_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_passes',
          filter: `user_id=eq.${userId}`
        },
        () => {
          checkActivePass();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const checkActivePass = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('user_passes')
        .select('*')
        .eq('user_id', userId)
        .eq('payment_status', 'completed')
        .gt('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      setHasActivePass(!!data);
      setActivePass(data);
    } catch (error) {
      console.error('Error checking active pass:', error);
      setHasActivePass(false);
      setActivePass(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysRemaining = (): number => {
    if (!activePass) return 0;
    const now = new Date();
    const expiresAt = new Date(activePass.expires_at);
    const diffTime = expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  return {
    hasActivePass,
    activePass,
    isLoading,
    daysRemaining: getDaysRemaining(),
    refresh: checkActivePass
  };
};
