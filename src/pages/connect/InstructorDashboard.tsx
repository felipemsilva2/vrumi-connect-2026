import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Calendar, Clock, DollarSign, Star, Users, Settings, 
  ChevronRight, CheckCircle, XCircle, AlertCircle, Car
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Instructor {
  id: string;
  full_name: string;
  photo_url: string | null;
  city: string;
  state: string;
  status: string;
  average_rating: number;
  total_reviews: number;
  total_lessons: number;
  is_verified: boolean;
}

interface Booking {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  price: number;
  instructor_amount: number;
  status: string;
  payment_status: string;
  student_id: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  description: string | null;
  created_at: string;
}

export default function InstructorDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState({ total: 0, pending: 0, thisMonth: 0 });

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth?redirect=/connect/instrutor/dashboard");
      return;
    }

    try {
      // Fetch instructor profile
      const { data: instructorData, error: instructorError } = await supabase
        .from("instructors")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (instructorError || !instructorData) {
        toast({
          title: "Perfil não encontrado",
          description: "Você ainda não possui um perfil de instrutor.",
          variant: "destructive",
        });
        navigate("/connect/instrutor/cadastro");
        return;
      }

      setInstructor(instructorData);

      // Fetch bookings
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("*")
        .eq("instructor_id", instructorData.id)
        .order("scheduled_date", { ascending: false })
        .limit(20);

      setBookings(bookingsData || []);

      // Fetch transactions
      const { data: transactionsData } = await supabase
        .from("instructor_transactions")
        .select("*")
        .eq("instructor_id", instructorData.id)
        .order("created_at", { ascending: false })
        .limit(20);

      setTransactions(transactionsData || []);

      // Calculate earnings
      const completedBookings = (bookingsData || []).filter(
        (b) => b.status === "completed" && b.payment_status === "completed"
      );
      const pendingBookings = (bookingsData || []).filter(
        (b) => b.status === "confirmed" && b.payment_status === "pending"
      );
      const thisMonth = new Date().getMonth();
      const thisMonthBookings = completedBookings.filter(
        (b) => new Date(b.scheduled_date).getMonth() === thisMonth
      );

      setEarnings({
        total: completedBookings.reduce((sum, b) => sum + Number(b.instructor_amount), 0),
        pending: pendingBookings.reduce((sum, b) => sum + Number(b.instructor_amount), 0),
        thisMonth: thisMonthBookings.reduce((sum, b) => sum + Number(b.instructor_amount), 0),
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: "pending" | "confirmed" | "completed" | "cancelled" | "disputed") => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ 
          status: newStatus, 
          ...(newStatus === "completed" ? { completed_at: new Date().toISOString() } : {})
        })
        .eq("id", bookingId);

      if (error) throw error;

      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );

      toast({
        title: "Status atualizado",
        description: `Aula marcada como ${newStatus === "completed" ? "concluída" : newStatus}.`,
      });
    } catch (error) {
      console.error("Error updating booking:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Pendente", variant: "secondary" },
      confirmed: { label: "Confirmada", variant: "default" },
      completed: { label: "Concluída", variant: "outline" },
      cancelled: { label: "Cancelada", variant: "destructive" },
    };
    const config = statusConfig[status] || { label: status, variant: "secondary" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A2F44]" />
      </div>
    );
  }

  if (!instructor) {
    return null;
  }

  const upcomingBookings = bookings.filter(
    (b) => b.status === "confirmed" && new Date(b.scheduled_date) >= new Date()
  );
  const pendingBookings = bookings.filter((b) => b.status === "pending");

  return (
    <>
      <SEOHead
        title="Painel do Instrutor | Vrumi Connect"
        description="Gerencie suas aulas, disponibilidade e ganhos no Vrumi Connect."
      />

      <div className="min-h-screen bg-[#F8F9FA]">
        {/* Header */}
        <header className="bg-[#0A2F44] text-white">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link to="/connect" className="flex items-center gap-2">
                <Car className="h-8 w-8" />
                <span className="text-xl font-semibold">Vrumi Connect</span>
              </Link>
              <div className="flex items-center gap-4">
                <Link to={`/connect/instrutor/${instructor.id}`}>
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                    Ver meu perfil
                  </Button>
                </Link>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={instructor.photo_url || undefined} />
                  <AvatarFallback className="bg-white/20">
                    {instructor.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          {/* Status Banner */}
          {instructor.status !== "approved" && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">Perfil em análise</p>
                <p className="text-sm text-yellow-700">
                  Seu perfil está sendo analisado pela equipe. Você receberá um e-mail quando for aprovado.
                </p>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#0A2F44]/10 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-[#0A2F44]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ganhos este mês</p>
                    <p className="text-2xl font-bold text-[#0A2F44]">
                      {formatPrice(earnings.thisMonth)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#2F7B3A]/10 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-[#2F7B3A]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Aulas agendadas</p>
                    <p className="text-2xl font-bold text-[#0A2F44]">
                      {upcomingBookings.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Star className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Avaliação média</p>
                    <p className="text-2xl font-bold text-[#0A2F44]">
                      {Number(instructor.average_rating).toFixed(1)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total de aulas</p>
                    <p className="text-2xl font-bold text-[#0A2F44]">
                      {instructor.total_lessons}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="bookings" className="space-y-6">
            <TabsList>
              <TabsTrigger value="bookings">Aulas</TabsTrigger>
              <TabsTrigger value="earnings">Ganhos</TabsTrigger>
              <TabsTrigger value="availability">Disponibilidade</TabsTrigger>
            </TabsList>

            <TabsContent value="bookings" className="space-y-6">
              {/* Pending Bookings */}
              {pendingBookings.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-[#0A2F44]">
                      Solicitações pendentes ({pendingBookings.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {pendingBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">
                              {format(new Date(booking.scheduled_date), "dd 'de' MMMM", { locale: ptBR })} às {booking.scheduled_time.slice(0, 5)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {booking.duration_minutes} min • {formatPrice(Number(booking.instructor_amount))}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateBookingStatus(booking.id, "cancelled")}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Recusar
                            </Button>
                            <Button
                              size="sm"
                              className="bg-[#2F7B3A] hover:bg-[#2F7B3A]/90"
                              onClick={() => handleUpdateBookingStatus(booking.id, "confirmed")}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aceitar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* All Bookings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-[#0A2F44]">
                    Histórico de aulas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {bookings.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      Nenhuma aula agendada ainda.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {bookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">
                              {format(new Date(booking.scheduled_date), "dd/MM/yyyy")} às {booking.scheduled_time.slice(0, 5)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {booking.duration_minutes} min
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-medium">
                              {formatPrice(Number(booking.instructor_amount))}
                            </span>
                            {getStatusBadge(booking.status)}
                            {booking.status === "confirmed" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateBookingStatus(booking.id, "completed")}
                              >
                                Marcar concluída
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="earnings">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-[#0A2F44]">
                    Resumo financeiro
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total recebido</p>
                      <p className="text-2xl font-bold text-[#2F7B3A]">
                        {formatPrice(earnings.total)}
                      </p>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-gray-600">Pendente</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {formatPrice(earnings.pending)}
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Este mês</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatPrice(earnings.thisMonth)}
                      </p>
                    </div>
                  </div>

                  <h4 className="font-medium mb-4">Transações recentes</h4>
                  {transactions.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      Nenhuma transação registrada.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {transactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{tx.description || tx.type}</p>
                            <p className="text-sm text-gray-500">
                              {format(new Date(tx.created_at), "dd/MM/yyyy HH:mm")}
                            </p>
                          </div>
                          <span
                            className={`font-bold ${
                              tx.type === "earning" ? "text-[#2F7B3A]" : "text-red-600"
                            }`}
                          >
                            {tx.type === "earning" ? "+" : "-"}
                            {formatPrice(Number(tx.amount))}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="availability">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-[#0A2F44]">
                    Gerenciar disponibilidade
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 text-center py-8">
                    Configuração de disponibilidade em desenvolvimento.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
