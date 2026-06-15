/**
 * NEURALIS - Global Merit Service
 * Mathematical League Engine with Weekly Reset
 * Promotion (Top 20%), Safety (Middle 65%), Demotion (Bottom 15%)
 * 
 * @description The Great Awakening - High-stakes merit system
 */

import { supabase } from '../config/supabase';
import {
    LeagueTier,
    LeagueBracket,
    BracketParticipant,
    UserProfile,
} from '../types';
import { LEAGUE_CONFIGS } from './RankingService';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface MeritTransaction {
    id: string;
    userId: string;
    type: 'task_completion' | 'streak_bonus' | 'synapse_bonus' | 'league_promotion' | 'penalty';
    points: number;
    timestamp: number;
    metadata?: Record<string, unknown>;
}

export interface LeagueZoneConfig {
    promotionPercentage: number;  // Top 20%
    safetyPercentage: number;     // Middle 65%
    demotionPercentage: number;   // Bottom 15%
}

export interface WeeklyLeagueResult {
    userId: string;
    bracketId: string;
    tier: LeagueTier;
    finalPosition: number;
    totalParticipants: number;
    meritPoints: number;
    meritArrivalTimestamp: number;
    zone: 'promotion' | 'safety' | 'demotion';
    newTier?: LeagueTier;
}

export interface GlobalLeaderboard {
    tier: LeagueTier;
    weekStart: number;
    weekEnd: number;
    participants: GlobalParticipant[];
    totalParticipants: number;
}

export interface GlobalParticipant {
    userId: string;
    displayName: string;
    avatarUrl?: string;
    meritPoints: number;
    meritArrivalTimestamp: number;
    position: number;
    zone: 'promotion' | 'safety' | 'demotion';
    streakDays: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const LEAGUE_ZONES: LeagueZoneConfig = {
    promotionPercentage: 0.20,  // Top 20% get promoted
    safetyPercentage: 0.65,     // Middle 65% stay
    demotionPercentage: 0.15,   // Bottom 15% get demoted
};

const MIN_BRACKET_SIZE = 30;
const MAX_BRACKET_SIZE = 300;
const DEFAULT_BRACKET_SIZE = 50;

const LEAGUE_HIERARCHY: LeagueTier[] = [
    'bronze',
    'silver',
    'gold',
    'sapphire',
    'ruby',
    'emerald',
    'amethyst',
    'pearl',
    'obsidian',
    'diamond',
];

const STORAGE_KEYS = {
    WEEKLY_MERIT: '@neuralis/weekly_merit',
    MERIT_TRANSACTIONS: '@neuralis/merit_transactions',
    LEAGUE_RESULT: '@neuralis/league_result',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// MERIT CALCULATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate merit points from task performance
 * Formula: (Accuracy × Speed Factor) + (Streak Bonus × League Multiplier)
 */
export const calculateMeritPoints = (
    accuracy: number,           // 0-100
    timeTaken: number,          // seconds
    maxTime: number,            // max allowed seconds
    streakDays: number,
    leagueTier: LeagueTier
): number => {
    // Speed factor: faster = more points (inverted scale)
    const speedFactor = Math.max(0, 1 - (timeTaken / maxTime));
    const speedBonus = speedFactor * 50;

    // Base accuracy points
    const accuracyPoints = (accuracy / 100) * 100;

    // Streak multiplier (exponential growth)
    const streakBonus = Math.floor(Math.pow(streakDays, 1.15) * 5);

    // League multiplier
    const leagueMultiplier = LEAGUE_CONFIGS[leagueTier].multiplier;

    // Final calculation
    const rawPoints = (accuracyPoints + speedBonus + streakBonus) * leagueMultiplier;

    return Math.round(rawPoints * 100) / 100;
};

/**
 * Determine zone based on position and total participants
 */
const determineZone = (
    position: number,
    totalParticipants: number
): 'promotion' | 'safety' | 'demotion' => {
    const promotionCutoff = Math.ceil(totalParticipants * LEAGUE_ZONES.promotionPercentage);
    const demotionCutoff = Math.floor(totalParticipants * (1 - LEAGUE_ZONES.demotionPercentage));

    if (position <= promotionCutoff) {
        return 'promotion';
    } else if (position > demotionCutoff) {
        return 'demotion';
    }
    return 'safety';
};

/**
 * Get next league tier (promotion)
 */
const getNextTier = (currentTier: LeagueTier): LeagueTier | null => {
    const currentIndex = LEAGUE_HIERARCHY.indexOf(currentTier);
    if (currentIndex < LEAGUE_HIERARCHY.length - 1) {
        return LEAGUE_HIERARCHY[currentIndex + 1];
    }
    return null; // Already at max
};

/**
 * Get previous league tier (demotion)
 */
const getPreviousTier = (currentTier: LeagueTier): LeagueTier | null => {
    const currentIndex = LEAGUE_HIERARCHY.indexOf(currentTier);
    if (currentIndex > 0) {
        return LEAGUE_HIERARCHY[currentIndex - 1];
    }
    return null; // Already at minimum
};

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL MERIT SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════

class GlobalMeritService {
    private listeners: Map<string, () => void> = new Map();
    private weeklyMeritCache: Map<string, number> = new Map();

    // ─────────────────────────────────────────────────────────────────────────
    // WEEK CALCULATIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get the start of the current week (Monday 00:00:00 UTC)
     */
    getWeekStart(): number {
        const now = new Date();
        const day = now.getUTCDay();
        const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff, 0, 0, 0, 0));
        return monday.getTime();
    }

