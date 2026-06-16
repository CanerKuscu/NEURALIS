/**
 * PremiumBadge - Premium Status Badge
 * Premium user badge
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Star, Sparkles } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../constants/theme';

interface PremiumBadgeProps {
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  animated?: boolean;
}

export function PremiumBadge({
  size = 'medium',
  showLabel = true,
  animated = true,
}: PremiumBadgeProps) {
  const glowAnim = useRef(new Animated.Value(0.5)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      // Glow pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.5,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ).start();

      // Subtle rotation
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
  }, [animated]);

  const getSizes = () => {
    switch (size) {
      case 'small':
        return {
          container: { paddingHorizontal: SPACING.sm, paddingVertical: 4 },
          icon: 14,
          text: TYPOGRAPHY.fontSize.xs,
        };
      case 'large':
        return {
          container: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm },
          icon: 24,
          text: TYPOGRAPHY.fontSize.lg,
        };
      default:
        return {
          container: { paddingHorizontal: SPACING.md, paddingVertical: 6 },
          icon: 18,
          text: TYPOGRAPHY.fontSize.sm,
        };
    }
  };

  const sizes = getSizes();

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-3deg', '3deg'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ rotate: rotateInterpolate }],
        },
      ]}
    >
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glow,
          {
            opacity: glowAnim,
          },
        ]}
      />

      <LinearGradient
        colors={['#FFD700', '#FFA500', '#FF8C00']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.badge, sizes.container]}
      >
        <Crown size={sizes.icon} color="#FFF" />
        {showLabel && <Text style={[styles.label, { fontSize: sizes.text }]}>PREMIUM</Text>}
        <Sparkles size={sizes.icon * 0.7} color="rgba(255,255,255,0.8)" />
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    backgroundColor: '#FFD700',
    borderRadius: RADIUS.pill,
    ...SHADOWS.lg,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.pill,
    gap: 6,
    ...SHADOWS.md,
  },
  label: {
    fontWeight: TYPOGRAPHY.fontWeight.black,
    color: '#FFF',
    letterSpacing: 1,
  },
});

export default PremiumBadge;
