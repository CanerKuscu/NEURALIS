/**
 * FriendStreakRow - Friend Streaks
 * Horizontal scroll of friends with shared streaks
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Plus, Check } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../constants/theme';
import type { FriendStreak } from '../types/leagueTypes';

interface FriendStreakRowProps {
  friendStreaks: FriendStreak[];
  maxSlots?: number;
  onAddFriend?: () => void;
  onPressFriend?: (friend: FriendStreak) => void;
}

const FriendStreakRow: React.FC<FriendStreakRowProps> = ({
  friendStreaks,
  maxSlots = 5,
  onAddFriend,
  onPressFriend,
}) => {
  const emptySlots = Math.max(0, maxSlots - friendStreaks.length);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FRIEND STREAKS</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Existing friend streaks */}
        {friendStreaks.map((friend) => (
          <TouchableOpacity
            key={friend.id}
            style={styles.friendSlot}
            activeOpacity={0.8}
            onPress={() => onPressFriend?.(friend)}
          >
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{friend.partnerName.charAt(0).toUpperCase()}</Text>
              </View>
              {friend.isActive && (
                <View style={styles.activeBadge}>
                  <Check size={10} color="#FFFFFF" />
                </View>
              )}
            </View>
            <Text style={styles.streakDays}>{friend.streakDays}🔥</Text>
          </TouchableOpacity>
        ))}

        {/* Empty slots */}
        {Array.from({ length: emptySlots }).map((_, index) => (
          <TouchableOpacity
            key={`empty_${index}`}
            style={styles.emptySlot}
            activeOpacity={0.8}
            onPress={onAddFriend}
          >
            <View style={styles.emptyAvatar}>
              <Plus size={24} color={COLORS.text.muted} strokeWidth={2} />
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
  title: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.secondary,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  scrollContent: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  friendSlot: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.background.tertiary,
    borderWidth: 2,
    borderColor: COLORS.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },
  activeBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakDays: {
    marginTop: SPACING.xs,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.secondary,
  },
  emptySlot: {
    alignItems: 'center',
  },
  emptyAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default React.memo(FriendStreakRow);
