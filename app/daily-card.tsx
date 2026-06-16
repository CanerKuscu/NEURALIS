/**
 * Daily Card Screen — Günlük Bilgi Kartı
 */
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Calendar,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import { dailyCardService, CARD_CATEGORIES } from '../src/services/DailyCardService';
import type { DailyCard } from '../src/services/DailyCardService';
import * as Haptics from 'expo-haptics';
import i18n from '../src/i18n';

const { width } = Dimensions.get('window');

export default function DailyCardScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const [card, setCard] = useState<DailyCard | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [history, setHistory] = useState<DailyCard[]>([]);
  const [viewIndex, setViewIndex] = useState(0);

  useEffect(() => {
    loadCard();
  }, []);

  const loadCard = async () => {
    const today = await dailyCardService.getTodayCard();
    setCard(today);
    await dailyCardService.markAsRead();
    const hist = await dailyCardService.getHistory();
    setHistory(hist);
    const favs = await dailyCardService.getFavorites();
    setIsFavorite(favs.includes(today.id));
  };

  const toggleFav = async () => {
    if (!card) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await dailyCardService.toggleFavorite(card.id);
    setIsFavorite(!isFavorite);
  };

  const shareCard = async () => {
    if (!card) return;
    const cat = CARD_CATEGORIES.find((c) => c.key === card.category);
    await Share.share({
      message: `${cat?.emoji || '💡'} ${card.title}\n\n${card.content}\n\n${i18n.t('daily.share_text')}`,
    });
  };

  const category = card ? CARD_CATEGORIES.find((c) => c.key === card.category) : null;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: theme.background.primary },
      ]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>
          {i18n.t('daily.title')}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {card && (
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.cardWrapper}>
          <LinearGradient
            colors={[category?.color || '#3498DB', isDark ? '#0a0a1e' : '#1a1a3e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            {/* Category Badge */}
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryEmoji}>{category?.emoji}</Text>
              <Text style={styles.categoryText}>{category?.label}</Text>
            </View>

            {/* Date */}
            <View style={styles.dateRow}>
              <Calendar size={14} color="rgba(255,255,255,0.6)" />
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>

            {/* Title */}
            <Text style={styles.cardTitle}>{card.title}</Text>

            {/* Content */}
            <Text style={styles.cardContent}>{card.content}</Text>

            {/* Fun Fact */}
            {card.funFact && (
              <View style={styles.funFact}>
                <Text style={styles.funFactLabel}>🤓 İlginç Bilgi</Text>
                <Text style={styles.funFactText}>{card.funFact}</Text>
              </View>
            )}

            {/* Source */}
            {card.source && <Text style={styles.source}>📚 {card.source}</Text>}
          </LinearGradient>
        </Animated.View>
      )}

      {/* Action Buttons */}
      <Animated.View entering={FadeIn.delay(300)} style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.background.secondary }]}
          onPress={toggleFav}
        >
          <Heart
            size={24}
            color={isFavorite ? '#E74C3C' : theme.text.secondary}
            fill={isFavorite ? '#E74C3C' : 'transparent'}
          />
          <Text style={[styles.actionText, { color: theme.text.secondary }]}>Favori</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.background.secondary }]}
          onPress={shareCard}
        >
          <Share2 size={24} color={theme.text.secondary} />
          <Text style={[styles.actionText, { color: theme.text.secondary }]}>Paylaş</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.background.secondary }]}
          onPress={() => router.push('/spaced-repetition')}
        >
          <BookOpen size={24} color={theme.text.secondary} />
          <Text style={[styles.actionText, { color: theme.text.secondary }]}>Tekrar</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* History Preview */}
      {history.length > 1 && (
        <View style={styles.historySection}>
          <Text style={[styles.historyTitle, { color: theme.text.primary }]}>Geçmiş Kartlar</Text>
          <View style={styles.historyRow}>
            {history.slice(1, 5).map((h, i) => {
              const hCat = CARD_CATEGORIES.find((c) => c.key === h.category);
              return (
                <View
                  key={h.id}
                  style={[styles.historyCard, { backgroundColor: theme.background.secondary }]}
                >
                  <Text style={styles.historyEmoji}>{hCat?.emoji}</Text>
                  <Text
                    style={[styles.historyCardTitle, { color: theme.text.primary }]}
                    numberOfLines={1}
                  >
                    {h.title}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
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
  cardWrapper: { paddingHorizontal: 20, marginTop: 8 },
  card: { borderRadius: 24, padding: 24, gap: 12, minHeight: 320 },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryEmoji: { fontSize: 16 },
  categoryText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '500' },
  cardTitle: { color: '#FFF', fontSize: 22, fontWeight: '800', lineHeight: 28 },
  cardContent: { color: 'rgba(255,255,255,0.9)', fontSize: 15, lineHeight: 24, fontWeight: '500' },
  funFact: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, gap: 6 },
  funFactLabel: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  funFactText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 20 },
  source: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '500' },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  actionBtn: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 14, borderRadius: 16 },
  actionText: { fontSize: 12, fontWeight: '600' },
  historySection: { paddingHorizontal: 20, marginTop: 8 },
  historyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  historyRow: { gap: 8 },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
  },
  historyEmoji: { fontSize: 20 },
  historyCardTitle: { fontSize: 14, fontWeight: '600', flex: 1 },
});
