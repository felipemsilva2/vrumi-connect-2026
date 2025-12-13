import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useEffect, useState, Suspense, lazy } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { ReloadPrompt } from "@/components/ReloadPrompt";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { queryClient, persister } from "@/lib/query-client";
import { Loader2 } from "lucide-react";

// Lazy load pages
const Index = lazy(() => import("@/pages/Index"));
const Auth = lazy(() => import("@/pages/Auth"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const StudyRoom = lazy(() => import("@/pages/StudyRoomWrapper"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const CheckoutSuccess = lazy(() => import("@/pages/CheckoutSuccess"));
const CheckoutCancel = lazy(() => import("@/pages/CheckoutCancel"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const TrafficSignsLibrary = lazy(() => import("@/pages/TrafficSignsLibraryWrapper"));
const FAQPage = lazy(() => import("@/pages/FAQ"));
const TermosDeUso = lazy(() => import("@/pages/TermosDeUso"));
const PoliticaPrivacidade = lazy(() => import("@/pages/PoliticaPrivacidade"));
const CNHSocial = lazy(() => import("@/pages/CNHSocial"));

// Vrumi Connect pages
const ConnectHome = lazy(() => import("@/pages/connect/ConnectHome"));
const InstructorProfile = lazy(() => import("@/pages/connect/InstructorProfile"));
const InstructorRegistration = lazy(() => import("@/pages/connect/InstructorRegistration"));
const BookingFlow = lazy(() => import("@/pages/connect/BookingFlow"));
const InstructorDashboard = lazy(() => import("@/pages/connect/InstructorDashboard"));


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

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!isAdmin) return <Navigate to="/entrar" replace />;
  return <>{children}</>;
};

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Redirect to admin app (separate entry point)
const AdminRedirect = () => {
  useEffect(() => {
    window.location.href = window.location.pathname;
  }, []);
  return <PageLoader />;
};

const App = () => (
  <PersistQueryClientProvider
    client={queryClient}
    persistOptions={{ persister }}
  >
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ReloadPrompt />
        <BrowserRouter>
          <PWAInstallPrompt />
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
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

                {/* Vrumi Connect routes */}
                <Route path="/connect" element={<ConnectHome />} />
                <Route path="/connect/instrutor/:id" element={<InstructorProfile />} />
                <Route path="/connect/cadastro-instrutor" element={<InstructorRegistration />} />
                <Route path="/connect/agendar/:instructorId" element={<BookingFlow />} />
                <Route path="/connect/painel-instrutor" element={<InstructorDashboard />} />

                <Route path="/pagamento" element={<Checkout />} />
                <Route path="/pagamento/sucesso" element={<CheckoutSuccess />} />
                <Route path="/pagamento/cancelado" element={<CheckoutCancel />} />

                {/* Redirect admin routes to admin app */}
                <Route path="/admin/*" element={<AdminRedirect />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </PersistQueryClientProvider>
);

export default App;
