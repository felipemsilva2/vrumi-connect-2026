import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, Trash2, Ban, Eye, CheckCircle, XCircle, Clock } from "lucide-react";
import { InstructorDetailsDialog } from "@/components/admin/InstructorDetailsDialog";
import { useAuditLog } from "@/hooks/useAuditLog";

interface Instructor {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  created_at: string;
  phone?: string;
  city?: string;
  state?: string;
  avatar_url?: string;
}

export default function AdminInstructors() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isProcessing, setIsProcessing] = useState(false);

  // Details Dialog State
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [instructorToDelete, setInstructorToDelete] = useState<Instructor | null>(null);

  const { logAction } = useAuditLog();

  const fetchInstructors = async () => {
    setLoading(true);
    try {
      // Assuming 'instructors' table is linked to 'profiles' via user_id, 
      // but for now we fetch from instructors table directly or view.
      // If email is not in instructors table, we might need a join.
      // Let's assume instructors table has the necessary fields or we fetch what we can.
      const { data, error } = await supabase
        .from("instructors")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInstructors(data || []);
    } catch (error) {
      console.error("Error fetching instructors:", error);
      toast.error("Erro ao carregar instrutores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructors();
  }, []);

  const handleSuspend = async (instructor: Instructor) => {
    setIsProcessing(true);
    console.log(`[AdminInstructors] Attempting to suspend instructor ID: ${instructor.id}`);

    try {
      const { error } = await supabase
        .from("instructors")
        .update({ status: "suspended", updated_at: new Date().toISOString() })
        .eq("id", instructor.id);

      if (error) {
        console.error('[AdminInstructors] Supabase Update Error:', error);
        throw error;
      }

      console.log('[AdminInstructors] Status updated successfully in DB');

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
      console.error("Error suspending instructor (CATCH):", error);
      toast.error(error.message || "Erro ao suspender instrutor");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteClick = (instructor: Instructor) => {
    setInstructorToDelete(instructor);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!instructorToDelete) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("instructors")
        .delete()
        .eq("id", instructorToDelete.id);

      if (error) throw error;

      await logAction({
        actionType: "DELETE_INSTRUCTOR",
        entityType: "instructor",
        entityId: instructorToDelete.id,
        oldValues: { name: instructorToDelete.full_name },
        newValues: null,
      });

      toast.success("Instrutor removido com sucesso");
      setDeleteDialogOpen(false);
      fetchInstructors();
    } catch (error: any) {
      console.error("Error deleting instructor:", error);
      toast.error(error.message || "Erro ao remover instrutor");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewDetails = (instructor: Instructor) => {
    setSelectedInstructor(instructor);
    setDialogOpen(true);
  };

  const filteredInstructors = instructors.filter((instructor) => {
    const search = searchTerm.toLowerCase();
    const nameMatch = instructor.full_name?.toLowerCase().includes(search);
    const emailMatch = instructor.email?.toLowerCase().includes(search);
    const idMatch = instructor.id?.toLowerCase().includes(search);

    const matchesSearch = nameMatch || emailMatch || idMatch;
    const matchesStatus = statusFilter === "all" || instructor.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500 hover:bg-green-600">Aprovado</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pendente</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejeitado</Badge>;
      case "suspended":
        return <Badge variant="outline" className="text-orange-500 border-orange-500">Suspenso</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Instrutores</h1>
            <p className="text-muted-foreground">
              Gerencie os instrutores cadastrados na plataforma.
            </p>
          </div>
          <Button onClick={fetchInstructors} variant="outline" size="sm" className="gap-2">
            <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou ID..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="approved">Aprovado</SelectItem>
              <SelectItem value="rejected">Rejeitado</SelectItem>
              <SelectItem value="suspended">Suspenso</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Instrutor</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex justify-center items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span>Carregando instrutores...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredInstructors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    Nenhum instrutor encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredInstructors.map((instructor) => (
                  <TableRow key={instructor.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{instructor.full_name}</span>
                        <span className="text-xs text-muted-foreground">{instructor.email}</span>
                        <span className="text-xs text-muted-foreground font-mono truncate max-w-[120px]" title={instructor.id}>ID: {instructor.id}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {instructor.city && instructor.state
                          ? `${instructor.city} - ${instructor.state}`
                          : <span className="text-muted-foreground italic">Não informado</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(instructor.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(instructor.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetails(instructor)}
                          className="text-primary hover:text-primary/80 hover:bg-primary/10"
                          title="Ver Detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

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

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(instructor)}
                          disabled={isProcessing}
                          title="Remover"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {selectedInstructor && (
          <InstructorDetailsDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            instructor={selectedInstructor}
            onUpdate={fetchInstructors}
          />
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente o registro do instrutor
                <strong> {instructorToDelete?.full_name}</strong> e removerá seus dados de nossos servidores.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sim, remover instrutor"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
