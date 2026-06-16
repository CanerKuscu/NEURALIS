/**
 * NEURALIS - Group Study Rooms Screen
 * 2-5 kişilik grup çalışma odaları — birlikte öğren, bonus XP kazan!
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Users, Plus, Send, Play, Zap, Crown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import { supabase } from '../src/config/supabase';
import type { StudyRoom, RoomParticipant, RoomMessage } from '../src/services/StudyRoomService';
import { studyRoomService } from '../src/services/StudyRoomService';
import * as Haptics from 'expo-haptics';
import i18n from '../src/i18n';
import { CustomModal, useModal } from '../src/components/CustomModal';

type ScreenState = 'lobby' | 'room' | 'create';

const CATEGORIES = [
  { id: 'mathematics', label: '🔢 Matematik', color: '#3498DB' },
  { id: 'science', label: '🔬 Bilim', color: '#2ECC71' },
  { id: 'coding', label: '💻 Kodlama', color: '#9B59B6' },
  { id: 'history', label: '📜 Tarih', color: '#E67E22' },
  { id: 'language', label: '🌍 Dil', color: '#1ABC9C' },
  { id: 'geography', label: '🗺️ Coğrafya', color: '#E74C3C' },
];

export default function StudyRoomsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme } = useTheme();
  const modal = useModal();

  const [screenState, setScreenState] = useState<ScreenState>('lobby');
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentRoom, setCurrentRoom] = useState<StudyRoom | null>(null);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [userId, setUserId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newCategory, setNewCategory] = useState('mathematics');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadData();
    return () => {
      if (currentRoom) studyRoomService.leaveRoom(currentRoom.id);
    };
  }, []);

  const loadData = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      setUserId(session.user.id);
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', session.user.id)
        .single();
      setDisplayName(profile?.display_name || 'Anon');
    }
    const available = await studyRoomService.getAvailableRooms();
    setRooms(available);
    setLoading(false);
  };

  const handleCreateRoom = async () => {
    if (!newTopic.trim()) {
      modal.error(i18n.t('common.error'), i18n.t('study_room.enter_topic'));
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const room = await studyRoomService.createRoom(
      userId,
      displayName,
      newCategory,
      newTopic.trim(),
    );
    joinRoomHandler(room);
  };

  const joinRoomHandler = (room: StudyRoom) => {
    setCurrentRoom(room);
    setScreenState('room');
    setParticipants(room.participants || []);

    studyRoomService.joinRoom(room.id, userId, displayName, {
      onParticipantJoin: (p) =>
        setParticipants((prev) => [...prev.filter((x) => x.userId !== p.userId), p]),
      onParticipantLeave: (uid) => setParticipants((prev) => prev.filter((x) => x.userId !== uid)),
      onMessage: (msg) => {
        setMessages((prev) => [...prev, msg]);
        setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
      },
      onGameStart: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.push(`/lesson?category=${room.category}&topic=${room.topic}&roomId=${room.id}`);
      },
      onScoreUpdate: (uid, score) => {
        setParticipants((prev) => prev.map((p) => (p.userId === uid ? { ...p, score } : p)));
      },
    });

    // System message
    setMessages([
      {
        userId: 'system',
        displayName: 'System',
        type: 'system',
        text: `${displayName} odaya katıldı`,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handleSend = () => {
    if (!msgInput.trim() || !currentRoom) return;
    const msg: RoomMessage = {
      userId,
      displayName,
      type: 'chat',
      text: msgInput.trim(),
      timestamp: new Date().toISOString(),
    };
    studyRoomService.sendMessage(currentRoom.id, msg);
    setMessages((prev) => [...prev, msg]);
    setMsgInput('');
    setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
  };

  const handleStartGame = () => {
    if (!currentRoom) return;
    studyRoomService.startGame(currentRoom.id);
    router.push(
      `/lesson?category=${currentRoom.category}&topic=${currentRoom.topic}&roomId=${currentRoom.id}`,
    );
  };

  // ─── LOBBY ───
  if (screenState === 'lobby') {
    return (
      <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
        <LinearGradient
          colors={['#1ABC9C', '#16A085']}
          style={[styles.header, { paddingTop: insets.top + 8 }]}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <ArrowLeft size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>👥 Çalışma Odaları</Text>
            <TouchableOpacity onPress={() => setScreenState('create')} style={styles.backBtn}>
              <Plus size={22} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerSub}>{i18n.t('study_room.bonus_xp')}</Text>
        </LinearGradient>

        {loading ? (
          <ActivityIndicator size="large" color="#1ABC9C" style={{ marginTop: 60 }} />
        ) : rooms.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Users size={48} color={theme.text.secondary} />
            <Text style={[styles.emptyText, { color: theme.text.secondary }]}>
              Henüz açık oda yok
            </Text>
            <TouchableOpacity style={styles.createBtn} onPress={() => setScreenState('create')}>
              <Plus size={18} color="#FFF" />
              <Text style={styles.createBtnText}>Oda Oluştur</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={rooms}
            keyExtractor={(r) => r.id}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInDown.delay(index * 80)}>
                <TouchableOpacity
                  style={[styles.roomCard, { backgroundColor: theme.background.secondary }]}
                  onPress={() => joinRoomHandler(item)}
                >
                  <View style={styles.roomTop}>
                    <Text style={[styles.roomTopic, { color: theme.text.primary }]}>
                      {item.topic}
                    </Text>
                    <View style={styles.roomPlayerBadge}>
                      <Users size={14} color="#1ABC9C" />
                      <Text style={styles.roomPlayerCount}>
                        {item.participants.length}/{item.maxPlayers}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.roomCategory, { color: theme.text.secondary }]}>
                    {CATEGORIES.find((c) => c.id === item.category)?.label || item.category}
                  </Text>
                  <Text style={[styles.roomHost, { color: theme.text.secondary }]}>
                    👑 {item.hostName}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          />
        )}
      </View>
    );
  }

  // ─── CREATE ───
  if (screenState === 'create') {
    return (
      <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
        <View style={[styles.simpleHeader, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => setScreenState('lobby')}>
            <ArrowLeft size={24} color={theme.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.simpleHeaderTitle, { color: theme.text.primary }]}>Oda Oluştur</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.createForm}>
          <Text style={[styles.formLabel, { color: theme.text.secondary }]}>Konu</Text>
          <TextInput
            value={newTopic}
            onChangeText={setNewTopic}
            placeholder="Ör: Türev ve İntegral"
            placeholderTextColor="#666"
            style={[
              styles.formInput,
              { backgroundColor: theme.background.secondary, color: theme.text.primary },
            ]}
          />

          <Text style={[styles.formLabel, { color: theme.text.secondary, marginTop: 16 }]}>
            Kategori
          </Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.catChip,
                  newCategory === cat.id && {
                    backgroundColor: cat.color + '30',
                    borderColor: cat.color,
                  },
                ]}
                onPress={() => setNewCategory(cat.id)}
              >
                <Text
                  style={[
                    styles.catChipText,
                    { color: newCategory === cat.id ? cat.color : theme.text.secondary },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.createRoomBtn} onPress={handleCreateRoom}>
            <Users size={20} color="#FFF" />
            <Text style={styles.createRoomBtnText}>Oda Oluştur</Text>
          </TouchableOpacity>
          <CustomModal {...modal.modalProps} />
        </View>
      </View>
    );
  }

  // ─── ROOM ───
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background.primary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.simpleHeader, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => {
            if (currentRoom) studyRoomService.leaveRoom(currentRoom.id);
            setScreenState('lobby');
          }}
        >
          <ArrowLeft size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.simpleHeaderTitle, { color: theme.text.primary }]} numberOfLines={1}>
          {currentRoom?.topic}
        </Text>
        {currentRoom?.hostId === userId && (
          <TouchableOpacity onPress={handleStartGame} style={styles.startGameBtn}>
            <Play size={16} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Participants */}
      <View style={styles.participantBar}>
        {participants.map((p) => (
          <View
            key={p.userId}
            style={[styles.participantChip, { backgroundColor: theme.background.secondary }]}
          >
            {p.userId === currentRoom?.hostId && <Crown size={10} color="#FFD700" />}
            <Text style={[styles.participantName, { color: theme.text.primary }]}>
              {p.displayName.substring(0, 8)}
            </Text>
          </View>
        ))}
        <View style={[styles.participantChip, { backgroundColor: 'rgba(26,188,156,0.15)' }]}>
          <Zap size={12} color="#1ABC9C" />
          <Text style={{ color: '#1ABC9C', fontSize: 11, fontWeight: '700' }}>+%50 XP</Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ padding: 16, gap: 8, flexGrow: 1 }}
        renderItem={({ item }) => (
          <View
            style={[
              styles.msgBubble,
              item.type === 'system' && styles.msgSystem,
              item.userId === userId ? styles.msgSelf : styles.msgOther,
              {
                backgroundColor:
                  item.type === 'system'
                    ? 'transparent'
                    : item.userId === userId
                      ? 'rgba(26,188,156,0.15)'
                      : theme.background.secondary,
              },
            ]}
          >
            {item.type !== 'system' && item.userId !== userId && (
              <Text style={[styles.msgAuthor, { color: '#1ABC9C' }]}>{item.displayName}</Text>
            )}
            <Text
              style={[
                styles.msgText,
                { color: item.type === 'system' ? theme.text.secondary : theme.text.primary },
              ]}
            >
              {item.text}
            </Text>
          </View>
        )}
      />

      {/* Input */}
      <View
        style={[
          styles.inputBar,
          { paddingBottom: insets.bottom + 8, backgroundColor: theme.background.secondary },
        ]}
      >
        <TextInput
          value={msgInput}
          onChangeText={setMsgInput}
          placeholder="Mesaj yaz..."
          placeholderTextColor="#666"
          style={[styles.msgInput, { color: theme.text.primary }]}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity onPress={handleSend} style={styles.sendBtn}>
          <Send size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'center', marginTop: 8 },
  simpleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  simpleHeaderTitle: { fontSize: 17, fontWeight: '700', flex: 1, marginLeft: 12 },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 16, fontWeight: '600' },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1ABC9C',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  createBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },

  roomCard: { borderRadius: 16, padding: 16 },
  roomTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roomTopic: { fontSize: 16, fontWeight: '700', flex: 1 },
  roomPlayerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(26,188,156,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roomPlayerCount: { color: '#1ABC9C', fontSize: 12, fontWeight: '700' },
  roomCategory: { fontSize: 13, marginTop: 4 },
  roomHost: { fontSize: 12, marginTop: 4 },

  createForm: { padding: 20 },
  formLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  formInput: { borderRadius: 14, padding: 14, fontSize: 15, borderWidth: 1, borderColor: '#333' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  catChipText: { fontSize: 13, fontWeight: '600' },
  createRoomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1ABC9C',
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
  },
  createRoomBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  participantBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 6,
    flexWrap: 'wrap',
    paddingBottom: 8,
  },
  participantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  participantName: { fontSize: 12, fontWeight: '600' },

  startGameBtn: { backgroundColor: '#2ECC71', borderRadius: 12, padding: 8 },

  msgBubble: { maxWidth: '80%', borderRadius: 14, padding: 10 },
  msgSystem: { alignSelf: 'center', maxWidth: '100%' },
  msgSelf: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  msgOther: { alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  msgAuthor: { fontSize: 11, fontWeight: '700', marginBottom: 2 },
  msgText: { fontSize: 14, lineHeight: 20 },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  msgInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1ABC9C',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
