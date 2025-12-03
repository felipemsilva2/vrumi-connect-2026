import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supportService, Ticket } from "@/services/supportService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { CheckCircle, RefreshCw, AlertCircle } from "lucide-react";

export default function AdminSupport() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const data = await supportService.getTickets(undefined, true);
            setTickets(data);
        } catch (error) {
            console.error("Error fetching tickets:", error);
            toast.error("Erro ao carregar tickets");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const handleStatusChange = async (ticketId: string, newStatus: 'open' | 'in_progress' | 'resolved') => {
        try {
            await supportService.updateTicketStatus(ticketId, newStatus);
            toast.success(`Ticket marcado como ${newStatus === 'resolved' ? 'Resolvido' : 'Em Análise'}`);
            fetchTickets();
        } catch (error) {
            toast.error("Erro ao atualizar status");
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'open': return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 flex items-center gap-1"><AlertCircle size={12} /> Aberto</Badge>;
            case 'in_progress': return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1"><RefreshCw size={12} /> Em Análise</Badge>;
            case 'resolved': return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1"><CheckCircle size={12} /> Resolvido</Badge>;
            default: return null;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold">Suporte</h2>
                    <p className="text-muted-foreground">Gerencie os tickets de suporte dos usuários.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Tickets Recentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-4">Carregando...</div>
                        ) : tickets.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">Nenhum ticket encontrado.</div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Assunto</TableHead>
                                        <TableHead>Usuário</TableHead>
                                        <TableHead>Prioridade</TableHead>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tickets.map((ticket) => (
                                        <TableRow key={ticket.id}>
                                            <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                                            <TableCell>
                                                <div className="font-medium">{ticket.subject}</div>
                                                <div className="text-xs text-muted-foreground truncate max-w-[300px]">{ticket.message}</div>
                                            </TableCell>
                                            <TableCell className="text-xs">{ticket.user_email}</TableCell>
                                            <TableCell>
                                                <Badge variant={ticket.priority === 'critical' ? 'destructive' : ticket.priority === 'high' ? 'default' : 'secondary'}>
                                                    {ticket.priority}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {formatDate(ticket.created_at)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    {ticket.status !== 'resolved' && (
                                                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleStatusChange(ticket.id, 'resolved')}>
                                                            Resolver
                                                        </Button>
                                                    )}
                                                    {ticket.status === 'open' && (
                                                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleStatusChange(ticket.id, 'in_progress')}>
                                                            Atender
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
