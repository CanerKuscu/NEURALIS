/**
 * Theme Context for managing Dark/Light mode
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { THEMES } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeType = typeof THEMES.light;

type ThemeContextType = {
    isDark: boolean;
    toggleTheme: () => void;
    theme: ThemeType; // Now dynamic
};

const ThemeContext = createContext<ThemeContextType>({
    isDark: false,
    toggleTheme: () => { },
    theme: THEMES.light,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const systemScheme = useColorScheme();
    const [isDark, setIsDark] = useState(systemScheme === 'dark');

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const stored = await AsyncStorage.getItem('user_theme');
            if (stored) {
                setIsDark(stored === 'dark');
            }
        } catch (e) { console.error(e); }
    };

    const toggleTheme = async () => {
        const newMode = !isDark;
        setIsDark(newMode);
        await AsyncStorage.setItem('user_theme', newMode ? 'dark' : 'light');
    };

    const activeTheme = isDark ? THEMES.dark : THEMES.light;

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme, theme: activeTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
