import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Car } from "lucide-react";
import { toast } from "sonner";

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export const ProtectedAdminRoute = ({ children }: ProtectedAdminRouteProps) => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const { isAdmin, isLoading } = useIsAdmin(userId);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUserId(user.id);
    };

    getUser();
  }, [navigate]);

  useEffect(() => {
    if (!isLoading && userId && !isAdmin) {
      toast.error("Acesso negado", {
        description: "Você não tem permissão para acessar esta área."
      });
      navigate("/dashboard");
    }
  }, [isAdmin, isLoading, userId, navigate]);

  if (isLoading || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Car className="w-12 h-12 animate-pulse mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
};
