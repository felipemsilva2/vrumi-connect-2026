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

// Lazy load admin pages
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("@/pages/admin/AdminUsers"));
const AdminRoles = lazy(() => import("@/pages/admin/AdminRoles"));
const AdminSubscriptions = lazy(() => import("@/pages/admin/AdminSubscriptions"));
const AdminAuditLogs = lazy(() => import("@/pages/admin/AdminAuditLogs"));
const AdminQuestions = lazy(() => import("@/pages/AdminQuestions"));
const AdminFlashcards = lazy(() => import("@/pages/AdminFlashcards"));
const AdminPopulate = lazy(() => import("@/pages/AdminPopulate"));
const AdminTrafficSignsImport = lazy(() => import("@/pages/admin/AdminTrafficSignsImport"));
const AdminLogin = lazy(() => import("@/pages/admin/AdminLogin"));

const PageLoader = () => (
    <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
);

const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
    const [userId, setUserId] = useState<string>();
    const { isAdmin, isLoading } = useIsAdmin(userId);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUserId(session.user.id);
            }
        };
        checkAuth();
    }, []);

    if (isLoading) return <PageLoader />;
    if (!isAdmin) return <Navigate to="/admin/login" replace />;
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
