import { Stack } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';

export default function ConnectLayout() {
    const { theme } = useTheme();

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: theme.background },
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="instrutor/[id]" />
            <Stack.Screen name="agendar/[id]" />
            <Stack.Screen name="minhas-aulas" />
            <Stack.Screen name="cadastro-instrutor" />
            <Stack.Screen name="painel-instrutor" />
        </Stack>
    );
}
