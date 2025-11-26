import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import StudyRoom from "@/pages/StudyRoomWrapper";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminRoles from "@/pages/admin/AdminRoles";
import AdminSubscriptions from "@/pages/admin/AdminSubscriptions";
import AdminAuditLogs from "@/pages/admin/AdminAuditLogs";
import AdminQuestions from "@/pages/AdminQuestions";
import AdminFlashcards from "@/pages/AdminFlashcards";
import AdminPopulate from "@/pages/AdminPopulate";
import AdminTrafficSignsImport from "@/pages/admin/AdminTrafficSignsImport";
import Checkout from "@/pages/Checkout";
import CheckoutSuccess from "@/pages/CheckoutSuccess";
import CheckoutCancel from "@/pages/CheckoutCancel";
import NotFound from "@/pages/NotFound";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import TrafficSignsLibrary from "@/pages/TrafficSignsLibraryWrapper";
import FAQPage from "@/pages/FAQ";
import TermosDeUso from "@/pages/TermosDeUso";
import PoliticaPrivacidade from "@/pages/PoliticaPrivacidade";
import CNHSocial from "@/pages/CNHSocial";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

  if (isLoading) return <div>Loading...</div>;
  if (!isAdmin) return <Navigate to="/entrar" replace />;
  return <>{children}</>;
};



const queryClient = new QueryClient();

const ThemeHandler = () => {
  const { pathname } = useLocation();
  const { setTheme } = useTheme();

  useEffect(() => {
    const isAppRoute = pathname.startsWith("/painel") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/sala-de-estudos") ||
      pathname.startsWith("/biblioteca-de-placas");

    if (isAppRoute) {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  }, [pathname, setTheme]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ThemeHandler />
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/entrar" element={<Auth />} />
              <Route path="/painel" element={<Dashboard />} />
              <Route path="/sala-de-estudos" element={<StudyRoom />} />
              <Route path="/biblioteca-de-placas" element={<TrafficSignsLibrary />} />
              <Route path="/perguntas-frequentes" element={<FAQPage />} />
              <Route path="/termos-de-uso" element={<TermosDeUso />} />
              <Route path="/politica-de-privacidade" element={<PoliticaPrivacidade />} />
              <Route path="/cnh-social" element={<CNHSocial />} />

              <Route path="/pagamento" element={<Checkout />} />
              <Route path="/pagamento/sucesso" element={<CheckoutSuccess />} />
              <Route path="/pagamento/cancelado" element={<CheckoutCancel />} />

              <Route path="/admin/painel" element={
                <ProtectedAdminRoute>
                  <AdminDashboard />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/usuarios" element={
                <ProtectedAdminRoute>
                  <AdminUsers />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/assinaturas" element={
                <ProtectedAdminRoute>
                  <AdminSubscriptions />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/funcoes" element={
                <ProtectedAdminRoute>
                  <AdminRoles />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/logs-auditoria" element={
                <ProtectedAdminRoute>
                  <AdminAuditLogs />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/popular" element={
                <ProtectedAdminRoute>
                  <AdminPopulate />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/flashcards" element={
                <ProtectedAdminRoute>
                  <AdminFlashcards />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/questoes" element={
                <ProtectedAdminRoute>
                  <AdminQuestions />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/placas" element={
                <ProtectedAdminRoute>
                  <AdminTrafficSignsImport />
                </ProtectedAdminRoute>
              } />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider >
);

export default App;
