import React, { useState, useEffect, Suspense } from "react";
import {
  Home,
  BookOpen,
  Target,
  FileText,
  BarChart3,
  User,
  ChevronDown,
  ChevronsRight,
  Moon,
  Sun,
  TrendingUp,
  LogOut,
  Trophy,
  Clock,
  CheckCircle2,
  Award,
  Calendar,
  Shield,
  TrafficCone,
  PieChart,
  Bell,
  Settings,
  TrafficCone as TrafficSign,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useContextualNavigation } from "@/utils/navigation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Car } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useActivePass } from "@/hooks/useActivePass";
import { SmartBreadcrumb } from "@/components/SmartBreadcrumb";
import NotificationSystem from "@/components/notifications/NotificationSystem";
import NotificationSettings from "@/components/notifications/NotificationSettings";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardProps {
  user: any;
  profile: any;
}

export const DashboardWithSidebar = ({ user, profile }: DashboardProps) => {
  const [isDark, setIsDark] = useState(false);
  const [selected, setSelected] = useState("Dashboard");
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <div className={`flex min-h-screen w-full ${isDark ? 'dark' : ''}`}>
      <div className="flex w-full bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        {!isMobile && (
          <Sidebar user={user} selected={selected} setSelected={setSelected} />
        )}
        {isMobile && (
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetContent side="left" className="p-0 w-3/4 sm:max-w-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
              <Sidebar user={user} selected={selected} setSelected={(v: string) => { setSelected(v); setMobileMenuOpen(false); }} />
            </SheetContent>
          </Sheet>
        )}
        <MainContent 
          isDark={isDark} 
          setIsDark={setIsDark} 
          user={user} 
          profile={profile}
          selected={selected}
          isMobile={isMobile}
          openMobileMenu={() => setMobileMenuOpen(true)}
        />
      </div>
    </div>
  );
};

interface SidebarProps {
  user: any;
  selected: string;
  setSelected: (value: string) => void;
}

