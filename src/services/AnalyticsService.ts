/**
 * AnalyticsService — Kullanıcı Analitik Dashboard
 *
 * Öğrenme istatistikleri & trendler
 * Haftalık/aylık raporlar
 * Kategori bazlı performans
 * Tahmini seviye ilerlemesi
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface DailyStats {
  date: string; // YYYY-MM-DD
  lessonsCompleted: number;
  xpEarned: number;
  correctAnswers: number;
  totalAnswers: number;
  timeSpent: number; // dakika
  streakDay: number;
  categories: Record<string, CategoryDayStat>;
}

export interface CategoryDayStat {
  correct: number;
  total: number;
  xp: number;
}

export interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  totalLessons: number;
  totalXp: number;
  accuracy: number;
  totalTime: number;
  bestDay: string;
  bestDayXp: number;
  improvement: number; // Önceki haftaya göre %
  topCategory: string;
}

export interface MonthlySummary {
  month: string; // YYYY-MM
  totalLessons: number;
  totalXp: number;
  accuracy: number;
  totalTime: number;
  activeDays: number;
  longestStreak: number;
  categoryBreakdown: { category: string; percentage: number; xp: number }[];
}

export interface LearningTrend {
  label: string;
  value: number;
}

export interface PerformanceInsight {
  type: 'positive' | 'neutral' | 'negative';
  emoji: string;
  text: string;
  textTr: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = '@neuralis_analytics';

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════

class AnalyticsService {
  /** Günlük istatistik kaydet / güncelle */
  async recordActivity(data: {
    lessonsCompleted?: number;
    xpEarned?: number;
    correct?: number;
    total?: number;
    timeSpent?: number;
    category?: string;
  }): Promise<void> {
    const allStats = await this.getAllStats();
    const today = new Date().toISOString().split('T')[0];
    let todayStat = allStats.find((s) => s.date === today);

    if (!todayStat) {
      todayStat = {
        date: today,
        lessonsCompleted: 0,
        xpEarned: 0,
        correctAnswers: 0,
        totalAnswers: 0,
        timeSpent: 0,
        streakDay: 0,
        categories: {},
      };
      allStats.push(todayStat);
    }

    if (data.lessonsCompleted) todayStat.lessonsCompleted += data.lessonsCompleted;
    if (data.xpEarned) todayStat.xpEarned += data.xpEarned;
    if (data.correct) todayStat.correctAnswers += data.correct;
    if (data.total) todayStat.totalAnswers += data.total;
    if (data.timeSpent) todayStat.timeSpent += data.timeSpent;

    if (data.category) {
      if (!todayStat.categories[data.category]) {
        todayStat.categories[data.category] = { correct: 0, total: 0, xp: 0 };
      }
      todayStat.categories[data.category].correct += data.correct || 0;
      todayStat.categories[data.category].total += data.total || 0;
      todayStat.categories[data.category].xp += data.xpEarned || 0;
    }

    // Son 365 günü tut
    const sorted = allStats.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 365);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
  }

  /** Son 7 günlük XP trendi */
  async getWeeklyXpTrend(): Promise<LearningTrend[]> {
    const stats = await this.getAllStats();
    const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    const result: LearningTrend[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const stat = stats.find((s) => s.date === dateStr);
      result.push({
        label: days[date.getDay()],
        value: stat?.xpEarned || 0,
      });
    }
    return result;
  }

  /** Son 30 günlük ders trendi */
  async getMonthlyLessonTrend(): Promise<LearningTrend[]> {
    const stats = await this.getAllStats();
    const result: LearningTrend[] = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const stat = stats.find((s) => s.date === dateStr);
      result.push({
        label: `${date.getDate()}`,
        value: stat?.lessonsCompleted || 0,
      });
    }
    return result;
  }

  /** Haftalık özet */
  async getWeeklySummary(): Promise<WeeklySummary> {
    const stats = await this.getAllStats();
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const weekStats = stats.filter((s) => {
      const d = new Date(s.date);
      return d >= weekStart && d <= weekEnd;
    });

    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekStats = stats.filter((s) => {
      const d = new Date(s.date);
      return d >= prevWeekStart && d < weekStart;
    });

    const totalXp = weekStats.reduce((sum, s) => sum + s.xpEarned, 0);
    const prevTotalXp = prevWeekStats.reduce((sum, s) => sum + s.xpEarned, 0);
    const totalCorrect = weekStats.reduce((sum, s) => sum + s.correctAnswers, 0);
    const totalTotal = weekStats.reduce((sum, s) => sum + s.totalAnswers, 0);

    const bestDay = weekStats.reduce(
      (best, s) => (s.xpEarned > (best?.xpEarned || 0) ? s : best),
      weekStats[0],
    );

    // Top category
    const catMap: Record<string, number> = {};
    weekStats.forEach((s) => {
      Object.entries(s.categories).forEach(([cat, data]) => {
        catMap[cat] = (catMap[cat] || 0) + data.xp;
      });
    });
    const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];

    return {
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      totalLessons: weekStats.reduce((sum, s) => sum + s.lessonsCompleted, 0),
      totalXp,
      accuracy: totalTotal > 0 ? Math.round((totalCorrect / totalTotal) * 100) : 0,
      totalTime: weekStats.reduce((sum, s) => sum + s.timeSpent, 0),
      bestDay: bestDay?.date || '',
      bestDayXp: bestDay?.xpEarned || 0,
      improvement: prevTotalXp > 0 ? Math.round(((totalXp - prevTotalXp) / prevTotalXp) * 100) : 0,
      topCategory: topCat?.[0] || '-',
    };
  }

  /** Aylık özet */
  async getMonthlySummary(): Promise<MonthlySummary> {
    const stats = await this.getAllStats();
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const monthStats = stats.filter((s) => s.date.startsWith(monthStr));
    const totalCorrect = monthStats.reduce((sum, s) => sum + s.correctAnswers, 0);
    const totalTotal = monthStats.reduce((sum, s) => sum + s.totalAnswers, 0);

    // Streaks
    let longestStreak = 0,
      currentStreak = 0;
    const sorted = monthStats.sort((a, b) => a.date.localeCompare(b.date));
    for (let i = 0; i < sorted.length; i++) {
      if (
        i === 0 ||
        new Date(sorted[i].date).getTime() - new Date(sorted[i - 1].date).getTime() === 86400000
      ) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }
      longestStreak = Math.max(longestStreak, currentStreak);
    }

    // Kategori dağılımı
    const catMap: Record<string, number> = {};
    monthStats.forEach((s) => {
      Object.entries(s.categories).forEach(([cat, data]) => {
        catMap[cat] = (catMap[cat] || 0) + data.xp;
      });
    });
    const totalCatXp = Object.values(catMap).reduce((s, v) => s + v, 0) || 1;
    const categoryBreakdown = Object.entries(catMap)
      .map(([category, xp]) => ({
        category,
        xp,
        percentage: Math.round((xp / totalCatXp) * 100),
      }))
      .sort((a, b) => b.xp - a.xp);

    return {
      month: monthStr,
      totalLessons: monthStats.reduce((sum, s) => sum + s.lessonsCompleted, 0),
      totalXp: monthStats.reduce((sum, s) => sum + s.xpEarned, 0),
      accuracy: totalTotal > 0 ? Math.round((totalCorrect / totalTotal) * 100) : 0,
      totalTime: monthStats.reduce((sum, s) => sum + s.timeSpent, 0),
      activeDays: monthStats.length,
      longestStreak,
      categoryBreakdown,
    };
  }

  /** AI-driven insights */
  async getInsights(): Promise<PerformanceInsight[]> {
    const weekly = await this.getWeeklySummary();
    const insights: PerformanceInsight[] = [];

    if (weekly.improvement > 10) {
      insights.push({
        type: 'positive',
        emoji: '📈',
        text: `Great! ${weekly.improvement}% more XP than last week!`,
        textTr: `Harika! Geçen haftaya göre %${weekly.improvement} daha fazla XP kazandın!`,
      });
    } else if (weekly.improvement < -10) {
      insights.push({
        type: 'negative',
        emoji: '📉',
        text: `XP dropped ${Math.abs(weekly.improvement)}% from last week`,
        textTr: `XP'in geçen haftaya göre %${Math.abs(weekly.improvement)} düştü. Biraz daha çalışalım!`,
      });
    }

    if (weekly.accuracy >= 90) {
      insights.push({
        type: 'positive',
        emoji: '🎯',
        text: `${weekly.accuracy}% accuracy! Almost perfect!`,
        textTr: `%${weekly.accuracy} doğruluk! Neredeyse mükemmel!`,
      });
    } else if (weekly.accuracy < 60) {
      insights.push({
        type: 'negative',
        emoji: '🔄',
        text: `${weekly.accuracy}% accuracy. Review more!`,
        textTr: `%${weekly.accuracy} doğruluk. Tekrar derslerini artır!`,
      });
    }

    if (weekly.totalLessons >= 7) {
      insights.push({
        type: 'positive',
        emoji: '🔥',
        text: `${weekly.totalLessons} lessons this week! On fire!`,
        textTr: `Bu hafta ${weekly.totalLessons} ders! Ateş gibisin!`,
      });
    }

    if (insights.length === 0) {
      insights.push({
        type: 'neutral',
        emoji: '💡',
        text: 'Keep learning consistently!',
        textTr: 'Düzenli öğrenmeye devam et!',
      });
    }

    return insights;
  }

  /** Tüm istatistikleri al */
  private async getAllStats(): Promise<DailyStats[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /** Isı haritası verisi (GitHub contribution graph benzeri) */
  async getHeatmapData(days = 90): Promise<{ date: string; level: 0 | 1 | 2 | 3 | 4 }[]> {
    const stats = await this.getAllStats();
    const result: { date: string; level: 0 | 1 | 2 | 3 | 4 }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const stat = stats.find((s) => s.date === dateStr);
      const xp = stat?.xpEarned || 0;

      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (xp > 200) level = 4;
      else if (xp > 100) level = 3;
      else if (xp > 50) level = 2;
      else if (xp > 0) level = 1;

      result.push({ date: dateStr, level });
    }
    return result;
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
