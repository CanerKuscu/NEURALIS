import React, { useEffect, useState } from 'react';
import { ToastProvider } from '../src/context/ToastContext';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { LanguageProvider } from '../src/context/LanguageContext';
import { SubscriptionProvider } from '../src/providers/SubscriptionProvider';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from '../src/config/supabase';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SplashView from '../components/SplashView';
import * as SplashScreen from 'expo-splash-screen';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { NotificationService } from '../src/services/NotificationService';
import { OfflineBanner } from '../src/components/OfflineBanner';
import { setLanguage } from '../src/i18n';
import { getLocales } from 'expo-localization';
import { initSentry, setSentryUser } from '../src/config/sentry';
import type { Session } from '@supabase/supabase-js';

// Initialize Sentry as early as possible
initSentry();

const LANGUAGE_SELECTED_KEY = '@neuralis_language_selected';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [session, setSession] = useState<Session | null>(null);
    const [initialized, setInitialized] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [splashFinished, setSplashFinished] = useState(false);

    const segments = useSegments();
    const router = useRouter();
    const inAuthGroup = segments[0] === '(auth)';

    useEffect(() => {
        const initSession = async () => {
            // 0. Auto-detect language on first launch
            try {
                const langSelected = await AsyncStorage.getItem(LANGUAGE_SELECTED_KEY);
                if (!langSelected) {
                    // First launch: detect device language and save it
                    const deviceLang = getLocales()[0]?.languageCode ?? 'en';
                    setLanguage(deviceLang);
                    await AsyncStorage.setItem(LANGUAGE_SELECTED_KEY, deviceLang);
                    await AsyncStorage.setItem('app_language', deviceLang);
                }
            } catch {
                // Fallback: do nothing, defaults to 'en'
            }

            // 1. Handle Auth
            try {
                const { data, error } = await supabase.auth.getSession();
                if (error) {
                    // Swallow error, treat as guest
                    setSession(null);
                } else {
                    setSession(data.session);
                }
            } catch (err) {
                setSession(null);
            } finally {
                setInitialized(true);
            }
        };

        initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Initialize Notifications
    useEffect(() => {
        const setupNotifications = async () => {
            await NotificationService.registerForPushNotificationsAsync();
            await NotificationService.scheduleDailyReminder();
        };

        if (initialized) {
            setupNotifications();
        }
    }, [initialized]);

    useEffect(() => {
        if (!initialized) return;

        const performNavigation = async () => {
            // Navigate based on Auth State
            if (session && inAuthGroup) {
                await router.replace('/(tabs)');
            } else if (!session && !inAuthGroup) {
                await router.replace('/(auth)/login');
            }

            // Reveal App (prevents FOUC)
            setTimeout(() => {
                setIsReady(true);
            }, 100);
        };

        performNavigation();
    }, [session, segments, initialized]);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <ThemeProvider>
                    <LanguageProvider>
                        <SubscriptionProvider>
                            <ToastProvider>
                                <ThemeWrapper isReady={isReady} splashFinished={splashFinished} setSplashFinished={setSplashFinished} />
                            </ToastProvider>
                        </SubscriptionProvider>
                    </LanguageProvider>
                </ThemeProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}

// Separate component to access ThemeContext
function ThemeWrapper({ isReady, splashFinished, setSplashFinished }: { isReady: boolean, splashFinished: boolean, setSplashFinished: (v: boolean) => void }) {
    const { theme } = useTheme();

    return (
        <View style={{ flex: 1, backgroundColor: theme.background.primary }}>
            {/* 1. Main App Stack - Mounted but Hidden until Ready */}
            <View style={{ flex: 1, opacity: isReady ? 1 : 0 }}>
                <ErrorBoundary>
                    <OfflineBanner />
                    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
                        <Stack.Screen name="language-select" options={{ headerShown: false, presentation: 'modal' }} />
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                        <Stack.Screen name="lesson" options={{ headerShown: false }} />
                        <Stack.Screen name="legal" options={{ headerShown: false }} />
                        <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
                    </Stack>
                </ErrorBoundary>
            </View>

            {/* 2. Splash Overlay - Always on top until finished */}
            {(!splashFinished) && (
                <View style={{ ...StyleSheet.absoluteFillObject, zIndex: 9999 }}>
                    <SplashView onFinish={() => setSplashFinished(true)} />
                </View>
            )}
        </View>
    );
}

