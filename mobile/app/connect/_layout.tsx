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
            <Stack.Screen
                name="agendar/[id]"
                options={{
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                    headerShown: false
                }}
            />
            <Stack.Screen name="minhas-aulas" />
            <Stack.Screen
                name="cadastro-instrutor"
                options={{
                    presentation: 'modal',
                    animation: 'slide_from_bottom'
                }}
            />
            <Stack.Screen name="painel-instrutor" />
            <Stack.Screen
                name="checkout/[id]"
                options={{
                    presentation: 'modal',
                    animation: 'slide_from_bottom'
                }}
            />
        </Stack>
    );
}
