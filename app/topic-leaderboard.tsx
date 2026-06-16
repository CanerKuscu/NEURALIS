/**
 * NEURALIS - Topic Leaderboard Screen
 * Kategori bazlı haftalık sıralama — her konuda en iyi ol!
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Medal, Crown, TrendingUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import { supabase } from '../src/config/supabase';
import * as Haptics from 'expo-haptics';
import i18n from '../src/i18n';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'all', label: i18n.t('leaderboard.all'), emoji: '🏆', color: '#FFD700' },
  { id: 'mathematics', label: 'Matematik', emoji: '🔢', color: '#3498DB' },
  { id: 'science', label: 'Bilim', emoji: '🔬', color: '#2ECC71' },
  { id: 'coding', label: 'Kodlama', emoji: '💻', color: '#9B59B6' },
  { id: 'history', label: 'Tarih', emoji: '📜', color: '#E67E22' },
  { id: 'language', label: 'Dil', emoji: '🌍', color: '#1ABC9C' },
  { id: 'geography', label: 'Coğrafya', emoji: '🗺️', color: '#E74C3C' },
];

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  xp: number;
  lessonsCompleted: number;
  isCurrentUser: boolean;
}

export default function TopicLeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme } = useTheme();

  const [selectedCat, setSelectedCat] = useState('all');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [myRank, setMyRank] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [selectedCat]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uid = session?.user?.id || '';
      setUserId(uid);

      let data: any[] = [];
      if (selectedCat === 'all') {
        const { data: d } = await supabase
          .from('profiles')
          .select('id, display_name, total_xp, lessons_completed')
          .order('total_xp', { ascending: false })
          .limit(100);
        data = d || [];
      } else {
        const { data: d } = await supabase
          .from('user_category_levels')
          .select('user_id, total_xp_in_category, lessons_completed, profiles!inner(display_name)')
          .eq('category', selectedCat)
          .order('total_xp_in_category', { ascending: false })
          .limit(100);
        data = (d || []).map((e: any) => ({
          id: e.user_id,
          display_name: e.profiles?.display_name || 'Anon',
          total_xp: e.total_xp_in_category,
          lessons_completed: e.lessons_completed,
        }));
      }

      const mapped = data.map((e: any, i: number) => ({
        rank: i + 1,
        userId: e.id || e.user_id,
        displayName: e.display_name || 'Anon',
        xp: e.total_xp || 0,
        lessonsCompleted: e.lessons_completed || 0,
        isCurrentUser: (e.id || e.user_id) === uid,
      }));

      setEntries(mapped);
      setMyRank(mapped.find((e) => e.isCurrentUser) || null);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown size={22} color="#FFD700" fill="#FFD700" />;
    if (rank === 2) return <Medal size={22} color="#C0C0C0" />;
    if (rank === 3) return <Medal size={22} color="#CD7F32" />;
    return <Text style={[styles.rankText, { color: theme.text.secondary }]}>{rank}</Text>;
  };

  const catColor = CATEGORIES.find((c) => c.id === selectedCat)?.color || '#FFD700';

  return (
    <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
      {/* Header */}
      <LinearGradient
        colors={[catColor, catColor + 'CC']}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🏆 Konu Sıralaması</Text>
          <View style={{ width: 40 }} />
        </View>
        {myRank && (
          <Animated.View entering={FadeIn.delay(200)} style={styles.myRankCard}>
            <Text style={styles.myRankLabel}>Senin Sıran</Text>
            <Text style={styles.myRankValue}>#{myRank.rank}</Text>
            <Text style={styles.myRankXP}>{myRank.xp.toLocaleString()} XP</Text>
          </Animated.View>
        )}
      </LinearGradient>

      {/* Category Tabs */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={CATEGORIES}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
        style={{ maxHeight: 56 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              setSelectedCat(item.id);
              Haptics.selectionAsync();
            }}
            style={[
              styles.catTab,
              selectedCat === item.id && {
                backgroundColor: item.color + '25',
                borderColor: item.color,
              },
            ]}
          >
            <Text style={[styles.catTabText, selectedCat === item.id && { color: item.color }]}>
              {item.emoji} {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Leaderboard */}
      {loading ? (
        <ActivityIndicator size="large" color={catColor} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(e) => e.userId}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(Math.min(index, 10) * 40)}>
              <View
                style={[
                  styles.entryRow,
                  { backgroundColor: theme.background.secondary },
                  item.isCurrentUser && { borderColor: catColor, borderWidth: 1.5 },
                  index < 3 && styles.topThree,
                ]}
              >
                <View style={styles.rankContainer}>{getRankIcon(item.rank)}</View>
                <View style={styles.entryInfo}>
                  <Text style={[styles.entryName, { color: theme.text.primary }]} numberOfLines={1}>
                    {item.displayName} {item.isCurrentUser ? '(Sen)' : ''}
                  </Text>
                  <Text style={[styles.entrySub, { color: theme.text.secondary }]}>
                    {item.lessonsCompleted} {i18n.t('leaderboard.lesson_label')}
                  </Text>
                </View>
                <View style={styles.entryXP}>
                  <TrendingUp size={14} color={catColor} />
                  <Text style={[styles.entryXPText, { color: catColor }]}>
                    {item.xp.toLocaleString()}
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: theme.text.secondary }]}>
              Henüz sıralama verisi yok
            </Text>
          }
        />
      )}
    </View>
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
  myRankCard: {
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 12,
  },
  myRankLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
  myRankValue: { color: '#FFF', fontSize: 28, fontWeight: '900' },
  myRankXP: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },

  catTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  catTabText: { fontSize: 13, fontWeight: '600', color: '#888' },

  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  topThree: { borderWidth: 0 },
  rankContainer: { width: 36, alignItems: 'center' },
  rankText: { fontSize: 16, fontWeight: '800' },
  entryInfo: { flex: 1, marginLeft: 12 },
  entryName: { fontSize: 15, fontWeight: '700' },
  entrySub: { fontSize: 11, marginTop: 2 },
  entryXP: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  entryXPText: { fontSize: 15, fontWeight: '800' },

  emptyText: { textAlign: 'center', marginTop: 60, fontSize: 15 },
});
