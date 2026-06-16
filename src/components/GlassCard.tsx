/**
 * GlassCard - Glassmorphism Card Component
 * Premium görünümlü şeffaf kart
 */

import React from 'react';
import type { ViewStyle } from 'react-native';
import { View, Text, StyleSheet, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  style?: ViewStyle;
  intensity?: number;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'premium';
}

export function GlassCard({
  children,
  title,
  subtitle,
  style,
  intensity = 20,
  variant = 'default',
}: GlassCardProps) {
  const getGradientColors = (): [string, string] => {
    switch (variant) {
      case 'success':
        return [`${COLORS.primary}15`, `${COLORS.primary}05`];
      case 'warning':
        return [`${COLORS.warning}15`, `${COLORS.warning}05`];
      case 'error':
        return [`${COLORS.error}15`, `${COLORS.error}05`];
      case 'premium':
        return [`#FFD70015`, `#FFD70005`];
      default:
        return ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)'];
    }
  };

  const getBorderColor = () => {
    switch (variant) {
      case 'success':
        return `${COLORS.primary}40`;
      case 'warning':
        return `${COLORS.warning}40`;
      case 'error':
        return `${COLORS.error}40`;
      case 'premium':
        return `#FFD70040`;
      default:
        return 'rgba(255, 255, 255, 0.1)';
    }
  };

  return (
    <View style={[styles.container, { borderColor: getBorderColor() }, style]}>
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {(title || subtitle) && (
          <View style={styles.header}>
            {title && <Text style={styles.title}>{title}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        )}
        <View style={styles.content}>{children}</View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  gradient: {
    padding: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  content: {},
});

export default React.memo(GlassCard);
