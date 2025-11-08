import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Checkout from "./pages/Checkout";
import AdminPopulate from "./pages/AdminPopulate";
import AdminFlashcards from "./pages/AdminFlashcards";
import AdminQuestions from "./pages/AdminQuestions";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSubscriptions from "./pages/admin/AdminSubscriptions";
import AdminRoles from "./pages/admin/AdminRoles";
import NotFound from "./pages/NotFound";
import { ProtectedAdminRoute } from "./components/admin/ProtectedAdminRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/checkout" element={<Checkout />} />
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
