/**
 * NEURALIS - Supabase Client Configuration
 *
 * Initializes the Supabase client with secure token storage.
 * Auth tokens are stored in expo-secure-store (encrypted) instead of AsyncStorage (plaintext).
 */

import Constants from 'expo-constants';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

let SecureStore: typeof import('expo-secure-store') | null = null;
try {
  SecureStore = require('expo-secure-store');
} catch {
  // Native module not available (e.g. Expo Go) — will fall back to AsyncStorage
  if (__DEV__)
    console.warn('[Supabase] expo-secure-store not available, falling back to AsyncStorage');
}

// ═══════════════════════════════════════════════════════════════════════════
// SECURE STORAGE ADAPTER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Custom storage adapter using expo-secure-store for encrypted token persistence.
 * SecureStore uses Keychain on iOS and EncryptedSharedPreferences on Android.
 */
const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (SecureStore) return await SecureStore.getItemAsync(key);
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (SecureStore) await SecureStore.setItemAsync(key, value);
      else await AsyncStorage.setItem(key, value);
    } catch (error) {
      if (__DEV__) console.warn('[SecureStore] Failed to save:', key, error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (SecureStore) await SecureStore.deleteItemAsync(key);
      else await AsyncStorage.removeItem(key);
    } catch (error) {
      if (__DEV__) console.warn('[SecureStore] Failed to remove:', key, error);
    }
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

/** Expo config extras — read from app.json or EAS build config */
const expoExtra: Record<string, string | undefined> =
  (Constants.expoConfig?.extra as Record<string, string | undefined>) ?? {};

const supabaseUrl = expoExtra.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey =
  expoExtra.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

function makeStubClient(): any {
  const auth = {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: (_cb: any) => ({
      data: {
        subscription: {
          unsubscribe: () => {
            /* noop */
          },
        },
      },
    }),
  };

  const from = (_table: string) => ({
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({ data: null, error: null }),
      }),
    }),
  });

  return { auth, from } as any;
}

let supabaseClient: SupabaseClient | (Partial<SupabaseClient> & { auth: any; from: any });

if (supabaseUrl && supabaseAnonKey) {
  // Configure Supabase with encrypted SecureStore for auth session persistence
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: SecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // Not needed in React Native
    },
  });
} else {
  if (__DEV__) {
    console.warn('Supabase URL or Anon key missing in expo extras or env; using stub client.');
  }
  supabaseClient = makeStubClient();
}

export const supabase = supabaseClient as unknown as SupabaseClient;
