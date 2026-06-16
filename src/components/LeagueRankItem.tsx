/**
 * LeagueRankItem - Individual Ranking Row
 * Displays user rank, avatar, name, flag, and XP
 */

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Zap, Crown } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../constants/theme';
import type { LeagueParticipant } from '../types/leagueTypes';

interface LeagueRankItemProps {
  participant: LeagueParticipant;
  isInPromotionZone: boolean;
  isInRelegationZone: boolean;
  onPress?: () => void;
}

const LeagueRankItem: React.FC<LeagueRankItemProps> = ({
  participant,
  isInPromotionZone,
  isInRelegationZone,
  onPress,
}) => {
  const { rank, displayName, countryFlag, weeklyXP, isPremium, isCurrentUser, streak } =
    participant;

  // Get rank display style
  const getRankStyle = () => {
    if (isCurrentUser) {
      return { backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary };
    }
    if (isInRelegationZone) {
      return { backgroundColor: 'rgba(255,75,75,0.08)', borderColor: 'rgba(255,75,75,0.3)' };
    }
    if (isInPromotionZone) {
      return { backgroundColor: 'rgba(88,204,2,0.08)', borderColor: 'rgba(88,204,2,0.3)' };
    }
    return { backgroundColor: COLORS.background.tertiary, borderColor: COLORS.border.light };
  };

  const getRankColor = () => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    if (isInRelegationZone) return '#FF4B4B';
    return COLORS.text.secondary;
  };

  return (
    <TouchableOpacity
      style={[styles.container, getRankStyle()]}
      activeOpacity={0.8}
      onPress={onPress}
      disabled={!onPress}
    >
      {/* Rank Number */}
      <View style={styles.rankContainer}>
        <Text style={[styles.rank, { color: getRankColor() }]}>{rank}</Text>
      </View>

      {/* Avatar + Badge */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
        </View>
        {isPremium && (
          <View style={styles.premiumBadge}>
            <Crown size={10} color="#FFD700" fill="#FFD700" />
          </View>
        )}
        {streak && streak >= 7 && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥</Text>
          </View>
        )}
      </View>

      {/* Name + Flag */}
      <View style={styles.infoContainer}>
        <Text style={[styles.name, isCurrentUser && styles.currentUserName]} numberOfLines={1}>
          {isCurrentUser ? 'Sen' : displayName}
        </Text>
        {countryFlag && (
          <Text style={styles.flag}>
            {countryFlag} {streak ? streak : ''}
          </Text>
        )}
      </View>

      {/* XP */}
      <View style={styles.xpContainer}>
        <Text style={styles.xp}>{weeklyXP}</Text>
        <Text style={styles.xpLabel}>Puan</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.xs,
  },
  rankContainer: {
    width: 32,
    alignItems: 'center',
  },
  rank: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  avatarContainer: {
    position: 'relative',
    marginLeft: SPACING.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background.tertiary,
    borderWidth: 2,
    borderColor: COLORS.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  premiumBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakBadge: {
    position: 'absolute',
    bottom: -4,
    left: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakText: {
    fontSize: 10,
  },
  infoContainer: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  name: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.text.primary,
  },
  currentUserName: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  flag: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  xpContainer: {
    alignItems: 'flex-end',
  },
  xp: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  xpLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.muted,
  },
});

export default React.memo(LeagueRankItem);
