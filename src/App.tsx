import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import FAQ from "@/pages/FAQ";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
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
  if (!isAdmin) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

import { ThemeProvider } from "@/components/ThemeProvider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/study-room" element={<StudyRoom />} />
              <Route path="/traffic-signs-library" element={<TrafficSignsLibrary />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/termos-de-uso" element={<TermosDeUso />} />
              <Route path="/termos-de-uso" element={<TermosDeUso />} />
              <Route path="/politica-de-privacidade" element={<PoliticaPrivacidade />} />
              <Route path="/cnh-social" element={<CNHSocial />} />

              <Route path="/faq" element={<FAQ />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />

              <Route path="/checkout" element={<Checkout />} />
              <Route path="/checkout/success" element={<CheckoutSuccess />} />
              <Route path="/checkout/cancel" element={<CheckoutCancel />} />

              <Route path="/admin/dashboard" element={
                <ProtectedAdminRoute>
                  <AdminDashboard />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedAdminRoute>
                  <AdminUsers />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/subscriptions" element={
                <ProtectedAdminRoute>
                  <AdminSubscriptions />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/roles" element={
                <ProtectedAdminRoute>
                  <AdminRoles />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/audit-logs" element={
                <ProtectedAdminRoute>
                  <AdminAuditLogs />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/populate" element={
                <ProtectedAdminRoute>
                  <AdminPopulate />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/flashcards" element={
                <ProtectedAdminRoute>
                  <AdminFlashcards />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/questions" element={
                <ProtectedAdminRoute>
                  <AdminQuestions />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/traffic-signs" element={
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
  </QueryClientProvider>
);

export default App;
