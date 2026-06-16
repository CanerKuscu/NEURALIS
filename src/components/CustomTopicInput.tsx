/**
 * CustomTopicInput - Premium Custom Topic Feature
 * Custom topic selection for Premium users
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Sparkles, AlertCircle, Check, X } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../constants/theme';

interface CustomTopicInputProps {
  onSubmit: (topic: string) => Promise<{ approved: boolean; reason?: string }>;
  onCancel: () => void;
  isPremium: boolean;
}

// Blocked keywords list (simple safety check)
const BLOCKED_KEYWORDS = [
  'attack',
  'hack',
  'password',
  'thief',
  'illegal',
  'weapon',
  'bomb',
  'drug',
  'crack',
  'steal',
  'terror',
  'porn',
];

export function CustomTopicInput({ onSubmit, onCancel, isPremium }: CustomTopicInputProps) {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);

  if (!isPremium) {
    return (
      <View style={styles.container}>
        <View style={styles.lockedContainer}>
          <Crown size={48} color={COLORS.xp.gold} />
          <Text style={styles.lockedTitle}>Premium Feature</Text>
          <Text style={styles.lockedText}>
            Custom topic selection is for Premium members only. Create AI lesson series on your own
            interests!
          </Text>
          <TouchableOpacity style={styles.upgradeButton}>
            <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.upgradeGradient}>
              <Text style={styles.upgradeText}>Upgrade to Premium</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const validateTopic = (text: string): { valid: boolean; reason?: string } => {
    // Minimum length
    if (text.trim().length < 3) {
      return { valid: false, reason: 'Topic must be at least 3 characters.' };
    }

    // Maximum length
    if (text.trim().length > 100) {
      return { valid: false, reason: 'Topic can be at most 100 characters.' };
    }

    // Blocked keyword check
    const lowerText = text.toLowerCase();
    for (const keyword of BLOCKED_KEYWORDS) {
      if (lowerText.includes(keyword)) {
        return { valid: false, reason: 'This topic is inappropriate. Please try another topic.' };
      }
    }

    return { valid: true };
  };

  const handleSubmit = async () => {
    setError(null);

    const validation = validateTopic(topic);
    if (!validation.valid) {
      setError(validation.reason || 'Invalid topic');
      return;
    }

    setIsLoading(true);

    try {
      const result = await onSubmit(topic.trim());

      if (result.approved) {
        setIsApproved(true);
        setTimeout(() => {
          onCancel(); // Close and go to lesson screen
        }, 1500);
      } else {
        setError(result.reason || 'This topic is not supported at the moment.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const exampleTopics = [
    'AI Fundamentals',
    'Crypto & Blockchain',
    'Stress Management',
    'Photography Techniques',
    'Italian Cuisine',
  ];

  if (isApproved) {
    return (
      <View style={styles.container}>
        <View style={styles.approvedContainer}>
          <View style={styles.checkIcon}>
            <Check size={48} color="#FFF" />
          </View>
          <Text style={styles.approvedTitle}>Approved!</Text>
          <Text style={styles.approvedText}>Preparing lesson series on "{topic}"...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <X size={24} color={COLORS.text.secondary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Sparkles size={24} color={COLORS.xp.gold} />
          <Text style={styles.title}>Create Custom Topic</Text>
        </View>
      </View>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="What do you want to learn?"
          placeholderTextColor={COLORS.text.muted}
          value={topic}
          onChangeText={setTopic}
          maxLength={100}
          multiline
          autoFocus
        />
        <Text style={styles.charCount}>{topic.length}/100</Text>
      </View>

      {/* Error */}
      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle size={16} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Examples */}
      <View style={styles.examplesSection}>
        <Text style={styles.examplesTitle}>Example Topics:</Text>
        <View style={styles.examplesList}>
          {exampleTopics.map((example, index) => (
            <TouchableOpacity
              key={index}
              style={styles.exampleChip}
              onPress={() => setTopic(example)}
            >
              <Text style={styles.exampleText}>{example}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, (!topic.trim() || isLoading) && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={!topic.trim() || isLoading}
      >
        <LinearGradient
          colors={
            topic.trim() ? [COLORS.primary, '#45B602'] : [COLORS.text.muted, COLORS.text.muted]
          }
          style={styles.submitGradient}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Sparkles size={20} color="#FFF" />
              <Text style={styles.submitText}>Create Lesson Series</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* Info */}
      <Text style={styles.infoText}>
        AI will analyze your topic and create a personalized lesson series. Inappropriate topics may
        be rejected.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  closeButton: {
    padding: SPACING.sm,
    marginRight: SPACING.sm,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
  },

  // Input
  inputContainer: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border.light,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  input: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.text.primary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.muted,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },

  // Error
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
    padding: SPACING.sm,
    backgroundColor: `${COLORS.error}20`,
    borderRadius: RADIUS.md,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.error,
    flex: 1,
  },

  // Examples
  examplesSection: {
    marginBottom: SPACING.xl,
  },
  examplesTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },
  examplesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  exampleChip: {
    backgroundColor: COLORS.background.tertiary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  exampleText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
  },

  // Submit
  submitButton: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  submitText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFF',
  },

  infoText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Locked state (non-premium)
  lockedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  lockedTitle: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.xp.gold,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  lockedText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  upgradeButton: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  upgradeGradient: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  upgradeText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFF',
  },

  // Approved state
  approvedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  checkIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.lg,
  },
  approvedTitle: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  approvedText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
});

export default CustomTopicInput;
