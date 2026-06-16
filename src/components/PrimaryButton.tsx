/**
 * PrimaryButton - Main Action Button
 * Duolingo-style 3D button with press effect
 */

import React from 'react';
import { Text, StyleSheet, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../constants/theme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'gold';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  fullWidth = true,
}) => {
  const variantStyles = {
    primary: {
      bg: COLORS.primary,
      shadow: COLORS.primaryDark,
      text: '#FFFFFF',
    },
    secondary: {
      bg: COLORS.secondary,
      shadow: COLORS.secondary,
      text: '#FFFFFF',
    },
    danger: {
      bg: COLORS.error,
      shadow: COLORS.error, // fallback to error color for shadow
      text: '#FFFFFF',
    },
    gold: {
      bg: COLORS.warning,
      shadow: '#CC9F00',
      text: COLORS.text.primary,
    },
  };

  const sizeStyles = {
    small: {
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
      fontSize: TYPOGRAPHY.fontSize.sm,
      borderRadius: RADIUS.md,
      shadowHeight: 3,
    },
    medium: {
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      fontSize: TYPOGRAPHY.fontSize.lg,
      borderRadius: RADIUS.lg,
      shadowHeight: 4,
    },
    large: {
      paddingVertical: SPACING.lg,
      paddingHorizontal: SPACING.xl,
      fontSize: TYPOGRAPHY.fontSize.xl,
      borderRadius: RADIUS.xl,
      shadowHeight: 5,
    },
  };

  const colors = disabled
    ? { bg: COLORS.text.muted, shadow: COLORS.background.tertiary, text: COLORS.text.secondary }
    : variantStyles[variant];
  const sizing = sizeStyles[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.9}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={[styles.container, fullWidth && styles.fullWidth]}
    >
      {/* Shadow layer */}
      <View
        style={[
          styles.shadow,
          {
            backgroundColor: colors.shadow,
            borderRadius: sizing.borderRadius,
            height: sizing.shadowHeight,
          },
        ]}
      />

      {/* Button face */}
      <View
        style={[
          styles.button,
          {
            backgroundColor: colors.bg,
            paddingVertical: sizing.paddingVertical,
            paddingHorizontal: sizing.paddingHorizontal,
            borderRadius: sizing.borderRadius,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <View style={styles.content}>
            {icon && <View style={styles.iconWrapper}>{icon}</View>}
            <Text
              style={[
                styles.text,
                {
                  color: colors.text,
                  fontSize: sizing.fontSize,
                },
              ]}
            >
              {title}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  fullWidth: {
    width: '100%',
  },
  shadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4, // Lift above shadow
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    marginRight: SPACING.sm,
  },
  text: {
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

export default React.memo(PrimaryButton);
