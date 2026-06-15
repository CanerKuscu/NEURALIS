/**
 * NEURALIS - Notification Hook
 * React hook for managing streak notifications and widget updates
 */

import { useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import {
    notificationEngine,
    StreakStatus,
} from '../services/NotificationEngine';
import {
    localizationService,
    NotificationLocale,
    ShadowFoxStatus,
} from '../services/LocalizationService';
import { widgetService, WidgetData } from '../services/WidgetService';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface UseNotificationsOptions {
    enabled?: boolean;
    onStreakWarning?: (severity: string) => void;
    onStreakDeath?: () => void;
}

interface UseNotificationsReturn {
    isInitialized: boolean;
    scheduleNotifications: (status: StreakStatus) => Promise<void>;
    cancelAllNotifications: () => Promise<void>;
    updateWidget: (data: Omit<WidgetData, 'lastUpdated' | 'locale'>) => Promise<void>;
    setLocale: (locale: NotificationLocale) => Promise<void>;
    getShadowFoxStatus: (remainingMs: number, taskCompleted: boolean) => ShadowFoxStatus;
    sendTestNotification: () => Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
    const { enabled = true, onStreakWarning, onStreakDeath } = options;
    const isInitializedRef = useRef<boolean>(false);
    const appStateRef = useRef<AppStateStatus>(AppState.currentState);

    // ─────────────────────────────────────────────────────────────────────────
    // INITIALIZATION
    // ─────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        if (!enabled) return;

        const initializeServices = async (): Promise<void> => {
            try {
                await localizationService.initialize();
                await notificationEngine.initialize();
                await widgetService.initialize();
                isInitializedRef.current = true;
                console.log('[useNotifications] Services initialized');
            } catch (error) {
                console.error('[useNotifications] Initialization failed:', error);
            }
        };

        initializeServices();

        // Cleanup on unmount
        return () => {
            notificationEngine.cleanup();
        };
    }, [enabled]);

    // ─────────────────────────────────────────────────────────────────────────
    // APP STATE HANDLING
    // ─────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        const handleAppStateChange = (nextAppState: AppStateStatus): void => {
            if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
                // App came to foreground - refresh widget
                console.log('[useNotifications] App returned to foreground');
            }
            appStateRef.current = nextAppState;
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription.remove();
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // SCHEDULE NOTIFICATIONS
    // ─────────────────────────────────────────────────────────────────────────

    const scheduleNotifications = useCallback(async (status: StreakStatus): Promise<void> => {
        if (!isInitializedRef.current) {
            console.warn('[useNotifications] Not initialized');
            return;
        }

        try {
            await notificationEngine.scheduleStreakNotifications(status);

            // Also update widget
            const remainingMs = status.deadlineTimestamp - Date.now();
            const foxStatus = notificationEngine.getShadowFoxStatus(remainingMs, status.taskCompletedToday);

            await widgetService.updateWidgetData({
                streakCount: status.currentStreak,
                foxStatus,
                remainingTimeMs: remainingMs,
                taskCompleted: status.taskCompletedToday,
            });

            // Trigger callbacks if needed
            if (foxStatus === 'dead' && onStreakDeath) {
                onStreakDeath();
            } else if (['critical', 'fading', 'tense'].includes(foxStatus) && onStreakWarning) {
                onStreakWarning(foxStatus);
            }
        } catch (error) {
            console.error('[useNotifications] Failed to schedule:', error);
        }
    }, [onStreakDeath, onStreakWarning]);

    // ─────────────────────────────────────────────────────────────────────────
    // CANCEL NOTIFICATIONS
    // ─────────────────────────────────────────────────────────────────────────

    const cancelAllNotifications = useCallback(async (): Promise<void> => {
        try {
            await notificationEngine.cancelAllNotifications();
        } catch (error) {
            console.error('[useNotifications] Failed to cancel:', error);
        }
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // UPDATE WIDGET
    // ─────────────────────────────────────────────────────────────────────────

    const updateWidget = useCallback(async (
        data: Omit<WidgetData, 'lastUpdated' | 'locale'>
    ): Promise<void> => {
        try {
            await widgetService.updateWidgetData(data);
        } catch (error) {
            console.error('[useNotifications] Failed to update widget:', error);
        }
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // SET LOCALE
    // ─────────────────────────────────────────────────────────────────────────

    const setLocale = useCallback(async (locale: NotificationLocale): Promise<void> => {
        try {
            await localizationService.setLocale(locale);
        } catch (error) {
            console.error('[useNotifications] Failed to set locale:', error);
        }
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // GET SHADOW FOX STATUS
    // ─────────────────────────────────────────────────────────────────────────

    const getShadowFoxStatus = useCallback((
        remainingMs: number,
        taskCompleted: boolean
    ): ShadowFoxStatus => {
        return notificationEngine.getShadowFoxStatus(remainingMs, taskCompleted);
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // SEND TEST NOTIFICATION
    // ─────────────────────────────────────────────────────────────────────────

    const sendTestNotification = useCallback(async (): Promise<void> => {
        try {
            await notificationEngine.sendImmediateNotification('normal', { streak: 42 });
        } catch (error) {
            console.error('[useNotifications] Failed to send test:', error);
        }
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // RETURN
    // ─────────────────────────────────────────────────────────────────────────

    return {
        isInitialized: isInitializedRef.current,
        scheduleNotifications,
        cancelAllNotifications,
        updateWidget,
        setLocale,
        getShadowFoxStatus,
        sendTestNotification,
    };
}

export default useNotifications;
