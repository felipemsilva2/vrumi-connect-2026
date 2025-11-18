import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import StudyRoom from "@/pages/StudyRoom";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminRoles from "@/pages/admin/AdminRoles";
import AdminSubscriptions from "@/pages/admin/AdminSubscriptions";
import AdminAuditLogs from "@/pages/admin/AdminAuditLogs";
import PrivacyCenter from "@/pages/admin/PrivacyCenter";
import AdminQuestions from "@/pages/AdminQuestions";
import AdminFlashcards from "@/pages/AdminFlashcards";
import AdminPopulate from "@/pages/AdminPopulate";
import AdminTrafficSignsImport from "@/pages/admin/AdminTrafficSignsImport";
import Checkout from "@/pages/Checkout";
import CheckoutSuccess from "@/pages/CheckoutSuccess";
import CheckoutCancel from "@/pages/CheckoutCancel";
import NotFound from "@/pages/NotFound";
import { ProtectedAdminRoute } from "@/components/admin/ProtectedAdminRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import TrafficSignsLibrary from "@/pages/TrafficSignsLibrary";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
            <ProtectedAdminRoute allowDpo>
              <AdminAuditLogs />
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/privacy" element={
            <ProtectedAdminRoute allowDpo>
              <PrivacyCenter />
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
  </QueryClientProvider>
);

export default App;
