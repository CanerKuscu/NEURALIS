/**
 * CategoryCard - Learning Category Selection Card
 * Colorful card for each subject category
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../constants/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.lg * 3) / 2;

interface CategoryCardProps {
  id: string;
  name: string;
  icon: string;
  color: string;
  progress?: number; // 0-100
  lessonsCompleted?: number;
  totalLessons?: number;
  onPress: () => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  name,
  icon,
  color,
  progress = 0,
  lessonsCompleted = 0,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.85}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${name} category, ${Math.round(progress)}% complete, ${lessonsCompleted} lessons done`}
      accessibilityHint="Opens this category's lessons"
    >
      <View style={[styles.card, { borderColor: color }]}>
        {/* Icon Circle */}
        <View style={[styles.iconCircle, { backgroundColor: `${color}20` }]}>
          <Text style={styles.icon}>{icon}</Text>
        </View>

        {/* Category Name */}
        <Text style={styles.name}>{name}</Text>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={[color, `${color}CC`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${progress}%` }]}
            />
          </View>
          <Text style={styles.progressText}>{lessonsCompleted} lessons</Text>
        </View>

        {/* Arrow */}
        <View style={[styles.arrow, { backgroundColor: color }]}>
          <ChevronRight size={16} color={COLORS.text.light} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginBottom: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.background.tertiary,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderLeftWidth: 4,
    ...SHADOWS.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  icon: {
    fontSize: 24,
  },
  name: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  progressContainer: {
    marginBottom: SPACING.sm,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.background.secondary,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: RADIUS.pill,
  },
  progressText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.secondary,
  },
  arrow: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: 24,
    height: 24,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default React.memo(CategoryCard);
