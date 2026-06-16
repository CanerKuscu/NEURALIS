/**
 * NEURALIS - Neural Archive System
 *
 * AI-driven growth tracking and weakness analysis (Supabase-native)
 *
 * Features:
 * - Store all incorrect answers in neural_errors table
 * - AI Shadow Tutor integration for weakness analysis
 * - Weekly Neural Weakness Map generation
 * - Pattern recognition for personalized learning paths
 *
 * Philosophy: Every error is a neural pathway waiting to be strengthened
 */

import { supabase } from '../config/supabase';
import type { TaskCategory, TaskDifficulty, TaskAttempt } from '../types';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const ARCHIVE_CONFIG = {
  ANALYSIS: {
    MIN_ERRORS_FOR_PATTERN: 5,
    WEAKNESS_THRESHOLD: 0.4,
    STRENGTH_THRESHOLD: 0.85,
    WEEKLY_ANALYSIS_DAY: 0,
    PATTERN_LOOKBACK_DAYS: 30,
    MAX_ERRORS_PER_ANALYSIS: 500,
  },
  AI_TUTOR: {
    MAX_CONTEXT_ERRORS: 20,
    WEAKNESS_MAP_SIZE: 5,
    RECOMMENDATION_COUNT: 3,
  },
  RETENTION: {
    ERROR_RETENTION_DAYS: 90,
    ANALYSIS_RETENTION_DAYS: 365,
    ARCHIVE_OLD_ERRORS: true,
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface NeuralError {
  id?: string;
  userId: string;
  taskId: string;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  difficultyRating: number;
  question: string;
  correctAnswer: string;
  userAnswer: string;
  responseTimeMs: number;
  streakDay: number;
  energyLevel: number;
  sessionDurationMinutes: number;
  timeOfDay: string;
  timestamp: Date;
  isAnalyzed: boolean;
  weaknessPatterns?: string[];
}

export interface WeaknessPattern {
  category: TaskCategory;
  subcategory?: string;
  errorCount: number;
  totalAttempts: number;
  errorRate: number;
  commonMistakes: string[];
  difficulty: TaskDifficulty;
  timeContext: {
    worstTimeOfDay: string;
    avgResponseTime: number;
    fatigueCorrelation: number;
  };
  trend: 'improving' | 'stable' | 'declining';
}

export interface NeuralWeaknessMap {
  id?: string;
  userId: string;
  generatedAt: Date;
  weekNumber: number;
  year: number;
  topWeaknesses: WeaknessPattern[];
  strengths: WeaknessPattern[];
  overallErrorRate: number;
  totalErrors: number;
  totalAttempts: number;
  aiAnalysis?: string;
  personalizedRecommendations: Recommendation[];
  focusAreas: FocusArea[];
  previousWeekComparison?: {
    errorRateChange: number;
    newWeaknesses: string[];
    resolvedWeaknesses: string[];
  };
}

export interface Recommendation {
  type: 'practice' | 'strategy' | 'timing' | 'rest';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  targetCategory?: TaskCategory;
  estimatedImpact: number;
}

export interface FocusArea {
  category: TaskCategory;
  subcategory?: string;
  reason: string;
  suggestedTasks: number;
  currentProgress: number;
  targetProgress: number;
}

export interface ArchiveStats {
  totalErrors: number;
  errorsThisWeek: number;
  errorsLastWeek: number;
  mostCommonCategory: TaskCategory;
  averageErrorRate: number;
  lastAnalysisDate?: Date;
}

// ═══════════════════════════════════════════════════════════════════════════
// NEURAL ARCHIVE SERVICE (Supabase-native)
// ═══════════════════════════════════════════════════════════════════════════

export class NeuralArchiveService {
  private static instance: NeuralArchiveService;

  private constructor() {}

  static getInstance(): NeuralArchiveService {
    if (!NeuralArchiveService.instance) {
      NeuralArchiveService.instance = new NeuralArchiveService();
    }
    return NeuralArchiveService.instance;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Error Recording
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Record an incorrect answer to neural_errors table
   */
  async recordError(error: Omit<NeuralError, 'id' | 'timestamp' | 'isAnalyzed'>): Promise<string> {
    try {
      const timeOfDay = this.getTimeOfDay(new Date());

      const { data, error: dbError } = await supabase
        .from('neural_errors')
        .insert({
          user_id: error.userId,
          task_id: error.taskId,
          category: error.category,
          difficulty: error.difficulty,
          difficulty_rating: error.difficultyRating,
          question: error.question,
          correct_answer: error.correctAnswer,
          user_answer: error.userAnswer,
          response_time_ms: error.responseTimeMs,
          streak_day: error.streakDay,
          energy_level: error.energyLevel,
          session_duration_minutes: error.sessionDurationMinutes,
          time_of_day: timeOfDay,
          is_analyzed: false,
          weakness_patterns: [],
        })
        .select('id')
        .single();

      if (dbError) throw dbError;

      await this.updateUserErrorStats(error.userId, error.category);

      console.log(`[NeuralArchive] Error recorded: ${data?.id}`);
      return data?.id ?? '';
    } catch (e) {
      console.error('[NeuralArchive] Failed to record error:', e);
      throw e;
    }
  }

  /**
   * Record batch of errors (for offline sync)
   */
  async recordErrorBatch(
    errors: Omit<NeuralError, 'id' | 'timestamp' | 'isAnalyzed'>[],
  ): Promise<string[]> {
    const rows = errors.map((error) => ({
      user_id: error.userId,
      task_id: error.taskId,
      category: error.category,
      difficulty: error.difficulty,
      difficulty_rating: error.difficultyRating,
      question: error.question,
      correct_answer: error.correctAnswer,
      user_answer: error.userAnswer,
      response_time_ms: error.responseTimeMs,
      streak_day: error.streakDay,
      energy_level: error.energyLevel,
      session_duration_minutes: error.sessionDurationMinutes,
      time_of_day: this.getTimeOfDay(new Date()),
      is_analyzed: false,
      weakness_patterns: [],
    }));

    const { data, error: dbError } = await supabase.from('neural_errors').insert(rows).select('id');

    if (dbError) throw dbError;
    return (data ?? []).map((d: any) => d.id);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Error Retrieval
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get user's errors for analysis
   */
  async getUserErrors(
    userId: string,
    options?: {
      category?: TaskCategory;
      limit?: number;
      startDate?: Date;
      endDate?: Date;
      unanalyzedOnly?: boolean;
    },
  ): Promise<NeuralError[]> {
    let query = supabase.from('neural_errors').select('*').eq('user_id', userId);

    if (options?.category) {
      query = query.eq('category', options.category);
    }
    if (options?.unanalyzedOnly) {
      query = query.eq('is_analyzed', false);
    }
    if (options?.startDate) {
      query = query.gte('created_at', options.startDate.toISOString());
    }
    if (options?.endDate) {
      query = query.lte('created_at', options.endDate.toISOString());
    }

    query = query.order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data ?? []).map((row: any) => this.mapRowToNeuralError(row));
  }

  /**
   * Get errors for AI Shadow Tutor context
   */
  async getErrorsForAIContext(userId: string): Promise<NeuralError[]> {
    return this.getUserErrors(userId, {
      limit: ARCHIVE_CONFIG.AI_TUTOR.MAX_CONTEXT_ERRORS,
      unanalyzedOnly: true,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Weakness Analysis
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Analyze user errors and generate weakness patterns
   */
  async analyzeWeaknesses(userId: string): Promise<WeaknessPattern[]> {
    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - ARCHIVE_CONFIG.ANALYSIS.PATTERN_LOOKBACK_DAYS);

    const errors = await this.getUserErrors(userId, {
      startDate: lookbackDate,
      limit: ARCHIVE_CONFIG.ANALYSIS.MAX_ERRORS_PER_ANALYSIS,
    });

    const attempts = await this.getUserAttempts(userId, lookbackDate);
    const categoryGroups = this.groupByCategory(errors);
    const attemptsByCategory = this.groupAttemptsByCategory(attempts);

    const patterns: WeaknessPattern[] = [];

    for (const [category, categoryErrors] of Object.entries(categoryGroups)) {
      const totalAttempts = attemptsByCategory[category as TaskCategory] || categoryErrors.length;
      const errorRate = categoryErrors.length / totalAttempts;

      if (
        categoryErrors.length >= ARCHIVE_CONFIG.ANALYSIS.MIN_ERRORS_FOR_PATTERN &&
        errorRate >= ARCHIVE_CONFIG.ANALYSIS.WEAKNESS_THRESHOLD
      ) {
        const pattern = this.buildWeaknessPattern(
          category as TaskCategory,
          categoryErrors,
          totalAttempts,
        );
        patterns.push(pattern);
      }
    }

    patterns.sort((a, b) => b.errorRate - a.errorRate);
    return patterns.slice(0, ARCHIVE_CONFIG.AI_TUTOR.WEAKNESS_MAP_SIZE);
  }

  /**
   * Build weakness pattern from errors
   */
  private buildWeaknessPattern(
    category: TaskCategory,
    errors: NeuralError[],
    totalAttempts: number,
  ): WeaknessPattern {
    const mistakeCounts = new Map<string, number>();
    const timeOfDayCounts: Record<string, number> = {};
    const difficultyCounts: Record<string, number> = {};
    let totalResponseTime = 0;
    let fatigueErrors = 0;
    let recentCount = 0;
    let olderCount = 0;
    const now = Date.now();

    for (const error of errors) {
      const mkey = `${error.correctAnswer}:${error.userAnswer}`;
      mistakeCounts.set(mkey, (mistakeCounts.get(mkey) || 0) + 1);
      timeOfDayCounts[error.timeOfDay] = (timeOfDayCounts[error.timeOfDay] || 0) + 1;
      difficultyCounts[error.difficulty] = (difficultyCounts[error.difficulty] || 0) + 1;
      totalResponseTime += error.responseTimeMs;
      if (error.sessionDurationMinutes > 60) fatigueErrors++;
      const daysSince = (now - error.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince <= 7) recentCount++;
      else if (daysSince <= 14) olderCount++;
    }

    const commonMistakes = Array.from(mistakeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([mistake]) => mistake);

    const worstTimeOfDay =
      Object.entries(timeOfDayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentCount < olderCount * 0.7) trend = 'improving';
    else if (recentCount > olderCount * 1.3) trend = 'declining';

    const mostCommonDifficulty =
      (Object.entries(difficultyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as TaskDifficulty) ||
      'medium';

    return {
      category,
      errorCount: errors.length,
      totalAttempts,
      errorRate: errors.length / totalAttempts,
      commonMistakes,
      difficulty: mostCommonDifficulty,
      timeContext: {
        worstTimeOfDay,
        avgResponseTime: errors.length ? totalResponseTime / errors.length : 0,
        fatigueCorrelation: errors.length ? fatigueErrors / errors.length : 0,
      },
      trend,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Neural Weakness Map Generation
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Generate weekly Neural Weakness Map
   */
  async generateWeaknessMap(userId: string): Promise<NeuralWeaknessMap> {
    const startTs = Date.now();
    console.log(`[NeuralArchive] generateWeaknessMap START for ${userId}`);
    const now = new Date();
    const weekNumber = this.getWeekNumber(now);
    const year = now.getFullYear();

    const weaknesses = await this.analyzeWeaknesses(userId);
    const strengths = await this.analyzeStrengths(userId);
    const stats = await this.getArchiveStats(userId);
    const recommendations = this.generateRecommendations(weaknesses, stats);
    const focusAreas = this.generateFocusAreas(weaknesses);

    const previousMap = await this.getPreviousWeaknessMap(userId, weekNumber - 1, year);
    const comparison = previousMap ? this.compareToLastWeek(weaknesses, previousMap) : undefined;

    const map: NeuralWeaknessMap = {
      userId,
      generatedAt: now,
      weekNumber,
      year,
      topWeaknesses: weaknesses,
      strengths,
      overallErrorRate: stats.averageErrorRate,
      totalErrors: stats.totalErrors,
      totalAttempts: Math.round(stats.totalErrors / (stats.averageErrorRate || 0.3)),
      personalizedRecommendations: recommendations,
      focusAreas,
      previousWeekComparison: comparison,
    };

    await Promise.all([this.saveWeaknessMap(map), this.markErrorsAsAnalyzed(userId)]);

    console.log(`[NeuralArchive] generateWeaknessMap END; duration=${Date.now() - startTs}ms`);
    return map;
  }

  /**
   * Get user's latest weakness map
   */
  async getLatestWeaknessMap(userId: string): Promise<NeuralWeaknessMap | null> {
    const { data, error } = await supabase
      .from('weakness_maps')
      .select('*')
      .eq('user_id', userId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return this.mapRowToWeaknessMap(data);
  }

  /**
   * Save weakness map to Supabase
   */
  private async saveWeaknessMap(map: NeuralWeaknessMap): Promise<void> {
    const { error } = await supabase.from('weakness_maps').insert({
      user_id: map.userId,
      week_number: map.weekNumber,
      year: map.year,
      top_weaknesses: map.topWeaknesses,
      strengths: map.strengths,
      overall_error_rate: map.overallErrorRate,
      total_errors: map.totalErrors,
      total_attempts: map.totalAttempts,
      personalized_recommendations: map.personalizedRecommendations,
      focus_areas: map.focusAreas,
      previous_week_comparison: map.previousWeekComparison ?? null,
    });
    if (error) console.error('[NeuralArchive] Failed to save weakness map:', error);
  }

  /**
   * Get previous week's weakness map
   */
  private async getPreviousWeaknessMap(
    userId: string,
    weekNumber: number,
    year: number,
  ): Promise<NeuralWeaknessMap | null> {
    const { data, error } = await supabase
      .from('weakness_maps')
      .select('*')
      .eq('user_id', userId)
      .eq('week_number', weekNumber)
      .eq('year', year)
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return this.mapRowToWeaknessMap(data);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Recommendations
  // ─────────────────────────────────────────────────────────────────────────

  private generateRecommendations(
    weaknesses: WeaknessPattern[],
    stats: ArchiveStats,
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    for (const weakness of weaknesses.slice(0, 3)) {
      recommendations.push({
        type: 'practice',
        priority: weakness.errorRate > 0.6 ? 'high' : 'medium',
        title: `Focus on ${weakness.category}`,
        description: `Your error rate in ${weakness.category} is ${(weakness.errorRate * 100).toFixed(0)}%. Complete 5 extra ${weakness.category} tasks daily.`,
        targetCategory: weakness.category,
        estimatedImpact: Math.min(100, Math.round(weakness.errorRate * 100)),
      });

      if (weakness.timeContext.fatigueCorrelation > 0.4) {
        recommendations.push({
          type: 'timing',
          priority: 'medium',
          title: 'Avoid Late Sessions',
          description: `${(weakness.timeContext.fatigueCorrelation * 100).toFixed(0)}% of your ${weakness.category} errors occur during long sessions. Take a break after 45 minutes.`,
          estimatedImpact: 30,
        });
      }

      if (weakness.timeContext.worstTimeOfDay) {
        recommendations.push({
          type: 'strategy',
          priority: 'low',
          title: `Best Time for ${weakness.category}`,
          description: `You struggle most with ${weakness.category} in the ${weakness.timeContext.worstTimeOfDay}. Try tackling these tasks in the morning.`,
          targetCategory: weakness.category,
          estimatedImpact: 20,
        });
      }
    }

    if (stats.averageErrorRate > 0.4) {
      recommendations.push({
        type: 'rest',
        priority: 'high',
        title: 'Neural Recovery Needed',
        description:
          'Your overall error rate suggests mental fatigue. Consider shorter, more focused sessions with breaks.',
        estimatedImpact: 40,
      });
    }

    return recommendations.slice(0, ARCHIVE_CONFIG.AI_TUTOR.RECOMMENDATION_COUNT * 3);
  }

  private generateFocusAreas(weaknesses: WeaknessPattern[]): FocusArea[] {
    return weaknesses.slice(0, 3).map((weakness) => ({
      category: weakness.category,
      reason: `Error rate: ${(weakness.errorRate * 100).toFixed(0)}%, Trend: ${weakness.trend}`,
      suggestedTasks: Math.ceil(weakness.errorCount * 0.5),
      currentProgress: 0,
      targetProgress: Math.ceil(weakness.errorCount * 0.5),
    }));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // AI Shadow Tutor Integration
  // ─────────────────────────────────────────────────────────────────────────

  async generateAITutorPrompt(userId: string): Promise<string> {
    const errors = await this.getErrorsForAIContext(userId);
    const weaknesses = await this.analyzeWeaknesses(userId);

    let prompt = `Analyze this learner's Neural Weakness Profile:\n\n`;

    prompt += `## Top Weaknesses:\n`;
    for (const w of weaknesses) {
      prompt += `- ${w.category}: ${(w.errorRate * 100).toFixed(1)}% error rate, ${w.errorCount} errors\n`;
      prompt += `  Common mistakes: ${w.commonMistakes.join(', ')}\n`;
      prompt += `  Trend: ${w.trend}\n`;
    }

    prompt += `\n## Recent Errors (${errors.length}):\n`;
    for (const error of errors.slice(0, 10)) {
      prompt += `- [${error.category}] Q: "${error.question.substring(0, 50)}..."\n`;
      prompt += `  Correct: "${error.correctAnswer}", User answered: "${error.userAnswer}"\n`;
    }

    prompt += `\n## Context:\n`;
    prompt += `- Worst time of day: ${weaknesses[0]?.timeContext.worstTimeOfDay || 'N/A'}\n`;
    prompt += `- Fatigue correlation: ${weaknesses[0]?.timeContext.fatigueCorrelation.toFixed(2) || 'N/A'}\n`;

    prompt += `\n## Instructions:\n`;
    prompt += `1. Identify root causes of mistakes\n`;
    prompt += `2. Suggest specific study strategies\n`;
    prompt += `3. Recommend practice patterns\n`;
    prompt += `4. Provide encouragement based on trends\n`;

    return prompt;
  }

  async storeAIAnalysis(userId: string, analysis: string): Promise<void> {
    const map = await this.getLatestWeaknessMap(userId);
    if (!map?.id) return;

    const { error } = await supabase
      .from('weakness_maps')
      .update({ ai_analysis: analysis, ai_analyzed_at: new Date().toISOString() })
      .eq('id', map.id);

    if (error) console.error('[NeuralArchive] Failed to store AI analysis:', error);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Statistics & Utilities
  // ─────────────────────────────────────────────────────────────────────────

  async getArchiveStats(userId: string): Promise<ArchiveStats> {
    const allErrors = await this.getUserErrors(userId);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const errorsThisWeek = allErrors.filter((e) => e.timestamp >= oneWeekAgo).length;
    const errorsLastWeek = allErrors.filter(
      (e) => e.timestamp >= twoWeeksAgo && e.timestamp < oneWeekAgo,
    ).length;

    const categoryCounts = new Map<TaskCategory, number>();
    for (const error of allErrors) {
      categoryCounts.set(error.category, (categoryCounts.get(error.category) || 0) + 1);
    }
    const mostCommonCategory =
      Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'vocabulary';

    const latestMap = await this.getLatestWeaknessMap(userId);

    return {
      totalErrors: allErrors.length,
      errorsThisWeek,
      errorsLastWeek,
      mostCommonCategory,
      averageErrorRate: 0.3,
      lastAnalysisDate: latestMap?.generatedAt,
    };
  }

  private compareToLastWeek(
    currentWeaknesses: WeaknessPattern[],
    previousMap: NeuralWeaknessMap,
  ): NeuralWeaknessMap['previousWeekComparison'] {
    const currentCategories = new Set(currentWeaknesses.map((w) => w.category));
    const previousCategories = new Set(previousMap.topWeaknesses.map((w) => w.category));

    const newWeaknesses = [...currentCategories].filter((c) => !previousCategories.has(c));
    const resolvedWeaknesses = [...previousCategories].filter((c) => !currentCategories.has(c));

    const currentAvgRate =
      currentWeaknesses.reduce((sum, w) => sum + w.errorRate, 0) / currentWeaknesses.length || 0;
    const previousAvgRate =
      previousMap.topWeaknesses.reduce((sum, w) => sum + w.errorRate, 0) /
        previousMap.topWeaknesses.length || 0;

    return {
      errorRateChange: currentAvgRate - previousAvgRate,
      newWeaknesses,
      resolvedWeaknesses,
    };
  }

  private async analyzeStrengths(_userId: string): Promise<WeaknessPattern[]> {
    // Similar to analyzeWeaknesses but filters for strength threshold
    return [];
  }

  private async getUserAttempts(userId: string, startDate: Date): Promise<TaskAttempt[]> {
    const { data, error } = await supabase
      .from('task_completions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('[NeuralArchive] Failed to get attempts:', error);
      return [];
    }
    return (data ?? []) as TaskAttempt[];
  }

  private groupByCategory(errors: NeuralError[]): Record<TaskCategory, NeuralError[]> {
    const groups: Record<string, NeuralError[]> = {};
    for (const error of errors) {
      if (!groups[error.category]) groups[error.category] = [];
      groups[error.category].push(error);
    }
    return groups as Record<TaskCategory, NeuralError[]>;
  }

  private groupAttemptsByCategory(
    attempts: (TaskAttempt & { category?: TaskCategory })[],
  ): Record<TaskCategory, number> {
    const counts: Record<string, number> = {};
    for (const attempt of attempts) {
      const cat = attempt.category || 'logic';
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts as Record<TaskCategory, number>;
  }

  private async updateUserErrorStats(userId: string, category: TaskCategory): Promise<void> {
    // Try to update existing stats row
    const { data: existing } = await supabase
      .from('user_error_stats')
      .select('total_errors, category_errors')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      const categoryErrors = existing.category_errors || {};
      categoryErrors[category] = (categoryErrors[category] || 0) + 1;

      await supabase
        .from('user_error_stats')
        .update({
          total_errors: (existing.total_errors || 0) + 1,
          category_errors: categoryErrors,
          last_error_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    } else {
      await supabase.from('user_error_stats').insert({
        user_id: userId,
        total_errors: 1,
        category_errors: { [category]: 1 },
        last_error_at: new Date().toISOString(),
      });
    }
  }

  private async markErrorsAsAnalyzed(userId: string): Promise<void> {
    const { error } = await supabase
      .from('neural_errors')
      .update({ is_analyzed: true })
      .eq('user_id', userId)
      .eq('is_analyzed', false);

    if (error) console.error('[NeuralArchive] Failed to mark errors as analyzed:', error);
  }

  private getTimeOfDay(date: Date): string {
    const hour = date.getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Maintenance
  // ─────────────────────────────────────────────────────────────────────────

  async cleanupOldErrors(userId: string): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - ARCHIVE_CONFIG.RETENTION.ERROR_RETENTION_DAYS);

    if (ARCHIVE_CONFIG.RETENTION.ARCHIVE_OLD_ERRORS) {
      // Move old errors to archive table
      const { data: oldErrors } = await supabase
        .from('neural_errors')
        .select('*')
        .eq('user_id', userId)
        .lte('created_at', cutoffDate.toISOString())
        .limit(500);

      if (oldErrors && oldErrors.length > 0) {
        await supabase.from('neural_errors_archive').insert(oldErrors);
        const ids = oldErrors.map((e: any) => e.id);
        await supabase.from('neural_errors').delete().in('id', ids);
      }
      return oldErrors?.length ?? 0;
    } else {
      const { data } = await supabase
        .from('neural_errors')
        .delete()
        .eq('user_id', userId)
        .lte('created_at', cutoffDate.toISOString())
        .select('id');
      return data?.length ?? 0;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Row Mappers
  // ─────────────────────────────────────────────────────────────────────────

  private mapRowToNeuralError(row: any): NeuralError {
    return {
      id: row.id,
      userId: row.user_id,
      taskId: row.task_id,
      category: row.category,
      difficulty: row.difficulty,
      difficultyRating: row.difficulty_rating,
      question: row.question,
      correctAnswer: row.correct_answer,
      userAnswer: row.user_answer,
      responseTimeMs: row.response_time_ms,
      streakDay: row.streak_day,
      energyLevel: row.energy_level,
      sessionDurationMinutes: row.session_duration_minutes,
      timeOfDay: row.time_of_day,
      timestamp: new Date(row.created_at),
      isAnalyzed: row.is_analyzed,
      weaknessPatterns: row.weakness_patterns,
    };
  }

  private mapRowToWeaknessMap(row: any): NeuralWeaknessMap {
    return {
      id: row.id,
      userId: row.user_id,
      generatedAt: new Date(row.generated_at || row.created_at),
      weekNumber: row.week_number,
      year: row.year,
      topWeaknesses: row.top_weaknesses ?? [],
      strengths: row.strengths ?? [],
      overallErrorRate: row.overall_error_rate,
      totalErrors: row.total_errors,
      totalAttempts: row.total_attempts,
      aiAnalysis: row.ai_analysis,
      personalizedRecommendations: row.personalized_recommendations ?? [],
      focusAreas: row.focus_areas ?? [],
      previousWeekComparison: row.previous_week_comparison,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const neuralArchive = NeuralArchiveService.getInstance();
export default neuralArchive;
