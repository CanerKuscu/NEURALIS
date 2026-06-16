import React, { useState } from 'react';
import type { TextInputProps } from 'react-native';
import { TextInput, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { GlassCard } from './GlassCard';
import { Search } from 'lucide-react-native';

export const CyberInput: React.FC<TextInputProps> = (props) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const glowOpacity = useSharedValue(0);

  const handleFocus = () => {
    setIsFocused(true);
    glowOpacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 1000 }), withTiming(0.5, { duration: 1000 })),
      -1,
      true,
    );
  };

  const handleBlur = () => {
    setIsFocused(false);
    glowOpacity.value = withTiming(0);
  };

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    shadowOpacity: glowOpacity.value * 0.8,
  }));

  return (
    <Animated.View>
      <Animated.View style={[styles.container, animatedGlowStyle, { shadowColor: theme.primary }]}>
        <GlassCard variant={isFocused ? 'highlight' : 'default'} style={styles.card}>
          <View style={styles.row}>
            <Search size={20} color={isFocused ? theme.primary : theme.text.muted} />
            <TextInput
              {...props}
              placeholderTextColor={theme.text.muted}
              style={[styles.input, { color: theme.text.primary }]}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </View>
        </GlassCard>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    elevation: 5,
  },
  card: {
    borderRadius: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
});
