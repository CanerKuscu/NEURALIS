/**
 * LeaguePodium - Top 3 Trophy Display
 * Duolingo-style podium with animated trophies
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../constants/theme';
import type { LeagueParticipant } from '../types/leagueTypes';

interface LeaguePodiumProps {
  topThree: LeagueParticipant[];
}

// Trophy colors and sizes
const TROPHY_CONFIG = {
  1: { color: '#FFD700', size: 80, order: 1 }, // Gold - center
  2: { color: '#C0C0C0', size: 64, order: 0 }, // Silver - left
  3: { color: '#CD7F32', size: 56, order: 2 }, // Bronze - right
};

const LeaguePodium: React.FC<LeaguePodiumProps> = ({ topThree }) => {
  const scaleAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    // Staggered animation for podium reveal
    Animated.stagger(150, [
      Animated.spring(scaleAnims[1], {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.spring(scaleAnims[0], {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.spring(scaleAnims[2], {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
    ]).start();
  }, []);

  // Reorder for display: [2nd, 1st, 3rd]
  const displayOrder = [1, 0, 2];

  return (
    <View style={styles.container}>
      {displayOrder.map((displayIndex, i) => {
        const participant = topThree[displayIndex];
        if (!participant) return null;

        const rank = displayIndex + 1;
        const config = TROPHY_CONFIG[rank as 1 | 2 | 3];

        return (
          <Animated.View
            key={participant.id}
            style={[styles.podiumItem, { transform: [{ scale: scaleAnims[displayIndex] }] }]}
          >
            {/* Trophy */}
            <View
              style={[styles.trophyContainer, { width: config.size, height: config.size * 1.2 }]}
            >
              <TrophyIcon color={config.color} rank={rank} />
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
};

// Trophy Icon Component
const TrophyIcon: React.FC<{ color: string; rank: number }> = ({ color, rank }) => {
  const getTrophyEmoji = () => {
    switch (rank) {
      case 1:
        return '🏆';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '🏆';
    }
  };

  return (
    <View style={[styles.trophy, { backgroundColor: `${color}20` }]}>
      <Text style={styles.trophyEmoji}>{getTrophyEmoji()}</Text>
      <View style={[styles.trophyGlow, { backgroundColor: color }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    gap: SPACING.lg,
  },
  podiumItem: {
    alignItems: 'center',
  },
  trophyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophy: {
    width: '100%',
    height: '100%',
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  trophyEmoji: {
    fontSize: 40,
  },
  trophyGlow: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 4,
    borderRadius: 2,
    opacity: 0.6,
  },
});

export default React.memo(LeaguePodium);
