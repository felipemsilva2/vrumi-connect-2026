import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Users, DollarSign, TrendingUp, Calendar, CheckCircle, XCircle, Clock, GraduationCap, ArrowUpRight } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { toast } from "sonner";

// --- Constructivist UI Components (Internal) ---

const DataBlock = ({
  label,
  value,
  subValue,
  icon: Icon,
  className = "",
  trend = null
}: {
  label: string,
  value: string | number,
  subValue?: string,
  icon?: any,
  className?: string,
  trend?: { value: number, isPositive: boolean } | null
}) => (
  <div className={`border-2 border-border p-5 relative group transition-all hover:bg-muted/50 ${className}`}>
    <div className="flex justify-between items-start mb-4">
      <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
      {Icon && <Icon className="h-4 w-4 text-primary opacity-70 group-hover:opacity-100 transition-opacity" />}
    </div>

    <div className="flex items-baseline gap-2">
      <span className="text-3xl font-mono font-bold tracking-tighter">{value}</span>
      {subValue && <span className="text-xs text-muted-foreground uppercase">{subValue}</span>}
    </div>

    {trend && (
      <div className="mt-2 flex items-center gap-1 text-xs">
        <ArrowUpRight className={`h-3 w-3 ${trend.isPositive ? 'text-accent' : 'text-destructive'}`} />
        <span className={trend.isPositive ? 'text-accent' : 'text-destructive'}>
          {trend.value}% vs last_month
        </span>
      </div>
    )}

    {/* Decoration Corner */}
    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
  </div>
);

const HeroMetric = ({ label, value, subLabel }: { label: string, value: string, subLabel?: string }) => (
  <div className="border-2 border-primary bg-primary/5 p-8 relative overflow-hidden">
    <div className="absolute top-0 right-0 p-2 opacity-10">
      <DollarSign className="w-64 h-64 -mr-10 -mt-10" />
    </div>

    <span className="inline-block px-2 py-1 bg-primary text-black text-xs font-bold uppercase mb-4">
      Primary_Metric
    </span>
    <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-2">{label}</h2>
    <div className="text-6xl md:text-8xl font-black tracking-tighter text-foreground mb-2">
      {value}
    </div>
    {subLabel && <p className="text-sm font-mono text-muted-foreground border-l-2 border-primary pl-3">{subLabel}</p>}
  </div>
);

const SectionHeader = ({ title }: { title: string }) => (
  <div className="flex items-center gap-4 mb-6 mt-10">
    <div className="h-[2px] w-8 bg-primary"></div>
    <h3 className="text-lg font-bold uppercase tracking-widest">{title}</h3>
    <div className="h-[1px] flex-1 bg-border/30"></div>
  </div>
);

// --- Main Dashboard ---

