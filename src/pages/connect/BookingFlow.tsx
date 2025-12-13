import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Calendar, Clock, CreditCard, FileText, CheckCircle, ArrowLeft, Car, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Instructor {
  id: string;
  full_name: string;
  photo_url: string | null;
  city: string;
  state: string;
  price_per_lesson: number;
  lesson_duration_minutes: number;
}

interface Availability {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

type Step = "date" | "time" | "contract" | "payment" | "success";

const PLATFORM_FEE_PERCENTAGE = 0.15; // 15% commission

const CONTRACT_TEMPLATE = `
CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE INSTRUÇÃO DE DIREÇÃO

Pelo presente instrumento particular, as partes:

CONTRATANTE: [NOME_ALUNO], doravante denominado(a) ALUNO(A).

CONTRATADO(A): [NOME_INSTRUTOR], instrutor(a) de direção veicular, doravante denominado(a) INSTRUTOR(A).

Acordam o seguinte:

CLÁUSULA 1 - DO OBJETO
O presente contrato tem por objeto a prestação de serviços de instrução prática de direção veicular.

CLÁUSULA 2 - DO VALOR E PAGAMENTO
O valor da aula é de [VALOR_AULA], a ser pago através da plataforma Vrumi Connect.

CLÁUSULA 3 - DA DURAÇÃO
Cada aula terá duração de [DURACAO] minutos.

CLÁUSULA 4 - DO CANCELAMENTO
- Cancelamentos com mais de 24h de antecedência: reembolso integral
- Cancelamentos com menos de 24h: sem reembolso
- Cancelamento pelo instrutor: reembolso integral + reagendamento prioritário

CLÁUSULA 5 - DAS RESPONSABILIDADES
O INSTRUTOR se responsabiliza por:
- Comparecer no horário acordado
- Fornecer veículo em condições adequadas
- Ministrar instrução de qualidade

O ALUNO se responsabiliza por:
- Comparecer no horário acordado
- Portar documento de identificação
- Seguir as instruções de segurança

CLÁUSULA 6 - DO FORO
Fica eleito o foro da comarca de [CIDADE_INSTRUTOR] para dirimir quaisquer questões.

Data: [DATA_ATUAL]
`;

export default function BookingFlow() {
  const { instructorId } = useParams<{ instructorId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  const [step, setStep] = useState<Step>("date");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [contractAccepted, setContractAccepted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
    if (instructorId) {
      fetchInstructorData();
    }
  }, [instructorId]);

  const checkAuth = async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para agendar uma aula.",
        variant: "destructive",
      });
      navigate(`/auth?redirect=/connect/agendar/${instructorId}`);
      return;
    }
    setUser(data.session.user);
  };

  const fetchInstructorData = async () => {
    try {
      const [instructorRes, availabilityRes] = await Promise.all([
        supabase
          .from("instructors")
          .select("id, full_name, photo_url, city, state, price_per_lesson, lesson_duration_minutes")
          .eq("id", instructorId)
          .single(),
        supabase
          .from("instructor_availability")
          .select("day_of_week, start_time, end_time")
          .eq("instructor_id", instructorId)
          .eq("is_active", true),
      ]);

      if (instructorRes.error) throw instructorRes.error;
      setInstructor(instructorRes.data);
      setAvailability(availabilityRes.data || []);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do instrutor.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const [bookedSlots, setBookedSlots] = useState<Record<string, string[]>>({});

  const fetchBookedSlots = async (date: Date) => {
    if (!instructorId) return;
    const dateStr = format(date, "yyyy-MM-dd");
    
    const { data } = await supabase
      .from("bookings")
      .select("scheduled_time")
      .eq("instructor_id", instructorId)
      .eq("scheduled_date", dateStr)
      .in("status", ["pending", "confirmed"]);
    
    const times = data?.map(b => b.scheduled_time.slice(0, 5)) || [];
    setBookedSlots(prev => ({ ...prev, [dateStr]: times }));
  };

  const getAvailableTimeSlots = (date: Date): string[] => {
    const dayOfWeek = date.getDay();
    const dayAvailability = availability.filter((a) => a.day_of_week === dayOfWeek);
    const dateStr = format(date, "yyyy-MM-dd");
    const occupied = bookedSlots[dateStr] || [];
    
    const slots: string[] = [];
    dayAvailability.forEach((slot) => {
      const [startHour, startMin] = slot.start_time.split(":").map(Number);
      const [endHour, endMin] = slot.end_time.split(":").map(Number);
      
      let currentHour = startHour;
      let currentMin = startMin;
      
      while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
        const timeSlot = `${String(currentHour).padStart(2, "0")}:${String(currentMin).padStart(2, "0")}`;
        if (!occupied.includes(timeSlot)) {
          slots.push(timeSlot);
        }
        currentMin += 50;
        if (currentMin >= 60) {
          currentHour += Math.floor(currentMin / 60);
          currentMin = currentMin % 60;
        }
      }
    });
    
    return slots;
  };

  const isDateAvailable = (date: Date): boolean => {
    const dayOfWeek = date.getDay();
    return availability.some((a) => a.day_of_week === dayOfWeek);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const handleConfirmBooking = async () => {
    if (!instructor || !selectedDate || !selectedTime || !user) return;
    
    setProcessing(true);
    try {
      // Check for conflicts before booking (race condition protection)
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const { data: existingBookings } = await supabase
        .from("bookings")
        .select("id")
        .eq("instructor_id", instructor.id)
        .eq("scheduled_date", dateStr)
        .eq("scheduled_time", selectedTime)
        .in("status", ["pending", "confirmed"]);

      if (existingBookings && existingBookings.length > 0) {
        toast({
          title: "Horário indisponível",
          description: "Este horário acabou de ser reservado. Por favor, escolha outro.",
          variant: "destructive",
        });
        await fetchBookedSlots(selectedDate);
        setStep("time");
        setProcessing(false);
        return;
      }

      const price = Number(instructor.price_per_lesson);
      const platformFee = price * PLATFORM_FEE_PERCENTAGE;
      const instructorAmount = price - platformFee;

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          student_id: user.id,
          instructor_id: instructor.id,
          scheduled_date: dateStr,
          scheduled_time: selectedTime,
          duration_minutes: instructor.lesson_duration_minutes,
          price: price,
          platform_fee: platformFee,
          instructor_amount: instructorAmount,
          status: "pending",
          payment_status: "pending",
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Create contract
      const contractText = CONTRACT_TEMPLATE
        .replace("[NOME_ALUNO]", user.email)
        .replace("[NOME_INSTRUTOR]", instructor.full_name)
        .replace("[VALOR_AULA]", formatPrice(price))
        .replace("[DURACAO]", String(instructor.lesson_duration_minutes))
        .replace("[CIDADE_INSTRUTOR]", instructor.city)
        .replace("[DATA_ATUAL]", format(new Date(), "dd/MM/yyyy", { locale: ptBR }));

      const { error: contractError } = await supabase
        .from("contracts")
        .insert({
          booking_id: booking.id,
          student_id: user.id,
          instructor_id: instructor.id,
          contract_text: contractText,
          student_signature: user.email,
          student_signed_at: new Date().toISOString(),
        });

      if (contractError) throw contractError;

      // Update booking with contract signed
      await supabase
        .from("bookings")
        .update({ contract_signed_at: new Date().toISOString() })
        .eq("id", booking.id);

      setStep("success");
      toast({
        title: "Aula agendada!",
        description: "Contrato assinado e aula confirmada.",
      });
    } catch (error: any) {
      console.error("Booking error:", error);
      toast({
        title: "Erro ao agendar",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0A2F44]" />
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

  const price = Number(instructor.price_per_lesson);
  const platformFee = price * PLATFORM_FEE_PERCENTAGE;

  return (
    <>
      <SEOHead
        title={`Agendar aula com ${instructor.full_name} | Vrumi Connect`}
        description="Agende sua aula de direção com segurança e contrato digital."
      />

      <div className="min-h-screen bg-[#F8F9FA]">
        {/* Header */}
        <header className="bg-[#0A2F44] text-white">
          <div className="container mx-auto px-4 py-4">
            <Link to="/connect" className="flex items-center gap-2">
              <Car className="h-8 w-8" />
              <span className="text-xl font-semibold">Vrumi Connect</span>
            </Link>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 text-gray-600 hover:text-[#0A2F44]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8 max-w-md mx-auto">
            {["date", "time", "contract", "payment"].map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === s || ["date", "time", "contract", "payment"].indexOf(step) > i
                      ? "bg-[#0A2F44] text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {i + 1}
                </div>
                {i < 3 && (
                  <div
                    className={`w-12 h-0.5 ${
                      ["date", "time", "contract", "payment"].indexOf(step) > i
                        ? "bg-[#0A2F44]"
                        : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {step === "success" ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <div className="w-20 h-20 bg-[#2F7B3A]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="h-10 w-10 text-[#2F7B3A]" />
                    </div>
                    <h2 className="text-2xl font-bold text-[#0A2F44] mb-2">
                      Contrato assinado e aula confirmada!
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Sua aula com {instructor.full_name} foi agendada para{" "}
                      {selectedDate && format(selectedDate, "dd 'de' MMMM", { locale: ptBR })} às {selectedTime}.
                    </p>
                    <div className="flex gap-4 justify-center">
                      <Link to="/connect">
                        <Button variant="outline">Voltar ao início</Button>
                      </Link>
                      <Link to="/dashboard">
                        <Button className="bg-[#0A2F44] hover:bg-[#0A2F44]/90">
                          Ver minhas aulas
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ) : step === "date" ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#0A2F44]">
                      <Calendar className="h-5 w-5" />
                      Escolha a data
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={async (date) => {
                        setSelectedDate(date);
                        if (date) {
                          await fetchBookedSlots(date);
                          setStep("time");
                        }
                      }}
                      disabled={(date) => 
                        date < new Date() || 
                        date > addDays(new Date(), 30) ||
                        !isDateAvailable(date)
                      }
                      className="rounded-md border mx-auto"
                      locale={ptBR}
                    />
                    <p className="text-sm text-gray-500 text-center mt-4">
                      Selecione uma data disponível nos próximos 30 dias.
                    </p>
                  </CardContent>
                </Card>
              ) : step === "time" ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#0A2F44]">
                      <Clock className="h-5 w-5" />
                      Escolha o horário
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      {selectedDate && format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </p>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                      {selectedDate && getAvailableTimeSlots(selectedDate).map((time) => (
                        <Button
                          key={time}
                          variant={selectedTime === time ? "default" : "outline"}
                          className={selectedTime === time ? "bg-[#0A2F44]" : ""}
                          onClick={() => setSelectedTime(time)}
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                    <div className="flex gap-4 mt-6">
                      <Button variant="outline" onClick={() => setStep("date")}>
                        Voltar
                      </Button>
                      <Button
                        className="bg-[#0A2F44] hover:bg-[#0A2F44]/90"
                        disabled={!selectedTime}
                        onClick={() => setStep("contract")}
                      >
                        Continuar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : step === "contract" ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#0A2F44]">
                      <FileText className="h-5 w-5" />
                      Contrato de Prestação de Serviços
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64 border rounded-lg p-4 mb-4">
                      <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans">
                        {CONTRACT_TEMPLATE
                          .replace("[NOME_ALUNO]", user?.email || "")
                          .replace("[NOME_INSTRUTOR]", instructor.full_name)
                          .replace("[VALOR_AULA]", formatPrice(price))
                          .replace("[DURACAO]", String(instructor.lesson_duration_minutes))
                          .replace("[CIDADE_INSTRUTOR]", instructor.city)
                          .replace("[DATA_ATUAL]", format(new Date(), "dd/MM/yyyy", { locale: ptBR }))}
                      </pre>
                    </ScrollArea>
                    <div className="flex items-start space-x-3 mb-6">
                      <Checkbox
                        id="contract"
                        checked={contractAccepted}
                        onCheckedChange={(checked) => setContractAccepted(checked as boolean)}
                      />
                      <Label htmlFor="contract" className="text-sm">
                        Li e aceito os termos do contrato de prestação de serviços
                      </Label>
                    </div>
                    <div className="flex gap-4">
                      <Button variant="outline" onClick={() => setStep("time")}>
                        Voltar
                      </Button>
                      <Button
                        className="bg-[#0A2F44] hover:bg-[#0A2F44]/90"
                        disabled={!contractAccepted}
                        onClick={() => setStep("payment")}
                      >
                        Aceitar e continuar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : step === "payment" ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#0A2F44]">
                      <CreditCard className="h-5 w-5" />
                      Pagamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={(v) => setPaymentMethod(v as "pix" | "card")}
                      className="space-y-4 mb-6"
                    >
                      <div className="flex items-center space-x-3 border rounded-lg p-4">
                        <RadioGroupItem value="pix" id="pix" />
                        <Label htmlFor="pix" className="flex-1 cursor-pointer">
                          <span className="font-medium">PIX</span>
                          <p className="text-sm text-gray-500">Pagamento instantâneo</p>
                        </Label>
                        <Badge variant="secondary">Recomendado</Badge>
                      </div>
                      <div className="flex items-center space-x-3 border rounded-lg p-4">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="flex-1 cursor-pointer">
                          <span className="font-medium">Cartão de crédito</span>
                          <p className="text-sm text-gray-500">Visa, Mastercard, Elo</p>
                        </Label>
                      </div>
                    </RadioGroup>
                    <div className="flex gap-4">
                      <Button variant="outline" onClick={() => setStep("contract")}>
                        Voltar
                      </Button>
                      <Button
                        className="bg-[#0A2F44] hover:bg-[#0A2F44]/90 flex-1"
                        onClick={handleConfirmBooking}
                        disabled={processing}
                      >
                        {processing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          `Pagar ${formatPrice(price)}`
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>

            {/* Sidebar - Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-lg text-[#0A2F44]">Resumo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-[#0A2F44]/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-[#0A2F44]">
                        {instructor.full_name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-[#0A2F44]">{instructor.full_name}</p>
                      <p className="text-sm text-gray-500">
                        {instructor.city}, {instructor.state}
                      </p>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {selectedDate && (
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Data</span>
                        <span className="font-medium">
                          {format(selectedDate, "dd/MM/yyyy")}
                        </span>
                      </div>
                      {selectedTime && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Horário</span>
                          <span className="font-medium">{selectedTime}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Duração</span>
                        <span className="font-medium">{instructor.lesson_duration_minutes} min</span>
                      </div>
                    </div>
                  )}

                  <Separator className="my-4" />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valor da aula</span>
                      <span>{formatPrice(price)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span className="text-[#0A2F44]">{formatPrice(price)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
