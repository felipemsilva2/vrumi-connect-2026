import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreatePassDialog } from "@/components/admin/CreatePassDialog";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

interface Subscription {
  id: string;
  user_id: string;
  user_email: string;
  pass_type: string;
  price: number;
  purchased_at: string;
  expires_at: string;
  payment_status: string;
}

const AdminSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passToDelete, setPassToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const { data: passesData, error: passesError } = await supabase
        .from("user_passes")
        .select("*")
        .order("purchased_at", { ascending: false });

      if (passesError) throw passesError;

      // Buscar emails dos usuários na tabela profiles
      const userIds = (passesData || []).map(p => p.user_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", userIds);

      const subscriptionsWithEmails = (passesData || []).map((pass) => {
        const profile = profilesData?.find((p) => p.id === pass.user_id);
        // Se não tiver email no profile (antigos), tenta usar o full_name ou fallback
        const displayEmail = profile?.email || profile?.full_name || "Usuário não encontrado";

        return {
          ...pass,
          user_email: displayEmail,
        };
      });

      setSubscriptions(subscriptionsWithEmails);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      toast.error("Erro ao carregar assinaturas");
    } finally {
      setIsLoading(false);
    }
  };

  const isActive = (expiresAt: string) => {
    return new Date(expiresAt) > new Date();
  };

  const formatPassType = (type: string) => {
    if (type === "30_days" || type === "individual_30_days") return "30 Dias";
    if (type === "90_days" || type === "individual_90_days") return "90 Dias";
    if (type === "family_90_days") return "Família 90 Dias";
    return type;
  };

  const handleDeletePass = async () => {
    if (!passToDelete) return;

    try {
      const { error } = await supabase.functions.invoke('delete-subscription', {
        body: { subscription_id: passToDelete }
      });

      if (error) throw error;

      toast.success("Assinatura removida com sucesso");
      fetchSubscriptions();
    } catch (error) {
      console.error("Error deleting pass:", error);
      toast.error(`Erro ao remover assinatura: ${error.message || "Erro desconhecido"}`);
    } finally {
      setDeleteDialogOpen(false);
      setPassToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">Gerenciar Assinaturas</h2>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </AdminLayout>
    );
  }

  const totalRevenue = subscriptions
    .filter((s) => s.payment_status === "completed")
    .reduce((sum, s) => sum + Number(s.price), 0);

  const activeSubscriptions = subscriptions.filter(
    (s) => s.payment_status === "completed" && isActive(s.expires_at)
  ).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Gerenciar Assinaturas</h2>
            <p className="text-muted-foreground">
              {subscriptions.length} assinatura(s) total | {activeSubscriptions} ativa(s) | R${" "}
              {totalRevenue.toFixed(2)} em receita
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Assinatura
          </Button>
        </div>

        {/* Tabela de Assinaturas */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Data de Compra</TableHead>
                <TableHead>Expira em</TableHead>
                <TableHead>Status Pagamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">{sub.user_email}</TableCell>
                  <TableCell>{formatPassType(sub.pass_type)}</TableCell>
                  <TableCell>
                    {Number(sub.price) === 0 ? (
                      <Badge variant="secondary">Cortesia</Badge>
                    ) : (
                      `R$ ${Number(sub.price).toFixed(2)}`
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(sub.purchased_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    {new Date(sub.expires_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        sub.payment_status === "completed" ? "default" : "secondary"
                      }
                    >
                      {sub.payment_status === "completed" ? "Completo" : "Pendente"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        isActive(sub.expires_at) && sub.payment_status === "completed"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {isActive(sub.expires_at) && sub.payment_status === "completed"
                        ? "Ativo"
                        : "Expirado"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPassToDelete(sub.id);
                        setDeleteDialogOpen(true);
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <CreatePassDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchSubscriptions}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta assinatura? Esta ação não pode ser desfeita e o usuário perderá o acesso imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePass}
              className="bg-red-600 hover:bg-red-700"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminSubscriptions;
