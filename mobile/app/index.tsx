import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
    const { user, loading } = useAuth();
    const { theme } = useTheme();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    // Redirect to tabs if logged in, otherwise to login
    return <Redirect href={user ? '/(tabs)' : '/(auth)/login'} />;
}
