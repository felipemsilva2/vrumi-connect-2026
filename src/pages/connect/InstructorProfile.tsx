import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Star, MapPin, Clock, Calendar, CheckCircle, 
  Phone, Mail, Car, Shield, Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface Instructor {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  bio: string | null;
  photo_url: string | null;
  city: string;
  state: string;
  categories: string[];
  price_per_lesson: number;
  lesson_duration_minutes: number;
  is_verified: boolean;
  average_rating: number;
  total_reviews: number;
  total_lessons: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  student_id: string;
}

interface Availability {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default function InstructorProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchInstructorData();
    }
  }, [id]);

  const fetchInstructorData = async () => {
    try {
      const [instructorRes, reviewsRes, availabilityRes] = await Promise.all([
        supabase
          .from("instructors")
          .select("*")
          .eq("id", id)
          .eq("status", "approved")
          .single(),
        supabase
          .from("reviews")
          .select("id, rating, comment, created_at, student_id")
          .eq("instructor_id", id)
          .eq("is_approved", true)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("instructor_availability")
          .select("day_of_week, start_time, end_time")
          .eq("instructor_id", id)
          .eq("is_active", true)
          .order("day_of_week"),
      ]);

      if (instructorRes.error) throw instructorRes.error;
      setInstructor(instructorRes.data);
      setReviews(reviewsRes.data || []);
      setAvailability(availabilityRes.data || []);
    } catch (error) {
      console.error("Error fetching instructor:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o perfil do instrutor.",
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

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  const groupedAvailability = availability.reduce((acc, slot) => {
    const day = slot.day_of_week;
    if (!acc[day]) acc[day] = [];
    acc[day].push(slot);
    return acc;
  }, {} as Record<number, Availability[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA]">
        <header className="bg-[#0A2F44] text-white py-4">
          <div className="container mx-auto px-4">
            <Skeleton className="h-8 w-48" />
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
            <div>
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!instructor) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="text-center">
          <Car className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            Instrutor não encontrado
          </h2>
          <Link to="/connect">
            <Button>Voltar para busca</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={`${instructor.full_name} - Instrutor de Direção | Vrumi Connect`}
        description={`Agende aulas de direção com ${instructor.full_name} em ${instructor.city}, ${instructor.state}. Categorias: ${instructor.categories.join(", ")}.`}
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
              <Link to="/auth">
                <Button className="bg-white text-[#0A2F44] hover:bg-white/90">
                  Entrar
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 text-gray-600 hover:text-[#0A2F44]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <Avatar className="h-32 w-32 mx-auto md:mx-0">
                      <AvatarImage src={instructor.photo_url || undefined} />
                      <AvatarFallback className="text-4xl bg-[#0A2F44] text-white">
                        {instructor.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-center md:text-left">
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                        <h1 className="text-2xl font-bold text-[#0A2F44]">
                          {instructor.full_name}
                        </h1>
                        {instructor.is_verified && (
                          <Badge className="bg-[#2F7B3A] hover:bg-[#2F7B3A]">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verificado
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-center md:justify-start text-gray-600 mb-3">
                        <MapPin className="h-4 w-4 mr-1" />
                        {instructor.city}, {instructor.state}
                      </div>
                      <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                        <div className="flex items-center">
                          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500 mr-1" />
                          <span className="font-semibold">{Number(instructor.average_rating).toFixed(1)}</span>
                          <span className="text-gray-500 ml-1">
                            ({instructor.total_reviews} avaliações)
                          </span>
                        </div>
                        <Separator orientation="vertical" className="h-5" />
                        <div className="flex items-center text-gray-600">
                          <Award className="h-4 w-4 mr-1" />
                          {instructor.total_lessons} aulas
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        {instructor.categories.map((cat) => (
                          <Badge key={cat} variant="secondary" className="text-sm">
                            Categoria {cat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bio */}
              {instructor.bio && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-[#0A2F44]">Sobre o Instrutor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 leading-relaxed">{instructor.bio}</p>
                  </CardContent>
                </Card>
              )}

              {/* Availability */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-[#0A2F44]">Disponibilidade</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(groupedAvailability).length === 0 ? (
                    <p className="text-gray-500">Nenhuma disponibilidade configurada.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(groupedAvailability).map(([day, slots]) => (
                        <div key={day} className="flex items-start gap-3">
                          <Calendar className="h-5 w-5 text-[#0A2F44] mt-0.5" />
                          <div>
                            <p className="font-medium text-[#0A2F44]">{DAY_NAMES[Number(day)]}</p>
                            <div className="text-sm text-gray-600">
                              {slots.map((slot, i) => (
                                <span key={i}>
                                  {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                  {i < slots.length - 1 && ", "}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Reviews */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-[#0A2F44]">
                    Avaliações ({instructor.total_reviews})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {reviews.length === 0 ? (
                    <p className="text-gray-500">Nenhuma avaliação ainda.</p>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating
                                      ? "text-yellow-500 fill-yellow-500"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(review.created_at).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-gray-600 text-sm">{review.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Booking Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <p className="text-3xl font-bold text-[#0A2F44]">
                      {formatPrice(Number(instructor.price_per_lesson))}
                    </p>
                    <p className="text-gray-500">por aula</p>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-gray-600">
                      <Clock className="h-5 w-5 text-[#0A2F44]" />
                      <span>Duração: {instructor.lesson_duration_minutes} minutos</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <Shield className="h-5 w-5 text-[#0A2F44]" />
                      <span>Contrato digital incluso</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <Car className="h-5 w-5 text-[#0A2F44]" />
                      <span>Veículo do instrutor</span>
                    </div>
                  </div>

                  <Link to={`/connect/agendar/${instructor.id}`}>
                    <Button className="w-full h-12 text-lg bg-[#0A2F44] hover:bg-[#0A2F44]/90">
                      Agendar aula
                    </Button>
                  </Link>

                  <p className="text-xs text-gray-500 text-center mt-4">
                    Pagamento seguro via PIX ou cartão. Você só é cobrado após confirmar o agendamento.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-[#0A2F44] text-white py-8 mt-12">
          <div className="container mx-auto px-4 text-center">
            <p className="text-white/60 text-sm">
              © {new Date().getFullYear()} Vrumi Connect. Todos os direitos reservados.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
