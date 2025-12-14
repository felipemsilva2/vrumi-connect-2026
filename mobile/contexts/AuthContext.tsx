import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../src/lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';

// Ensure web browser is ready for auth
WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
    signInWithGoogle: () => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Handle deep links for OAuth callback
    useEffect(() => {
        const handleDeepLink = async (event: { url: string }) => {
            const url = event.url;
            console.log('Deep link received:', url);

            // Check if this is an auth callback
            if (url.includes('access_token') || url.includes('code=')) {
                try {
                    // Parse the URL to get tokens
                    const hashPart = url.split('#')[1];
                    const queryPart = url.split('?')[1];
                    const params = new URLSearchParams(hashPart || queryPart || '');

                    const accessToken = params.get('access_token');
                    const refreshToken = params.get('refresh_token');

                    if (accessToken) {
                        const { error } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken || '',
                        });

                        if (error) {
                            console.error('Error setting session:', error);
                        }
                    }
                } catch (error) {
                    console.error('Error handling deep link:', error);
                }
            }
        };

        // Listen for deep links
        const subscription = Linking.addEventListener('url', handleDeepLink);

        // Check if app was opened with a deep link
        Linking.getInitialURL().then((url) => {
            if (url) {
                handleDeepLink({ url });
            }
        });

        return () => subscription.remove();
    }, []);

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error as Error | null };
    };

    const signUp = async (email: string, password: string, name: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: name },
            },
        });
        return { error: error as Error | null };
    };

    const signInWithGoogle = async (): Promise<{ error: Error | null }> => {
        try {
            // Create redirect URI
            // For Expo Go: exp://192.168.x.x:8081
            // For standalone: vrumi://auth/callback
            const redirectUri = makeRedirectUri({
                scheme: 'vrumi',
                path: 'auth/callback',
                // Use Expo Go URL in development
                preferLocalhost: false,
            });

            console.log('Redirect URI:', redirectUri);

            // Start OAuth flow with Supabase
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUri,
                    skipBrowserRedirect: true,
                },
            });

            if (error) throw error;

            if (data?.url) {
                // Open the OAuth URL in an auth session browser
                const result = await WebBrowser.openAuthSessionAsync(
                    data.url,
                    redirectUri,
                    {
                        showInRecents: true,
                        preferEphemeralSession: false,
                    }
                );

                console.log('WebBrowser result:', result);

                if (result.type === 'success' && result.url) {
                    // Extract tokens from the callback URL
                    const url = result.url;
                    const hashPart = url.split('#')[1];
                    const queryPart = url.split('?')[1];
                    const params = new URLSearchParams(hashPart || queryPart || '');

                    const accessToken = params.get('access_token');
                    const refreshToken = params.get('refresh_token');

                    console.log('Access token found:', !!accessToken);

                    if (accessToken) {
                        // Set the session with the tokens
                        const { error: sessionError } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken || '',
                        });

                        if (sessionError) throw sessionError;
                        return { error: null };
                    } else {
                        throw new Error('Não foi possível obter token de acesso');
                    }
                } else if (result.type === 'cancel' || result.type === 'dismiss') {
                    return { error: new Error('Login cancelado') };
                }
            }

            return { error: null };
        } catch (error) {
            console.error('Google sign in error:', error);
            return { error: error as Error };
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signInWithGoogle, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
