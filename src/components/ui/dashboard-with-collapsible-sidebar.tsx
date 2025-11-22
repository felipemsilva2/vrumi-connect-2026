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
  CreditCard,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useContextualNavigation } from "@/utils/navigation";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Car } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useActivePass } from "@/hooks/useActivePass";
import { SmartBreadcrumb } from "@/components/SmartBreadcrumb";
import NotificationSystem from "@/components/notifications/NotificationSystem";
import NotificationSettings from "@/components/notifications/NotificationSettings";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { ModernCard, ModernCardContent } from "@/components/ui/modern-card";
import { ModernButton } from "@/components/ui/modern-button";
import { useMateriaisHierarchy } from "@/hooks/useMateriaisHierarchy";

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
      <div className="flex w-full bg-background text-foreground">
        {!isMobile && (
          <Sidebar user={user} selected={selected} setSelected={setSelected} />
        )}
        {isMobile && (
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetContent side="left" className="p-0 w-3/4 sm:max-w-sm bg-background text-foreground">
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
          setSelected={setSelected}
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
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw error;

      toast({
        title: "Logout realizado",
        description: "Até logo!",
      });
      navigate("/");
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
      className={`sticky top-0 h-screen shrink-0 border-r transition-all duration-300 ease-in-out ${open ? 'w-64' : 'w-16'
        } border-border bg-background p-2 shadow-sm`}
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
          Icon={TrafficCone}
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
        <div className="border-t border-border pt-4 space-y-1 mb-4">
          <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Administração
          </div>
          <ModernButton
            onClick={handleAdminAccess}
            variant="ghost"
            size="lg"
            className="w-full justify-start text-muted-foreground hover:bg-primary/10 hover:text-primary"
          >
            <div className="grid h-full w-12 place-content-center">
              <Shield className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Área Admin</span>
          </ModernButton>
        </div>
      )}

      {open && (
        <div className="border-t border-border pt-4 space-y-1">
          <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Conta
          </div>
          <Option
            Icon={User}
            title="Meu Perfil"
            selected={selected}
            setSelected={setSelected}
            open={open}
          />
          <ModernButton
            onClick={handleSignOut}
            variant="ghost"
            size="lg"
            className="w-full justify-start text-muted-foreground hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
          >
            <div className="grid h-full w-12 place-content-center">
              <LogOut className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Sair</span>
          </ModernButton>
        </div>
      )}

      <ToggleClose open={open} setOpen={setOpen} />
    </nav>
  );
};

