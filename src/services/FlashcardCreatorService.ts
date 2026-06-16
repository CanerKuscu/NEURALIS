/**
 * NEURALIS - Flashcard Creator Service
 * Kullanıcı kart oluşturma + AI otomatik oluşturma, Spaced Repetition entegrasyonu
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { deepSeekService } from './DeepSeekService';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  category: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  createdBy: 'user' | 'ai';
  box: number; // Leitner box 1-5
  nextReview: string;
  reviewCount: number;
  correctCount: number;
  createdAt: string;
}

export interface FlashcardDeck {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  cards: Flashcard[];
  createdAt: string;
  lastStudied?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = '@neuralis/flashcard_decks';
const BOX_INTERVALS = [0, 1, 3, 7, 14, 30]; // days until next review per box

class FlashcardCreatorService {
  async getDecks(userId: string): Promise<FlashcardDeck[]> {
    try {
      const raw = await AsyncStorage.getItem(`${STORAGE_KEY}_${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  async createDeck(
    userId: string,
    title: string,
    category: string,
    description?: string,
  ): Promise<FlashcardDeck> {
    const deck: FlashcardDeck = {
      id: `deck_${Date.now()}`,
      userId,
      title,
      description: description || '',
      category,
      cards: [],
      createdAt: new Date().toISOString(),
    };
    const decks = await this.getDecks(userId);
    decks.push(deck);
    await this.saveDecks(userId, decks);
    return deck;
  }

  async addCard(
    userId: string,
    deckId: string,
    front: string,
    back: string,
    tags: string[] = [],
  ): Promise<Flashcard> {
    const card: Flashcard = {
      id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      front,
      back,
      category: '',
      tags,
      difficulty: 'medium',
      createdBy: 'user',
      box: 1,
      nextReview: new Date().toISOString(),
      reviewCount: 0,
      correctCount: 0,
      createdAt: new Date().toISOString(),
    };
    const decks = await this.getDecks(userId);
    const deck = decks.find((d) => d.id === deckId);
    if (deck) {
      deck.cards.push(card);
      await this.saveDecks(userId, decks);
    }
    return card;
  }

  async generateAICards(
    userId: string,
    deckId: string,
    topic: string,
    count: number = 5,
  ): Promise<Flashcard[]> {
    const generated: Flashcard[] = [];
    try {
      const lesson = await deepSeekService.generateLesson({
        userId,
        category: topic,
        questionCount: count,
        customPrompt: `Generate ${count} flashcard pairs for the topic "${topic}". For each, provide a "front" (question/term) and "back" (answer/definition). Keep them concise. Format as JSON array: [{"front": "...", "back": "..."}]. Answer in Turkish.`,
      });

      if (lesson?.questions) {
        for (const q of lesson.questions) {
          generated.push({
            id: `card_ai_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            front: q.question,
            back: q.explanation || String(q.correctAnswer),
            category: topic,
            tags: ['ai-generated'],
            difficulty: q.difficulty || 'medium',
            createdBy: 'ai',
            box: 1,
            nextReview: new Date().toISOString(),
            reviewCount: 0,
            correctCount: 0,
            createdAt: new Date().toISOString(),
          });
        }
      }

      if (generated.length > 0) {
        const decks = await this.getDecks(userId);
        const deck = decks.find((d) => d.id === deckId);
        if (deck) {
          deck.cards.push(...generated);
          await this.saveDecks(userId, decks);
        }
      }
    } catch (e) {
      console.warn('AI card generation failed:', e);
    }
    return generated;
  }

  async reviewCard(
    userId: string,
    deckId: string,
    cardId: string,
    correct: boolean,
  ): Promise<void> {
    const decks = await this.getDecks(userId);
    const deck = decks.find((d) => d.id === deckId);
    if (!deck) return;
    const card = deck.cards.find((c) => c.id === cardId);
    if (!card) return;

    card.reviewCount += 1;
    if (correct) {
      card.correctCount += 1;
      card.box = Math.min(card.box + 1, 5);
    } else {
      card.box = 1;
    }

    const days = BOX_INTERVALS[card.box] || 1;
    const next = new Date();
    next.setDate(next.getDate() + days);
    card.nextReview = next.toISOString();

    deck.lastStudied = new Date().toISOString();
    await this.saveDecks(userId, decks);
  }

  async getDueCards(userId: string, deckId: string): Promise<Flashcard[]> {
    const decks = await this.getDecks(userId);
    const deck = decks.find((d) => d.id === deckId);
    if (!deck) return [];
    const now = new Date();
    return deck.cards.filter((c) => new Date(c.nextReview) <= now);
  }

  async deleteCard(userId: string, deckId: string, cardId: string): Promise<void> {
    const decks = await this.getDecks(userId);
    const deck = decks.find((d) => d.id === deckId);
    if (deck) {
      deck.cards = deck.cards.filter((c) => c.id !== cardId);
      await this.saveDecks(userId, decks);
    }
  }

  async deleteDeck(userId: string, deckId: string): Promise<void> {
    const decks = await this.getDecks(userId);
    await this.saveDecks(
      userId,
      decks.filter((d) => d.id !== deckId),
    );
  }

  private async saveDecks(userId: string, decks: FlashcardDeck[]): Promise<void> {
    await AsyncStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(decks));
  }
}

export const flashcardCreatorService = new FlashcardCreatorService();
