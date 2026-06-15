/**
 * NEURALIS - Streak Recovery Service
 * Streak kaybedildiğinde 24 saat içinde kurtarma şansı
 * 3 ders + 1 mükemmel skor gerekli
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface StreakRecoveryChallenge {
    id: string;
    userId: string;
    lostStreak: number;
    startedAt: string;
    expiresAt: string;
    requirements: {
        lessonsNeeded: number;
        lessonsCompleted: number;
        perfectScoreNeeded: boolean;
        perfectScoreAchieved: boolean;
    };
    status: 'active' | 'completed' | 'expired' | 'failed';
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = '@neuralis/streak_recovery';
const RECOVERY_WINDOW_HOURS = 24;
const LESSONS_REQUIRED = 3;

class StreakRecoveryService {
    async checkRecoveryAvailable(userId: string): Promise<StreakRecoveryChallenge | null> {
        try {
            const raw = await AsyncStorage.getItem(`${STORAGE_KEY}_${userId}`);
            if (!raw) return null;
            const challenge: StreakRecoveryChallenge = JSON.parse(raw);
            if (challenge.status !== 'active') return null;
            if (new Date(challenge.expiresAt) < new Date()) {
                challenge.status = 'expired';
                await this.saveChallenge(userId, challenge);
                return null;
            }
            return challenge;
        } catch { return null; }
    }

    async initiateRecovery(userId: string, lostStreak: number): Promise<StreakRecoveryChallenge> {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + RECOVERY_WINDOW_HOURS * 60 * 60 * 1000);

        const challenge: StreakRecoveryChallenge = {
            id: `recovery_${Date.now()}`,
            userId,
            lostStreak,
            startedAt: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
            requirements: {
                lessonsNeeded: LESSONS_REQUIRED,
                lessonsCompleted: 0,
                perfectScoreNeeded: true,
                perfectScoreAchieved: false,
            },
            status: 'active',
        };

        await this.saveChallenge(userId, challenge);
        return challenge;
    }

    async recordLessonCompletion(userId: string, accuracy: number): Promise<StreakRecoveryChallenge | null> {
        const challenge = await this.checkRecoveryAvailable(userId);
        if (!challenge) return null;

        challenge.requirements.lessonsCompleted += 1;
        if (accuracy >= 1.0) {
            challenge.requirements.perfectScoreAchieved = true;
        }

        // Check if challenge is complete
        if (challenge.requirements.lessonsCompleted >= challenge.requirements.lessonsNeeded &&
            challenge.requirements.perfectScoreAchieved) {
            challenge.status = 'completed';
            // Restore streak
            await this.restoreStreak(userId, challenge.lostStreak);
        }

        await this.saveChallenge(userId, challenge);
        return challenge;
    }

    private async restoreStreak(userId: string, streak: number): Promise<void> {
        try {
            await supabase.from('profiles').update({
                current_streak: streak,
                last_lesson_at: new Date().toISOString(),
            }).eq('id', userId);
        } catch (e) { console.warn('Failed to restore streak:', e); }
    }

    async getTimeRemaining(challenge: StreakRecoveryChallenge): Promise<{ hours: number; minutes: number }> {
        const now = new Date().getTime();
        const expires = new Date(challenge.expiresAt).getTime();
        const diff = Math.max(0, expires - now);
        return {
            hours: Math.floor(diff / (1000 * 60 * 60)),
            minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        };
    }

    private async saveChallenge(userId: string, challenge: StreakRecoveryChallenge): Promise<void> {
        await AsyncStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(challenge));
    }

    async dismissRecovery(userId: string): Promise<void> {
        await AsyncStorage.removeItem(`${STORAGE_KEY}_${userId}`);
    }
}

export const streakRecoveryService = new StreakRecoveryService();
