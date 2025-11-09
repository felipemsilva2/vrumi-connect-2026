import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useIsAdmin = (userId: string | undefined) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('[useIsAdmin] Effect triggered - userId:', userId);
    if (!userId) {
      console.log('[useIsAdmin] No userId, setting isAdmin to false');
      setIsLoading(false);
      setIsAdmin(false);
      return;
    }

    console.log('[useIsAdmin] Calling checkAdmin for userId:', userId);
    checkAdmin();
  }, [userId]);

  const checkAdmin = async () => {
    if (!userId) {
      console.log('[useIsAdmin] checkAdmin called without userId');
      return;
    }

    console.log('[useIsAdmin] Checking admin status for userId:', userId);
    try {
      // Chamar a função is_admin() do banco de dados
      const { data, error } = await supabase.rpc('is_admin', {
        user_id: userId
      });

      console.log('[useIsAdmin] RPC response - data:', data, 'error:', error);

      if (error) throw error;

      const adminStatus = data === true;
      console.log('[useIsAdmin] Setting isAdmin to:', adminStatus);
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error('[useIsAdmin] Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      console.log('[useIsAdmin] Finished checking, setting isLoading to false');
      setIsLoading(false);
    }
  };

  return {
    isAdmin,
    isLoading,
    refresh: checkAdmin
  };
};
