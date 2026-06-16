/**
 * ShareCardService — Paylaşılabilir Başarı Kartları
 *
 * Instagram story formatında istatistik kartları
 * Başarı rozetleri paylaşma
 * Haftalık/aylık özet kartlar
 */

import { Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ShareableCard {
  id: string;
  type: ShareCardType;
  title: string;
  titleTr: string;
  /** Gradient renkleri */
  colors: string[];
  /** Emoji */
  emoji: string;
  /** Paylaşım metni */
  shareText: string;
  /** Kart verileri */
  data: Record<string, any>;
  createdAt: string;
}

export type ShareCardType =
  | 'streak' // Seri kartı
  | 'xp-milestone' // XP başarısı
  | 'league-promotion' // Lig yükselme
  | 'achievement' // Rozet kazanma
  | 'weekly-summary' // Haftalık özet
  | 'duel-win' // Düello kazanma
  | 'level-up' // Seviye atlama
  | 'tournament-rank' // Turnuva sıralaması
  | 'custom'; // Özel kart

export interface CardTemplate {
  type: ShareCardType;
  title: string;
  titleTr: string;
  emoji: string;
  colors: string[];
  generateText: (data: Record<string, any>) => string;
  generateTextTr: (data: Record<string, any>) => string;
}

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════

export const CARD_TEMPLATES: CardTemplate[] = [
  {
    type: 'streak',
    title: 'Streak Record!',
    titleTr: 'Seri Rekoru!',
    emoji: '🔥',
    colors: ['#FF6B35', '#F7931E', '#FFB800'],
    generateText: (d) => `🔥 ${d.streak} day streak on Neuralis! Never stop learning!`,
    generateTextTr: (d) =>
      `🔥 Neuralis'te ${d.streak} günlük seri! Öğrenmeye devam! #Neuralis #Learning`,
  },
  {
    type: 'xp-milestone',
    title: 'XP Milestone!',
    titleTr: 'XP Başarısı!',
    emoji: '⭐',
    colors: ['#9B59B6', '#8E44AD', '#6C3483'],
    generateText: (d) => `⭐ Just hit ${d.xp} XP on Neuralis! Knowledge is power!`,
    generateTextTr: (d) => `⭐ Neuralis'te ${d.xp} XP'ye ulaştım! Bilgi güçtür! #Neuralis`,
  },
  {
    type: 'league-promotion',
    title: 'League Up!',
    titleTr: 'Lig Yükselme!',
    emoji: '🏆',
    colors: ['#F1C40F', '#F39C12', '#E67E22'],
    generateText: (d) => `🏆 Promoted to ${d.league} League on Neuralis!`,
    generateTextTr: (d) => `🏆 Neuralis'te ${d.league} ligine yükseldim! #Neuralis #League`,
  },
  {
    type: 'achievement',
    title: 'Achievement Unlocked!',
    titleTr: 'Başarı Kazanıldı!',
    emoji: '🎖️',
    colors: ['#2ECC71', '#27AE60', '#1E8449'],
    generateText: (d) => `🎖️ Unlocked "${d.title}" on Neuralis!`,
    generateTextTr: (d) => `🎖️ Neuralis'te "${d.title}" başarısını açtım! #Neuralis`,
  },
  {
    type: 'weekly-summary',
    title: 'Weekly Summary',
    titleTr: 'Haftalık Özet',
    emoji: '📊',
    colors: ['#3498DB', '#2980B9', '#1F618D'],
    generateText: (d) =>
      `📊 This week on Neuralis: ${d.lessons} lessons, ${d.xp} XP, ${d.streak} day streak!`,
    generateTextTr: (d) =>
      `📊 Bu hafta Neuralis'te: ${d.lessons} ders, ${d.xp} XP, ${d.streak} günlük seri! #Neuralis`,
  },
  {
    type: 'duel-win',
    title: 'Duel Victory!',
    titleTr: 'Düello Zaferi!',
    emoji: '⚔️',
    colors: ['#E74C3C', '#C0392B', '#922B21'],
    generateText: (d) => `⚔️ Won a duel on Neuralis! Score: ${d.myScore}-${d.opponentScore}`,
    generateTextTr: (d) =>
      `⚔️ Neuralis'te düello kazandım! Skor: ${d.myScore}-${d.opponentScore} #Neuralis`,
  },
  {
    type: 'level-up',
    title: 'Level Up!',
    titleTr: 'Seviye Atladım!',
    emoji: '🆙',
    colors: ['#00B894', '#00CEC9', '#0984E3'],
    generateText: (d) => `🆙 Reached Level ${d.level} on Neuralis! The brain keeps growing!`,
    generateTextTr: (d) =>
      `🆙 Neuralis'te Seviye ${d.level}'e ulaştım! Beyin büyümeye devam! #Neuralis`,
  },
  {
    type: 'tournament-rank',
    title: 'Tournament!',
    titleTr: 'Turnuva!',
    emoji: '🥇',
    colors: ['#FDCB6E', '#E17055', '#D63031'],
    generateText: (d) => `🥇 Ranked #${d.rank} in ${d.tournament} tournament on Neuralis!`,
    generateTextTr: (d) => `🥇 Neuralis ${d.tournament} turnuvasında ${d.rank}. oldum! #Neuralis`,
  },
];

const STORAGE_KEY = '@neuralis_share_cards';

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════

class ShareCardService {
  /** Kart oluştur */
  createCard(type: ShareCardType, data: Record<string, any>): ShareableCard {
    const template = CARD_TEMPLATES.find((t) => t.type === type);
    if (!template) throw new Error(`Unknown card type: ${type}`);

    return {
      id: `card-${Date.now()}`,
      type,
      title: template.title,
      titleTr: template.titleTr,
      colors: template.colors,
      emoji: template.emoji,
      shareText: template.generateTextTr(data),
      data,
      createdAt: new Date().toISOString(),
    };
  }

  /** Kartı paylaş (native share sheet) */
  async shareCard(card: ShareableCard): Promise<boolean> {
    try {
      const result = await Share.share({
        message: card.shareText,
        title: card.titleTr,
      });
      if (result.action === Share.sharedAction) {
        await this.saveSharedCard(card);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /** Hızlı paylaşım (tip ve veri ile) */
  async quickShare(type: ShareCardType, data: Record<string, any>): Promise<boolean> {
    const card = this.createCard(type, data);
    return this.shareCard(card);
  }

  /** Paylaşılan kart geçmişini al */
  async getSharedHistory(): Promise<ShareableCard[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /** Paylaşılan kartı kaydet */
  private async saveSharedCard(card: ShareableCard): Promise<void> {
    const history = await this.getSharedHistory();
    history.unshift(card);
    // Son 50 paylaşımı tut
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50)));
  }

  /** Haftalık özet kartı oluştur */
  createWeeklySummaryCard(lessons: number, xp: number, streak: number): ShareableCard {
    return this.createCard('weekly-summary', { lessons, xp, streak });
  }

  /** Seri kartı oluştur */
  createStreakCard(streak: number): ShareableCard {
    return this.createCard('streak', { streak });
  }
}

export const shareCardService = new ShareCardService();
export default shareCardService;
