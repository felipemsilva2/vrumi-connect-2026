import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { QuizLockProvider } from '../contexts/QuizLockContext';
import { GamificationProvider } from '../contexts/GamificationContext';
import { CacheProvider } from '../contexts/CacheContext';
import { StripeProvider } from '../contexts/StripeContext';
import { usePushNotifications } from '../hooks/usePushNotifications';

function AppContent() {
    const { isDark, theme } = useTheme();
    const { user } = useAuth();

    // Initialize push notifications when user is logged in
    usePushNotifications(user?.id);

    return (
        <>
            <StatusBar style={isDark ? 'light' : 'dark'} />
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
                    name="biblioteca"
                    options={{
                        animation: 'slide_from_right',
                        animationDuration: 250,
                    }}
                />
                <Stack.Screen
                    name="study-room"
                    options={{
                        animation: 'slide_from_right',
                        animationDuration: 250,
                    }}
                />
            </Stack>
        </>
    );
}

export default function RootLayout() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <CacheProvider>
                    <GamificationProvider>
                        <QuizLockProvider>
                            <StripeProvider>
                                <AppContent />
                            </StripeProvider>
                        </QuizLockProvider>
                    </GamificationProvider>
                </CacheProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}
