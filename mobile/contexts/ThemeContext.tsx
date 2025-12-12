import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const lightTheme = {
    background: '#f8fafc',
    card: '#ffffff',
    cardBorder: '#f1f5f9',
    text: '#111827',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',
    primary: '#10b981',
    primaryLight: '#ecfdf5',
    tabBar: '#ffffff',
    tabBarBorder: '#f1f5f9',
    inputBg: '#ffffff',
    inputBorder: '#e5e7eb',
};

export const darkTheme = {
    background: '#0f172a',
    card: '#1e293b',
    cardBorder: '#334155',
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    primary: '#10b981',
    primaryLight: '#064e3b',
    tabBar: '#1e293b',
    tabBarBorder: '#334155',
    inputBg: '#1e293b',
    inputBorder: '#334155',
};

export type Theme = typeof lightTheme;

interface ThemeContextType {
    theme: Theme;
    isDark: boolean;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: lightTheme,
    isDark: false,
    toggleTheme: () => { },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Load saved theme preference
        loadThemePreference();
    }, []);

    const loadThemePreference = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('theme');
            if (savedTheme === 'dark') {
                setIsDark(true);
            }
        } catch (error) {
            console.error('Error loading theme:', error);
        }
    };

    const toggleTheme = async () => {
        try {
            const newIsDark = !isDark;
            setIsDark(newIsDark);
            await AsyncStorage.setItem('theme', newIsDark ? 'dark' : 'light');
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    };

    const theme = isDark ? darkTheme : lightTheme;

    return (
        <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
