import { supabase } from '../config/supabase';
import { StreakData, StreakState, StreakHistoryEntry, UserProfile } from '../types';
// ...existing code...

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const STREAK_WINDOW_HOURS = 24;
const WARNING_THRESHOLD_HOURS = 4; // Warning at 4 hours remaining
const NEURAL_DECAY_THRESHOLD_HOURS = 2; // Neural decay at 2 hours remaining
const CRITICAL_THRESHOLD_MINUTES = 30; // Critical at 30 minutes remaining

// ═══════════════════════════════════════════════════════════════════════════
// STREAK STATE CALCULATOR
// ═══════════════════════════════════════════════════════════════════════════

export const calculateStreakState = (deadlineAt: number): StreakState => {
    const now = Date.now();
    const timeRemaining = deadlineAt - now;
    const hoursRemaining = timeRemaining / (1000 * 60 * 60);
    const minutesRemaining = timeRemaining / (1000 * 60);

    if (timeRemaining <= 0) {
        return 'dead';
    }

    if (minutesRemaining <= CRITICAL_THRESHOLD_MINUTES) {
        return 'critical';
    }

    if (hoursRemaining <= NEURAL_DECAY_THRESHOLD_HOURS) {
        return 'neural_decay';
    }

    if (hoursRemaining <= WARNING_THRESHOLD_HOURS) {
        return 'warning';
    }

    return 'healthy';
};

export const getTimeUntilDeadline = (deadlineAt: number): number => {
    return Math.max(0, deadlineAt - Date.now());
};

