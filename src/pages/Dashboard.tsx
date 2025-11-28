import { useEffect, useState, Suspense, lazy } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { DashboardSkeleton } from "@/components/ui/skeleton-loaders";
import { OnboardingTutorial } from "@/components/OnboardingTutorial";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/utils/errorMessages";
import { AppLayout } from '@/components/Layout/AppLayout';
import { DashboardHome } from "@/components/dashboard/DashboardHome";

// Lazy load dashboard views
const FlashcardsView = lazy(() => import("@/components/dashboard/FlashcardsView").then(m => ({ default: m.FlashcardsView })));
const SimuladosView = lazy(() => import("@/components/dashboard/SimuladosView").then(m => ({ default: m.SimuladosView })));
const EstatisticasView = lazy(() => import("@/components/dashboard/EstatisticasView").then(m => ({ default: m.EstatisticasView })));
const ConquistasView = lazy(() => import("@/components/dashboard/ConquistasView").then(m => ({ default: m.ConquistasView })));
const PerfilView = lazy(() => import("@/components/dashboard/PerfilView").then(m => ({ default: m.PerfilView })));

interface Profile {
  full_name: string | null;
  study_progress: number;
  total_flashcards_studied: number;
  correct_answers: number;
  total_questions_answered: number;
}

const Dashboard = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedTab, setSelectedTab] = useState("Dashboard");

  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          navigate("/entrar");
        } else {
          setUser(session.user);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Sync selected tab with URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) {
      const tabMap: { [key: string]: string } = {
        'simulados': 'Simulados',
        'flashcards': 'Flashcards',
        'estatisticas': 'Estatísticas',
        'conquistas': 'Conquistas',
        'perfil': 'Meu Perfil',
        'dashboard': 'Dashboard'
      };
      if (tabMap[tab]) {
        setSelectedTab(tabMap[tab]);
      }
    } else if (location.pathname === '/painel') {
      setSelectedTab('Dashboard');
    }
  }, [location.search, location.pathname]);

  const checkUser = async () => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/entrar");
        return;
      }

      setUser(session.user);
      await fetchProfile(session.user.id);
    } catch (error) {
      const errorInfo = getErrorMessage(error);

      toast({
        title: errorInfo.title,
        description: errorInfo.message,
        variant: "destructive",
        duration: 5000,
      });

      console.error("Error checking user:", error);
      navigate("/entrar");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfile = async (userId: string) => {
    if (!isSupabaseConfigured || !navigator.onLine) return;
    try {
      const query = supabase
        .from("profiles")
        .select("*")
        .eq("id", userId);
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
      } else {
        data = null; error = null;
      }

      if (error) throw error;
      setProfile(data);

      const hasSeenOnboarding = localStorage.getItem(`onboarding_seen_${userId}`);

      if (data && (!data.study_progress || data.study_progress === 0) && !hasSeenOnboarding) {
        setTimeout(() => setShowOnboarding(true), 1000);
      }
    } catch (error) {
      const errorInfo = getErrorMessage(error);

      toast({
        title: errorInfo.title,
        description: errorInfo.message,
        variant: "destructive",
        duration: 5000,
      });

      console.error("Error fetching profile:", error);
    }
  };

  const handleSetSelected = (value: string) => {
    // Map component names back to URL params
    const reverseTabMap: { [key: string]: string } = {
      'Simulados': 'simulados',
      'Flashcards': 'flashcards',
      'Estatísticas': 'estatisticas',
      'Conquistas': 'conquistas',
      'Meu Perfil': 'perfil',
      'Dashboard': ''
    };

    const param = reverseTabMap[value];
    if (param !== undefined) {
      if (param === '') {
        navigate('/painel');
      } else {
        navigate(`/painel?tab=${param}`);
      }
    }
  };

  const renderContent = () => {
    switch (selectedTab) {
      case "Flashcards":
        return <FlashcardsView />;
      case "Simulados":
        return <SimuladosView />;
      case "Estatísticas":
        return <EstatisticasView />;
      case "Conquistas":
        return <ConquistasView />;
      case "Meu Perfil":
        return <PerfilView user={user} profile={profile} />;
      default:
        return <DashboardHome user={user} profile={profile} setSelected={handleSetSelected} />;
    }
  };

  const getPageTitle = () => {
    switch (selectedTab) {
      case "Flashcards": return "Flashcards";
      case "Simulados": return "Simulados";
      case "Estatísticas": return "Estatísticas";
      case "Conquistas": return "Conquistas";
      case "Meu Perfil": return "Meu Perfil";
      default: return "Dashboard";
    }
  };

  const getPageSubtitle = () => {
    switch (selectedTab) {
      case "Flashcards": return "Memorize placas e regras de trânsito";
      case "Simulados": return "Teste seus conhecimentos com provas oficiais";
      case "Estatísticas": return "Acompanhe seu desempenho e evolução";
      case "Conquistas": return "Suas medalhas e recompensas";
      case "Meu Perfil": return "Gerencie sua conta e assinatura";
      default: return `Olá, ${profile?.full_name || user?.email?.split('@')[0]}! Continue estudando para sua CNH`;
    }
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <AppLayout
      user={user}
      profile={profile}
      title={getPageTitle()}
      subtitle={getPageSubtitle()}
    >
      <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
        {renderContent()}
      </Suspense>

      <OnboardingTutorial
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={() => console.log("Onboarding completed")}
        userId={user?.id}
      />
    </AppLayout>
  );
};

export default Dashboard;