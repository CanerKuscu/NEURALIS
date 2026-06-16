/**
 * Profile Screen - Duolingo Style Design
 */
import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import {
  Settings,
  Edit2,
  Flame,
  Zap,
  Trophy,
  UserPlus,
  Share2,
  Users,
  BookOpen,
  X,
  Target,
  Camera,
  Star,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../src/config/supabase';
import { useTheme } from '../../src/context/ThemeContext';
import AvatarV2View from '../../src/components/avatar/AvatarV2View';
import type { AvatarV2Config } from '../../src/types/avatar-v2';
import { DEFAULT_AVATAR_V2 } from '../../src/types/avatar-v2';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown, FadeInRight, FadeIn, ZoomIn } from 'react-native-reanimated';
import i18n from '../../src/i18n';

const { width } = Dimensions.get('window');
const BANNER_HEIGHT = 220;
const AVATAR_SIZE = 140;

// Extracted outside to avoid re-creation on every render
const FriendSuggestionCard = React.memo(
  ({
    item,
    index,
    theme,
  }: {
    item: FriendSuggestion;
    index: number;
    theme: ReturnType<typeof useTheme>['theme'];
  }) => (
    <Animated.View
      entering={FadeInRight.delay(index * 100)}
      style={[
        styles.suggestionCard,
        { backgroundColor: theme.background.secondary, borderColor: theme.border.light },
      ]}
    >
      <TouchableOpacity style={styles.dismissBtn}>
        <X size={16} color={theme.text.tertiary} />
      </TouchableOpacity>
      <View style={styles.suggestionAvatar}>
        <AvatarV2View config={DEFAULT_AVATAR_V2} size={60} />
      </View>
      <Text style={[styles.suggestionName, { color: theme.text.primary }]} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={[styles.suggestionInfo, { color: theme.text.secondary }]}>
        {item.followsYou
          ? i18n.t('profile.follows_you')
          : i18n.t('profile.mutual_friends', { count: item.mutualFriends })}
      </Text>
      <TouchableOpacity style={[styles.followBtn, { backgroundColor: theme.primary }]}>
        <Text style={styles.followBtnText}>{i18n.t('profile.follow')}</Text>
      </TouchableOpacity>
    </Animated.View>
  ),
);

/** Profile data as returned from the Supabase profiles table */
interface ProfileData {
  id: string;
  email?: string;
  display_name?: string;
  username?: string;
  avatar_config?: AvatarV2Config;
  total_xp?: number;
  current_streak?: number;
  longest_streak?: number;
  neural_score?: number;
  current_league?: string;
  merit_points?: number;
  created_at?: string;
  [key: string]: unknown; // Allow additional DB columns
}

/** A friend suggestion shown in the profile UI */
interface FriendSuggestion {
  id: string;
  name: string;
  avatar?: AvatarV2Config;
  followsYou?: boolean;
  mutualFriends?: number;
}

