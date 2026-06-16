/**
 * AIChatService — AI Sohbet Asistanı (Tutor Bot)
 *
 * DeepSeek API ile sohbet
 * Concept açıklama
 * Quiz oluşturma
 * Motivasyon ve rehberlik
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  /** Mesaj türü */
  messageType?: 'text' | 'quiz' | 'explanation' | 'motivation' | 'hint';
  /** Quiz ise detayları */
  quizData?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export interface AIChatSession {
  id: string;
  title: string;
  messages: AIChatMessage[];
  createdAt: string;
  updatedAt: string;
  topic?: string;
}

export interface QuickPrompt {
  id: string;
  emoji: string;
  label: string;
  labelTr: string;
  prompt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// QUICK PROMPTS
// ═══════════════════════════════════════════════════════════════════════════

export const QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: 'explain',
    emoji: '💡',
    label: 'Explain a concept',
    labelTr: 'Bir kavram açıkla',
    prompt: 'Bana şu kavramı basitçe açıklar mısın: ',
  },
  {
    id: 'quiz',
    emoji: '❓',
    label: 'Make me a quiz',
    labelTr: 'Bana quiz yap',
    prompt: 'Bana şu konuda 3 soruluk bir quiz hazırla: ',
  },
  {
    id: 'compare',
    emoji: '⚖️',
    label: 'Compare two things',
    labelTr: 'İki şeyi karşılaştır',
    prompt: 'Şunları karşılaştır: ',
  },
  {
    id: 'funfact',
    emoji: '🤯',
    label: 'Tell a fun fact',
    labelTr: 'İlginç bir bilgi söyle',
    prompt: 'Bana şu konuda ilginç bir bilgi söyle: ',
  },
  {
    id: 'motivation',
    emoji: '💪',
    label: 'Motivate me',
    labelTr: 'Beni motive et',
    prompt: 'Öğrenmeye devam etmem için beni motive et!',
  },
  {
    id: 'summary',
    emoji: '📝',
    label: 'Summarize a topic',
    labelTr: 'Konuyu özetle',
    prompt: 'Şu konuyu kısa ve öz özetle: ',
  },
  {
    id: 'analogy',
    emoji: '🔗',
    label: 'Give an analogy',
    labelTr: 'Benzetme yap',
    prompt: 'Şu kavramı günlük hayattan bir benzetmeyle açıkla: ',
  },
  {
    id: 'steps',
    emoji: '📋',
    label: 'Step by step',
    labelTr: 'Adım adım göster',
    prompt: 'Şunu adım adım nasıl yapacağımı göster: ',
  },
];

const STORAGE_KEY = '@neuralis_ai_sessions';
const SYSTEM_PROMPT = `Sen Neuralis uygulamasının AI eğitim asistanısın. Adın "Neural Fox 🦊".
Görevin:
- Kullanıcılara Türkçe olarak öğrenme konularında yardım etmek
- Karmaşık kavramları basit ve eğlenceli şekilde açıklamak  
- Quiz soruları oluşturmak
- Motivasyon sağlamak
- Kısa, samimi ve enerjik bir dil kullan
- Emoji kullan ama abartma
- Her cevabın sonunda kullanıcıyı öğrenmeye teşvik et
- Yanlış bilgi verme, emin olmadığında belirt`;

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════

