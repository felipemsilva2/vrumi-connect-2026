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
  Menu,
  X,
  Car
} from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useActivePass } from "@/hooks/useActivePass";
import { SmartBreadcrumb } from "@/components/SmartBreadcrumb";
import { useTheme } from "@/components/ThemeProvider";
import { MobileBottomNav } from "./MobileBottomNav";

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
    { label: "Dashboard", icon: Home, path: "/painel", tooltip: "Página inicial do dashboard" },
    { label: "Flashcards", icon: BookOpen, path: "/painel?tab=flashcards", tooltip: "Estude com flashcards" },
    { label: "Simulados", icon: Target, path: "/painel?tab=simulados", tooltip: "Teste seus conhecimentos com simulados", notifs: 2 },
    { label: "Sala de Estudos", icon: FileText, path: "/sala-de-estudos", tooltip: "Estude com IA e visualize materiais", isExternal: true },
    { label: "Estatísticas", icon: BarChart3, path: "/painel?tab=estatisticas", tooltip: "Veja seu desempenho" },
    // { label: "Notificações", icon: Bell, path: "/painel?tab=notificacoes", tooltip: "Configure suas notificações de estudo" },
    { label: "Biblioteca de Placas", icon: TrafficCone, path: "/biblioteca-de-placas", tooltip: "Consulte a biblioteca de placas de trânsito", isExternal: true },
    { label: "Conquistas", icon: Trophy, path: "/painel?tab=conquistas", tooltip: "Suas conquistas", notifs: 1 },
  ];

  const isActiveRoute = (path: string) => {
    if (path.includes('?')) {
      return location.pathname === path.split('?')[0];
    }
    return location.pathname === path;
  };

  return (
    <div className="flex min-h-screen w-full">
      <div className="flex w-full bg-background text-foreground">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <div
            className={`sticky top-0 h-screen shrink-0 border-r transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-64' : 'w-16'
              } border-border bg-background p-2 shadow-sm z-40`}
          >
            {/* Logo Section */}
            <div className="mb-6 border-b border-border pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/painel")}>
                  <div className="grid size-10 shrink-0 place-content-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-sm">
                    <Car className="h-6 w-6 text-primary-foreground" />
                  </div>
                  {sidebarOpen && (
                    <div>
                      <span className="block text-sm font-semibold text-foreground">
                        {userName}
                      </span>
                      <span className={`block text-xs ${hasActivePass ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                        {getPlanDisplay()}
                      </span>
                    </div>
                  )}
                </div>
                {sidebarOpen && (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="space-y-1 mb-8">
              {navigationItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className={`relative flex h-12 w-full items-center rounded-md transition-all duration-200 ${isActiveRoute(item.path)
                    ? "bg-primary/10 text-primary shadow-sm border-l-2 border-primary"
                    : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
                    }`}
                  aria-label={item.label}
                  title={item.tooltip}
                >
                  <div className="grid h-full w-12 place-content-center">
                    <item.icon className="h-5 w-5" />
                  </div>
                  {sidebarOpen && (
                    <span className="text-sm font-medium">
                      {item.label}
                    </span>
                  )}
                  {item.notifs && sidebarOpen && (
                    <span className="absolute right-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-medium">
                      {item.notifs}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Admin Section */}
            {isAdmin && sidebarOpen && (
              <div className="border-t border-border pt-4 space-y-1 mb-4">
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Administração
                </div>
                <button
                  onClick={() => navigate("/admin/painel")}
                  className="relative flex h-12 w-full items-center rounded-md transition-all duration-200 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                >
                  <div className="grid h-full w-12 place-content-center">
                    <Shield className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">Área Admin</span>
                </button>
              </div>
            )}

            {/* Account Section */}
            {sidebarOpen && (
              <div className="border-t border-border pt-4 space-y-1">
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Conta
                </div>
                <button
                  onClick={() => navigate("/painel?tab=perfil")}
                  className="relative flex h-12 w-full items-center rounded-md transition-all duration-200 text-muted-foreground hover:bg-accent/10 hover:text-foreground"
                >
                  <div className="grid h-full w-12 place-content-center">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">Meu Perfil</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="relative flex h-12 w-full items-center rounded-md transition-all duration-200 text-muted-foreground hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                >
                  <div className="grid h-full w-12 place-content-center">
                    <LogOut className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">Sair</span>
                </button>
              </div>
            )}

            {/* Toggle Sidebar */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="absolute bottom-0 left-0 right-0 border-t border-border transition-colors hover:bg-accent/10"
              aria-label={sidebarOpen ? "Ocultar sidebar" : "Mostrar sidebar"}
              title={sidebarOpen ? "Ocultar menu lateral" : "Mostrar menu lateral"}
            >
              <div className="flex items-center p-4">
                <div className="grid size-12 place-content-center">
                  <ChevronsRight
                    className={`h-5 w-5 transition-transform duration-300 text-muted-foreground ${sidebarOpen ? "rotate-180" : ""
                      }`}
                  />
                </div>
                {sidebarOpen && (
                  <span className="text-sm font-medium text-muted-foreground">
                    Ocultar
                  </span>
                )}
              </div>
            </button>
          </div>
        )}

        {/* Mobile Sidebar */}
        {isMobile && (
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetContent
              side="left"
              className="p-0 w-[85vw] sm:max-w-sm bg-background text-foreground border-r-0 [&>button]:hidden"
              style={{ height: '100dvh' }}
            >
              {/* Mobile Sidebar Content */}
              <div className="flex flex-col h-full pt-[env(safe-area-inset-top)]">
                {/* Header Section */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid size-10 shrink-0 place-content-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-sm">
                        <Car className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-foreground truncate">
                          {userName}
                        </span>
                        <span className={`block text-xs truncate ${hasActivePass ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                          {getPlanDisplay()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {/* Navigation Links */}
                  <div className="space-y-1">
                    {navigationItems.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => navigate(item.path)}
                        className={`flex w-full items-center rounded-md px-3 py-2.5 transition-all duration-200 ${isActiveRoute(item.path)
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
                          }`}
                      >
                        <item.icon className="h-5 w-5 mr-3 shrink-0" />
                        <span className="text-sm truncate">{item.label}</span>
                        {item.notifs && (
                          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-medium shrink-0">
                            {item.notifs}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Admin Section */}
                  {isAdmin && (
                    <div className="space-y-1">
                      <div className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Administração
                      </div>
                      <button
                        onClick={() => navigate("/admin/painel")}
                        className="flex w-full items-center rounded-md px-3 py-2.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <Shield className="h-5 w-5 mr-3 shrink-0" />
                        <span className="text-sm font-medium">Área Admin</span>
                      </button>
                    </div>
                  )}

                  {/* Account Section */}
                  <div className="space-y-1">
                    <div className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Conta
                    </div>
                    <button
                      onClick={() => navigate("/painel?tab=perfil")}
                      className="flex w-full items-center rounded-md px-3 py-2.5 text-muted-foreground hover:bg-accent/10 hover:text-foreground transition-colors"
                    >
                      <User className="h-5 w-5 mr-3 shrink-0" />
                      <span className="text-sm font-medium">Meu Perfil</span>
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center rounded-md px-3 py-2.5 text-muted-foreground hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors"
                    >
                      <LogOut className="h-5 w-5 mr-3 shrink-0" />
                      <span className="text-sm font-medium">Sair</span>
                    </button>
                  </div>
                </div>
              </div >
            </SheetContent >
          </Sheet >
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col pb-20 sm:pb-0">
          {/* Header */}
          <header className="sticky top-0 z-30 bg-background border-b border-border px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Hidden hamburger menu on mobile since we have bottom nav */}
                {/* {isMobile && (
                  <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-accent/10"
                    aria-label="Abrir menu"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                )} */}
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
                {/* <NotificationSystem /> */}
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-accent/10"
                  aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
                >
                  {theme === "dark" ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            {showBreadcrumb && <SmartBreadcrumb />}
          </header>

          {/* Page Content */}
          <main className="flex-1 p-4 sm:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div >

      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileBottomNav onMenuClick={() => setMobileMenuOpen(true)} />}
    </div >
  );
};