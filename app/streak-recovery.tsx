/**
 * NEURALIS - Streak Recovery Challenge Screen
 * 24 saat içinde 3 ders + 1 mükemmel skor ile streak'ini kurtar!
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Flame,
  Clock,
  Target,
  CheckCircle,
  Circle,
  AlertTriangle,
  Star,
  Zap,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import { ShadowFox } from '../src/components';
import { supabase } from '../src/config/supabase';
import type { StreakRecoveryChallenge } from '../src/services/StreakRecoveryService';
import { streakRecoveryService } from '../src/services/StreakRecoveryService';
import * as Haptics from 'expo-haptics';
import i18n from '../src/i18n';

const { width } = Dimensions.get('window');

export default function StreakRecoveryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme } = useTheme();
  const params = useLocalSearchParams<{ streak?: string }>();

  const [challenge, setChallenge] = useState<StreakRecoveryChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0 });

  const pulseScale = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(withTiming(1.1, { duration: 800 }), withTiming(1, { duration: 800 })),
      -1,
      true,
    );
    loadChallenge();
  }, []);

  useEffect(() => {
    if (!challenge || challenge.status !== 'active') return;
    const iv = setInterval(async () => {
      const t = await streakRecoveryService.getTimeRemaining(challenge);
      setTimeRemaining(t);
      if (t.hours === 0 && t.minutes === 0) clearInterval(iv);
    }, 60000);
    return () => clearInterval(iv);
  }, [challenge]);

  const loadChallenge = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;
      let c = await streakRecoveryService.checkRecoveryAvailable(session.user.id);
      if (!c && params.streak) {
        c = await streakRecoveryService.initiateRecovery(
          session.user.id,
          parseInt(params.streak) || 0,
        );
      }
      if (c) {
        setChallenge(c);
        const t = await streakRecoveryService.getTimeRemaining(c);
        setTimeRemaining(t);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartLesson = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/lesson?category=mathematics&recovery=true');
  };

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseScale.value }] }));

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
        <ActivityIndicator size="large" color="#FF4B4B" style={{ marginTop: 200 }} />
      </View>
    );
  }

  if (!challenge) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.background.primary,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        <Text style={{ color: theme.text.secondary, fontSize: 16 }}>
          Aktif kurtarma mücadelesi yok
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={{ color: '#FF6B00', fontSize: 14, fontWeight: '600' }}>
            {i18n.t('streak.go_back')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isCompleted = challenge.status === 'completed';

  return (
    <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
      {/* Header */}
      <LinearGradient
        colors={isCompleted ? ['#2ECC71', '#27AE60'] : ['#FF4B4B', '#E74C3C']}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🔥 Streak Kurtarma</Text>
          <View style={{ width: 40 }} />
        </View>

        <Animated.View style={[styles.streakBigCircle, pulseStyle]}>
          <ShadowFox
            state={isCompleted ? 'healthy' : 'critical'}
            mood={isCompleted ? 'happy' : 'thinking'}
            size="small"
            showGlow={false}
            style={{ width: 60, height: 60 }}
          />
          <Text style={styles.streakBigText}>{challenge.lostStreak}</Text>
        </Animated.View>
        <Text style={styles.streakLabel}>
          {isCompleted ? 'Streak Kurtarıldı! 🎉' : "Streak'ini Kaybettin!"}
        </Text>
      </LinearGradient>

      {/* Timer */}
      {!isCompleted && (
        <Animated.View
          entering={FadeInDown.delay(200)}
          style={[styles.timerCard, { backgroundColor: theme.background.secondary }]}
        >
          <Clock size={20} color="#FF4B4B" />
          <Text style={[styles.timerText, { color: theme.text.primary }]}>
            Kalan Süre: {timeRemaining.hours}s {timeRemaining.minutes}dk
          </Text>
          <AlertTriangle size={16} color="#FFD700" />
        </Animated.View>
      )}

      {/* Requirements */}
      <View style={styles.reqContainer}>
        <Text style={[styles.reqTitle, { color: theme.text.primary }]}>Görevler:</Text>

        <Animated.View
          entering={FadeInDown.delay(300)}
          style={[styles.reqItem, { backgroundColor: theme.background.secondary }]}
        >
          {challenge.requirements.lessonsCompleted >= challenge.requirements.lessonsNeeded ? (
            <CheckCircle size={24} color="#2ECC71" />
          ) : (
            <Circle size={24} color={theme.text.secondary} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={[styles.reqItemTitle, { color: theme.text.primary }]}>
              {challenge.requirements.lessonsNeeded} {i18n.t('streak.complete_lesson')}
            </Text>
            <View style={styles.reqProgress}>
              <View
                style={[
                  styles.reqProgressFill,
                  {
                    width: `${(challenge.requirements.lessonsCompleted / challenge.requirements.lessonsNeeded) * 100}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.reqItemSub, { color: theme.text.secondary }]}>
              {challenge.requirements.lessonsCompleted}/{challenge.requirements.lessonsNeeded}{' '}
              tamamlandı
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(400)}
          style={[styles.reqItem, { backgroundColor: theme.background.secondary }]}
        >
          {challenge.requirements.perfectScoreAchieved ? (
            <CheckCircle size={24} color="#2ECC71" />
          ) : (
            <Star size={24} color={theme.text.secondary} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={[styles.reqItemTitle, { color: theme.text.primary }]}>
              1 Mükemmel Skor Elde Et
            </Text>
            <Text style={[styles.reqItemSub, { color: theme.text.secondary }]}>
              {challenge.requirements.perfectScoreAchieved
                ? i18n.t('streak.success')
                : i18n.t('streak.perfect_accuracy')}
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Action */}
      {!isCompleted ? (
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.startBtn} onPress={handleStartLesson}>
            <Zap size={20} color="#FFF" />
            <Text style={styles.startBtnText}>{i18n.t('streak.start_lesson')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.View entering={ZoomIn} style={styles.successContainer}>
          <ShadowFox state="healthy" mood="running" size="medium" showGlow={true} />
          <Text style={[styles.successText, { color: theme.text.primary }]}>
            {challenge.lostStreak} {i18n.t('streak.streak_recovered')}
          </Text>
          <TouchableOpacity
            style={[styles.startBtn, { backgroundColor: '#2ECC71' }]}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.startBtnText}>Ana Sayfaya Dön</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    alignItems: 'center',
    paddingBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  streakBigCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakBigText: { fontSize: 20, fontWeight: '900', color: '#FFF', marginTop: -2 },
  streakLabel: { color: '#FFF', fontSize: 16, fontWeight: '700', marginTop: 8 },
  timerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
  },
  timerText: { flex: 1, fontSize: 15, fontWeight: '700' },
  reqContainer: { padding: 16, gap: 12, flex: 1 },
  reqTitle: { fontSize: 18, fontWeight: '800' },
  reqItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16 },
  reqItemTitle: { fontSize: 15, fontWeight: '700' },
  reqItemSub: { fontSize: 12, marginTop: 4 },
  reqProgress: { height: 6, backgroundColor: '#333', borderRadius: 3, marginTop: 8 },
  reqProgressFill: { height: '100%', backgroundColor: '#2ECC71', borderRadius: 3 },
  actionContainer: { padding: 20 },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF4B4B',
    borderRadius: 16,
    padding: 18,
  },
  startBtnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
  successContainer: { alignItems: 'center', padding: 20, gap: 12 },
  successEmoji: { fontSize: 48 },
  successText: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  backLink: { marginTop: 16, padding: 12 },
});
