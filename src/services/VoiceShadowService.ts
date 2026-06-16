/**
 * VoiceShadowService - Sesli Gölge (Premium)
 * YZ ile sesli konuşma pratiği
 *
 * Kullanıcı YZ ile gerçek zamanlı sesli sohbet yapabilir.
 * Uses expo-speech for TTS and voice recognition for STT.
 */

import * as Speech from 'expo-speech';
import { supabase } from '../config/supabase';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type VoiceLanguage = 'en-US' | 'tr-TR' | 'de-DE' | 'fr-FR' | 'es-ES' | 'ja-JP';

export type ConversationTopic =
  | 'daily_conversation'
  | 'travel'
  | 'business'
  | 'interview'
  | 'restaurant'
  | 'shopping'
  | 'emergency'
  | 'custom';

export interface VoiceMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  audioUri?: string;
  timestamp: number;
  pronunciation?: PronunciationFeedback;
}

export interface PronunciationFeedback {
  score: number; // 0-100
  corrections: Array<{
    word: string;
    expected: string;
    actual: string;
    tip: string;
  }>;
}

export interface VoiceSession {
  id: string;
  userId: string;
  language: VoiceLanguage;
  topic: ConversationTopic;
  messages: VoiceMessage[];
  startedAt: number;
  endedAt?: number;
  overallScore?: number;
  wordsSpoken: number;
  correctWords: number;
}