/** A course/category the user is studying */
interface CourseEntry {
  id: string;
  name: string;
  flag: string;
  level: number;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme, isDark } = useTheme();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarConfig, setAvatarConfig] = useState<AvatarV2Config>(DEFAULT_AVATAR_V2);
  const [friendSuggestions, setFriendSuggestions] = useState<FriendSuggestion[]>([]);
  const [courses, setCourses] = useState<CourseEntry[]>([]);
  const [showcaseBadges, setShowcaseBadges] = useState<
    { id: string; icon: string; title: string; color: string }[]
  >([]);

  const loadProfile = async () => {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      setProfile({
        ...data,
        email: session.user.email || data?.email,
        id: session.user.id,
      });

      // Load real friends from database
      const { data: friends } = await supabase
        .from('friendships')
        .select(
          'friend_id, profiles!friendships_friend_id_fkey(id, display_name, username, avatar_config)',
        )
        .eq('user_id', session.user.id)
        .eq('status', 'accepted')
        .limit(5);

      if (friends && friends.length > 0) {
        setFriendSuggestions(
          friends.map((f: any) => ({
            id: f.friend_id,
            name: f.profiles?.display_name || f.profiles?.username || 'User',
            avatar: f.profiles?.avatar_config,
          })),
        );
      } else {
        setFriendSuggestions([]);
      }

      // Load courses
      const { data: userCourses } = await supabase
        .from('user_category_levels')
        .select('category, level')
        .eq('user_id', session.user.id);

      if (userCourses && userCourses.length > 0) {
        setCourses(
          userCourses.map((c: any, i: number) => ({
            id: String(i),
            name: c.category,
            flag: getCategoryEmoji(c.category),
            level: c.level,
          })),
        );
      } else {
        setCourses([]);
      }
    }
    setLoading(false);
  };

  const getCategoryEmoji = (category: string): string => {
    const emojiMap: Record<string, string> = {
      Mathematics: '🔢',
      Science: '🔬',
      History: '📜',
      Geography: '🌍',
      Language: '📝',
      Art: '🎨',
      Music: '🎵',
      Programming: '💻',
      Physics: '⚛️',
      Chemistry: '🧪',
      Biology: '🧬',
    };
    return emojiMap[category] || '📚';
  };

  const loadAvatarConfig = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('avatar_config')
          .eq('id', session.user.id)
          .maybeSingle();

        if (data?.avatar_config) {
          setAvatarConfig(data.avatar_config);
          return;
        }
      }
      const stored = await AsyncStorage.getItem('avatar_config');
      if (stored) {
        setAvatarConfig(JSON.parse(stored));
      }
    } catch (e) {
      console.log('Error loading avatar config', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
      loadAvatarConfig();
      loadShowcaseBadges();
    }, []),
  );

  const loadShowcaseBadges = async () => {
    try {
      const stored = await AsyncStorage.getItem('@neuralis_badge_showcase');
      if (stored) {
        const ids: string[] = JSON.parse(stored);
        const badgeMap: Record<string, { icon: string; title: string; color: string }> = {
          wildfire: { icon: '🔥', title: 'Wildfire', color: '#FF6B6B' },
          sage: { icon: '⚡', title: 'Sage', color: '#F1C40F' },
          scholar: { icon: '📚', title: 'Scholar', color: '#3498DB' },
          sharpshooter: { icon: '🎯', title: 'Sharpshooter', color: '#E74C3C' },
          champion: { icon: '🏆', title: 'Champion', color: '#9B59B6' },
        };
        setShowcaseBadges(
          ids.map((id) => ({ id, ...(badgeMap[id] || { icon: '🏅', title: id, color: '#888' }) })),
        );
      }
    } catch (e) {}
  };

  // Get display name
  const displayName =
    profile?.first_name || profile?.last_name
      ? `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()
      : profile?.display_name || profile?.email?.split('@')[0] || i18n.t('profile.default_name');

  const username = profile?.username || profile?.email?.split('@')[0] || 'user';

  const joinDate = new Date(profile?.created_at || Date.now()).toLocaleDateString(i18n.locale, {
    month: 'long',
    year: 'numeric',
  });

  // Stats data
  const stats = [
    {
      label: 'Courses',
      value: courses.length,
      extra: courses.length > 2 ? `+${courses.length - 2}` : null,
    },
    { label: 'Following', value: profile?.following_count || 0 },
    { label: 'Followers', value: profile?.followers_count || 0 },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadProfile} tintColor={theme.primary} />
        }
      >
        {/* Large Banner with Avatar - Duolingo Style */}
        <View style={styles.bannerSection}>
          <LinearGradient
            colors={[
              avatarConfig.bgColor || '#9B59B6',
              adjustColor(avatarConfig.bgColor || '#9B59B6', -30),
            ]}
            style={[styles.banner, { paddingTop: insets.top }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Decorative circles */}
            <View style={styles.decorCircle1} />
            <View style={styles.decorCircle2} />

            {/* Settings Button */}
            <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsBtn}>
              <Settings size={24} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>

            {/* Avatar Character - Standing in Banner */}
            <View style={styles.bannerAvatarContainer}>
              <Animated.View entering={FadeIn.delay(200).springify()}>
                <TouchableOpacity
                  onPress={() => router.push('/avatar-editor-v2')}
                  activeOpacity={0.9}
                >
                  <AvatarV2View config={avatarConfig} size={220} showBg={false} />

                  {/* Edit Badge - Floating near avatar */}
                  <View
                    style={[
                      styles.editBadge,
                      { backgroundColor: theme.primary, borderColor: theme.background.primary },
                    ]}
                  >
                    <Camera size={14} color="#FFF" />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </LinearGradient>
        </View>

        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <Text style={[styles.name, { color: theme.text.primary }]}>{displayName}</Text>
          <Text style={[styles.usernameRow, { color: theme.text.secondary }]}>
            @{username} • {i18n.t('profile.joined')} {joinDate}
          </Text>
        </View>

        {/* Courses + Stats Row - Duolingo Style */}
        <View style={styles.statsRow}>
          {/* Courses with flags */}
          <View style={styles.statItem}>
            <View style={styles.courseFlags}>
              {courses.slice(0, 2).map((course, i) => (
                <Text key={course.id} style={styles.courseFlag}>
                  {course.flag}
                </Text>
              ))}
              {courses.length > 2 && (
                <View style={[styles.extraBadge, { backgroundColor: theme.background.tertiary }]}>
                  <Text style={[styles.extraText, { color: theme.text.secondary }]}>
                    +{courses.length - 2}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.statLabel, { color: theme.text.secondary }]}>
              {i18n.t('profile.courses')}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text.primary }]}>
              {String(profile?.following_count ?? 0)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.text.secondary }]}>
              {i18n.t('profile.following')}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text.primary }]}>
              {String(profile?.followers_count ?? 0)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.text.secondary }]}>
              {i18n.t('profile.followers')}
            </Text>
          </View>
        </View>

        {/* Action Buttons - Duolingo Style */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.addFriendsBtn, { borderColor: theme.primary }]}
            onPress={() => router.push('/(tabs)/social')}
          >
            <UserPlus size={18} color={theme.primary} />
            <Text style={[styles.addFriendsText, { color: theme.primary }]}>
              {i18n.t('profile.add_friends')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.shareBtn, { borderColor: theme.border.light }]}>
            <Share2 size={18} color={theme.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Friend Suggestions - Only show if there are real friends */}
        {friendSuggestions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
                {i18n.t('profile.friends')}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/social')}>
                <Text style={[styles.viewAll, { color: theme.primary }]}>
                  {i18n.t('profile.view_all')}
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsScroll}
            >
              {friendSuggestions.map((item, index) => (
                <FriendSuggestionCard key={item.id} item={item} index={index} theme={theme} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Overview Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
            {i18n.t('profile.statistics')}
          </Text>
          <View style={styles.overviewGrid}>
            <Animated.View
              entering={FadeInDown.delay(100)}
              style={[styles.overviewItem, { backgroundColor: theme.background.secondary }]}
            >
              <View style={[styles.overviewIcon, { backgroundColor: '#FFF3E0' }]}>
                <Flame size={28} color="#FF6B6B" />
              </View>
              <View style={styles.overviewTextContainer}>
                <Text style={[styles.overviewValue, { color: theme.text.primary }]}>
                  {profile?.current_streak || 0}
                </Text>
                <Text style={[styles.overviewLabel, { color: theme.text.secondary }]}>
                  {i18n.t('profile.day_streak')}
                </Text>
              </View>
            </Animated.View>
            <Animated.View
              entering={FadeInDown.delay(200)}
              style={[styles.overviewItem, { backgroundColor: theme.background.secondary }]}
            >
              <View style={[styles.overviewIcon, { backgroundColor: '#FFF8E1' }]}>
                <Zap size={28} color="#F1C40F" />
              </View>
              <View style={styles.overviewTextContainer}>
                <Text style={[styles.overviewValue, { color: theme.text.primary }]}>
                  {profile?.total_xp || 0}
                </Text>
                <Text style={[styles.overviewLabel, { color: theme.text.secondary }]}>
                  {i18n.t('profile.total_xp')}
                </Text>
              </View>
            </Animated.View>
            <Animated.View
              entering={FadeInDown.delay(300)}
              style={[styles.overviewItem, { backgroundColor: theme.background.secondary }]}
            >
              <View style={[styles.overviewIcon, { backgroundColor: '#F3E5F5' }]}>
                <Trophy size={28} color="#9B59B6" />
              </View>
              <View style={styles.overviewTextContainer}>
                <Text style={[styles.overviewValue, { color: theme.text.primary }]}>
                  {String(profile?.league_tier ?? 'Bronze')}
                </Text>
                <Text style={[styles.overviewLabel, { color: theme.text.secondary }]}>
                  {i18n.t('profile.league')}
                </Text>
              </View>
            </Animated.View>
            <Animated.View
              entering={FadeInDown.delay(400)}
              style={[styles.overviewItem, { backgroundColor: theme.background.secondary }]}
            >
              <View style={[styles.overviewIcon, { backgroundColor: '#E3F2FD' }]}>
                <Target size={28} color="#3498DB" />
              </View>
              <View style={styles.overviewTextContainer}>
                <Text style={[styles.overviewValue, { color: theme.text.primary }]}>
                  {String(profile?.lessons_completed ?? 0)}
                </Text>
                <Text style={[styles.overviewLabel, { color: theme.text.secondary }]}>
                  {i18n.t('profile.lessons')}
                </Text>
              </View>
            </Animated.View>
          </View>
        </View>

        {/* Badge Showcase */}
        {showcaseBadges.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
                <Star size={16} color="#F1C40F" /> {i18n.t('profile.showcase')}
              </Text>
            </View>
            <View style={styles.showcaseRow}>
              {showcaseBadges.map((badge, idx) => (
                <Animated.View
                  key={badge.id}
                  entering={ZoomIn.delay(idx * 150)}
                  style={[
                    styles.showcaseBadge,
                    { backgroundColor: `${badge.color}20`, borderColor: badge.color },
                  ]}
                >
                  <Text style={{ fontSize: 28 }}>{badge.icon}</Text>
                  <Text style={[styles.showcaseBadgeText, { color: badge.color }]}>
                    {badge.title}
                  </Text>
                </Animated.View>
              ))}
            </View>
          </View>
        )}

        {/* Achievements Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
              {i18n.t('profile.achievements')}
            </Text>
            <TouchableOpacity onPress={() => router.push('/achievements')}>
              <Text style={[styles.viewAll, { color: theme.primary }]}>
                {i18n.t('profile.view_all')}
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.achievementsScroll}
          >
            {[
              { icon: '🔥', title: i18n.t('profile.week_streak'), unlocked: true },
              { icon: '⚡', title: i18n.t('profile.hundred_xp'), unlocked: true },
              { icon: '🏆', title: i18n.t('profile.top_10'), unlocked: false },
              { icon: '📚', title: i18n.t('profile.ten_lessons'), unlocked: false },
            ].map((achievement, index) => (
              <View
                key={index}
                style={[
                  styles.achievementItem,
                  { backgroundColor: theme.background.secondary },
                  !achievement.unlocked && styles.achievementLocked,
                ]}
              >
                <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                <Text style={[styles.achievementTitle, { color: theme.text.secondary }]}>
                  {achievement.title}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Friends Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
              {i18n.t('profile.friends')}
            </Text>
            <TouchableOpacity>
              <Text style={[styles.viewAll, { color: theme.primary }]}>
                {i18n.t('profile.view_all')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.emptyCard, { backgroundColor: theme.background.secondary }]}>
            <Text style={[styles.emptyText, { color: theme.text.secondary }]}>
              {i18n.t('profile.friends_empty')}
            </Text>
            <TouchableOpacity style={[styles.findFriendsBtn, { backgroundColor: theme.primary }]}>
              <Text style={styles.findFriendsText}>{i18n.t('profile.find_friends')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// Helper function to adjust color brightness
function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Banner Section - Duolingo Style
  bannerSection: {
    position: 'relative',
    marginBottom: 20,
  },
  banner: {
    height: 280, // Increased height for character
    width: '100%',
    overflow: 'hidden',
    alignItems: 'center', // Center content horizontally
  },
  decorCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  settingsBtn: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  bannerAvatarContainer: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  editBadge: {
    position: 'absolute',
    bottom: 10,
    right: 50,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },

  // Profile Info
  profileInfo: {
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  usernameRow: {
    fontSize: 15,
    fontWeight: '500',
  },

  // Stats Row - Duolingo Style
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  courseFlags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  courseFlag: {
    fontSize: 24,
  },
  extraBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  extraText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 12,
  },
  addFriendsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
  },
  addFriendsText: {
    fontWeight: '700',
    fontSize: 14,
  },
  shareBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sections
  section: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Friend Suggestions - Duolingo Style
  suggestionsScroll: {
    paddingRight: 20,
    gap: 12,
  },
  suggestionCard: {
    width: 140,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  dismissBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  suggestionAvatar: {
    marginBottom: 8,
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
    textAlign: 'center',
  },
  suggestionInfo: {
    fontSize: 12,
    marginBottom: 12,
  },
  followBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  followBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 12,
  },

  // Overview Grid
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  overviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    width: (width - 52) / 2,
  },
  overviewIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewTextContainer: {
    flex: 1,
  },
  overviewValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  overviewLabel: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Achievements
  achievementsScroll: {
    gap: 12,
    paddingRight: 20,
  },
  achievementItem: {
    width: 80,
    height: 90,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  achievementLocked: {
    opacity: 0.4,
  },
  achievementIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  achievementTitle: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Badge Showcase
  showcaseRow: {
    flexDirection: 'row',
    gap: 12,
  },
  showcaseBadge: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 6,
  },
  showcaseBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Empty State
  emptyCard: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  findFriendsBtn: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  findFriendsText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
