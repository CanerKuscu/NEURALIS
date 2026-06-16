/**
 * NEURALIS - Notification Engine
 * Duolingo-style obsessive persistence notification system
 * Exponential frequency with audio-notification synergy
 */

import * as Notifications from './safeNotifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { supabase } from '../config/supabase';

import type { NotificationSeverity, ShadowFoxStatus } from './LocalizationService';
import { localizationService } from './LocalizationService';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface StreakStatus {
  currentStreak: number;
  deadlineTimestamp: number;
  taskCompletedToday: boolean;
  lastNotificationTime?: number;
}

export interface NotificationSchedule {
  id: string;
  scheduledTime: Date;
  severity: NotificationSeverity;
  soundFile: '1.mp3' | '2.mp3' | '3.mp3';
}

interface ScheduledNotification {
  identifier: string;
  severity: NotificationSeverity;
  scheduledTime: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATION CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

// Exponential frequency schedule (hours before deadline)
const NOTIFICATION_SCHEDULE = {
  NORMAL: {
    // >12h: One notification with 1.mp3
    minHoursLeft: 12,
    intervalHours: null, // Single notification
    sound: '1.mp3' as const,
    severity: 'normal' as NotificationSeverity,
  },
  URGENT: {
    // 12h-2h: Every 4 hours with 2.mp3
    minHoursLeft: 2,
    maxHoursLeft: 12,
    intervalMinutes: 240, // 4 hours
    sound: '2.mp3' as const,
    severity: 'urgent' as NotificationSeverity,
  },
  DECAY_4H: {
    // 2h-1h: Every 30 minutes with 3.mp3
    minHoursLeft: 1,
    maxHoursLeft: 2,
    intervalMinutes: 30,
    sound: '3.mp3' as const,
    severity: 'decay' as NotificationSeverity,
  },
  CRITICAL_1H: {
    // Last 60 mins: Every 15 minutes with 3.mp3
    minMinutesLeft: 15,
    maxMinutesLeft: 60,
    intervalMinutes: 15,
    sound: '3.mp3' as const,
    severity: 'critical' as NotificationSeverity,
  },
  FINAL_15: {
    // Last 15 mins: Every 5 minutes with 3.mp3 (decreasing pitch)
    minMinutesLeft: 0,
    maxMinutesLeft: 15,
    intervalMinutes: 5,
    sound: '3.mp3' as const,
    severity: 'critical' as NotificationSeverity,
    decreasePitch: true,
  },
} as const;

// Storage keys
const STORAGE_KEYS = {
  SCHEDULED_NOTIFICATIONS: '@neuralis/scheduled_notifications',
  PUSH_TOKEN: '@neuralis/push_token',
  NOTIFICATION_PERMISSION: '@neuralis/notification_permission',
  STREAK_STATUS: '@neuralis/streak_status',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATION SOUNDS CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const SOUND_FILES = {
  '1.mp3': require('../../assets/audio/1.mp3'),
  '2.mp3': require('../../assets/audio/2.mp3'),
  '3.mp3': require('../../assets/audio/3.mp3'),
} as const;

type SoundFileKey = keyof typeof SOUND_FILES;

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATION ENGINE CLASS
// ═══════════════════════════════════════════════════════════════════════════

class NotificationEngine {
  private scheduledNotifications: ScheduledNotification[] = [];
  private expoPushToken: string | null = null;
  private isInitialized: boolean = false;
  private soundObjects: Map<SoundFileKey, Audio.Sound> = new Map();

  /**
   * Initialize the notification engine
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Initialize localization service
      await localizationService.initialize();

      // Request permissions
      const permissionGranted = await this.requestPermissions();
      if (!permissionGranted) {
        console.warn('[NotificationEngine] Permissions not granted');
        return false;
      }

      // Configure notification handler
      this.configureNotificationHandler();

      // Get push token
      await this.registerForPushNotifications();

      // Load scheduled notifications from storage
      await this.loadScheduledNotifications();

      // Preload sounds
      await this.preloadSounds();

      this.isInitialized = true;
      console.log('[NotificationEngine] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[NotificationEngine] Initialization error:', error);
      return false;
    }
  }

  /**
   * Request notification permissions
   */
  private async requestPermissions(): Promise<boolean> {
    // Allow simulator/emulator for local notifications (just not push)
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[NotificationEngine] Notification permissions not granted');
      return false;
    }

    // Android specific channel setup
    if (Platform.OS === 'android') {
      await this.setupAndroidChannels();
    }

    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_PERMISSION, 'granted');
    return true;
  }