class AIChatService {
  /** Yeni sohbet başlat */
  async createSession(topic?: string): Promise<AIChatSession> {
    const session: AIChatSession = {
      id: `ai-${Date.now()}`,
      title: topic || 'Yeni Sohbet',
      messages: [
        {
          id: 'system-0',
          role: 'system',
          content: SYSTEM_PROMPT,
          timestamp: new Date().toISOString(),
        },
        {
          id: 'welcome',
          role: 'assistant',
          content: `Merhaba! 🦊 Ben Neural Fox, senin AI öğrenme asistanın!\n\n${topic ? `"${topic}" hakkında konuşalım! Sormak istediğin bir şey var mı?` : 'Bugün ne öğrenmek istersin? Bana herhangi bir konu sorabilirsin!'}\n\n💡 İpucu: Aşağıdaki hızlı butonları da kullanabilirsin!`,
          timestamp: new Date().toISOString(),
          messageType: 'text',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      topic,
    };

    const sessions = await this.getSessions();
    sessions.unshift(session);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, 20)));
    return session;
  }

  /** Mesaj gönder ve AI cevabı al */
  async sendMessage(sessionId: string, userMessage: string): Promise<AIChatMessage> {
    const sessions = await this.getSessions();
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) throw new Error('Session not found');

    // Kullanıcı mesajını ekle
    const userMsg: AIChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
      messageType: 'text',
    };
    session.messages.push(userMsg);

    // AI cevabı al (Edge Function üzerinden)
    let aiResponse: string;
    try {
      const { data, error } = await supabase.functions.invoke('generate-lesson', {
        body: {
          mode: 'chat',
          messages: session.messages
            .filter((m) => m.role !== 'system')
            .slice(-10)
            .map((m) => ({
              role: m.role,
              content: m.content,
            })),
          systemPrompt: SYSTEM_PROMPT,
        },
      });
      if (error) throw error;
      aiResponse = data?.response || data?.message || this.getFallbackResponse(userMessage);
    } catch {
      aiResponse = this.getFallbackResponse(userMessage);
    }

    // AI mesajını ekle
    const aiMsg: AIChatMessage = {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString(),
      messageType: this.detectMessageType(aiResponse),
    };
    session.messages.push(aiMsg);
    session.updatedAt = new Date().toISOString();

    // İlk kullanıcı mesajından başlık oluştur
    if (session.messages.filter((m) => m.role === 'user').length === 1) {
      session.title = userMessage.slice(0, 40) + (userMessage.length > 40 ? '...' : '');
    }

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    return aiMsg;
  }

  /** Tüm oturumları al */
  async getSessions(): Promise<AIChatSession[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /** Oturumu sil */
  async deleteSession(sessionId: string): Promise<void> {
    const sessions = await this.getSessions();
    const filtered = sessions.filter((s) => s.id !== sessionId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }

  /** Fallback cevaplar (çevrimdışı veya hata durumunda) */
  private getFallbackResponse(input: string): string {
    const lower = input.toLowerCase();

    if (lower.includes('motivasyon') || lower.includes('motive')) {
      return '💪 Unutma: Her gün bir adım atarak dağları aşabilirsin!\n\n🧠 Beynin her yeni bilgiyle büyüyor. Bugün öğrendiğin her şey yarının temelini oluşturuyor.\n\n🔥 Serinini kırma, harika gidiyorsun!';
    }
    if (lower.includes('quiz') || lower.includes('soru')) {
      return '❓ Sana hızlı bir soru:\n\nDünyanın en büyük okyanusu hangisidir?\n\nA) Atlantik\nB) Hint\nC) Pasifik ✅\nD) Kuzey Buz\n\n💡 Pasifik Okyanusu, Dünya yüzeyinin yaklaşık üçte birini kaplar! Devam edelim mi?';
    }
    if (lower.includes('merhaba') || lower.includes('selam')) {
      return 'Selam! 🦊 Bugün ne öğrenmek istersin? Bilim, tarih, matematik, dil... Herhangi bir konu hakkında sohbet edebiliriz!';
    }

    return `İlginç bir soru! 🤔\n\n"${input}" hakkında düşünüyorum...\n\n📚 Bu konuda daha detaylı bilgi almak için internet bağlantın olduğundan emin ol. Şu an çevrimdışı modda olabilirim.\n\n💡 İpucu: Daha spesifik bir soru sorarak daha iyi cevaplar alabilirsin!`;
  }

  /** Mesaj türünü tespit et */
  private detectMessageType(content: string): AIChatMessage['messageType'] {
    if (content.includes('A)') && content.includes('B)')) return 'quiz';
    if (content.includes('💡') || content.includes('açıklama')) return 'explanation';
    if (content.includes('💪') || content.includes('motivasyon')) return 'motivation';
    return 'text';
  }
}

export const aiChatService = new AIChatService();
export default aiChatService;
