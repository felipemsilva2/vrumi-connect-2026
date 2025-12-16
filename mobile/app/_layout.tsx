import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { QuizLockProvider } from '../contexts/QuizLockContext';
import { GamificationProvider } from '../contexts/GamificationContext';
import { CacheProvider } from '../contexts/CacheContext';
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
                    // Smooth fade animation for screen transitions
                    animation: 'fade',
                    animationDuration: 200,
                }}
            >
                {/* Auth screens - slide from bottom */}
                <Stack.Screen
                    name="(auth)"
                    options={{
                        animation: 'slide_from_bottom',
                        animationDuration: 300,
                    }}
                />
                {/* Main tabs - fade transition */}
                <Stack.Screen
                    name="(tabs)"
                    options={{
                        animation: 'fade',
                        animationDuration: 200,
                    }}
                />
                {/* Other screens - slide from right */}
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
                            <AppContent />
                        </QuizLockProvider>
                    </GamificationProvider>
                </CacheProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}
