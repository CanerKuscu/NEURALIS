/**
 * NEURALIS - Smart Notification Service
 * Kullanıcının en aktif saatlerini tespit edip bildirimleri optimize eder
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ActivityLog {
    hour: number; // 0-23
    dayOfWeek: number; // 0-6
    count: number;
}

export interface SmartSchedule {
    bestHour: number;
    bestDayOfWeek: number;
    peakHours: number[]; // top 3 hours
    leastActiveHours: number[];
    totalSessions: number;
    averageSessionsPerDay: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = '@neuralis/activity_log';

class SmartNotificationService {
    /**
     * Record user activity (call this when user opens app or completes a lesson)
     */
    async recordActivity(userId: string): Promise<void> {
        try {
            const now = new Date();
            const hour = now.getHours();
            const dayOfWeek = now.getDay();

            const raw = await AsyncStorage.getItem(`${STORAGE_KEY}_${userId}`);
            const logs: ActivityLog[] = raw ? JSON.parse(raw) : [];

            const existing = logs.find(l => l.hour === hour && l.dayOfWeek === dayOfWeek);
            if (existing) {
                existing.count += 1;
            } else {
                logs.push({ hour, dayOfWeek, count: 1 });
            }

            await AsyncStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(logs));
        } catch (e) { console.warn('Failed to record activity:', e); }
    }

    /**
     * Analyze activity patterns and return optimal notification schedule
     */
    async getSmartSchedule(userId: string): Promise<SmartSchedule> {
        try {
            const raw = await AsyncStorage.getItem(`${STORAGE_KEY}_${userId}`);
            const logs: ActivityLog[] = raw ? JSON.parse(raw) : [];

            if (logs.length === 0) {
                return this.defaultSchedule();
            }

            // Aggregate by hour
            const hourCounts: Record<number, number> = {};
            const dayCounts: Record<number, number> = {};
            let total = 0;

            for (const log of logs) {
                hourCounts[log.hour] = (hourCounts[log.hour] || 0) + log.count;
                dayCounts[log.dayOfWeek] = (dayCounts[log.dayOfWeek] || 0) + log.count;
                total += log.count;
            }

            // Sort hours by count
            const sortedHours = Object.entries(hourCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([h]) => parseInt(h));

            const sortedDays = Object.entries(dayCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([d]) => parseInt(d));

            // Peak hours
            const peakHours = sortedHours.slice(0, 3);

            // Least active hours (good for reminder notifications)
            const leastActiveHours = sortedHours.slice(-3).reverse();

            // Optimal notification: 1 hour before peak activity
            const bestHour = peakHours[0] > 0 ? peakHours[0] - 1 : 8;

            return {
                bestHour,
                bestDayOfWeek: sortedDays[0] || 0,
                peakHours,
                leastActiveHours,
                totalSessions: total,
                averageSessionsPerDay: Math.round(total / 7),
            };
        } catch {
            return this.defaultSchedule();
        }
    }

    /**
     * Get the optimal notification time as hour:minute string
     * Sends notification 1 hour before user's most active time
     */
    async getOptimalNotificationTime(userId: string): Promise<{ hour: number; minute: number }> {
        const schedule = await this.getSmartSchedule(userId);
        return {
            hour: schedule.bestHour,
            minute: 0,
        };
    }

    /**
     * Get human-readable activity pattern description
     */
    async getActivityDescription(userId: string): Promise<string> {
        const schedule = await this.getSmartSchedule(userId);
        const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
        const peakStr = schedule.peakHours.map(h => `${h}:00`).join(', ');
        const bestDay = dayNames[schedule.bestDayOfWeek];

        return `En aktif saatler: ${peakStr}. En aktif gün: ${bestDay}. Günlük ortalama: ${schedule.averageSessionsPerDay} oturum.`;
    }

    private defaultSchedule(): SmartSchedule {
        return {
            bestHour: 19, // 7 PM default
            bestDayOfWeek: 1, // Monday
            peakHours: [19, 20, 21],
            leastActiveHours: [6, 7, 8],
            totalSessions: 0,
            averageSessionsPerDay: 0,
        };
    }
}

export const smartNotificationService = new SmartNotificationService();
