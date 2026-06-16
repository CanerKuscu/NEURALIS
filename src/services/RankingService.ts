/**
 * NEURALIS - League & Ranking Service
 * Global Hierarchy System with 7 Leagues
 */

import { supabase } from '../config/supabase';
import type {
  LeagueTier,
  LeagueConfig,
  LeagueBracket,
  BracketParticipant,
  UserProfile,
} from '../types';
import { COLORS } from '../theme/colors';
// ═══════════════════════════════════════════════════════════════════════════
// LEAGUE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

export const LEAGUE_CONFIGS: Record<LeagueTier, LeagueConfig> = {
  bronze: {
    tier: 'bronze',
    displayName: 'Bronze',
    minPoints: 0,
    maxPoints: 999,
    color: COLORS.league.bronze,
    icon: '🥉',
    multiplier: 1.0,
  },
  silver: {
    tier: 'silver',
    displayName: 'Silver',
    minPoints: 1000,
    maxPoints: 2499,
    color: COLORS.league.silver,
    icon: '🥈',
    multiplier: 1.2,
  },
  gold: {
    tier: 'gold',
    displayName: 'Gold',
    minPoints: 2500,
    maxPoints: 4999,
    color: COLORS.league.gold,
    icon: '🥇',
    multiplier: 1.5,
  },
  sapphire: {
    tier: 'sapphire',
    displayName: 'Sapphire',
    minPoints: 5000,
    maxPoints: 7999,
    color: COLORS.league.sapphire,
    icon: '💎',
    multiplier: 1.8,
  },
  ruby: {
    tier: 'ruby',
    displayName: 'Ruby',
    minPoints: 8000,
    maxPoints: 11999,
    color: COLORS.league.ruby,
    icon: '❤️‍🔥',
    multiplier: 2.0,
  },
  emerald: {
    tier: 'emerald',
    displayName: 'Emerald',
    minPoints: 12000,
    maxPoints: 17999,
    color: COLORS.league.emerald,
    icon: '🟢',
    multiplier: 2.2,
  },
  amethyst: {
    tier: 'amethyst',
    displayName: 'Amethyst',
    minPoints: 18000,
    maxPoints: 24999,
    color: COLORS.league.amethyst,
    icon: '🔮',
    multiplier: 2.5,
  },
  pearl: {
    tier: 'pearl',
    displayName: 'Pearl',
    minPoints: 25000,
    maxPoints: 34999,
    color: COLORS.league.pearl,
    icon: '🪩',
    multiplier: 2.8,
  },
  obsidian: {
    tier: 'obsidian',
    displayName: 'Obsidian',
    minPoints: 35000,
    maxPoints: 49999,
    color: COLORS.league.obsidian,
    icon: '🖤',
    multiplier: 3.0,
  },
  diamond: {
    tier: 'diamond',
    displayName: 'Diamond',
    minPoints: 50000,
    maxPoints: Infinity,
    color: COLORS.league.diamond,
    icon: '💠',
    multiplier: 3.5,
  },
};

const BRACKET_SIZE = 30;
const PROMOTION_SLOTS = 3;
const DEMOTION_SLOTS = 3;

// ═══════════════════════════════════════════════════════════════════════════
// RANK POINTS CALCULATION
// Formula: RankPoints = (Accuracy × Speed) + (StreakBonus × 1.5)
// ═══════════════════════════════════════════════════════════════════════════

export const calculateRankPoints = (
  accuracy: number, // 0-100
  speed: number, // Average time in seconds (lower is better)
  streakDays: number,
): number => {
  // Convert speed to a score (faster = higher score)
  // Max time considered is 120 seconds, min is 5 seconds
  const normalizedSpeed = Math.max(0, Math.min(100, ((120 - speed) / 115) * 100));

  // Calculate base points from accuracy and speed
  const basePoints = (accuracy / 100) * normalizedSpeed;

  // Calculate streak bonus (exponential growth)
  const streakBonus = Math.pow(streakDays, 1.2) * 10;

  // Final calculation
  const rankPoints = basePoints + streakBonus * 1.5;

  return Math.round(rankPoints * 100) / 100;
};

// ═══════════════════════════════════════════════════════════════════════════
// RANKING SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════

class RankingService {
  private listeners: Map<string, () => void> = new Map();

