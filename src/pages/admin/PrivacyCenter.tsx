import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useAuditLog } from "@/hooks/useAuditLog";

type DsrType = "access" | "rectification" | "deletion" | "portability";
type DsrStatus = "pending" | "approved" | "rejected" | "completed";

export default function PrivacyCenter() {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();

  const { data: { user } = { user: undefined } } = ({} as any);

  const { data: requests, isLoading } = useQuery({
    queryKey: ["data-subject-requests", filterType, filterStatus, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("data_subject_requests")
        .select("*")
        .order("requested_at", { ascending: false })
        .limit(100);

      if (filterType !== "all") {
        query = query.eq("type", filterType);
      }

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = async (id: string, status: DsrStatus) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("data_subject_requests")
      .update({ status, handled_by: user?.id || null, resolved_at: status === "completed" ? new Date().toISOString() : null })
      .eq("id", id);
    if (error) throw error;
  };

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: DsrStatus }) => updateStatus(id, status),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["data-subject-requests"] });
      await logAction({
        actionType: "UPDATE",
        entityType: "data_subject_request",
        entityId: variables.id,
        newValues: { status: variables.status },
      });
      toast.success("Status atualizado");
    },
    onError: () => toast.error("Erro ao atualizar status"),
  });

  const filteredRequests = requests?.filter((r) => {
    if (!searchTerm) return true;
    return (
      r.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.user_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Privacy Center</h1>
          <p className="text-muted-foreground mt-2">Gerencie requisições de titulares (LGPD)</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="access">Acesso</SelectItem>
                    <SelectItem value="rectification">Retificação</SelectItem>
                    <SelectItem value="deletion">Exclusão</SelectItem>
                    <SelectItem value="portability">Portabilidade</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="rejected">Rejeitado</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar</label>
                <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Requisições ({filteredRequests?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">Carregando...</TableCell>
                    </TableRow>
                  ) : filteredRequests && filteredRequests.length > 0 ? (
                    filteredRequests.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{format(new Date(r.requested_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{r.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={r.status === "pending" ? "secondary" : r.status === "rejected" ? "destructive" : "default"}>{r.status}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{r.user_id?.substring(0, 8)}...</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="secondary" size="sm" onClick={() => mutation.mutate({ id: r.id, status: "approved" })}>Aprovar</Button>
                            <Button variant="destructive" size="sm" onClick={() => mutation.mutate({ id: r.id, status: "rejected" })}>Rejeitar</Button>
                            <Button variant="default" size="sm" onClick={() => mutation.mutate({ id: r.id, status: "completed" })}>Concluir</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">Nenhuma requisição encontrada</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}