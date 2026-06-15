/**
 * NEURALIS - Background Task Service
 * Manages background fetch and task scheduling for notification persistence
 * 
 * Uses expo-task-manager and expo-background-fetch for autonomous operation
 */

import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { notificationEngine, StreakStatus } from './NotificationEngine';
import { widgetService } from './WidgetService';
import { localizationService } from './LocalizationService';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const BACKGROUND_FETCH_TASK = 'NEURALIS_BACKGROUND_FETCH';
const NOTIFICATION_TASK = 'NEURALIS_NOTIFICATION_TASK';
const STORAGE_KEYS = {
    STREAK_STATUS: 'neuralis_streak_status',
    LAST_BACKGROUND_RUN: 'neuralis_last_background_run',
    BACKGROUND_ENABLED: 'neuralis_background_enabled',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface BackgroundTaskConfig {
    minimumIntervalMinutes: number;
    startOnBoot: boolean;
    stopOnTerminate: boolean;
}

interface TaskExecutionResult {
    success: boolean;
    timestamp: number;
    nextScheduledAt?: number;
    error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// TASK DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Define the background fetch task
 * This runs periodically even when the app is closed
 */
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
    const now = Date.now();
    console.log(`[BackgroundTask] Running background fetch at ${new Date(now).toISOString()}`);

    try {
        // Initialize services
        await localizationService.initialize();
        await notificationEngine.initialize();

        // Get stored streak status
        const storedStatus = await AsyncStorage.getItem(STORAGE_KEYS.STREAK_STATUS);

        if (!storedStatus) {
            console.log('[BackgroundTask] No streak status stored');
            return BackgroundFetch.BackgroundFetchResult.NoData;
        }

        const status: StreakStatus = JSON.parse(storedStatus);
        const remainingMs = status.deadlineTimestamp - now;

        // Check if deadline has passed
        if (remainingMs <= 0 && !status.taskCompletedToday) {
            console.log('[BackgroundTask] STREAK DIED! Sending death notification');
            await notificationEngine.sendImmediateNotification('dead', {
                streak: status.currentStreak,
            });

            // Update widget to show dead fox
            await widgetService.updateWidgetData({
                streakCount: 0,
                foxStatus: 'dead',
                remainingTimeMs: 0,
                taskCompleted: false,
            });

            return BackgroundFetch.BackgroundFetchResult.NewData;
        }

        // Reschedule notifications based on current time
        if (!status.taskCompletedToday) {
            console.log('[BackgroundTask] Rescheduling notifications');
            await notificationEngine.scheduleStreakNotifications(status);

            // Update widget
            const foxStatus = notificationEngine.getShadowFoxStatus(remainingMs, false);
            await widgetService.updateWidgetData({
                streakCount: status.currentStreak,
                foxStatus,
                remainingTimeMs: remainingMs,
                taskCompleted: false,
            });
        }

        // Store execution time
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_BACKGROUND_RUN, now.toString());

        return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (error) {
        console.error('[BackgroundTask] Error:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
    }
});

/**
 * Define the notification task (iOS specific)
 * Handles notification responses and actions
 */
TaskManager.defineTask(NOTIFICATION_TASK, async (body) => {
    const { data, error } = body;

    if (error) {
        console.error('[NotificationTask] Error:', error.message);
        return;
    }

    console.log('[NotificationTask] Received notification event:', data);

    // Handle notification action if any
    if (data) {
        const notification = data as { actionIdentifier?: string; notification?: unknown };

        if (notification.actionIdentifier === 'OPEN_APP') {
            console.log('[NotificationTask] User tapped notification - open app');
        } else if (notification.actionIdentifier === 'SNOOZE') {
            console.log('[NotificationTask] User snoozed notification');
            // Schedule a reminder in 30 minutes
            await notificationEngine.scheduleSnoozeReminder(30);
        }
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// BACKGROUND TASK SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════

class BackgroundTaskService {
    private isRegistered: boolean = false;
    private config: BackgroundTaskConfig = {
        minimumIntervalMinutes: 15,
        startOnBoot: true,
        stopOnTerminate: false,
    };

    // ─────────────────────────────────────────────────────────────────────────
    // INITIALIZATION
    // ─────────────────────────────────────────────────────────────────────────

    async initialize(): Promise<void> {
        console.log('[BackgroundTaskService] Initializing...');

        try {
            // Check if background fetch is available
            const status = await BackgroundFetch.getStatusAsync();

            switch (status) {
                case BackgroundFetch.BackgroundFetchStatus.Restricted:
                    console.warn('[BackgroundTaskService] Background fetch is restricted');
                    break;
                case BackgroundFetch.BackgroundFetchStatus.Denied:
                    console.warn('[BackgroundTaskService] Background fetch is denied');
                    break;
                case BackgroundFetch.BackgroundFetchStatus.Available:
                    console.log('[BackgroundTaskService] Background fetch is available');
                    await this.registerBackgroundFetch();
                    break;
            }
        } catch (error) {
            console.error('[BackgroundTaskService] Initialization failed:', error);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // REGISTER BACKGROUND FETCH
    // ─────────────────────────────────────────────────────────────────────────

    async registerBackgroundFetch(): Promise<void> {
        if (this.isRegistered) {
            console.log('[BackgroundTaskService] Already registered');
            return;
        }

        try {
            await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
                minimumInterval: this.config.minimumIntervalMinutes * 60,
                stopOnTerminate: this.config.stopOnTerminate,
                startOnBoot: this.config.startOnBoot,
            });

            this.isRegistered = true;
            await AsyncStorage.setItem(STORAGE_KEYS.BACKGROUND_ENABLED, 'true');
            console.log('[BackgroundTaskService] Background fetch registered');
        } catch (error) {
            console.error('[BackgroundTaskService] Registration failed:', error);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UNREGISTER BACKGROUND FETCH
    // ─────────────────────────────────────────────────────────────────────────

    async unregisterBackgroundFetch(): Promise<void> {
        if (!this.isRegistered) {
            return;
        }

        try {
            await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
            this.isRegistered = false;
            await AsyncStorage.setItem(STORAGE_KEYS.BACKGROUND_ENABLED, 'false');
            console.log('[BackgroundTaskService] Background fetch unregistered');
        } catch (error) {
            console.error('[BackgroundTaskService] Unregistration failed:', error);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STORE STREAK STATUS
    // ─────────────────────────────────────────────────────────────────────────

    async storeStreakStatus(status: StreakStatus): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.STREAK_STATUS, JSON.stringify(status));
            console.log('[BackgroundTaskService] Streak status stored');
        } catch (error) {
            console.error('[BackgroundTaskService] Failed to store streak status:', error);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET STREAK STATUS
    // ─────────────────────────────────────────────────────────────────────────

    async getStreakStatus(): Promise<StreakStatus | null> {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEYS.STREAK_STATUS);
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('[BackgroundTaskService] Failed to get streak status:', error);
            return null;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CHECK TASK STATUS
    // ─────────────────────────────────────────────────────────────────────────

    async isTaskRegistered(): Promise<boolean> {
        try {
            const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
            return isRegistered;
        } catch (error) {
            console.error('[BackgroundTaskService] Failed to check task status:', error);
            return false;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET LAST EXECUTION TIME
    // ─────────────────────────────────────────────────────────────────────────

    async getLastExecutionTime(): Promise<number | null> {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEYS.LAST_BACKGROUND_RUN);
            return stored ? parseInt(stored, 10) : null;
        } catch (error) {
            console.error('[BackgroundTaskService] Failed to get last execution time:', error);
            return null;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CONFIGURE
    // ─────────────────────────────────────────────────────────────────────────

    setConfig(config: Partial<BackgroundTaskConfig>): void {
        this.config = { ...this.config, ...config };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PLATFORM-SPECIFIC SETUP INFO
    // ─────────────────────────────────────────────────────────────────────────

    getSetupInstructions(): string {
        if (Platform.OS === 'ios') {
            return `
iOS Background Fetch Setup:
1. In Xcode, enable "Background fetch" capability
2. In Info.plist, add UIBackgroundModes with "fetch" value
3. Background fetch interval is controlled by iOS
4. Minimum interval: 15 minutes (system decides actual timing)
            `;
        } else if (Platform.OS === 'android') {
            return `
Android Background Task Setup:
1. Add to AndroidManifest.xml:
   <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
2. Task runs even after device restart
3. Minimum interval: 15 minutes
4. Consider battery optimization settings
            `;
        }
        return 'Background tasks not supported on this platform';
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const backgroundTaskService = new BackgroundTaskService();
export { BACKGROUND_FETCH_TASK, NOTIFICATION_TASK, STORAGE_KEYS };
export type { BackgroundTaskConfig, TaskExecutionResult };
