/**
 * NEURALIS - Flashcard Creator Screen
 * Kendi kartlarını oluştur veya AI ile otomatik oluştur — Spaced Repetition
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
  Modal,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Plus,
  Sparkles,
  Trash2,
  RotateCcw,
  CheckCircle,
  XCircle,
  BookOpen,
  Layers,
  Edit3,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import { supabase } from '../src/config/supabase';
import type { FlashcardDeck, Flashcard } from '../src/services/FlashcardCreatorService';
import { flashcardCreatorService } from '../src/services/FlashcardCreatorService';
import * as Haptics from 'expo-haptics';
import i18n from '../src/i18n';
import { CustomModal, useModal } from '../src/components/CustomModal';

const { width } = Dimensions.get('window');

type ScreenState = 'decks' | 'cards' | 'study' | 'create-deck' | 'add-card';

export default function FlashcardCreatorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme } = useTheme();
  const modal = useModal();

  const [screenState, setScreenState] = useState<ScreenState>('decks');
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<FlashcardDeck | null>(null);
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');

  // Create form states
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [newDeckCategory, setNewDeckCategory] = useState('');
  const [newCardFront, setNewCardFront] = useState('');
  const [newCardBack, setNewCardBack] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState('');

  const flipAnim = useSharedValue(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      setUserId(session.user.id);
      const d = await flashcardCreatorService.getDecks(session.user.id);
      setDecks(d);
    }
    setLoading(false);
  };

  const handleCreateDeck = async () => {
    if (!newDeckTitle.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const deck = await flashcardCreatorService.createDeck(
      userId,
      newDeckTitle.trim(),
      newDeckCategory.trim() || 'general',
    );
    setDecks((prev) => [...prev, deck]);
    setNewDeckTitle('');
    setNewDeckCategory('');
    setScreenState('decks');
  };

  const handleAddCard = async () => {
    if (!newCardFront.trim() || !newCardBack.trim() || !selectedDeck) return;
    await flashcardCreatorService.addCard(
      userId,
      selectedDeck.id,
      newCardFront.trim(),
      newCardBack.trim(),
    );
    setNewCardFront('');
    setNewCardBack('');
    const updated = await flashcardCreatorService.getDecks(userId);
    setDecks(updated);
    setSelectedDeck(updated.find((d) => d.id === selectedDeck.id) || null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleAIGenerate = async () => {
    if (!aiTopic.trim() || !selectedDeck) return;
    setAiGenerating(true);
    await flashcardCreatorService.generateAICards(userId, selectedDeck.id, aiTopic.trim(), 5);
    const updated = await flashcardCreatorService.getDecks(userId);
    setDecks(updated);
    setSelectedDeck(updated.find((d) => d.id === selectedDeck.id) || null);
    setAiGenerating(false);
    setAiTopic('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const startStudy = async (deck: FlashcardDeck) => {
    const due = await flashcardCreatorService.getDueCards(userId, deck.id);
    if (due.length === 0) {
      modal.info(i18n.t('flashcard.completed'), i18n.t('flashcard.all_studied'));
      return;
    }
    setDueCards(due);
    setCurrentCardIdx(0);
    setShowBack(false);
    setSelectedDeck(deck);
    setScreenState('study');
  };

  const handleFlip = () => {
    setShowBack(!showBack);
    flipAnim.value = withTiming(showBack ? 0 : 1, { duration: 300 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleReview = async (correct: boolean) => {
    if (!selectedDeck || dueCards.length === 0) return;
    const card = dueCards[currentCardIdx];
    await flashcardCreatorService.reviewCard(userId, selectedDeck.id, card.id, correct);
    Haptics.impactAsync(
      correct ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Heavy,
    );

    if (currentCardIdx + 1 >= dueCards.length) {
      modal.success(i18n.t('flashcard.completed'), `${dueCards.length} kart çalışıldı 🎉`);
      setScreenState('cards');
    } else {
      setCurrentCardIdx((prev) => prev + 1);
      setShowBack(false);
      flipAnim.value = withTiming(0, { duration: 200 });
    }
  };

  const handleDeleteDeck = async (deckId: string) => {
    modal.confirm(
      i18n.t('common.delete'),
      'Bu desteyi silmek istediğinize emin misiniz?',
      async () => {
        await flashcardCreatorService.deleteDeck(userId, deckId);
        setDecks((prev) => prev.filter((d) => d.id !== deckId));
      },
      i18n.t('common.delete'),
      i18n.t('common.cancel'),
    );
  };

  const frontStyle = useAnimatedStyle(() => ({
    opacity: interpolate(flipAnim.value, [0, 0.5, 1], [1, 0, 0]),
    transform: [{ rotateY: `${flipAnim.value * 180}deg` }],
  }));
  const backStyle = useAnimatedStyle(() => ({
    opacity: interpolate(flipAnim.value, [0, 0.5, 1], [0, 0, 1]),
    transform: [{ rotateY: `${flipAnim.value * 180 - 180}deg` }],
  }));

  if (loading) {
    return (
      <View
        style={[styles.container, styles.center, { backgroundColor: theme.background.primary }]}
      >
        <ActivityIndicator size="large" color="#9B59B6" />
      </View>
    );
  }

  // ─── STUDY ───
  if (screenState === 'study' && dueCards.length > 0) {
    const card = dueCards[currentCardIdx];
    return (
      <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
        <View style={[styles.simpleHeader, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => setScreenState('cards')}>
            <ArrowLeft size={24} color={theme.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.simpleTitle, { color: theme.text.primary }]}>
            {currentCardIdx + 1}/{dueCards.length}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.studyArea}>
          <TouchableOpacity onPress={handleFlip} activeOpacity={0.9} style={styles.cardTouchable}>
            <Animated.View
              style={[
                styles.flashcardFace,
                { backgroundColor: theme.background.secondary },
                frontStyle,
              ]}
            >
              <Text style={[styles.flashcardSide, { color: '#9B59B6' }]}>ÖN</Text>
              <Text style={[styles.flashcardText, { color: theme.text.primary }]}>
                {card.front}
              </Text>
              <Text style={[styles.tapHint, { color: theme.text.secondary }]}>
                Çevirmek için dokun
              </Text>
            </Animated.View>
            <Animated.View
              style={[
                styles.flashcardFace,
                styles.flashcardBack,
                { backgroundColor: theme.background.secondary },
                backStyle,
              ]}
            >
              <Text style={[styles.flashcardSide, { color: '#2ECC71' }]}>ARKA</Text>
              <Text style={[styles.flashcardText, { color: theme.text.primary }]}>{card.back}</Text>
            </Animated.View>
          </TouchableOpacity>
        </View>

        {showBack && (
          <Animated.View entering={FadeInDown} style={styles.reviewBtns}>
            <TouchableOpacity
              style={[styles.reviewBtn, { backgroundColor: '#FF4B4B' }]}
              onPress={() => handleReview(false)}
            >
              <XCircle size={24} color="#FFF" />
              <Text style={styles.reviewBtnText}>Tekrar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.reviewBtn, { backgroundColor: '#2ECC71' }]}
              onPress={() => handleReview(true)}
            >
              <CheckCircle size={24} color="#FFF" />
              <Text style={styles.reviewBtnText}>Biliyorum</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
        <CustomModal {...modal.modalProps} />
      </View>
    );
  }

  // ─── CREATE DECK ───
  if (screenState === 'create-deck') {
    return (
      <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
        <View style={[styles.simpleHeader, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => setScreenState('decks')}>
            <ArrowLeft size={24} color={theme.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.simpleTitle, { color: theme.text.primary }]}>Yeni Deste</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.form}>
          <Text style={[styles.formLabel, { color: theme.text.secondary }]}>Deste Adı</Text>
          <TextInput
            value={newDeckTitle}
            onChangeText={setNewDeckTitle}
            placeholder="Ör: Fizik Formülleri"
            placeholderTextColor="#666"
            style={[
              styles.formInput,
              { backgroundColor: theme.background.secondary, color: theme.text.primary },
            ]}
          />
          <Text style={[styles.formLabel, { color: theme.text.secondary, marginTop: 16 }]}>
            Kategori
          </Text>
          <TextInput
            value={newDeckCategory}
            onChangeText={setNewDeckCategory}
            placeholder="Ör: science"
            placeholderTextColor="#666"
            style={[
              styles.formInput,
              { backgroundColor: theme.background.secondary, color: theme.text.primary },
            ]}
          />
          <TouchableOpacity style={styles.createDeckBtn} onPress={handleCreateDeck}>
            <Text style={styles.createDeckBtnText}>Oluştur</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── CARDS (deck detail) ───
  if (screenState === 'cards' && selectedDeck) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
        <View style={[styles.simpleHeader, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity
            onPress={() => {
              setScreenState('decks');
              setSelectedDeck(null);
            }}
          >
            <ArrowLeft size={24} color={theme.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.simpleTitle, { color: theme.text.primary }]} numberOfLines={1}>
            {selectedDeck.title}
          </Text>
          <TouchableOpacity onPress={() => setScreenState('add-card')}>
            <Plus size={24} color="#9B59B6" />
          </TouchableOpacity>
        </View>

        <View style={styles.deckActions}>
          <TouchableOpacity style={styles.studyBtn} onPress={() => startStudy(selectedDeck)}>
            <BookOpen size={18} color="#FFF" />
            <Text style={styles.studyBtnText}>Çalış ({selectedDeck.cards.length} kart)</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={selectedDeck.cards}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 50)}>
              <View style={[styles.cardRow, { backgroundColor: theme.background.secondary }]}>
                <View style={styles.cardContent}>
                  <Text style={[styles.cardFront, { color: theme.text.primary }]} numberOfLines={1}>
                    {item.front}
                  </Text>
                  <Text
                    style={[styles.cardBackText, { color: theme.text.secondary }]}
                    numberOfLines={1}
                  >
                    {item.back}
                  </Text>
                </View>
                <View
                  style={[
                    styles.boxBadge,
                    { backgroundColor: item.box >= 4 ? '#2ECC7120' : '#FF6B0020' },
                  ]}
                >
                  <Text
                    style={{
                      color: item.box >= 4 ? '#2ECC71' : '#FF6B00',
                      fontSize: 11,
                      fontWeight: '700',
                    }}
                  >
                    Box {item.box}
                  </Text>
                </View>
                {item.createdBy === 'ai' && <Sparkles size={14} color="#FFD700" />}
              </View>
            </Animated.View>
          )}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: theme.text.secondary }]}>
              Henüz kart yok. Ekle veya AI ile oluştur!
            </Text>
          }
        />
        <CustomModal {...modal.modalProps} />
      </View>
    );
  }

  // ─── ADD CARD ───
  if (screenState === 'add-card' && selectedDeck) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
        <View style={[styles.simpleHeader, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => setScreenState('cards')}>
            <ArrowLeft size={24} color={theme.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.simpleTitle, { color: theme.text.primary }]}>Kart Ekle</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.form}>
          <Text style={[styles.formLabel, { color: theme.text.secondary }]}>
            Ön Yüz (Soru / Terim)
          </Text>
          <TextInput
            value={newCardFront}
            onChangeText={setNewCardFront}
            placeholder="Ör: Newton'un 2. Yasası"
            placeholderTextColor="#666"
            multiline
            style={[
              styles.formInput,
              styles.formInputMulti,
              { backgroundColor: theme.background.secondary, color: theme.text.primary },
            ]}
          />
          <Text style={[styles.formLabel, { color: theme.text.secondary, marginTop: 12 }]}>
            Arka Yüz (Cevap / Tanım)
          </Text>
          <TextInput
            value={newCardBack}
            onChangeText={setNewCardBack}
            placeholder="Ör: F = m × a"
            placeholderTextColor="#666"
            multiline
            style={[
              styles.formInput,
              styles.formInputMulti,
              { backgroundColor: theme.background.secondary, color: theme.text.primary },
            ]}
          />
          <TouchableOpacity
            style={[styles.createDeckBtn, { marginTop: 12 }]}
            onPress={handleAddCard}
          >
            <Plus size={18} color="#FFF" />
            <Text style={styles.createDeckBtnText}>Kart Ekle</Text>
          </TouchableOpacity>

          <View style={styles.aiSection}>
            <Text style={[styles.aiTitle, { color: theme.text.primary }]}>
              🤖 AI ile Otomatik Oluştur
            </Text>
            <TextInput
              value={aiTopic}
              onChangeText={setAiTopic}
              placeholder="Konu girin: Ör: Kimyasal bağlar"
              placeholderTextColor="#666"
              style={[
                styles.formInput,
                { backgroundColor: theme.background.secondary, color: theme.text.primary },
              ]}
            />
            <TouchableOpacity
              style={styles.aiBtn}
              onPress={handleAIGenerate}
              disabled={aiGenerating}
            >
              {aiGenerating ? (
                <ActivityIndicator size="small" color="#FFD700" />
              ) : (
                <Sparkles size={18} color="#FFD700" />
              )}
              <Text style={styles.aiBtnText}>
                {aiGenerating ? i18n.t('flashcard.creating') : i18n.t('flashcard.create_cards')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ─── DECKS LIST ───
  return (
    <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
      <LinearGradient
        colors={['#9B59B6', '#8E44AD']}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🗂️ Flashcard Creator</Text>
          <TouchableOpacity onPress={() => setScreenState('create-deck')} style={styles.backBtn}>
            <Plus size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSub}>Kendi kartlarını oluştur, AI ile otomatik ekle</Text>
      </LinearGradient>

      <FlatList
        data={decks}
        keyExtractor={(d) => d.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 80)}>
            <TouchableOpacity
              style={[styles.deckCard, { backgroundColor: theme.background.secondary }]}
              onPress={() => {
                setSelectedDeck(item);
                setScreenState('cards');
              }}
              onLongPress={() => handleDeleteDeck(item.id)}
            >
              <Layers size={28} color="#9B59B6" />
              <View style={styles.deckInfo}>
                <Text style={[styles.deckTitle, { color: theme.text.primary }]}>{item.title}</Text>
                <Text style={[styles.deckSub, { color: theme.text.secondary }]}>
                  {item.cards.length} kart • {item.category}
                </Text>
              </View>
              <TouchableOpacity onPress={() => startStudy(item)} style={styles.deckStudyBtn}>
                <BookOpen size={18} color="#9B59B6" />
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyView}>
            <Layers size={48} color={theme.text.secondary} />
            <Text style={[styles.emptyText, { color: theme.text.secondary }]}>Henüz deste yok</Text>
            <TouchableOpacity
              style={styles.createDeckBtn}
              onPress={() => setScreenState('create-deck')}
            >
              <Plus size={18} color="#FFF" />
              <Text style={styles.createDeckBtnText}>İlk Desteni Oluştur</Text>
            </TouchableOpacity>
          </View>
        }
      />
      <CustomModal {...modal.modalProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
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
  simpleTitle: { fontSize: 17, fontWeight: '700' },

  deckCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 16, padding: 16 },
  deckInfo: { flex: 1 },
  deckTitle: { fontSize: 16, fontWeight: '700' },
  deckSub: { fontSize: 12, marginTop: 2 },
  deckStudyBtn: { padding: 8 },

  deckActions: { paddingHorizontal: 16, marginBottom: 8 },
  studyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#9B59B6',
    borderRadius: 14,
    padding: 14,
  },
  studyBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },

  cardRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 12, gap: 8 },
  cardContent: { flex: 1 },
  cardFront: { fontSize: 14, fontWeight: '600' },
  cardBackText: { fontSize: 12, marginTop: 2 },
  boxBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },

  form: { padding: 20 },
  formLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  formInput: { borderRadius: 14, padding: 14, fontSize: 15, borderWidth: 1, borderColor: '#333' },
  formInputMulti: { minHeight: 80, textAlignVertical: 'top' },
  createDeckBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#9B59B6',
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
  },
  createDeckBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },

  aiSection: { marginTop: 24, gap: 10 },
  aiTitle: { fontSize: 15, fontWeight: '700' },
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
    marginTop: 4,
  },
  aiBtnText: { color: '#FFD700', fontSize: 14, fontWeight: '700' },

  studyArea: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  cardTouchable: { width: width - 48, height: width - 48, maxHeight: 350 },
  flashcardFace: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 24,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backfaceVisibility: 'hidden',
  },
  flashcardBack: {},
  flashcardSide: { fontSize: 12, fontWeight: '700', position: 'absolute', top: 16 },
  flashcardText: { fontSize: 20, fontWeight: '700', textAlign: 'center', lineHeight: 28 },
  tapHint: { fontSize: 12, position: 'absolute', bottom: 16 },

  reviewBtns: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 30, gap: 12 },
  reviewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    padding: 16,
  },
  reviewBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  emptyView: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80, gap: 12 },
  emptyText: { fontSize: 15, textAlign: 'center' },
});
