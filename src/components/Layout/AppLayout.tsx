import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  LogOut,
  Trophy,
  Shield,
  TrafficCone,
  Car,
  Sparkles
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useActivePass } from "@/hooks/useActivePass";
import { SmartBreadcrumb } from "@/components/SmartBreadcrumb";
import { useTheme } from "@/components/ThemeProvider";
import { MobileBottomNav } from "./MobileBottomNav";
import { ModernMobileSidebar } from "./ModernMobileSidebar";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
  user: any;
  profile: any;
  title?: string;
  subtitle?: string;
  showBreadcrumb?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  user,
  profile,
  title,
  subtitle,
  showBreadcrumb = true
}) => {
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { isAdmin } = useIsAdmin(user?.id);
  const { hasActivePass, activePass } = useActivePass(user?.id);

  useEffect(() => {
    // Close mobile menu when route changes
    setMobileMenuOpen(false);
  }, [location]);

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

  const getPageTitle = () => {
    if (title) return title;

    const path = location.pathname;
    if (path.includes('/biblioteca-de-placas')) return 'Biblioteca de Placas';
    if (path.includes('/sala-de-estudos')) return 'Sala de Estudos';
    if (path.includes('/painel')) return 'Dashboard';
    return 'Vrumi';
  };

  const getPageSubtitle = () => {
    if (subtitle) return subtitle;

    const path = location.pathname;
    if (path.includes('/biblioteca-de-placas')) return 'Consulte todas as placas de trânsito brasileiras';
    if (path.includes('/sala-de-estudos')) return 'Estude com IA e visualize materiais';
    if (path.includes('/painel')) return 'Continue estudando para sua CNH';
    return '';
  };

  const formatUserName = (fullName: string | null, email: string | null): string => {
    if (fullName) {
      const names = fullName.toLowerCase().split(' ');
      const firstName = names[0].charAt(0).toUpperCase() + names[0].slice(1);

      if (fullName.length > 15 || names.length > 3) {
        return firstName;
      }

      if (names.length === 1) {
        return firstName;
      } else {
        const lastName = names[names.length - 1].charAt(0).toUpperCase() + names[names.length - 1].slice(1);
        return `${firstName} ${lastName}`;
      }
    }

    if (email) {
      const username = email.split('@')[0];
      return username.length > 12 ? username.substring(0, 12) + '...' : username;
    }

    return 'Estudante';
  };

  const getPlanDisplay = () => {
    if (hasActivePass && activePass) {
      const daysRemaining = Math.ceil((new Date(activePass.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      const planType = activePass.pass_type === 'family_90_days' ? 'Família' :
        activePass.pass_type === '90_days' ? 'Premium 90 dias' : 'Premium 30 dias';
      return `${planType} (${daysRemaining}d restantes)`;
    }
    return 'Plano Gratuito';
  };

  const userName = formatUserName(profile?.full_name, user?.email);

  const navigationItems = [
    { label: "Dashboard", icon: Home, path: "/painel", tooltip: "Página inicial do dashboard", description: "Visão geral" },
    { label: "Flashcards", icon: BookOpen, path: "/painel?tab=flashcards", tooltip: "Estude com flashcards", description: "Memorização" },
    { label: "Simulados", icon: Target, path: "/painel?tab=simulados", tooltip: "Teste seus conhecimentos com simulados", notifs: 2, description: "Pratique agora" },
    { label: "Sala de Estudos", icon: FileText, path: "/sala-de-estudos", tooltip: "Estude com IA e visualize materiais", isExternal: true, description: "IA e Materiais" },
    { label: "Estatísticas", icon: BarChart3, path: "/painel?tab=estatisticas", tooltip: "Veja seu desempenho", description: "Seu progresso" },
    { label: "Biblioteca de Placas", icon: TrafficCone, path: "/biblioteca-de-placas", tooltip: "Consulte a biblioteca de placas de trânsito", isExternal: true, description: "Consulta rápida" },
    { label: "Conquistas", icon: Trophy, path: "/painel?tab=conquistas", tooltip: "Suas conquistas", notifs: 1, description: "Suas medalhas" },
  ];

  const isActiveRoute = (path: string) => {
    const [targetPath, targetQuery] = path.split('?');

    // Check if pathnames match
    if (location.pathname !== targetPath) {
      return false;
    }

    // If the navigation item has a query string (e.g. tab=flashcards)
    if (targetQuery) {
      return location.search === `?${targetQuery}`;
    }

    // If the navigation item has NO query string (e.g. /painel)
    // It should only be active if the current URL also has NO query string
    return location.search === '';
  };

  return (
    <div className="flex min-h-[100dvh] w-full">
      <div className="flex w-full bg-background text-foreground">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <div
            className={cn(
              "sticky top-0 h-[100dvh] shrink-0 border-r border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 ease-in-out z-40 flex flex-col",
              sidebarOpen ? "w-[280px]" : "w-[80px]"
            )}
          >
            {/* Logo & User Section */}
            <div className="p-6 pb-2">
              <div
                className={cn(
                  "flex items-center gap-3 cursor-pointer transition-all duration-200",
                  !sidebarOpen && "justify-center"
                )}
                onClick={() => navigate("/")}
              >
                <div className="relative grid size-10 shrink-0 place-content-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
                  <Car className="h-5 w-5 text-primary-foreground" />
                  {hasActivePass && (
                    <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 ring-2 ring-background">
                      <Sparkles className="h-2.5 w-2.5 text-yellow-900" />
                    </div>
                  )}
                </div>

                <div className={cn(
                  "flex flex-col overflow-hidden transition-all duration-300",
                  sidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0"
                )}>
                  <span className="truncate text-sm font-bold text-foreground">
                    {userName}
                  </span>
                  <span className={cn(
                    "truncate text-xs font-medium",
                    hasActivePass ? "text-primary" : "text-muted-foreground"
                  )}>
                    {getPlanDisplay().split('(')[0]}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-6 scrollbar-none">
              <div className="space-y-1">
                {navigationItems.map((item) => {
                  const active = isActiveRoute(item.path);
                  return (
                    <button
                      key={item.label}
                      onClick={() => navigate(item.path)}
                      className={cn(
                        "group relative flex w-full items-center rounded-xl transition-all duration-200 outline-none hover:bg-accent/50",
                        active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground",
                        sidebarOpen ? "px-3 py-3" : "justify-center py-3 px-0"
                      )}
                      title={!sidebarOpen ? item.label : undefined}
                    >
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-primary" />
                      )}

                      <div className={cn(
                        "flex shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
                        sidebarOpen ? "mr-3 h-8 w-8" : "h-10 w-10",
                        active ? "bg-primary/20" : "bg-transparent group-hover:bg-accent"
                      )}>
                        <item.icon className={cn("h-5 w-5", active && "text-primary")} />
                      </div>

                      <div className={cn(
                        "flex flex-col items-start overflow-hidden transition-all duration-300",
                        sidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0 hidden"
                      )}>
                        <span className="text-sm leading-none">{item.label}</span>
                        {item.description && (
                          <span className="mt-1 text-[10px] text-muted-foreground/80 font-normal">
                            {item.description}
                          </span>
                        )}
                      </div>

                      {item.notifs && sidebarOpen && (
                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                          {item.notifs}
                        </span>
                      )}

                      {item.notifs && !sidebarOpen && (
                        <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => navigate("/painel?tab=perfil")}
                className={cn(
                  "group relative flex w-full items-center rounded-xl transition-all duration-200 outline-none hover:bg-accent/50 text-muted-foreground hover:text-foreground",
                  sidebarOpen ? "px-3 py-3" : "justify-center py-3 px-0"
                )}
                title={!sidebarOpen ? "Meu Perfil" : undefined}
              >
                <div className={cn(
                  "flex shrink-0 items-center justify-center rounded-lg transition-colors duration-200 bg-accent/50 group-hover:bg-accent",
                  sidebarOpen ? "mr-3 h-8 w-8" : "h-10 w-10"
                )}>
                  <User className="h-4 w-4" />
                </div>
                <div className={cn(
                  "flex flex-col items-start overflow-hidden transition-all duration-300",
                  sidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0 hidden"
                )}>
                  <span className="text-sm font-medium">Meu Perfil</span>
                </div>
              </button>

              <button
                onClick={handleSignOut}
                className={cn(
                  "group relative flex w-full items-center rounded-xl transition-all duration-200 outline-none hover:bg-red-500/10 text-muted-foreground hover:text-red-600 dark:hover:text-red-400",
                  sidebarOpen ? "px-3 py-3" : "justify-center py-3 px-0"
                )}
                title={!sidebarOpen ? "Sair" : undefined}
              >
                <div className={cn(
                  "flex shrink-0 items-center justify-center rounded-lg transition-colors duration-200 bg-red-500/5 group-hover:bg-red-500/10",
                  sidebarOpen ? "mr-3 h-8 w-8" : "h-10 w-10"
                )}>
                  <LogOut className="h-4 w-4" />
                </div>
                <div className={cn(
                  "flex flex-col items-start overflow-hidden transition-all duration-300",
                  sidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0 hidden"
                )}>
                  <span className="text-sm font-medium">Sair</span>
                </div>
              </button>
            </div>

            {/* Toggle Sidebar */}
            <div className="p-3 border-t border-border/40">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={cn(
                  "flex w-full items-center rounded-xl border border-border/50 bg-accent/20 p-2 transition-all hover:bg-accent/40 hover:border-border",
                  !sidebarOpen && "justify-center"
                )}
                aria-label={sidebarOpen ? "Ocultar sidebar" : "Mostrar sidebar"}
              >
                <ChevronsRight
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform duration-300",
                    sidebarOpen ? "rotate-180" : ""
                  )}
                />
                {sidebarOpen && (
                  <span className="ml-2 text-xs font-medium text-muted-foreground">
                    Recolher menu
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Modern Mobile Sidebar */}
        <ModernMobileSidebar
          isOpen={isMobile && mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          userName={userName}
          userPlan={getPlanDisplay()}
          hasActivePass={hasActivePass}
          isAdmin={isAdmin}
          onNavigate={(path) => navigate(path)}
          onLogout={handleSignOut}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col pb-20 sm:pb-0">
          {/* Header */}
          <header className="sticky top-0 z-30 bg-background border-b border-border px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                    {getPageTitle()}
                  </h1>
                  {getPageSubtitle() && (
                    <p className="text-sm text-muted-foreground">
                      {getPageSubtitle()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
              </div>
            </div>
          </header>

          {/* Mobile Bottom Navigation */}
          {isMobile && <MobileBottomNav onMenuClick={() => setMobileMenuOpen(true)} />}
        </div>
      </div>
    </div>
  );
};