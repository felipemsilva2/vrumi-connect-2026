import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Shield, GraduationCap, CreditCard, Calendar } from "lucide-react";

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
    has_active_pass: boolean;
    role: 'admin' | 'user' | 'dpo';
  } | null;
  onUpdate: () => void;
}

export const UserDetailsDialog = ({ open, onOpenChange, user, onUpdate }: UserDetailsDialogProps) => {
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<'admin' | 'user' | 'dpo'>('user');
  const [isLoading, setIsLoading] = useState(false);
  const [activePassDetails, setActivePassDetails] = useState<any>(null);
  const { logAction } = useAuditLog();

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setRole(user.role);
      fetchSubscriptionDetails();
    }
  }, [user]);

  const fetchSubscriptionDetails = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_passes")
      .select("*")
      .eq("user_id", user.id)
      .eq("payment_status", "completed")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    setActivePassDetails(data);
  };

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Update role (assuming user_roles table or similar mechanism)
      // First remove existing roles to ensure single role per user in this context
      const { error: deleteRoleError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", user.id);

      if (deleteRoleError) throw deleteRoleError;

      // Insert new role if not 'user' (assuming 'user' means no specific role record)
      if (role !== 'user') {
        const { error: insertRoleError } = await supabase
          .from("user_roles")
          .insert({ user_id: user.id, role: role });

        if (insertRoleError) throw insertRoleError;
      }

      await logAction({
        actionType: "UPDATE",
        entityType: "user",
        entityId: user.id,
        oldValues: { full_name: user.full_name, role: user.role },
        newValues: { full_name: fullName, role: role },
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Usuário</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Informações da Conta
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user.email} disabled className="bg-muted" />
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
                <Label>Função (Role)</Label>
                <Select value={role} onValueChange={(value: 'admin' | 'user' | 'dpo') => setRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Aluno (User)</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="dpo">DPO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data de Cadastro</Label>
                <div className="flex items-center h-10 px-3 rounded-md border bg-muted text-sm text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4" />
                  {new Date(user.created_at).toLocaleDateString("pt-BR")}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Assinatura */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Assinatura e Plano
            </h3>

            {activePassDetails ? (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-primary">Plano Ativo</span>
                  <Badge variant="default">Premium</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block">Tipo de Passe</span>
                    <span className="font-medium capitalize">{activePassDetails.pass_type?.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Expira em</span>
                    <span className="font-medium">{new Date(activePassDetails.expires_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-muted/50 border rounded-lg p-4 flex items-center justify-between">
                <span className="text-muted-foreground">Nenhum plano ativo</span>
                <Badge variant="secondary">Grátis</Badge>
              </div>
            )}
          </div>

          <Separator />

          {/* Estatísticas de Estudo */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              Estatísticas de Estudo
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1 bg-card p-3 rounded-lg border">
                <p className="text-xs text-muted-foreground">Progresso</p>
                <p className="text-xl font-bold">{user.study_progress}%</p>
              </div>

              <div className="space-y-1 bg-card p-3 rounded-lg border">
                <p className="text-xs text-muted-foreground">Flashcards</p>
                <p className="text-xl font-bold">{user.total_flashcards_studied}</p>
              </div>

              <div className="space-y-1 bg-card p-3 rounded-lg border">
                <p className="text-xs text-muted-foreground">Questões</p>
                <p className="text-xl font-bold">{user.total_questions_answered}</p>
              </div>

              <div className="space-y-1 bg-card p-3 rounded-lg border">
                <p className="text-xs text-muted-foreground">Precisão</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold">{accuracy}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
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
