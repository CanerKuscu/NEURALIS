/**
 * DailyLessonService - Daily Lesson Limit & Ad System
 * 
 * Free Users:  2 lessons per day
 * Ad Reward:   1 ad = 1 extra lesson (unlimited ads can be watched)
 * Premium:     Unlimited lessons
 * 
 * With lesson caching, AI costs are reduced ~90%
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import i18n from '../i18n';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

export const DAILY_LESSON_CONFIG = {
    /** Free users: daily lesson limit */
    FREE_DAILY_LIMIT: 2,
    /** Number of ads to watch for 1 extra lesson */
    ADS_PER_EXTRA_LESSON: 1,
    /** Premium users: unlimited */
    PREMIUM_UNLIMITED: true,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface DailyLessonData {
    /** Lessons completed today */
    lessonsCompletedToday: number;
    /** Total ads watched today */
    adsWatchedToday: number;
    /** Extra lessons earned from ads */
    extraLessonsFromAds: number;
    /** Ads remaining until next extra lesson */
    adsUntilNextLesson: number;
    /** Total lessons available today */
    totalLessonsAvailable: number;
    /** Remaining lessons */
    remainingLessons: number;
    /** Can watch ad (always true for free users) */
    canWatchAd: boolean;
    /** Can start a lesson? */
    canStartLesson: boolean;
    /** Is premium user? */
    isPremium: boolean;
    /** First run (first 2 lessons)? */
    isFirstRun: boolean;
    /** Today's date (YYYY-MM-DD) */
    date: string;
}

interface StoredDailyData {
    date: string;
    lessonsCompleted: number;
    adsWatched: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = '@neuralis_daily_lessons';

class DailyLessonService {
    /**
     * Bugünün tarihini al (YYYY-MM-DD)
     */
    private getToday(): string {
        return new Date().toISOString().split('T')[0];
    }

    /**
     * Yerel depolama verisini al
     */
    private async getStoredData(): Promise<StoredDailyData> {
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            if (raw) {
                const data: StoredDailyData = JSON.parse(raw);
                // Eğer farklı bir gün ise sıfırla
                if (data.date !== this.getToday()) {
                    return { date: this.getToday(), lessonsCompleted: 0, adsWatched: 0 };
                }
                return data;
            }
        } catch (e) {
            console.error('DailyLessonService: getStoredData error', e);
        }
        return { date: this.getToday(), lessonsCompleted: 0, adsWatched: 0 };
    }

