/**
 * NEURALIS - Duel Service
 * Handles real-time 1v1 matchmaking and game state management.
 *
 * Nöral Düello (PvP):
 * - Arkadaşınla yarış
 * - Kaybeden XP veya seri kaybeder
 * - Kazanan çift XP kazanır
 */

import { supabase } from '../config/supabase';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

/** Represents the state of the duel game board */
export interface BoardState {
  /** Current round number (1-based) */
  round: number;
  /** Score for player 1 */
  player1Score: number;
  /** Score for player 2 */
  player2Score: number;
  /** IDs of questions already used in this duel */
  questionIds: string[];
  /** Current question being answered, null if between rounds */
  currentQuestionId: string | null;
}

export type GameStatus = 'waiting' | 'active' | 'finished';

export interface GameState {
  id: string;
  player1_id: string;
  player2_id: string | null;
  status: GameStatus;
  winner_id: string | null;
  current_turn: string | null;
  board_state: BoardState;
}

/** Duel sonuç verisi */
export interface DuelResult {
  winnerId: string;
  loserId: string;
  winnerXP: number;
  loserXPPenalty: number;
  loserStreakPenalty: boolean;
  winnerScore: number;
  loserScore: number;
}

/** Duel config */
export const DUEL_CONFIG = {
  /** Kazanan XP çarpanı */
  WINNER_XP_MULTIPLIER: 2,
  /** Kaybeden XP cezası */
  LOSER_XP_PENALTY: 15,
  /** Kaybeden seri kaybeder mi? (streak > 3 ise) */
  STREAK_PENALTY_THRESHOLD: 3,
  /** Kaybeden seri cezası (gün) */
  STREAK_PENALTY_DAYS: 1,
  /** Soru sayısı */
  QUESTIONS_PER_DUEL: 10,
  /** Soru başına süre (saniye) */
  TIME_PER_QUESTION: 15,
  /** Minimum XP ödülü (kazanan) */
  MIN_WINNER_XP: 50,
} as const;

export const DuelService = {
  /**
   * Find or create a match
   */
  findMatch: async (userId: string) => {
    // 1. Try to join an existing waiting game
    const { data: availableGames } = await supabase
      .from('games')
      .select('*')
      .eq('status', 'waiting')
      .is('player2_id', null)
      .neq('player1_id', userId)
      .limit(1)
      .single();

    if (availableGames) {
      // Join this game
      const { data: joinedGame, error } = await supabase
        .from('games')
        .update({
          player2_id: userId,
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', availableGames.id)
        .select()
        .single();

      if (error) throw error;
      return { game: joinedGame, role: 'player2' };
    }

    // 2. Create a new game if none found
    const { data: newGame, error } = await supabase
      .from('games')
      .insert({
        player1_id: userId,
        status: 'waiting',
        current_turn: userId,
        board_state: {},
      })
      .select()
      .single();

    if (error) throw error;
    return { game: newGame, role: 'player1' };
  },

  /**
   * Subscribe to game updates
   */
  subscribeToGame: (gameId: string, onUpdate: (game: GameState) => void) => {
    const channel = supabase
      .channel(`game:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          onUpdate(payload.new as GameState);
        },
      )
      .subscribe();

    return channel;
  },

  /**
   * Düello sonucunu işle - kaybeden XP ve/veya seri kaybeder
   */
  processDuelResult: async (
    gameId: string,
    winnerId: string,
    loserId: string,
    winnerScore: number,
    loserScore: number,
  ): Promise<DuelResult> => {
    const winnerXP = Math.max(
      DUEL_CONFIG.MIN_WINNER_XP,
      winnerScore * 10 * DUEL_CONFIG.WINNER_XP_MULTIPLIER,
    );

    // Kaybeden XP cezası
    const loserXPPenalty = DUEL_CONFIG.LOSER_XP_PENALTY;

    // Kazanan XP ekle
    await supabase.rpc('add_user_xp', {
      p_user_id: winnerId,
      p_xp_amount: winnerXP,
    });

    // Kaybeden XP düş
    await supabase.rpc('add_user_xp', {
      p_user_id: loserId,
      p_xp_amount: -loserXPPenalty,
    });

    // Kaybeden streak cezası kontrolü
    let loserStreakPenalty = false;
    const { data: loserProfile } = await supabase
      .from('profiles')
      .select('streak_count')
      .eq('id', loserId)
      .single();

    if (loserProfile && loserProfile.streak_count > DUEL_CONFIG.STREAK_PENALTY_THRESHOLD) {
      const newStreak = Math.max(0, loserProfile.streak_count - DUEL_CONFIG.STREAK_PENALTY_DAYS);
      await supabase
        .from('profiles')
        .update({
          streak_count: newStreak,
        })
        .eq('id', loserId);
      loserStreakPenalty = true;
    }

    // Oyun durumunu güncelle
    await supabase
      .from('games')
      .update({
        status: 'finished',
        winner_id: winnerId,
        board_state: {
          player1Score: winnerScore,
          player2Score: loserScore,
          round: DUEL_CONFIG.QUESTIONS_PER_DUEL,
          questionIds: [],
          currentQuestionId: null,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', gameId);

    return {
      winnerId,
      loserId,
      winnerXP,
      loserXPPenalty,
      loserStreakPenalty,
      winnerScore,
      loserScore,
    };
  },

  /**
   * Leave query/waiting state
   */
  cancelSearch: async (gameId: string) => {
    await supabase.from('games').delete().eq('id', gameId);
  },
};
