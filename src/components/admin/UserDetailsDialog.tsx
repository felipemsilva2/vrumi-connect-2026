import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Shield, GraduationCap, CreditCard, Calendar, Trash2, Clock, AlertTriangle, Ban, Bell, Send, Loader2 } from "lucide-react";
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
  const [removePassAlertOpen, setRemovePassAlertOpen] = useState(false);

  // Extension state
  const [daysToAdd, setDaysToAdd] = useState(30);
  const [extensionReason, setExtensionReason] = useState("");
  const [isExtending, setIsExtending] = useState(false);

  // Blocking state
  const [blockAlertOpen, setBlockAlertOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [isBlocking, setIsBlocking] = useState(false);

  // Notification state
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [isSendingNotification, setIsSendingNotification] = useState(false);

  const { logAction } = useAuditLog();

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setRole(user.role);
      fetchSubscriptionDetails();
      // Reset extension form
      setDaysToAdd(30);
      setExtensionReason("");
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

  const handleRemoveSubscription = async () => {
    if (!activePassDetails || !user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_passes")
        .update({ payment_status: 'cancelled' })
        .eq("id", activePassDetails.id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error("Não foi possível atualizar a assinatura. Verifique permissões.");
      }

      await logAction({
        actionType: "CANCEL_SUBSCRIPTION",
        entityType: "subscription",
        entityId: activePassDetails.id,
        oldValues: {
          payment_status: activePassDetails.payment_status
        },
        newValues: {
          payment_status: 'cancelled'
        },
      });

      toast.success("Assinatura cancelada com sucesso");
      setActivePassDetails(null);
      onUpdate();
    } catch (error: any) {
      console.error("Error removing subscription:", error);
      toast.error(error.message || "Erro ao remover assinatura");
    } finally {
      setIsLoading(false);
      setRemovePassAlertOpen(false);
    }
  };

  const handleExtendSubscription = async () => {
    if (!activePassDetails || !user) {
      toast.error("Usuário não possui assinatura ativa para estender");
      return;
    }

    if (daysToAdd <= 0) {
      toast.error("Quantidade de dias inválida");
      return;
    }

    setIsExtending(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-extend-subscription', {
        body: {
          subscription_id: activePassDetails.id,
          days_to_add: daysToAdd,
          reason: extensionReason
        }
      });

      if (error) throw error;

      toast.success(`Assinatura estendida por ${daysToAdd} dias!`);
      // Update local state details to reflect the change immediately if possible, or usually just fetch again
      await fetchSubscriptionDetails();
      onUpdate(); // Update parent list

      // Cleanup
      setExtensionReason("");
      setDaysToAdd(30);
    } catch (error: any) {
      console.error("Error extending subscription:", error);
      toast.error(error.message || "Erro ao estender assinatura");
    } finally {
      setIsExtending(false);
    }
  };

  const handleBlockUser = async () => {
    if (!user) return;
    setIsBlocking(true);
    try {
      const { error } = await supabase.functions.invoke('admin-block-user', {
        body: {
          user_id: user.id,
          action: 'block',
          reason: blockReason
        }
      });

      if (error) throw error;
      toast.success("Usuário bloqueado com sucesso!");
      setBlockAlertOpen(false);
      onUpdate();
    } catch (error: any) {
      console.error("Error blocking user:", error);
      toast.error(error.message || "Erro ao bloquear usuário");
    } finally {
      setIsBlocking(false);
      setBlockReason("");
    }
  };

  const handleSendNotification = async () => {
    if (!user || !notificationTitle || !notificationMessage) {
      toast.error("Preencha título e mensagem");
      return;
    }

    setIsSendingNotification(true);
    try {
      const { error } = await supabase.functions.invoke('admin-send-notification', {
        body: {
          user_ids: [user.id],
          title: notificationTitle,
          message: notificationMessage,
          type: 'info'
        }
      });

      if (error) throw error;
      toast.success("Notificação enviada!");
      setNotificationDialogOpen(false);
      setNotificationTitle("");
      setNotificationMessage("");
    } catch (error: any) {
      console.error("Error sending notification:", error);
      toast.error(error.message || "Erro ao enviar notificação");
    } finally {
      setIsSendingNotification(false);
    }
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

      // Update role
      const { error: deleteRoleError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", user.id);

      if (deleteRoleError) throw deleteRoleError;

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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Usuário</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Detalhes & Perfil</TabsTrigger>
              <TabsTrigger value="actions">Ações Administrativas</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6 py-4">
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
            </TabsContent>

            <TabsContent value="actions" className="space-y-6 py-4">
              {/* Assinatura */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Gestão de Assinatura
                  </h3>
                  {activePassDetails && (
                    <Badge variant="default">Premium Ativo</Badge>
                  )}
                </div>

                {!activePassDetails ? (
                  <div className="bg-muted/50 border rounded-lg p-6 text-center space-y-2">
                    <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto" />
                    <p className="font-medium">O usuário não possui assinatura ativa</p>
                    <p className="text-sm text-muted-foreground">Adicione uma assinatura pela tela principal de usuários.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-card border rounded-lg p-4 grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Plano Atual</span>
                        <p className="font-medium capitalize">{activePassDetails.pass_type?.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Expira em</span>
                        <p className="font-medium">{new Date(activePassDetails.expires_at).toLocaleDateString("pt-BR")}</p>
                      </div>
                    </div>

                    <div className="space-y-4 border rounded-lg p-4 bg-primary/5">
                      <h4 className="font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Estender Assinatura
                      </h4>
                      <p className="text-sm text-muted-foreground">Adicione dias extras ao plano do aluno (compensações, bônus, etc).</p>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Dias a adicionar</Label>
                          <Input
                            type="number"
                            min="1"
                            value={daysToAdd}
                            onChange={(e) => setDaysToAdd(parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Motivo (Log)</Label>
                          <Input
                            placeholder="Ex: Problema técnico"
                            value={extensionReason}
                            onChange={(e) => setExtensionReason(e.target.value)}
                          />
                        </div>
                      </div>
                      <Button onClick={handleExtendSubscription} disabled={isExtending} className="w-full">
                        {isExtending ? "Processando..." : `Adicionar ${daysToAdd} dias`}
                      </Button>
                    </div>

                    <div className="pt-4 border-t">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setRemovePassAlertOpen(true)}
                        className="w-full"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Cancelar Assinatura Imediatamente
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Bloqueio e Notificações */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Segurança e Comunicação
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* Bloco de Bloqueio */}
                  <div className="border rounded-lg p-4 bg-destructive/5 space-y-3">
                    <h4 className="font-medium text-destructive flex items-center gap-2">
                      <Ban className="h-4 w-4" />
                      Bloquear Acesso
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Impede o usuário de fazer login no sistema. Ação reversível.
                    </p>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => setBlockAlertOpen(true)}
                    >
                      Bloquear Usuário
                    </Button>
                  </div>

                  {/* Bloco de Notificação */}
                  <div className="border rounded-lg p-4 bg-secondary/20 space-y-3">
                    <h4 className="font-medium text-primary flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Enviar Notificação
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Envia uma mensagem direta para a caixa de entrada do usuário.
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setNotificationDialogOpen(true)}
                    >
                      Escrever Mensagem
                    </Button>
                  </div>
                </div>
              </div>

            </TabsContent>

          </Tabs>

          <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert for Blocking */}
      <AlertDialog open={blockAlertOpen} onOpenChange={setBlockAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bloquear Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja bloquear o acesso de <b>{user.email}</b>?
              <br /><br />
              O usuário será desconectado e não poderá entrar novamente até ser desbloqueado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label>Motivo do Bloqueio</Label>
            <Input
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Ex: Compartilhamento de conta..."
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlockUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isBlocking}
            >
              {isBlocking ? "Bloqueando..." : "Confirmar Bloqueio"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog for Notification */}
      <Dialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Notificação Individual</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
                placeholder="Digite sua mensagem aqui..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotificationDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSendNotification} disabled={isSendingNotification}>
              {isSendingNotification ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={removePassAlertOpen} onOpenChange={setRemovePassAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Assinatura</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a assinatura deste usuário? O acesso será revogado imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveSubscription} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

