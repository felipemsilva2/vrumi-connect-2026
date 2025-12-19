import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { PaginationControls } from "@/components/admin/PaginationControls";
import { InstructorDetailsDialog } from "@/components/admin/InstructorDetailsDialog";
import {
  Search, Eye, RefreshCw, CheckCircle, XCircle, Ban,
  Bell, Send, Users, Loader2, MapPin, GraduationCap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type InstructorStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

interface Instructor {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  cpf: string;
  bio: string | null;
  photo_url: string | null;
  city: string;
  state: string;
  categories: string[];
  price_per_lesson: number;
  lesson_duration_minutes: number;
  status: InstructorStatus;
  is_verified: boolean;
  total_lessons: number;
  average_rating: number;
  total_reviews: number;
  created_at: string;
  updated_at: string;
  email?: string;
  // Document URLs
  cnh_document_url?: string | null;
  vehicle_document_url?: string | null;
  credential_document_url?: string | null;
  background_check_url?: string | null;
  documents_status?: 'pending' | 'submitted' | 'verified' | 'rejected';
}

const statusConfig: Record<InstructorStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "secondary" },
  approved: { label: "Aprovado", variant: "default" },
  rejected: { label: "Rejeitado", variant: "destructive" },
  suspended: { label: "Suspenso", variant: "outline" },
};

