import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";

interface ActivePass {
  id: string;
  pass_type: "30_days" | "90_days" | "family_90_days";
  expires_at: string;
  purchased_at: string;
}

export const useActivePass = (userId: string | undefined) => {
  const [hasActivePass, setHasActivePass] = useState(false);
  const [activePass, setActivePass] = useState<ActivePass | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId || !isSupabaseConfigured || !navigator.onLine) {
      setIsLoading(false);
      return;
    }

    checkActivePass();

    // Set up real-time subscription (guard if Realtime not available)
    let channel: any = null;
    if (typeof (supabase as any).channel === 'function') {
      channel = (supabase as any)
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
    }

    return () => {
      if (channel) {
        (supabase as any).removeChannel(channel);
      }
    };
  }, [userId]);

  const checkActivePass = async () => {
    if (!userId || !isSupabaseConfigured || !navigator.onLine) return;

    try {
      const query = supabase
        .from('user_passes')
        .select('*')
        .eq('user_id', userId)
        .eq('payment_status', 'completed')
        .gt('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: false })
        .limit(1);
      let data: any = null;
      let error: any = null;
      if (typeof (query as any).maybeSingle === 'function') {
        ({ data, error } = await (query as any).maybeSingle());
      } else if (typeof (query as any).single === 'function') {
        try {
          ({ data, error } = await (query as any).single());
        } catch {
          data = null; error = null;
        }
      }

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
