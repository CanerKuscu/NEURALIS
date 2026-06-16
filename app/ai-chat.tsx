/**
 * AI Chat Screen — AI Sohbet Asistanı (Neural Fox)
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, Send, Sparkles, Trash2, Plus, Bot, User } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import i18n from '../src/i18n';
import { useTheme } from '../src/context/ThemeContext';
import { aiChatService, QUICK_PROMPTS } from '../src/services/AIChatService';
import type { AIChatMessage, AIChatSession } from '../src/services/AIChatService';
import * as Haptics from 'expo-haptics';

export default function AIChatScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const [session, setSession] = useState<AIChatSession | null>(null);
  const [sessions, setSessions] = useState<AIChatSession[]>([]);
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'chat' | 'history'>('chat');
  const scrollRef = useRef<FlatList>(null);

  useEffect(() => {
    initSession();
  }, []);

  const initSession = async () => {
    const allSessions = await aiChatService.getSessions();
    setSessions(allSessions);
    if (allSessions.length > 0) {
      setSession(allSessions[0]);
      setMessages(allSessions[0].messages.filter((m) => m.role !== 'system'));
    } else {
      const newSession = await aiChatService.createSession();
      setSession(newSession);
      setMessages(newSession.messages.filter((m) => m.role !== 'system'));
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !session || isLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg: AIChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date().toISOString(),
      messageType: 'text',
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const aiMsg = await aiChatService.sendMessage(session.id, userMsg.content);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== userMsg.id),
        { ...userMsg, id: `user-${Date.now()}` },
        aiMsg,
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Bir hata oluştu. Tekrar dene! 😅',
          timestamp: new Date().toISOString(),
        },
      ]);
    }
    setIsLoading(false);
    scrollRef.current?.scrollToEnd({ animated: true });
  };

  const quickPrompt = (prompt: string) => {
    setInputText(prompt);
  };

  const newChat = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newSession = await aiChatService.createSession();
    setSession(newSession);
    setMessages(newSession.messages.filter((m) => m.role !== 'system'));
    setMode('chat');
  };

  const selectSession = (s: AIChatSession) => {
    setSession(s);
    setMessages(s.messages.filter((m) => m.role !== 'system'));
    setMode('chat');
  };

  const deleteSession = async (id: string) => {
    await aiChatService.deleteSession(id);
    const all = await aiChatService.getSessions();
    setSessions(all);
    if (session?.id === id) {
      if (all.length > 0) selectSession(all[0]);
      else await newChat();
    }
  };

  // ── HISTORY VIEW ──
  if (mode === 'history') {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, backgroundColor: theme.background.primary },
        ]}
      >
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setMode('chat')}>
            <ArrowLeft size={24} color={theme.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Sohbet Geçmişi</Text>
          <TouchableOpacity onPress={newChat}>
            <Plus size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={sessions}
          keyExtractor={(s) => s.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          renderItem={({ item: s, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 60)}>
              <TouchableOpacity
                style={[
                  styles.sessionItem,
                  {
                    backgroundColor: theme.background.secondary,
                    borderColor: session?.id === s.id ? '#2ECC71' : 'transparent',
                    borderWidth: session?.id === s.id ? 2 : 0,
                  },
                ]}
                onPress={() => selectSession(s)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sessionTitle, { color: theme.text.primary }]}>
                    {s.title}
                  </Text>
                  <Text style={[styles.sessionDate, { color: theme.text.secondary }]}>
                    {new Date(s.updatedAt).toLocaleDateString('tr-TR')}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => deleteSession(s.id)}>
                  <Trash2 size={18} color={theme.text.secondary} />
                </TouchableOpacity>
              </TouchableOpacity>
            </Animated.View>
          )}
        />
      </View>
    );
  }

  // ── CHAT VIEW ──
  const visibleMessages = messages.filter((m) => m.role !== 'system');

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: theme.background.primary },
      ]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.chatHeader, { borderBottomColor: theme.border.light }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <View style={styles.chatHeaderCenter}>
          <LinearGradient colors={['#2ECC71', '#27AE60']} style={styles.botAvatar}>
            <Image
              source={require('../assets/fox/fox-neutral.png')}
              style={{ width: 30, height: 30 }}
              resizeMode="contain"
            />
          </LinearGradient>
          <View>
            <Text style={[styles.chatHeaderName, { color: theme.text.primary }]}>Neural Fox</Text>
            <Text style={[styles.chatHeaderStatus, { color: '#2ECC71' }]}>AI Asistan</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => {
            setSessions(sessions);
            setMode('history');
          }}
        >
          <Sparkles size={24} color={theme.text.secondary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={insets.top + 60}
      >
        <FlatList
          ref={scrollRef}
          data={visibleMessages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 8 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={
            isLoading ? (
              <View style={styles.loadingRow}>
                <View
                  style={[styles.loadingBubble, { backgroundColor: theme.background.secondary }]}
                >
                  <ActivityIndicator size="small" color={theme.primary} />
                  <Text style={[styles.loadingText, { color: theme.text.secondary }]}>
                    Düşünüyor...
                  </Text>
                </View>
              </View>
            ) : null
          }
          renderItem={({ item: msg }) => {
            const isUser = msg.role === 'user';
            return (
              <View style={[styles.msgRow, { justifyContent: isUser ? 'flex-end' : 'flex-start' }]}>
                {!isUser && (
                  <View style={styles.msgAvatarSmall}>
                    <Image
                      source={require('../assets/fox/fox-happy.png')}
                      style={{ width: 20, height: 20 }}
                      resizeMode="contain"
                    />
                  </View>
                )}
                <View
                  style={[
                    styles.msgBubble,
                    {
                      backgroundColor: isUser ? '#2ECC71' : theme.background.secondary,
                      borderBottomRightRadius: isUser ? 4 : 16,
                      borderBottomLeftRadius: isUser ? 16 : 4,
                    },
                  ]}
                >
                  <Text style={[styles.msgText, { color: isUser ? '#FFF' : theme.text.primary }]}>
                    {msg.content}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        {/* Quick Prompts (show only for new chats) */}
        {visibleMessages.length <= 2 && (
          <View style={styles.quickPrompts}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={QUICK_PROMPTS}
              keyExtractor={(p) => p.id}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
              renderItem={({ item: p }) => (
                <TouchableOpacity
                  style={[styles.quickBtn, { backgroundColor: theme.background.secondary }]}
                  onPress={() => quickPrompt(p.prompt)}
                >
                  <Text style={styles.quickEmoji}>{p.emoji}</Text>
                  <Text style={[styles.quickLabel, { color: theme.text.primary }]}>
                    {i18n.locale === 'tr' ? p.labelTr : p.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Input Bar */}
        <View
          style={[
            styles.inputBar,
            { backgroundColor: theme.background.secondary, paddingBottom: insets.bottom + 8 },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              { color: theme.text.primary, backgroundColor: theme.background.primary },
            ]}
            placeholder="Neural Fox'a sor..."
            placeholderTextColor={theme.text.secondary}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={sendMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity onPress={sendMessage} disabled={!inputText.trim() || isLoading}>
            <LinearGradient
              colors={
                inputText.trim() ? ['#2ECC71', '#27AE60'] : [theme.border.light, theme.border.light]
              }
              style={styles.sendBtn}
            >
              <Send size={20} color={inputText.trim() ? '#FFF' : theme.text.secondary} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingVertical: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  chatHeaderCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  botAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatHeaderName: { fontSize: 16, fontWeight: '700' },
  chatHeaderStatus: { fontSize: 12, fontWeight: '500' },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
  },
  sessionTitle: { fontSize: 14, fontWeight: '600' },
  sessionDate: { fontSize: 12, marginTop: 2 },
  msgRow: { flexDirection: 'row', marginVertical: 2, alignItems: 'flex-end', gap: 6 },
  msgAvatarSmall: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#2ECC7120',
    justifyContent: 'center',
    alignItems: 'center',
  },
  msgBubble: { maxWidth: '80%', padding: 12, borderRadius: 16 },
  msgText: { fontSize: 15, lineHeight: 22 },
  loadingRow: { flexDirection: 'row', marginTop: 4 },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 16,
  },
  loadingText: { fontSize: 13 },
  quickPrompts: { paddingVertical: 8 },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  quickEmoji: { fontSize: 16 },
  quickLabel: { fontSize: 13, fontWeight: '600' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
