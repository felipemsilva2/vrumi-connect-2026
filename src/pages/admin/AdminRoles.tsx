import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuditLog } from "@/hooks/useAuditLog";
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

interface UserRole {
  user_id: string;
  user_email: string;
  roles: string[];
  created_at: string;
}

const AdminRoles = () => {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alertOpen, setAlertOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ userId: string; action: "add" | "remove" } | null>(null);
  const { logAction } = useAuditLog();

  useEffect(() => {
    fetchUserRoles();
  }, []);

  const fetchUserRoles = async () => {
    try {
      // Buscar todos os roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });

      if (rolesError) throw rolesError;

      // Buscar emails dos usuários
      const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();

      // Agrupar roles por usuário
      const userRolesMap = new Map<string, UserRole>();

      rolesData?.forEach((role) => {
        const user = authUsers?.find((u: any) => u.id === role.user_id);
        const userEmail = user?.email || "N/A";

        if (userRolesMap.has(role.user_id)) {
          const existing = userRolesMap.get(role.user_id)!;
          existing.roles.push(role.role);
        } else {
          userRolesMap.set(role.user_id, {
            user_id: role.user_id,
            user_email: userEmail,
            roles: [role.role],
            created_at: role.created_at,
          });
        }
      });

      setUserRoles(Array.from(userRolesMap.values()));
    } catch (error) {
      console.error("Error fetching user roles:", error);
      toast.error("Erro ao carregar roles");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    setSelectedUser({ userId, action: isCurrentlyAdmin ? "remove" : "add" });
    setAlertOpen(true);
  };

  const confirmToggleAdmin = async () => {
    if (!selectedUser) return;

    try {
      if (selectedUser.action === "add") {
        // Adicionar role de admin
        const { data, error } = await supabase
          .from("user_roles")
          .insert({ user_id: selectedUser.userId, role: "admin" })
          .select()
          .single();

        if (error) throw error;

        await logAction({
          actionType: "CREATE",
          entityType: "role",
          entityId: data.id,
          newValues: { user_id: selectedUser.userId, role: "admin" },
        });

        toast.success("Usuário promovido a admin com sucesso");
      } else {
        // Remover role de admin
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", selectedUser.userId)
          .eq("role", "admin");

        if (error) throw error;

        await logAction({
          actionType: "DELETE",
          entityType: "role",
          entityId: selectedUser.userId,
          oldValues: { user_id: selectedUser.userId, role: "admin" },
        });

        toast.success("Permissões de admin removidas com sucesso");
      }

      await fetchUserRoles();
    } catch (error) {
      console.error("Error toggling admin role:", error);
      toast.error("Erro ao alterar permissões");
    } finally {
      setAlertOpen(false);
      setSelectedUser(null);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">Gerenciar Permissões</h2>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Gerenciar Permissões</h2>
          <p className="text-muted-foreground">
            Controle quem tem acesso administrativo ao sistema
          </p>
        </div>

        {/* Tabela de Roles */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userRoles.map((userRole) => {
                const isAdmin = userRole.roles.includes("admin");
                
                return (
                  <TableRow key={userRole.user_id}>
                    <TableCell className="font-medium">{userRole.user_email}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {userRole.roles.map((role) => (
                          <Badge
                            key={role}
                            variant={role === "admin" ? "default" : "secondary"}
                          >
                            {role === "admin" ? "Admin" : "Usuário"}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(userRole.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant={isAdmin ? "destructive" : "default"}
                        size="sm"
                        onClick={() => handleToggleAdmin(userRole.user_id, isAdmin)}
                      >
                        {isAdmin ? (
                          <>
                            <ShieldOff className="h-4 w-4 mr-2" />
                            Remover Admin
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4 mr-2" />
                            Tornar Admin
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteração de permissões</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser?.action === "add"
                ? "Tem certeza que deseja promover este usuário a administrador? Ele terá acesso total ao sistema."
                : "Tem certeza que deseja remover as permissões de administrador deste usuário?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggleAdmin}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminRoles;
