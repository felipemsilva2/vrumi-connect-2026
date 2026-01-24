import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Car, Users, Shield, LogOut, FileSearch, LifeBuoy, GraduationCap, Calendar, DollarSign, Command, Disc } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface AdminLayoutProps {
  children: ReactNode;
}

const menuItems = [
  // Core Admin
  { path: "/painel", label: "DASHBOARD", icon: Command }, // Changed icon to Command
  { path: "/usuarios", label: "USUÁRIO_DB", icon: Users },

  // Vrumi Connect
  { path: "/instrutores", label: "INSTRUTOR_OPS", icon: GraduationCap },
  { path: "/agendamentos", label: "AGENDAMENTOS", icon: Calendar },
  { path: "/transacoes", label: "FINANÇAS", icon: DollarSign },

  // System
  { path: "/funcoes", label: "PERMISSÕES", icon: Shield },
  { path: "/logs-auditoria", label: "LOG_SISTEMA", icon: Disc }, // Changed icon to Disc
  { path: "/suporte", label: "SUPORTE_TEC", icon: LifeBuoy },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
      toast.success("SESSÃO ENCERRADA");
      window.location.href = "/entrar";
    } catch (error) {
      toast.error("FALHA NO LOGOUT");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-mono">
      {/* Top Bar - Raw Border */}
      <header className="border-b-[2px] border-primary h-16 flex items-center justify-between px-6 bg-card sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-primary text-black flex items-center justify-center font-bold text-xl">
            V
          </div>
          <h1 className="text-xl font-bold tracking-tighter uppercase">
            Admin<span className="text-primary">_CONSOLE</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground mr-4">
            <span className="w-2 h-2 bg-accent rounded-none inline-block animate-pulse"></span>
            SYSTEM_ONLINE
          </div>

          <Button
            variant="outline"
            className="border-[1px] border-foreground/20 hover:border-primary hover:bg-primary hover:text-black transition-all rounded-none h-8 text-xs uppercase tracking-wide"
            onClick={() => window.location.href = "/"}
          >
            [ Retornar ]
          </Button>

          <Button
            variant="ghost"
            className="hover:bg-destructive hover:text-white rounded-none h-8 text-xs uppercase tracking-wide"
            onClick={handleLogout}
          >
            Encerrar
          </Button>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Sidebar - Brutalist Vertical */}
        <aside className="w-64 border-r-[2px] border-border bg-card hidden md:block relative">
          {/* Semantic decorative line */}
          <div className="absolute left-[1.5rem] top-0 bottom-0 w-[1px] bg-border/20 z-0 content-['']"></div>

          <nav className="p-4 space-y-2 relative z-10">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                      group flex items-center gap-3 px-3 py-3 text-sm transition-all border-l-[3px] 
                      ${isActive
                      ? "border-primary bg-primary/10 text-primary font-bold"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary hover:border-foreground/50"
                    }
                    `}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                  <span className="tracking-wide">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="absolute bottom-4 left-4 right-4 text-[10px] text-muted-foreground uppercase opacity-50">
            v3.0.0_CONSTRUCT
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-background relative overflow-hidden">
          {/* Grid Pattern Background */}
          <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
            style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
          </div>

          <div className="relative z-10 p-6 sm:p-8 animate-in fade-in duration-500 slide-in-from-bottom-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
