import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const lightTheme = {
    // Backgrounds
    background: '#f8fafc',
    card: '#ffffff',
    cardBorder: '#f1f5f9',
    cardHover: '#f8fafc',

    // Text
    text: '#111827',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',

    // Primary
    primary: '#10b981',
    primaryLight: '#ecfdf5',
    primaryDark: '#059669',

    // Navigation
    tabBar: '#ffffff',
    tabBarBorder: '#f1f5f9',

    // Inputs
    inputBg: '#ffffff',
    inputBorder: '#e5e7eb',
    inputFocusBorder: '#10b981',

    // Status colors
    success: '#10b981',
    successLight: '#ecfdf5',
    warning: '#f59e0b',
    warningLight: '#fef3c7',
    error: '#ef4444',
    errorLight: '#fef2f2',
    info: '#3b82f6',
    infoLight: '#eff6ff',

    // Overlay
    overlay: 'rgba(0,0,0,0.5)',

    // Skeleton/Loading
    skeleton: '#e5e7eb',
    skeletonHighlight: '#f3f4f6',
};

export const darkTheme = {
    // Backgrounds
    background: '#0f172a',
    card: '#1e293b',
    cardBorder: '#334155',
    cardHover: '#273449',

    // Text
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',

    // Primary
    primary: '#10b981',
    primaryLight: '#064e3b',
    primaryDark: '#34d399',

    // Navigation
    tabBar: '#1e293b',
    tabBarBorder: '#334155',

    // Inputs
    inputBg: '#1e293b',
    inputBorder: '#334155',
    inputFocusBorder: '#10b981',

    // Status colors
    success: '#10b981',
    successLight: '#064e3b',
    warning: '#f59e0b',
    warningLight: '#451a03',
    error: '#ef4444',
    errorLight: '#450a0a',
    info: '#3b82f6',
    infoLight: '#1e3a5f',

    // Overlay
    overlay: 'rgba(0,0,0,0.7)',

    // Skeleton/Loading
    skeleton: '#334155',
    skeletonHighlight: '#475569',
};

export type Theme = typeof lightTheme;
export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    isDark: boolean;
    themeMode: ThemeMode;
    toggleTheme: () => void;
    setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: lightTheme,
    isDark: false,
    themeMode: 'system',
    toggleTheme: () => { },
    setThemeMode: () => { },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemColorScheme = useColorScheme();
    const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
    const [isLoading, setIsLoading] = useState(true);

    // Determine if dark based on mode and system preference
    const isDark = themeMode === 'system'
        ? systemColorScheme === 'dark'
        : themeMode === 'dark';

    useEffect(() => {
        loadThemePreference();
    }, []);

    const loadThemePreference = async () => {
        try {
            const savedMode = await AsyncStorage.getItem('themeMode');
            if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
                setThemeModeState(savedMode as ThemeMode);
            }
        } catch (error) {
            console.error('Error loading theme:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const setThemeMode = useCallback(async (mode: ThemeMode) => {
        try {
            setThemeModeState(mode);
            await AsyncStorage.setItem('themeMode', mode);
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    }, []);

    const toggleTheme = useCallback(async () => {
        const newMode: ThemeMode = isDark ? 'light' : 'dark';
        await setThemeMode(newMode);
    }, [isDark, setThemeMode]);

    const theme = isDark ? darkTheme : lightTheme;

    return (
        <ThemeContext.Provider value={{ theme, isDark, themeMode, toggleTheme, setThemeMode }}>
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
