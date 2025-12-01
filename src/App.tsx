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

                <Route path="/pagamento" element={<Checkout />} />
                <Route path="/pagamento/sucesso" element={<CheckoutSuccess />} />
                <Route path="/pagamento/cancelado" element={<CheckoutCancel />} />


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
