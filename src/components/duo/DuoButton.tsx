import React from 'react';
import type { ViewStyle, TextStyle } from 'react-native';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { DUO_COLORS, DUO_RADIUS, DUO_SHADOW } from '../../theme/duo';

type Variant = 'primary' | 'secondary' | 'ghost';

export function DuoButton({
  title,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  style,
  textStyle,
  testID,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}): React.JSX.Element {
  const isDisabled = disabled || loading;

  const base = [
    styles.base,
    variant === 'primary' ? styles.primary : null,
    variant === 'secondary' ? styles.secondary : null,
    variant === 'ghost' ? styles.ghost : null,
    isDisabled ? styles.disabled : null,
    style,
  ];

  const label = [
    styles.label,
    variant === 'primary' ? styles.labelPrimary : null,
    variant === 'secondary' ? styles.labelSecondary : null,
    variant === 'ghost' ? styles.labelGhost : null,
    textStyle,
  ];

  return (
    <TouchableOpacity
      testID={testID}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={isDisabled}
      style={base}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#fff' : DUO_COLORS.textPrimary}
        />
      ) : null}
      <Text style={label}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: DUO_RADIUS.lg,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    ...DUO_SHADOW,
  },
  primary: {
    backgroundColor: DUO_COLORS.green,
  },
  secondary: {
    backgroundColor: DUO_COLORS.bgCard,
    borderWidth: 1,
    borderColor: DUO_COLORS.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontWeight: '900',
    fontSize: 15,
  },
  labelPrimary: {
    color: '#fff',
  },
  labelSecondary: {
    color: DUO_COLORS.textPrimary,
  },
  labelGhost: {
    color: DUO_COLORS.blue,
  },
});
