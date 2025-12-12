import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { QuizLockProvider } from '../contexts/QuizLockContext';
import { GamificationProvider } from '../contexts/GamificationContext';

function AppContent() {
    const { isDark, theme } = useTheme();

    return (
        <>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: theme.background },
                }}
            />
        </>
    );
}

export default function RootLayout() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <GamificationProvider>
                    <QuizLockProvider>
                        <AppContent />
                    </QuizLockProvider>
                </GamificationProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

