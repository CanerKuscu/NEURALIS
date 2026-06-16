/**
 * XPBadge - Experience Points Display
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Zap } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../constants/theme';

interface XPBadgeProps {
  totalXP: number;
}

export const XPBadge: React.FC<XPBadgeProps> = ({ totalXP }) => {
  const formatXP = (xp: number): string => {
    if (xp >= 1000) {
      return `${(xp / 1000).toFixed(1)}K`;
    }
    return xp.toString();
  };

  return (
    <View style={styles.badge}>
      <Zap size={18} color={COLORS.secondary} fill={COLORS.secondary} />
      <Text style={styles.xpCount}>{formatXP(totalXP)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.tertiary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
  },
  xpCount: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.secondary,
    marginLeft: SPACING.xs,
  },
});

export default React.memo(XPBadge);
