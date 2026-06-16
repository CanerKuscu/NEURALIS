/**
 * CustomLessonGenerator - Light Theme
 * Modern Zen Design with Independent Topic Streaks
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Wand2, Flame, Clock, Trophy, ChevronRight, Plus } from 'lucide-react-native';
import { useSubscription } from '../providers/SubscriptionProvider';
import { supabase } from '../config/supabase';
import type { TopicStreak } from '../services/TopicStreakService';
import { topicStreakService } from '../services/TopicStreakService';
import { CustomModal, useModal } from './CustomModal';

interface CustomLessonGeneratorProps {
  showTopicList?: boolean;
}

const CustomLessonGenerator: React.FC<CustomLessonGeneratorProps> = ({ showTopicList = true }) => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [userTopics, setUserTopics] = useState<TopicStreak[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const navigation = useNavigation<any>();
  const { isPro, isElite, purchasePackage, getAvailablePackages } = useSubscription();
  const modal = useModal();

  // Fetch user's existing topics with streaks
  useEffect(() => {
    if (showTopicList && (isPro || isElite)) {
      loadUserTopics();
    }
  }, [isPro, isElite, showTopicList]);

  const loadUserTopics = async () => {
    setLoadingTopics(true);
    try {
      const session = await supabase.auth.getSession();
      const userId = session.data?.session?.user?.id;
      if (userId) {
        const topics = await topicStreakService.getActiveTopics(userId, 30);
        setUserTopics(topics);
      }
    } catch (e) {
      // Silent fail
    } finally {
      setLoadingTopics(false);
    }
  };

  const generateLesson = async (userTopic: string, existingTopicId?: string) => {
    if (!(isPro || isElite)) {
      const packages = getAvailablePackages ? getAvailablePackages() : [];
      if (purchasePackage && packages.length > 0) {
        purchasePackage(packages[0]);
      } else {
        modal.error('Premium Required', 'Premium membership is required for this feature.');
      }
      return;
    }
    setLoading(true);
    try {
      const sessionRes = await supabase.auth.getSession();
      const session = sessionRes.data?.session;
      const userId = session?.user?.id;
      let lessonData: any = null;
      let topicId = existingTopicId;

      // Get or create topic for streak tracking
      if (userId && !topicId) {
        const topicRecord = await topicStreakService.getOrCreateTopic(userId, userTopic);
        topicId = topicRecord?.id;
      }

      if (userId) {
        try {
          const { data, error } = await supabase.functions.invoke('generate-lesson', {
            body: { topic: userTopic, userId },
          });
          if (!error && data) {
            lessonData = typeof data === 'string' ? JSON.parse(data) : data;
          }
        } catch (e) {}
      }

      if (!lessonData) {
        lessonData = {
          title: `${userTopic}`,
          theory: `A short summary about ${userTopic}.`,
          questions: [
            {
              question: `What is ${userTopic}?`,
              options: ['Basic concept', 'Irrelevant', 'Myth', 'None'],
              correctAnswer: 'Basic concept',
            },
            {
              question: 'Which method is effective?',
              options: ['Active recall', 'Passive', 'Guessing', 'None'],
              correctAnswer: 'Active recall',
            },
          ],
        };
      }

      // Add topic tracking info to lesson data
      lessonData.topicId = topicId;
      lessonData.topicName = userTopic;

      setLoading(false);
      setTopic(''); // Clear input
      navigation.navigate('DynamicLesson', { lesson: lessonData });
    } catch (err: any) {
      setLoading(false);
      modal.error('Error', err?.message || 'An unexpected error occurred.');
    }
  };

  const continueTopicLesson = (topicStreak: TopicStreak) => {
    generateLesson(topicStreak.topic, topicStreak.id);
  };

  const isStreakAtRisk = (topic: TopicStreak) => topicStreakService.isStreakAtRisk(topic);
  const didLessonToday = (topic: TopicStreak) => topicStreakService.didLessonToday(topic);

  return (
    <View style={styles.container}>
      {/* New Topic Generator Card */}
      <LinearGradient
        colors={['#2ECC71', '#27AE60']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.header}>
          <Wand2 size={24} color="#FFF" />
          <Text style={styles.title}>AI Lesson Generator</Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Enter any topic..."
          placeholderTextColor="rgba(255,255,255,0.7)"
          value={topic}
          onChangeText={setTopic}
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, (!topic.trim() || loading) && styles.buttonDisabled]}
          onPress={() => generateLesson(topic)}
          disabled={loading || !topic.trim()}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#2ECC71" />
          ) : (
            <View style={styles.buttonContent}>
              <Plus size={18} color="#2ECC71" />
              <Text style={styles.buttonText}>Start New Topic</Text>
            </View>
          )}
        </TouchableOpacity>
      </LinearGradient>

      {/* Active Topics with Streaks */}
      {showTopicList && userTopics.length > 0 && (
        <View style={styles.topicsSection}>
          <Text style={styles.sectionTitle}>Your Learning Streaks</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.topicsScroll}
          >
            {userTopics.map((topicStreak) => (
              <TouchableOpacity
                key={topicStreak.id}
                style={[
                  styles.topicCard,
                  isStreakAtRisk(topicStreak) && styles.topicCardAtRisk,
                  didLessonToday(topicStreak) && styles.topicCardCompleted,
                ]}
                onPress={() => continueTopicLesson(topicStreak)}
                disabled={loading}
              >
                <View style={styles.topicHeader}>
                  <Text style={styles.topicName} numberOfLines={2}>
                    {topicStreak.topic}
                  </Text>
                  {isStreakAtRisk(topicStreak) && !didLessonToday(topicStreak) && (
                    <View style={styles.riskBadge}>
                      <Clock size={10} color="#FF6B6B" />
                    </View>
                  )}
                </View>

                <View style={styles.topicStats}>
                  <View style={styles.statItem}>
                    <Flame size={16} color={topicStreak.streakCount > 0 ? '#FF9500' : '#8B9A9B'} />
                    <Text
                      style={[
                        styles.statValue,
                        topicStreak.streakCount > 0 && styles.statValueActive,
                      ]}
                    >
                      {topicStreak.streakCount}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Trophy size={14} color="#FFD700" />
                    <Text style={styles.statValueSmall}>{topicStreak.bestStreak}</Text>
                  </View>
                </View>

                <View style={styles.topicFooter}>
                  <Text style={styles.lessonCount}>
                    {topicStreak.totalLessonsCompleted} lessons
                  </Text>
                  <ChevronRight size={16} color="#58CC02" />
                </View>

                {didLessonToday(topicStreak) && (
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {loadingTopics && (
        <View style={styles.loadingTopics}>
          <ActivityIndicator size="small" color="#2ECC71" />
          <Text style={styles.loadingText}>Loading your topics...</Text>
        </View>
      )}
      <CustomModal {...modal.modalProps} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#FFF',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2ECC71',
  },
  // Topics Section
  topicsSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C2526',
    marginBottom: 12,
  },
  topicsScroll: {
    gap: 12,
    paddingRight: 16,
  },
  topicCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    width: 140,
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  topicCardAtRisk: {
    borderColor: '#FF9500',
  },
  topicCardCompleted: {
    borderColor: '#58CC02',
    opacity: 0.8,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  topicName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C2526',
    flex: 1,
  },
  riskBadge: {
    backgroundColor: '#FFF0F0',
    padding: 4,
    borderRadius: 8,
    marginLeft: 4,
  },
  topicStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B9A9B',
  },
  statValueActive: {
    color: '#FF9500',
  },
  statValueSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B9A9B',
  },
  topicFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  lessonCount: {
    fontSize: 11,
    color: '#8B9A9B',
  },
  completedBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#58CC02',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  completedText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingTopics: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  loadingText: {
    fontSize: 13,
    color: '#8B9A9B',
  },
});

export default CustomLessonGenerator;
