import { Tabs } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import ModernTabBar from '../../components/ModernTabBar';

export default function TabsLayout() {
    const { theme } = useTheme();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                // Smooth fade animation when switching tabs
                animation: 'fade',
            }}
            tabBar={(props) => <ModernTabBar {...props} />}
        >
            <Tabs.Screen name="index" />
            <Tabs.Screen name="buscar" />
            <Tabs.Screen name="aulas" />
            <Tabs.Screen name="instrutor" />
            <Tabs.Screen name="perfil" />
        </Tabs>
    );
}

