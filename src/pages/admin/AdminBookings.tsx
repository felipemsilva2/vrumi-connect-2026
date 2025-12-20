import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, RefreshCw, Eye, XCircle, Calendar, Clock, User, GraduationCap, DollarSign } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Booking {
    id: string;
    student_id: string;
    instructor_id: string;
    scheduled_date: string;
    scheduled_time: string;
    duration_minutes: number;
    status: string;
    payment_status: string | null;
    price: number;
    cancellation_reason?: string;
    cancelled_at?: string;
    created_at: string;
    student?: { full_name: string; email?: string };
    instructor?: { full_name: string; user_id: string };
}

const statusConfig: Record<string, { label: string; variant: "secondary" | "default" | "destructive" | "outline" }> = {
    pending: { label: "Pendente", variant: "secondary" },
    confirmed: { label: "Confirmado", variant: "default" },
    cancelled: { label: "Cancelado", variant: "destructive" },
    completed: { label: "Concluído", variant: "outline" },
    disputed: { label: "Disputado", variant: "destructive" },
};

const paymentStatusConfig = {
    pending: { label: "Aguardando", variant: "secondary" as const },
    completed: { label: "Pago", variant: "default" as const },
    failed: { label: "Falhou", variant: "destructive" as const },
    refunded: { label: "Reembolsado", variant: "outline" as const },
};

