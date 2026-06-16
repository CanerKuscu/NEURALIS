/**
 * NEURALIS - Quick Fire 60s Quiz Service
 * 60 saniyede hızlı quiz — tüm kategorilerden rastgele sorular
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { deepSeekService } from './DeepSeekService';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface QuickFireQuestion {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctAnswer: number;
  points: number;
  timeBonus: number; // extra points for fast answer
}

export interface QuickFireRound {
  id: string;
  userId: string;
  questions: QuickFireQuestion[];
  answers: { questionId: string; selectedAnswer: number; correct: boolean; timeMs: number }[];
  totalScore: number;
  correctCount: number;
  startedAt: string;
  finishedAt?: string;
}

export interface QuickFireLeaderboard {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  bestScore: number;
  bestCorrect: number;
  gamesPlayed: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════

const CATEGORIES = ['mathematics', 'science', 'coding', 'history', 'language', 'geography'];
const QUESTION_COUNT = 10;
const STORAGE_KEY = '@neuralis/quickfire_best';

class QuickFireService {
  async generateRound(userId: string): Promise<QuickFireRound> {
    // Pick random categories for each question
    const questions: QuickFireQuestion[] = [];
    const shuffled = [...CATEGORIES].sort(() => Math.random() - 0.5);

    // Generate quick questions using DeepSeek
    try {
      const lesson = await deepSeekService.generateLesson({
        userId,
        category: shuffled[0],
        difficulty: 'intermediate',
        questionCount: QUESTION_COUNT,
        customPrompt: `Generate ${QUESTION_COUNT} quick quiz questions from mixed categories: ${shuffled.slice(0, 4).join(', ')}. Each question should be answerable in under 6 seconds. Keep questions short and clear. Use multiple choice only with 4 options.`,
      });

      if (lesson?.questions) {
        lesson.questions.forEach((q, i) => {
          questions.push({
            id: `qf_${Date.now()}_${i}`,
            category: shuffled[i % shuffled.length],
            question: q.question,
            options: q.options || ['A', 'B', 'C', 'D'],
            correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
            points: 100,
            timeBonus: 50, // max bonus for fast answers
          });
        });
      }
    } catch (e) {
      console.warn('QuickFire generation failed, using fallback:', e);
    }

    // Fallback if AI fails
    if (questions.length < QUESTION_COUNT) {
      for (let i = questions.length; i < QUESTION_COUNT; i++) {
        const a = Math.floor(Math.random() * 50) + 1;
        const b = Math.floor(Math.random() * 50) + 1;
        questions.push({
          id: `qf_fb_${i}`,
          category: 'mathematics',
          question: `${a} + ${b} = ?`,
          options: [String(a + b), String(a + b + 1), String(a + b - 1), String(a * 2)],
          correctAnswer: 0,
          points: 100,
          timeBonus: 50,
        });
      }
    }

    return {
      id: `round_${Date.now()}`,
      userId,
      questions,
      answers: [],
      totalScore: 0,
      correctCount: 0,
      startedAt: new Date().toISOString(),
    };
  }

  calculateScore(timeMs: number, correct: boolean, basePoints: number, timeBonus: number): number {
    if (!correct) return 0;
    // Faster = more bonus (max bonus if answered in <2 seconds)
    const timeSec = timeMs / 1000;
    const bonus = timeSec < 2 ? timeBonus : timeSec < 4 ? timeBonus * 0.5 : 0;
    return Math.round(basePoints + bonus);
  }

  async saveResult(round: QuickFireRound): Promise<void> {
    try {
      // Save best score locally
      const bestRaw = await AsyncStorage.getItem(`${STORAGE_KEY}_${round.userId}`);
      const best = bestRaw ? JSON.parse(bestRaw) : { bestScore: 0, gamesPlayed: 0 };
      best.gamesPlayed += 1;
      if (round.totalScore > best.bestScore) {
        best.bestScore = round.totalScore;
        best.bestCorrect = round.correctCount;
      }
      await AsyncStorage.setItem(`${STORAGE_KEY}_${round.userId}`, JSON.stringify(best));

      // Save to supabase for leaderboard
      await supabase.from('quick_fire_scores').upsert(
        {
          user_id: round.userId,
          best_score: best.bestScore,
          best_correct: best.bestCorrect || round.correctCount,
          games_played: best.gamesPlayed,
          last_played_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
    } catch (e) {
      console.warn('Failed to save QuickFire result:', e);
    }
  }

  async getLeaderboard(): Promise<QuickFireLeaderboard[]> {
    try {
      const { data } = await supabase
        .from('quick_fire_scores')
        .select(
          'user_id, best_score, best_correct, games_played, profiles!inner(display_name, avatar_url)',
        )
        .order('best_score', { ascending: false })
        .limit(50);

      return (data || []).map((entry: any) => ({
        userId: entry.user_id,
        displayName: entry.profiles?.display_name || 'Anon',
        avatarUrl: entry.profiles?.avatar_url,
        bestScore: entry.best_score,
        bestCorrect: entry.best_correct,
        gamesPlayed: entry.games_played,
      }));
    } catch {
      return [];
    }
  }

  async getBestScore(userId: string): Promise<number> {
    try {
      const raw = await AsyncStorage.getItem(`${STORAGE_KEY}_${userId}`);
      return raw ? JSON.parse(raw).bestScore || 0 : 0;
    } catch {
      return 0;
    }
  }
}

export const quickFireService = new QuickFireService();