export interface VoiceShadowConfig {
  language: VoiceLanguage;
  topic: ConversationTopic;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  speakingSpeed: number; // 0.5 - 1.5
  customTopic?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONVERSATION TOPICS
// ═══════════════════════════════════════════════════════════════════════════

export const VOICE_TOPICS: Array<{
  id: ConversationTopic;
  title: string;
  titleTr: string;
  icon: string;
  description: string;
  descriptionTr: string;
  color: string;
}> = [
  {
    id: 'daily_conversation',
    title: 'Daily Conversation',
    titleTr: 'Günlük Konuşma',
    icon: '💬',
    description: 'Casual everyday conversations',
    descriptionTr: 'Günlük sohbet pratiği',
    color: '#4FACFE',
  },
  {
    id: 'travel',
    title: 'Travel & Tourism',
    titleTr: 'Seyahat',
    icon: '✈️',
    description: 'Airport, hotel, directions',
    descriptionTr: 'Havaalanı, otel, yol tarifi',
    color: '#43E97B',
  },
  {
    id: 'business',
    title: 'Business English',
    titleTr: 'İş İngilizcesi',
    icon: '💼',
    description: 'Meetings, presentations, emails',
    descriptionTr: 'Toplantı, sunum, e-posta',
    color: '#A18CD1',
  },
  {
    id: 'interview',
    title: 'Job Interview',
    titleTr: 'İş Görüşmesi',
    icon: '🎯',
    description: 'Practice interview scenarios',
    descriptionTr: 'Mülakat pratiği',
    color: '#FF9A9E',
  },
  {
    id: 'restaurant',
    title: 'Restaurant & Food',
    titleTr: 'Restoran & Yemek',
    icon: '🍽️',
    description: 'Ordering, preferences, allergies',
    descriptionTr: 'Sipariş verme, tercihler',
    color: '#F6D365',
  },
  {
    id: 'shopping',
    title: 'Shopping',
    titleTr: 'Alışveriş',
    icon: '🛍️',
    description: 'Buying, bargaining, returns',
    descriptionTr: 'Satın alma, pazarlık',
    color: '#FA709A',
  },
  {
    id: 'emergency',
    title: 'Emergency',
    titleTr: 'Acil Durum',
    icon: '🚨',
    description: 'Doctor, police, help phrases',
    descriptionTr: 'Doktor, polis, yardım',
    color: '#FF4B4B',
  },
  {
    id: 'custom',
    title: 'Custom Topic',
    titleTr: 'Özel Konu',
    icon: '✨',
    description: 'Choose your own topic',
    descriptionTr: 'Kendi konunu seç',
    color: '#CE82FF',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// VOICE LANGUAGES
// ═══════════════════════════════════════════════════════════════════════════

export const VOICE_LANGUAGES: Array<{
  code: VoiceLanguage;
  name: string;
  flag: string;
}> = [
  { code: 'en-US', name: 'English', flag: '🇺🇸' },
  { code: 'tr-TR', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'de-DE', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr-FR', name: 'Français', flag: '🇫🇷' },
  { code: 'es-ES', name: 'Español', flag: '🇪🇸' },
  { code: 'ja-JP', name: '日本語', flag: '🇯🇵' },
];

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════

class VoiceShadowService {
  private currentSession: VoiceSession | null = null;
  private isSpeaking: boolean = false;

  /**
   * Yeni sesli konuşma oturumu başlat
   */
  async startSession(userId: string, config: VoiceShadowConfig): Promise<VoiceSession> {
    const session: VoiceSession = {
      id: `vs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      language: config.language,
      topic: config.topic,
      messages: [],
      startedAt: Date.now(),
      wordsSpoken: 0,
      correctWords: 0,
    };

    this.currentSession = session;

    // Generate AI's opening message based on topic
    const openingMessage = await this.generateAIResponse(config, [], true);

    session.messages.push({
      id: `msg_${Date.now()}`,
      role: 'ai',
      text: openingMessage,
      timestamp: Date.now(),
    });

    // Speak the opening message
    await this.speakText(openingMessage, config.language, config.speakingSpeed);

    return session;
  }

  /**
   * Kullanıcının mesajını işle ve YZ yanıtı oluştur
   */
  async processUserMessage(
    userText: string,
    config: VoiceShadowConfig,
  ): Promise<{
    aiResponse: string;
    feedback?: PronunciationFeedback;
  }> {
    if (!this.currentSession) {
      throw new Error('No active voice session');
    }

    // Add user message
    const userMsg: VoiceMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      text: userText,
      timestamp: Date.now(),
    };
    this.currentSession.messages.push(userMsg);
    this.currentSession.wordsSpoken += userText.split(' ').length;

    // Generate AI response
    const aiResponse = await this.generateAIResponse(config, this.currentSession.messages, false);

    const aiMsg: VoiceMessage = {
      id: `msg_${Date.now() + 1}`,
      role: 'ai',
      text: aiResponse,
      timestamp: Date.now(),
    };
    this.currentSession.messages.push(aiMsg);

    // Speak AI response
    await this.speakText(aiResponse, config.language, config.speakingSpeed);

    return {
      aiResponse,
    };
  }

  /**
   * DeepSeek ile YZ yanıtı oluştur
   */
  private async generateAIResponse(
    config: VoiceShadowConfig,
    history: VoiceMessage[],
    isOpening: boolean,
  ): Promise<string> {
    try {
      const systemPrompt = this.buildSystemPrompt(config, isOpening);
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.map((m) => ({
          role: m.role === 'ai' ? 'assistant' : 'user',
          content: m.text,
        })),
      ];

      if (isOpening) {
        messages.push({
          role: 'user',
          content: 'Start the conversation.',
        });
      }

      const { data, error } = await supabase.functions.invoke('generate-lesson', {
        body: {
          prompt: systemPrompt,
          isVoiceChat: true,
          messages,
          language: config.language,
          topic: config.topic,
        },
      });

      if (error) throw error;
      return data?.response || data?.message || this.getFallbackResponse(config, isOpening);
    } catch (e) {
      console.error('VoiceShadow AI error:', e);
      return this.getFallbackResponse(config, isOpening);
    }
  }

  /**
   * Sistem prompt'u oluştur
   */
  private buildSystemPrompt(config: VoiceShadowConfig, isOpening: boolean): string {
    const topicInfo = VOICE_TOPICS.find((t) => t.id === config.topic);
    const langName = VOICE_LANGUAGES.find((l) => l.code === config.language)?.name || 'English';

    return `You are a friendly AI language tutor for voice conversation practice.
Language: ${langName}
Topic: ${topicInfo?.title || config.customTopic || 'General'}
Difficulty: ${config.difficulty}
Rules:
- Keep responses SHORT (1-3 sentences) for natural conversation flow
- Speak in ${langName} primarily
- If the user makes mistakes, gently correct them
- ${config.difficulty === 'beginner' ? 'Use simple vocabulary and short sentences' : ''}
- ${config.difficulty === 'advanced' ? 'Use idioms and complex structures' : ''}
- Be encouraging and supportive
- ${isOpening ? 'Start with a greeting and set up the scenario' : 'Continue the natural conversation'}`;
  }

  /**
   * Fallback yanıtlar
   */
  private getFallbackResponse(config: VoiceShadowConfig, isOpening: boolean): string {
    const fallbacks: Record<string, { opening: string; response: string }> = {
      'en-US': {
        opening: "Hi there! I'm your Shadow Tutor. Let's practice speaking together!",
        response: "That's great! Can you tell me more about that?",
      },
      'tr-TR': {
        opening: 'Merhaba! Ben senin Gölge Öğretmenin. Birlikte konuşma pratiği yapalım!',
        response: 'Çok güzel! Bunu biraz daha anlatabilir misin?',
      },
      'de-DE': {
        opening: 'Hallo! Ich bin dein Schatten-Tutor. Lass uns zusammen üben!',
        response: 'Das ist toll! Kannst du mir mehr darüber erzählen?',
      },
      'fr-FR': {
        opening: "Bonjour! Je suis votre tuteur de l'Ombre. Pratiquons ensemble!",
        response: "C'est super! Pouvez-vous me dire plus?",
      },
      'es-ES': {
        opening: '¡Hola! Soy tu Tutor Sombra. ¡Practiquemos juntos!',
        response: '¡Genial! ¿Puedes contarme más sobre eso?',
      },
      'ja-JP': {
        opening: 'こんにちは！シャドウチューターです。一緒に練習しましょう！',
        response: 'いいですね！もう少し教えてください。',
      },
    };

    const lang = fallbacks[config.language] || fallbacks['en-US'];
    return isOpening ? lang.opening : lang.response;
  }

  /**
   * Metni sesli olarak oku
   */
  async speakText(text: string, language: VoiceLanguage, rate: number = 1.0): Promise<void> {
    if (this.isSpeaking) {
      await Speech.stop();
    }

    this.isSpeaking = true;

    return new Promise((resolve) => {
      Speech.speak(text, {
        language,
        rate,
        pitch: 1.0,
        onDone: () => {
          this.isSpeaking = false;
          resolve();
        },
        onError: () => {
          this.isSpeaking = false;
          resolve();
        },
      });
    });
  }

  /**
   * Konuşmayı durdur
   */
  async stopSpeaking(): Promise<void> {
    if (this.isSpeaking) {
      await Speech.stop();
      this.isSpeaking = false;
    }
  }

  /**
   * Oturumu bitir
   */
  async endSession(userId: string): Promise<VoiceSession | null> {
    if (!this.currentSession) return null;

    this.currentSession.endedAt = Date.now();
    const session = { ...this.currentSession };

    // Sunucuya kaydet
    try {
      await supabase.from('voice_sessions').insert({
        user_id: userId,
        session_id: session.id,
        language: session.language,
        topic: session.topic,
        messages_count: session.messages.length,
        words_spoken: session.wordsSpoken,
        duration_seconds: session.endedAt
          ? Math.floor((session.endedAt - session.startedAt) / 1000)
          : 0,
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('VoiceShadow: session save failed', e);
    }

    this.currentSession = null;
    await this.stopSpeaking();
    return session;
  }

  /**
   * Aktif oturum var mı?
   */
  hasActiveSession(): boolean {
    return this.currentSession !== null;
  }

  /**
   * Aktif oturumu al
   */
  getSession(): VoiceSession | null {
    return this.currentSession;
  }
}

export const voiceShadowService = new VoiceShadowService();
export default voiceShadowService;
