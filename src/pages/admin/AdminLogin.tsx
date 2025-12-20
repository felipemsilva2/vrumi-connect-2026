import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Navigate } from "react-router-dom";

const AdminLogin = () => {
    const navigate = useNavigate();
    const { user, isAdmin, isLoading } = useAdminAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);

    console.log('[AdminLogin] Estado:', { user: user?.email, isAdmin, isLoading });

    // Se está carregando, mostra loader
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Se já está logado e é admin, redireciona
    if (user && isAdmin) {
        console.log('[AdminLogin] Usuário é admin, redirecionando para /painel');
        return <Navigate to="/painel" replace />;
    }

    // Se está logado mas não é admin, mostra mensagem
    if (user && !isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center text-destructive">
                            Acesso Negado
                        </CardTitle>
                        <CardDescription className="text-center">
                            Sua conta não tem permissão de administrador.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-muted rounded-md text-xs font-mono text-center">
                            <p>{user.email}</p>
                        </div>
                        <Button 
                            className="w-full" 
                            variant="outline"
                            onClick={async () => {
                                await supabase.auth.signOut();
                                window.location.reload();
                            }}
                        >
                            Sair e usar outra conta
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                throw error;
            }

            // Forçar reload da página para reinicializar o contexto
            window.location.href = '/admin/painel';
        } catch (error: any) {
            toast.error(error.message || "Erro ao fazer login");
            setSubmitting(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Vrumi Admin</CardTitle>
                    <CardDescription className="text-center">
                        Entre com suas credenciais de administrador
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@vrumi.com.br"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={submitting}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={submitting}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={submitting}>
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Entrando...
                                </>
                            ) : (
                                "Entrar"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminLogin;