const Sidebar = ({ user, selected, setSelected }: SidebarProps) => {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();
  const homeRoute = useContextualNavigation();
  const { toast } = useToast();
  const { isAdmin, isLoading } = useIsAdmin(user?.id);
  const { hasActivePass, activePass, isLoading: isLoadingPass } = useActivePass(user?.id);
  
  console.log('[Sidebar] Rendering with:', {
    userId: user?.id,
    userEmail: user?.email,
    isAdmin,
    isLoading
  });

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Logout realizado",
        description: "Até logo!",
      });
      navigate(homeRoute);
    } catch (error: any) {
      toast({
        title: "Erro ao fazer logout",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAdminAccess = () => {
    navigate("/admin/dashboard");
  };

  return (
    <nav
      className={`sticky top-0 h-screen shrink-0 border-r transition-all duration-300 ease-in-out ${
        open ? 'w-64' : 'w-16'
      } border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-2 shadow-sm`}
    >
      <TitleSection open={open} user={user} hasActivePass={hasActivePass} activePass={activePass} />

      <div className="space-y-1 mb-8">
        <Option
          Icon={Home}
          title="Dashboard"
          selected={selected}
          setSelected={setSelected}
          open={open}
          tooltip="Página inicial do dashboard"
        />
        <Option
          Icon={BookOpen}
          title="Flashcards"
          selected={selected}
          setSelected={setSelected}
          open={open}
          tooltip="Estude com flashcards"
          dataTutorial="flashcards"
        />
        <Option
          Icon={Target}
          title="Simulados"
          selected={selected}
          setSelected={setSelected}
          open={open}
          notifs={2}
          tooltip="Teste seus conhecimentos com simulados"
          dataTutorial="simulados"
        />
        <Option
          Icon={FileText}
          title="Sala de Estudos"
          selected={selected}
          setSelected={setSelected}
          open={open}
          tooltip="Estude com IA e visualize materiais"
          isExternalLink
          externalPath="/study-room"
        />
        
        {/* TEMPORARIAMENTE OCULTO - Lançamento futuro
        <Option
          Icon={FileText}
          title="Materiais"
          selected={selected}
          setSelected={setSelected}
          open={open}
          tooltip="Materiais de estudo (em breve)"
        />
        */}
        <Option
          Icon={BarChart3}
          title="Estatísticas"
          selected={selected}
          setSelected={setSelected}
          open={open}
          tooltip="Veja seu desempenho"
        />
        <Option
          Icon={Bell}
          title="Notificações"
          selected={selected}
          setSelected={setSelected}
          open={open}
          tooltip="Configure suas notificações de estudo"
        />
        <Option
          Icon={TrafficSign}
          title="Biblioteca de Placas"
          selected={selected}
          setSelected={setSelected}
          open={open}
          tooltip="Consulte a biblioteca de placas de trânsito"
          isExternalLink
          externalPath="/traffic-signs-library"
        />
        <Option
          Icon={Trophy}
          title="Conquistas"
          selected={selected}
          setSelected={setSelected}
          open={open}
          notifs={1}
          tooltip="Suas conquistas"
        />
      </div>

      {isAdmin && open && (
        <div className="border-t border-gray-200 dark:border-gray-800 pt-4 space-y-1 mb-4">
          <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Administração
          </div>
          <button
            onClick={handleAdminAccess}
            className="relative flex h-12 w-full items-center rounded-md transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary dark:hover:text-primary"
          >
            <div className="grid h-full w-12 place-content-center">
              <Shield className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Área Admin</span>
          </button>
        </div>
      )}

      {open && (
        <div className="border-t border-gray-200 dark:border-gray-800 pt-4 space-y-1">
          <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Conta
          </div>
          <Option
            Icon={User}
            title="Meu Perfil"
            selected={selected}
            setSelected={setSelected}
            open={open}
          />
          <button
            onClick={handleSignOut}
            className="relative flex h-12 w-full items-center rounded-md transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
          >
            <div className="grid h-full w-12 place-content-center">
              <LogOut className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Sair</span>
          </button>
        </div>
      )}

      <ToggleClose open={open} setOpen={setOpen} />
    </nav>
  );
};

const Option = ({ Icon, title, selected, setSelected, open, notifs, tooltip, isExternalLink, externalPath, dataTutorial }: any) => {
  const navigate = useNavigate();
  const isSelected = selected === title;
  
  const handleClick = () => {
    if (isExternalLink && externalPath) {
      navigate(externalPath);
    } else {
      setSelected(title);
    }
  };
  
  return (
    <button
      onClick={handleClick}
      className={`relative flex h-12 w-full items-center rounded-md transition-all duration-200 ${
        isSelected 
          ? "bg-primary/10 dark:bg-primary/20 text-primary shadow-sm border-l-2 border-primary" 
          : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
      }`}
      aria-label={title}
      title={tooltip}
      data-tutorial={dataTutorial}
    >
      <div className="grid h-full w-12 place-content-center">
        <Icon className="h-5 w-5" />
      </div>
      {open && (
        <span
          className={`text-sm font-medium transition-opacity duration-200 ${
            open ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {title}
        </span>
      )}
      {notifs && open && (
        <span className="absolute right-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-medium">
          {notifs}
        </span>
      )}
    </button>
  );
};

const TitleSection = ({ open, user, hasActivePass, activePass }: any) => {
  const getPlanDisplay = () => {
    if (hasActivePass && activePass) {
      const daysRemaining = Math.ceil((new Date(activePass.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      const planType = activePass.pass_type === 'family_90_days' ? 'Família' : 
                      activePass.pass_type === '90_days' ? 'Premium 90 dias' : 'Premium 30 dias';
      return `${planType} (${daysRemaining}d restantes)`;
    }
    return 'Plano Gratuito';
  };

  return (
    <div className="mb-6 border-b border-gray-200 dark:border-gray-800 pb-4">
      <div className="flex cursor-pointer items-center justify-between rounded-md p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
        <div className="flex items-center gap-3">
          <Logo />
          {open && (
            <div className={`transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}>
              <div className="flex items-center gap-2">
                <div>
                  <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {user?.email?.split('@')[0] || 'Estudante'}
                  </span>
                  <span className={`block text-xs ${hasActivePass ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {getPlanDisplay()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        {open && (
          <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
        )}
      </div>
    </div>
  );
};

const Logo = () => {
  return (
    <div className="grid size-10 shrink-0 place-content-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-sm">
      <Car className="h-6 w-6 text-primary-foreground" />
    </div>
  );
};

const ToggleClose = ({ open, setOpen }: any) => {
  return (
    <button
      onClick={() => setOpen(!open)}
      className="absolute bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-800 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
      aria-label={open ? "Ocultar sidebar" : "Mostrar sidebar"}
      title={open ? "Ocultar menu lateral" : "Mostrar menu lateral"}
    >
      <div className="flex items-center p-4">
        <div className="grid size-12 place-content-center">
          <ChevronsRight
            className={`h-5 w-5 transition-transform duration-300 text-gray-500 dark:text-gray-400 ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
        {open && (
          <span
            className={`text-sm font-medium text-gray-600 dark:text-gray-300 transition-opacity duration-200 ${
              open ? 'opacity-100' : 'opacity-0'
            }`}
          >
            Ocultar
          </span>
        )}
      </div>
    </button>
  );
};

const LazyFlashcardsView = React.lazy(() => import("@/components/dashboard/FlashcardsView").then(m => ({ default: m.FlashcardsView })));
const LazySimuladosView = React.lazy(() => import("@/components/dashboard/SimuladosView").then(m => ({ default: m.SimuladosView })));
const LazyMateriaisView = React.lazy(() => import("@/components/dashboard/MateriaisView").then(m => ({ default: m.default })));
const LazyEstatisticasView = React.lazy(() => import("@/components/dashboard/EstatisticasView").then(m => ({ default: m.EstatisticasView })));
const LazyConquistasView = React.lazy(() => import("@/components/dashboard/ConquistasView").then(m => ({ default: m.ConquistasView })));
const LazyPerfilView = React.lazy(() => import("@/components/dashboard/PerfilView").then(m => ({ default: m.PerfilView })));

const MainContent = ({ isDark, setIsDark, user, profile, selected, isMobile, openMobileMenu }: any) => {
  const successRate = profile?.total_questions_answered 
    ? Math.round((profile.correct_answers / profile.total_questions_answered) * 100)
    : 0;

  // Helper function to format user name
  const formatUserName = (fullName: string | null, email: string | null): string => {
    if (fullName) {
      // Convert to title case and take only first name if name is too long
      const names = fullName.toLowerCase().split(' ');
      const firstName = names[0].charAt(0).toUpperCase() + names[0].slice(1);
      
      // If name is too long (>15 chars) or has many parts, use just first name
      if (fullName.length > 15 || names.length > 3) {
        return firstName;
      }
      
      // Otherwise, return first name or first + last if reasonable
      if (names.length === 1) {
        return firstName;
      } else {
        const lastName = names[names.length - 1].charAt(0).toUpperCase() + names[names.length - 1].slice(1);
        return `${firstName} ${lastName}`;
      }
    }
    
    // Fallback to email username
    if (email) {
      const username = email.split('@')[0];
      return username.length > 12 ? username.substring(0, 12) + '...' : username;
    }
    
    return 'Estudante';
  };

  const userName = formatUserName(profile?.full_name, user?.email);
  const greetingTime = new Date().getHours();
  const greeting = greetingTime < 12 ? 'Bom dia' : greetingTime < 18 ? 'Boa tarde' : 'Boa noite';

  const renderContent = () => {
    switch (selected) {
      case "Flashcards":
        return <LazyFlashcardsView />
      case "Simulados":
        return <LazySimuladosView />
      case "Materiais":
        return <LazyMateriaisView />
      case "Estatísticas":
        return <LazyEstatisticasView />
      case "Notificações":
        return <NotificationSettings />
      case "Conquistas":
        return <LazyConquistasView />
      case "Meu Perfil":
        return <LazyPerfilView user={user} profile={profile} />
      default:
        return <DashboardHome user={user} profile={profile} />
    }
  }

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 overflow-auto overscroll-y-contain pb-safe">
      <SmartBreadcrumb />
      {selected === "Dashboard" && (
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Olá, {profile?.full_name || user?.email?.split('@')[0]}! Continue estudando para sua CNH
            </p>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            {isMobile && (
              <button
                onClick={openMobileMenu}
                className="flex h-12 w-12 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                aria-label="Abrir menu"
                title="Menu"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            )}
            <NotificationSystem />
            <button
              onClick={() => setIsDark(!isDark)}
              className="flex h-12 w-12 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
              title={isDark ? "Modo claro" : "Modo escuro"}
            >
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      )}
      
      <Suspense fallback={<div className="p-4 text-sm text-gray-500">Carregando…</div>}>
        {renderContent()}
      </Suspense>
    </div>
  )
}

const DashboardHome = ({ user, profile }: any) => {
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [aggregates, setAggregates] = useState<any>(profile || {})
  const successRate = aggregates?.total_questions_answered 
    ? Math.round((aggregates.correct_answers / aggregates.total_questions_answered) * 100)
    : 0

  useEffect(() => {
    fetchRecentActivities()
  }, [user, refreshKey])

  const fetchRecentActivities = async () => {
    try {
      const { data, error } = await supabase
        .from("user_activities")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(5)

      if (error) throw error
      setRecentActivities(data || [])
    } catch (error) {
      console.error("Error fetching activities:", error)
    } finally {
      setLoading(false)
    }
  }

  // Atualiza agregados do perfil ao montar (garante sincronização visual)
  useEffect(() => {
    const fetchProfileAggregates = async () => {
      try {
        if (!user?.id) return
        const { data, error } = await supabase
          .from("profiles")
          .select("total_flashcards_studied,total_questions_answered,correct_answers,study_progress")
          .eq("id", user.id)
          .maybeSingle()
        if (!error && data) {
          setAggregates(data)
          // Forçamos re-render de atividades após ações em outras telas.
          setRefreshKey((k) => k + 1)
        }
      } catch (e) {
        console.error("Error fetching profile aggregates:", e)
      }
    }
    fetchProfileAggregates()
  }, [user])

  // Assinaturas Realtime para atualizar imediatamente quando houver mudanças
  useEffect(() => {
    if (!user?.id) return

    const activitiesChannel = supabase
      .channel(`user-activities-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'user_activities', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setRecentActivities((prev) => [payload.new as any, ...(prev || [])].slice(0, 5))
          setLoading(false)
        }
      )
      .subscribe()

    const profileChannel = supabase
      .channel(`profile-aggregates-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => {
          setAggregates(payload.new as any)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(activitiesChannel)
      supabase.removeChannel(profileChannel)
    }
  }, [user?.id])
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "flashcard_studied": return BookOpen
      case "quiz_completed": return CheckCircle2
      case "achievement_unlocked": return Trophy
      case "category_started": return Target
      case "personal_record": return Award
      default: return Calendar
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "flashcard_studied": return "blue"
      case "quiz_completed": return "green"
      case "achievement_unlocked": return "purple"
      case "category_started": return "orange"
      case "personal_record": return "green"
      default: return "blue"
    }
  }

  const formatActivityTime = (timestamp: string) => {
    const now = new Date()
    const activityDate = new Date(timestamp)
    const diffMs = now.getTime() - activityDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "Agora"
    if (diffMins < 60) return `${diffMins} min atrás`
    if (diffHours < 24) return `${diffHours}h atrás`
    if (diffDays === 0) return "Hoje"
    if (diffDays === 1) return "Ontem"
    return `${diffDays} dias atrás`
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8" data-tutorial="dashboard">
        <div className="p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <h3 className="font-medium text-gray-600 dark:text-gray-400 mb-1">Flashcards Estudados</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {aggregates?.total_flashcards_studied || 0}
          </p>
          <p className="text-sm text-success mt-1">Continue estudando!</p>
        </div>
        <div className="p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-success/10 dark:bg-success/20 rounded-lg">
              <Trophy className="h-5 w-5 text-success" />
            </div>
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <h3 className="font-medium text-gray-600 dark:text-gray-400 mb-1">Taxa de Acerto</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{successRate}%</p>
          <p className="text-sm text-success mt-1">Excelente desempenho!</p>
        </div>
        <div className="p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-accent/10 dark:bg-accent/20 rounded-lg">
              <Target className="h-5 w-5 text-accent" />
            </div>
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <h3 className="font-medium text-gray-600 dark:text-gray-400 mb-1">Questões Respondidas</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {aggregates?.total_questions_answered || 0}
          </p>
          <p className="text-sm text-success mt-1">Meta: 500 questões</p>
        </div>

        <div className="p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-secondary/10 dark:bg-secondary/20 rounded-lg">
              <BarChart3 className="h-5 w-5 text-secondary" />
            </div>
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <h3 className="font-medium text-gray-600 dark:text-gray-400 mb-1">Progresso Geral</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {aggregates?.study_progress || 0}%
          </p>
          <p className="text-sm text-success mt-1">Continue assim!</p>
        </div>
      </div>
    </>
  )
}

export default DashboardWithSidebar;
