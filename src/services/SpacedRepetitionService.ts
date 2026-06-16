/**
 * SpacedRepetitionService — Leitner Kutu Sistemi
 *
 * Aralıklı tekrar algoritması ile öğrenilen konuları optimize edilen
 * aralıklarla tekrar ettirir. 5 kutu sistemi kullanır.
 *
 * Kutu 1: Her gün tekrar
 * Kutu 2: 2 günde bir
 * Kutu 3: 4 günde bir
 * Kutu 4: 7 günde bir
 * Kutu 5: 14 günde bir (öğrenildi sayılır)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface FlashCard {
  id: string;
  /** Kartın ön yüzü (soru) */
  front: string;
  /** Kartın arka yüzü (cevap) */
  back: string;
  /** Konu/kategori */
  category: string;
  /** Alt konu */
  subcategory?: string;
  /** Bulunduğu kutu (1-5) */
  box: number;
  /** Son tekrar tarihi */
  lastReviewed: string;
  /** Sonraki tekrar tarihi */
  nextReview: string;
  /** Toplam doğru cevap */
  correctCount: number;
  /** Toplam yanlış cevap */
  incorrectCount: number;
  /** Oluşturulma tarihi */
  createdAt: string;
  /** İpucu */
  hint?: string;
  /** Görsel URL */
  imageUrl?: string;
}

export interface ReviewSession {
  /** Bugün tekrar edilecek kartlar */
  dueCards: FlashCard[];
  /** Toplam kart sayısı */
  totalCards: number;
  /** Kutu dağılımı */
  boxDistribution: Record<number, number>;
  /** Bugün tekrar edilecek kart sayısı */
  dueCount: number;
  /** Streak (ardışık gün tekrar) */
  reviewStreak: number;
  /** Ustalık yüzdesi (kutu 4-5 oranı) */
  masteryPercentage: number;
}