    /**
     * Get the end of the current week (Sunday 23:59:59 UTC)
     */
    getWeekEnd(): number {
        return this.getWeekStart() + 7 * 24 * 60 * 60 * 1000 - 1;
    }

    /**
     * Get time remaining until week reset
     */
    getTimeUntilReset(): number {
        return this.getWeekEnd() - Date.now();
    }

    /**
     * Check if we're in the last hour before reset
     */
    isResetImminent(): boolean {
        return this.getTimeUntilReset() < 60 * 60 * 1000;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MERIT TRANSACTIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Record a merit transaction
     */
    async recordMeritTransaction(
        userId: string,
        type: MeritTransaction['type'],
        points: number,
        metadata?: Record<string, unknown>
    ): Promise<MeritTransaction> {
        const transaction: MeritTransaction = {
            id: `merit_${userId}_${Date.now()}`,
            userId,
            type,
            points,
            timestamp: Date.now(),
            metadata,
        };

        const weekStart = this.getWeekStart();
        // TODO: Implement Supabase logic to store merit transaction
        // and update user's weekly merit total
        // Placeholder: return transaction object
        await this.updateWeeklyMerit(userId, points); // Optionally keep cache update
        return transaction;
    }

    /**
     * Update user's weekly merit total
     */
    private async updateWeeklyMerit(userId: string, pointsToAdd: number): Promise<void> {
        // TODO: Implement Supabase logic to update user's weekly merit total
        // Placeholder: update local cache only
        const currentMerit = this.weeklyMeritCache.get(userId) || 0;
        this.weeklyMeritCache.set(userId, currentMerit + pointsToAdd);
    }

    /**
     * Get user's weekly merit total
     */
    async getWeeklyMerit(userId: string): Promise<{ total: number; firstTimestamp: number }> {
        // TODO: Implement Supabase logic to fetch user's weekly merit total
        // Placeholder: return cache value or 0
        const total = this.weeklyMeritCache.get(userId) || 0;
        return { total, firstTimestamp: Date.now() };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BRACKET MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get or create a bracket for user
     */
    async getOrCreateBracket(
        userId: string,
        tier: LeagueTier
    ): Promise<LeagueBracket> {
        const weekStart = this.getWeekStart();

        // Check if user already has a bracket this week
        const existingBracket = await this.getUserBracket(userId, weekStart);
        if (existingBracket) {
            return existingBracket;
        }

        // Find available bracket or create new one
        const availableBracket = await this.findAvailableBracket(tier, weekStart);

        if (availableBracket) {
            await this.addUserToBracket(userId, availableBracket.id);
            return this.getUserBracket(userId, weekStart) as Promise<LeagueBracket>;
        }

        // Create new bracket
        return this.createBracket(tier, userId);
    }

    /**
     * Find user's current bracket
     */
    private async getUserBracket(userId: string, weekStart: number): Promise<LeagueBracket | null> {
        // Supabase: Fetch bracket where weekStartedAt == weekStart and participantIds contains userId
        const { data, error } = await supabase
            .from('league_brackets')
            .select('*')
            .eq('weekStartedAt', weekStart)
            .contains('participantIds', [userId])
            .maybeSingle();
        if (error || !data) return null;
        return data as LeagueBracket;
    }

    /**
     * Find an available bracket with space
     */
    private async findAvailableBracket(
        tier: LeagueTier,
        weekStart: number
    ): Promise<LeagueBracket | null> {
        // Supabase: Find available bracket
        const { data, error } = await supabase
            .from('league_brackets')
            .select('*')
            .eq('tier', tier)
            .eq('weekStartedAt', weekStart)
            .eq('isFull', false)
            .limit(1)
            .maybeSingle();
        if (error || !data) return null;
        return data as LeagueBracket;
    }

    /**
     * Create a new bracket
     */
    private async createBracket(tier: LeagueTier, initialUserId: string): Promise<LeagueBracket> {
        const weekStart = this.getWeekStart();
        const weekEnd = this.getWeekEnd();
        const bracketId = `bracket_${tier}_${weekStart}_${Date.now()}`;

        const userProfile = await this.getUserProfile(initialUserId);
        const userMerit = await this.getWeeklyMerit(initialUserId);

        const initialParticipant: BracketParticipant = {
            userId: initialUserId,
            displayName: userProfile?.displayName || 'Shadow User',
            avatarUrl: userProfile?.avatarUrl,
            rankPoints: userMerit.total,
            weeklyAccuracy: userProfile?.weeklyAccuracy || 0,
            weeklySpeed: userProfile?.weeklySpeed || 0,
            streakBonus: userProfile?.currentStreak || 0,
            position: 1,
            promotionZone: true,
            demotionZone: false,
        };

        const bracket: LeagueBracket = {
            id: bracketId,
            tier,
            weekStartedAt: weekStart,
            weekEndsAt: weekEnd,
            participants: [initialParticipant],
            maxParticipants: DEFAULT_BRACKET_SIZE,
        };

        await supabase.from('league_brackets').insert({
            ...bracket,
            participantIds: [initialUserId],
            isFull: false,
            createdAt: Date.now(),
        });

        return bracket;
    }

    /**
     * Add user to existing bracket
     */
    private async addUserToBracket(userId: string, bracketId: string): Promise<void> {
        // Supabase: Add user to bracket
        const { data, error } = await supabase
            .from('league_brackets')
            .select('*')
            .eq('id', bracketId)
            .single();
        if (error || !data) throw new Error('Bracket not found');
        const participantIds: string[] = data.participantIds || [];
        const participants: BracketParticipant[] = data.participants || [];
        if (participantIds.includes(userId)) return;
        if (participantIds.length >= data.maxParticipants) throw new Error('Bracket is full');
        const userProfile = await this.getUserProfile(userId);
        const userMerit = await this.getWeeklyMerit(userId);
        const newParticipant: BracketParticipant = {
            userId,
            displayName: userProfile?.displayName || 'Shadow User',
            avatarUrl: userProfile?.avatarUrl,
            rankPoints: userMerit.total,
            weeklyAccuracy: userProfile?.weeklyAccuracy || 0,
            weeklySpeed: userProfile?.weeklySpeed || 0,
            streakBonus: userProfile?.currentStreak || 0,
            position: participants.length + 1,
            promotionZone: false,
            demotionZone: false,
        };
        participantIds.push(userId);
        participants.push(newParticipant);
        await supabase.from('league_brackets').update({
            participantIds,
            participants,
            isFull: participantIds.length >= data.maxParticipants,
            lastUpdated: Date.now(),
        }).eq('id', bracketId);
    }

    /**
     * Parse bracket document
     */
    // Data is returned directly from Supabase queries.

    // ─────────────────────────────────────────────────────────────────────────
    // LEADERBOARD & RANKINGS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get sorted leaderboard for a bracket
     * Uses merit points first, then arrival timestamp for tie-breaking
     */
    async getBracketLeaderboard(bracketId: string): Promise<GlobalParticipant[]> {
        const { data, error } = await supabase
            .from('league_brackets')
            .select('participants')
            .eq('id', bracketId)
            .single();
        if (error || !data) return [];
        const participants: BracketParticipant[] = data.participants || [];

        // Fetch merit data for all participants
        const participantMerits = await Promise.all(
            participants.map(async (p) => {
                const merit = await this.getWeeklyMerit(p.userId);
                return {
                    ...p,
                    meritPoints: merit.total,
                    meritArrivalTimestamp: merit.firstTimestamp,
                };
            })
        );

        // Sort by merit points DESC, then by arrival timestamp ASC (earliest first for ties)
        const sorted = participantMerits.sort((a, b) => {
            if (b.meritPoints !== a.meritPoints) {
                return b.meritPoints - a.meritPoints;
            }
            // Tie-breaker: earlier timestamp wins
            return a.meritArrivalTimestamp - b.meritArrivalTimestamp;
        });

        // Assign positions and zones
        const totalParticipants = sorted.length;

        return sorted.map((participant, index) => {
            const position = index + 1;
            const zone = determineZone(position, totalParticipants);

            return {
                userId: participant.userId,
                displayName: participant.displayName,
                avatarUrl: participant.avatarUrl,
                meritPoints: participant.meritPoints,
                meritArrivalTimestamp: participant.meritArrivalTimestamp,
                position,
                zone,
                streakDays: participant.streakBonus,
            };
        });
    }

    /**
     * Get user's position in their bracket
     */
    async getUserPosition(userId: string): Promise<{
        position: number;
        totalParticipants: number;
        zone: 'promotion' | 'safety' | 'demotion';
        meritPoints: number;
    } | null> {
        const weekStart = this.getWeekStart();
        const bracket = await this.getUserBracket(userId, weekStart);

        if (!bracket) {
            return null;
        }

        const leaderboard = await this.getBracketLeaderboard(bracket.id);
        const userEntry = leaderboard.find((p) => p.userId === userId);

        if (!userEntry) {
            return null;
        }

        return {
            position: userEntry.position,
            totalParticipants: leaderboard.length,
            zone: userEntry.zone,
            meritPoints: userEntry.meritPoints,
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WEEKLY RESET & LEAGUE TRANSITIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Process weekly reset for all brackets
    * This should be triggered by a scheduled server job at week end
     */
    async processWeeklyReset(): Promise<WeeklyLeagueResult[]> {
        const weekStart = this.getWeekStart();
        const results: WeeklyLeagueResult[] = [];

        // Get all brackets for this week
        // Supabase: Get all brackets for this week
        const { data, error } = await supabase
            .from('league_brackets')
            .select('*')
            .eq('weekStartedAt', weekStart);
        if (error || !data) return results;
        for (const bracket of data) {
            const leaderboard = await this.getBracketLeaderboard(bracket.id);
            for (const participant of leaderboard) {
                const result = await this.processParticipantResult(
                    participant,
                    bracket,
                    leaderboard.length
                );
                results.push(result);
            }
        }
        return results;
    }

    /**
     * Process individual participant's weekly result
     */
    private async processParticipantResult(
        participant: GlobalParticipant,
        bracket: LeagueBracket,
        totalParticipants: number
    ): Promise<WeeklyLeagueResult> {
        let newTier: LeagueTier | undefined;
        if (participant.zone === 'promotion') {
            const nextTier = getNextTier(bracket.tier);
            if (nextTier) {
                newTier = nextTier;
                // profiles table doesn't currently store league tier; bracket tier is derived from league_brackets.
                // Keep this best-effort as a no-op to avoid writing to a missing `users` table.
            }
        } else if (participant.zone === 'demotion') {
            const prevTier = getPreviousTier(bracket.tier);
            if (prevTier) {
                newTier = prevTier;
                // profiles table doesn't currently store league tier; see note above.
            }
        }
        const result: WeeklyLeagueResult = {
            userId: participant.userId,
            bracketId: bracket.id,
            tier: bracket.tier,
            finalPosition: participant.position,
            totalParticipants,
            meritPoints: participant.meritPoints,
            meritArrivalTimestamp: participant.meritArrivalTimestamp,
            zone: participant.zone,
            newTier,
        };
        try {
            const { error } = await supabase.from('league_results').upsert({
                ...result,
                processedAt: Date.now(),
            });
            if (error) {
                console.error('[GlobalMeritService] Failed to upsert league_results:', error);
                const details = String(error?.details || '').toLowerCase();
                const message = String(error?.message || '').toLowerCase();
                const isMissingTable = error?.code === 'PGRST205' || details.includes('could not find') || message.includes('could not find') || message.includes('table');
                if (isMissingTable) {
                    console.warn('[GlobalMeritService] Missing table detected; skipping league_results persistence.');
                } else {
                    throw error;
                }
            }
        } catch (err) {
            console.error('[GlobalMeritService] Unexpected error during league_results upsert:', err);
        }
        return result;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // REAL-TIME LISTENERS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Subscribe to bracket leaderboard updates
     */
    subscribeToBracket(
        bracketId: string,
        callback: (leaderboard: GlobalParticipant[]) => void
    ): () => void {
        // Example code for live listening with Supabase Realtime (requires table trigger)
        // Currently disabled, can be implemented via polling.
        return () => { };
    }

    /**
     * Unsubscribe from bracket updates
     */
    unsubscribeFromBracket(bracketId: string): void {
        const unsubscribe = this.listeners.get(bracketId);
        if (unsubscribe) {
            unsubscribe();
            this.listeners.delete(bracketId);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPER METHODS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get user profile
     */
    private async getUserProfile(userId: string): Promise<UserProfile | null> {
        // profiles is the canonical table. Map minimal fields used by this service.
        try {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();
            if (!data) return null;
            return ({
                uid: data.id,
                displayName: data.display_name,
                email: data.email,
                avatarUrl: data.avatar_url,
                leaguePoints: data.league_points ?? 0,
                totalXP: data.total_xp ?? 0,
                currentStreak: data.current_streak ?? 0,
                longestStreak: data.longest_streak ?? 0,
            } as any) as UserProfile;
        } catch {
            return null;
        }
    }

    /**
     * Get zone cutoff positions for a bracket
     */
    getZoneCutoffs(totalParticipants: number): {
        promotionCutoff: number;
        demotionStart: number;
    } {
        return {
            promotionCutoff: Math.ceil(totalParticipants * LEAGUE_ZONES.promotionPercentage),
            demotionStart: Math.floor(totalParticipants * (1 - LEAGUE_ZONES.demotionPercentage)) + 1,
        };
    }

    /**
     * Cleanup all listeners
     */
    cleanup(): void {
        this.listeners.forEach((unsubscribe) => unsubscribe());
        this.listeners.clear();
        this.weeklyMeritCache.clear();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const globalMeritService = new GlobalMeritService();
export default globalMeritService;