interface Stats {
  totalUsers: number;
  recentUsers: number;
  totalInstructors: number;
  approvedInstructors: number;
  pendingInstructors: number;
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  platformFees: number;
  refundedAmount: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, recentUsers: 0,
    totalInstructors: 0, approvedInstructors: 0, pendingInstructors: 0,
    totalBookings: 0, confirmedBookings: 0, pendingBookings: 0, cancelledBookings: 0,
    totalRevenue: 0, platformFees: 0, refundedAmount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !navigator.onLine) {
      setIsLoading(false); return;
    }
    fetchStats();
  }, []);

  const fetchStats = async () => {
    if (!isSupabaseConfigured || !navigator.onLine) return;
    try {
      // (Keep existing fetch logic)
      const { count: usersCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count: recentUsersCount } = await supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo.toISOString());

      const { count: totalInstructors } = await supabase.from("instructors").select("*", { count: "exact", head: true });
      const { count: approvedInstructors } = await supabase.from("instructors").select("*", { count: "exact", head: true }).eq("status", "approved");
      const { count: pendingInstructors } = await supabase.from("instructors").select("*", { count: "exact", head: true }).eq("status", "pending");

      const { count: totalBookings } = await supabase.from("bookings").select("*", { count: "exact", head: true });
      const { count: confirmedBookings } = await supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "confirmed");
      const { count: pendingBookings } = await supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "pending");
      const { count: cancelledBookings } = await supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "cancelled");

      const { data: earningsData } = await supabase.from("instructor_transactions").select("amount").eq("type", "earning").eq("status", "completed");
      const totalRevenue = earningsData?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;
      const grossRevenue = totalRevenue / 0.85;
      const platformFees = grossRevenue - totalRevenue;

      const { data: refundsData } = await supabase.from("instructor_transactions").select("amount").eq("type", "refund");
      const refundedAmount = Math.abs(refundsData?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0);

      setStats({
        totalUsers: usersCount || 0, recentUsers: recentUsersCount || 0,
        totalInstructors: totalInstructors || 0, approvedInstructors: approvedInstructors || 0, pendingInstructors: pendingInstructors || 0,
        totalBookings: totalBookings || 0, confirmedBookings: confirmedBookings || 0, pendingBookings: pendingBookings || 0, cancelledBookings: cancelledBookings || 0,
        totalRevenue: totalRevenue, platformFees: platformFees, refundedAmount: refundedAmount,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("DATA_FETCH_ERROR");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[50vh] font-mono animate-pulse">
          LOADING_SYSTEM_DATA...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-0">

        {/* Header - Constructivist */}
        <div className="flex justify-between items-end mb-8 border-b-4 border-black dark:border-white pb-4">
          <div>
            <h2 className="text-4xl font-black uppercase tracking-tighter">Mission_Control</h2>
            <p className="text-sm font-mono text-muted-foreground mt-2">SYSTEM_STATUS: <span className="text-accent">OPTIMAL</span></p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs font-mono text-muted-foreground">LAST_UPDATE</p>
            <p className="font-bold">{new Date().toLocaleTimeString()}</p>
          </div>
        </div>

        {/* Hero Section - Asymmetric Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12">

          {/* Massive Revenue Metric - Spans 8 cols */}
          <div className="md:col-span-8">
            <HeroMetric
              label="Platform_Revenue_(Net)"
              value={`R$ ${stats.platformFees.toFixed(2)}`}
              subLabel="Calculated at 15% platform split (post-instructor payout)"
            />
          </div>

          {/* Key Action Metrics - Spans 4 cols */}
          <div className="md:col-span-4 flex flex-col gap-4">
            <div className="flex-1 bg-black text-white p-6 flex flex-col justify-between border-2 border-black dark:border-white relative overflow-hidden group">
              <div className="absolute right-[-20px] top-[-20px] w-20 h-20 bg-accent rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>

              <div className="flex justify-between items-start z-10">
                <span className="text-xs font-mono text-gray-400">PENDING_APPROVALS</span>
                <Clock className="text-accent h-5 w-5" />
              </div>
              <div className="z-10">
                <div className="text-5xl font-bold">{stats.pendingInstructors}</div>
                <div className="text-xs text-gray-400 mt-1">Instructor Applications</div>
              </div>
              <button className="mt-4 w-full py-2 bg-secondary text-black font-bold text-xs uppercase hover:bg-white transition-colors">
                Process_Queue
              </button>
            </div>

            <div className="flex-1 border-2 border-muted-foreground/20 p-6 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono block mb-1">TOTAL_VOLUME</span>
                <span className="text-2xl font-bold">R$ {stats.totalRevenue.toFixed(0)}</span>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </div>
        </div>

        {/* Data Grid Section */}
        <SectionHeader title="Database_Metrics" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DataBlock
            label="Total_Users"
            value={stats.totalUsers}
            icon={Users}
            trend={{ value: stats.recentUsers, isPositive: true }}
          />
          <DataBlock
            label="Active_Network"
            value={stats.totalInstructors}
            subValue={`(${stats.approvedInstructors} VERIFIED)`}
            icon={GraduationCap}
          />
          <DataBlock
            label="Booking_Volume"
            value={stats.totalBookings}
            icon={Calendar}
          />
          <DataBlock
            label="Churn_/_Cancel"
            value={stats.cancelledBookings}
            icon={XCircle}
            className="border-destructive/30"
          />
        </div>

        {/* Secondary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <DataBlock
            label="Financial_Flow (Gross)"
            value={`R$ ${stats.totalRevenue.toFixed(2)}`}
            icon={DollarSign}
            className="bg-secondary/10"
          />
          <DataBlock
            label="Refunds_Processed"
            value={`R$ ${stats.refundedAmount.toFixed(2)}`}
            icon={XCircle}
            className="bg-secondary/10"
          />
        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