  /**
   * Setup Android notification channels
   */
  private async setupAndroidChannels(): Promise<void> {
    // Normal channel
    await Notifications.setNotificationChannelAsync('normal', {
      name: 'Streak Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
      sound: '1.mp3',
    });

    // Urgent channel
    await Notifications.setNotificationChannelAsync('urgent', {
      name: 'Urgent Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: '2.mp3',
    });

    // Critical channel
    await Notifications.setNotificationChannelAsync('critical', {
      name: 'Critical Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
      sound: '3.mp3',
      bypassDnd: true,
    });
  }

  /**
   * Configure notification handler
   */
  private configureNotificationHandler(): void {
    Notifications.setNotificationHandler({
      handleNotification: async (notification: Notifications.Notification) => {
        const severity = notification.request.content.data?.severity as NotificationSeverity;
        const priority =
          severity === 'critical'
            ? Notifications.AndroidNotificationPriority.MAX
            : Notifications.AndroidNotificationPriority.HIGH;

        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
          priority,
        };
      },
    });

    // Handle notification received while app is foregrounded
    Notifications.addNotificationReceivedListener(this.handleNotificationReceived.bind(this));

    // Handle notification tap
    Notifications.addNotificationResponseReceivedListener(this.handleNotificationTap.bind(this));
  }

  /**
   * Handle notification received
   */
  private async handleNotificationReceived(
    notification: Notifications.Notification,
  ): Promise<void> {
    const data = notification.request.content.data;
    const soundFile = data?.soundFile as SoundFileKey | undefined;

    if (soundFile) {
      await this.playNotificationSound(soundFile, data?.decreasePitch as boolean | undefined);
    }

    console.log('[NotificationEngine] Notification received:', notification.request.identifier);
  }

  /**
   * Handle notification tap
   */
  private handleNotificationTap(response: Notifications.NotificationResponse): void {
    const data = response.notification.request.content.data;
    console.log('[NotificationEngine] Notification tapped:', data);

    // Navigate to app - this will be handled by the app's navigation
  }

  /**
   * Register for push notifications
   * Note: Push tokens require development build, not Expo Go (SDK 53+)
   */
  private async registerForPushNotifications(): Promise<void> {
    try {
      // Check if running on physical device
      if (!Device.isDevice) {
        console.log('[NotificationEngine] Push notifications require physical device');
        return;
      }

      // Expo Go removed remote push token support (SDK 53+). Avoid calling
      // getExpoPushTokenAsync when running inside Expo Go to prevent the
      // noisy warning/RedBox. Use a development build or standalone app
      // to obtain a real push token.
      if (Constants.appOwnership === 'expo') {
        console.log(
          '[NotificationEngine] Running inside Expo Go - skipping push token registration',
        );
        return;
      }

      // This will work in development/custom clients and standalone builds
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'neuralis-d6434',
      });

      this.expoPushToken = token.data;
      await AsyncStorage.setItem(STORAGE_KEYS.PUSH_TOKEN, token.data);

      if (__DEV__) console.log('[NotificationEngine] Push token:', token.data);
      try {
        // If a user is signed in, persist the token to their profile so server can send pushes
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;
        if (userId) {
          await supabase.from('profiles').upsert({
            id: userId,
            push_token: token.data,
            expo_push_token: token.data,
            updated_at: new Date().toISOString(),
          });
          console.log('[NotificationEngine] Updated user profile with push token');
        }
      } catch (err) {
        console.warn('[NotificationEngine] Could not persist push token to profiles:', err);
      }
    } catch (error) {
      // This is expected in Expo Go - local notifications still work
      console.log('[NotificationEngine] Push token not available (Expo Go limitation)');
    }
  }

  /**
   * Preload notification sounds
   */
  private async preloadSounds(): Promise<void> {
    try {
      await Promise.all(
        Object.entries(SOUND_FILES).map(async ([key, source]) => {
          const { sound } = await Audio.Sound.createAsync(source as any);
          this.soundObjects.set(key as SoundFileKey, sound as any);
        }),
      );
      console.log('[NotificationEngine] Sounds preloaded');
    } catch (error) {
      console.warn('[NotificationEngine] Failed to preload sounds:', error);
    }
  }

  /**
   * Play notification sound with optional pitch modification
   */
  private async playNotificationSound(
    soundFile: SoundFileKey,
    decreasePitch?: boolean,
  ): Promise<void> {
    try {
      const sound = this.soundObjects.get(soundFile);
      if (!sound) {
        console.warn(`[NotificationEngine] Sound not loaded: ${soundFile}`);
        return;
      }

      // Reset to beginning
      await sound.setPositionAsync(0);

      // Apply pitch modification for final warnings
      if (decreasePitch) {
        await sound.setRateAsync(0.8, true); // Lower pitch
      } else {
        await sound.setRateAsync(1.0, true);
      }

      await sound.playAsync();
    } catch (error) {
      console.error('[NotificationEngine] Failed to play sound:', error);
    }
  }

  /**
   * Load scheduled notifications from storage
   */
  private async loadScheduledNotifications(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SCHEDULED_NOTIFICATIONS);
      if (stored) {
        this.scheduledNotifications = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[NotificationEngine] Failed to load scheduled notifications:', error);
    }
  }

  /**
   * Save scheduled notifications to storage
   */
  private async saveScheduledNotifications(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.SCHEDULED_NOTIFICATIONS,
        JSON.stringify(this.scheduledNotifications),
      );
    } catch (error) {
      console.error('[NotificationEngine] Failed to save scheduled notifications:', error);
    }
  }

  /**
   * Calculate notification schedule based on deadline
   */
  private calculateSchedule(
    deadlineTimestamp: number,
    streakCount: number,
  ): NotificationSchedule[] {
    const now = Date.now();
    const remainingMs = deadlineTimestamp - now;
    const remainingHours = remainingMs / (1000 * 60 * 60);
    const schedule: NotificationSchedule[] = [];

    // >12h: Single notification with 1.mp3
    if (remainingHours > 12) {
      schedule.push({
        id: `normal_${deadlineTimestamp}`,
        scheduledTime: new Date(deadlineTimestamp - 12 * 60 * 60 * 1000),
        severity: 'normal',
        soundFile: '1.mp3',
      });
    }

    // 12h-2h: Every 4 hours with 2.mp3
    for (let h = Math.min(remainingHours, 12); h > 2; h -= 4) {
      schedule.push({
        id: `urgent_${h}h_${deadlineTimestamp}`,
        scheduledTime: new Date(deadlineTimestamp - h * 60 * 60 * 1000),
        severity: 'urgent',
        soundFile: '2.mp3',
      });
    }

    // 2h-1h: Every 30 minutes with 3.mp3
    for (let m = 120; m > 60; m -= 30) {
      schedule.push({
        id: `decay_${m}m_${deadlineTimestamp}`,
        scheduledTime: new Date(deadlineTimestamp - m * 60 * 1000),
        severity: 'decay',
        soundFile: '3.mp3',
      });
    }

    // Last 60 mins: Every 15 minutes with 3.mp3
    for (let m = 60; m > 15; m -= 15) {
      schedule.push({
        id: `critical_${m}m_${deadlineTimestamp}`,
        scheduledTime: new Date(deadlineTimestamp - m * 60 * 1000),
        severity: 'critical',
        soundFile: '3.mp3',
      });
    }

    // Last 15 mins: Every 5 minutes with 3.mp3 (decreasing pitch)
    for (let m = 15; m > 0; m -= 5) {
      schedule.push({
        id: `final_${m}m_${deadlineTimestamp}`,
        scheduledTime: new Date(deadlineTimestamp - m * 60 * 1000),
        severity: 'critical',
        soundFile: '3.mp3',
      });
    }

    // Filter out past times
    return schedule.filter((s) => s.scheduledTime.getTime() > now);
  }

  /**
   * Schedule all notifications for a streak deadline
   */
  async scheduleStreakNotifications(status: StreakStatus): Promise<void> {
    if (status.taskCompletedToday) {
      console.log('[NotificationEngine] Task completed, canceling notifications');
      await this.cancelAllNotifications();
      return;
    }

    // Cancel existing notifications
    await this.cancelAllNotifications();

    // Calculate new schedule
    const schedule = this.calculateSchedule(status.deadlineTimestamp, status.currentStreak);

    console.log(`[NotificationEngine] Scheduling ${schedule.length} notifications`);

    // Schedule each notification in parallel to reduce total latency
    const tasks = schedule.map((item) => this.scheduleNotification(item, status.currentStreak));
    await Promise.all(tasks);

    // Save status
    await AsyncStorage.setItem(STORAGE_KEYS.STREAK_STATUS, JSON.stringify(status));
    await this.saveScheduledNotifications();
  }

  /**
   * Schedule a single notification
   */
  private async scheduleNotification(
    item: NotificationSchedule,
    streakCount: number,
  ): Promise<void> {
    const now = Date.now();
    const triggerTime = item.scheduledTime.getTime();

    if (triggerTime <= now) return;

    const hoursLeft = Math.floor((triggerTime - now) / (1000 * 60 * 60));
    const minutesLeft = Math.floor((triggerTime - now) / (1000 * 60)) % 60;

    // Get localized notification text
    const notification = localizationService.getNotification(item.severity, {
      hours: hoursLeft,
      minutes: minutesLeft,
      streak: streakCount,
    });

    // Use aggressive random message occasionally
    const useAggressiveMessage = Math.random() > 0.5 && item.severity !== 'normal';
    const body = useAggressiveMessage
      ? localizationService.getAggressiveMessage()
      : notification.body;

    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: body,
          sound: item.soundFile,
          badge: streakCount,
          data: {
            severity: item.severity,
            soundFile: item.soundFile,
            streakCount,
            decreasePitch: item.severity === 'critical' && minutesLeft <= 15,
          },
          categoryIdentifier: item.severity,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: item.scheduledTime,
        },
      });

      this.scheduledNotifications.push({
        identifier,
        severity: item.severity,
        scheduledTime: triggerTime,
      });

      console.log(
        `[NotificationEngine] Scheduled: ${item.severity} at ${item.scheduledTime.toISOString()}`,
      );
    } catch (error) {
      console.error('[NotificationEngine] Failed to schedule notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      this.scheduledNotifications = [];
      await this.saveScheduledNotifications();
      console.log('[NotificationEngine] All notifications canceled');
    } catch (error) {
      console.error('[NotificationEngine] Failed to cancel notifications:', error);
    }
  }

  /**
   * Send immediate notification (for testing or urgent alerts)
   */
  async sendImmediateNotification(
    severity: NotificationSeverity,
    params?: { hours?: number; minutes?: number; streak?: number },
  ): Promise<void> {
    const notification = localizationService.getNotification(severity, params);
    const soundFile: SoundFileKey =
      severity === 'normal' ? '1.mp3' : severity === 'urgent' ? '2.mp3' : '3.mp3';

    await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        sound: soundFile,
        data: { severity, soundFile },
      },
      trigger: null, // Immediate
    });

    // Play sound
    await this.playNotificationSound(soundFile);
  }

  /**
   * Get Shadow Fox status based on remaining time
   */
  getShadowFoxStatus(remainingMs: number, taskCompleted: boolean): ShadowFoxStatus {
    if (taskCompleted) return 'happy';
    if (remainingMs <= 0) return 'dead';

    const remainingHours = remainingMs / (1000 * 60 * 60);

    if (remainingHours > 12) return 'happy';
    if (remainingHours > 2) return 'tense';
    if (remainingHours > 0.25) return 'fading'; // 15 minutes
    return 'critical';
  }

  /**
   * Get push token
   */
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Get scheduled notification count
   */
  getScheduledCount(): number {
    return this.scheduledNotifications.length;
  }

  /**
   * Schedule a snooze reminder
   */
  async scheduleSnoozeReminder(minutesFromNow: number): Promise<void> {
    const notification = localizationService.getNotification('urgent', {
      minutes: minutesFromNow,
    });

    await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        sound: '2.mp3',
        data: { severity: 'urgent', soundFile: '2.mp3', isSnooze: true },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: minutesFromNow * 60,
      },
    });

    console.log(`[NotificationEngine] Snooze reminder scheduled for ${minutesFromNow} minutes`);
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    for (const sound of this.soundObjects.values()) {
      await sound.unloadAsync();
    }
    this.soundObjects.clear();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const notificationEngine = new NotificationEngine();
export default notificationEngine;
