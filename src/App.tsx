import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useEffect, Suspense, lazy } from "react";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { queryClient, persister } from "@/lib/query-client";
import { Loader2 } from "lucide-react";

// Lazy load pages
const Index = lazy(() => import("@/pages/Index"));
const Auth = lazy(() => import("@/pages/Auth"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const FAQPage = lazy(() => import("@/pages/FAQ"));
const TermosDeUso = lazy(() => import("@/pages/TermosDeUso"));
const PoliticaPrivacidade = lazy(() => import("@/pages/PoliticaPrivacidade"));

// Vrumi Connect pages
const ConnectHome = lazy(() => import("@/pages/connect/ConnectHome"));
const InstructorProfile = lazy(() => import("@/pages/connect/InstructorProfile"));
const InstructorRegistration = lazy(() => import("@/pages/connect/InstructorRegistration"));
const BookingFlow = lazy(() => import("@/pages/connect/BookingFlow"));
const InstructorDashboard = lazy(() => import("@/pages/connect/InstructorDashboard"));
const StudentLessons = lazy(() => import("@/pages/connect/StudentLessons"));

// SEO Content pages
const NovaLeiCNH = lazy(() => import("@/pages/NovaLeiCNH"));
const InstrutorIndependente = lazy(() => import("@/pages/InstrutorIndependente"));
const CNHGratis = lazy(() => import("@/pages/CNHGratis"));


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
        <BrowserRouter>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/entrar" element={<Auth />} />
                <Route path="/perguntas-frequentes" element={<FAQPage />} />
                <Route path="/termos-de-uso" element={<TermosDeUso />} />
                <Route path="/politica-de-privacidade" element={<PoliticaPrivacidade />} />

                {/* Vrumi Connect routes */}
                <Route path="/connect" element={<ConnectHome />} />
                <Route path="/connect/instrutor/:id" element={<InstructorProfile />} />
                <Route path="/connect/cadastro-instrutor" element={<InstructorRegistration />} />
                <Route path="/connect/agendar/:instructorId" element={<BookingFlow />} />
                <Route path="/connect/painel-instrutor" element={<InstructorDashboard />} />
                <Route path="/connect/minhas-aulas" element={<StudentLessons />} />

                {/* SEO Content pages */}
                <Route path="/nova-lei-cnh" element={<NovaLeiCNH />} />
                <Route path="/instrutor-independente" element={<InstrutorIndependente />} />
                <Route path="/cnh-gratis" element={<CNHGratis />} />


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