export const formatTimeRemaining = (ms: number): string => {
    if (ms <= 0) return '00:00:00';

    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// ═══════════════════════════════════════════════════════════════════════════
// STREAK SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════

class StreakService {
    private listeners: Map<string, () => void> = new Map();

    /**
     * Initialize streak data for a new user
     */
    async initializeStreak(userId: string): Promise<StreakData> {
        const now = Date.now();
        const deadline = now + STREAK_WINDOW_HOURS * 60 * 60 * 1000;

        const streakData: StreakData = {
            userId,
            currentStreak: 0,
            streakStartedAt: now,
            lastCompletedAt: 0,
            deadlineAt: deadline,
            state: 'healthy',
            mercyUsedToday: false,
            totalMerciesUsed: 0,
            streakHistory: [],
        };


        // Supabase insert (defensive: tolerate missing-table schema cache errors)
        try {
            const { error } = await supabase.from('streaks').upsert({
                ...streakData,
            });
            if (error) {
                console.error('[StreakService] Failed to upsert streak row:', error);
                const details = String(error?.details || '').toLowerCase();
                const message = String(error?.message || '').toLowerCase();
                const isMissingTable = error?.code === 'PGRST205' || details.includes('could not find') || message.includes('could not find') || message.includes('table');
                if (isMissingTable) {
                    console.warn('[StreakService] Missing table detected; continuing without persisting streak.');
                } else {
                    throw error;
                }
            }
        } catch (err) {
            console.error('[StreakService] Unexpected error during streak upsert:', err);
        }

        return streakData;
    }

    /**
     * Get current streak data
     */
    async getStreakData(userId: string): Promise<StreakData | null> {
        const { data, error } = await supabase
            .from('streaks')
            .select('*')
            .eq('userId', userId)
            .single();
        if (error || !data) {
            return null;
        }
        return data as StreakData;
    }

    /**
     * Subscribe to real-time streak updates
     */
    // Example code for live listening with Supabase Realtime (trigger must be added to table)
    // Currently disabled or can be done with polling.
    subscribeToStreak(
        userId: string,
        callback: (streak: StreakData | null, state: StreakState) => void
    ): () => void {
        // Not implemented: Supabase Realtime subscription
        // TODO: Implement with supabase.realtime if needed
        return () => { };
    }

    /**
     * Complete daily activity and extend streak
     */
    async completeDaily(userId: string): Promise<StreakData> {
        const streakData = await this.getStreakData(userId);
        const now = Date.now();

        if (!streakData) {
            return this.initializeStreak(userId);
        }

        // Calculate new deadline (24 hours from now)
        const newDeadline = now + STREAK_WINDOW_HOURS * 60 * 60 * 1000;

        // Increment streak
        const newStreak = streakData.currentStreak + 1;

        // Add to history
        const historyEntry: StreakHistoryEntry = {
            date: new Date(now).toISOString().split('T')[0],
            completed: true,
            energySpent: 0, // Will be updated by energy service
            tasksCompleted: 1,
            mercyUsed: false,
        };

        const updatedHistory = [...(streakData.streakHistory || []), historyEntry];

        await supabase.from('streaks').update({
            currentStreak: newStreak,
            lastCompletedAt: now,
            deadlineAt: newDeadline,
            state: 'healthy',
            decayStartedAt: null,
            mercyUsedToday: false,
            streakHistory: updatedHistory,
        }).eq('userId', userId);

        // Update user profile

        await this.updateUserStreakStats(userId, newStreak);

        return {
            ...streakData,
            currentStreak: newStreak,
            lastCompletedAt: now,
            deadlineAt: newDeadline,
            state: 'healthy',
            mercyUsedToday: false,
            streakHistory: updatedHistory,
        };
    }

    /**
     * Use Final Mercy challenge to save streak
     */
    async useMercy(userId: string, challengeCompleted: boolean): Promise<boolean> {
        const streakData = await this.getStreakData(userId);

        if (!streakData) return false;
        if (streakData.mercyUsedToday) return false;
        if (streakData.state !== 'critical') return false;

        if (challengeCompleted) {
            // Mercy successful - extend deadline by 2 hours
            const newDeadline = Date.now() + 2 * 60 * 60 * 1000;


            await supabase.from('streaks').update({
                deadlineAt: newDeadline,
                mercyUsedToday: true,
                totalMerciesUsed: streakData.totalMerciesUsed + 1,
                state: 'warning',
            }).eq('userId', userId);

            return true;
        } else {
            // Mercy failed - streak dies
            await this.killStreak(userId, 'mercy_failed');
            return false;
        }
    }

    /**
     * Kill the streak (missed deadline or failed mercy)
     * SOFT PENALTY: Instead of resetting to 0, reduce by 20% (min 1)
     * STREAK FREEZE: If available, use it instead of penalizing
     */
    async killStreak(
        userId: string,
        reason: 'missed_deadline' | 'mercy_failed' | 'synapse_break'
    ): Promise<void> {
        const streakData = await this.getStreakData(userId);
        const now = Date.now();

        if (!streakData) return;

        // Check for Streak Freeze
        const { data: profile } = await supabase
            .from('profiles')
            .select('streak_freeze_available')
            .eq('id', userId)
            .single();

        const hasFreezeAvailable = profile?.streak_freeze_available === true;

        if (hasFreezeAvailable && reason === 'missed_deadline') {
            // Use streak freeze — no penalty, just consume the freeze
            await supabase.from('profiles').update({
                streak_freeze_available: false,
                streak_freeze_used_at: new Date().toISOString(),
            }).eq('id', userId);

            // Extend deadline without penalty
            await supabase.from('streaks').update({
                deadlineAt: now + STREAK_WINDOW_HOURS * 60 * 60 * 1000,
                state: 'healthy',
                decayStartedAt: null,
                mercyUsedToday: false,
            }).eq('userId', userId);

            console.log('[StreakService] Streak Freeze used! No penalty.');
            return;
        }

        // Soft penalty: reduce by 20%, minimum 1 (instead of 0)
        const currentStreak = streakData.currentStreak || 0;
        const penalizedStreak = currentStreak > 1
            ? Math.max(1, Math.floor(currentStreak * 0.8))
            : 0;

        await supabase.from('streaks').update({
            currentStreak: penalizedStreak,
            streakStartedAt: now,
            deadlineAt: now + STREAK_WINDOW_HOURS * 60 * 60 * 1000,
            state: penalizedStreak > 0 ? 'healthy' : 'dead',
            decayStartedAt: null,
            mercyUsedToday: false,
        }).eq('userId', userId);

        // Update user profile (longest_streak is never decreased)
        await this.updateUserStreakStats(userId, penalizedStreak);
    }

    /**
     * Update streak state (for real-time state transitions)
     */
    private async updateStreakState(userId: string, state: StreakState): Promise<void> {
        const updateData: Record<string, unknown> = { state };
        if (state === 'neural_decay') {
            updateData.decayStartedAt = Date.now();
        }
        await supabase.from('streaks').update(updateData).eq('userId', userId);
    }

    /**
     * Update user profile with streak stats
     */
    private async updateUserStreakStats(userId: string, currentStreak: number): Promise<void> {
        // Update user profile in Supabase (profiles table)
        // Use snake_case columns from migrations/20260127_create_profiles.sql
        const { data } = await supabase
            .from('profiles')
            .select('longest_streak')
            .eq('id', userId)
            .maybeSingle();

        const prevLongest = Number(data?.longest_streak ?? 0);
        const longestStreak = Math.max(prevLongest, currentStreak);

        // Best-effort update; ignore if schema differs
        try {
            const nowIso = new Date().toISOString();
            await supabase.from('profiles').update({
                current_streak: currentStreak,
                longest_streak: longestStreak,
                last_activity_at: nowIso,
                updated_at: nowIso,
            } as any).eq('id', userId);
        } catch {
            // ignore
        }
    }

    /**
     * Parse data to StreakData type
     */
    // Parse function not needed; data is returned directly from Supabase.
    // private parseStreakData(data: Record<string, unknown>): StreakData {
    //     ...
    // }

    /**
     * Cleanup listeners
     */
    unsubscribe(userId: string): void {
        const unsubscribe = this.listeners.get(userId);
        if (unsubscribe) {
            unsubscribe();
            this.listeners.delete(userId);
        }
    }

    /**
     * Cleanup all listeners
     */
    cleanup(): void {
        this.listeners.forEach((unsubscribe) => unsubscribe());
        this.listeners.clear();
    }
}

export const streakService = new StreakService();
export default streakService;
