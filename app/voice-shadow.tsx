/**
 * Sesli Gölge (Voice Shadow) - Premium
 * YZ ile sesli konuşma pratiği
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Mic,
  Volume2,
  Crown,
  Send,
  StopCircle,
  MessageCircle,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import { useSubscription } from '../src/providers/SubscriptionProvider';
import type {
  VoiceMessage,
  VoiceShadowConfig,
  VoiceLanguage,
  ConversationTopic,
} from '../src/services/VoiceShadowService';
import {
  voiceShadowService,
  VOICE_TOPICS,
  VOICE_LANGUAGES,
} from '../src/services/VoiceShadowService';
import { supabase } from '../src/config/supabase';
import i18n from '../src/i18n';
import { CustomModal, useModal } from '../src/components/CustomModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ScreenPhase = 'setup' | 'chatting' | 'summary';

export default function VoiceShadowScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme } = useTheme();
  const { isPro } = useSubscription();
  const modal = useModal();
  const scrollRef = useRef<ScrollView>(null);

  const [phase, setPhase] = useState<ScreenPhase>('setup');
  const [selectedLanguage, setSelectedLanguage] = useState<VoiceLanguage>('en-US');
  const [selectedTopic, setSelectedTopic] = useState<ConversationTopic>('daily_conversation');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>(
    'beginner',
  );
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Pulse animation for mic
  const pulseScale = useSharedValue(1);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  useEffect(() => {
    // Get user ID
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.id) setUserId(session.user.id);
    };
    init();

    return () => {
      voiceShadowService.stopSpeaking();
    };
  }, []);

  const getConfig = (): VoiceShadowConfig => ({
    language: selectedLanguage,
    topic: selectedTopic,
    difficulty,
    speakingSpeed: difficulty === 'beginner' ? 0.8 : difficulty === 'advanced' ? 1.1 : 1.0,
  });

  const handleStartSession = async () => {
    if (!isPro) {
      modal.premium(
        'Premium Gerekli',
        'Sesli Gölge özelliği Premium üyelere özeldir.\n\nSadece $3.99/ay ile sınırsız sesli pratik yapabilirsin!',
        () => router.push('/premium'),
      );
      return;
    }

    if (!userId) return;
    setIsLoading(true);
    try {
      const session = await voiceShadowService.startSession(userId, getConfig());
      setMessages([...session.messages]);
      setPhase('chatting');

      pulseScale.value = withRepeat(
        withSequence(withTiming(1.15, { duration: 800 }), withTiming(1, { duration: 800 })),
        -1,
        true,
      );
    } catch (e) {
      console.error('Start session error:', e);
      modal.error(i18n.t('common.error'), i18n.t('voice.session_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const text = userInput.trim();
    setUserInput('');

    // Add user message immediately
    const userMsg: VoiceMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    setIsLoading(true);
    setIsSpeaking(true);
    try {
      const result = await voiceShadowService.processUserMessage(text, getConfig());

      const aiMsg: VoiceMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'ai',
        text: result.aiResponse,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      console.error('Message error:', e);
    } finally {
      setIsLoading(false);
      setIsSpeaking(false);
    }
  };

  const handleEndSession = async () => {
    if (!userId) return;
    const session = await voiceShadowService.endSession(userId);
    pulseScale.value = 1;
    setPhase('summary');
  };

  // ─── SETUP PHASE ────────────────────────────────────────────────────────

  if (phase === 'setup') {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.background.primary, paddingTop: insets.top },
        ]}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={24} color={theme.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Sesli Gölge</Text>
          <View style={styles.premiumBadge}>
            <Crown size={16} color="#FFD700" />
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
          {/* Hero */}
          <Animated.View entering={FadeInDown} style={styles.heroSection}>
            <LinearGradient colors={['#6C5CE7', '#A18CD1']} style={styles.heroGradient}>
              <Mic size={48} color="#FFF" />
              <Text style={styles.heroTitle}>YZ ile Konuş</Text>
              <Text style={styles.heroSubtitle}>
                Sesli sohbet pratiği ile konuşma becerilerini geliştir
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Language Selection */}
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Dil Seç</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 24 }}
          >
            {VOICE_LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.langChip,
                  { backgroundColor: theme.background.secondary },
                  selectedLanguage === lang.code && styles.langChipSelected,
                ]}
                onPress={() => setSelectedLanguage(lang.code)}
              >
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <Text
                  style={[
                    styles.langName,
                    { color: selectedLanguage === lang.code ? '#FFF' : theme.text.primary },
                  ]}
                >
                  {lang.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Topic Selection */}
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Konu Seç</Text>
          <View style={styles.topicGrid}>
            {VOICE_TOPICS.map((topic, idx) => (
              <Animated.View key={topic.id} entering={FadeInDown.delay(idx * 50)}>
                <TouchableOpacity
                  style={[
                    styles.topicCard,
                    { backgroundColor: theme.background.secondary },
                    selectedTopic === topic.id && { borderColor: topic.color, borderWidth: 2 },
                  ]}
                  onPress={() => setSelectedTopic(topic.id)}
                >
                  <Text style={styles.topicIcon}>{topic.icon}</Text>
                  <Text style={[styles.topicTitle, { color: theme.text.primary }]}>
                    {topic.titleTr}
                  </Text>
                  <Text style={[styles.topicDesc, { color: theme.text.secondary }]}>
                    {topic.descriptionTr}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          {/* Difficulty */}
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Zorluk</Text>
          <View style={styles.diffRow}>
            {(['beginner', 'intermediate', 'advanced'] as const).map((d) => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.diffChip,
                  { backgroundColor: theme.background.secondary },
                  difficulty === d && styles.diffChipSelected,
                ]}
                onPress={() => setDifficulty(d)}
              >
                <Text
                  style={[
                    styles.diffText,
                    { color: difficulty === d ? '#FFF' : theme.text.primary },
                  ]}
                >
                  {d === 'beginner'
                    ? i18n.t('voice.beginner')
                    : d === 'intermediate'
                      ? i18n.t('voice.intermediate')
                      : i18n.t('voice.advanced')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Start Button */}
          <TouchableOpacity
            style={[styles.startBtn, isLoading && { opacity: 0.6 }]}
            onPress={handleStartSession}
            disabled={isLoading}
          >
            <LinearGradient colors={['#6C5CE7', '#A18CD1']} style={styles.startBtnGradient}>
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Mic size={24} color="#FFF" />
                  <Text style={styles.startBtnText}>{i18n.t('voice.start_speaking')}</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
        <CustomModal {...modal.modalProps} />
      </View>
    );
  }

  // ─── CHATTING PHASE ─────────────────────────────────────────────────────

  if (phase === 'chatting') {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.background.primary, paddingTop: insets.top },
        ]}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleEndSession} style={styles.backBtn}>
            <StopCircle size={24} color="#FF4B4B" />
          </TouchableOpacity>
          <View style={styles.chatHeaderCenter}>
            <Animated.View style={pulseStyle}>
              <View style={styles.micIndicator}>
                <MessageCircle size={20} color="#6C5CE7" />
              </View>
            </Animated.View>
            <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Sesli Gölge</Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.chatContainer}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg, idx) => (
            <Animated.View
              key={msg.id}
              entering={FadeInUp.delay(idx * 50)}
              style={[
                styles.messageBubble,
                msg.role === 'user' ? styles.userBubble : styles.aiBubble,
                msg.role === 'user'
                  ? { backgroundColor: '#6C5CE7' }
                  : { backgroundColor: theme.background.secondary },
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  { color: msg.role === 'user' ? '#FFF' : theme.text.primary },
                ]}
              >
                {msg.text}
              </Text>
            </Animated.View>
          ))}
          {isLoading && (
            <View
              style={[
                styles.messageBubble,
                styles.aiBubble,
                { backgroundColor: theme.background.secondary },
              ]}
            >
              <ActivityIndicator size="small" color="#6C5CE7" />
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: theme.background.secondary, paddingBottom: insets.bottom + 8 },
          ]}
        >
          <TextInput
            style={[
              styles.textInput,
              { color: theme.text.primary, backgroundColor: theme.background.primary },
            ]}
            placeholder="Mesajını yaz..."
            placeholderTextColor={theme.text.secondary}
            value={userInput}
            onChangeText={setUserInput}
            onSubmitEditing={handleSendMessage}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !userInput.trim() && { opacity: 0.4 }]}
            onPress={handleSendMessage}
            disabled={!userInput.trim() || isLoading}
          >
            <Send size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── SUMMARY PHASE ──────────────────────────────────────────────────────

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background.primary, paddingTop: insets.top },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Oturum Özeti</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.summaryContainer}>
        <Animated.View entering={ZoomIn} style={styles.summaryCard}>
          <LinearGradient colors={['#6C5CE7', '#A18CD1']} style={styles.summaryGradient}>
            <Volume2 size={64} color="#FFF" />
            <Text style={styles.summaryTitle}>Harika Pratik! 🎉</Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>
                  {messages.filter((m) => m.role === 'user').length}
                </Text>
                <Text style={styles.summaryStatLabel}>Mesaj</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>
                  {messages
                    .filter((m) => m.role === 'user')
                    .reduce((sum, m) => sum + m.text.split(' ').length, 0)}
                </Text>
                <Text style={styles.summaryStatLabel}>Kelime</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.summaryBtn} onPress={() => setPhase('setup')}>
              <Text style={styles.summaryBtnText}>{i18n.t('voice.restart')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.summaryBackBtn} onPress={() => router.back()}>
              <Text style={styles.summaryBackBtnText}>Ana Sayfa</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  premiumBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    padding: 8,
    borderRadius: 12,
  },
  chatHeaderCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  micIndicator: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(108, 92, 231, 0.15)',
  },

  // Hero
  heroSection: { marginBottom: 24 },
  heroGradient: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  heroTitle: { fontSize: 28, fontWeight: '800', color: '#FFF', marginTop: 12 },
  heroSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 8 },

  // Section
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },

  // Language chips
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    gap: 8,
  },
  langChipSelected: { backgroundColor: '#6C5CE7' },
  langFlag: { fontSize: 20 },
  langName: { fontSize: 14, fontWeight: '600' },

  // Topics
  topicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  topicCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  topicIcon: { fontSize: 28, marginBottom: 8 },
  topicTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  topicDesc: { fontSize: 12 },

  // Difficulty
  diffRow: { flexDirection: 'row', gap: 10, marginBottom: 32 },
  diffChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  diffChipSelected: { backgroundColor: '#6C5CE7' },
  diffText: { fontSize: 14, fontWeight: '700' },

  // Start
  startBtn: { borderRadius: 20, overflow: 'hidden' },
  startBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  startBtnText: { fontSize: 18, fontWeight: '800', color: '#FFF' },

  // Chat
  chatContainer: { padding: 16, paddingBottom: 20, gap: 10 },
  messageBubble: { maxWidth: '80%', padding: 14, borderRadius: 18 },
  userBubble: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  aiBubble: { alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 22 },

  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Summary
  summaryContainer: { flex: 1, padding: 20, justifyContent: 'center' },
  summaryCard: { borderRadius: 28, overflow: 'hidden' },
  summaryGradient: { padding: 40, alignItems: 'center' },
  summaryTitle: { fontSize: 28, fontWeight: '800', color: '#FFF', marginTop: 16, marginBottom: 24 },
  summaryStats: { flexDirection: 'row', gap: 40, marginBottom: 32 },
  summaryStat: { alignItems: 'center' },
  summaryStatValue: { fontSize: 32, fontWeight: '900', color: '#FFF' },
  summaryStatLabel: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  summaryBtn: {
    backgroundColor: '#FFF',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 16,
    marginBottom: 12,
  },
  summaryBtnText: { fontSize: 16, fontWeight: '800', color: '#6C5CE7' },
  summaryBackBtn: { paddingVertical: 10 },
  summaryBackBtnText: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
});
