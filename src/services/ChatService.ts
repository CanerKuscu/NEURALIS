/**
 * ChatService — Sohbet/Mesajlaşma Sistemi
 *
 * Arkadaşlarla mesajlaşma
 * Grup sohbetleri (kulüp sohbeti)
 * Emoji ve sticker desteği
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  type: 'text' | 'sticker' | 'achievement' | 'challenge' | 'system';
  /** Sticker veya başarı paylaşımı için ek veri */
  metadata?: Record<string, any>;
  createdAt: string;
  isRead: boolean;
}

export interface Chat {
  id: string;
  type: 'direct' | 'group' | 'club';
  name?: string;
  emoji?: string;
  participants: ChatParticipant[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: string;
}

export interface ChatParticipant {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  role: 'admin' | 'member';
  joinedAt: string;
  isOnline: boolean;
}

export interface Sticker {
  id: string;
  emoji: string;
  name: string;
  category: string;
  isPremium: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// STICKERS
// ═══════════════════════════════════════════════════════════════════════════

export const STICKER_PACKS: { category: string; stickers: Sticker[] }[] = [
  {
    category: 'Fox Reactions',
    stickers: [
      {
        id: 'fox-happy',
        emoji: '🦊😄',
        name: 'Mutlu Tilki',
        category: 'Fox Reactions',
        isPremium: false,
      },
      {
        id: 'fox-study',
        emoji: '🦊📚',
        name: 'Çalışkan Tilki',
        category: 'Fox Reactions',
        isPremium: false,
      },
      {
        id: 'fox-fire',
        emoji: '🦊🔥',
        name: 'Ateşli Tilki',
        category: 'Fox Reactions',
        isPremium: false,
      },
      {
        id: 'fox-sleep',
        emoji: '🦊😴',
        name: 'Uykucu Tilki',
        category: 'Fox Reactions',
        isPremium: false,
      },
      {
        id: 'fox-trophy',
        emoji: '🦊🏆',
        name: 'Şampiyon Tilki',
        category: 'Fox Reactions',
        isPremium: false,
      },
      {
        id: 'fox-crown',
        emoji: '🦊👑',
        name: 'Kral Tilki',
        category: 'Fox Reactions',
        isPremium: true,
      },
    ],
  },
  {
    category: 'Learning',
    stickers: [
      {
        id: 'brain-exp',
        emoji: '🧠💥',
        name: 'Beyin Patlaması',
        category: 'Learning',
        isPremium: false,
      },
      { id: 'light-bulb', emoji: '💡✨', name: 'Eureka!', category: 'Learning', isPremium: false },
      {
        id: 'rocket',
        emoji: '🚀📈',
        name: 'Roket Yükseliş',
        category: 'Learning',
        isPremium: false,
      },
      {
        id: 'fire-streak',
        emoji: '🔥💯',
        name: 'Ateş Serisi',
        category: 'Learning',
        isPremium: false,
      },
    ],
  },
];

const STORAGE_KEY = '@neuralis_chats';
const MESSAGES_KEY = '@neuralis_messages';

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════

class ChatService {
  /** Tüm sohbetleri al */
  async getChats(): Promise<Chat[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const chats: Chat[] = raw ? JSON.parse(raw) : [];
      return chats.sort((a, b) => {
        const aTime = a.lastMessage?.createdAt || a.createdAt;
        const bTime = b.lastMessage?.createdAt || b.createdAt;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
    } catch {
      return [];
    }
  }

  /** Yeni DM sohbeti başlat */
  async createDirectChat(otherUser: ChatParticipant): Promise<Chat> {
    const chats = await this.getChats();
    const existing = chats.find(
      (c) => c.type === 'direct' && c.participants.some((p) => p.userId === otherUser.userId),
    );
    if (existing) return existing;

    const chat: Chat = {
      id: `dm-${Date.now()}`,
      type: 'direct',
      participants: [otherUser],
      unreadCount: 0,
      createdAt: new Date().toISOString(),
    };
    chats.push(chat);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    return chat;
  }

  /** Grup sohbeti oluştur */
  async createGroupChat(
    name: string,
    emoji: string,
    participants: ChatParticipant[],
  ): Promise<Chat> {
    const chats = await this.getChats();
    const chat: Chat = {
      id: `group-${Date.now()}`,
      type: 'group',
      name,
      emoji,
      participants,
      unreadCount: 0,
      createdAt: new Date().toISOString(),
    };
    chats.push(chat);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    return chat;
  }

  /** Mesajları al */
  async getMessages(chatId: string, limit = 50): Promise<ChatMessage[]> {
    try {
      const raw = await AsyncStorage.getItem(`${MESSAGES_KEY}_${chatId}`);
      const msgs: ChatMessage[] = raw ? JSON.parse(raw) : [];
      return msgs.slice(-limit);
    } catch {
      return [];
    }
  }

  /** Mesaj gönder */
  async sendMessage(
    chatId: string,
    senderId: string,
    senderName: string,
    text: string,
    type: ChatMessage['type'] = 'text',
    metadata?: Record<string, any>,
  ): Promise<ChatMessage> {
    const msg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      chatId,
      senderId,
      senderName,
      text,
      type,
      metadata,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    // Mesajı kaydet
    const messages = await this.getMessages(chatId, 500);
    messages.push(msg);
    await AsyncStorage.setItem(`${MESSAGES_KEY}_${chatId}`, JSON.stringify(messages));

    // Son mesajı güncelle
    const chats = await this.getChats();
    const chatIdx = chats.findIndex((c) => c.id === chatId);
    if (chatIdx >= 0) {
      chats[chatIdx].lastMessage = msg;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    }

    // Simüle bot cevabı (demo için)
    if (type === 'text') {
      setTimeout(() => this.simulateBotReply(chatId), 2000 + Math.random() * 3000);
    }

    return msg;
  }

  /** Achievement paylaş */
  async shareAchievement(
    chatId: string,
    senderId: string,
    senderName: string,
    achievementTitle: string,
    achievementEmoji: string,
  ): Promise<ChatMessage> {
    return this.sendMessage(
      chatId,
      senderId,
      senderName,
      `🏆 ${achievementEmoji} "${achievementTitle}" başarısını kazandı!`,
      'achievement',
      { achievementTitle, achievementEmoji },
    );
  }

  /** Meydan okuma gönder */
  async sendChallenge(
    chatId: string,
    senderId: string,
    senderName: string,
    category: string,
  ): Promise<ChatMessage> {
    return this.sendMessage(
      chatId,
      senderId,
      senderName,
      `⚔️ ${senderName} sana ${category} konusunda meydan okuyor!`,
      'challenge',
      { category },
    );
  }

  /** Mesajları okundu işaretle */
  async markAsRead(chatId: string): Promise<void> {
    const messages = await this.getMessages(chatId, 500);
    messages.forEach((m) => (m.isRead = true));
    await AsyncStorage.setItem(`${MESSAGES_KEY}_${chatId}`, JSON.stringify(messages));

    const chats = await this.getChats();
    const chatIdx = chats.findIndex((c) => c.id === chatId);
    if (chatIdx >= 0) {
      chats[chatIdx].unreadCount = 0;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    }
  }

  /** Okunmamış mesaj sayısı */
  async getTotalUnreadCount(): Promise<number> {
    const chats = await this.getChats();
    return chats.reduce((sum, c) => sum + c.unreadCount, 0);
  }

  /** Simüle bot cevabı */
  private async simulateBotReply(chatId: string): Promise<void> {
    const replies = [
      'Harika gidiyorsun! 🔥',
      'Bugün kaç ders tamamladın?',
      'Seriyi kırma! 💪',
      'Ben de az önce bir ders bitirdim 📚',
      'Turnuvaya katıldın mı? ⚡',
      'Hadi yarışalım! ⚔️',
      'Yeni hikaye modu çok güzel! 🏛️',
      'Bu hafta 500 XP kazandım 🎉',
      'Şampiyon ligine çıktım! 👑',
    ];
    const text = replies[Math.floor(Math.random() * replies.length)];
    const msg: ChatMessage = {
      id: `msg-${Date.now()}-bot`,
      chatId,
      senderId: 'bot',
      senderName: 'Neural Fox 🦊',
      text,
      type: 'text',
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    const messages = await this.getMessages(chatId, 500);
    messages.push(msg);
    await AsyncStorage.setItem(`${MESSAGES_KEY}_${chatId}`, JSON.stringify(messages));
  }
}

export const chatService = new ChatService();
export default chatService;
