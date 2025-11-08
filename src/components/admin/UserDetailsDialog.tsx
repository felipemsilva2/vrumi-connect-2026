import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuditLog } from "@/hooks/useAuditLog";

interface UserDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    email: string;
    full_name: string | null;
    created_at: string;
    study_progress: number;
    total_flashcards_studied: number;
    correct_answers: number;
    total_questions_answered: number;
  } | null;
  onUpdate: () => void;
}

export const UserDetailsDialog = ({ open, onOpenChange, user, onUpdate }: UserDetailsDialogProps) => {
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [isLoading, setIsLoading] = useState(false);
  const { logAction } = useAuditLog();

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", user.id);

      if (error) throw error;

      await logAction({
        actionType: "UPDATE",
        entityType: "user",
        entityId: user.id,
        oldValues: { full_name: user.full_name },
        newValues: { full_name: fullName },
      });

      toast.success("Usuário atualizado com sucesso");
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Erro ao atualizar usuário");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  const accuracy = user.total_questions_answered > 0
    ? Math.round((user.correct_answers / user.total_questions_answered) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes do Usuário</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="font-semibold">Informações Básicas</h3>
            
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user.email} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nome do usuário"
                />
              </div>

              <div className="space-y-2">
                <Label>Data de Cadastro</Label>
                <Input
                  value={new Date(user.created_at).toLocaleDateString("pt-BR")}
                  disabled
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Estatísticas de Estudo */}
          <div className="space-y-4">
            <h3 className="font-semibold">Estatísticas de Estudo</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Progresso Geral</p>
                <p className="text-2xl font-bold">{user.study_progress}%</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Flashcards Estudados</p>
                <p className="text-2xl font-bold">{user.total_flashcards_studied}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Questões Respondidas</p>
                <p className="text-2xl font-bold">{user.total_questions_answered}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Taxa de Acerto</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{accuracy}%</p>
                  <Badge variant={accuracy >= 70 ? "default" : "secondary"}>
                    {accuracy >= 70 ? "Excelente" : "Em Progresso"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
