import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatsCard } from "@/components/admin/StatsCard";
import { Users, CreditCard, DollarSign, TrendingUp, FileText, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Stats {
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  totalFlashcards: number;
  totalQuestions: number;
  recentUsers: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    totalFlashcards: 0,
    totalQuestions: 0,
    recentUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Total de usuários
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Assinaturas ativas
      const { count: activePassesCount } = await supabase
        .from("user_passes")
        .select("*", { count: "exact", head: true })
        .eq("payment_status", "completed")
        .gt("expires_at", new Date().toISOString());

      // Receita total
      const { data: passesData } = await supabase
        .from("user_passes")
        .select("price")
        .eq("payment_status", "completed");

      const totalRevenue = passesData?.reduce((sum, pass) => sum + Number(pass.price), 0) || 0;

      // Total de flashcards
      const { count: flashcardsCount } = await supabase
        .from("flashcards")
        .select("*", { count: "exact", head: true });

      // Total de questões
      const { count: questionsCount } = await supabase
        .from("quiz_questions")
        .select("*", { count: "exact", head: true });

      // Usuários recentes (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: recentUsersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo.toISOString());

      setStats({
        totalUsers: usersCount || 0,
        activeSubscriptions: activePassesCount || 0,
        totalRevenue: totalRevenue,
        totalFlashcards: flashcardsCount || 0,
        totalQuestions: questionsCount || 0,
        recentUsers: recentUsersCount || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Erro ao carregar estatísticas");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold">Dashboard</h2>
            <p className="text-muted-foreground">Carregando estatísticas...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Dashboard</h2>
          <p className="text-muted-foreground">Visão geral do sistema</p>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            title="Total de Usuários"
            value={stats.totalUsers}
            icon={Users}
            trend={{
              value: stats.recentUsers,
              isPositive: stats.recentUsers > 0,
            }}
          />

          <StatsCard
            title="Assinaturas Ativas"
            value={stats.activeSubscriptions}
            icon={CreditCard}
          />

          <StatsCard
            title="Receita Total"
            value={`R$ ${stats.totalRevenue.toFixed(2)}`}
            icon={DollarSign}
          />

          <StatsCard
            title="Total de Flashcards"
            value={stats.totalFlashcards}
            icon={FileText}
          />

          <StatsCard
            title="Total de Questões"
            value={stats.totalQuestions}
            icon={MessageSquare}
          />

          <StatsCard
            title="Novos Usuários (30d)"
            value={stats.recentUsers}
            icon={TrendingUp}
          />
        </div>

        {/* Ações Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Use o menu lateral para acessar as diferentes áreas de administração.
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Gerenciar usuários e perfis</li>
              <li>Administrar assinaturas e passes</li>
              <li>Controlar permissões e roles</li>
              <li>Gerar flashcards e questões</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