export interface ReviewResult {
  cardId: string;
  wasCorrect: boolean;
  /** Yeni kutu numarası */
  newBox: number;
  /** Sonraki tekrar tarihi */
  nextReview: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

/** Her kutunun tekrar aralığı (gün) */
const BOX_INTERVALS: Record<number, number> = {
  1: 1,
  2: 2,
  3: 4,
  4: 7,
  5: 14,
};

/** Günlük maksimum yeni kart */
const MAX_NEW_CARDS_PER_DAY = 10;
/** Günlük maksimum tekrar kart */
const MAX_REVIEW_CARDS_PER_DAY = 30;

const STORAGE_KEY = '@neuralis_spaced_repetition';
const STREAK_KEY = '@neuralis_sr_streak';

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════

class SpacedRepetitionService {
  private getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getNextReviewDate(box: number): string {
    const days = BOX_INTERVALS[box] || 1;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  /** Tüm kartları al */
  async getAllCards(): Promise<FlashCard[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /** Kartları kaydet */
  private async saveCards(cards: FlashCard[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  }

  /** Yeni kart ekle */
  async addCard(
    front: string,
    back: string,
    category: string,
    subcategory?: string,
    hint?: string,
  ): Promise<FlashCard> {
    const cards = await this.getAllCards();
    const card: FlashCard = {
      id: `sr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      front,
      back,
      category,
      subcategory,
      box: 1,
      lastReviewed: this.getToday(),
      nextReview: this.getToday(),
      correctCount: 0,
      incorrectCount: 0,
      createdAt: this.getToday(),
      hint,
    };
    cards.push(card);
    await this.saveCards(cards);
    return card;
  }

  /** Dersten otomatik kart oluştur */
  async addCardsFromLesson(
    lessonData: { question: string; answer: string; category: string }[],
  ): Promise<FlashCard[]> {
    const newCards: FlashCard[] = [];
    for (const item of lessonData) {
      const card = await this.addCard(item.question, item.answer, item.category);
      newCards.push(card);
    }
    return newCards;
  }

  /** Bugün tekrar edilecek kartları al */
  async getDueCards(): Promise<FlashCard[]> {
    const cards = await this.getAllCards();
    const today = this.getToday();
    return cards
      .filter((c) => c.nextReview <= today)
      .sort((a, b) => a.box - b.box) // Düşük kutular önce
      .slice(0, MAX_REVIEW_CARDS_PER_DAY);
  }

  /** Tekrar oturumu bilgisi al */
  async getReviewSession(): Promise<ReviewSession> {
    const cards = await this.getAllCards();
    const dueCards = await this.getDueCards();
    const streak = await this.getReviewStreak();

    const boxDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    cards.forEach((c) => {
      boxDistribution[c.box] = (boxDistribution[c.box] || 0) + 1;
    });

    const masteredCount = (boxDistribution[4] || 0) + (boxDistribution[5] || 0);
    const masteryPercentage =
      cards.length > 0 ? Math.round((masteredCount / cards.length) * 100) : 0;

    return {
      dueCards,
      totalCards: cards.length,
      boxDistribution,
      dueCount: dueCards.length,
      reviewStreak: streak,
      masteryPercentage,
    };
  }

  /** Kart cevaplandı */
  async reviewCard(cardId: string, wasCorrect: boolean): Promise<ReviewResult> {
    const cards = await this.getAllCards();
    const idx = cards.findIndex((c) => c.id === cardId);
    if (idx === -1) throw new Error('Card not found');

    const card = cards[idx];

    if (wasCorrect) {
      card.correctCount += 1;
      card.box = Math.min(5, card.box + 1);
    } else {
      card.incorrectCount += 1;
      card.box = 1; // Yanlış cevap = kutu 1'e geri
    }

    card.lastReviewed = this.getToday();
    card.nextReview = this.getNextReviewDate(card.box);
    cards[idx] = card;

    await this.saveCards(cards);
    await this.updateReviewStreak();

    return {
      cardId: card.id,
      wasCorrect,
      newBox: card.box,
      nextReview: card.nextReview,
    };
  }

  /** Tekrar streak'ini güncelle */
  private async updateReviewStreak(): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(STREAK_KEY);
      const data = raw ? JSON.parse(raw) : { streak: 0, lastDate: '' };
      const today = this.getToday();

      if (data.lastDate === today) return; // Bugün zaten güncellendi

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (data.lastDate === yesterdayStr) {
        data.streak += 1;
      } else {
        data.streak = 1;
      }
      data.lastDate = today;

      await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(data));
    } catch {}
  }

  /** Tekrar streak'ini al */
  async getReviewStreak(): Promise<number> {
    try {
      const raw = await AsyncStorage.getItem(STREAK_KEY);
      if (!raw) return 0;
      const data = JSON.parse(raw);
      const today = this.getToday();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (data.lastDate === today || data.lastDate === yesterday.toISOString().split('T')[0]) {
        return data.streak || 0;
      }
      return 0;
    } catch {
      return 0;
    }
  }

  /** Kategori bazlı istatistik */
  async getCategoryStats(): Promise<
    Record<string, { total: number; mastered: number; due: number }>
  > {
    const cards = await this.getAllCards();
    const today = this.getToday();
    const stats: Record<string, { total: number; mastered: number; due: number }> = {};

    cards.forEach((c) => {
      if (!stats[c.category]) stats[c.category] = { total: 0, mastered: 0, due: 0 };
      stats[c.category].total += 1;
      if (c.box >= 4) stats[c.category].mastered += 1;
      if (c.nextReview <= today) stats[c.category].due += 1;
    });

    return stats;
  }

  /** Kartı sil */
  async deleteCard(cardId: string): Promise<void> {
    const cards = await this.getAllCards();
    await this.saveCards(cards.filter((c) => c.id !== cardId));
  }

  /** Sunucuya senkronize et */
  async syncToServer(userId: string): Promise<void> {
    try {
      const cards = await this.getAllCards();
      await supabase.from('spaced_repetition').upsert(
        {
          user_id: userId,
          cards: JSON.stringify(cards),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
    } catch (e) {
      console.warn('SR sync failed', e);
    }
  }
}

export const spacedRepetitionService = new SpacedRepetitionService();
export default spacedRepetitionService;
