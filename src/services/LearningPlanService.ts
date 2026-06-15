/**
 * NEURALIS - AI Personal Learning Plan Service
 * Generates weekly personalized learning plans using Neural Archive + DeepSeek
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface DailyPlanItem {
    category: string;
    topic: string;
    lessonCount: number;
    estimatedMinutes: number;
    priority: 'high' | 'medium' | 'low';
    reason: string;
}

export interface WeeklyPlan {
    id: string;
    userId: string;
    weekStart: string;
    weekEnd: string;
    days: { [day: string]: DailyPlanItem[] };
    weeklyGoal: { totalLessons: number; totalMinutes: number; focusCategories: string[] };
    aiInsight: string;
    completedItems: string[];
    createdAt: string;
}

export interface PlanStats {
    weakCategories: { category: string; errorRate: number; lastPracticed: string }[];
    strongCategories: { category: string; accuracy: number }[];
    averageDailyLessons: number;
    preferredTimeOfDay: string;
    currentStreak: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = '@neuralis/weekly_plan';
const DAY_NAMES = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

class LearningPlanService {
    async getCurrentPlan(userId: string): Promise<WeeklyPlan | null> {
        try {
            const raw = await AsyncStorage.getItem(`${STORAGE_KEY}_${userId}`);
            if (!raw) return null;
            const plan: WeeklyPlan = JSON.parse(raw);
            const now = new Date();
            if (new Date(plan.weekEnd) < now) return null;
            return plan;
        } catch { return null; }
    }

    async generateWeeklyPlan(userId: string): Promise<WeeklyPlan> {
        const stats = await this.gatherStats(userId);
        const plan = this.buildPlan(userId, stats);
        await AsyncStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(plan));
        return plan;
    }

    private async gatherStats(userId: string): Promise<PlanStats> {
        const weakCategories: PlanStats['weakCategories'] = [];
        const strongCategories: PlanStats['strongCategories'] = [];

        try {
            const { data: levels } = await supabase
                .from('user_category_levels')
                .select('category, lessons_completed, total_xp_in_category, updated_at')
                .eq('user_id', userId);

            const { data: profile } = await supabase
                .from('profiles')
                .select('current_streak, lessons_completed, total_xp')
                .eq('id', userId)
                .maybeSingle();

            const categories = ['mathematics', 'science', 'coding', 'history', 'language', 'music', 'art', 'geography'];

            for (const cat of categories) {
                const level = levels?.find(l => l.category === cat);
                const lessonsCompleted = level?.lessons_completed || 0;
                const lastPracticed = level?.updated_at || new Date(0).toISOString();

                const daysSincePractice = (Date.now() - new Date(lastPracticed).getTime()) / (1000 * 60 * 60 * 24);

                if (daysSincePractice > 7 || lessonsCompleted < 3) {
                    weakCategories.push({ category: cat, errorRate: Math.min(0.8, daysSincePractice / 30), lastPracticed });
                } else if (lessonsCompleted > 10) {
                    strongCategories.push({ category: cat, accuracy: 0.8 });
                }
            }

            return {
                weakCategories: weakCategories.sort((a, b) => b.errorRate - a.errorRate).slice(0, 5),
                strongCategories: strongCategories.slice(0, 3),
                averageDailyLessons: Math.max(1, Math.floor((profile?.lessons_completed || 0) / 30)),
                preferredTimeOfDay: 'evening',
                currentStreak: profile?.current_streak || 0,
            };
        } catch {
            return { weakCategories: [], strongCategories: [], averageDailyLessons: 2, preferredTimeOfDay: 'evening', currentStreak: 0 };
        }
    }

    private buildPlan(userId: string, stats: PlanStats): WeeklyPlan {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + 1);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const days: WeeklyPlan['days'] = {};
        const focusCategories = stats.weakCategories.slice(0, 3).map(w => w.category);
        const dailyTarget = Math.max(2, Math.min(5, stats.averageDailyLessons + 1));
        let totalLessons = 0;

        for (let d = 0; d < 7; d++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + d);
            const dayKey = DAY_NAMES[date.getDay()];
            const items: DailyPlanItem[] = [];

            // Distribute weak categories across the week
            for (let i = 0; i < Math.min(dailyTarget, focusCategories.length + 1); i++) {
                const cat = focusCategories[i % focusCategories.length] || stats.strongCategories[0]?.category || 'mathematics';
                const isWeak = stats.weakCategories.some(w => w.category === cat);
                items.push({
                    category: cat,
                    topic: '',
                    lessonCount: 1,
                    estimatedMinutes: 8,
                    priority: isWeak ? 'high' : 'medium',
                    reason: isWeak ? 'Bu konuda pratik yapman gerekiyor' : 'Bilgini taze tut',
                });
                totalLessons++;
            }

            // Add one strong category review on alternate days
            if (d % 2 === 0 && stats.strongCategories.length > 0) {
                const strong = stats.strongCategories[d % stats.strongCategories.length];
                items.push({
                    category: strong.category,
                    topic: '',
                    lessonCount: 1,
                    estimatedMinutes: 5,
                    priority: 'low',
                    reason: 'Güçlü yönlerini koru',
                });
                totalLessons++;
            }

            days[dayKey] = items;
        }

        const insights = [
            `Bu hafta ${focusCategories.join(', ')} konularına odaklanmanı öneriyorum.`,
            `Günde ortalama ${dailyTarget} ders yaparak hedefine ulaşabilirsin.`,
            stats.currentStreak > 0 ? `${stats.currentStreak} günlük serin var, devam et! 🔥` : 'Bu hafta yeni bir seri başlat! 💪',
        ];

        return {
            id: `plan_${Date.now()}`,
            userId,
            weekStart: weekStart.toISOString(),
            weekEnd: weekEnd.toISOString(),
            days,
            weeklyGoal: {
                totalLessons,
                totalMinutes: totalLessons * 8,
                focusCategories,
            },
            aiInsight: insights.join(' '),
            completedItems: [],
            createdAt: new Date().toISOString(),
        };
    }

    async markItemCompleted(userId: string, dayKey: string, category: string): Promise<void> {
        const plan = await this.getCurrentPlan(userId);
        if (!plan) return;
        const key = `${dayKey}_${category}`;
        if (!plan.completedItems.includes(key)) {
            plan.completedItems.push(key);
            await AsyncStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(plan));
        }
    }

    getCompletionRate(plan: WeeklyPlan): number {
        const total = Object.values(plan.days).reduce((sum, items) => sum + items.length, 0);
        if (total === 0) return 0;
        return Math.round((plan.completedItems.length / total) * 100);
    }
}

export const learningPlanService = new LearningPlanService();
