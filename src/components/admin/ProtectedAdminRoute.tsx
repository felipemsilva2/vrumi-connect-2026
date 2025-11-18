import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Car } from "lucide-react";
import { toast } from "sonner";

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
  allowDpo?: boolean;
}

export const ProtectedAdminRoute = ({ children, allowDpo = false }: ProtectedAdminRouteProps) => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const { isAdmin, isLoading } = useIsAdmin(userId);
  const [isDpo, setIsDpo] = useState(false);
  const [checkingDpo, setCheckingDpo] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      console.log('[ProtectedAdminRoute] Getting user...');
      const { data: { user } } = await supabase.auth.getUser();
      console.log('[ProtectedAdminRoute] User:', user?.id, user?.email);
      if (!user) {
        console.log('[ProtectedAdminRoute] No user found, redirecting to /auth');
        navigate("/auth");
        return;
      }
      console.log('[ProtectedAdminRoute] Setting userId:', user.id);
      setUserId(user.id);
    };

    getUser();
  }, [navigate]);

  useEffect(() => {
    const checkDpo = async () => {
      if (!allowDpo || !userId) return;
      setCheckingDpo(true);
      try {
        const { data, error } = await supabase.rpc('is_dpo', { user_id: userId });
        if (error) throw error;
        setIsDpo(data === true);
      } catch (e) {
        console.error('[ProtectedAdminRoute] Error checking DPO:', e);
        const code = (e as any)?.code;
        if (code === 'PGRST202') {
          toast.warning('Recurso DPO não configurado', {
            description: 'A função public.is_dpo não foi encontrada. Aplique as migrações do Supabase.',
          });
        }
        setIsDpo(false);
      } finally {
        setCheckingDpo(false);
      }
    };
    checkDpo();
  }, [allowDpo, userId]);

  useEffect(() => {
    console.log('[ProtectedAdminRoute] Access check - isLoading:', isLoading, 'userId:', userId, 'isAdmin:', isAdmin, 'allowDpo:', allowDpo, 'isDpo:', isDpo, 'checkingDpo:', checkingDpo);
    if (!isLoading && (!allowDpo || !checkingDpo) && userId && !(isAdmin || (allowDpo && isDpo))) {
      console.log('[ProtectedAdminRoute] Access denied, redirecting to /dashboard');
      toast.error("Acesso negado", {
        description: "Você não tem permissão para acessar esta área."
      });
      navigate("/dashboard");
    }
  }, [isAdmin, isLoading, userId, navigate, allowDpo, isDpo, checkingDpo]);

  if (isLoading || checkingDpo || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Car className="w-12 h-12 animate-pulse mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!(isAdmin || (allowDpo && isDpo))) {
    return null;
  }

  return <>{children}</>;
};
