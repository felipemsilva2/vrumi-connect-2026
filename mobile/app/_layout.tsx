import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { CacheProvider } from '../contexts/CacheContext';
import { StripeProvider } from '../contexts/StripeContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ConsentGate from '../components/ConsentGate';
import VersionGate from '../components/VersionGate';

const LAST_TAB_KEY = 'vrumi_last_tab';

function AppContent() {
    const { isDark, theme } = useTheme();
    const { user } = useAuth();
    const [navReady, setNavReady] = useState(false);

    // Initial navigation restoration
    useEffect(() => {
        const restoreNavigation = async () => {
            if (user) {
                try {
                    const lastTab = await AsyncStorage.getItem(LAST_TAB_KEY);
                    // We only restore if it's NOT the index (home) to avoid loops/unnecessary jumps
                    if (lastTab && lastTab !== 'index' && lastTab !== 'home') {
                        // Small delay to ensure router is ready
                        setTimeout(() => {
                            router.replace(`/(tabs)/${lastTab}` as any);
                        }, 500);
                    }
                } catch (e) {
                    console.error('Failed to restore navigation:', e);
                }
            }
            setNavReady(true);
        };

        restoreNavigation();
    }, [user]);

    // Initialize push notifications when user is logged in
    usePushNotifications(user?.id);

    return (
        <>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <VersionGate>
                <ConsentGate>
                    <Stack
                        screenOptions={{
                            headerShown: false,
                            contentStyle: { backgroundColor: theme.background },
                            animation: 'fade',
                            animationDuration: 200,
                        }}
                    >
                        <Stack.Screen
                            name="(auth)"
                            options={{
                                animation: 'slide_from_bottom',
                                animationDuration: 300,
                            }}
                        />
                        <Stack.Screen
                            name="(tabs)"
                            options={{
                                animation: 'fade',
                                animationDuration: 200,
                            }}
                        />
                        <Stack.Screen
                            name="connect"
                            options={{
                                animation: 'slide_from_right',
                                animationDuration: 250,
                            }}
                        />
                    </Stack>
                </ConsentGate>
            </VersionGate>
        </>
    );
}

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <AuthProvider>
                    <CacheProvider>
                        <StripeProvider>
                            <AppContent />
                        </StripeProvider>
                    </CacheProvider>
                </AuthProvider>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}
