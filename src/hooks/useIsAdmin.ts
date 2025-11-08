import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useIsAdmin = (userId: string | undefined) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      setIsAdmin(false);
      return;
    }

    checkAdmin();
  }, [userId]);

  const checkAdmin = async () => {
    if (!userId) return;

    try {
      // Chamar a função is_admin() do banco de dados
      const { data, error } = await supabase.rpc('is_admin', {
        user_id: userId
      });

      if (error) throw error;

      setIsAdmin(data === true);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isAdmin,
    isLoading,
    refresh: checkAdmin
  };
};