const AdminBookings = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [paymentFilter, setPaymentFilter] = useState<string>("all");
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const fetchBookings = useCallback(async () => {
        if (!isSupabaseConfigured || !navigator.onLine) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);

            const { data, error } = await supabase
                .from("bookings")
                .select(`
          *,
          student:profiles!bookings_student_id_fkey_profiles(full_name, email),
          instructor:instructors!bookings_instructor_id_fkey(full_name, user_id)
        `)
                .order("created_at", { ascending: false })
                .limit(200);

            if (error) throw error;

            setBookings(data || []);
            setFilteredBookings(data || []);
        } catch (error) {
            console.error("Error fetching bookings:", error);
            toast.error("Erro ao carregar agendamentos");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    useEffect(() => {
        let filtered = bookings;

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(booking =>
                booking.student?.full_name?.toLowerCase().includes(term) ||
                booking.instructor?.full_name?.toLowerCase().includes(term) ||
                booking.id.toLowerCase().includes(term)
            );
        }

        // Status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter(booking => booking.status === statusFilter);
        }

        // Payment filter
        if (paymentFilter !== "all") {
            filtered = filtered.filter(booking => booking.payment_status === paymentFilter);
        }

        setFilteredBookings(filtered);
    }, [bookings, searchTerm, statusFilter, paymentFilter]);

    const handleViewDetails = (booking: Booking) => {
        setSelectedBooking(booking);
        setIsDetailsOpen(true);
    };

    const handleCancelBooking = async (bookingId: string) => {
        try {
            const { error } = await supabase
                .from("bookings")
                .update({
                    status: "cancelled",
                    cancellation_reason: "Cancelado pelo administrador",
                    cancelled_at: new Date().toISOString(),
                })
                .eq("id", bookingId);

            if (error) throw error;

            toast.success("Agendamento cancelado com sucesso");
            fetchBookings();
            setIsDetailsOpen(false);
        } catch (error) {
            console.error("Error cancelling booking:", error);
            toast.error("Erro ao cancelar agendamento");
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
        } catch {
            return dateStr;
        }
    };

    const formatTime = (timeStr: string) => {
        return timeStr?.substring(0, 5) || timeStr;
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold">Agendamentos</h2>
                        <p className="text-muted-foreground">Gerenciamento de aulas agendadas</p>
                    </div>
                    <Button onClick={fetchBookings} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Atualizar
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por aluno, instrutor ou ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Status</SelectItem>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="confirmed">Confirmado</SelectItem>
                            <SelectItem value="cancelled">Cancelado</SelectItem>
                            <SelectItem value="completed">Concluído</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Pagamento" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos Pagamentos</SelectItem>
                            <SelectItem value="pending">Aguardando</SelectItem>
                            <SelectItem value="completed">Pago</SelectItem>
                            <SelectItem value="failed">Falhou</SelectItem>
                            <SelectItem value="refunded">Reembolsado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold">{bookings.length}</p>
                        <p className="text-sm text-muted-foreground">Total</p>
                    </div>
                    <div className="bg-yellow-500/10 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-yellow-600">
                            {bookings.filter(b => b.status === 'pending').length}
                        </p>
                        <p className="text-sm text-muted-foreground">Pendentes</p>
                    </div>
                    <div className="bg-green-500/10 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-green-600">
                            {bookings.filter(b => b.status === 'confirmed').length}
                        </p>
                        <p className="text-sm text-muted-foreground">Confirmados</p>
                    </div>
                    <div className="bg-red-500/10 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-red-600">
                            {bookings.filter(b => b.status === 'cancelled').length}
                        </p>
                        <p className="text-sm text-muted-foreground">Cancelados</p>
                    </div>
                    <div className="bg-blue-500/10 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-blue-600">
                            {bookings.filter(b => b.status === 'completed').length}
                        </p>
                        <p className="text-sm text-muted-foreground">Concluídos</p>
                    </div>
                </div>

                {/* Table */}
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data/Hora</TableHead>
                                <TableHead>Aluno</TableHead>
                                <TableHead>Instrutor</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Pagamento</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        Carregando...
                                    </TableCell>
                                </TableRow>
                            ) : filteredBookings.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        Nenhum agendamento encontrado
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredBookings.map((booking) => (
                                    <TableRow key={booking.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{formatDate(booking.scheduled_date)}</span>
                                                <span className="text-sm text-muted-foreground">{formatTime(booking.scheduled_time)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-medium">{booking.student?.full_name || 'N/A'}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span>{booking.instructor?.full_name || 'N/A'}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-medium">R$ {booking.price?.toFixed(2) || '0.00'}</span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={statusConfig[booking.status]?.variant || "secondary"}>
                                                {statusConfig[booking.status]?.label || booking.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={paymentStatusConfig[booking.payment_status]?.variant || "secondary"}>
                                                {paymentStatusConfig[booking.payment_status]?.label || booking.payment_status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleViewDetails(booking)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleCancelBooking(booking.id)}
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Details Dialog */}
                <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Detalhes do Agendamento</DialogTitle>
                            <DialogDescription>
                                ID: {selectedBooking?.id}
                            </DialogDescription>
                        </DialogHeader>

                        {selectedBooking && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-4 w-4" /> Data
                                        </p>
                                        <p className="font-medium">{formatDate(selectedBooking.scheduled_date)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-4 w-4" /> Horário
                                        </p>
                                        <p className="font-medium">{formatTime(selectedBooking.scheduled_time)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <User className="h-4 w-4" /> Aluno
                                        </p>
                                        <p className="font-medium">{selectedBooking.student?.full_name || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <GraduationCap className="h-4 w-4" /> Instrutor
                                        </p>
                                        <p className="font-medium">{selectedBooking.instructor?.full_name || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <DollarSign className="h-4 w-4" /> Valor
                                        </p>
                                        <p className="font-medium">R$ {selectedBooking.price?.toFixed(2)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Duração</p>
                                        <p className="font-medium">{selectedBooking.duration_minutes} min</p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Badge variant={statusConfig[selectedBooking.status]?.variant}>
                                        {statusConfig[selectedBooking.status]?.label}
                                    </Badge>
                                    <Badge variant={paymentStatusConfig[selectedBooking.payment_status]?.variant}>
                                        {paymentStatusConfig[selectedBooking.payment_status]?.label}
                                    </Badge>
                                </div>

                                {selectedBooking.cancellation_reason && (
                                    <div className="p-3 bg-destructive/10 rounded-lg">
                                        <p className="text-sm font-medium text-destructive">Motivo do cancelamento:</p>
                                        <p className="text-sm">{selectedBooking.cancellation_reason}</p>
                                    </div>
                                )}

                                <div className="flex justify-end gap-2 pt-4">
                                    {selectedBooking.status !== 'cancelled' && selectedBooking.status !== 'completed' && (
                                        <Button
                                            variant="destructive"
                                            onClick={() => handleCancelBooking(selectedBooking.id)}
                                        >
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Cancelar Agendamento
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
};

export default AdminBookings;
