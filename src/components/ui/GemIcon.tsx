/**
 * Premium Gem Icon - SVG with gradient and shine effect
 */
import React from 'react';
import type { ViewStyle } from 'react-native';
import { View } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, G, Polygon, Ellipse } from 'react-native-svg';
import { useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';

interface GemIconProps {
  size?: number;
  color?: 'blue' | 'purple' | 'green' | 'gold' | 'ruby';
  animated?: boolean;
  style?: ViewStyle;
}

const COLORS = {
  blue: { primary: '#00D4FF', secondary: '#0099CC', accent: '#66E0FF', dark: '#006688' },
  purple: { primary: '#A855F7', secondary: '#7C3AED', accent: '#C084FC', dark: '#5B21B6' },
  green: { primary: '#10B981', secondary: '#059669', accent: '#34D399', dark: '#047857' },
  gold: { primary: '#F59E0B', secondary: '#D97706', accent: '#FCD34D', dark: '#B45309' },
  ruby: { primary: '#EF4444', secondary: '#DC2626', accent: '#F87171', dark: '#B91C1C' },
};

export const GemIcon: React.FC<GemIconProps> = ({
  size = 24,
  color = 'blue',
  animated = false,
  style,
}) => {
  const colors = COLORS[color];
  const shimmer = useSharedValue(0);

  React.useEffect(() => {
    if (animated) {
      shimmer.value = withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    }
  }, [animated]);

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100">
        <Defs>
          {/* Main gradient */}
          <LinearGradient id={`gemGrad_${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.accent} />
            <Stop offset="50%" stopColor={colors.primary} />
            <Stop offset="100%" stopColor={colors.secondary} />
          </LinearGradient>
          {/* Dark facet gradient */}
          <LinearGradient id={`gemDark_${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={colors.secondary} />
            <Stop offset="100%" stopColor={colors.dark} />
          </LinearGradient>
          {/* Shine gradient */}
          <LinearGradient id={`gemShine_${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <Stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.3" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Main gem body */}
        <G>
          {/* Top facet */}
          <Polygon points="50,10 80,30 50,40 20,30" fill={`url(#gemGrad_${color})`} />
          {/* Left facet */}
          <Polygon points="20,30 50,40 50,85 15,50" fill={`url(#gemDark_${color})`} />
          {/* Right facet */}
          <Polygon points="80,30 85,50 50,85 50,40" fill={colors.secondary} />
          {/* Bottom point */}
          <Polygon points="50,85 15,50 50,55" fill={colors.dark} />
          <Polygon points="50,85 85,50 50,55" fill={colors.secondary} />
          {/* Center highlight */}
          <Polygon points="50,40 65,45 50,55 35,45" fill={colors.accent} opacity={0.7} />
        </G>

        {/* Shine effect */}
        <Path d="M30,25 Q40,18 55,25 Q45,22 35,28 Z" fill="#FFFFFF" opacity={0.6} />
        <Ellipse cx="38" cy="32" rx="6" ry="3" fill="#FFFFFF" opacity={0.4} />

        {/* Sparkle points */}
        <Path
          d="M75,20 L77,25 L82,23 L77,27 L79,32 L75,28 L71,32 L73,27 L68,23 L73,25 Z"
          fill="#FFFFFF"
          opacity={0.8}
        />
      </Svg>
    </View>
  );
};

export default GemIcon;
