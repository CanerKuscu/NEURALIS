/**
 * MonthlyBadges - Monthly Badges Carousel
 * Horizontal scroll of earned badges
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../constants/theme';
import type { Badge } from '../types/leagueTypes';

interface MonthlyBadgesProps {
  badges: Badge[];
  onViewAll?: () => void;
  onPressBadge?: (badge: Badge) => void;
}

const MonthlyBadges: React.FC<MonthlyBadgesProps> = ({ badges, onViewAll, onPressBadge }) => {
  const getRarityColor = (rarity: Badge['rarity']) => {
    switch (rarity) {
      case 'legendary':
        return '#FFD700';
      case 'epic':
        return '#9B59B6';
      case 'rare':
        return '#3498DB';
      case 'common':
        return COLORS.text.secondary;
      default:
        return COLORS.text.secondary;
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={onViewAll} activeOpacity={0.8}>
        <Text style={styles.title}>MONTHLY BADGES</Text>
        <ChevronRight size={20} color={COLORS.text.muted} />
      </TouchableOpacity>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {badges.map((badge) => (
          <TouchableOpacity
            key={badge.id}
            style={[styles.badgeItem, { borderColor: getRarityColor(badge.rarity) + '40' }]}
            activeOpacity={0.8}
            onPress={() => onPressBadge?.(badge)}
          >
            <View
              style={[styles.badgeIcon, { backgroundColor: getRarityColor(badge.rarity) + '20' }]}
            >
              <Text style={styles.badgeEmoji}>{badge.icon}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.secondary,
    letterSpacing: 1,
  },
  scrollContent: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  badgeItem: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background.tertiary,
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeEmoji: {
    fontSize: 28,
  },
});

export default React.memo(MonthlyBadges);