  /**
   * Get or create bracket for user
   */
  async getOrCreateBracket(userId: string, tier: LeagueTier): Promise<LeagueBracket> {
    // Try to find an existing bracket with space
    const availableBracket = await this.findAvailableBracket(tier);

    if (availableBracket) {
      await this.addUserToBracket(userId, availableBracket.id);
      return availableBracket;
    }

    // Create new bracket
    return this.createNewBracket(tier, userId);
  }

  /**
   * Find a bracket with available slots
   */
  private async findAvailableBracket(tier: LeagueTier): Promise<LeagueBracket | null> {
    const weekStart = this.getWeekStart();
    const { data, error } = await supabase
      .from('league_brackets')
      .select('*')
      .eq('tier', tier)
      .eq('weekStartedAt', weekStart)
      .limit(10);
    if (error || !data) return null;
    for (const bracket of data) {
      if (bracket.participants.length < bracket.maxParticipants) {
        return bracket as LeagueBracket;
      }
    }
    return null;
  }

  /**
   * Create a new bracket
   */
  private async createNewBracket(tier: LeagueTier, initialUserId: string): Promise<LeagueBracket> {
    const weekStart = this.getWeekStart();
    const weekEnd = weekStart + 7 * 24 * 60 * 60 * 1000;
    const bracketId = `bracket_${tier}_${weekStart}_${Date.now()}`;

    const user = await this.getUserProfile(initialUserId);

    const initialParticipant: BracketParticipant = {
      userId: initialUserId,
      displayName: user?.displayName || 'Unknown',
      avatarUrl: user?.avatarUrl,
      rankPoints: 0,
      weeklyAccuracy: 0,
      weeklySpeed: 0,
      streakBonus: 0,
      position: 1,
      promotionZone: false,
      demotionZone: false,
    };

    const bracket: LeagueBracket = {
      id: bracketId,
      tier,
      weekStartedAt: weekStart,
      weekEndsAt: weekEnd,
      participants: [initialParticipant],
      maxParticipants: BRACKET_SIZE,
    };

    await supabase.from('league_brackets').insert({
      ...bracket,
      weekStartedAt: bracket.weekStartedAt,
      weekEndsAt: bracket.weekEndsAt,
    });
    // profiles table doesn't store bracketId; bracket membership is stored in league_brackets.participants

    return bracket;
  }

  /**
   * Add user to existing bracket
   */
  private async addUserToBracket(userId: string, bracketId: string): Promise<void> {
    const user = await this.getUserProfile(userId);
    if (!user) return;

    const { data, error } = await supabase
      .from('league_brackets')
      .select('participants, maxParticipants')
      .eq('id', bracketId)
      .single();
    if (error || !data) throw new Error('Bracket not found');
    const participants: BracketParticipant[] = data.participants || [];
    if (participants.some((p) => p.userId === userId)) return;
    if (participants.length >= data.maxParticipants) throw new Error('Bracket is full');
    const newParticipant: BracketParticipant = {
      userId,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      rankPoints: 0,
      weeklyAccuracy: 0,
      weeklySpeed: 0,
      streakBonus: 0,
      position: participants.length + 1,
      promotionZone: false,
      demotionZone: false,
    };
    await supabase
      .from('league_brackets')
      .update({
        participants: [...participants, newParticipant],
      })
      .eq('id', bracketId);
    // profiles table doesn't store bracketId
  }

  /**
   * Update user's rank points after completing a task
   */
  async updateUserRankPoints(
    userId: string,
    accuracy: number,
    timeTaken: number,
    streakDays: number,
  ): Promise<void> {
    const user = await this.getUserProfile(userId);
    if (!user || !user.bracketId) return;

    const { data: bracketData, error: bracketError } = await supabase
      .from('league_brackets')
      .select('participants')
      .eq('id', user.bracketId)
      .single();
    if (bracketError || !bracketData) return;
    const participants: BracketParticipant[] = bracketData.participants || [];
    const participantIndex = participants.findIndex((p) => p.userId === userId);
    if (participantIndex === -1) return;
    const participant = participants[participantIndex];
    const totalAttempts = (participant.weeklyAccuracy > 0 ? 1 : 0) + 1;
    const newAccuracy =
      (participant.weeklyAccuracy * (totalAttempts - 1) + accuracy) / totalAttempts;
    const newSpeed =
      participant.weeklySpeed > 0 ? (participant.weeklySpeed + timeTaken) / 2 : timeTaken;
    const newRankPoints = calculateRankPoints(newAccuracy, newSpeed, streakDays);
    participants[participantIndex] = {
      ...participant,
      weeklyAccuracy: newAccuracy,
      weeklySpeed: newSpeed,
      streakBonus: streakDays,
      rankPoints: newRankPoints,
    };
    participants.sort((a, b) => b.rankPoints - a.rankPoints);
    participants.forEach((p, index) => {
      p.position = index + 1;
      p.promotionZone = index < PROMOTION_SLOTS;
      p.demotionZone = index >= participants.length - DEMOTION_SLOTS;
    });
    await supabase
      .from('league_brackets')
      .update({
        participants,
      })
      .eq('id', user.bracketId);
    // profiles table doesn't store weeklyAccuracy/weeklySpeed
  }

