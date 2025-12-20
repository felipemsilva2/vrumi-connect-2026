import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Instructors } from './pages/Instructors';
import { Bookings } from './pages/Bookings';
import { Transactions } from './pages/Transactions';
import { Users } from './pages/Users';
import { Refunds } from './pages/Refunds';
import { ActivityLog } from './pages/ActivityLog';
import { SupportTickets } from './pages/SupportTickets';
import { ChatMonitor } from './pages/ChatMonitor';
import { Settings } from './pages/Settings';
import { Notifications } from './pages/Notifications';
import { Layout } from './components/Layout';
import './App.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        checkAdminRole(session.user.id);
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setIsAuthenticated(true);
      await checkAdminRole(session.user.id);
    } else {
      setIsAuthenticated(false);
    }
  };

  const checkAdminRole = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();

    setIsAdmin(!!data);
    setIsAuthenticated(true);
  };

  if (isAuthenticated === null) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="access-denied">
        <h1>Acesso Negado</h1>
        <p>Você não tem permissão de administrador.</p>
        <button onClick={() => supabase.auth.signOut()}>Sair</button>
      </div>
    );
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="instructors" element={<Instructors />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="users" element={<Users />} />
          <Route path="refunds" element={<Refunds />} />
          <Route path="activity" element={<ActivityLog />} />
          <Route path="support" element={<SupportTickets />} />
          <Route path="chat" element={<ChatMonitor />} />
          <Route path="settings" element={<Settings />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
