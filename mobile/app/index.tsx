import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
    const { user, loading } = useAuth();
    const { theme } = useTheme();
    const [checkingOnboarding, setCheckingOnboarding] = useState(true);
    const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

    useEffect(() => {
        const checkOnboarding = async () => {
            try {
                // Onboarding complete check
                const value = await AsyncStorage.getItem('@vrumi_onboarding_complete');

                setHasSeenOnboarding(value === 'true');
            } catch (error) {
                // Error checking onboarding, default to true for safety

                setHasSeenOnboarding(true);
            } finally {
                setCheckingOnboarding(false);
            }
        };

        checkOnboarding();
    }, []);

    if (loading || checkingOnboarding) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }



    // FIRST: Show onboarding if user hasn't seen it (even if logged in)
    if (!hasSeenOnboarding) {

        return <Redirect href="/(auth)/onboarding" />;
    }

    // If user is logged in, go to main app
    if (user) {

        return <Redirect href="/(tabs)" />;
    }

    // Otherwise, go to login

    return <Redirect href="/(auth)/login" />;
}
