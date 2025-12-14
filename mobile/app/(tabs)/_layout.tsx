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
            <Tabs.Screen name="flashcards" />
            <Tabs.Screen name="simulados" />
            <Tabs.Screen name="estudos" />
            <Tabs.Screen name="perfil" />
        </Tabs>
    );
}