    /**
     * Yerel depolama verisini kaydet
     */
    private async saveStoredData(data: StoredDailyData): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('DailyLessonService: saveStoredData error', e);
        }
    }

    /**
     * Check if user is premium
     */
    private async checkPremium(userId: string): Promise<boolean> {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('is_premium')
                .eq('id', userId)
                .single();
            return data?.is_premium === true;
        } catch {
            return false;
        }
    }

    /**
     * Günlük ders durumunu al
     */
    async getDailyStatus(userId: string): Promise<DailyLessonData> {
        const isPremium = await this.checkPremium(userId);
        const stored = await this.getStoredData();
        const today = this.getToday();

        // Gün değiştiyse sıfırla
        if (stored.date !== today) {
            stored.date = today;
            stored.lessonsCompleted = 0;
            stored.adsWatched = 0;
            await this.saveStoredData(stored);
        }

        // First Run Check: first 2 lessons without ads or limits
        let totalLessonsEver = 0;
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('lessons_completed')
                .eq('id', userId)
                .single();
            totalLessonsEver = profile?.lessons_completed || 0;
        } catch {
            // Ignore - field may not exist yet
        }

        const isFirstRun = totalLessonsEver < 2;

        if (isFirstRun) {
            return {
                lessonsCompletedToday: stored.lessonsCompleted,
                adsWatchedToday: 0,
                extraLessonsFromAds: 0,
                adsUntilNextLesson: 0,
                totalLessonsAvailable: Infinity,
                remainingLessons: Infinity,
                canWatchAd: false,
                canStartLesson: true,
                isPremium: false,
                isFirstRun: true,
                date: today,
            };
        }

        if (isPremium) {
            return {
                lessonsCompletedToday: stored.lessonsCompleted,
                adsWatchedToday: 0,
                extraLessonsFromAds: 0,
                adsUntilNextLesson: 0,
                totalLessonsAvailable: Infinity,
                remainingLessons: Infinity,
                canWatchAd: false,
                canStartLesson: true,
                isPremium: true,
                isFirstRun: false,
                date: today,
            };
        }

        const extraLessons = Math.floor(stored.adsWatched / DAILY_LESSON_CONFIG.ADS_PER_EXTRA_LESSON);
        const adsUntilNext = DAILY_LESSON_CONFIG.ADS_PER_EXTRA_LESSON - (stored.adsWatched % DAILY_LESSON_CONFIG.ADS_PER_EXTRA_LESSON);
        const totalAvailable = DAILY_LESSON_CONFIG.FREE_DAILY_LIMIT + extraLessons;
        const remaining = Math.max(0, totalAvailable - stored.lessonsCompleted);

        return {
            lessonsCompletedToday: stored.lessonsCompleted,
            adsWatchedToday: stored.adsWatched,
            extraLessonsFromAds: extraLessons,
            adsUntilNextLesson: remaining > 0 ? 0 : adsUntilNext,
            totalLessonsAvailable: totalAvailable,
            remainingLessons: remaining,
            canWatchAd: remaining <= 0,
            canStartLesson: remaining > 0,
            isPremium: false,
            isFirstRun: false,
            date: today,
        };
    }

    /**
     * Ders tamamlandığında çağır
     */
    async recordLessonCompleted(userId: string): Promise<DailyLessonData> {
        const stored = await this.getStoredData();
        const today = this.getToday();

        if (stored.date !== today) {
            stored.date = today;
            stored.lessonsCompleted = 0;
            stored.adsWatched = 0;
        }

        stored.lessonsCompleted += 1;
        await this.saveStoredData(stored);

        // Save to server
        try {
            await supabase.from('daily_lesson_tracking').upsert({
                user_id: userId,
                date: today,
                lessons_completed: stored.lessonsCompleted,
                ads_watched: stored.adsWatched,
                language: i18n.locale || 'tr',
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id,date' });
        } catch (e) {
            console.warn('DailyLessonService: server sync failed', e);
        }

        return this.getDailyStatus(userId);
    }

    /**
     * Ad watched - add extra lesson credit
     */
    async recordAdWatched(userId: string): Promise<{
        success: boolean;
        message: string;
        data: DailyLessonData;
    }> {
        const stored = await this.getStoredData();
        const today = this.getToday();

        if (stored.date !== today) {
            stored.date = today;
            stored.lessonsCompleted = 0;
            stored.adsWatched = 0;
        }

        stored.adsWatched += 1;
        await this.saveStoredData(stored);

        // Save to server
        try {
            await supabase.from('daily_lesson_tracking').upsert({
                user_id: userId,
                date: today,
                lessons_completed: stored.lessonsCompleted,
                ads_watched: stored.adsWatched,
                language: i18n.locale || 'tr',
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id,date' });
        } catch (e) {
            console.warn('DailyLessonService: server sync failed', e);
        }

        return {
            success: true,
            message: `Ad watched! (${stored.adsWatched % DAILY_LESSON_CONFIG.ADS_PER_EXTRA_LESSON}/${DAILY_LESSON_CONFIG.ADS_PER_EXTRA_LESSON})`,
            data: await this.getDailyStatus(userId),
        };
    }

    /**
     * Quick check if user can start a lesson
     */
    async canStartLesson(userId: string): Promise<boolean> {
        const status = await this.getDailyStatus(userId);
        return status.canStartLesson;
    }
}

export const dailyLessonService = new DailyLessonService();
export default dailyLessonService;
