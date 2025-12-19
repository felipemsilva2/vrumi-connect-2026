import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MapPin, Phone, Mail, CreditCard, Clock, Star,
  CheckCircle, XCircle, Ban, GraduationCap, FileText
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { useAuditLog } from "@/hooks/useAuditLog";

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

interface InstructorDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructor: Instructor | null;
  onUpdate: () => void;
}

const statusConfig: Record<InstructorStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "secondary" },
  approved: { label: "Aprovado", variant: "default" },
  rejected: { label: "Rejeitado", variant: "destructive" },
  suspended: { label: "Suspenso", variant: "outline" },
};

export function InstructorDetailsDialog({ open, onOpenChange, instructor, onUpdate }: InstructorDetailsDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { logAction } = useAuditLog();

  if (!instructor) return null;

  const handleStatusChange = async (newStatus: InstructorStatus) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("instructors")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", instructor.id);

      if (error) throw error;

      const notificationMessages: Record<InstructorStatus, { title: string; message: string; type: string }> = {
        approved: {
          title: "Cadastro Aprovado! 🎉",
          message: "Parabéns! Seu cadastro como instrutor foi aprovado.",
          type: "instructor_approved"
        },
        rejected: {
          title: "Cadastro Não Aprovado",
          message: "Seu cadastro como instrutor não foi aprovado.",
          type: "instructor_rejected"
        },
        suspended: {
          title: "Conta Suspensa",
          message: "Sua conta de instrutor foi suspensa temporariamente.",
          type: "instructor_suspended"
        },
        pending: {
          title: "Status Atualizado",
          message: "Seu cadastro está em análise novamente.",
          type: "instructor_pending"
        }
      };

      await supabase.from("notifications").insert({
        user_id: instructor.user_id,
        ...notificationMessages[newStatus],
      });

      await logAction({
        actionType: `UPDATE_INSTRUCTOR_STATUS_${newStatus.toUpperCase()}`,
        entityType: "instructor",
        entityId: instructor.id,
        oldValues: { status: instructor.status },
        newValues: { status: newStatus },
      });

      toast.success(`Status atualizado para ${statusConfig[newStatus].label}`);
      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating instructor status:", error);
      toast.error(error.message || "Erro ao atualizar status");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (phone: string) => {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Instrutor</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header with photo and basic info */}
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={instructor.photo_url || undefined} alt={instructor.full_name} />
              <AvatarFallback className="text-xl">
                {instructor.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold">{instructor.full_name}</h3>
                <Badge variant={statusConfig[instructor.status].variant}>
                  {statusConfig[instructor.status].label}
                </Badge>
                {instructor.is_verified && (
                  <Badge variant="default" className="bg-blue-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verificado
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {instructor.categories.map(cat => (
                  <Badge key={cat} variant="outline">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    Categoria {cat}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">Contato</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {instructor.email || "N/A"}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {formatPhone(instructor.phone)}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {instructor.city}, {instructor.state}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">Documentos</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  CPF: {formatCPF(instructor.cpf)}
                </div>
              </div>

              {/* Document Links */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                {instructor.cnh_document_url ? (
                  <a
                    href={instructor.cnh_document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 bg-green-50 text-green-700 rounded-lg text-xs hover:bg-green-100"
                  >
                    <CheckCircle className="h-3 w-3" />
                    CNH com EAR
                  </a>
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-red-50 text-red-500 rounded-lg text-xs">
                    <XCircle className="h-3 w-3" />
                    CNH Pendente
                  </div>
                )}

                {instructor.vehicle_document_url ? (
                  <a
                    href={instructor.vehicle_document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 bg-green-50 text-green-700 rounded-lg text-xs hover:bg-green-100"
                  >
                    <CheckCircle className="h-3 w-3" />
                    CRLV Veículo
                  </a>
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-red-50 text-red-500 rounded-lg text-xs">
                    <XCircle className="h-3 w-3" />
                    CRLV Pendente
                  </div>
                )}

                {instructor.credential_document_url ? (
                  <a
                    href={instructor.credential_document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 bg-green-50 text-green-700 rounded-lg text-xs hover:bg-green-100"
                  >
                    <CheckCircle className="h-3 w-3" />
                    Credencial CFC
                  </a>
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-red-50 text-red-500 rounded-lg text-xs">
                    <XCircle className="h-3 w-3" />
                    Credencial Pendente
                  </div>
                )}

                {instructor.background_check_url ? (
                  <a
                    href={instructor.background_check_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 bg-green-50 text-green-700 rounded-lg text-xs hover:bg-green-100"
                  >
                    <CheckCircle className="h-3 w-3" />
                    Antecedentes
                  </a>
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-red-50 text-red-500 rounded-lg text-xs">
                    <XCircle className="h-3 w-3" />
                    Antecedentes Pendente
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Pricing and Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-muted rounded-lg text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm">
                <CreditCard className="h-4 w-4" />
                Valor/Aula
              </div>
              <p className="text-lg font-semibold mt-1">
                R$ {instructor.price_per_lesson.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm">
                <Clock className="h-4 w-4" />
                Duração
              </div>
              <p className="text-lg font-semibold mt-1">
                {instructor.lesson_duration_minutes} min
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm">
                <Star className="h-4 w-4" />
                Avaliação
              </div>
              <p className="text-lg font-semibold mt-1">
                {instructor.average_rating.toFixed(1)} ({instructor.total_reviews})
              </p>
            </div>
          </div>

          {/* Bio */}
          {instructor.bio && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">Biografia</h4>
                <p className="text-sm">{instructor.bio}</p>
              </div>
            </>
          )}

          {/* Metadata */}
          <Separator />
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Cadastrado em: {new Date(instructor.created_at).toLocaleString("pt-BR")}</p>
            <p>Última atualização: {new Date(instructor.updated_at).toLocaleString("pt-BR")}</p>
            <p>Total de aulas: {instructor.total_lessons}</p>
          </div>

          {/* Action Buttons */}
          <Separator />
          <div className="flex flex-wrap gap-2">
            {instructor.status === 'pending' && (
              <>
                <Button
                  onClick={() => handleStatusChange('approved')}
                  disabled={isProcessing}
                  className="gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Aprovar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleStatusChange('rejected')}
                  disabled={isProcessing}
                  className="gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Rejeitar
                </Button>
              </>
            )}
            {instructor.status === 'approved' && (
              <Button
                variant="outline"
                onClick={() => handleStatusChange('suspended')}
                disabled={isProcessing}
                className="gap-2 text-orange-600 border-orange-600 hover:bg-orange-50"
              >
                <Ban className="h-4 w-4" />
                Suspender
              </Button>
            )}
            {(instructor.status === 'rejected' || instructor.status === 'suspended') && (
              <Button
                onClick={() => handleStatusChange('approved')}
                disabled={isProcessing}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Reativar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
