import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface AdminAuthState {
    user: User | null;
    isAdmin: boolean;
    isLoading: boolean;
    signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthState | undefined>(undefined);

export const useAdminAuth = () => {
    const context = useContext(AdminAuthContext);
    if (!context) {
        throw new Error('useAdminAuth must be used within AdminAuthProvider');
    }
    return context;
};

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        if (initialized) return;
        setInitialized(true);

        console.log('[AdminAuth] Inicializando...');

        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                console.log('[AdminAuth] Sessão inicial:', session?.user?.email);

                if (session?.user) {
                    setUser(session.user);
                    
                    // Verificar se é admin
                    const { data: adminResult, error } = await supabase.rpc('is_admin', {
                        user_id: session.user.id
                    });
                    
                    console.log('[AdminAuth] is_admin result:', adminResult, error);
                    setIsAdmin(adminResult === true);
                } else {
                    setUser(null);
                    setIsAdmin(false);
                }
            } catch (err) {
                console.error('[AdminAuth] Erro na inicialização:', err);
                setUser(null);
                setIsAdmin(false);
            } finally {
                setIsLoading(false);
                console.log('[AdminAuth] Inicialização completa');
            }
        };

        initAuth();

        // Listener para logout apenas
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('[AdminAuth] Auth event:', event);
            
            if (event === 'SIGNED_OUT') {
                setUser(null);
                setIsAdmin(false);
            } else if (event === 'SIGNED_IN' && session?.user && !user) {
                // Só processa se não temos usuário ainda (primeiro login)
                setUser(session.user);
                
                const { data: adminResult } = await supabase.rpc('is_admin', {
                    user_id: session.user.id
                });
                setIsAdmin(adminResult === true);
                setIsLoading(false);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [initialized, user]);

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setIsAdmin(false);
    };

    return (
        <AdminAuthContext.Provider value={{ user, isAdmin, isLoading, signOut }}>
            {children}
        </AdminAuthContext.Provider>
    );
};
