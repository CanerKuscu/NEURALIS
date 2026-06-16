/**
 * DailyGoalTracker - Daily Goal Tracker
 * Tracks user's daily lesson goal
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Target, Check, Flame } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../constants/theme';
import { t } from '../i18n';

interface DailyGoalTrackerProps {
  completedLessons: number;
  targetLessons?: number;
  bonusXP?: number;
}

export function DailyGoalTracker({
  completedLessons,
  targetLessons = 3,
  bonusXP = 50,
}: DailyGoalTrackerProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const celebrationAnim = useRef(new Animated.Value(1)).current;

  const isComplete = completedLessons >= targetLessons;
  const progress = Math.min((completedLessons / targetLessons) * 100, 100);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    if (isComplete) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(celebrationAnim, {
            toValue: 1.05,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(celebrationAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
  }, [progress, isComplete]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.container,
        isComplete && styles.containerComplete,
        { transform: [{ scale: celebrationAnim }] },
      ]}
    >
      {isComplete ? (
        <LinearGradient
          colors={[COLORS.primary, '#45B602']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Check size={24} color="#FFF" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.completeTitle}>🎉 Daily Goal Completed!</Text>
              <Text style={styles.completeSubtitle}>You earned +{bonusXP} bonus XP</Text>
            </View>
            <Flame size={28} color="#FFF" />
          </View>
        </LinearGradient>
      ) : (
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Target size={24} color={COLORS.primary} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{t('home.dailyGoal')}</Text>
            <Text style={styles.subtitle}>
              {completedLessons}/{targetLessons} lessons completed
            </Text>
          </View>
          <Text style={styles.bonusText}>+{bonusXP} XP</Text>
        </View>
      )}

      {/* Progress bar */}
      {!isComplete && (
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
          </View>
          <View style={styles.dots}>
            {Array.from({ length: targetLessons }).map((_, index) => (
              <View
                key={index}
                style={[styles.dot, index < completedLessons && styles.dotComplete]}
              >
                {index < completedLessons && <Check size={12} color="#FFF" />}
              </View>
            ))}
          </View>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.tertiary,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  containerComplete: {
    padding: 0,
    overflow: 'hidden',
  },
  gradient: {
    padding: SPACING.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${COLORS.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  bonusText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
  },
  completeTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFF',
  },
  completeSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },

  // Progress
  progressContainer: {
    marginTop: SPACING.md,
  },
  progressTrack: {
    height: 8,
    backgroundColor: COLORS.background.secondary,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.pill,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.sm,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.background.secondary,
    borderWidth: 2,
    borderColor: COLORS.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotComplete: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
});

export default React.memo(DailyGoalTracker);
