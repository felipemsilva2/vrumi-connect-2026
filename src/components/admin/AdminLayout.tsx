import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Car, Users, CreditCard, Shield, FileText, MessageSquare, LogOut, FileSearch, TrafficCone, LifeBuoy, Sparkles, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface AdminLayoutProps {
  children: ReactNode;
}

const menuItems = [
  { path: "/painel", label: "Dashboard", icon: Car },
  { path: "/usuarios", label: "Usuários", icon: Users },
  { path: "/instrutores", label: "Instrutores", icon: GraduationCap },
  { path: "/assinaturas", label: "Assinaturas", icon: CreditCard },
  { path: "/funcoes", label: "Permissões", icon: Shield },
  { path: "/logs-auditoria", label: "Logs de Auditoria", icon: FileSearch },
  { path: "/flashcards", label: "Flashcards", icon: FileText },
  { path: "/questoes", label: "Questões", icon: MessageSquare },
  { path: "/gerar-questoes", label: "Gerar Questões IA", icon: Sparkles },
  { path: "/placas", label: "Placas de Trânsito", icon: TrafficCone },
  { path: "/suporte", label: "Suporte", icon: LifeBuoy },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
      toast.success("Logout realizado com sucesso");
      // Use window.location to force full reload and go to main app login
      window.location.href = "/entrar";
    } catch (error) {
      toast.error("Erro ao fazer logout");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Car className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Painel Administrativo</h1>
              <p className="text-sm text-muted-foreground">Gerenciamento do Sistema</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <a href="/painel">
                Voltar ao Dashboard
              </a>
            </Button>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 sm:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-64 space-y-2">
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          <Separator orientation="vertical" className="h-auto" />

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
