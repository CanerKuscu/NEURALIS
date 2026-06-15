/**
 * NEURALIS - Widget Configuration
 * Home Screen Widget for iOS and Android
 * Shows: Streak Count, Shadow Fox Status, Countdown Timer
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { localizationService, ShadowFoxStatus } from './LocalizationService';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface WidgetData {
    streakCount: number;
    foxStatus: ShadowFoxStatus;
    remainingTimeMs: number;
    taskCompleted: boolean;
    lastUpdated: number;
    locale: string;
}

export interface WidgetDisplayData {
    streakText: string;
    foxStatusText: string;
    countdownText: string;
    foxEmoji: string;
    backgroundColor: string;
    accentColor: string;
    taskStatusText: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// WIDGET COLORS
// ═══════════════════════════════════════════════════════════════════════════

const WIDGET_COLORS: Record<ShadowFoxStatus, { bg: string; accent: string; emoji: string }> = {
    happy: {
        bg: '#0D0D0D',
        accent: '#00FF88',
        emoji: '🦊',
    },
    tense: {
        bg: '#1A1A0D',
        accent: '#FFD700',
        emoji: '🦊⚡',
    },
    fading: {
        bg: '#1A0D1A',
        accent: '#A020F0',
        emoji: '🦊💀',
    },
    critical: {
        bg: '#1A0D0D',
        accent: '#FF4444',
        emoji: '☠️🦊',
    },
    dead: {
        bg: '#0D0D0D',
        accent: '#444444',
        emoji: '💀',
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// STORAGE KEYS
// ═══════════════════════════════════════════════════════════════════════════

const WIDGET_STORAGE_KEY = '@neuralis/widget_data';

// ═══════════════════════════════════════════════════════════════════════════
// WIDGET SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════

class WidgetService {
    private currentData: WidgetData | null = null;

    /**
     * Initialize widget service
     */
    async initialize(): Promise<void> {
        await this.loadWidgetData();
    }

    /**
     * Load widget data from storage
     */
    private async loadWidgetData(): Promise<void> {
        try {
            const stored = await AsyncStorage.getItem(WIDGET_STORAGE_KEY);
            if (stored) {
                this.currentData = JSON.parse(stored);
            }
        } catch (error) {
            console.error('[WidgetService] Failed to load widget data:', error);
        }
    }

    /**
     * Update widget data
     */
    async updateWidgetData(data: Omit<WidgetData, 'lastUpdated' | 'locale'>): Promise<void> {
        const widgetData: WidgetData = {
            ...data,
            lastUpdated: Date.now(),
            locale: localizationService.getLocale(),
        };

        this.currentData = widgetData;

        try {
            // Save to AsyncStorage (for app-side access)
            await AsyncStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(widgetData));

            // Update native widget
            await this.updateNativeWidget(widgetData);

        } catch (error) {
            console.error('[WidgetService] Failed to update widget data:', error);
        }
    }

    /**
     * Update native widget (platform specific)
     */
    private async updateNativeWidget(data: WidgetData): Promise<void> {
        const displayData = this.getDisplayData(data);

        if (Platform.OS === 'ios') {
            await this.updateIOSWidget(displayData);
        } else if (Platform.OS === 'android') {
            await this.updateAndroidWidget(displayData);
        }
    }

    /**
     * Get formatted display data for widget
     */
    getDisplayData(data: WidgetData): WidgetDisplayData {
        const strings = localizationService.getWidgetStrings();
        const colors = WIDGET_COLORS[data.foxStatus];

        // Format countdown
        const hours = Math.floor(data.remainingTimeMs / (1000 * 60 * 60));
        const minutes = Math.floor((data.remainingTimeMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((data.remainingTimeMs % (1000 * 60)) / 1000);

        let countdownText: string;
        if (data.taskCompleted) {
            countdownText = '✓';
        } else if (data.remainingTimeMs <= 0) {
            countdownText = '00:00:00';
        } else if (hours > 0) {
            countdownText = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            countdownText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        return {
            streakText: `🔥 ${data.streakCount}`,
            foxStatusText: strings.foxStatus[data.foxStatus],
            countdownText,
            foxEmoji: colors.emoji,
            backgroundColor: colors.bg,
            accentColor: colors.accent,
            taskStatusText: data.taskCompleted ? strings.taskComplete : strings.taskPending,
        };
    }

    /**
     * Update iOS Widget using WidgetKit
     * Note: Requires native module bridge - this is the JS interface
     */
    private async updateIOSWidget(displayData: WidgetDisplayData): Promise<void> {
        try {
            // iOS Widget requires native module
            // This would be implemented via a native module bridge
            // For now, we store the data in shared UserDefaults (via AsyncStorage)

            const iosWidgetData = {
                streakCount: this.currentData?.streakCount ?? 0,
                foxStatus: this.currentData?.foxStatus ?? 'happy',
                countdownText: displayData.countdownText,
                foxEmoji: displayData.foxEmoji,
                accentColor: displayData.accentColor,
                taskStatusText: displayData.taskStatusText,
            };

            // Store in app group shared container
            await AsyncStorage.setItem(
                '@neuralis/ios_widget_data',
                JSON.stringify(iosWidgetData)
            );

            console.log('[WidgetService] iOS widget data updated');
        } catch (error) {
            console.error('[WidgetService] iOS widget update failed:', error);
        }
    }

    /**
     * Update Android Widget
     * Note: Requires native module bridge - this is the JS interface
     */
    private async updateAndroidWidget(displayData: WidgetDisplayData): Promise<void> {
        try {
            // Android Widget requires native module (AppWidgetProvider)
            // This would be implemented via a native module bridge

            const androidWidgetData = {
                streakCount: this.currentData?.streakCount ?? 0,
                foxStatus: this.currentData?.foxStatus ?? 'happy',
                countdownText: displayData.countdownText,
                foxEmoji: displayData.foxEmoji,
                accentColor: displayData.accentColor,
                taskStatusText: displayData.taskStatusText,
            };

            await AsyncStorage.setItem(
                '@neuralis/android_widget_data',
                JSON.stringify(androidWidgetData)
            );

            console.log('[WidgetService] Android widget data updated');
        } catch (error) {
            console.error('[WidgetService] Android widget update failed:', error);
        }
    }

    /**
     * Get current widget data
     */
    getCurrentData(): WidgetData | null {
        return this.currentData;
    }

    /**
     * Calculate fox status based on remaining time
     */
    calculateFoxStatus(remainingMs: number, taskCompleted: boolean): ShadowFoxStatus {
        if (taskCompleted) return 'happy';
        if (remainingMs <= 0) return 'dead';

        const remainingHours = remainingMs / (1000 * 60 * 60);

        if (remainingHours > 12) return 'happy';
        if (remainingHours > 2) return 'tense';
        if (remainingHours > 0.25) return 'fading';
        return 'critical';
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const widgetService = new WidgetService();
export default widgetService;
