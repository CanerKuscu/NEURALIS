import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '../src/context/ThemeContext';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Trophy,
  Flame,
  Zap,
  Target,
  BookOpen,
  Share2,
  Lock,
  Star,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../src/config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AchievementService } from '../src/services/AchievementService';

// Mock Component for Cross-Platform Progress Bar
const ProgressBar = ({
  progress,
  color,
  style,
}: {
  progress: number;
  color: string;
  style?: any;
}) => {
  return (
    <View style={[styles.progressTrack, style]}>
      <View
        style={[
          styles.progressBar,
          { width: `${Math.min(100, progress * 100)}%`, backgroundColor: color },
        ]}
      />
    </View>
  );
};

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  current: number;
  target: number;
  xpReward: number;
  unlocked: boolean;
  color: string;
}

export default function AchievementsScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Definitions are static, progress is dynamic
  const DEFINITIONS: Omit<Achievement, 'current' | 'unlocked'>[] = [
    {
      id: 'wildfire',
      title: 'Wildfire',
      description: 'Maintain a 3-day streak',
      icon: <Flame size={24} color="#FF6B6B" />,
      target: 3,
      xpReward: 50,
      color: '#FF6B6B',
    },
    {
      id: 'sage',
      title: 'Sage',
      description: 'Earn 100 XP in a single day',
      icon: <Zap size={24} color="#F1C40F" />,
      target: 100,
      xpReward: 30,
      color: '#F1C40F',
    },
    {
      id: 'scholar',
      title: 'Scholar',
      description: 'Learn 50 new words',
      icon: <BookOpen size={24} color="#3498DB" />,
      target: 50,
      xpReward: 100,
      color: '#3498DB',
    },
    {
      id: 'sharpshooter',
      title: 'Sharpshooter',
      description: 'Complete a lesson with 100% accuracy',
      icon: <Target size={24} color="#E74C3C" />,
      target: 1,
      xpReward: 75,
      color: '#E74C3C',
    },
    {
      id: 'champion',
      title: 'Champion',
      description: 'Finish in the top 3 of your league',
      icon: <Trophy size={24} color="#9B59B6" />,
      target: 3,
      xpReward: 200,
      color: '#9B59B6',
    },
  ];

  const [achievements, setAchievements] = useState<Achievement[]>(
    DEFINITIONS.map((d) => ({ ...d, current: 0, unlocked: false })),
  );
  const [showcaseBadges, setShowcaseBadges] = useState<string[]>([]);

  useEffect(() => {
    loadAchievements();
    loadShowcase();
  }, []);

  const loadShowcase = async () => {
    try {
      const stored = await AsyncStorage.getItem('@neuralis_badge_showcase');
      if (stored) setShowcaseBadges(JSON.parse(stored));
    } catch (e) {}
  };

  const toggleShowcase = async (id: string) => {
    let updated: string[];
    if (showcaseBadges.includes(id)) {
      updated = showcaseBadges.filter((b) => b !== id);
    } else if (showcaseBadges.length < 3) {
      updated = [...showcaseBadges, id];
    } else {
      return; // Max 3
    }
    setShowcaseBadges(updated);
    await AsyncStorage.setItem('@neuralis_badge_showcase', JSON.stringify(updated));
  };

  const loadAchievements = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // Fetch real progress
        const userData = await AchievementService.getUserAchievements(user.id);

        // Merge
        setAchievements((prev) =>
          prev.map((def) => {
            const found = userData.find((u: any) => u.achievement_id === def.id);
            return {
              ...def,
              current: found ? found.progress : 0,
              unlocked: found ? !!found.unlocked_at : false,
            };
          }),
        );
      }
    } catch (e) {
      console.warn('Error loading achievements', e);
    }
  };

  const totalUnlocked = achievements.filter((a) => a.unlocked).length;

  return (
    <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Achievements</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Summary Card */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.summaryCard}>
          <LinearGradient
            colors={[theme.primary, adjustColor(theme.primary, -20)]}
            style={styles.summaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.summaryContent}>
              <Trophy size={48} color="#FFD700" fill="#FFA000" />
              <View style={styles.summaryText}>
                <Text style={styles.summaryTitle}>
                  {totalUnlocked} / {achievements.length} Unlocked
                </Text>
                <Text style={styles.summarySubtitle}>Keep learning to earn more!</Text>
              </View>
            </View>
            <ProgressBar
              progress={totalUnlocked / achievements.length}
              color="#FFD700"
              style={styles.summaryProgress}
            />
          </LinearGradient>
        </Animated.View>

        {/* Badge Showcase Section */}
        <Animated.View entering={FadeInDown.delay(150)}>
          <View
            style={[
              styles.showcaseSection,
              { backgroundColor: theme.background.secondary, borderColor: theme.border.light },
            ]}
          >
            <View style={styles.showcaseHeader}>
              <Star size={18} color="#F1C40F" />
              <Text style={[styles.showcaseTitle, { color: theme.text.primary }]}>
                Vitrin Rozetleri
              </Text>
              <Text style={[styles.showcaseCount, { color: theme.text.tertiary }]}>
                {showcaseBadges.length}/3
              </Text>
            </View>
            <Text style={[styles.showcaseDesc, { color: theme.text.secondary }]}>
              Profilinde gösterilecek en iyi 3 rozetini seç
            </Text>
            <View style={styles.showcaseSlots}>
              {[0, 1, 2].map((i) => {
                const badgeId = showcaseBadges[i];
                const badge = achievements.find((a) => a.id === badgeId);
                return (
                  <View
                    key={i}
                    style={[
                      styles.showcaseSlot,
                      {
                        backgroundColor: badge ? `${badge.color}20` : theme.background.tertiary,
                        borderColor: badge ? badge.color : theme.border.light,
                      },
                    ]}
                  >
                    {badge ? (
                      <>
                        {badge.icon}
                        <Text style={[styles.showcaseSlotText, { color: badge.color }]}>
                          {badge.title}
                        </Text>
                      </>
                    ) : (
                      <Text style={[styles.showcaseSlotEmpty, { color: theme.text.muted }]}>
                        Boş
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </Animated.View>

        {/* Achievements List */}
        <View style={styles.listContainer}>
          {achievements.map((item, index) => (
            <Animated.View
              key={item.id}
              entering={FadeInDown.delay(200 + index * 100)}
              style={[
                styles.card,
                {
                  backgroundColor: theme.background.secondary,
                  borderColor: item.unlocked ? item.color : theme.border.light,
                  borderWidth: item.unlocked ? 1.5 : 1,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: item.unlocked
                        ? adjustColor(item.color, 150)
                        : theme.background.tertiary,
                    },
                  ]}
                >
                  {item.unlocked ? item.icon : <Lock size={24} color={theme.text.tertiary} />}
                </View>
                <View style={styles.cardContent}>
                  <Text
                    style={[
                      styles.cardTitle,
                      { color: theme.text.primary, opacity: item.unlocked ? 1 : 0.6 },
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text style={[styles.cardDesc, { color: theme.text.secondary }]}>
                    {item.description}
                  </Text>
                </View>
                {item.unlocked && (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={() => toggleShowcase(item.id)}>
                      <View
                        style={[
                          styles.showcaseToggle,
                          {
                            backgroundColor: showcaseBadges.includes(item.id)
                              ? item.color
                              : theme.background.tertiary,
                          },
                        ]}
                      >
                        <Star
                          size={14}
                          color={showcaseBadges.includes(item.id) ? '#FFF' : theme.text.tertiary}
                        />
                      </View>
                    </TouchableOpacity>
                    <View style={[styles.xpBadge, { backgroundColor: theme.background.tertiary }]}>
                      <Text style={[styles.xpText, { color: theme.primary }]}>
                        +{item.xpReward} XP
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Progress Section */}
              <View style={styles.progressContainer}>
                <View style={styles.progressLabelRow}>
                  <Text
                    style={[
                      styles.progressLabel,
                      { color: item.unlocked ? item.color : theme.text.secondary },
                    ]}
                  >
                    {item.unlocked ? 'COMPLETED' : `${item.current} / ${item.target}`}
                  </Text>
                  {!item.unlocked && (
                    <Text style={[styles.progressPercent, { color: theme.text.tertiary }]}>
                      {Math.floor((item.current / item.target) * 100)}%
                    </Text>
                  )}
                </View>
                <ProgressBar
                  progress={Math.min(1, item.current / item.target)}
                  color={item.unlocked ? item.color : theme.text.tertiary}
                  style={styles.cardProgress}
                />
              </View>
            </Animated.View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// Helper for color adjustment (same as profile.tsx)
// Helper for color adjustment
function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backBtn: { padding: 4 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 20,
  },
  summaryCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    elevation: 8,
    shadowColor: '#FEA000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  summaryGradient: {
    padding: 24,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  summaryText: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  summaryProgress: {
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },

  // List
  listContainer: {
    gap: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 13,
  },
  xpBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  xpText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressContainer: {
    gap: 8,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Progress Bar Helper
  progressTrack: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  cardProgress: {
    height: 8,
  },

  // Showcase styles
  showcaseSection: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  showcaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  showcaseTitle: { fontSize: 17, fontWeight: '800', flex: 1 },
  showcaseCount: { fontSize: 13, fontWeight: '600' },
  showcaseDesc: { fontSize: 13, marginBottom: 16 },
  showcaseSlots: {
    flexDirection: 'row',
    gap: 12,
  },
  showcaseSlot: {
    flex: 1,
    height: 80,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  showcaseSlotText: { fontSize: 10, fontWeight: '700' },
  showcaseSlotEmpty: { fontSize: 12, fontWeight: '600' },
  showcaseToggle: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
