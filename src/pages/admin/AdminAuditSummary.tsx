import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuditLog } from "@/hooks/useAuditLog";

export default function AdminAuditSummary() {
  const now = new Date();
  const [month, setMonth] = useState<string>(String(now.getMonth() + 1));
  const [year, setYear] = useState<string>(String(now.getFullYear()));
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();

  const { data: summary, isLoading } = useQuery({
    queryKey: ["audit-summary", month, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_summaries")
        .select("*")
        .eq("period_month", parseInt(month))
        .eq("period_year", parseInt(year))
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async ({ m, y }: { m: number; y: number }) => {
      const { data: generated, error: genErr } = await supabase.rpc("generate_audit_summary", { p_month: m, p_year: y });
      if (genErr) throw genErr;
      const { error: upErr } = await supabase
        .from("audit_summaries")
        .upsert({ period_month: m, period_year: y, summary: generated });
      if (upErr) throw upErr;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["audit-summary"] });
      await logAction({ actionType: "CREATE", entityType: "audit_summary", newValues: { month, year } });
      toast.success("Resumo gerado");
    },
    onError: () => toast.error("Erro ao gerar resumo"),
  });

  const exportJson = () => {
    if (!summary) return;
    const blob = new Blob([JSON.stringify(summary.summary, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-summary-${year}-${month}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const totals = summary?.summary?.totals;
  const byAction = summary?.summary?.by_action || [];
  const byEntity = summary?.summary?.by_entity || [];
  const topUsers = summary?.summary?.top_users || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Resumo de Auditoria</h1>
            <p className="text-muted-foreground mt-2">Visualize agregados por período e gere resumos</p>
          </div>
          <div className="flex gap-2">
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 6 }, (_, i) => String(now.getFullYear() - i)).map((y) => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => mutation.mutate({ m: parseInt(month), y: parseInt(year) })} disabled={mutation.isLoading}>Gerar Resumo</Button>
            <Button variant="secondary" onClick={exportJson} disabled={!summary}>Exportar JSON</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader><CardTitle>Total de Ações</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold">{totals?.count || 0}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Tipos de Ação</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {byAction.map((a: any) => (
                  <div key={a.action_type} className="flex items-center gap-2">
                    <Badge variant="outline">{a.action_type}</Badge>
                    <div className="flex-1 h-2 bg-muted rounded">
                      <div className="h-2 bg-primary rounded" style={{ width: `${Math.min(100, ((a.count || 0) / (totals?.count || 1)) * 100)}%` }} />
                    </div>
                    <span className="text-sm">{a.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Entidades</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {byEntity.map((e: any) => (
                  <div key={e.entity_type} className="flex items-center gap-2">
                    <Badge variant="outline">{e.entity_type}</Badge>
                    <div className="flex-1 h-2 bg-muted rounded">
                      <div className="h-2 bg-primary rounded" style={{ width: `${Math.min(100, ((e.count || 0) / (totals?.count || 1)) * 100)}%` }} />
                    </div>
                    <span className="text-sm">{e.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Top Usuários</CardTitle></CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Quantidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={2} className="text-center">Carregando...</TableCell></TableRow>
                  ) : topUsers && topUsers.length > 0 ? (
                    topUsers.map((u: any) => (
                      <TableRow key={u.user_id}>
                        <TableCell className="font-mono text-xs">{u.user_id?.substring(0, 8)}...</TableCell>
                        <TableCell>{u.count}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">Nenhum dado</TableCell></TableRow>
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