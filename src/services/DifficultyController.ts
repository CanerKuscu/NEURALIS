/**
 * NEURALIS - Adaptive Difficulty Controller
 * 
 * Intelligent difficulty management with anti-cheat measures
 * 
 * Features:
 * - Performance-based difficulty scaling
 * - Anti-cheat detection (bot-like behavior)
 * - Merit filtering for leaderboard integrity
 * - Adaptive challenge generation
 * 
 * Philosophy: Challenge must evolve with the learner
 */

import { supabase } from '../config/supabase';

// Uses Supabase for difficulty data queries
import { Task, UserProfile, TaskCategory, TaskDifficulty } from '../types/index';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const DIFFICULTY_CONFIG = {
    // Difficulty tier boundaries
    TIERS: {
        novice: { min: 0, max: 299 },
        apprentice: { min: 300, max: 599 },
        adept: { min: 600, max: 899 },
        expert: { min: 900, max: 1199 },
        master: { min: 1200, max: 1499 },
        grandmaster: { min: 1500, max: 1799 },
        neural_legend: { min: 1800, max: Infinity },
    } as const,

    // ELO-style rating changes
    RATING: {
        K_FACTOR: 32 as number,              // Standard K-factor
        K_FACTOR_NEW_USER: 64 as number,     // Higher K for new users (< 30 tasks)
        K_FACTOR_HIGH_RATED: 16 as number,   // Lower K for high-rated users
        HIGH_RATING_THRESHOLD: 1400,
        NEW_USER_TASK_THRESHOLD: 30,
        DEFAULT_RATING: 400,
    },

    // Escalation thresholds
    ESCALATION: {
        FAST_SOLVE_THRESHOLD: 2000,        // 2 seconds
        CONSECUTIVE_FAST_COUNT: 3,         // 3 consecutive fast solves
        ESCALATION_RATING_BOOST: 50,       // Immediate boost
        PERFECT_STREAK_THRESHOLD: 5,       // 5 perfects in a row
        PERFECT_STREAK_BOOST: 75,          // Larger boost
    },

    // De-escalation (struggling user)
    DEESCALATION: {
        CONSECUTIVE_FAILURES: 3,           // 3 fails in a row
        DEESCALATION_PENALTY: -30,         // Reduce difficulty
        TIMEOUT_THRESHOLD: 0.3,            // 30% timeouts
    },

    // Anti-cheat thresholds
    ANTI_CHEAT: {
        MIN_RESPONSE_TIME_MS: 500,         // Absolute minimum (human reaction)
        SUSPICIOUS_RESPONSE_TIME_MS: 800,  // Statistically improbable
        BOT_DETECTION_THRESHOLD: 0,        // 0ms = definite bot
        PERFECT_ACCURACY_THRESHOLD: 0.99,  // 99% accuracy over 50+ tasks
        SUSPICION_COUNT_THRESHOLD: 5,      // 5 suspicious events = flag
        REVIEW_WINDOW_TASKS: 50,           // Look at last 50 tasks
        MAX_DAILY_PERFECT_SCORE: 100,      // Max daily perfect scores
        INHUMAN_WPM_THRESHOLD: 200,        // Typing speed check
    },

    // Merit filter
    MERIT: {
        MIN_TASKS_FOR_LEADERBOARD: 10,     // Minimum participation
        MIN_AVG_RESPONSE_TIME: 1500,       // Average response time
        MAX_PERFECT_RATIO: 0.85,           // Max 85% perfect scores
        MIN_UNIQUE_CATEGORIES: 3,          // Category diversity
    },

    // Time-based adjustments
    TIME: {
        FATIGUE_THRESHOLD_MINUTES: 120,    // 2 hours continuous
        FATIGUE_DIFFICULTY_REDUCTION: 0.1, // 10% easier when fatigued
        OPTIMAL_SESSION_MINUTES: 45,       // Peak performance window
    },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type DifficultyTier = keyof typeof DIFFICULTY_CONFIG.TIERS;

export interface UserDifficultyProfile {
    userId: string;
    rating: number;
    tier: DifficultyTier;
    totalTasks: number;
    correctTasks: number;
    accuracy: number;
    avgResponseTimeMs: number;
    consecutiveFastSolves: number;
    consecutivePerfects: number;
    consecutiveFailures: number;
    suspicionCount: number;
    isFlagged: boolean;
    isLeaderboardSuspended: boolean;
    lastUpdated: Date;
    categoryRatings: Record<TaskCategory, number>;
}

export interface TaskAttempt {
    userId: string;
    taskId: string;
    category: TaskCategory;
    difficulty: TaskDifficulty;
    isCorrect: boolean;
    responseTimeMs: number;
    expectedDifficulty: number;
    timestamp: Date;
    sessionDurationMinutes: number;
}

export interface DifficultyRecommendation {
    recommendedRating: number;
    recommendedTier: DifficultyTier;
    categorySpecificRating?: number;
    adjustmentReason: string[];
    antiCheatWarnings: string[];
}

export interface AntiCheatResult {
    isPassed: boolean;
    isSuspicious: boolean;
    isFlagged: boolean;
    violations: string[];
    suspicionScore: number;
}

export interface MeritFilterResult {
    isEligible: boolean;
    reasons: string[];
    meritScore: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// DIFFICULTY CONTROLLER CLASS
// ═══════════════════════════════════════════════════════════════════════════

export class DifficultyController {
    private static instance: DifficultyController;

    private constructor() { }

    static getInstance(): DifficultyController {
        if (!DifficultyController.instance) {
            DifficultyController.instance = new DifficultyController();
        }
        return DifficultyController.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Rating Calculations
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Calculate ELO-style rating change
     */
    private calculateRatingChange(
        userRating: number,
        taskDifficulty: number,
        isCorrect: boolean,
        totalTasks: number
    ): number {
        // Determine K-factor
        let kFactor = DIFFICULTY_CONFIG.RATING.K_FACTOR;
        if (totalTasks < DIFFICULTY_CONFIG.RATING.NEW_USER_TASK_THRESHOLD) {
            kFactor = DIFFICULTY_CONFIG.RATING.K_FACTOR_NEW_USER;
        } else if (userRating > DIFFICULTY_CONFIG.RATING.HIGH_RATING_THRESHOLD) {
            kFactor = DIFFICULTY_CONFIG.RATING.K_FACTOR_HIGH_RATED;
        }

        // Expected score (ELO formula)
        const expectedScore = 1 / (1 + Math.pow(10, (taskDifficulty - userRating) / 400));

        // Actual score
        const actualScore = isCorrect ? 1 : 0;

        // Rating change
        return Math.round(kFactor * (actualScore - expectedScore));
    }

    /**
     * Get tier from rating
     */
    getTierFromRating(rating: number): DifficultyTier {
        for (const [tier, range] of Object.entries(DIFFICULTY_CONFIG.TIERS)) {
            if (rating >= range.min && rating <= range.max) {
                return tier as DifficultyTier;
            }
        }
        return 'novice';
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Anti-Cheat System
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Run anti-cheat validation on a task attempt
     */
    async runAntiCheatValidation(attempt: TaskAttempt): Promise<AntiCheatResult> {
        const violations: string[] = [];
        let suspicionScore = 0;

        // Check 1: Response time too fast (bot detection)
        if (attempt.responseTimeMs === 0) {
            violations.push('ZERO_RESPONSE_TIME');
            suspicionScore += 10; // Definite bot
        } else if (attempt.responseTimeMs < DIFFICULTY_CONFIG.ANTI_CHEAT.MIN_RESPONSE_TIME_MS) {
            violations.push('INHUMAN_RESPONSE_TIME');
            suspicionScore += 5;
        } else if (attempt.responseTimeMs < DIFFICULTY_CONFIG.ANTI_CHEAT.SUSPICIOUS_RESPONSE_TIME_MS) {
            violations.push('SUSPICIOUS_RESPONSE_TIME');
            suspicionScore += 2;
        }

        // Check 2: Perfect score with fast time
        if (attempt.isCorrect && attempt.responseTimeMs < DIFFICULTY_CONFIG.ESCALATION.FAST_SOLVE_THRESHOLD) {
            suspicionScore += 1;
        }

        // Check 3: Get historical data
        const recentAttempts = await this.getRecentAttempts(
            attempt.userId,
            DIFFICULTY_CONFIG.ANTI_CHEAT.REVIEW_WINDOW_TASKS
        );

        if (recentAttempts.length >= 20) {
            // Check 4: Perfect accuracy over many tasks
            const accuracy = recentAttempts.filter(a => a.isCorrect).length / recentAttempts.length;
            if (accuracy >= DIFFICULTY_CONFIG.ANTI_CHEAT.PERFECT_ACCURACY_THRESHOLD) {
                violations.push('PERFECT_ACCURACY_PATTERN');
                suspicionScore += 3;
            }

            // Check 5: Average response time too consistent (bot pattern)
            const responseTimes = recentAttempts.map(a => a.responseTimeMs);
            const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
            const variance = responseTimes.reduce((sum, t) => sum + Math.pow(t - avgResponseTime, 2), 0) / responseTimes.length;
            const stdDev = Math.sqrt(variance);

            if (stdDev < 100 && avgResponseTime < 2000) {
                // Very consistent fast times = suspicious
                violations.push('ROBOTIC_RESPONSE_PATTERN');
                suspicionScore += 4;
            }
        }

        // Determine result
        const isSuspicious = suspicionScore >= 3;
        const isFlagged = suspicionScore >= DIFFICULTY_CONFIG.ANTI_CHEAT.SUSPICION_COUNT_THRESHOLD;

        return {
            isPassed: !isFlagged,
            isSuspicious,
            isFlagged,
            violations,
            suspicionScore,
        };
    }

    /**
     * Flag user for manual review
     */
    async flagUserForReview(userId: string, reason: string, violations: string[]): Promise<void> {
        // TODO: Implement with Supabase
        // Example: Insert or update a 'flagged_users' row in Supabase
        console.warn(`[DifficultyController] User ${userId} flagged: ${reason} (Supabase migration pending)`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Merit Filter
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Check if user passes merit filter for leaderboard
     */
    async checkMeritFilter(userId: string): Promise<MeritFilterResult> {
        const reasons: string[] = [];
        let meritScore = 100;

        // Get user profile
        const profile = await this.getUserDifficultyProfile(userId);
        if (!profile) {
            return { isEligible: false, reasons: ['USER_NOT_FOUND'], meritScore: 0 };
        }

        // Check 1: Minimum participation
        if (profile.totalTasks < DIFFICULTY_CONFIG.MERIT.MIN_TASKS_FOR_LEADERBOARD) {
            reasons.push(`INSUFFICIENT_TASKS: ${profile.totalTasks}/${DIFFICULTY_CONFIG.MERIT.MIN_TASKS_FOR_LEADERBOARD}`);
            meritScore -= 30;
        }

        // Check 2: Average response time
        if (profile.avgResponseTimeMs < DIFFICULTY_CONFIG.MERIT.MIN_AVG_RESPONSE_TIME) {
            reasons.push(`LOW_AVG_RESPONSE_TIME: ${profile.avgResponseTimeMs}ms`);
            meritScore -= 25;
        }

        // Check 3: Perfect score ratio
        const perfectRatio = profile.accuracy;
        if (perfectRatio > DIFFICULTY_CONFIG.MERIT.MAX_PERFECT_RATIO && profile.totalTasks > 30) {
            reasons.push(`HIGH_PERFECT_RATIO: ${(perfectRatio * 100).toFixed(1)}%`);
            meritScore -= 20;
        }

        // Check 4: Category diversity
        const categoriesPlayed = Object.values(profile.categoryRatings).filter(r => r > 0).length;
        if (categoriesPlayed < DIFFICULTY_CONFIG.MERIT.MIN_UNIQUE_CATEGORIES) {
            reasons.push(`LOW_CATEGORY_DIVERSITY: ${categoriesPlayed}/${DIFFICULTY_CONFIG.MERIT.MIN_UNIQUE_CATEGORIES}`);
            meritScore -= 15;
        }

        // Check 5: Flag status
        if (profile.isFlagged) {
            reasons.push('USER_FLAGGED');
            meritScore = 0;
        }

        const isEligible = meritScore >= 60 && !profile.isFlagged;

        return { isEligible, reasons, meritScore };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Process Task Attempt
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Main entry point - process a completed task
     */
    async processTaskAttempt(attempt: TaskAttempt): Promise<DifficultyRecommendation> {
        const adjustmentReason: string[] = [];
        const antiCheatWarnings: string[] = [];

        // Step 1: Run anti-cheat
        const antiCheatResult = await this.runAntiCheatValidation(attempt);

        if (antiCheatResult.isFlagged) {
            await this.flagUserForReview(
                attempt.userId,
                'Automated flag: Anti-cheat violations',
                antiCheatResult.violations
            );
            antiCheatWarnings.push('USER_FLAGGED_FOR_REVIEW');
        } else if (antiCheatResult.isSuspicious) {
            antiCheatWarnings.push(...antiCheatResult.violations);
        }

        // Step 2: Get current profile
        let profile = await this.getUserDifficultyProfile(attempt.userId);
        if (!profile) {
            profile = await this.initializeUserProfile(attempt.userId);
        }

        // Step 3: Calculate base rating change
        let ratingChange = this.calculateRatingChange(
            profile.rating,
            attempt.expectedDifficulty,
            attempt.isCorrect,
            profile.totalTasks
        );

        // Step 4: Apply escalation/de-escalation modifiers

        // Fast solve escalation
        if (
            attempt.isCorrect &&
            attempt.responseTimeMs < DIFFICULTY_CONFIG.ESCALATION.FAST_SOLVE_THRESHOLD &&
            !antiCheatResult.isSuspicious
        ) {
            const newConsecutiveFast = profile.consecutiveFastSolves + 1;
            if (newConsecutiveFast >= DIFFICULTY_CONFIG.ESCALATION.CONSECUTIVE_FAST_COUNT) {
                ratingChange += DIFFICULTY_CONFIG.ESCALATION.ESCALATION_RATING_BOOST;
                adjustmentReason.push('FAST_SOLVE_ESCALATION');
            }
        }

        // Perfect streak escalation
        if (attempt.isCorrect) {
            const newConsecutivePerfects = profile.consecutivePerfects + 1;
            if (newConsecutivePerfects >= DIFFICULTY_CONFIG.ESCALATION.PERFECT_STREAK_THRESHOLD) {
                ratingChange += DIFFICULTY_CONFIG.ESCALATION.PERFECT_STREAK_BOOST;
                adjustmentReason.push('PERFECT_STREAK_ESCALATION');
            }
        }

        // De-escalation for struggling users
        if (!attempt.isCorrect) {
            const newConsecutiveFailures = profile.consecutiveFailures + 1;
            if (newConsecutiveFailures >= DIFFICULTY_CONFIG.DEESCALATION.CONSECUTIVE_FAILURES) {
                ratingChange += DIFFICULTY_CONFIG.DEESCALATION.DEESCALATION_PENALTY;
                adjustmentReason.push('STRUGGLE_DEESCALATION');
            }
        }

        // Fatigue adjustment
        if (attempt.sessionDurationMinutes > DIFFICULTY_CONFIG.TIME.FATIGUE_THRESHOLD_MINUTES) {
            ratingChange = Math.floor(ratingChange * (1 - DIFFICULTY_CONFIG.TIME.FATIGUE_DIFFICULTY_REDUCTION));
            adjustmentReason.push('FATIGUE_ADJUSTMENT');
        }

        // Step 5: Update profile
        const newRating = Math.max(0, profile.rating + ratingChange);
        const newTier = this.getTierFromRating(newRating);

        await this.updateUserProfile(attempt.userId, attempt, newRating, antiCheatResult);

        // Step 6: Record attempt
        await this.recordTaskAttempt(attempt);

        if (!adjustmentReason.length) {
            adjustmentReason.push('STANDARD_UPDATE');
        }

        return {
            recommendedRating: newRating,
            recommendedTier: newTier,
            categorySpecificRating: profile.categoryRatings[attempt.category] + ratingChange,
            adjustmentReason,
            antiCheatWarnings,
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Database Operations
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get user difficulty profile
     */
    async getUserDifficultyProfile(userId: string): Promise<UserDifficultyProfile | null> {
        // TODO: Implement with Supabase
        // Example: Fetch from 'user_difficulty_profiles' table
        return null;
    }

    /**
     * Initialize new user profile
     */
    async initializeUserProfile(userId: string): Promise<UserDifficultyProfile> {
        // TODO: Implement with Supabase
        // Example: Insert a new row in 'user_difficulty_profiles' table
        throw new Error('Not implemented: initializeUserProfile (Supabase)');
    }

    /**
     * Update user profile after task
     */
    private async updateUserProfile(
        userId: string,
        attempt: TaskAttempt,
        newRating: number,
        antiCheatResult: AntiCheatResult
    ): Promise<void> {
        // TODO: Implement with Supabase
        // Example: Update row in 'user_difficulty_profiles' table
        throw new Error('Not implemented: updateUserProfile (Supabase)');
    }

    /**
     * Record task attempt for historical analysis
     */
    private async recordTaskAttempt(attempt: TaskAttempt): Promise<void> {
        // TODO: Implement with Supabase
        // Example: Insert into 'task_completions' table
        throw new Error('Not implemented: recordTaskAttempt (Supabase)');
    }

    /**
     * Get recent attempts for analysis
     */
    private async getRecentAttempts(userId: string, count: number): Promise<TaskAttempt[]> {
        // TODO: Implement with Supabase
        // Example: Select from 'task_completions' table
        return [];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Task Selection
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get recommended task difficulty for user
     */
    async getRecommendedTaskDifficulty(
        userId: string,
        category?: TaskCategory
    ): Promise<{ rating: number; tier: DifficultyTier }> {
        const profile = await this.getUserDifficultyProfile(userId);

        if (!profile) {
            return {
                rating: DIFFICULTY_CONFIG.RATING.DEFAULT_RATING,
                tier: 'apprentice',
            };
        }

        let targetRating = profile.rating;

        // Use category-specific rating if available
        if (category && profile.categoryRatings[category]) {
            targetRating = profile.categoryRatings[category];
        }

        // Add slight variation for challenge (-50 to +100)
        const variation = Math.floor(Math.random() * 150) - 50;
        targetRating = Math.max(0, targetRating + variation);

        return {
            rating: targetRating,
            tier: this.getTierFromRating(targetRating),
        };
    }

    /**
     * Generate difficulty matrix for task selection
     */
    async generateDifficultyMatrix(
        userId: string
    ): Promise<Record<TaskCategory, { rating: number; tier: DifficultyTier }>> {
        const profile = await this.getUserDifficultyProfile(userId);
        const categories: TaskCategory[] = [
            'logic', 'memory', 'math', 'pattern', 'verbal', 'spatial'
        ];

        const matrix: Record<TaskCategory, { rating: number; tier: DifficultyTier }> = {} as any;

        for (const category of categories) {
            const categoryRating = profile?.categoryRatings[category] || DIFFICULTY_CONFIG.RATING.DEFAULT_RATING;
            matrix[category] = {
                rating: categoryRating,
                tier: this.getTierFromRating(categoryRating),
            };
        }

        return matrix;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const difficultyController = DifficultyController.getInstance();
export default difficultyController;