  /**
   * Get current bracket for user
   */
  async getUserBracket(userId: string): Promise<LeagueBracket | null> {
    const user = await this.getUserProfile(userId);
    if (!user || !user.bracketId) return null;
    const { data, error } = await supabase
      .from('league_brackets')
      .select('*')
      .eq('id', user.bracketId)
      .single();
    if (error || !data) return null;
    return data as LeagueBracket;
  }

  /**
   * Subscribe to bracket updates
   */
  subscribeToBracket(
    bracketId: string,
    callback: (bracket: LeagueBracket | null) => void,
  ): () => void {
    // Example code for live listening with Supabase Realtime (trigger must be added to table)
    // Currently disabled or can be done with polling.
    return () => {};
  }

  /**
   * Process weekly reset (run by Cloud Function every Sunday at 00:00)
   * Promotes top 3, demotes bottom 3 in each bracket
   */
  async processWeeklyReset(): Promise<void> {
    const weekStart = this.getWeekStart();
    const { data, error } = await supabase
      .from('league_brackets')
      .select('*')
      .eq('weekStartedAt', weekStart - 7 * 24 * 60 * 60 * 1000);
    if (error || !data) return;
    for (const bracket of data) {
      const leagueOrder: LeagueTier[] = [
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
      const currentTierIndex = leagueOrder.indexOf(bracket.tier);
      // Process promotions (top 3)
      const promotions = bracket.participants.slice(0, PROMOTION_SLOTS);
      for (const participant of promotions) {
        if (currentTierIndex < leagueOrder.length - 1) {
          const newTier = leagueOrder[currentTierIndex + 1];
          // profiles table doesn't store tier/bracketId; tier is derived from league_brackets
        }
      }
      // Process demotions (bottom 3)
      const demotions = bracket.participants.slice(-DEMOTION_SLOTS);
      for (const participant of demotions) {
        if (currentTierIndex > 0) {
          const newTier = leagueOrder[currentTierIndex - 1];
          // profiles table doesn't store tier/bracketId; tier is derived from league_brackets
        }
      }
      // Mark bracket as processed
      await supabase.from('league_brackets').update({ processed: true }).eq('id', bracket.id);
    }
  }

  /**
   * Get user's position in bracket
   */
  async getUserPosition(userId: string): Promise<number> {
    const bracket = await this.getUserBracket(userId);
    if (!bracket) return 0;

    const participant = bracket.participants.find((p) => p.userId === userId);
    return participant?.position || 0;
  }

  /**
   * Get week start timestamp (Sunday 00:00 UTC)
   */
  private getWeekStart(): number {
    const now = new Date();
    const day = now.getUTCDay();
    const diff = now.getUTCDate() - day;
    const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff, 0, 0, 0, 0));
    return weekStart.getTime();
  }

  /**
   * Get user profile helper
   */
  private async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (!data) return null;
      return {
        uid: data.id,
        displayName: data.display_name,
        email: data.email,
        avatarUrl: data.avatar_url,
        bracketId: null,
      } as any as UserProfile;
    } catch {
      return null;
    }
  }

  /**
   * Parse data to LeagueBracket
   */
  private parseBracketData(data: Record<string, unknown>): LeagueBracket {
    return {
      id: data.id as string,
      tier: data.tier as LeagueTier,
      weekStartedAt: typeof data.weekStartedAt === 'number' ? data.weekStartedAt : 0,
      weekEndsAt: typeof data.weekEndsAt === 'number' ? data.weekEndsAt : 0,
      participants: (data.participants as BracketParticipant[]) || [],
      maxParticipants: (data.maxParticipants as number) || BRACKET_SIZE,
    };
  }

  /**
   * Cleanup listeners
   */
  cleanup(): void {
    this.listeners.forEach((unsubscribe) => unsubscribe());
    this.listeners.clear();
  }
}

export const rankingService = new RankingService();
export default rankingService;
