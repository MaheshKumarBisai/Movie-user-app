import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
    isDark: boolean;
    background: string;
    surface: string;
    surfaceAlt: string;
    surfaceHighlight: string;
    border: string;
    borderLight: string;
    borderPurple: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    primary: string;
    primaryLight: string;
    primaryDark: string;
    primarySoft: string;
    inputBg: string;
    card: string;
    tabBarBg: string;
    tabBarBorder: string;
    statusBar: 'light' | 'dark';
}

const darkColors: ThemeColors = {
    isDark: true,
    background: '#0B0B15',
    surface: '#1F1F2E',
    surfaceAlt: '#161624',
    surfaceHighlight: '#2A2A3E',
    border: '#2E2E3E',
    borderLight: '#1F1F2E',
    borderPurple: '#8A2BE2',
    text: '#FFFFFF',
    textSecondary: '#9CA3AF',
    textMuted: '#6B7280',
    primary: '#8A2BE2',
    primaryLight: '#9D4EDD',
    primaryDark: '#6B21A8',
    primarySoft: 'rgba(138, 43, 226, 0.15)',
    inputBg: '#1A1A24',
    card: '#1F1F2E',
    tabBarBg: '#0B0B15',
    tabBarBorder: '#1F1F2E',
    statusBar: 'light',
};

const lightColors: ThemeColors = {
    isDark: false,
    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceAlt: '#FAFAFA',
    surfaceHighlight: '#F3E8FF',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    borderPurple: '#8A2BE2',
    text: '#111827',
    textSecondary: '#4B5563',
    textMuted: '#9CA3AF',
    primary: '#8A2BE2',
    primaryLight: '#9D4EDD',
    primaryDark: '#6B21A8',
    primarySoft: '#FAF5FF',
    inputBg: '#F9FAFB',
    card: '#FFFFFF',
    tabBarBg: '#FFFFFF',
    tabBarBorder: '#E5E7EB',
    statusBar: 'dark',
};

interface ThemeContextType {
    theme: ThemeMode;
    isDark: boolean;
    colors: ThemeColors;
    toggleTheme: () => void;
    setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'showgo_app_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<ThemeMode>('dark');

    useEffect(() => {
        loadStoredTheme();
    }, []);

    const loadStoredTheme = async () => {
        try {
            const saved = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
            if (saved === 'light' || saved === 'dark') {
                setThemeState(saved);
            }
        } catch (e) {
            console.log('Error reading theme from storage:', e);
        }
    };

    const setTheme = async (mode: ThemeMode) => {
        setThemeState(mode);
        try {
            await SecureStore.setItemAsync(THEME_STORAGE_KEY, mode);
        } catch (e) {
            console.log('Error saving theme to storage:', e);
        }
    };

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
    };

    const colors = theme === 'dark' ? darkColors : lightColors;

    return (
        <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', colors, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return ctx;
}
