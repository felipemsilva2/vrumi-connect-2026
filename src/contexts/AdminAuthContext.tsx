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

    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            console.log('[AdminAuth] Inicializando...');
            
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                
                if (sessionError) {
                    console.error('[AdminAuth] Erro ao obter sessão:', sessionError);
                    if (mounted) {
                        setUser(null);
                        setIsAdmin(false);
                        setIsLoading(false);
                    }
                    return;
                }

                console.log('[AdminAuth] Sessão inicial:', session?.user?.email);

                if (session?.user && mounted) {
                    setUser(session.user);
                    
                    // Verificar se é admin
                    const { data: adminResult, error } = await supabase.rpc('is_admin', {
                        user_id: session.user.id
                    });
                    
                    console.log('[AdminAuth] is_admin result:', adminResult, error);
                    if (mounted) {
                        setIsAdmin(adminResult === true);
                    }
                } else if (mounted) {
                    setUser(null);
                    setIsAdmin(false);
                }
            } catch (err) {
                console.error('[AdminAuth] Erro na inicialização:', err);
                if (mounted) {
                    setUser(null);
                    setIsAdmin(false);
                }
            } finally {
                if (mounted) {
                    setIsLoading(false);
                    console.log('[AdminAuth] Inicialização completa');
                }
            }
        };

        initAuth();

        // Listener para mudanças de autenticação
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('[AdminAuth] Auth event:', event);
            
            if (!mounted) return;
            
            if (event === 'SIGNED_OUT') {
                setUser(null);
                setIsAdmin(false);
            } else if (event === 'SIGNED_IN' && session?.user) {
                setUser(session.user);
                
                const { data: adminResult } = await supabase.rpc('is_admin', {
                    user_id: session.user.id
                });
                if (mounted) {
                    setIsAdmin(adminResult === true);
                    setIsLoading(false);
                }
            } else if (event === 'TOKEN_REFRESHED' && session?.user) {
                // Manter estado atual, apenas garantir que loading está false
                setIsLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

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
