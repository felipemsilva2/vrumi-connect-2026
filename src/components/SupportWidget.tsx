import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Send, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { supportService, Ticket } from '@/services/supportService';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface SupportWidgetProps {
    user: any;
    profile?: any;
}

export function SupportWidget({ user, profile }: SupportWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'new' | 'list'>('new');
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    // Form State
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [priority, setPriority] = useState<'normal' | 'high' | 'critical'>('normal');

    // Fetch tickets
    const fetchTickets = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await supportService.getTickets(user.id, false);
            setTickets(data);
        } catch (error) {
            console.error("Error fetching tickets:", error);
            toast({
                title: "Erro ao carregar tickets",
                description: "Tente novamente mais tarde.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && activeTab === 'list') {
            fetchTickets();
        }
    }, [isOpen, activeTab, user]);

    // Create Ticket
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject.trim() || !message.trim() || !user) return;

        setLoading(true);
        try {
            const userEmail = user.email || profile?.email || 'Anonymous';
            await supportService.createTicket(user.id, userEmail, subject, message, priority);

            toast({
                title: "Ticket criado com sucesso!",
                description: "Nossa equipe responderá em breve.",
            });

            // Reset form and go to list
            setSubject('');
            setMessage('');
            setPriority('normal');
            setActiveTab('list');
        } catch (error) {
            console.error("Error creating ticket:", error);
            toast({
                title: "Erro ao criar ticket",
                description: "Tente novamente.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // Render Status Badge
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'open': return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 flex items-center gap-1"><AlertCircle size={10} /> Aberto</Badge>;
            case 'in_progress': return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1"><RefreshCw size={10} /> Em Análise</Badge>;
            case 'resolved': return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1"><CheckCircle size={10} /> Resolvido</Badge>;
            default: return null;
        }
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    if (!user) return null; // Don't show if not logged in

    return (
        <div className="fixed bottom-24 md:bottom-6 right-6 z-50 flex flex-col items-end font-sans">

            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-96 max-w-[90vw] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col transition-all duration-300 ease-in-out h-[500px]">

                    {/* Header */}
                    <div className="bg-slate-900 dark:bg-slate-950 p-4 flex items-center justify-between text-white">
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-600 p-1.5 rounded-lg">
                                <MessageSquare size={18} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Suporte Vrumi</h3>
                                <p className="text-xs text-slate-400">Como podemos ajudar?</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                        <button
                            onClick={() => setActiveTab('new')}
                            className={cn(
                                "flex-1 py-3 text-xs font-medium transition-colors border-b-2",
                                activeTab === 'new'
                                    ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900"
                                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            )}
                        >
                            Novo Ticket
                        </button>
                        <button
                            onClick={() => setActiveTab('list')}
                            className={cn(
                                "flex-1 py-3 text-xs font-medium transition-colors border-b-2",
                                activeTab === 'list'
                                    ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900"
                                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            )}
                        >
                            Meus Tickets
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 relative">

                        {/* NEW TICKET TAB */}
                        {activeTab === 'new' && (
                            <div className="p-5">
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Assunto</label>
                                        <Input
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            placeholder="Ex: Dúvida sobre simulado"
                                            className="bg-white dark:bg-slate-800"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Prioridade</label>
                                        <Select value={priority} onValueChange={(val: any) => setPriority(val)}>
                                            <SelectTrigger className="bg-white dark:bg-slate-800">
                                                <SelectValue placeholder="Selecione a prioridade" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="normal">Normal</SelectItem>
                                                <SelectItem value="high">Alta</SelectItem>
                                                <SelectItem value="critical">Crítica</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mensagem</label>
                                        <Textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder="Descreva seu problema ou dúvida..."
                                            className="min-h-[120px] resize-none bg-white dark:bg-slate-800"
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={loading || !subject || !message}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        {loading ? 'Enviando...' : <><Send size={16} className="mr-2" /> Enviar Solicitação</>}
                                    </Button>
                                </form>
                            </div>
                        )}

                        {/* LIST TAB */}
                        {activeTab === 'list' && (
                            <div className="p-4 space-y-3">
                                {loading && tickets.length === 0 ? (
                                    <div className="text-center py-10 text-slate-400">Carregando...</div>
                                ) : tickets.length === 0 ? (
                                    <div className="text-center py-10 text-slate-400">
                                        <MessageSquare size={32} className="mx-auto mb-2 opacity-20" />
                                        <p className="text-sm">Nenhum ticket encontrado.</p>
                                    </div>
                                ) : (
                                    tickets.map((ticket) => (
                                        <div key={ticket.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{ticket.subject}</h4>
                                                {getStatusBadge(ticket.status)}
                                            </div>

                                            <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-2 rounded mb-3 border border-slate-100 dark:border-slate-700">
                                                {ticket.message}
                                            </p>

                                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50 dark:border-slate-700">
                                                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                                    <Clock size={10} /> {formatDate(ticket.created_at)}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-slate-50 dark:bg-slate-900 p-2 text-center border-t border-slate-200 dark:border-slate-800">
                        <p className="text-[10px] text-slate-400">Suporte Vrumi</p>
                    </div>
                </div>
            )}

            {/* Floating Button */}
            <Button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 transform hover:scale-110",
                    isOpen ? "bg-slate-800 rotate-90 hover:bg-slate-900" : "bg-blue-600 hover:bg-blue-700"
                )}
            >
                {isOpen ? <X size={24} className="text-white" /> : <MessageSquare size={24} className="text-white" />}
            </Button>

        </div>
    );
}
