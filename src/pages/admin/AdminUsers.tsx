import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { UserDetailsDialog } from "@/components/admin/UserDetailsDialog";
import { CreatePassDialog } from "@/components/admin/CreatePassDialog";
import { PaginationControls } from "@/components/admin/PaginationControls";
import { Search, Eye, Plus, RefreshCw, Shield, GraduationCap, Bell, Send, Users, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  role: 'admin' | 'user' | 'dpo';
}

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createPassDialogOpen, setCreatePassDialogOpen] = useState(false);
  const [selectedUserEmail, setSelectedUserEmail] = useState("");

  // Bulk Actions State
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkNotificationOpen, setBulkNotificationOpen] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [isSendingBulk, setIsSendingBulk] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Get total count for pagination
      let countQuery = supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      if (debouncedSearch) {
        countQuery = countQuery.or(`email.ilike.%${debouncedSearch}%,full_name.ilike.%${debouncedSearch}%`);
      }

      const { count, error: countError } = await countQuery;

      if (countError) throw countError;
      setTotalItems(count || 0);

      // 2. Get paginated data
      let query = supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      if (debouncedSearch) {
        query = query.or(`email.ilike.%${debouncedSearch}%,full_name.ilike.%${debouncedSearch}%`);
      }

      const { data: profilesData, error: profilesError } = await query;

      if (profilesError) throw profilesError;

      // 3. Fetch active passes and roles for visible users
      const usersWithDetails = await Promise.all(
        (profilesData || []).map(async (profile) => {
          // Check active pass
          const { data: activePass } = await supabase
            .from("user_passes")
            .select("id")
            .eq("user_id", profile.id)
            .eq("payment_status", "completed")
            .gt("expires_at", new Date().toISOString())
            .maybeSingle();

          // Check role
          const { data: rolesData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.id);

          const roles = rolesData?.map(r => r.role) || [];
          const role = (roles.includes('admin') ? 'admin' : roles.includes('dpo') ? 'dpo' : 'user') as 'admin' | 'user' | 'dpo';

          return {
            ...profile,
            email: profile.email || "N/A",
            has_active_pass: !!activePass,
            role: role
          };
        })
      );

      setUsers(usersWithDetails);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const handleAddSubscription = (user: User) => {
    setSelectedUserEmail(user.email);
    setCreatePassDialogOpen(true);
  };

  // Helpers for selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(users.map(u => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectOne = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSendBulkNotification = async () => {
    if (selectedUsers.length === 0) return;
    if (!notificationTitle || !notificationMessage) {
      toast.error("Preencha título e mensagem");
      return;
    }

    setIsSendingBulk(true);
    try {
      const { error } = await supabase.functions.invoke('admin-send-notification', {
        body: {
          user_ids: selectedUsers,
          title: notificationTitle,
          message: notificationMessage,
          type: 'info'
        }
      });

      if (error) throw error;
      toast.success(`Notificação enviada para ${selectedUsers.length} usuários!`);
      setBulkNotificationOpen(false);
      setNotificationTitle("");
      setNotificationMessage("");
      setSelectedUsers([]);
    } catch (error: any) {
      console.error("Error sending bulk notification:", error);
      toast.error(error.message || "Erro ao enviar notificações");
    } finally {
      setIsSendingBulk(false);
    }
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold">Gerenciar Usuários</h2>
            <p className="text-muted-foreground">
              Gerencie contas, assinaturas e permissões
            </p>
          </div>
          <Button onClick={fetchUsers} variant="outline" size="sm" className="w-fit">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Busca e Filtros */}
        <div className="flex items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
          <div className="relative flex-1 max-w-md">
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
        <div className="border rounded-lg bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={users.length > 0 && selectedUsers.length === users.length}
                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progresso</TableHead>
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
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className={selectedUsers.includes(user.id) ? "bg-muted/50" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={(checked) => handleSelectOne(user.id, checked as boolean)}
                        aria-label={`Select ${user.email}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.full_name || "Sem nome"}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? "destructive" : "outline"} className="gap-1">
                        {user.role === 'admin' ? <Shield className="h-3 w-3" /> : <GraduationCap className="h-3 w-3" />}
                        {user.role === 'admin' ? 'Admin' : 'Aluno'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.has_active_pass ? "default" : "secondary"}>
                        {user.has_active_pass ? "Premium" : "Grátis"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${user.study_progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{user.study_progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleAddSubscription(user)}
                          title="Adicionar Assinatura"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetails(user)}
                          title="Ver Detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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

      {/* Bulk Actions Floating Bar */}
      {selectedUsers.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-foreground text-background px-6 py-3 rounded-full shadow-lg flex items-center gap-4 z-50">
          <div className="flex items-center gap-2 font-medium">
            <Users className="h-4 w-4" />
            {selectedUsers.length} selecionados
          </div>
          <div className="h-4 w-px bg-background/20" />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setBulkNotificationOpen(true)}
            className="gap-2"
          >
            <Bell className="h-4 w-4" />
            Enviar Notificação
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedUsers([])} className="ml-2 hover:bg-background/10 h-8 w-8 p-0 rounded-full">
            ✕
          </Button>
        </div>
      )}

      {/* Bulk Notification Dialog */}
      <Dialog open={bulkNotificationOpen} onOpenChange={setBulkNotificationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Notificação em Massa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted p-3 rounded-md text-sm text-muted-foreground">
              Enviando para <b>{selectedUsers.length} usuários</b> selecionados.
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
                placeholder="Digite sua mensagem global aqui..."
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

export default AdminUsers;
