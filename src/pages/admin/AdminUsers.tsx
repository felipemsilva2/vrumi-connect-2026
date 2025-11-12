import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserDetailsDialog } from "@/components/admin/UserDetailsDialog";
import { CreatePassDialog } from "@/components/admin/CreatePassDialog";
import { Search, Eye, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  study_progress: number;
  total_flashcards_studied: number;
  correct_answers: number;
  total_questions_answered: number;
  has_active_pass: boolean;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createPassDialogOpen, setCreatePassDialogOpen] = useState(false);
  const [selectedUserEmail, setSelectedUserEmail] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(
        (user) =>
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      // Buscar profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Buscar emails do auth.users
      const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();

      // Buscar passes ativos para cada usuário
      const usersWithActivePass = await Promise.all(
        (profilesData || []).map(async (profile) => {
          const authUser = authUsers?.find((u: any) => u.id === profile.id);
          
          const { data: activePass } = await supabase
            .from("user_passes")
            .select("id")
            .eq("user_id", profile.id)
            .eq("payment_status", "completed")
            .gt("expires_at", new Date().toISOString())
            .maybeSingle();

          return {
            ...profile,
            email: authUser?.email || "N/A",
            has_active_pass: !!activePass,
          };
        })
      );

      setUsers(usersWithActivePass);
      setFilteredUsers(usersWithActivePass);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const handleAddSubscription = (user: User) => {
    setSelectedUserEmail(user.email);
    setCreatePassDialogOpen(true);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">Gerenciar Usuários</h2>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Gerenciar Usuários</h2>
            <p className="text-muted-foreground">
              {filteredUsers.length} usuário(s) cadastrado(s)
            </p>
          </div>
        </div>

        {/* Busca */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por email ou nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Tabela de Usuários */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Data de Cadastro</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.full_name || "-"}</TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.has_active_pass ? "default" : "secondary"}>
                      {user.has_active_pass ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.study_progress}%</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddSubscription(user)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Assinatura
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(user)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Detalhes
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <UserDetailsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={selectedUser}
        onUpdate={fetchUsers}
      />

      <CreatePassDialog
        open={createPassDialogOpen}
        onOpenChange={setCreatePassDialogOpen}
        onSuccess={fetchUsers}
        prefilledEmail={selectedUserEmail}
      />
    </AdminLayout>
  );
};

export default AdminUsers;