const AdminInstructors = () => {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Bulk Actions State
  const [selectedInstructors, setSelectedInstructors] = useState<string[]>([]);
  const [bulkNotificationOpen, setBulkNotificationOpen] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [isSendingBulk, setIsSendingBulk] = useState(false);

  // Reject dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [instructorToReject, setInstructorToReject] = useState<Instructor | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { logAction } = useAuditLog();

  // Get unique states for filter
  const [availableStates, setAvailableStates] = useState<string[]>([]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchInstructors = useCallback(async () => {
    setIsLoading(true);
    try {
      // Build query
      let query = supabase
        .from("instructors")
        .select("*", { count: "exact" });

      // Apply filters
      if (debouncedSearch) {
        query = query.or(`full_name.ilike.%${debouncedSearch}%,city.ilike.%${debouncedSearch}%,phone.ilike.%${debouncedSearch}%`);
      }
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as InstructorStatus);
      }
      if (stateFilter !== "all") {
        query = query.eq("state", stateFilter);
      }

      // Get count
      const { count, error: countError } = await query;
      if (countError) throw countError;
      setTotalItems(count || 0);

      // Get paginated data
      let dataQuery = supabase
        .from("instructors")
        .select("*")
        .order("created_at", { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      if (debouncedSearch) {
        dataQuery = dataQuery.or(`full_name.ilike.%${debouncedSearch}%,city.ilike.%${debouncedSearch}%,phone.ilike.%${debouncedSearch}%`);
      }
      if (statusFilter !== "all") {
        dataQuery = dataQuery.eq("status", statusFilter as InstructorStatus);
      }
      if (stateFilter !== "all") {
        dataQuery = dataQuery.eq("state", stateFilter);
      }

      const { data, error } = await dataQuery;
      if (error) throw error;

      // Get user emails for each instructor
      const instructorsWithEmail = await Promise.all(
        (data || []).map(async (instructor) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", instructor.user_id)
            .maybeSingle();

          return {
            ...instructor,
            email: profile?.email || "N/A",
          } as Instructor;
        })
      );

      setInstructors(instructorsWithEmail);

      // Get available states for filter
      const { data: statesData } = await supabase
        .from("instructors")
        .select("state")
        .order("state");

      const uniqueStates = [...new Set(statesData?.map(s => s.state) || [])];
      setAvailableStates(uniqueStates);

    } catch (error) {
      console.error("Error fetching instructors:", error);
      toast.error("Erro ao carregar instrutores");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, debouncedSearch, statusFilter, stateFilter]);

  useEffect(() => {
    fetchInstructors();
  }, [fetchInstructors]);

  const handleViewDetails = (instructor: Instructor) => {
    setSelectedInstructor(instructor);
    setDialogOpen(true);
  };

  const handleApprove = async (instructor: Instructor) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("instructors")
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", instructor.id);

      if (error) throw error;

      // Send notification to instructor
      await supabase.from("notifications").insert({
        user_id: instructor.user_id,
        type: "instructor_approved",
        title: "Cadastro Aprovado! 🎉",
        message: "Parabéns! Seu cadastro como instrutor foi aprovado. Agora você aparecerá nas buscas de alunos.",
      });

      await logAction({
        actionType: "APPROVE_INSTRUCTOR",
        entityType: "instructor",
        entityId: instructor.id,
        oldValues: { status: instructor.status },
        newValues: { status: "approved" },
      });

      toast.success("Instrutor aprovado com sucesso!");
      fetchInstructors();
    } catch (error: any) {
      console.error("Error approving instructor:", error);
      toast.error(error.message || "Erro ao aprovar instrutor");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectClick = (instructor: Instructor) => {
    setInstructorToReject(instructor);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!instructorToReject) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("instructors")
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("id", instructorToReject.id);

      if (error) throw error;

      // Send notification to instructor
      await supabase.from("notifications").insert({
        user_id: instructorToReject.user_id,
        type: "instructor_rejected",
        title: "Cadastro Não Aprovado",
        message: rejectReason || "Seu cadastro como instrutor não foi aprovado. Entre em contato com o suporte para mais informações.",
      });

      await logAction({
        actionType: "REJECT_INSTRUCTOR",
        entityType: "instructor",
        entityId: instructorToReject.id,
        oldValues: { status: instructorToReject.status },
        newValues: { status: "rejected", reason: rejectReason },
      });

      toast.success("Instrutor rejeitado");
      setRejectDialogOpen(false);
      fetchInstructors();
    } catch (error: any) {
      console.error("Error rejecting instructor:", error);
      toast.error(error.message || "Erro ao rejeitar instrutor");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuspend = async (instructor: Instructor) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("instructors")
        .update({ status: "suspended", updated_at: new Date().toISOString() })
        .eq("id", instructor.id);

      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: instructor.user_id,
        type: "instructor_suspended",
        title: "Conta Suspensa",
        message: "Sua conta de instrutor foi suspensa temporariamente. Entre em contato com o suporte para mais informações.",
      });

      await logAction({
        actionType: "SUSPEND_INSTRUCTOR",
        entityType: "instructor",
        entityId: instructor.id,
        oldValues: { status: instructor.status },
        newValues: { status: "suspended" },
      });

      toast.success("Instrutor suspenso");
      fetchInstructors();
    } catch (error: any) {
      console.error("Error suspending instructor:", error);
      toast.error(error.message || "Erro ao suspender instrutor");
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk selection helpers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInstructors(instructors.map(i => i.user_id));
    } else {
      setSelectedInstructors([]);
    }
  };

  const handleSelectOne = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedInstructors(prev => [...prev, userId]);
    } else {
      setSelectedInstructors(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSendBulkNotification = async () => {
    if (selectedInstructors.length === 0) return;
    if (!notificationTitle || !notificationMessage) {
      toast.error("Preencha título e mensagem");
      return;
    }

    setIsSendingBulk(true);
    try {
      const { error } = await supabase.functions.invoke('admin-send-notification', {
        body: {
          user_ids: selectedInstructors,
          title: notificationTitle,
          message: notificationMessage,
          type: 'info'
        }
      });

      if (error) throw error;
      toast.success(`Notificação enviada para ${selectedInstructors.length} instrutores!`);
      setBulkNotificationOpen(false);
      setNotificationTitle("");
      setNotificationMessage("");
      setSelectedInstructors([]);
    } catch (error: any) {
      console.error("Error sending bulk notification:", error);
      toast.error(error.message || "Erro ao enviar notificações");
    } finally {
      setIsSendingBulk(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedInstructors.length === 0) return;

    const pendingInstructors = instructors.filter(
      i => selectedInstructors.includes(i.user_id) && i.status === 'pending'
    );

    if (pendingInstructors.length === 0) {
      toast.error("Nenhum instrutor pendente selecionado");
      return;
    }

    setIsProcessing(true);
    try {
      for (const instructor of pendingInstructors) {
        await handleApprove(instructor);
      }
      setSelectedInstructors([]);
      toast.success(`${pendingInstructors.length} instrutores aprovados!`);
    } catch (error) {
      console.error("Error bulk approving:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold">Gerenciar Instrutores</h2>
            <p className="text-muted-foreground">
              Aprove, rejeite e gerencie instrutores do Vrumi Connect
            </p>
          </div>
          <Button onClick={fetchInstructors} variant="outline" size="sm" className="w-fit">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, cidade ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="approved">Aprovados</SelectItem>
              <SelectItem value="rejected">Rejeitados</SelectItem>
              <SelectItem value="suspended">Suspensos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {availableStates.map(state => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabela de Instrutores */}
        <div className="border rounded-lg bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={instructors.length > 0 && selectedInstructors.length === instructors.length}
                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Instrutor</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Categorias</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Carregando dados...
                    </div>
                  </TableCell>
                </TableRow>
              ) : instructors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Nenhum instrutor encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                instructors.map((instructor) => (
                  <TableRow key={instructor.id} className={selectedInstructors.includes(instructor.user_id) ? "bg-muted/50" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={selectedInstructors.includes(instructor.user_id)}
                        onCheckedChange={(checked) => handleSelectOne(instructor.user_id, checked as boolean)}
                        aria-label={`Select ${instructor.full_name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={instructor.photo_url || undefined} alt={instructor.full_name} />
                          <AvatarFallback>
                            {instructor.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">{instructor.full_name}</span>
                          <span className="text-xs text-muted-foreground">{instructor.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {instructor.city}, {instructor.state}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {instructor.categories.map(cat => (
                          <Badge key={cat} variant="outline" className="text-xs">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig[instructor.status].variant}>
                        {statusConfig[instructor.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(instructor.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetails(instructor)}
                          title="Ver Detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {instructor.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleApprove(instructor)}
                              disabled={isProcessing}
                              title="Aprovar"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRejectClick(instructor)}
                              disabled={isProcessing}
                              title="Rejeitar"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {instructor.status === 'approved' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSuspend(instructor)}
                            disabled={isProcessing}
                            title="Suspender"
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="border-t p-4">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
              totalItems={totalItems}
            />
          </div>
        </div>
      </div>

      <InstructorDetailsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        instructor={selectedInstructor}
        onUpdate={fetchInstructors}
      />

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Instrutor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              O instrutor <strong>{instructorToReject?.full_name}</strong> será notificado sobre a rejeição.
            </p>
            <div className="space-y-2">
              <Label>Motivo (opcional)</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Informe o motivo da rejeição..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleRejectConfirm} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Rejeição"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Actions Floating Bar */}
      {selectedInstructors.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-foreground text-background px-6 py-3 rounded-full shadow-lg flex items-center gap-4 z-50">
          <div className="flex items-center gap-2 font-medium">
            <GraduationCap className="h-4 w-4" />
            {selectedInstructors.length} selecionados
          </div>
          <div className="h-4 w-px bg-background/20" />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleBulkApprove}
            disabled={isProcessing}
            className="gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Aprovar Todos
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setBulkNotificationOpen(true)}
            className="gap-2"
          >
            <Bell className="h-4 w-4" />
            Notificar
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedInstructors([])} className="ml-2 hover:bg-background/10 h-8 w-8 p-0 rounded-full">
            ✕
          </Button>
        </div>
      )}

      {/* Bulk Notification Dialog */}
      <Dialog open={bulkNotificationOpen} onOpenChange={setBulkNotificationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Notificação para Instrutores</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted p-3 rounded-md text-sm text-muted-foreground">
              Enviando para <b>{selectedInstructors.length} instrutores</b> selecionados.
            </div>
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={notificationTitle}
                onChange={(e) => setNotificationTitle(e.target.value)}
                placeholder="Ex: Aviso Importante"
              />
            </div>
            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkNotificationOpen(false)}>Cancelar</Button>
            <Button onClick={handleSendBulkNotification} disabled={isSendingBulk}>
              {isSendingBulk ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Enviar para Todos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminInstructors;
