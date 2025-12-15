import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar, Clock, MapPin, Star, Car, Loader2, CheckCircle, XCircle,
  AlertCircle, Phone, Mail, MessageCircle, ChevronRight, Ban
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInHours, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ReviewModal } from "@/components/connect/ReviewModal";

interface Instructor {
  id: string;
  full_name: string;
  photo_url: string | null;
  city: string;
  state: string;
  phone: string;
  bio: string | null;
  average_rating: number;
  total_reviews: number;
  user_id: string;
}

interface Booking {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  price: number;
  status: string;
  payment_status: string;
  cancellation_reason: string | null;
  instructor: Instructor;
  has_review?: boolean;
}

export default function StudentLessons() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [reviewModal, setReviewModal] = useState<{ isOpen: boolean; booking: Booking | null }>({
    isOpen: false,
    booking: null
  });

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      navigate("/entrar?redirect_to=/connect/minhas-aulas");
      return;
    }

    setUserId(session.user.id);
    await fetchBookings(session.user.id);
  };

  const fetchBookings = async (studentId: string) => {
    try {
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select(`
          id,
          scheduled_date,
          scheduled_time,
          duration_minutes,
          price,
          status,
          payment_status,
          cancellation_reason,
          instructor:instructors(id, full_name, photo_url, city, state, phone, bio, average_rating, total_reviews, user_id)
        `)
        .eq("student_id", studentId)
        .order("scheduled_date", { ascending: false });

      if (bookingsError) throw bookingsError;

      // Check for existing reviews
      const bookingIds = bookingsData?.map(b => b.id) || [];
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("booking_id")
        .in("booking_id", bookingIds);

      const reviewedBookingIds = new Set(reviewsData?.map(r => r.booking_id) || []);

      const formattedBookings = (bookingsData || []).map((b: any) => ({
        ...b,
        instructor: b.instructor,
        has_review: reviewedBookingIds.has(b.id),
      }));

      setBookings(formattedBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar suas aulas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking || !userId) return;

    setCancelling(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          status: "cancelled",
          cancellation_reason: cancelReason || "Cancelado pelo aluno",
          cancelled_by: userId,
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", selectedBooking.id);

      if (error) throw error;

      // Send notification to instructor
      await supabase.from("notifications").insert({
        user_id: selectedBooking.instructor.user_id,
        type: "booking_cancelled",
        title: "Aula cancelada",
        message: `Um aluno cancelou a aula agendada para ${format(new Date(selectedBooking.scheduled_date), "dd/MM/yyyy")} às ${selectedBooking.scheduled_time.slice(0, 5)}.`,
        data: { booking_id: selectedBooking.id },
      });

      toast({
        title: "Aula cancelada",
        description: "Sua aula foi cancelada com sucesso.",
      });

      // Refresh bookings
      await fetchBookings(userId);
      setCancelDialogOpen(false);
      setSelectedBooking(null);
      setCancelReason("");
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar a aula.",
        variant: "destructive",
      });
    } finally {
      setCancelling(false);
    }
  };

  const canCancelBooking = (booking: Booking) => {
    if (booking.status !== "pending" && booking.status !== "confirmed") return false;
    const lessonDateTime = parseISO(`${booking.scheduled_date}T${booking.scheduled_time}`);
    const hoursUntilLesson = differenceInHours(lessonDateTime, new Date());
    return hoursUntilLesson >= 24; // Can only cancel 24h before
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any; className?: string }> = {
      pending: { label: "Pendente", variant: "secondary", icon: AlertCircle, className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      confirmed: { label: "Confirmada", variant: "default", icon: CheckCircle, className: "bg-green-100 text-green-800 border-green-200" },
      completed: { label: "Concluída", variant: "outline", icon: CheckCircle },
      cancelled: { label: "Cancelada", variant: "destructive", icon: XCircle },
    };
    const config = statusConfig[status] || { label: status, variant: "secondary", icon: AlertCircle };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className={`flex items-center gap-1 ${config.className || ""}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const upcomingBookings = bookings.filter(
    (b) => (b.status === "confirmed" || b.status === "pending") && new Date(b.scheduled_date) >= new Date()
  );
  const pastBookings = bookings.filter(
    (b) => b.status === "completed" || b.status === "cancelled" || new Date(b.scheduled_date) < new Date()
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="Minhas Aulas | Vrumi Connect"
        description="Gerencie suas aulas de direção agendadas no Vrumi Connect."
      />

      <div className="min-h-screen bg-[#F8F9FA]">
        {/* Header */}
        <header className="bg-gradient-to-r from-[#0A2F44] to-[#10B981] text-white">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link to="/connect" className="flex items-center gap-2">
                <img src="/logo-vrumi.png" alt="Vrumi Connect" className="h-[68px] w-auto" />
              </Link>
              <Link to="/painel" className="w-full sm:w-auto">
                <Button className="w-full bg-white text-[#0A2F44] hover:bg-gray-100 border-0 font-medium shadow-sm sm:w-auto">
                  Voltar ao Painel
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Minhas Aulas</h1>
            <p className="text-muted-foreground">Gerencie suas aulas agendadas com instrutores</p>
          </div>

          {bookings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Car className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Nenhuma aula agendada
                </h3>
                <p className="text-muted-foreground mb-6">
                  Você ainda não agendou nenhuma aula com um instrutor.
                </p>
                <Link to="/connect">
                  <Button className="bg-[#10B981] hover:bg-[#0D9668]">
                    Encontrar instrutor
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="upcoming" className="space-y-6">
              <TabsList className="w-full h-auto p-1.5 bg-white border border-gray-200 rounded-xl shadow-sm grid grid-cols-2 gap-1">
                <TabsTrigger
                  value="upcoming"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-[#10B981] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
                >
                  <Calendar className="h-4 w-4" />
                  Próximas ({upcomingBookings.length})
                </TabsTrigger>
                <TabsTrigger
                  value="past"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg data-[state=active]:bg-[#10B981] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
                >
                  <Clock className="h-4 w-4" />
                  Histórico ({pastBookings.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="space-y-4">
                {upcomingBookings.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      Nenhuma aula agendada.
                      <Link to="/connect" className="text-primary ml-1 hover:underline">
                        Agende uma aula
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  upcomingBookings.map((booking) => (
                    <Card key={booking.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row">
                          {/* Instructor Info */}
                          <div className="p-4 flex-1">
                            <div className="flex gap-4">
                              <Avatar className="h-16 w-16 flex-shrink-0">
                                <AvatarImage src={booking.instructor.photo_url || undefined} />
                                <AvatarFallback className="bg-[#0A2F44] text-white text-lg">
                                  {booking.instructor.full_name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <Link
                                    to={`/connect/instrutor/${booking.instructor.id}`}
                                    className="font-semibold text-foreground hover:underline"
                                  >
                                    {booking.instructor.full_name}
                                  </Link>
                                  {getStatusBadge(booking.status)}
                                </div>

                                <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                                  <MapPin className="h-3 w-3" />
                                  {booking.instructor.city}, {booking.instructor.state}
                                </p>

                                {/* Lesson Details */}
                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {format(new Date(booking.scheduled_date), "dd 'de' MMMM", { locale: ptBR })}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {booking.scheduled_time.slice(0, 5)}
                                  </span>
                                  <span className="font-medium text-foreground">
                                    {formatPrice(booking.price)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Instructor contact - only show for confirmed bookings */}
                            {booking.status === "confirmed" && (
                              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                                  Contato do instrutor:
                                </p>
                                <div className="flex flex-wrap gap-3">
                                  <a
                                    href={`tel:${booking.instructor.phone}`}
                                    className="flex items-center gap-1 text-sm text-green-700 dark:text-green-300 hover:underline"
                                  >
                                    <Phone className="h-4 w-4" />
                                    {booking.instructor.phone}
                                  </a>
                                  <a
                                    href={`https://wa.me/55${booking.instructor.phone.replace(/\D/g, "")}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-sm bg-green-600 text-white px-3 py-1 rounded-full hover:bg-green-700"
                                  >
                                    <MessageCircle className="h-4 w-4" />
                                    WhatsApp
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="p-4 bg-muted/30 flex flex-col gap-2 border-t md:border-t-0 md:border-l md:justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedBooking(booking);
                                setDetailsOpen(true);
                              }}
                            >
                              Ver detalhes
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>

                            {canCancelBooking(booking) && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setCancelDialogOpen(true);
                                }}
                              >
                                <Ban className="h-4 w-4 mr-1" />
                                Cancelar
                              </Button>
                            )}

                            {!canCancelBooking(booking) && booking.status !== "cancelled" && (
                              <p className="text-xs text-muted-foreground text-center">
                                Cancelamento indisponível
                                <br />
                                (menos de 24h)
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="past" className="space-y-4">
                {pastBookings.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      Nenhuma aula no histórico.
                    </CardContent>
                  </Card>
                ) : (
                  pastBookings.map((booking) => (
                    <Card key={booking.id} className={`overflow-hidden ${booking.status === "cancelled" ? "opacity-70" : ""}`}>
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <Avatar className="h-12 w-12 flex-shrink-0">
                            <AvatarImage src={booking.instructor.photo_url || undefined} />
                            <AvatarFallback className="bg-[#0A2F44] text-white">
                              {booking.instructor.full_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <span className="font-medium text-foreground">
                                {booking.instructor.full_name}
                              </span>
                              {getStatusBadge(booking.status)}
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(booking.scheduled_date), "dd/MM/yyyy")}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {booking.scheduled_time.slice(0, 5)}
                              </span>
                              <span>{formatPrice(booking.price)}</span>
                            </div>

                            {booking.status === "cancelled" && booking.cancellation_reason && (
                              <p className="text-sm text-destructive">
                                Motivo: {booking.cancellation_reason}
                              </p>
                            )}

                            {booking.status === "completed" && !booking.has_review && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setReviewModal({ isOpen: true, booking })}
                                className="mt-2 text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                              >
                                <Star className="h-4 w-4 mr-1" />
                                Avaliar aula
                              </Button>
                            )}

                            {booking.has_review && (
                              <span className="text-sm text-green-600 flex items-center gap-1 mt-2">
                                <CheckCircle className="h-4 w-4" />
                                Avaliação enviada
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {/* Booking Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes da Aula</DialogTitle>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4">
              {/* Instructor Info */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedBooking.instructor.photo_url || undefined} />
                  <AvatarFallback className="bg-[#0A2F44] text-white text-lg">
                    {selectedBooking.instructor.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold">{selectedBooking.instructor.full_name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedBooking.instructor.city}, {selectedBooking.instructor.state}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-yellow-600">
                    <Star className="h-4 w-4 fill-current" />
                    {Number(selectedBooking.instructor.average_rating).toFixed(1)}
                    <span className="text-muted-foreground">
                      ({selectedBooking.instructor.total_reviews} avaliações)
                    </span>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data:</span>
                  <span className="font-medium">
                    {format(new Date(selectedBooking.scheduled_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Horário:</span>
                  <span className="font-medium">{selectedBooking.scheduled_time.slice(0, 5)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duração:</span>
                  <span className="font-medium">{selectedBooking.duration_minutes} minutos</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-medium">{formatPrice(selectedBooking.price)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status:</span>
                  {getStatusBadge(selectedBooking.status)}
                </div>
              </div>

              {/* Instructor Bio */}
              {selectedBooking.instructor.bio && (
                <div>
                  <h5 className="font-medium mb-1">Sobre o instrutor</h5>
                  <p className="text-sm text-muted-foreground">{selectedBooking.instructor.bio}</p>
                </div>
              )}

              {/* Contact Info - only for confirmed */}
              {selectedBooking.status === "confirmed" && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h5 className="font-medium text-green-800 dark:text-green-200 mb-2">
                    Contato
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`tel:${selectedBooking.instructor.phone}`}
                      className="flex items-center gap-1 text-sm bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border"
                    >
                      <Phone className="h-4 w-4" />
                      Ligar
                    </a>
                    <a
                      href={`https://wa.me/55${selectedBooking.instructor.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Fechar
            </Button>
            {selectedBooking && (
              <Link to={`/connect/instrutor/${selectedBooking.instructor.id}`}>
                <Button>Ver perfil do instrutor</Button>
              </Link>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar aula?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar esta aula? O instrutor será notificado.
              {selectedBooking && (
                <span className="block mt-2 font-medium">
                  {format(new Date(selectedBooking.scheduled_date), "dd 'de' MMMM", { locale: ptBR })} às {selectedBooking.scheduled_time.slice(0, 5)}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-4">
            <label className="text-sm font-medium">Motivo do cancelamento (opcional)</label>
            <Textarea
              placeholder="Informe o motivo..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="mt-1"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelBooking}
              disabled={cancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelando...
                </>
              ) : (
                "Confirmar cancelamento"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Review Modal */}
      {reviewModal.booking && userId && (
        <ReviewModal
          isOpen={reviewModal.isOpen}
          onClose={() => setReviewModal({ isOpen: false, booking: null })}
          bookingId={reviewModal.booking.id}
          instructorId={reviewModal.booking.instructor.id}
          instructorName={reviewModal.booking.instructor.full_name}
          studentId={userId}
          onReviewSubmitted={() => {
            if (userId) fetchBookings(userId);
          }}
        />
      )}
    </>
  );
}