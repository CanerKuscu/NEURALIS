/**
 * LeagueService - Weekly Ranking System
 * Weekly leagues, promotion & demotion calculation
 */

import { supabase } from '../config/supabase';
import { LEAGUE_CONFIG } from '../constants/theme';

export interface LeagueParticipant {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  weeklyXP: number;
  rank: number;
  zone: 'promotion' | 'safe' | 'demotion';
}

export interface LeagueBracket {
  id: string;
  tier: string;
  tierName: string;
  tierIcon: string;
  weekStart: string;
  weekEnd: string;
  participants: LeagueParticipant[];
  userRank: number;
  userZone: 'promotion' | 'safe' | 'demotion';
}

class LeagueService {
  private readonly config = LEAGUE_CONFIG;

  /**
   * Gets the user's current league bracket
   */
  async getCurrentBracket(userId: string): Promise<LeagueBracket | null> {
    try {
      // Find the active league week
      const now = new Date();
      const weekStart = this.getWeekStart(now);
      const weekEnd = this.getWeekEnd(now);

      // Get the user's tier info
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_league, total_xp')
        .eq('id', userId)
        .single();

      const tier = profile?.current_league || 'bronze';
      const tierInfo = this.config.tiers.find((t) => t.id === tier) || this.config.tiers[0];

      // Get participants in the league
      const { data: participants, error } = await supabase
        .from('league_brackets')
        .select(
          `
          id,
          participants:league_participants(
            user_id,
            weekly_xp,
            profiles(display_name, avatar_url)
          )
        `,
        )
        .eq('tier', tier)
        .gte('week_start', weekStart.toISOString())
        .lte('week_start', weekEnd.toISOString())
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // If no bracket exists or user is not included, create/join
      if (!participants) {
        return this.createOrJoinBracket(userId, tier);
      }

      // Rank participants
      const rankedParticipants = this.rankParticipants(participants.participants || []);

      // Find the user's position
      const userIndex = rankedParticipants.findIndex((p) => p.userId === userId);
      const userRank = userIndex >= 0 ? userIndex + 1 : 0;
      const userZone = this.getZone(userRank, rankedParticipants.length);

      return {
        id: participants.id,
        tier,
        tierName: tierInfo.name,
        tierIcon: tierInfo.icon,
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        participants: rankedParticipants,
        userRank,
        userZone,
      };
    } catch (error) {
      console.error('Failed to get current bracket:', error);
      return null;
    }
  }

  /**
   * Create a new bracket or join an existing one
   */
  private async createOrJoinBracket(userId: string, tier: string): Promise<LeagueBracket | null> {
    try {
      const weekStart = this.getWeekStart(new Date());
      const weekEnd = this.getWeekEnd(new Date());
      const tierInfo = this.config.tiers.find((t) => t.id === tier) || this.config.tiers[0];

      // Check if there's an available bracket
      const { data: existingBracket } = await supabase
        .from('league_brackets')
        .select('id, participant_count')
        .eq('tier', tier)
        .gte('week_start', weekStart.toISOString())
        .lt('participant_count', this.config.participantsPerBracket)
        .single();

      let bracketId: string;

      if (existingBracket) {
        bracketId = existingBracket.id;
      } else {
        // Create a new bracket
        const { data: newBracket, error } = await supabase
          .from('league_brackets')
          .insert({
            tier,
            week_start: weekStart.toISOString(),
            week_end: weekEnd.toISOString(),
            participant_count: 0,
          })
          .select()
          .single();

        if (error) throw error;
        bracketId = newBracket.id;
      }

      // Add user to the bracket
      await supabase.from('league_participants').upsert({
        bracket_id: bracketId,
        user_id: userId,
        weekly_xp: 0,
        joined_at: new Date().toISOString(),
      });

      // Update participant count
      await supabase.rpc('increment_bracket_participants', {
        p_bracket_id: bracketId,
      });

      return this.getCurrentBracket(userId);
    } catch (error) {
      console.error('Failed to create/join bracket:', error);
      return null;
    }
  }

