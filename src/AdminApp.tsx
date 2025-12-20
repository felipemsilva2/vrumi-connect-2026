import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { queryClient, persister } from "@/lib/query-client";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

// Lazy load admin pages
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("@/pages/admin/AdminUsers"));
const AdminInstructors = lazy(() => import("@/pages/admin/AdminInstructors"));
const AdminRoles = lazy(() => import("@/pages/admin/AdminRoles"));
const AdminSubscriptions = lazy(() => import("@/pages/admin/AdminSubscriptions"));
const AdminAuditLogs = lazy(() => import("@/pages/admin/AdminAuditLogs"));
const AdminQuestions = lazy(() => import("@/pages/AdminQuestions"));
const AdminFlashcards = lazy(() => import("@/pages/AdminFlashcards"));
const AdminPopulate = lazy(() => import("@/pages/AdminPopulate"));
const AdminTrafficSignsImport = lazy(() => import("@/pages/admin/AdminTrafficSignsImport"));
const AdminLogin = lazy(() => import("@/pages/admin/AdminLogin"));
const AdminSupport = lazy(() => import("@/pages/admin/AdminSupport"));
const AdminGenerateQuestions = lazy(() => import("@/pages/admin/AdminGenerateQuestions"));
const AdminBookings = lazy(() => import("@/pages/admin/AdminBookings"));
const AdminTransactions = lazy(() => import("@/pages/admin/AdminTransactions"));

const PageLoader = () => (
    <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
);

const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
    const [userId, setUserId] = useState<string | null>(null);
    const [isAuthChecked, setIsAuthChecked] = useState(false);
    const { isAdmin, isLoading } = useIsAdmin(userId || undefined);

    console.log('[ADMIN AUTH] Estado atual:', {
        userId,
        isAuthChecked,
        isAdmin,
        isLoading,
        timestamp: new Date().toISOString()
    });

    useEffect(() => {
        let isMounted = true;
        console.log('[ADMIN AUTH] useEffect iniciado');
        
        const checkAuth = async () => {
            console.log('[ADMIN AUTH] Verificando sessão...');
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                console.log('[ADMIN AUTH] Sessão obtida:', {
                    hasSession: !!session,
                    userId: session?.user?.id,
                    email: session?.user?.email,
                    error
                });
                
                if (isMounted) {
                    const newUserId = session?.user?.id || null;
                    console.log('[ADMIN AUTH] Atualizando userId para:', newUserId);
                    setUserId(newUserId);
                    setIsAuthChecked(true);
                }
            } catch (error) {
                console.error('[ADMIN AUTH] Erro ao verificar auth:', error);
                if (isMounted) {
                    setUserId(null);
                    setIsAuthChecked(true);
                }
            }
        };
        
        checkAuth();
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('[ADMIN AUTH] onAuthStateChange:', {
                event,
                userId: session?.user?.id,
                email: session?.user?.email
            });
            if (isMounted) {
                setUserId(session?.user?.id || null);
            }
        });

        return () => {
            console.log('[ADMIN AUTH] Cleanup executado');
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    // Wait for auth check to complete
    if (!isAuthChecked) {
        console.log('[ADMIN AUTH] Renderizando: aguardando auth check');
        return <PageLoader />;
    }

    // No user, redirect to admin login
    if (!userId) {
        console.log('[ADMIN AUTH] Renderizando: redirecionando para /admin/login (sem userId)');
        // Use window.location para evitar conflito com basename
        window.location.href = '/admin/login';
        return <PageLoader />;
    }

    // Still loading admin status
    if (isLoading) {
        console.log('[ADMIN AUTH] Renderizando: aguardando verificação admin');
        return <PageLoader />;
    }

    // User is not admin
    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
                <p>Você está logado, mas não tem permissão de administrador.</p>
                <div className="p-4 bg-muted rounded-md text-xs font-mono">
                    <p>User ID: {userId}</p>
                    <p>Is Admin: {String(isAdmin)}</p>
                </div>
                <Button onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.href = "/admin/login";
                }}>
                    Sair e Tentar Novamente
                </Button>
            </div>
        );
    }
    
    return <>{children}</>;
};

const AdminApp = () => (
    <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
    >
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
            <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter basename="/admin">
                    <ErrorBoundary>
                        <Suspense fallback={<PageLoader />}>
                            <Routes>
                                <Route path="/login" element={<AdminLogin />} />

                                <Route path="/" element={<Navigate to="/painel" replace />} />

                                <Route path="/painel" element={
                                    <ProtectedAdminRoute>
                                        <AdminDashboard />
                                    </ProtectedAdminRoute>
                                } />
                                <Route path="/usuarios" element={
                                    <ProtectedAdminRoute>
                                        <AdminUsers />
                                    </ProtectedAdminRoute>
                                } />
                                <Route path="/instrutores" element={
                                    <ProtectedAdminRoute>
                                        <AdminInstructors />
                                    </ProtectedAdminRoute>
                                } />
                                <Route path="/agendamentos" element={
                                    <ProtectedAdminRoute>
                                        <AdminBookings />
                                    </ProtectedAdminRoute>
                                } />
                                <Route path="/transacoes" element={
                                    <ProtectedAdminRoute>
                                        <AdminTransactions />
                                    </ProtectedAdminRoute>
                                } />
                                {/* Education routes - DESCONTINUADO */}
                                <Route path="/assinaturas" element={
                                    <ProtectedAdminRoute>
                                        <AdminSubscriptions />
                                    </ProtectedAdminRoute>
                                } />
                                <Route path="/funcoes" element={
                                    <ProtectedAdminRoute>
                                        <AdminRoles />
                                    </ProtectedAdminRoute>
                                } />
                                <Route path="/logs-auditoria" element={
                                    <ProtectedAdminRoute>
                                        <AdminAuditLogs />
                                    </ProtectedAdminRoute>
                                } />
                                <Route path="/popular" element={
                                    <ProtectedAdminRoute>
                                        <AdminPopulate />
                                    </ProtectedAdminRoute>
                                } />
                                <Route path="/flashcards" element={
                                    <ProtectedAdminRoute>
                                        <AdminFlashcards />
                                    </ProtectedAdminRoute>
                                } />
                                <Route path="/questoes" element={
                                    <ProtectedAdminRoute>
                                        <AdminQuestions />
                                    </ProtectedAdminRoute>
                                } />
                                <Route path="/placas" element={
                                    <ProtectedAdminRoute>
                                        <AdminTrafficSignsImport />
                                    </ProtectedAdminRoute>
                                } />
                                <Route path="/suporte" element={
                                    <ProtectedAdminRoute>
                                        <AdminSupport />
                                    </ProtectedAdminRoute>
                                } />
                                <Route path="/gerar-questoes" element={
                                    <ProtectedAdminRoute>
                                        <AdminGenerateQuestions />
                                    </ProtectedAdminRoute>
                                } />

                                <Route path="*" element={<div className="flex items-center justify-center h-screen">Página não encontrada</div>} />
                            </Routes>
                        </Suspense>
                    </ErrorBoundary>
                </BrowserRouter>
            </TooltipProvider>
        </ThemeProvider>
    </PersistQueryClientProvider>
);

export default AdminApp;
