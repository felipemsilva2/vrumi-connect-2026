import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useIsAdmin = (userId: string | undefined) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('[useIsAdmin] Effect triggered - userId:', userId, 'type:', typeof userId);
    
    if (!userId) {
      console.log('[useIsAdmin] No userId provided, waiting...');
      setIsLoading(true);
      setIsAdmin(false);
      return;
    }

    console.log('[useIsAdmin] Valid userId detected, checking admin status...');
    checkAdmin(userId);
  }, [userId]);

  const checkAdmin = async (uid: string) => {
    console.log('[useIsAdmin] Starting checkAdmin with userId:', uid);
    setIsLoading(true);
    
    try {
      // Primeiro, verificar se o usuário está autenticado
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('[useIsAdmin] Current session:', session?.user?.id, 'Session error:', sessionError);
      
      if (sessionError) {
        console.error('[useIsAdmin] Session error:', sessionError);
        throw sessionError;
      }

      if (!session?.user) {
        console.warn('[useIsAdmin] No active session found');
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      // Chamar a função is_admin() do banco de dados
      console.log('[useIsAdmin] Calling RPC is_admin with user_id:', uid);
      const { data, error } = await supabase.rpc('is_admin', {
        user_id: uid
      });

      console.log('[useIsAdmin] RPC response - data:', data, 'error:', error);

      if (error) {
        console.error('[useIsAdmin] RPC error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      const adminStatus = data === true;
      console.log('[useIsAdmin] ✅ Admin check complete. Is admin?', adminStatus);
      setIsAdmin(adminStatus);
    } catch (error: any) {
      console.error('[useIsAdmin] ❌ Error checking admin status:', {
        message: error.message,
        details: error,
      });
      setIsAdmin(false);
    } finally {
      console.log('[useIsAdmin] Finished, setting isLoading to false');
      setIsLoading(false);
    }
  };

  return {
    isAdmin,
    isLoading,
    refresh: () => userId && checkAdmin(userId)
  };
};
