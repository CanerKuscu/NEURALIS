/**
 * Create Lesson Series Screen - Premium Feature
 * Allows premium users to create custom AI-generated lesson series
 */

import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Wand2,
  BookOpen,
  Sparkles,
  Lock,
  ChevronRight,
  Layers,
  Target,
  Clock,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import { useSubscription } from '../src/providers/SubscriptionProvider';
import { useToast } from '../src/context/ToastContext';
import { lessonSeriesService } from '../src/services/LessonSeriesService';
import type { SeriesGenerationStatus } from '../src/types/lessonSeries';
import { LESSON_CATEGORIES, DIFFICULTY_LEVELS } from '../src/types/lessonSeries';
import { CustomModal, useModal } from '../src/components/CustomModal';

const { width } = Dimensions.get('window');

const LESSON_COUNTS = [3, 5, 7, 10];

export default function CreateSeriesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { isPro, isElite } = useSubscription();
  const { showToast } = useToast();
  const modal = useModal();

  // Form state
  const [topic, setTopic] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('custom');
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    'beginner' | 'intermediate' | 'advanced'
  >('beginner');
  const [lessonCount, setLessonCount] = useState(5);
  const [customInstructions, setCustomInstructions] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<SeriesGenerationStatus>({
    status: 'idle',
    progress: 0,
    currentLesson: 0,
    totalLessons: 0,
  });

  const hasPremium = isPro || isElite;

  const handleGenerate = useCallback(async () => {
    if (!hasPremium) {
      modal.premium(
        'Premium Required',
        'Create custom lesson series with AI is a premium feature. Upgrade to unlock!',
        () => router.push('/premium'),
      );
      return;
    }

    if (!topic.trim()) {
      showToast('Please enter a topic', { type: 'error' });
      return;
    }

    setIsGenerating(true);
    setGenerationStatus({
      status: 'generating',
      progress: 0,
      currentLesson: 0,
      totalLessons: lessonCount,
    });

    try {
      // Create series
      const series = await lessonSeriesService.createSeries({
        topic: topic.trim(),
        difficulty: selectedDifficulty,
        lessonCount,
        category: selectedCategory,
        isPublic,
        customInstructions: customInstructions.trim() || undefined,
      });

      if (!series) {
        throw new Error('Failed to create series');
      }

      // Generate lessons
      await lessonSeriesService.generateLessonsForSeries(
        series.id,
        topic.trim(),
        lessonCount,
        selectedDifficulty,
        customInstructions.trim() || undefined,
        (status) => setGenerationStatus(status),
      );

      showToast('Series created successfully! 🎉', { type: 'success' });
      router.replace(`/series/${series.id}`);
    } catch (error: any) {
      console.error('Generation error:', error);
      setGenerationStatus({
        status: 'error',
        progress: 0,
        currentLesson: 0,
        totalLessons: lessonCount,
        error: error.message,
      });
      showToast('Failed to generate series', { type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  }, [
    topic,
    selectedCategory,
    selectedDifficulty,
    lessonCount,
    customInstructions,
    isPublic,
    hasPremium,
  ]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background.primary, paddingTop: insets.top },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>
          Create Lesson Series
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Premium Banner */}
        {!hasPremium && (
          <Animated.View entering={FadeInDown.duration(500)}>
            <LinearGradient
              colors={['#667EEA', '#764BA2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.premiumBanner}
            >
              <Lock size={24} color="#FFF" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.premiumTitle}>Premium Feature</Text>
                <Text style={styles.premiumDesc}>
                  Upgrade to create unlimited AI-powered lesson series
                </Text>
              </View>
              <TouchableOpacity style={styles.upgradeBtn} onPress={() => router.push('/premium')}>
                <Text style={styles.upgradeBtnText}>UPGRADE</Text>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Topic Input */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
            <Wand2 size={18} color={theme.primary} /> What do you want to learn?
          </Text>
          <TextInput
            style={[
              styles.topicInput,
              {
                backgroundColor: theme.background.secondary,
                color: theme.text.primary,
                borderColor: theme.border.light,
              },
            ]}
            placeholder="e.g., Quantum Physics, JavaScript Basics, World War II..."
            placeholderTextColor={theme.text.muted}
            value={topic}
            onChangeText={setTopic}
            multiline
            maxLength={100}
          />
          <Text style={[styles.charCount, { color: theme.text.muted }]}>{topic.length}/100</Text>
        </Animated.View>

        {/* Category Selection */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
            <BookOpen size={18} color={theme.primary} /> Category
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {LESSON_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor:
                      selectedCategory === cat.id ? cat.color : theme.background.secondary,
                    borderColor: selectedCategory === cat.id ? cat.color : theme.border.light,
                  },
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.categoryText,
                    { color: selectedCategory === cat.id ? '#FFF' : theme.text.primary },
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Difficulty Selection */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
            <Target size={18} color={theme.primary} /> Difficulty Level
          </Text>
          <View style={styles.difficultyRow}>
            {DIFFICULTY_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.id}
                style={[
                  styles.difficultyCard,
                  {
                    backgroundColor: theme.background.secondary,
                    borderColor:
                      selectedDifficulty === level.id ? theme.primary : theme.border.light,
                    borderWidth: selectedDifficulty === level.id ? 2 : 1,
                  },
                ]}
                onPress={() => setSelectedDifficulty(level.id as any)}
              >
                <Text style={styles.difficultyIcon}>{level.icon}</Text>
                <Text style={[styles.difficultyName, { color: theme.text.primary }]}>
                  {level.name}
                </Text>
                <Text style={[styles.difficultyDesc, { color: theme.text.secondary }]}>
                  {level.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Lesson Count */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
            <Layers size={18} color={theme.primary} /> Number of Lessons
          </Text>
          <View style={styles.countRow}>
            {LESSON_COUNTS.map((count) => (
              <TouchableOpacity
                key={count}
                style={[
                  styles.countBtn,
                  {
                    backgroundColor:
                      lessonCount === count ? theme.primary : theme.background.secondary,
                    borderColor: lessonCount === count ? theme.primary : theme.border.light,
                  },
                ]}
                onPress={() => setLessonCount(count)}
              >
                <Text
                  style={[
                    styles.countText,
                    { color: lessonCount === count ? '#FFF' : theme.text.primary },
                  ]}
                >
                  {count}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={[styles.estimateRow, { backgroundColor: theme.background.secondary }]}>
            <Clock size={16} color={theme.text.secondary} />
            <Text style={[styles.estimateText, { color: theme.text.secondary }]}>
              Estimated time: ~{lessonCount * 8} minutes
            </Text>
          </View>
        </Animated.View>

        {/* Custom Instructions (Optional) */}
        <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
            <Sparkles size={18} color={theme.primary} /> Custom Instructions (Optional)
          </Text>
          <TextInput
            style={[
              styles.instructionsInput,
              {
                backgroundColor: theme.background.secondary,
                color: theme.text.primary,
                borderColor: theme.border.light,
              },
            ]}
            placeholder="Add specific requirements or focus areas..."
            placeholderTextColor={theme.text.muted}
            value={customInstructions}
            onChangeText={setCustomInstructions}
            multiline
            maxLength={300}
          />
        </Animated.View>

        {/* Generate Button */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(500)}
          style={styles.generateSection}
        >
          {isGenerating ? (
            <View
              style={[styles.progressContainer, { backgroundColor: theme.background.secondary }]}
            >
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.progressTitle, { color: theme.text.primary }]}>
                Generating Your Series...
              </Text>
              <Text style={[styles.progressText, { color: theme.text.secondary }]}>
                Creating lesson {generationStatus.currentLesson} of {generationStatus.totalLessons}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${generationStatus.progress}%`, backgroundColor: theme.primary },
                  ]}
                />
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.generateBtn, !topic.trim() && styles.generateBtnDisabled]}
              onPress={handleGenerate}
              disabled={!topic.trim()}
            >
              <LinearGradient
                colors={topic.trim() ? ['#2ECC71', '#27AE60'] : ['#95A5A6', '#7F8C8D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.generateGradient}
              >
                <Wand2 size={24} color="#FFF" />
                <Text style={styles.generateText}>Generate {lessonCount} Lessons</Text>
                <ChevronRight size={24} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Legal Notice */}
        <Text style={[styles.legalText, { color: theme.text.muted }]}>
          By creating a lesson series, you agree that the content is for educational purposes only.
          AI-generated content may contain inaccuracies and should be verified.
        </Text>
      </ScrollView>
      <CustomModal {...modal.modalProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  premiumDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  upgradeBtn: {
    backgroundColor: '#FFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  upgradeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#667EEA',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  topicInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  categoryScroll: {
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  categoryIcon: {
    fontSize: 18,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  difficultyCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  difficultyIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  difficultyName: {
    fontSize: 13,
    fontWeight: '700',
  },
  difficultyDesc: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  countRow: {
    flexDirection: 'row',
    gap: 12,
  },
  countBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  countText: {
    fontSize: 18,
    fontWeight: '700',
  },
  estimateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
  },
  estimateText: {
    fontSize: 13,
  },
  instructionsInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    borderWidth: 1,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  generateSection: {
    marginTop: 8,
  },
  generateBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  generateBtnDisabled: {
    opacity: 0.6,
  },
  generateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  generateText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  progressContainer: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  progressText: {
    fontSize: 14,
    marginTop: 8,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  legalText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 16,
  },
});
