/**
 * Analytics Dashboard Screen — Öğrenme Analitik Paneli
 */
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  Clock,
  Target,
  Brain,
  Zap,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import { analyticsService } from '../src/services/AnalyticsService';
import type {
  WeeklySummary,
  MonthlySummary,
  LearningTrend,
  PerformanceInsight,
} from '../src/services/AnalyticsService';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const [weekly, setWeekly] = useState<WeeklySummary | null>(null);
  const [monthly, setMonthly] = useState<MonthlySummary | null>(null);
  const [xpTrend, setXpTrend] = useState<LearningTrend[]>([]);
  const [insights, setInsights] = useState<PerformanceInsight[]>([]);
  const [heatmap, setHeatmap] = useState<{ date: string; level: 0 | 1 | 2 | 3 | 4 }[]>([]);
  const [tab, setTab] = useState<'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [w, m, xp, ins, hm] = await Promise.all([
      analyticsService.getWeeklySummary(),
      analyticsService.getMonthlySummary(),
      analyticsService.getWeeklyXpTrend(),
      analyticsService.getInsights(),
      analyticsService.getHeatmapData(42), // 6 hafta
    ]);
    setWeekly(w);
    setMonthly(m);
    setXpTrend(xp);
    setInsights(ins);
    setHeatmap(hm);
  };

  const maxXp = Math.max(...xpTrend.map((t) => t.value), 1);
  const heatColors = ['#1a1a2e20', '#2ECC7130', '#2ECC7160', '#2ECC71A0', '#2ECC71'];

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: theme.background.primary },
      ]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Analitik</Text>
        <BarChart3 size={24} color={theme.primary} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 100 }}>
        {/* Insights */}
        {insights.map((insight, i) => (
          <Animated.View key={i} entering={FadeInDown.delay(i * 80)}>
            <View
              style={[
                styles.insightCard,
                {
                  backgroundColor:
                    insight.type === 'positive'
                      ? '#2ECC7115'
                      : insight.type === 'negative'
                        ? '#E74C3C15'
                        : theme.background.secondary,
                  borderLeftColor:
                    insight.type === 'positive'
                      ? '#2ECC71'
                      : insight.type === 'negative'
                        ? '#E74C3C'
                        : '#F1C40F',
                },
              ]}
            >
              <Text style={styles.insightEmoji}>{insight.emoji}</Text>
              <Text style={[styles.insightText, { color: theme.text.primary }]}>
                {insight.textTr}
              </Text>
            </View>
          </Animated.View>
        ))}

        {/* Tab Switch */}
        <View style={[styles.tabRow, { backgroundColor: theme.background.secondary }]}>
          <TouchableOpacity
            style={[styles.tab, tab === 'weekly' && styles.tabActive]}
            onPress={() => setTab('weekly')}
          >
            <Text
              style={[styles.tabText, { color: tab === 'weekly' ? '#FFF' : theme.text.secondary }]}
            >
              Haftalık
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'monthly' && styles.tabActive]}
            onPress={() => setTab('monthly')}
          >
            <Text
              style={[styles.tabText, { color: tab === 'monthly' ? '#FFF' : theme.text.secondary }]}
            >
              Aylık
            </Text>
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        {tab === 'weekly' && weekly && (
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: theme.background.secondary }]}>
              <Zap size={20} color="#F1C40F" />
              <Text style={[styles.statNum, { color: theme.text.primary }]}>{weekly.totalXp}</Text>
              <Text style={[styles.statLabel, { color: theme.text.secondary }]}>XP</Text>
              {weekly.improvement !== 0 && (
                <View
                  style={[
                    styles.changeTag,
                    { backgroundColor: weekly.improvement > 0 ? '#2ECC7120' : '#E74C3C20' },
                  ]}
                >
                  {weekly.improvement > 0 ? (
                    <TrendingUp size={12} color="#2ECC71" />
                  ) : (
                    <TrendingDown size={12} color="#E74C3C" />
                  )}
                  <Text
                    style={{
                      color: weekly.improvement > 0 ? '#2ECC71' : '#E74C3C',
                      fontSize: 11,
                      fontWeight: '700',
                    }}
                  >
                    %{Math.abs(weekly.improvement)}
                  </Text>
                </View>
              )}
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.background.secondary }]}>
              <Brain size={20} color="#9B59B6" />
              <Text style={[styles.statNum, { color: theme.text.primary }]}>
                {weekly.totalLessons}
              </Text>
              <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Ders</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.background.secondary }]}>
              <Target size={20} color="#2ECC71" />
              <Text style={[styles.statNum, { color: theme.text.primary }]}>
                %{weekly.accuracy}
              </Text>
              <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Doğruluk</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.background.secondary }]}>
              <Clock size={20} color="#3498DB" />
              <Text style={[styles.statNum, { color: theme.text.primary }]}>
                {weekly.totalTime}
              </Text>
              <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Dakika</Text>
            </View>
          </View>
        )}

        {tab === 'monthly' && monthly && (
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: theme.background.secondary }]}>
              <Zap size={20} color="#F1C40F" />
              <Text style={[styles.statNum, { color: theme.text.primary }]}>{monthly.totalXp}</Text>
              <Text style={[styles.statLabel, { color: theme.text.secondary }]}>XP</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.background.secondary }]}>
              <Brain size={20} color="#9B59B6" />
              <Text style={[styles.statNum, { color: theme.text.primary }]}>
                {monthly.totalLessons}
              </Text>
              <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Ders</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.background.secondary }]}>
              <Calendar size={20} color="#E67E22" />
              <Text style={[styles.statNum, { color: theme.text.primary }]}>
                {monthly.activeDays}
              </Text>
              <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Aktif Gün</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.background.secondary }]}>
              <Target size={20} color="#2ECC71" />
              <Text style={[styles.statNum, { color: theme.text.primary }]}>
                %{monthly.accuracy}
              </Text>
              <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Doğruluk</Text>
            </View>
          </View>
        )}

        {/* XP Bar Chart */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Haftalık XP</Text>
          <View style={[styles.chartContainer, { backgroundColor: theme.background.secondary }]}>
            <View style={styles.barChart}>
              {xpTrend.map((d, i) => (
                <View key={i} style={styles.barCol}>
                  <View style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${Math.max(5, (d.value / maxXp) * 100)}%`,
                          backgroundColor: d.value > 0 ? '#2ECC71' : theme.border.light,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, { color: theme.text.secondary }]}>{d.label}</Text>
                  <Text style={[styles.barValue, { color: theme.text.secondary }]}>{d.value}</Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Activity Heatmap */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
            Aktivite Haritası
          </Text>
          <View style={[styles.heatmapContainer, { backgroundColor: theme.background.secondary }]}>
            <View style={styles.heatmapGrid}>
              {heatmap.map((d, i) => (
                <View
                  key={i}
                  style={[
                    styles.heatCell,
                    {
                      backgroundColor: isDark
                        ? d.level === 0
                          ? 'rgba(255,255,255,0.05)'
                          : heatColors[d.level]
                        : heatColors[d.level],
                    },
                  ]}
                />
              ))}
            </View>
            <View style={styles.heatLegend}>
              <Text style={[styles.heatLegendText, { color: theme.text.secondary }]}>Az</Text>
              {heatColors.map((c, i) => (
                <View
                  key={i}
                  style={[styles.heatCell, { backgroundColor: c, width: 14, height: 14 }]}
                />
              ))}
              <Text style={[styles.heatLegendText, { color: theme.text.secondary }]}>Çok</Text>
            </View>
          </View>
        </Animated.View>

        {/* Category Breakdown (monthly) */}
        {monthly && monthly.categoryBreakdown.length > 0 && (
          <Animated.View entering={FadeInDown.delay(400)}>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
              Kategori Dağılımı
            </Text>
            {monthly.categoryBreakdown.map((cat, i) => (
              <View
                key={cat.category}
                style={[styles.catRow, { backgroundColor: theme.background.secondary }]}
              >
                <Text style={[styles.catName, { color: theme.text.primary }]}>{cat.category}</Text>
                <View style={styles.catBar}>
                  <View
                    style={[
                      styles.catBarFill,
                      {
                        width: `${cat.percentage}%`,
                        backgroundColor: ['#2ECC71', '#3498DB', '#9B59B6', '#E67E22', '#E74C3C'][
                          i % 5
                        ],
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.catPct, { color: theme.text.secondary }]}>
                  %{cat.percentage}
                </Text>
              </View>
            ))}
          </Animated.View>
        )}
      </ScrollView>
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
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderLeftWidth: 4,
  },
  insightEmoji: { fontSize: 24 },
  insightText: { fontSize: 14, fontWeight: '600', flex: 1, lineHeight: 20 },
  tabRow: { flexDirection: 'row', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#2ECC71' },
  tabText: { fontSize: 14, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: {
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 6,
  },
  statNum: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 12, fontWeight: '500' },
  changeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 8 },
  chartContainer: { borderRadius: 16, padding: 16 },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    height: 120,
    alignItems: 'flex-end',
  },
  barCol: { alignItems: 'center', flex: 1, gap: 4 },
  barWrapper: {
    height: 80,
    width: 20,
    justifyContent: 'flex-end',
    borderRadius: 10,
    overflow: 'hidden',
  },
  bar: { width: '100%', borderRadius: 10 },
  barLabel: { fontSize: 11, fontWeight: '600' },
  barValue: { fontSize: 10, fontWeight: '500' },
  heatmapContainer: { borderRadius: 16, padding: 16 },
  heatmapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  heatCell: { width: 16, height: 16, borderRadius: 3 },
  heatLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    justifyContent: 'flex-end',
  },
  heatLegendText: { fontSize: 10, fontWeight: '500' },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    marginTop: 6,
  },
  catName: { fontSize: 13, fontWeight: '600', width: 80 },
  catBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  catBarFill: { height: '100%', borderRadius: 4 },
  catPct: { fontSize: 13, fontWeight: '700', width: 40, textAlign: 'right' },
});
