/**
 * NEURALIS - Shadow Fox Component
 * Animated mascot using PNG images + Reanimated breathing/pulse effects
 * Supports mood override for context-specific fox images
 */

import React, { useEffect } from 'react';
import type { ImageSourcePropType, ViewStyle } from 'react-native';
import { View, Image, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import type { StreakState } from '../../types';
import { COLORS, SHADOW_FOX_CONFIG } from '../../theme/colors';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

/** Context-specific mood overrides for the fox image */
export type FoxMood = 'happy' | 'sleeping' | 'running' | 'studying' | 'thinking' | 'listening';

// ═══════════════════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════════════════

interface ShadowFoxProps {
  /** Streak state — determines default image & glow */
  state?: StreakState;
  /** Override image mood regardless of streak state */
  mood?: FoxMood;
  size?: 'small' | 'medium' | 'large';
  showGlow?: boolean;
  style?: ViewStyle;
}

const SIZES = {
  small: 100,
  medium: 150,
  large: 220,
};

// ═══════════════════════════════════════════════════════════════════════════
// ASSETS — PNG images from assets/fox/
// ═══════════════════════════════════════════════════════════════════════════

const FOX_IMAGES: Record<FoxMood, ImageSourcePropType> = {
  happy: require('../../../assets/fox/fox-happy.png'),
  sleeping: require('../../../assets/fox/fox-sleepy.png'),
  running: require('../../../assets/fox/fox-excited.png'),
  studying: require('../../../assets/fox/studiously.png'),
  thinking: require('../../../assets/fox/fox-neutral.png'),
  listening: require('../../../assets/fox/fox-happy.png'),
};

/** Maps StreakState → default FoxMood */
const STATE_TO_MOOD: Record<StreakState, FoxMood> = {
  healthy: 'happy',
  warning: 'thinking',
  neural_decay: 'sleeping',
  critical: 'thinking',
  dead: 'sleeping',
};

/** Maps StreakState → glow color */
const STATE_TO_GLOW: Record<StreakState, string> = {
  healthy: COLORS.neonPurple,
  warning: COLORS.warning,
  neural_decay: COLORS.purple[700],
  critical: COLORS.danger,
  dead: COLORS.gray[600],
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const ShadowFox: React.FC<ShadowFoxProps> = ({
  state = 'healthy',
  mood,
  size = 'large',
  showGlow = true,
  style,
}) => {
  const foxConfig = SHADOW_FOX_CONFIG.states[state];
  const dimension = SIZES[size];

  // Breathing / pulse animation
  const breathScale = useSharedValue(1);
  const glowOpacity = useSharedValue(foxConfig.glowIntensity > 0 ? 0.25 : 0);

  // Resolve which image to show
  const resolvedMood: FoxMood = mood ?? STATE_TO_MOOD[state];
  const imageSource = FOX_IMAGES[resolvedMood];

  useEffect(() => {
    // Gentle breathing effect
    breathScale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );

    // Glow pulse
    if (foxConfig.glowIntensity > 0) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(foxConfig.glowIntensity * 0.4, { duration: 2000 }),
          withTiming(foxConfig.glowIntensity * 0.15, { duration: 2000 }),
        ),
        -1,
        true,
      );
    } else {
      glowOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [state, mood]);

  const breathStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathScale.value }],
    opacity: mood ? 1 : foxConfig.opacity,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const glowColor = STATE_TO_GLOW[state];

  return (
    <View style={[styles.container, { width: dimension, height: dimension }, style]}>
      {/* Glow effect */}
      {showGlow && (
        <Animated.View
          style={[
            styles.glow,
            {
              width: dimension * 1.3,
              height: dimension * 1.3,
              borderRadius: dimension * 0.65,
              backgroundColor: glowColor,
            },
            glowStyle,
          ]}
        />
      )}

      {/* Fox Image with breathing animation */}
      <Animated.Image
        source={imageSource}
        resizeMode="contain"
        style={[
          {
            width: dimension * 0.85,
            height: dimension * 0.85,
          },
          breathStyle,
        ]}
      />
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
  glow: {
    position: 'absolute',
  },
});

export default ShadowFox;
