/**
 * useUserStore - User State Management Hook
 * Zustand store synchronized with Supabase for user profile & lives data.
 */

import { create } from 'zustand';
import { supabase } from '../config/supabase';
import { livesService, LivesData } from '../services/LivesService';

/** User profile shape as stored in the Zustand store */
interface UserProfile {
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
    isPremium: boolean;
    totalXP: number;
    currentStreak: number;
    longestStreak: number;
    currentLeague: string;
    lessonsCompleted: number;
    accuracyRate: number;
    locale: string;
    createdAt: string;
}

/** Store state shape */
interface UserState {
    // State
    user: UserProfile | null;
    lives: LivesData | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    error: string | null;

    // Setters
    setUser: (user: UserProfile | null) => void;
    setLives: (lives: LivesData | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;

    // API actions
    fetchUser: () => Promise<void>;
    fetchLives: () => Promise<void>;
    loseLife: () => Promise<void>;
    watchAdForLife: () => Promise<{ success: boolean; message: string }>;
    updateStreak: (newStreak: number) => void;
    addXP: (amount: number) => void;
    logout: () => Promise<void>;
}

/** Default values */
const initialLives: LivesData = {
    current: 5,
    max: 5,
    lastLostAt: null,
    nextRegenAt: null,
    isPremium: false,
};

export const useUserStore = create<UserState>((set, get) => ({
    // Initial state
    user: null,
    lives: initialLives,
    isLoading: false,
    isAuthenticated: false,
    error: null,

    // Simple setters
    setUser: (user) => set({ user, isAuthenticated: !!user }),
    setLives: (lives) => set({ lives }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),

    // Fetch user profile from Supabase
    fetchUser: async () => {
        try {
            set({ isLoading: true, error: null });

            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                set({ user: null, isAuthenticated: false, isLoading: false });
                return;
            }

            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            const userProfile: UserProfile = {
                id: profile.id,
                email: user.email || '',
                displayName: profile.display_name || 'User',
                avatarUrl: profile.avatar_url,
                isPremium: profile.is_premium || false,
                totalXP: profile.total_xp || 0,
                currentStreak: profile.current_streak || 0,
                longestStreak: profile.longest_streak || 0,
                currentLeague: profile.current_league || 'bronze',
                lessonsCompleted: profile.lessons_completed || 0,
                accuracyRate: profile.accuracy_rate || 0,
                locale: profile.locale || 'tr',
                createdAt: profile.created_at,
            };

            set({ user: userProfile, isAuthenticated: true, isLoading: false });

            // Also fetch lives data
            get().fetchLives();
        } catch (error: any) {
            console.error('Failed to fetch user:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    // Fetch lives data
    fetchLives: async () => {
        const { user } = get();
        if (!user) return;

        try {
            const lives = await livesService.getLives(user.id);
            set({ lives });
        } catch (error: any) {
            console.error('Failed to fetch lives:', error);
        }
    },

    // Lose a life
    loseLife: async () => {
        const { user, lives } = get();
        if (!user || !lives) return;

        try {
            const newLives = await livesService.loseLife(user.id);
            set({ lives: newLives });
        } catch (error: any) {
            console.error('Failed to lose life:', error);
        }
    },

    // Watch ad to earn a life
    watchAdForLife: async () => {
        const { user } = get();
        if (!user) {
            return { success: false, message: 'You must be logged in.' };
        }

        try {
            const result = await livesService.watchAdForLife(user.id);
            if (result.success) {
                set({ lives: result.lives });
            }
            return { success: result.success, message: result.message };
        } catch (error: any) {
            console.error('Failed to watch ad for life:', error);
            return { success: false, message: 'Something went wrong.' };
        }
    },

    // Update streak count
    updateStreak: (newStreak) => {
        const { user } = get();
        if (!user) return;

        set({
            user: {
                ...user,
                currentStreak: newStreak,
                longestStreak: Math.max(user.longestStreak, newStreak),
            },
        });
    },

    // Add XP
    addXP: (amount) => {
        const { user } = get();
        if (!user) return;

        set({
            user: {
                ...user,
                totalXP: user.totalXP + amount,
            },
        });
    },

    // Sign out
    logout: async () => {
        try {
            await supabase.auth.signOut();
            set({
                user: null,
                lives: initialLives,
                isAuthenticated: false,
                error: null,
            });
        } catch (error: any) {
            console.error('Failed to logout:', error);
            set({ error: error.message });
        }
    },
}));

// Selector hooks
export const useUser = () => useUserStore((state) => state.user);
export const useLives = () => useUserStore((state) => state.lives);
export const useIsAuthenticated = () => useUserStore((state) => state.isAuthenticated);
export const useIsLoading = () => useUserStore((state) => state.isLoading);

export default useUserStore;
