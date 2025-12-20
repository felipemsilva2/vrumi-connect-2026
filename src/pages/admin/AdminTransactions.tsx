import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, RefreshCw, DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Transaction {
    id: string;
    instructor_id: string;
    booking_id: string | null;
    amount: number;
    type: 'earning' | 'refund' | 'payout';
    status: 'pending' | 'completed' | 'failed';
    description: string | null;
    created_at: string;
    instructor?: { full_name: string };
}

const typeConfig = {
    earning: { label: "Receita", variant: "default" as const, icon: TrendingUp, color: "text-green-600" },
    refund: { label: "Reembolso", variant: "destructive" as const, icon: TrendingDown, color: "text-red-600" },
    payout: { label: "Repasse", variant: "secondary" as const, icon: ArrowUpRight, color: "text-blue-600" },
};

const AdminTransactions = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("all");

    // Stats
    const [stats, setStats] = useState({
        totalEarnings: 0,
        totalRefunds: 0,
        platformFees: 0,
        netRevenue: 0,
    });

    const fetchTransactions = useCallback(async () => {
        if (!isSupabaseConfigured || !navigator.onLine) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);

            const { data, error } = await supabase
                .from("transactions")
                .select(`
          *,
          instructor:instructors!transactions_instructor_id_fkey(full_name)
        `)
                .order("created_at", { ascending: false })
                .limit(200);

            if (error) throw error;

            setTransactions(data || []);
            setFilteredTransactions(data || []);

            // Calculate stats
            const earnings = (data || [])
                .filter(t => t.type === 'earning' && t.status === 'completed')
                .reduce((sum, t) => sum + Number(t.amount), 0);

            const refunds = Math.abs((data || [])
                .filter(t => t.type === 'refund')
                .reduce((sum, t) => sum + Number(t.amount), 0));

            // Platform gets 15%, instructors get 85%
            const grossRevenue = earnings / 0.85;
            const platformFees = grossRevenue - earnings;

            setStats({
                totalEarnings: earnings,
                totalRefunds: refunds,
                platformFees: platformFees,
                netRevenue: platformFees - (refunds * 0.15), // Platform portion of refunds
            });

        } catch (error) {
            console.error("Error fetching transactions:", error);
            toast.error("Erro ao carregar transações");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    useEffect(() => {
        let filtered = transactions;

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(tx =>
                tx.instructor?.full_name?.toLowerCase().includes(term) ||
                tx.description?.toLowerCase().includes(term) ||
                tx.id.toLowerCase().includes(term)
            );
        }

        // Type filter
        if (typeFilter !== "all") {
            filtered = filtered.filter(tx => tx.type === typeFilter);
        }

        setFilteredTransactions(filtered);
    }, [transactions, searchTerm, typeFilter]);

    const formatDate = (dateStr: string) => {
        try {
            return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: ptBR });
        } catch {
            return dateStr;
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold">Transações</h2>
                        <p className="text-muted-foreground">Histórico financeiro do Connect</p>
                    </div>
                    <Button onClick={fetchTransactions} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Atualizar
                    </Button>
                </div>

                {/* Financial Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                Receita Instrutores
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-green-600">
                                R$ {stats.totalEarnings.toFixed(2)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-blue-600" />
                                Taxa Plataforma (15%)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-blue-600">
                                R$ {stats.platformFees.toFixed(2)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <TrendingDown className="h-4 w-4 text-red-600" />
                                Reembolsos
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-red-600">
                                R$ {stats.totalRefunds.toFixed(2)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <ArrowUpRight className="h-4 w-4 text-primary" />
                                Receita Líquida Plataforma
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-primary">
                                R$ {stats.netRevenue.toFixed(2)}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por instrutor ou descrição..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Tipos</SelectItem>
                            <SelectItem value="earning">Receita</SelectItem>
                            <SelectItem value="refund">Reembolso</SelectItem>
                            <SelectItem value="payout">Repasse</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Instrutor</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead className="text-right">Valor</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        Carregando...
                                    </TableCell>
                                </TableRow>
                            ) : filteredTransactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        Nenhuma transação encontrada
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTransactions.map((tx) => {
                                    const config = typeConfig[tx.type] || typeConfig.earning;
                                    const Icon = config.icon;

                                    return (
                                        <TableRow key={tx.id}>
                                            <TableCell>
                                                <span className="text-sm">{formatDate(tx.created_at)}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium">{tx.instructor?.full_name || 'N/A'}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-muted-foreground">
                                                    {tx.description || 'Sem descrição'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Icon className={`h-4 w-4 ${config.color}`} />
                                                    <Badge variant={config.variant}>
                                                        {config.label}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className={`font-bold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {tx.amount >= 0 ? '+' : ''}R$ {Number(tx.amount).toFixed(2)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'}>
                                                    {tx.status === 'completed' ? 'Concluído' : tx.status === 'pending' ? 'Pendente' : 'Falhou'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminTransactions;
