import React, { useState, useEffect } from "react";
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
  Brain,
  Award,
  Calendar,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Car } from "lucide-react";

interface DashboardProps {
  user: any;
  profile: any;
}

export const DashboardWithSidebar = ({ user, profile }: DashboardProps) => {
  const [isDark, setIsDark] = useState(false);

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
        <Sidebar user={user} />
        <MainContent isDark={isDark} setIsDark={setIsDark} user={user} profile={profile} />
      </div>
    </div>
  );
};

const Sidebar = ({ user }: { user: any }) => {
  const [open, setOpen] = useState(true);
  const [selected, setSelected] = useState("Dashboard");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
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

  return (
    <nav
      className={`sticky top-0 h-screen shrink-0 border-r transition-all duration-300 ease-in-out ${
        open ? 'w-64' : 'w-16'
      } border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-2 shadow-sm`}
    >
      <TitleSection open={open} user={user} />

      <div className="space-y-1 mb-8">
        <Option
          Icon={Home}
          title="Dashboard"
          selected={selected}
          setSelected={setSelected}
          open={open}
        />
        <Option
          Icon={BookOpen}
          title="Flashcards"
          selected={selected}
          setSelected={setSelected}
          open={open}
        />
        <Option
          Icon={Target}
          title="Simulados"
          selected={selected}
          setSelected={setSelected}
          open={open}
          notifs={2}
        />
        <Option
          Icon={FileText}
          title="Materiais"
          selected={selected}
          setSelected={setSelected}
          open={open}
        />
        <Option
          Icon={BarChart3}
          title="Estatísticas"
          selected={selected}
          setSelected={setSelected}
          open={open}
        />
        <Option
          Icon={Trophy}
          title="Conquistas"
          selected={selected}
          setSelected={setSelected}
          open={open}
          notifs={1}
        />
      </div>

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
            className="relative flex h-11 w-full items-center rounded-md transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
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

const Option = ({ Icon, title, selected, setSelected, open, notifs }: any) => {
  const isSelected = selected === title;
  
  return (
    <button
      onClick={() => setSelected(title)}
      className={`relative flex h-11 w-full items-center rounded-md transition-all duration-200 ${
        isSelected 
          ? "bg-primary/10 dark:bg-primary/20 text-primary shadow-sm border-l-2 border-primary" 
          : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
      }`}
    >
      <div className="grid h-full w-12 place-content-center">
        <Icon className="h-4 w-4" />
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

const TitleSection = ({ open, user }: any) => {
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
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    Plano Gratuito
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
    >
      <div className="flex items-center p-3">
        <div className="grid size-10 place-content-center">
          <ChevronsRight
            className={`h-4 w-4 transition-transform duration-300 text-gray-500 dark:text-gray-400 ${
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

const MainContent = ({ isDark, setIsDark, user, profile }: any) => {
  const successRate = profile?.total_questions_answered 
    ? Math.round((profile.correct_answers / profile.total_questions_answered) * 100)
    : 0;

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-950 p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Olá, {profile?.full_name || user?.email?.split('@')[0]}! Continue estudando para sua CNH
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsDark(!isDark)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            {isDark ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <h3 className="font-medium text-gray-600 dark:text-gray-400 mb-1">Flashcards Estudados</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {profile?.total_flashcards_studied || 0}
          </p>
          <p className="text-sm text-success mt-1">Continue estudando!</p>
        </div>
        
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow">
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
        
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-accent/10 dark:bg-accent/20 rounded-lg">
              <Target className="h-5 w-5 text-accent" />
            </div>
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <h3 className="font-medium text-gray-600 dark:text-gray-400 mb-1">Questões Respondidas</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {profile?.total_questions_answered || 0}
          </p>
          <p className="text-sm text-success mt-1">Meta: 500 questões</p>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-secondary/10 dark:bg-secondary/20 rounded-lg">
              <BarChart3 className="h-5 w-5 text-secondary" />
            </div>
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <h3 className="font-medium text-gray-600 dark:text-gray-400 mb-1">Progresso Geral</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {profile?.study_progress || 0}%
          </p>
          <p className="text-sm text-success mt-1">Continue assim!</p>
        </div>
      </div>
      
      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Atividades Recentes</h3>
              <button className="text-sm text-primary hover:text-primary/80 font-medium">
                Ver tudo
              </button>
            </div>
            <div className="space-y-4">
              {[
                { icon: BookOpen, title: "Flashcards estudados", desc: "15 cards de Legislação de Trânsito", time: "2 min atrás", color: "blue" },
                { icon: CheckCircle2, title: "Simulado concluído", desc: "85% de aproveitamento", time: "1 hora atrás", color: "green" },
                { icon: Trophy, title: "Conquista desbloqueada", desc: "Estudante dedicado - 7 dias seguidos", time: "Hoje", color: "purple" },
                { icon: Brain, title: "Nova categoria iniciada", desc: "Primeiros Socorros", time: "Ontem", color: "orange" },
                { icon: Award, title: "Recorde pessoal", desc: "Melhor taxa de acerto: 95%", time: "2 dias atrás", color: "green" },
              ].map((activity, i) => (
                <div key={i} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                  <div className={`p-2 rounded-lg ${
                    activity.color === 'green' ? 'bg-success/10 dark:bg-success/20' :
                    activity.color === 'blue' ? 'bg-primary/10 dark:bg-primary/20' :
                    activity.color === 'purple' ? 'bg-accent/10 dark:bg-accent/20' :
                    activity.color === 'orange' ? 'bg-secondary/10 dark:bg-secondary/20' :
                    'bg-red-50 dark:bg-red-900/20'
                  }`}>
                    <activity.icon className={`h-4 w-4 ${
                      activity.color === 'green' ? 'text-success' :
                      activity.color === 'blue' ? 'text-primary' :
                      activity.color === 'purple' ? 'text-accent' :
                      activity.color === 'orange' ? 'text-secondary' :
                      'text-red-600 dark:text-red-400'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {activity.desc}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Progresso por Categoria</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Legislação</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">78%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '78%' }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Sinalização</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">65%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-success h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Direção Defensiva</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">42%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-secondary h-2 rounded-full" style={{ width: '42%' }}></div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Próximos Objetivos</h3>
            <div className="space-y-3">
              {[
                'Completar 50 flashcards de Mecânica',
                'Fazer 3 simulados esta semana',
                'Revisar sinais de trânsito',
                'Estudar primeiros socorros'
              ].map((goal, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{goal}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardWithSidebar;