const Option = ({ Icon, title, selected, setSelected, open, notifs, tooltip, isExternalLink, externalPath, dataTutorial }: any) => {
  const navigate = useNavigate();
  const isSelected = selected === title;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isExternalLink && externalPath) {
      navigate(externalPath);
    } else {
      // Force immediate state update
      setSelected(title);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`relative flex h-12 w-full items-center rounded-md transition-all duration-200 ${isSelected
          ? "bg-primary/10 text-primary shadow-sm border-l-2 border-primary"
          : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
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
          className={`text-sm font-medium transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'
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
    <div className="mb-6 border-b border-border pb-4">
      <div className="flex cursor-pointer items-center justify-between rounded-md p-2 transition-colors hover:bg-accent/10">
        <div className="flex items-center gap-3">
          <Logo />
          {open && (
            <div className={`transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'}`}>
              <div className="flex items-center gap-2">
                <div>
                  <span className="block text-sm font-semibold text-foreground">
                    {user?.email?.split('@')[0] || 'Estudante'}
                  </span>
                  <span className={`block text-xs ${hasActivePass ? 'text-success' : 'text-muted-foreground'}`}>
                    {getPlanDisplay()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        {open && (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
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
    <ModernButton
      onClick={() => setOpen(!open)}
      variant="ghost"
      size="lg"
      className="absolute bottom-0 left-0 right-0 border-t border-border transition-colors hover:bg-accent/10 w-full justify-start rounded-none"
      aria-label={open ? "Ocultar sidebar" : "Mostrar sidebar"}
      title={open ? "Ocultar menu lateral" : "Mostrar menu lateral"}
    >
      <div className="flex items-center p-4">
        <div className="grid size-12 place-content-center">
          <ChevronsRight
            className={`h-5 w-5 transition-transform duration-300 text-muted-foreground ${open ? "rotate-180" : ""
              }`}
          />
        </div>
        {open && (
          <span
            className={`text-sm font-medium text-muted-foreground transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0'
              }`}
          >
            Ocultar
          </span>
        )}
      </div>
    </ModernButton>
  );
};

const LazyFlashcardsView = React.lazy(() => import("@/components/dashboard/FlashcardsView").then(m => ({ default: m.FlashcardsView })));
const LazySimuladosView = React.lazy(() => import("@/components/dashboard/SimuladosView").then(m => ({ default: m.SimuladosView })));
const LazyMateriaisView = React.lazy(() => import("@/components/dashboard/MateriaisView").then(m => ({ default: m.default })));
const LazyEstatisticasView = React.lazy(() => import("@/components/dashboard/EstatisticasView").then(m => ({ default: m.EstatisticasView })));
const LazyConquistasView = React.lazy(() => import("@/components/dashboard/ConquistasView").then(m => ({ default: m.ConquistasView })));
const LazyPerfilView = React.lazy(() => import("@/components/dashboard/PerfilView").then(m => ({ default: m.PerfilView })));

const MainContent = ({ isDark, setIsDark, user, profile, selected, setSelected, isMobile, openMobileMenu }: any) => {
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
        return <DashboardHome user={user} profile={profile} setSelected={setSelected} />
    }
  }

  return (
    <div className="flex-1 bg-background p-4 sm:p-6 overflow-auto overscroll-y-contain pb-safe">
      <SmartBreadcrumb />
      {selected === "Dashboard" && (
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Olá, {profile?.full_name || user?.email?.split('@')[0]}! Continue estudando para sua CNH
            </p>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            {isMobile && (
              <ModernButton
                onClick={openMobileMenu}
                variant="outline"
                size="lg"
                className="h-12 w-12 p-0 border-border bg-background text-foreground hover:bg-accent/10"
                aria-label="Abrir menu"
                title="Menu"
              >
                <ChevronDown className="h-5 w-5" />
              </ModernButton>
            )}
            <NotificationSystem />
            <ModernButton
              onClick={() => setIsDark(!isDark)}
              variant="outline"
              size="lg"
              className="h-12 w-12 p-0 border-border bg-background text-foreground hover:bg-accent/10"
              aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
              title={isDark ? "Modo claro" : "Modo escuro"}
            >
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </ModernButton>
          </div>
        </div>
      )}

      <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Carregando…</div>}>
        {renderContent()}
      </Suspense>
    </div>
  )
}

const DashboardHome = ({ user, profile, setSelected }: any) => {
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [aggregates, setAggregates] = useState<any>(profile || {})
  const [pendingReviews, setPendingReviews] = useState<number>(0)
  const [categoryProgress, setCategoryProgress] = useState<any[]>([])
  const [quizStats, setQuizStats] = useState<any>({})
  const [trafficSignsStats, setTrafficSignsStats] = useState<any>({ studied: 0, total: 0, confidence: 0 })
  const successRate = aggregates?.total_questions_answered
    ? Math.round((aggregates.correct_answers / aggregates.total_questions_answered) * 100)
    : 0

  // Hooks para dados de assinatura e hierarquia
  const { hasActivePass, activePass, daysRemaining } = useActivePass(user?.id)
  const materiaisQuery = useMateriaisHierarchy()
  const { data: materiaisData, isLoading: materiaisLoading } = materiaisQuery

  // Extract modules and chapters from the query data
  const modules = materiaisData || []
  const chapters = materiaisData?.flatMap(module => module.chapters) || []
  const lessons = materiaisData?.flatMap(module => module.chapters.flatMap(chapter => chapter.lessons)) || []

  useEffect(() => {
    fetchRecentActivities()
    fetchPendingReviews()
    fetchCategoryProgress()
    fetchQuizStats()
    fetchTrafficSignsStats()
  }, [user, refreshKey])

  const fetchPendingReviews = async () => {
    if (!user?.id || !isSupabaseConfigured || !navigator.onLine) return

    try {
      // Primeiro, verificar se há cartões com SM-2 disponíveis
      const { data: sm2Data, error: sm2Error } = await supabase
        .from("flashcards")
        .select("id")
        .eq("user_id", user.id)
        .not("due_date", "is", null)
        .lte("due_date", new Date().toISOString())
        .limit(100)

      if (!sm2Error && sm2Data && sm2Data.length > 0) {
        setPendingReviews(sm2Data.length)
        return
      }

      // Fallback: usar user_flashcard_stats
      const { data: statsData, error: statsError } = await supabase
        .from("user_flashcard_stats")
        .select("id")
        .eq("user_id", user.id)
        .not("next_review", "is", null)
        .lte("next_review", new Date().toISOString())
        .limit(100)

      if (!statsError && statsData) {
        setPendingReviews(statsData.length)
      }
    } catch (error) {
      console.error("Error fetching pending reviews:", error)
      setPendingReviews(0)
    }
  }

  const fetchCategoryProgress = async () => {
    if (!user?.id || !isSupabaseConfigured || !navigator.onLine || !modules.length) return

    try {
      // Buscar progresso do usuário por capítulos
      const { data: userProgress, error: progressError } = await supabase
        .from("user_progress")
        .select("chapter_id, completed")
        .eq("user_id", user.id)

      if (progressError) throw progressError

      // Calcular progresso por módulo
      const moduleProgress = modules.map(module => {
        const moduleChapters = chapters.filter(chapter => chapter.module_id === module.id)
        const completedChapters = moduleChapters.filter(chapter =>
          userProgress?.some(progress => progress.chapter_id === chapter.id && progress.completed)
        ).length
        const totalChapters = moduleChapters.length
        const progress = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0

        return {
          name: module.name,
          progress,
          color: getModuleColor(module.name)
        }
      }).filter(module => module.progress > 0) // Mostrar apenas módulos com progresso

      setCategoryProgress(moduleProgress)
    } catch (error) {
      console.error("Error fetching category progress:", error)
      setCategoryProgress([])
    }
  }

  const fetchQuizStats = async () => {
    if (!user?.id || !isSupabaseConfigured || !navigator.onLine) return

    try {
      // Buscar últimas tentativas de simulados
      const { data: attempts, error: attemptsError } = await supabase
        .from("user_quiz_attempts")
        .select("score, total_questions, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5)

      if (attemptsError) throw attemptsError

      // Buscar tentativas dos últimos 7 dias
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data: weekAttempts, error: weekError } = await supabase
        .from("user_quiz_attempts")
        .select("score, total_questions")
        .eq("user_id", user.id)
        .gte("created_at", sevenDaysAgo.toISOString())

      if (weekError) throw weekError

      // Calcular estatísticas
      const lastAttempt = attempts?.[0]
      const weekAverage = weekAttempts && weekAttempts.length > 0
        ? Math.round(weekAttempts.reduce((sum, attempt) =>
          sum + (attempt.score / attempt.total_questions) * 100, 0) / weekAttempts.length)
        : 0

      setQuizStats({
        lastScore: lastAttempt ? Math.round((lastAttempt.score / lastAttempt.total_questions) * 100) : 0,
        weekAverage,
        totalAttempts: attempts?.length || 0
      })
    } catch (error) {
      console.error("Error fetching quiz stats:", error)
      setQuizStats({ lastScore: 0, weekAverage: 0, totalAttempts: 0 })
    }
  }

  const fetchTrafficSignsStats = async () => {
    if (!user?.id || !isSupabaseConfigured || !navigator.onLine) return

    try {
      // Buscar total de placas disponíveis
      const { data: totalSigns, error: totalError } = await supabase
        .from("traffic_signs")
        .select("id")
        .eq("is_active", true)

      if (totalError) throw totalError

      // Buscar progresso do usuário em placas
      const { data: userProgress, error: progressError } = await supabase
        .from("user_sign_progress")
        .select("sign_id, times_reviewed, times_correct, confidence_level")
        .eq("user_id", user.id)

      if (progressError) throw progressError

      const studiedSigns = userProgress?.length || 0
      const totalAvailable = totalSigns?.length || 0
      const averageConfidence = userProgress && userProgress.length > 0
        ? Math.round(userProgress.reduce((sum, sign) => sum + (sign.confidence_level || 0), 0) / userProgress.length)
        : 0

      setTrafficSignsStats({
        studied: studiedSigns,
        total: totalAvailable,
        confidence: averageConfidence
      })
    } catch (error) {
      console.error("Error fetching traffic signs stats:", error)
      setTrafficSignsStats({ studied: 0, total: 0, confidence: 0 })
    }
  }

  const getModuleColor = (moduleName: string) => {
    const colors = {
      'Direção Defensiva': 'bg-blue-500',
      'Primeiros Socorros': 'bg-green-500',
      'Mecânica Básica': 'bg-orange-500',
      'Legislação': 'bg-purple-500',
      'Noções de Mecânica': 'bg-red-500',
      'Direção': 'bg-indigo-500',
      'Mecânica': 'bg-yellow-500'
    }
    return colors[moduleName as keyof typeof colors] || 'bg-gray-500'
  }

  const fetchRecentActivities = async () => {
    if (!isSupabaseConfigured || !navigator.onLine || !user?.id) {
      setLoading(false)
      return
    }
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
        if (!user?.id || !isSupabaseConfigured || !navigator.onLine) return
        const query = supabase
          .from("profiles")
          .select("total_flashcards_studied,total_questions_answered,correct_answers,study_progress")
          .eq("id", user.id)
        let data: any = null
        let error: any = null
        if (typeof (query as any).maybeSingle === 'function') {
          ({ data, error } = await (query as any).maybeSingle())
        } else if (typeof (query as any).single === 'function') {
          try {
            ({ data, error } = await (query as any).single())
          } catch {
            data = null; error = null
          }
        }
        if (!error && data) {
          setAggregates(data)
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

    let activitiesChannel: any = null
    if (typeof (supabase as any).channel === 'function') {
      activitiesChannel = (supabase as any)
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
    }

    let profileChannel: any = null
    if (typeof (supabase as any).channel === 'function') {
      profileChannel = (supabase as any)
        .channel(`profile-aggregates-${user.id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
          (payload) => {
            setAggregates(payload.new as any)
          }
        )
        .subscribe()
    }

    return () => {
      if (activitiesChannel) (supabase as any).removeChannel(activitiesChannel)
      if (profileChannel) (supabase as any).removeChannel(profileChannel)
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
      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mb-6 lg:mb-8" data-tutorial="dashboard">
        <ModernCard variant="elevated" interactive={true} className="p-4 sm:p-6 h-full">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <h3 className="font-medium text-muted-foreground mb-1">Flashcards Estudados</h3>
          <p className="text-2xl font-bold text-foreground">
            {aggregates?.total_flashcards_studied || 0}
          </p>
          <p className="text-sm text-success mt-1">Continue estudando!</p>
        </ModernCard>

        <ModernCard variant="elevated" interactive={true} className="p-4 sm:p-6 h-full">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-success/10 dark:bg-success/20 rounded-lg">
              <Trophy className="h-5 w-5 text-success" />
            </div>
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <h3 className="font-medium text-muted-foreground mb-1">Taxa de Acerto</h3>
          <p className="text-2xl font-bold text-foreground">{successRate}%</p>
          <p className="text-sm text-success mt-1">Excelente desempenho!</p>
        </ModernCard>

        <ModernCard variant="elevated" interactive={true} className="p-4 sm:p-6 h-full">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-accent/10 dark:bg-accent/20 rounded-lg">
              <Target className="h-5 w-5 text-accent" />
            </div>
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <h3 className="font-medium text-muted-foreground mb-1">Questões Respondidas</h3>
          <p className="text-2xl font-bold text-foreground">
            {aggregates?.total_questions_answered || 0}
          </p>
          <p className="text-sm text-success mt-1">Meta: 500 questões</p>
        </ModernCard>

        <ModernCard variant="elevated" interactive={true} className="p-4 sm:p-6 h-full">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-secondary/10 dark:bg-secondary/20 rounded-lg">
              <BarChart3 className="h-5 w-5 text-secondary" />
            </div>
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <h3 className="font-medium text-muted-foreground mb-1">Progresso Geral</h3>
          <p className="text-2xl font-bold text-foreground">
            {aggregates?.study_progress || 0}%
          </p>
          <p className="text-sm text-success mt-1">Continue assim!</p>
        </ModernCard>

        {/* Placas de Trânsito */}
        <ModernCard
          variant="elevated"
          interactive={true}
          className="p-4 sm:p-6 h-full cursor-pointer"
          onClick={() => {
            console.log('Navigating to Biblioteca de Placas...')
            setSelected("Biblioteca de Placas")
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-500/10 dark:bg-yellow-500/20 rounded-lg">
              <TrafficCone className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <h3 className="font-medium text-muted-foreground mb-1">Placas Estudadas</h3>
          <p className="text-2xl font-bold text-foreground">
            {trafficSignsStats.studied} de {trafficSignsStats.total}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Confiança: {trafficSignsStats.confidence}%
          </p>
        </ModernCard>
      </div>

      {/* Seção de Revisões e Progresso */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 lg:mb-8">
        {/* Revisões Pendentes SRS */}
        <ModernCard variant="elevated" className="p-6 h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Revisões Pendentes</h3>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="space-y-4">
            {pendingReviews > 0 ? (
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Revisão Diária</p>
                    <p className="text-sm text-muted-foreground">{pendingReviews} flashcards pendentes</p>
                  </div>
                </div>
                <ModernButton
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    console.log('Navigating to Flashcards...')
                    setSelected("Flashcards")
                  }}
                >
                  Revisar
                </ModernButton>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-4xl mb-2">🧠</div>
                <p className="text-sm text-muted-foreground">Nenhuma revisão pendente!</p>
                <p className="text-xs text-muted-foreground mt-1">Continue estudando para criar novas revisões</p>
              </div>
            )}
          </div>
        </ModernCard>

        {/* Progresso por Categoria */}
        <ModernCard variant="elevated" className="p-6 h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Progresso por Categoria</h3>
            <Target className="h-5 w-5 text-muted-foreground" />
          </div>

          {categoryProgress.length > 0 ? (
            <div className="space-y-3">
              {categoryProgress.map((category) => (
                <div key={category.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-foreground">{category.name}</span>
                    <span className="text-muted-foreground">{category.progress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`${category.color} h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${category.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-4xl mb-2">📚</div>
              <p className="text-sm text-muted-foreground">Comece a estudar para ver seu progresso!</p>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-border">
            <ModernButton
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                console.log('Navigating to Estatísticas...')
                setSelected("Estatísticas")
              }}
            >
              Ver Detalhes
            </ModernButton>
          </div>
        </ModernCard>
      </div>

      {/* Cards de Assinatura e Simulados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 lg:mb-8">
        {/* Status da Assinatura */}
        <ModernCard variant="elevated" className="p-6 h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Status da Assinatura</h3>
            <CreditCard className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="space-y-4">
            {hasActivePass ? (
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{activePass?.pass_type || 'Plano Ativo'}</p>
                  <p className="text-sm text-muted-foreground">
                    {daysRemaining > 0 ? `${daysRemaining} dias restantes` : 'Expira hoje'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-4xl mb-2">🔒</div>
                <p className="text-sm text-muted-foreground mb-2">Assinatura não ativa</p>
                <ModernButton
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    console.log('Navigating to Meu Perfil...')
                    setSelected("Meu Perfil")
                  }}
                >
                  Ativar Plano
                </ModernButton>
              </div>
            )}
          </div>
        </ModernCard>

        {/* Resumo de Simulados */}
        <ModernCard variant="elevated" className="p-6 h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Resumo de Simulados</h3>
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
          </div>

          {quizStats.totalAttempts > 0 ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Última Pontuação</span>
                <span className="font-semibold">{quizStats.lastScore}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Média 7 dias</span>
                <span className="font-semibold">{quizStats.weekAverage}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total de Tentativas</span>
                <span className="font-semibold">{quizStats.totalAttempts}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-4xl mb-2">📝</div>
              <p className="text-sm text-muted-foreground">Nenhum simulado realizado</p>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-border">
            <ModernButton
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setSelected("Simulados")}
            >
              Ver Detalhes
            </ModernButton>
          </div>
        </ModernCard>
      </div>

      {/* Atividades Recentes */}
      <ModernCard variant="glass" className="mb-6 lg:mb-8">
        <ModernCardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Atividades Recentes</h3>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 animate-pulse">
                  <div className="w-8 h-8 bg-muted rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivities.length > 0 ? (
            <div className="space-y-3">
              {recentActivities.map((activity, index) => {
                const IconComponent = getActivityIcon(activity.type)
                const colorClass = getActivityColor(activity.type)

                // Define colors based on activity type
                const colorStyles = {
                  blue: { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
                  green: { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400' },
                  purple: { bg: 'bg-purple-100 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400' },
                  orange: { bg: 'bg-orange-100 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400' },
                  red: { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400' }
                }

                const style = colorStyles[colorClass as keyof typeof colorStyles] || colorStyles.blue

                return (
                  <div key={activity.id || index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${style.bg}`}>
                      <IconComponent className={`h-4 w-4 ${style.text}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{formatActivityTime(activity.created_at)}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {activity.category && <Badge variant="outline" className="text-xs">{activity.category}</Badge>}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📚</div>
              <p className="text-muted-foreground">Nenhuma atividade recente. Comece a estudar!</p>
              <ModernButton
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  console.log('Navigating to Flashcards...')
                  setSelected("Flashcards")
                }}
              >
                Ver Flashcards
              </ModernButton>
            </div>
          )}
        </ModernCardContent>
      </ModernCard>
    </>
  )
}

export default DashboardWithSidebar;
