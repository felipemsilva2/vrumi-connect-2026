import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, MapPin, Star, Car, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ReviewModal } from "./ReviewModal";

interface Booking {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  price: number;
  status: string;
  payment_status: string;
  instructor: {
    id: string;
    full_name: string;
    photo_url: string | null;
    city: string;
    state: string;
  };
  has_review?: boolean;
}

interface StudentBookingsProps {
  userId: string;
}

export function StudentBookings({ userId }: StudentBookingsProps) {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    booking: Booking | null;
  }>({ isOpen: false, booking: null });

  useEffect(() => {
    fetchBookings();
  }, [userId]);

  const fetchBookings = async () => {
    try {
      // Fetch bookings with instructor info
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
          instructor:instructors(id, full_name, photo_url, city, state)
        `)
        .eq("student_id", userId)
        .order("scheduled_date", { ascending: false });

      if (bookingsError) throw bookingsError;

      // Fetch existing reviews for these bookings
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      pending: { label: "Pendente", variant: "secondary", icon: AlertCircle },
      confirmed: { label: "Confirmada", variant: "default", icon: CheckCircle },
      completed: { label: "Concluída", variant: "outline", icon: CheckCircle },
      cancelled: { label: "Cancelada", variant: "destructive", icon: XCircle },
    };
    const config = statusConfig[status] || { label: status, variant: "secondary", icon: AlertCircle };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
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
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#0A2F44]" />
        </CardContent>
      </Card>
    );
  }

  const BookingCard = ({ booking, showReviewButton = false }: { booking: Booking; showReviewButton?: boolean }) => (
    <Card key={booking.id} className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Avatar className="h-16 w-16 flex-shrink-0">
            <AvatarImage src={booking.instructor.photo_url || undefined} />
            <AvatarFallback className="bg-[#0A2F44] text-white">
              {booking.instructor.full_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h4 className="font-semibold text-[#0A2F44] truncate">
                  {booking.instructor.full_name}
                </h4>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {booking.instructor.city}, {booking.instructor.state}
                </p>
              </div>
              {getStatusBadge(booking.status)}
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(booking.scheduled_date), "dd 'de' MMM", { locale: ptBR })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {booking.scheduled_time.slice(0, 5)}
              </span>
              <span className="font-medium text-[#0A2F44]">
                {formatPrice(booking.price)}
              </span>
            </div>

            {showReviewButton && booking.status === "completed" && !booking.has_review && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setReviewModal({ isOpen: true, booking })}
                className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
              >
                <Star className="h-4 w-4 mr-1" />
                Avaliar aula
              </Button>
            )}

            {booking.has_review && (
              <span className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Avaliação enviada
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0A2F44]">
            <Car className="h-5 w-5" />
            Minhas Aulas - Vrumi Connect
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-8">
              <Car className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">
                Você ainda não agendou nenhuma aula.
              </p>
              <Link to="/connect">
                <Button className="bg-[#0A2F44] hover:bg-[#0A2F44]/90">
                  Encontrar instrutor
                </Button>
              </Link>
            </div>
          ) : (
            <Tabs defaultValue="upcoming">
              <TabsList className="mb-4">
                <TabsTrigger value="upcoming">
                  Próximas ({upcomingBookings.length})
                </TabsTrigger>
                <TabsTrigger value="past">
                  Histórico ({pastBookings.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="space-y-4">
                {upcomingBookings.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    Nenhuma aula agendada.
                  </p>
                ) : (
                  upcomingBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="past" className="space-y-4">
                {pastBookings.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    Nenhuma aula no histórico.
                  </p>
                ) : (
                  pastBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} showReviewButton />
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {reviewModal.booking && (
        <ReviewModal
          isOpen={reviewModal.isOpen}
          onClose={() => setReviewModal({ isOpen: false, booking: null })}
          bookingId={reviewModal.booking.id}
          instructorId={reviewModal.booking.instructor.id}
          instructorName={reviewModal.booking.instructor.full_name}
          studentId={userId}
          onReviewSubmitted={fetchBookings}
        />
      )}
    </>
  );
}
