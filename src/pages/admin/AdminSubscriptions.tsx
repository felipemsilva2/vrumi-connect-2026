import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreatePassDialog } from "@/components/admin/CreatePassDialog";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

      // Buscar emails dos usuários
      const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();

      const subscriptionsWithEmails = (passesData || []).map((pass) => {
        const user = authUsers?.find((u: any) => u.id === pass.user_id);
        return {
          ...pass,
          user_email: user?.email || "N/A",
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
    return type === "30_days" ? "30 Dias" : "90 Dias";
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
    </AdminLayout>
  );
};

export default AdminSubscriptions;
