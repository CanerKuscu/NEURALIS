/**
 * NEURALIS - Community Course Marketplace Screen
 * Topluluk tarafından oluşturulan kurs ve serileri keşfet, derecelendir, favorile!
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, Star, Heart, Download, BookOpen } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import { supabase } from '../src/config/supabase';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface MarketplaceCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  creatorId: string;
  creatorName: string;
  lessonCount: number;
  rating: number;
  ratingCount: number;
  downloads: number;
  isFavorited: boolean;
  createdAt: string;
}

type SortOption = 'popular' | 'recent' | 'top-rated';

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

export default function CommunityMarketplaceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme } = useTheme();

  const [courses, setCourses] = useState<MarketplaceCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    loadCourses();
  }, [sortBy]);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUserId(session?.user?.id || '');

      let query = supabase
        .from('lesson_series')
        .select('*, profiles!inner(display_name)')
        .eq('is_public', true);

      if (sortBy === 'popular') query = query.order('downloads', { ascending: false });
      else if (sortBy === 'recent') query = query.order('created_at', { ascending: false });
      else if (sortBy === 'top-rated') query = query.order('rating', { ascending: false });

      const { data } = await query.limit(50);

      // Get user favorites
      const { data: favs } = await supabase
        .from('series_favorites')
        .select('series_id')
        .eq('user_id', session?.user?.id || '');
      const favSet = new Set((favs || []).map((f: any) => f.series_id));

      setCourses(
        (data || []).map((c: any) => ({
          id: c.id,
          title: c.title,
          description: c.description || '',
          category: c.category || 'general',
          creatorId: c.creator_id,
          creatorName: c.profiles?.display_name || 'Anon',
          lessonCount: c.lesson_count || 0,
          rating: c.rating || 0,
          ratingCount: c.rating_count || 0,
          downloads: c.downloads || 0,
          isFavorited: favSet.has(c.id),
          createdAt: c.created_at,
        })),
      );
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async (courseId: string, isFav: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCourses((prev) => prev.map((c) => (c.id === courseId ? { ...c, isFavorited: !isFav } : c)));
    if (isFav) {
      await supabase
        .from('series_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('series_id', courseId);
    } else {
      await supabase.from('series_favorites').insert({ user_id: userId, series_id: courseId });
    }
  };

  const handleOpen = (courseId: string) => {
    router.push(`/series/${courseId}`);
  };

  const filtered = searchQuery
    ? courses.filter(
        (c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.category.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : courses;

  return (
    <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
      {/* Header */}
      <LinearGradient
        colors={['#E67E22', '#D35400']}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>📦 Kurs Marketi</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerSub}>Topluluk tarafından oluşturulan kursları keşfet</Text>
      </LinearGradient>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, { backgroundColor: theme.background.secondary }]}>
          <Search size={18} color={theme.text.secondary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Kurs ara..."
            placeholderTextColor="#666"
            style={[styles.searchInput, { color: theme.text.primary }]}
          />
        </View>
      </View>

      {/* Sort Tabs */}
      <View style={styles.sortRow}>
        {(
          [
            { id: 'popular' as SortOption, label: '🔥 Popüler' },
            { id: 'recent' as SortOption, label: '🆕 Yeni' },
            { id: 'top-rated' as SortOption, label: '⭐ En İyi' },
          ] as const
        ).map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.sortTab, sortBy === s.id && styles.sortTabActive]}
            onPress={() => {
              setSortBy(s.id);
              Haptics.selectionAsync();
            }}
          >
            <Text style={[styles.sortTabText, sortBy === s.id && styles.sortTabTextActive]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Courses */}
      {loading ? (
        <ActivityIndicator size="large" color="#E67E22" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 12 }}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 60)}>
              <TouchableOpacity
                style={[styles.courseCard, { backgroundColor: theme.background.secondary }]}
                onPress={() => handleOpen(item.id)}
              >
                <View style={styles.courseHeader}>
                  <Text style={styles.courseEmoji}>{CATEGORY_EMOJI[item.category] || '📚'}</Text>
                  <View style={styles.courseInfo}>
                    <Text
                      style={[styles.courseTitle, { color: theme.text.primary }]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text style={[styles.courseCreator, { color: theme.text.secondary }]}>
                      by {item.creatorName}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleFavorite(item.id, item.isFavorited)}
                    style={styles.favBtn}
                  >
                    <Heart
                      size={22}
                      color={item.isFavorited ? '#FF4B4B' : theme.text.secondary}
                      fill={item.isFavorited ? '#FF4B4B' : 'transparent'}
                    />
                  </TouchableOpacity>
                </View>

                {item.description ? (
                  <Text
                    style={[styles.courseDesc, { color: theme.text.secondary }]}
                    numberOfLines={2}
                  >
                    {item.description}
                  </Text>
                ) : null}

                <View style={styles.courseStats}>
                  <View style={styles.statBadge}>
                    <Star size={13} color="#FFD700" fill="#FFD700" />
                    <Text style={styles.statText}>
                      {item.rating.toFixed(1)} ({item.ratingCount})
                    </Text>
                  </View>
                  <View style={styles.statBadge}>
                    <BookOpen size={13} color="#3498DB" />
                    <Text style={styles.statText}>{item.lessonCount} ders</Text>
                  </View>
                  <View style={styles.statBadge}>
                    <Download size={13} color="#2ECC71" />
                    <Text style={styles.statText}>{item.downloads}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: theme.text.secondary }]}>Kurs bulunamadı</Text>
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
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'center', marginTop: 8 },

  searchContainer: { paddingHorizontal: 16, paddingTop: 12 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    gap: 8,
  },
  searchInput: { flex: 1, height: 44, fontSize: 15 },

  sortRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  sortTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  sortTabActive: { backgroundColor: 'rgba(230,126,34,0.15)', borderColor: '#E67E22' },
  sortTabText: { fontSize: 13, fontWeight: '600', color: '#888' },
  sortTabTextActive: { color: '#E67E22' },

  courseCard: { borderRadius: 16, padding: 16 },
  courseHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  courseEmoji: { fontSize: 28 },
  courseInfo: { flex: 1 },
  courseTitle: { fontSize: 16, fontWeight: '700' },
  courseCreator: { fontSize: 12, marginTop: 2 },
  favBtn: { padding: 4 },
  courseDesc: { fontSize: 13, lineHeight: 18, marginTop: 8 },
  courseStats: { flexDirection: 'row', gap: 12, marginTop: 10 },
  statBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, color: '#888', fontWeight: '600' },
  emptyText: { textAlign: 'center', marginTop: 60, fontSize: 15 },
});
