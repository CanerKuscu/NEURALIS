/**
 * NEURALIS - Energy Meter Component
 * Visual representation of user's energy reserves
 */

import React, { useEffect, useRef } from 'react';
import type { ViewStyle } from 'react-native';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import type { EnergyState } from '../../types';
import useNeuralisStore from '../../store/useNeuralisStore';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../theme/colors';

// ═══════════════════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════════════════

interface EnergyMeterProps {
  current: number;
  max: number;
  state: EnergyState;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  showValue?: boolean;
  animated?: boolean;
  style?: ViewStyle;
}

const SIZES = {
  small: { diameter: 60, strokeWidth: 4 },
  medium: { diameter: 100, strokeWidth: 6 },
  large: { diameter: 140, strokeWidth: 8 },
};

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATED CIRCLE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const EnergyMeter: React.FC<EnergyMeterProps> = ({
  current,
  max,
  state,
  size = 'medium',
  showLabel = true,
  showValue = true,
  animated = true,
  style,
}) => {
  const { diameter, strokeWidth } = SIZES[size];
  const radius = (diameter - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Respect global unlimited energy flag if enabled
  const unlimited = useNeuralisStore((s) => s.unlimitedEnergy);
  const displayedCurrent = unlimited ? max : current;
  const percentage = max > 0 ? Math.min(100, Math.max(0, (displayedCurrent / max) * 100)) : 0;

  // Animation
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(progressAnim, {
        toValue: percentage,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    } else {
      progressAnim.setValue(percentage);
    }
  }, [percentage, animated]);

  // Pulse animation for low energy
  useEffect(() => {
    if (state === 'low' || state === 'depleted') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [state]);

  const getStateColor = (): string => {
    switch (state) {
      case 'full':
        return COLORS.energy.full;
      case 'high':
        return COLORS.energy.high;
      case 'medium':
        return COLORS.energy.medium;
      case 'low':
        return COLORS.energy.low;
      case 'depleted':
        return COLORS.energy.depleted;
    }
  };

  const getGradientColors = (): [string, string] => {
    switch (state) {
      case 'full':
        return [COLORS.royalGold, COLORS.gold[600]];
      case 'high':
        return [COLORS.success, '#16A34A'];
      case 'medium':
        return [COLORS.warning, '#D97706'];
      case 'low':
        return [COLORS.danger, '#DC2626'];
      case 'depleted':
        return [COLORS.gray[500], COLORS.gray[700]];
    }
  };

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        { width: diameter, height: diameter },
        { transform: [{ scale: pulseAnim }] },
        style,
      ]}
    >
      <Svg width={diameter} height={diameter}>
        <Defs>
          <SvgGradient id="energyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={getGradientColors()[0]} />
            <Stop offset="100%" stopColor={getGradientColors()[1]} />
          </SvgGradient>
        </Defs>

        {/* Background circle */}
        <Circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          stroke={COLORS.gray[800]}
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Progress circle */}
        <AnimatedCircle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          stroke="url(#energyGradient)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          rotation="-90"
          origin={`${diameter / 2}, ${diameter / 2}`}
        />
      </Svg>

      {/* Center content */}
      <View style={styles.centerContent}>
        {showValue && (
          <Text style={[styles.valueText, { color: getStateColor() }]}>
            {unlimited ? '∞' : Math.round(displayedCurrent)}
          </Text>
        )}
        {showLabel && <Text style={styles.labelText}>ENERGY</Text>}
      </View>

      {/* Glow effect for full energy */}
      {state === 'full' && (
        <View
          style={[
            styles.glowEffect,
            {
              width: diameter + 20,
              height: diameter + 20,
              borderRadius: (diameter + 20) / 2,
              ...SHADOWS.goldGlow,
            },
          ]}
        />
      )}
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// LINEAR ENERGY BAR (Alternative display)
// ═══════════════════════════════════════════════════════════════════════════

interface EnergyBarProps {
  current: number;
  max: number;
  state: EnergyState;
  height?: number;
  showValue?: boolean;
  style?: ViewStyle;
}

export const EnergyBar: React.FC<EnergyBarProps> = ({
  current,
  max,
  state,
  height = 12,
  showValue = true,
  style,
}) => {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: percentage,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  const getGradientColors = (): [string, string] => {
    switch (state) {
      case 'full':
        return [COLORS.royalGold, COLORS.gold[600]];
      case 'high':
        return [COLORS.success, '#16A34A'];
      case 'medium':
        return [COLORS.warning, '#D97706'];
      case 'low':
        return [COLORS.danger, '#DC2626'];
      case 'depleted':
        return [COLORS.gray[500], COLORS.gray[700]];
    }
  };

  const animatedWidth = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.barContainer, style]}>
      {showValue && (
        <View style={styles.barHeader}>
          <Text style={styles.barLabel}>ENERGY</Text>
          <Text style={styles.barValue}>
            {Math.round(current)}/{max}
          </Text>
        </View>
      )}
      <View style={[styles.barBackground, { height }]}>
        <Animated.View style={[styles.barFill, { width: animatedWidth }]}>
          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: '700',
  },
  labelText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray[500],
    letterSpacing: TYPOGRAPHY.letterSpacing.wider,
    marginTop: 2,
  },
  glowEffect: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },

  // Bar styles
  barContainer: {
    width: '100%',
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  barLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray[500],
    letterSpacing: TYPOGRAPHY.letterSpacing.wider,
  },
  barValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray[300],
    fontWeight: '600',
  },
  barBackground: {
    width: '100%',
    backgroundColor: COLORS.gray[800],
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
    overflow: 'hidden',
  },
});

export default EnergyMeter;
