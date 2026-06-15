/**
 * Jest Setup File
 *
 * Global mocks and test environment configuration for Neuralis.
 */

import '@testing-library/react-native/extend-expect';

// ─── Mock AsyncStorage ──────────────────────────────────────────────────────
jest.mock('@react-native-async-storage/async-storage', () => ({
    setItem: jest.fn(() => Promise.resolve()),
    getItem: jest.fn(() => Promise.resolve(null)),
    removeItem: jest.fn(() => Promise.resolve()),
    multiSet: jest.fn(() => Promise.resolve()),
    multiGet: jest.fn(() => Promise.resolve([])),
    multiRemove: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
    getAllKeys: jest.fn(() => Promise.resolve([])),
}));

// ─── Mock expo-linear-gradient ──────────────────────────────────────────────
jest.mock('expo-linear-gradient', () => {
    const { View } = require('react-native');
    return {
        LinearGradient: (props: any) => View(props),
    };
});

// ─── Mock expo-haptics ──────────────────────────────────────────────────────
jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn(),
    notificationAsync: jest.fn(),
    selectionAsync: jest.fn(),
    ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
    NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// ─── Mock expo-blur ────────────────────────────────────────────────────────
jest.mock('expo-blur', () => {
    const { View } = require('react-native');
    return {
        BlurView: (props: any) => View(props),
    };
});

// ─── Mock expo-constants ────────────────────────────────────────────────────
jest.mock('expo-constants', () => ({
    expoConfig: {
        extra: {
            eas: { projectId: 'test-project-id' },
        },
    },
}));

// ─── Mock expo-router ───────────────────────────────────────────────────────
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
        canGoBack: jest.fn(() => true),
    }),
    useLocalSearchParams: () => ({}),
    useSegments: () => [],
    Slot: ({ children }: any) => children,
    Link: ({ children }: any) => children,
    Stack: {
        Screen: () => null,
    },
}));

// ─── Mock react-native-reanimated ───────────────────────────────────────────
jest.mock('react-native-reanimated', () => {
    const Reanimated = require('react-native-reanimated/mock');
    Reanimated.default.call = () => { };
    return Reanimated;
});

// ─── Mock lucide-react-native ───────────────────────────────────────────────
jest.mock('lucide-react-native', () => {
    const { View } = require('react-native');
    return new Proxy(
        {},
        {
            get: (_target: any, name: string) => {
                if (name === '__esModule') return true;
                return (props: any) => View({ ...props, testID: `icon-${name}` });
            },
        }
    );
});

// ─── Mock Supabase ──────────────────────────────────────────────────────────
jest.mock('./src/config/supabase', () => ({
    supabase: {
        from: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            upsert: jest.fn().mockReturnThis(),
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
        })),
        auth: {
            getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
            onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
            signInWithPassword: jest.fn(),
            signOut: jest.fn(),
        },
    },
}));

// ─── Silence console warnings in tests ──────────────────────────────────────
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Animated')) return;
    originalWarn(...args);
};
