import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { queryClient, persister } from "@/lib/query-client";
import { Suspense, lazy, useEffect, useState, useRef } from "react";
import { Loader2 } from "lucide-react";
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

type AdminStatus = 'loading' | 'admin' | 'not-admin' | 'no-session';

const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
    const [adminStatus, setAdminStatus] = useState<AdminStatus>('loading');
    const [userId, setUserId] = useState<string | null>(null);
    const hasChecked = useRef(false);

    useEffect(() => {
        // Prevenir múltiplas verificações
        if (hasChecked.current) {
            console.log('[ADMIN AUTH] Já verificado, ignorando');
            return;
        }
        hasChecked.current = true;
        
        console.log('[ADMIN AUTH] Iniciando verificação única');
        
        const checkAuth = async () => {
            try {
                // Obter sessão
                const { data: { session } } = await supabase.auth.getSession();
                console.log('[ADMIN AUTH] Sessão:', session?.user?.email);
                
                if (!session?.user) {
                    console.log('[ADMIN AUTH] Sem sessão');
                    setAdminStatus('no-session');
                    return;
                }
                
                setUserId(session.user.id);
                
                // Verificar admin
                const { data: isAdmin, error } = await supabase.rpc('is_admin', {
                    user_id: session.user.id
                });
                
                console.log('[ADMIN AUTH] is_admin:', isAdmin, error);
                
                if (error) {
                    console.error('[ADMIN AUTH] Erro RPC:', error);
                    setAdminStatus('not-admin');
                    return;
                }
                
                setAdminStatus(isAdmin === true ? 'admin' : 'not-admin');
                console.log('[ADMIN AUTH] Status final:', isAdmin === true ? 'admin' : 'not-admin');
                
            } catch (err) {
                console.error('[ADMIN AUTH] Erro:', err);
                setAdminStatus('no-session');
            }
        };
        
        checkAuth();
        
        // Listener apenas para logout
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            console.log('[ADMIN AUTH] Event:', event);
            if (event === 'SIGNED_OUT') {
                setAdminStatus('no-session');
                setUserId(null);
                hasChecked.current = false; // Permite re-verificar após logout
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    console.log('[ADMIN AUTH] Render - status:', adminStatus);

    if (adminStatus === 'loading') {
        return <PageLoader />;
    }

    if (adminStatus === 'no-session') {
        return <Navigate to="/login" replace />;
    }

    if (adminStatus === 'not-admin') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
                <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
                <p className="text-center">Você está logado, mas não tem permissão de administrador.</p>
                <div className="p-4 bg-muted rounded-md text-xs font-mono">
                    <p>User ID: {userId}</p>
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
