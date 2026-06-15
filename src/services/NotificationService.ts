import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import SafeNotifications, { AndroidNotificationPriority, SchedulableTriggerInputTypes } from './safeNotifications';
import { supabase } from '../config/supabase';

// Configure how notifications behave when the app is in foreground
// Only set handler if NOT in Expo Go on Android (or other limited environments)
const isExpoGo = Constants.executionEnvironment === 'storeClient';

if (Device.isDevice && !(Platform.OS === 'android' && isExpoGo)) {
    SafeNotifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
            priority: AndroidNotificationPriority.HIGH,
        }),
    });
} else {
    console.log('Skipping Notifications.setNotificationHandler on Expo Go/Simulator');
}

export const NotificationService = {
    /**
     * Request permissions and get the Expo Push Token
     */
    registerForPushNotificationsAsync: async () => {
        try {
            // Check if we are running in Expo Go
            const isExpoGo = Constants.executionEnvironment === 'storeClient';

            if (Platform.OS === 'android' && isExpoGo) {
                // Skipping Push Notification registration on Expo Go Android (not supported in SDK 53+)
                return;
            }

            if (Platform.OS === 'android') {
                await SafeNotifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: 5, // AndroidImportance.MAX
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                });
            }

            if (Device.isDevice) {
                // On Android Expo Go, requesting push permissions often throws an error.
                // We wrap it in a try/catch to prevent the app from crashing.
                try {
                    const { status: existingStatus } = await SafeNotifications.getPermissionsAsync();
                    let finalStatus = existingStatus;

                    if (existingStatus !== 'granted') {
                        const { status } = await SafeNotifications.requestPermissionsAsync();
                        finalStatus = status;
                    }

                    if (finalStatus !== 'granted') {
                        console.log('Failed to get push token for push notification!');
                        return;
                    }

                    // Only get token if we have permission AND we are not in Expo Go (double check)
                    if (!isExpoGo) {
                        const token = (await SafeNotifications.getExpoPushTokenAsync({
                            projectId: Constants.expoConfig?.extra?.eas?.projectId,
                        })).data;
                        if (__DEV__) console.log('Expo Push Token:', token);

                        // Save push token to user's profile for server-side push
                        try {
                            const { data: { session } } = await supabase.auth.getSession();
                            if (session?.user?.id && token) {
                                await supabase.from('profiles').update({
                                    expo_push_token: token,
                                    updated_at: new Date().toISOString(),
                                }).eq('id', session.user.id);
                            }
                        } catch (saveErr) {
                            console.warn('[NotificationService] Failed to save push token to server:', saveErr);
                        }
                    }

                } catch (e) {
                    console.warn('Error requesting permissions:', e);
                    return;
                }
            } else {
                console.log('Must use physical device for Push Notifications');
            }
        } catch (e) {
            console.error('Registration failed:', e);
        }
    },

    /**
     * Schedule a daily reminder notification
     */
    scheduleDailyReminder: async () => {
        try {
            // Cancel existing to avoid duplicates
            await SafeNotifications.cancelAllScheduledNotificationsAsync();

            // DAILY trigger repeats daily at a fixed hour:minute
            // Note: CALENDAR trigger is NOT supported on Android, use DAILY instead
            const dailyTrigger = Platform.OS === 'android'
                ? {
                    type: SchedulableTriggerInputTypes.DAILY,
                    hour: 10,
                    minute: 0,
                }
                : {
                    type: SchedulableTriggerInputTypes.CALENDAR,
                    hour: 10,
                    minute: 0,
                    repeats: true,
                };

            const eveningTrigger = Platform.OS === 'android'
                ? {
                    type: SchedulableTriggerInputTypes.DAILY,
                    hour: 20,
                    minute: 0,
                }
                : {
                    type: SchedulableTriggerInputTypes.CALENDAR,
                    hour: 20,
                    minute: 0,
                    repeats: true,
                };

            // 1. Daily Study Reminder (10:00 AM)
            await SafeNotifications.scheduleNotificationAsync({
                content: {
                    title: "Time to learn! 🧠",
                    body: "Keep your streak alive! Take a quick 5-min lesson.",
                    sound: true,
                },
                trigger: dailyTrigger,
            });

            // 2. Evening Streak Saver (8:00 PM)
            await SafeNotifications.scheduleNotificationAsync({
                content: {
                    title: "Streak Danger! 🔥",
                    body: "Don't lose your progress. Complete a lesson now!",
                    sound: true,
                },
                trigger: eveningTrigger,
            });

            console.log("Notifications scheduled.");
        } catch (e) {
            console.error('Error scheduling notifications:', e);
        }
    },

    /**
     * Test notification (Immediate)
     */
    scheduleTestNotification: async () => {
        try {
            await SafeNotifications.scheduleNotificationAsync({
                content: {
                    title: "Test Notification 📬",
                    body: "This is a test notification from Neuralis.",
                    data: { data: 'goes here' },
                },
                trigger: null, // Immediate
            });
        } catch (e) {
            console.error('Error scheduling test notification:', e);
        }
    }
};
