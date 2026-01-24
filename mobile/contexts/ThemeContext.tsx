import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const lightTheme = {
    // Layout & Spacing
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
    },
    radius: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 20,
        xl: 28,
        round: 32,
        full: 999,
    },

    // Backgrounds
    background: '#f8fafc',
    card: '#ffffff',
    cardBorder: '#f1f5f9',
    cardHover: '#f8fafc',

    // Text
    text: '#0f172a',    // Ligeiramente mais escuro para melhor contraste
    textSecondary: '#475569', // Mais suave que o cinza anterior
    textMuted: '#94a3b8',

    // Primary (Emerald/Mint Mix for "Confident Path")
    primary: '#10b981',
    primarySoft: '#dcfce7', // Para fundos de botões/ícones suaves
    primaryExtralight: '#f0fdf4',
    primaryLight: '#ecfdf5',
    primaryDark: '#059669',

    // Navigation
    tabBar: '#ffffff',
    tabBarBorder: '#f1f5f9',

    // Inputs
    inputBg: '#ffffff',
    inputBorder: '#e2e8f0',
    inputFocusBorder: '#10b981',

    // Status colors
    success: '#10b981',
    successLight: '#dcfce7',
    warning: '#f59e0b',
    warningLight: '#fef3c7',
    error: '#ef4444',
    errorLight: '#fef2f2',
    info: '#3b82f6',
    infoLight: '#eff6ff',

    // Overlay
    overlay: 'rgba(0,0,0,0.5)',

    // Skeleton/Loading
    skeleton: '#e2e8f0',
    skeletonHighlight: '#f1f5f9',

    // Typography (Ref: mobile-typography.md)
    typography: {
        sizes: {
            display: 34,
            h1: 28,
            h2: 22,
            h3: 20,
            bodyLarge: 17,
            body: 16,
            bodySmall: 14,
            caption: 12,
            label: 11,
        },
        lineHeights: {
            tight: 1.2,
            normal: 1.5,
            loose: 1.6,
        },
        weights: {
            regular: '400' as const,
            medium: '500' as const,
            semibold: '600' as const,
            bold: '700' as const,
            extraBold: '800' as const,
        }
    }
};

export const darkTheme = {
    // Layout & Spacing
    spacing: lightTheme.spacing,
    radius: lightTheme.radius,

    // Backgrounds (OLED Optimized)
    background: '#000000',     // True Black for 0% battery consumption on OLED
    card: '#121212',           // Near Black Surface (Material Standard)
    cardBorder: '#1e293b',     // Slightly visible border for depth
    cardHover: '#161e2b',

    // Text (High Contrast & Reduced Eye Strain)
    text: '#ececec',           // Off-white to prevent "smear" and fatigue
    textSecondary: '#b0b0b0',  // 4.5:1+ contrast on card surface
    textMuted: '#71717a',

    // Primary (Optimized for Dark Surface)
    primary: '#10b981',
    primarySoft: '#064e3b',
    primaryExtralight: '#064e4b',
    primaryLight: '#052c22',
    primaryDark: '#34d399',

    // Navigation
    tabBar: '#000000',         // Merged with background for seamless look
    tabBarBorder: '#121212',

    // Inputs
    inputBg: '#09090b',
    inputBorder: '#27272a',
    inputFocusBorder: '#10b981',

    // Status colors
    success: '#10b981',
    successLight: '#064e3b',
    warning: '#f59e0b',
    warningLight: '#451a03',
    error: '#ef4444',
    errorLight: '#450a0a',
    info: '#0ea5e9',
    infoLight: '#082f49',

    // Overlay
    overlay: 'rgba(0,0,0,0.85)',

    // Skeleton/Loading
    skeleton: '#18181b',
    skeletonHighlight: '#27272a',

    // Typography (Inherit scale, adjust for optical halation if needed)
    typography: lightTheme.typography,
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
