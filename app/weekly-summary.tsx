/**
 * NEURALIS - Weekly Summary Screen
 * Neural Fox'un haftalık raporu — istatistikler, öneriler, motivasyon
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Flame,
  Target,
  BookOpen,
  Zap,
  Clock,
  Award,
  ChevronRight,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn, ZoomIn } from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import { supabase } from '../src/config/supabase';
import type { WeeklySummary } from '../src/services/WeeklySummaryService';
import { weeklySummaryService } from '../src/services/WeeklySummaryService';
import i18n from '../src/i18n';

const { width } = Dimensions.get('window');

const CATEGORY_EMOJI: Record<string, string> = {
  mathematics: '🔢',
  science: '🔬',
  coding: '💻',
  history: '📜',
  language: '🌍',
  music: '🎵',
  art: '🎨',
  geography: '🗺️',
};

export default function WeeklySummaryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme } = useTheme();

  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;
      let s = await weeklySummaryService.getCurrentSummary(session.user.id);
      if (!s) s = await weeklySummaryService.generateSummary(session.user.id);
      setSummary(s);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
        <ActivityIndicator size="large" color="#FFD700" style={{ marginTop: 200 }} />
        <Text style={[styles.loadingText, { color: theme.text.secondary }]}>
          🦊 Raporun hazırlanıyor...
        </Text>
      </View>
    );
  }

  if (!summary) return null;

  const changeIcon = (val: number) =>
    val >= 0 ? (
      <TrendingUp size={14} color="#2ECC71" />
    ) : (
      <TrendingDown size={14} color="#FF4B4B" />
    );
  const changeColor = (val: number) => (val >= 0 ? '#2ECC71' : '#FF4B4B');
  const changeText = (val: number, unit: string) => `${val >= 0 ? '+' : ''}${val}${unit}`;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background.primary }]}>
      {/* Header + Fox message */}
      <LinearGradient
        colors={['#2C3E50', '#34495E']}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>📊 Haftalık Rapor</Text>
          <View style={{ width: 40 }} />
        </View>

        <Animated.View entering={FadeInDown.delay(200)} style={styles.foxCard}>
          <Text style={styles.foxEmoji}>🦊</Text>
          <Text style={styles.foxMessage}>{summary.foxMessage}</Text>
        </Animated.View>
      </LinearGradient>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <Animated.View
          entering={FadeInDown.delay(300)}
          style={[styles.statCard, { backgroundColor: theme.background.secondary }]}
        >
          <BookOpen size={24} color="#3498DB" />
          <Text style={[styles.statValue, { color: theme.text.primary }]}>
            {summary.stats.lessonsCompleted}
          </Text>
          <Text style={[styles.statLabel, { color: theme.text.secondary }]}>
            {i18n.t('weekly.lessons')}
          </Text>
          <View style={styles.changeRow}>
            {changeIcon(summary.comparison.lessonsChange)}
            <Text
              style={[styles.changeText, { color: changeColor(summary.comparison.lessonsChange) }]}
            >
              {changeText(summary.comparison.lessonsChange, '')}
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(350)}
          style={[styles.statCard, { backgroundColor: theme.background.secondary }]}
        >
          <Zap size={24} color="#FFD700" />
          <Text style={[styles.statValue, { color: theme.text.primary }]}>
            {summary.stats.xpEarned}
          </Text>
          <Text style={[styles.statLabel, { color: theme.text.secondary }]}>XP</Text>
          <View style={styles.changeRow}>
            {changeIcon(summary.comparison.xpChange)}
            <Text style={[styles.changeText, { color: changeColor(summary.comparison.xpChange) }]}>
              {changeText(summary.comparison.xpChange, '')}
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(400)}
          style={[styles.statCard, { backgroundColor: theme.background.secondary }]}
        >
          <Flame size={24} color="#FF6B00" />
          <Text style={[styles.statValue, { color: theme.text.primary }]}>
            {summary.stats.streakDays}
          </Text>
          <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Streak</Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(450)}
          style={[styles.statCard, { backgroundColor: theme.background.secondary }]}
        >
          <Target size={24} color="#2ECC71" />
          <Text style={[styles.statValue, { color: theme.text.primary }]}>
            %{summary.stats.accuracy}
          </Text>
          <Text style={[styles.statLabel, { color: theme.text.secondary }]}>
            {i18n.t('weekly.accuracy')}
          </Text>
          <View style={styles.changeRow}>
            {changeIcon(summary.comparison.accuracyChange)}
            <Text
              style={[styles.changeText, { color: changeColor(summary.comparison.accuracyChange) }]}
            >
              {changeText(summary.comparison.accuracyChange, '%')}
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Time + Quests */}
      <Animated.View
        entering={FadeInDown.delay(500)}
        style={[styles.timeRow, { backgroundColor: theme.background.secondary }]}
      >
        <View style={styles.timeItem}>
          <Clock size={18} color="#9B59B6" />
          <Text style={[styles.timeValue, { color: theme.text.primary }]}>
            {summary.stats.timeSpentMinutes} dk
          </Text>
          <Text style={[styles.timeLabel, { color: theme.text.secondary }]}>
            {i18n.t('weekly.total_time')}
          </Text>
        </View>
        <View style={styles.timeDivider} />
        <View style={styles.timeItem}>
          <Award size={18} color="#E67E22" />
          <Text style={[styles.timeValue, { color: theme.text.primary }]}>
            {summary.stats.questsCompleted}
          </Text>
          <Text style={[styles.timeLabel, { color: theme.text.secondary }]}>Görev</Text>
        </View>
      </Animated.View>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>📊 Konu Analizi</Text>
        <View style={[styles.catCompare, { backgroundColor: theme.background.secondary }]}>
          <View style={styles.catItem}>
            <Text style={styles.catEmoji}>{CATEGORY_EMOJI[summary.topCategory] || '⭐'}</Text>
            <Text style={[styles.catName, { color: '#2ECC71' }]}>En Güçlü</Text>
            <Text style={[styles.catCategory, { color: theme.text.primary }]}>
              {summary.topCategory}
            </Text>
          </View>
          <Text style={[styles.vsText, { color: theme.text.secondary }]}>vs</Text>
          <View style={styles.catItem}>
            <Text style={styles.catEmoji}>{CATEGORY_EMOJI[summary.weakestCategory] || '📖'}</Text>
            <Text style={[styles.catName, { color: '#FF6B00' }]}>Geliştirilmeli</Text>
            <Text style={[styles.catCategory, { color: theme.text.primary }]}>
              {summary.weakestCategory}
            </Text>
          </View>
        </View>
      </View>

      {/* Highlights */}
      {summary.highlights.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>✨ Öne Çıkanlar</Text>
          {summary.highlights.map((h, i) => (
            <Animated.View key={i} entering={FadeInDown.delay(600 + i * 80)}>
              <View style={[styles.highlightItem, { backgroundColor: theme.background.secondary }]}>
                <Text style={[styles.highlightText, { color: theme.text.primary }]}>{h}</Text>
              </View>
            </Animated.View>
          ))}
        </View>
      )}

      {/* Improvements */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>🎯 Öneriler</Text>
        {summary.improvements.map((imp, i) => (
          <View
            key={i}
            style={[styles.improvementItem, { backgroundColor: theme.background.secondary }]}
          >
            <ChevronRight size={16} color="#FFD700" />
            <Text style={[styles.improvementText, { color: theme.text.primary }]}>{imp}</Text>
          </View>
        ))}
      </View>

      {/* Badges */}
      {summary.badgesEarned.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
            {i18n.t('weekly.badges_earned')}
          </Text>
          <View style={styles.badgeRow}>
            {summary.badgesEarned.map((b, i) => (
              <Animated.View key={i} entering={ZoomIn.delay(800 + i * 100)}>
                <View style={styles.badgeItem}>
                  <Text style={styles.badgeEmoji}>🏅</Text>
                  <Text style={[styles.badgeName, { color: theme.text.primary }]}>{b}</Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
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
  foxCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
  },
  foxEmoji: { fontSize: 36 },
  foxMessage: { flex: 1, color: '#FFF', fontSize: 14, lineHeight: 20, fontWeight: '500' },
  loadingText: { textAlign: 'center', marginTop: 16, fontSize: 14 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 10 },
  statCard: {
    width: (width - 42) / 2,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  statValue: { fontSize: 24, fontWeight: '900' },
  statLabel: { fontSize: 12, fontWeight: '600' },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  changeText: { fontSize: 12, fontWeight: '700' },

  timeRow: { flexDirection: 'row', marginHorizontal: 16, borderRadius: 16, padding: 16 },
  timeItem: { flex: 1, alignItems: 'center', gap: 4 },
  timeValue: { fontSize: 18, fontWeight: '800' },
  timeLabel: { fontSize: 11, fontWeight: '600' },
  timeDivider: { width: 1, backgroundColor: '#333' },

  section: { paddingHorizontal: 16, marginTop: 20, gap: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: 4 },

  catCompare: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16 },
  catItem: { flex: 1, alignItems: 'center', gap: 4 },
  catEmoji: { fontSize: 28 },
  catName: { fontSize: 11, fontWeight: '700' },
  catCategory: { fontSize: 14, fontWeight: '600' },
  vsText: { fontSize: 14, fontWeight: '600', marginHorizontal: 8 },

  highlightItem: { borderRadius: 12, padding: 12 },
  highlightText: { fontSize: 14, fontWeight: '500' },

  improvementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    padding: 12,
  },
  improvementText: { flex: 1, fontSize: 14, fontWeight: '500' },

  badgeRow: { flexDirection: 'row', gap: 12 },
  badgeItem: { alignItems: 'center', gap: 4 },
  badgeEmoji: { fontSize: 32 },
  badgeName: { fontSize: 11, fontWeight: '600' },
});
