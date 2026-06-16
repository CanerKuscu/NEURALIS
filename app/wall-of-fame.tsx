/**
 * NEURALIS - Wall of Fame Screen
 * Topluluğun en iyi oyuncuları ve rekorları!
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
import { ArrowLeft, Flame, Zap, BookOpen, Target, Crown, Medal } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import type { WallOfFameData, FameEntry } from '../src/services/WallOfFameService';
import { wallOfFameService } from '../src/services/WallOfFameService';
import i18n from '../src/i18n';

const { width } = Dimensions.get('window');

const TABS = [
  { key: 'streak', label: i18n.t('wall.streak_label'), icon: Flame, color: '#FF6B35' },
  { key: 'xp', label: '⚡ XP', icon: Zap, color: '#FFD700' },
  { key: 'lessons', label: i18n.t('wall.lessons_label'), icon: BookOpen, color: '#3498DB' },
  { key: 'quests', label: '🎯 Görevler', icon: Target, color: '#2ECC71' },
];

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

export default function WallOfFameScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme } = useTheme();

  const [data, setData] = useState<WallOfFameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('streak');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const d = await wallOfFameService.getData();
    setData(d);
    setLoading(false);
  };

  const getEntries = (): FameEntry[] => {
    if (!data) return [];
    switch (activeTab) {
      case 'streak':
        return data.topStreaks;
      case 'xp':
        return data.topXP;
      case 'lessons':
        return data.topLessons;
      case 'quests':
        return data.topQuests;
      default:
        return [];
    }
  };

  const entries = getEntries();
  const currentTab = TABS.find((t) => t.key === activeTab)!;

  return (
    <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
      {/* Golden Header */}
      <LinearGradient
        colors={['#2C1810', '#5C3D2E', '#8B6914']}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={24} color="#FFD700" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>🏆 Şöhret Duvarı</Text>
            <Text style={styles.headerSub}>{i18n.t('wall.community_best')}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Podium */}
        {entries.length >= 3 && (
          <View style={styles.podium}>
            {/* 2nd */}
            <PodiumItem entry={entries[1]} rank={2} delay={200} />
            {/* 1st */}
            <PodiumItem entry={entries[0]} rank={1} delay={100} isFirst />
            {/* 3rd */}
            <PodiumItem entry={entries[2]} rank={3} delay={300} />
          </View>
        )}
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && {
                backgroundColor: tab.color + '20',
                borderColor: tab.color,
              },
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && { color: tab.color }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FFD700" />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          {entries.map((entry, i) => (
            <Animated.View key={`${entry.userId}-${i}`} entering={FadeInDown.delay(i * 60)}>
              <View
                style={[
                  styles.rankRow,
                  { backgroundColor: theme.background.secondary },
                  i < 3 && { borderLeftColor: RANK_COLORS[i], borderLeftWidth: 3 },
                ]}
              >
                <View
                  style={[
                    styles.rankBadge,
                    { backgroundColor: i < 3 ? RANK_COLORS[i] + '30' : 'rgba(255,255,255,0.05)' },
                  ]}
                >
                  {i === 0 ? (
                    <Crown size={16} color="#FFD700" />
                  ) : i === 1 ? (
                    <Medal size={16} color="#C0C0C0" />
                  ) : i === 2 ? (
                    <Medal size={16} color="#CD7F32" />
                  ) : (
                    <Text style={styles.rankNum}>{i + 1}</Text>
                  )}
                </View>

                <View style={styles.rankAvatar}>
                  <Text style={styles.rankAvatarText}>
                    {entry.username.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.rankName, { color: theme.text.primary }]}>
                    {entry.username}
                  </Text>
                  <Text style={[styles.rankValue, { color: currentTab.color }]}>{entry.label}</Text>
                </View>

                <Text style={[styles.rankScore, { color: currentTab.color }]}>
                  {entry.value.toLocaleString()}
                </Text>
              </View>
            </Animated.View>
          ))}

          {entries.length === 0 && (
            <View style={styles.empty}>
              <Text style={{ fontSize: 48 }}>🏆</Text>
              <Text style={[styles.emptyText, { color: theme.text.secondary }]}>
                Henüz veri yok
              </Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

function PodiumItem({
  entry,
  rank,
  delay,
  isFirst,
}: {
  entry: FameEntry;
  rank: number;
  delay: number;
  isFirst?: boolean;
}) {
  const podiumH = isFirst ? 90 : rank === 2 ? 65 : 50;
  return (
    <Animated.View
      entering={FadeInUp.delay(delay)}
      style={[styles.podiumCol, { width: width / 3.5 }]}
    >
      <View style={[styles.podiumAvatar, isFirst && styles.podiumAvatarFirst]}>
        <Text style={styles.podiumAvatarText}>{entry.username.charAt(0).toUpperCase()}</Text>
        {isFirst && (
          <Animated.View entering={ZoomIn.delay(400)} style={styles.crownBadge}>
            <Crown size={14} color="#FFD700" />
          </Animated.View>
        )}
      </View>
      <Text style={styles.podiumName} numberOfLines={1}>
        {entry.username}
      </Text>
      <Text style={styles.podiumValue}>{entry.value.toLocaleString()}</Text>
      <View
        style={[
          styles.podiumBar,
          { height: podiumH, backgroundColor: RANK_COLORS[rank - 1] + '60' },
        ]}
      >
        <Text style={styles.podiumRank}>{rank}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,215,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFD700' },
  headerSub: { color: 'rgba(255,215,0,0.7)', fontSize: 12, marginTop: 2 },

  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginTop: 12,
    paddingBottom: 8,
  },
  podiumCol: { alignItems: 'center', gap: 4 },
  podiumAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,215,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  podiumAvatarFirst: { width: 56, height: 56, borderRadius: 28, borderWidth: 3 },
  podiumAvatarText: { fontSize: 18, fontWeight: '800', color: '#FFD700' },
  crownBadge: {
    position: 'absolute',
    top: -12,
    backgroundColor: '#2C1810',
    borderRadius: 10,
    padding: 2,
  },
  podiumName: { fontSize: 11, fontWeight: '700', color: '#FFF', maxWidth: 80 },
  podiumValue: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  podiumBar: {
    width: '80%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumRank: { fontSize: 20, fontWeight: '900', color: 'rgba(255,255,255,0.5)' },

  tabs: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, gap: 6 },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  tabText: { fontSize: 11, fontWeight: '700', color: '#888' },

  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
    gap: 10,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNum: { fontSize: 14, fontWeight: '800', color: '#888' },
  rankAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankAvatarText: { fontSize: 16, fontWeight: '800', color: '#AAA' },
  rankName: { fontSize: 15, fontWeight: '700' },
  rankValue: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  rankScore: { fontSize: 16, fontWeight: '800' },

  empty: { alignItems: 'center', paddingTop: 40, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: '600' },
});
