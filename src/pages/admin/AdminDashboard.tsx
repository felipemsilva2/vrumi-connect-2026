import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatsCard } from "@/components/admin/StatsCard";
import { Users, CreditCard, DollarSign, TrendingUp, Calendar, CheckCircle, XCircle, Clock, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Stats {
  // Users
  totalUsers: number;
  recentUsers: number;

  // Connect - Instructors
  totalInstructors: number;
  approvedInstructors: number;
  pendingInstructors: number;

  // Connect - Bookings
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;

  // Connect - Revenue
  totalRevenue: number;
  platformFees: number;
  refundedAmount: number;

  // Education (descontinuado)
  // activeSubscriptions: number;
  // totalFlashcards: number;
  // totalQuestions: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    recentUsers: 0,
    totalInstructors: 0,
    approvedInstructors: 0,
    pendingInstructors: 0,
    totalBookings: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0,
    platformFees: 0,
    refundedAmount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !navigator.onLine) {
      setIsLoading(false);
      return;
    }
    fetchStats();
  }, []);

  const fetchStats = async () => {
    if (!isSupabaseConfigured || !navigator.onLine) {
      return;
    }
    try {
      // Total de usuários
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Usuários recentes (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: recentUsersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo.toISOString());

      // Instrutores
      const { count: totalInstructors } = await supabase
        .from("instructors")
        .select("*", { count: "exact", head: true });

      const { count: approvedInstructors } = await supabase
        .from("instructors")
        .select("*", { count: "exact", head: true })
        .eq("status", "approved");

      const { count: pendingInstructors } = await supabase
        .from("instructors")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Bookings
      const { count: totalBookings } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true });

      const { count: confirmedBookings } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("status", "confirmed");

      const { count: pendingBookings } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      const { count: cancelledBookings } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("status", "cancelled");

      // Revenue - Transactions
      const { data: earningsData } = await supabase
        .from("instructor_transactions")
        .select("amount")
        .eq("type", "earning")
        .eq("status", "completed");

      const totalRevenue = earningsData?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;

      // Platform fees (15% of gross)
      const grossRevenue = totalRevenue / 0.85; // Instructor gets 85%, so gross = instructor / 0.85
      const platformFees = grossRevenue - totalRevenue;

      // Refunds
      const { data: refundsData } = await supabase
        .from("instructor_transactions")
        .select("amount")
        .eq("type", "refund");

      const refundedAmount = Math.abs(refundsData?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0);

      setStats({
        totalUsers: usersCount || 0,
        recentUsers: recentUsersCount || 0,
        totalInstructors: totalInstructors || 0,
        approvedInstructors: approvedInstructors || 0,
        pendingInstructors: pendingInstructors || 0,
        totalBookings: totalBookings || 0,
        confirmedBookings: confirmedBookings || 0,
        pendingBookings: pendingBookings || 0,
        cancelledBookings: cancelledBookings || 0,
        totalRevenue: totalRevenue,
        platformFees: platformFees,
        refundedAmount: refundedAmount,
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
          <p className="text-muted-foreground">Visão geral do Vrumi Connect</p>
        </div>

        {/* Usuários */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <StatsCard
                title="Total de Usuários"
                value={stats.totalUsers}
                icon={Users}
              />
              <StatsCard
                title="Novos (30 dias)"
                value={stats.recentUsers}
                icon={TrendingUp}
                trend={{
                  value: stats.recentUsers,
                  isPositive: stats.recentUsers > 0,
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Instrutores */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Instrutores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <StatsCard
                title="Total de Instrutores"
                value={stats.totalInstructors}
                icon={GraduationCap}
              />
              <StatsCard
                title="Aprovados"
                value={stats.approvedInstructors}
                icon={CheckCircle}
              />
              <StatsCard
                title="Pendentes de Aprovação"
                value={stats.pendingInstructors}
                icon={Clock}
                trend={stats.pendingInstructors > 0 ? {
                  value: stats.pendingInstructors,
                  isPositive: false,
                } : undefined}
              />
            </div>
          </CardContent>
        </Card>

        {/* Agendamentos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <StatsCard
                title="Total de Aulas"
                value={stats.totalBookings}
                icon={Calendar}
              />
              <StatsCard
                title="Confirmadas"
                value={stats.confirmedBookings}
                icon={CheckCircle}
              />
              <StatsCard
                title="Pendentes"
                value={stats.pendingBookings}
                icon={Clock}
              />
              <StatsCard
                title="Canceladas"
                value={stats.cancelledBookings}
                icon={XCircle}
              />
            </div>
          </CardContent>
        </Card>

        {/* Financeiro */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financeiro (Connect)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <StatsCard
                title="Receita Instrutores"
                value={`R$ ${stats.totalRevenue.toFixed(2)}`}
                icon={DollarSign}
              />
              <StatsCard
                title="Taxa Plataforma (15%)"
                value={`R$ ${stats.platformFees.toFixed(2)}`}
                icon={CreditCard}
              />
              <StatsCard
                title="Reembolsos"
                value={`R$ ${stats.refundedAmount.toFixed(2)}`}
                icon={XCircle}
              />
            </div>
          </CardContent>
        </Card>

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
              <li>Aprovar ou rejeitar instrutores</li>
              <li>Visualizar e gerenciar agendamentos</li>
              <li>Acompanhar transações e receita</li>
              <li>Controlar permissões e roles</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
