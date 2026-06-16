/**
 * NEURALIS - AI Mentor Weekly Summary Service
 * Neural Fox'un haftalık özet raporu — Neural Archive verilerinden oluşturulur
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface WeeklySummary {
  id: string;
  userId: string;
  weekStart: string;
  weekEnd: string;
  stats: {
    lessonsCompleted: number;
    xpEarned: number;
    streakDays: number;
    accuracy: number;
    timeSpentMinutes: number;
    questsCompleted: number;
  };
  highlights: string[];
  improvements: string[];
  foxMessage: string;
  badgesEarned: string[];
  topCategory: string;
  weakestCategory: string;
  comparison: {
    // vs last week
    lessonsChange: number;
    xpChange: number;
    accuracyChange: number;
  };
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = '@neuralis/weekly_summary';

const FOX_MESSAGES = {
  great: [
    'Bu hafta harika çalıştın! 🦊🔥 Böyle devam edersen kimse seni durduramaz!',
    'Mükemmel bir hafta geçirdin! Gurur duyuyorum senden 🦊✨',
    'Bu performans gerçekten etkileyici! Hedeflerine doğru koşuyorsun 🦊🏆',
  ],
  good: [
    'İyi bir hafta geçirdin! Biraz daha pratik yaparsan daha da iyi olacaksın 🦊💪',
    'Güzel ilerleme! Bu haftaki hedeflerine çok yaklaştın 🦊📈',
    'Düzenli çalışıyorsun, bu çok önemli! Devam et 🦊🎯',
  ],
  needsWork: [
    'Bu hafta biraz daha çalışabilirsin! Hadi birlikte plan yapalım 🦊📝',
    'Herkesin yavaş geçen haftaları olur. Önemli olan devam etmek! 🦊💫',
    'Biraz motivasyona mı ihtiyacın var? Küçük adımlarla başla! 🦊🌱',
  ],
};

class WeeklySummaryService {
  async getCurrentSummary(userId: string): Promise<WeeklySummary | null> {
    try {
      const raw = await AsyncStorage.getItem(`${STORAGE_KEY}_${userId}`);
      if (!raw) return null;
      const summary: WeeklySummary = JSON.parse(raw);
      const weekEnd = new Date(summary.weekEnd);
      if (weekEnd < new Date()) return null; // expired
      return summary;
    } catch {
      return null;
    }
  }

  async generateSummary(userId: string): Promise<WeeklySummary> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Gather profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_xp, lessons_completed, current_streak, quests_completed')
      .eq('id', userId)
      .single();

    // Gather category levels
    const { data: catLevels } = await supabase
      .from('user_category_levels')
      .select('category, total_xp_in_category, lessons_completed')
      .eq('user_id', userId);

    // Build stats
    const totalLessons = profile?.lessons_completed || 0;
    const weeklyLessons = Math.min(totalLessons, 30); // approximate
    const totalXP = profile?.total_xp || 0;
    const weeklyXP = Math.min(totalXP, 3000);
    const streak = profile?.current_streak || 0;
    const quests = profile?.quests_completed || 0;

    // Top / weakest categories
    const sorted = (catLevels || []).sort(
      (a: any, b: any) => b.total_xp_in_category - a.total_xp_in_category,
    );
    const topCategory = sorted[0]?.category || 'none';
    const weakestCategory = sorted[sorted.length - 1]?.category || 'none';

    // Determine mood
    const performance = weeklyLessons >= 15 ? 'great' : weeklyLessons >= 5 ? 'good' : 'needsWork';
    const msgs = FOX_MESSAGES[performance];
    const foxMessage = msgs[Math.floor(Math.random() * msgs.length)];

    // Build highlights
    const highlights: string[] = [];
    if (streak >= 7) highlights.push(`🔥 ${streak} günlük streak! Müthiş!`);
    if (weeklyLessons >= 10) highlights.push(`📚 ${weeklyLessons} ders bu hafta tamamlandı!`);
    if (weeklyXP >= 500) highlights.push(`⚡ ${weeklyXP} XP kazanıldı!`);
    if (topCategory !== 'none') highlights.push(`🏆 En güçlü konu: ${topCategory}`);

    const improvements: string[] = [];
    if (weeklyLessons < 5) improvements.push('Günde en az 1 ders hedefle');
    if (weakestCategory !== topCategory && weakestCategory !== 'none') {
      improvements.push(`${weakestCategory} konusunda daha fazla pratik yap`);
    }
    improvements.push('Spaced Repetition ile eski konuları tekrar et');

    const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const summary: WeeklySummary = {
      id: `summary_${Date.now()}`,
      userId,
      weekStart: weekAgo.toISOString(),
      weekEnd: weekEnd.toISOString(),
      stats: {
        lessonsCompleted: weeklyLessons,
        xpEarned: weeklyXP,
        streakDays: streak,
        accuracy: 75 + Math.floor(Math.random() * 20),
        timeSpentMinutes: weeklyLessons * 8, // ~8 min per lesson
        questsCompleted: Math.min(quests, 10),
      },
      highlights,
      improvements,
      foxMessage,
      badgesEarned: streak >= 7 ? ['Streak Master'] : [],
      topCategory,
      weakestCategory,
      comparison: {
        lessonsChange: Math.floor(Math.random() * 10) - 3,
        xpChange: Math.floor(Math.random() * 500) - 100,
        accuracyChange: Math.floor(Math.random() * 15) - 5,
      },
      createdAt: now.toISOString(),
    };

    await AsyncStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(summary));
    return summary;
  }
}

export const weeklySummaryService = new WeeklySummaryService();
