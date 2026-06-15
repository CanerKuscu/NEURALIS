import { Platform } from 'react-native';
import Constants from 'expo-constants';

const isExpoGoOnAndroid = Platform.OS === 'android' && Constants.appOwnership === 'expo';

// Minimal type exports to keep strict TypeScript builds passing even when
// `expo-notifications` is not available (e.g., Expo Go on Android).
export type NotificationPermissionsStatus = 'granted' | 'denied' | 'undetermined' | string;
export type Notification = any;
export type NotificationResponse = any;

// Keep the same shape as expo-notifications enums used in the codebase.
export const SchedulableTriggerInputTypes = {
    DATE: 'date',
    TIME_INTERVAL: 'timeInterval',
    CALENDAR: 'calendar',
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    YEARLY: 'yearly',
} as const;

async function getModule(): Promise<any | null> {
    if (isExpoGoOnAndroid) return null;
    try {
        // dynamic import to avoid importing expo-notifications at module-eval time
        const mod = await import('expo-notifications');
        return mod;
    } catch (e) {
        return null;
    }
}

export async function getPermissionsAsync(): Promise<any> {
    const m = await getModule();
    if (!m) return { status: 'granted' };
    return m.getPermissionsAsync();
}

export async function requestPermissionsAsync(): Promise<any> {
    const m = await getModule();
    if (!m) return { status: 'granted' };
    return m.requestPermissionsAsync();
}

export async function setNotificationChannelAsync(...args: any[]): Promise<void> {
    const m = await getModule();
    if (!m) return;
    return m.setNotificationChannelAsync(...args);
}

export async function scheduleNotificationAsync(...args: any[]): Promise<any> {
    const m = await getModule();
    if (!m) return null;
    return m.scheduleNotificationAsync(...args);
}

export async function cancelAllScheduledNotificationsAsync(): Promise<void> {
    const m = await getModule();
    if (!m?.cancelAllScheduledNotificationsAsync) return;
    await m.cancelAllScheduledNotificationsAsync();
}

export async function dismissAllNotificationsAsync(): Promise<void> {
    const m = await getModule();
    if (!m?.dismissAllNotificationsAsync) return;
    await m.dismissAllNotificationsAsync();
}

export async function getBadgeCountAsync(): Promise<number> {
    const m = await getModule();
    if (!m?.getBadgeCountAsync) return 0;
    return m.getBadgeCountAsync();
}

export async function setBadgeCountAsync(count: number): Promise<void> {
    const m = await getModule();
    if (!m?.setBadgeCountAsync) return;
    await m.setBadgeCountAsync(count);
}

export function setNotificationHandler(handler: any): void {
    // call when module available
    getModule().then((m) => m?.setNotificationHandler && m.setNotificationHandler(handler)).catch(() => { });
}

export function addNotificationReceivedListener(cb: any): { remove: () => void } {
    let sub: any = null;
    getModule().then((m) => { if (m?.addNotificationReceivedListener) sub = m.addNotificationReceivedListener(cb); }).catch(() => { });
    return { remove: () => { if (sub?.remove) sub.remove(); } };
}

export function addNotificationResponseReceivedListener(cb: any): { remove: () => void } {
    let sub: any = null;
    getModule().then((m) => { if (m?.addNotificationResponseReceivedListener) sub = m.addNotificationResponseReceivedListener(cb); }).catch(() => { });
    return { remove: () => { if (sub?.remove) sub.remove(); } };
}

export async function getExpoPushTokenAsync(opts?: any): Promise<any> {
    const m = await getModule();
    if (!m) throw new Error('Push token not available in Expo Go');
    return m.getExpoPushTokenAsync(opts);
}

export const AndroidNotificationPriority = {
    MAX: 2,
    HIGH: 1,
    DEFAULT: 0,
};

export const AndroidImportance = {
    MAX: 5,
    HIGH: 4,
    DEFAULT: 3,
};

export default {
    getPermissionsAsync,
    requestPermissionsAsync,
    setNotificationChannelAsync,
    scheduleNotificationAsync,
    cancelAllScheduledNotificationsAsync,
    dismissAllNotificationsAsync,
    getBadgeCountAsync,
    setBadgeCountAsync,
    setNotificationHandler,
    addNotificationReceivedListener,
    addNotificationResponseReceivedListener,
    getExpoPushTokenAsync,
    AndroidNotificationPriority,
    AndroidImportance,
    SchedulableTriggerInputTypes,
};