  /**
   * Adds weekly XP
   */
  async addWeeklyXP(userId: string, xp: number): Promise<void> {
    try {
      const bracket = await this.getCurrentBracket(userId);
      if (!bracket) return;

      await supabase.rpc('add_weekly_xp', {
        p_user_id: userId,
        p_bracket_id: bracket.id,
        p_xp: xp,
      });
    } catch (error) {
      console.error('Failed to add weekly XP:', error);
    }
  }

  /**
   * End-of-week league calculation (runs via cron job)
   */
  async processWeekEnd(bracketId: string): Promise<{
    promoted: string[];
    demoted: string[];
  }> {
    try {
      const { data: bracket } = await supabase
        .from('league_brackets')
        .select(
          `
          id,
          tier,
          participants:league_participants(
            user_id,
            weekly_xp
          )
        `,
        )
        .eq('id', bracketId)
        .single();

      if (!bracket || !bracket.participants) {
        return { promoted: [], demoted: [] };
      }

      const ranked = this.rankParticipants(bracket.participants);
      const total = ranked.length;

      // Promotion and demotion thresholds
      const promotionCutoff = Math.ceil(total * this.config.promotion.percentage);
      const demotionCutoff = Math.floor(total * (1 - this.config.demotion.percentage));

      const promoted: string[] = [];
      const demoted: string[] = [];

      for (let i = 0; i < ranked.length; i++) {
        const participant = ranked[i];

        if (i < promotionCutoff) {
          // Promote
          promoted.push(participant.userId);
          await this.promoteTier(participant.userId, bracket.tier);
        } else if (i >= demotionCutoff) {
          // Demote
          demoted.push(participant.userId);
          await this.demoteTier(participant.userId, bracket.tier);
        }
      }

      // Mark league as complete
      await supabase.from('league_brackets').update({ is_complete: true }).eq('id', bracketId);

      return { promoted, demoted };
    } catch (error) {
      console.error('Failed to process week end:', error);
      return { promoted: [], demoted: [] };
    }
  }

  /**
   * Promote tier
   */
  private async promoteTier(userId: string, currentTier: string): Promise<void> {
    const tiers = this.config.tiers.map((t) => t.id as string);
    const currentIndex = tiers.indexOf(currentTier);

    if (currentIndex < tiers.length - 1) {
      const newTier = tiers[currentIndex + 1];
      await supabase.from('profiles').update({ current_league: newTier }).eq('id', userId);
    }
  }

  /**
   * Demote tier
   */
  private async demoteTier(userId: string, currentTier: string): Promise<void> {
    const tiers = this.config.tiers.map((t) => t.id as string);
    const currentIndex = tiers.indexOf(currentTier);

    if (currentIndex > 0) {
      const newTier = tiers[currentIndex - 1];
      await supabase.from('profiles').update({ current_league: newTier }).eq('id', userId);
    }
  }

  /**
   * Ranks participants
   */
  private rankParticipants(participants: any[]): LeagueParticipant[] {
    return participants
      .map((p) => ({
        userId: p.user_id,
        displayName: p.profiles?.display_name || 'User',
        avatarUrl: p.profiles?.avatar_url,
        weeklyXP: p.weekly_xp || 0,
        rank: 0,
        zone: 'safe' as const,
      }))
      .sort((a, b) => b.weeklyXP - a.weeklyXP)
      .map((p, index, arr) => ({
        ...p,
        rank: index + 1,
        zone: this.getZone(index + 1, arr.length),
      }));
  }

  /**
   * Determines zone based on ranking
   */
  private getZone(rank: number, total: number): 'promotion' | 'safe' | 'demotion' {
    const promotionCutoff = Math.ceil(total * this.config.promotion.percentage);
    const demotionCutoff = Math.floor(total * (1 - this.config.demotion.percentage));

    if (rank <= promotionCutoff) return 'promotion';
    if (rank > demotionCutoff) return 'demotion';
    return 'safe';
  }

  /**
   * Calculates the start of the week (Monday)
   */
  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Calculates the end of the week (Sunday)
   */
  private getWeekEnd(date: Date): Date {
    const start = this.getWeekStart(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }
}

export const leagueService = new LeagueService();
export default leagueService;
