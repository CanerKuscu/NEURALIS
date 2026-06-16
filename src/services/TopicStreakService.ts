/**
 * Custom Lesson Streak Service
 * Manages independent streaks for each custom lesson topic
 */

import { supabase } from '../config/supabase';

export interface TopicStreak {
  id: string;
  topic: string;
  normalizedTopic: string;
  category: string;
  streakCount: number;
  bestStreak: number;
  totalLessonsCompleted: number;
  totalXpEarned: number;
  lastLessonAt: string | null;
  createdAt: string;
}

export interface LessonCompletion {
  topicId: string;
  lessonId: string;
  score: number;
  xpEarned: number;
  timeSpentSeconds: number;
}

class TopicStreakService {
  /**
   * Get or create a topic for the user
   */
  async getOrCreateTopic(
    userId: string,
    topic: string,
    category: string = 'custom',
  ): Promise<TopicStreak | null> {
    const normalizedTopic = topic.toLowerCase().trim();

    // Try to find existing topic
    const { data: existing } = await supabase
      .from('user_lesson_topics')
      .select('*')
      .eq('user_id', userId)
      .eq('normalized_topic', normalizedTopic)
      .single();

    if (existing) {
      return this.mapToTopicStreak(existing);
    }

    // Create new topic
    const { data: created, error } = await supabase
      .from('user_lesson_topics')
      .insert({
        user_id: userId,
        topic: topic.trim(),
        normalized_topic: normalizedTopic,
        category,
      })
      .select()
      .single();

    if (error) {
      console.error('[TopicStreakService] Error creating topic:', error);
      return null;
    }

    return this.mapToTopicStreak(created);
  }

  /**
   * Get all topics with streaks for a user
   */
  async getUserTopics(userId: string): Promise<TopicStreak[]> {
    const { data, error } = await supabase
      .from('user_lesson_topics')
      .select('*')
      .eq('user_id', userId)
      .order('last_lesson_at', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('[TopicStreakService] Error fetching topics:', error);
      return [];
    }

    return (data || []).map(this.mapToTopicStreak);
  }

  /**
   * Get active topics (with recent activity)
   */
  async getActiveTopics(userId: string, daysAgo: number = 7): Promise<TopicStreak[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

    const { data, error } = await supabase
      .from('user_lesson_topics')
      .select('*')
      .eq('user_id', userId)
      .gte('last_lesson_at', cutoffDate.toISOString())
      .order('streak_count', { ascending: false });

    if (error) {
      console.error('[TopicStreakService] Error fetching active topics:', error);
      return [];
    }

    return (data || []).map(this.mapToTopicStreak);
  }

  /**
   * Get topic by ID
   */
  async getTopic(topicId: string): Promise<TopicStreak | null> {
    const { data, error } = await supabase
      .from('user_lesson_topics')
      .select('*')
      .eq('id', topicId)
      .single();

    if (error) {
      console.error('[TopicStreakService] Error fetching topic:', error);
      return null;
    }

    return this.mapToTopicStreak(data);
  }

  /**
   * Record a lesson completion (this triggers the streak update via DB trigger)
   */
  async recordLessonCompletion(userId: string, completion: LessonCompletion): Promise<boolean> {
    const { error } = await supabase.from('topic_lesson_history').insert({
      user_id: userId,
      topic_id: completion.topicId,
      lesson_id: completion.lessonId,
      score: completion.score,
      xp_earned: completion.xpEarned,
      time_spent_seconds: completion.timeSpentSeconds,
    });

    if (error) {
      console.error('[TopicStreakService] Error recording completion:', error);
      return false;
    }

    return true;
  }

  /**
   * Get lesson history for a topic
   */
  async getTopicHistory(topicId: string, limit: number = 20) {
    const { data, error } = await supabase
      .from('topic_lesson_history')
      .select('*')
      .eq('topic_id', topicId)
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[TopicStreakService] Error fetching history:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Check if streak is at risk (no lesson today or yesterday).
   * Uses local-time YYYY-MM-DD on both sides to avoid TZ-vs-UTC drift.
   */
  isStreakAtRisk(topic: TopicStreak): boolean {
    if (!topic.lastLessonAt) return false;

    const lastLessonDate = this.toLocalDateKey(new Date(topic.lastLessonAt));
    const todayDate = this.toLocalDateKey(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = this.toLocalDateKey(yesterday);

    if (lastLessonDate === todayDate) return false;
    if (lastLessonDate === yesterdayDate) return true;
    return false;
  }

  /**
   * Check if user did a lesson today for a topic.
   * Both sides normalized to local-time YYYY-MM-DD.
   */
  didLessonToday(topic: TopicStreak): boolean {
    if (!topic.lastLessonAt) return false;
    return this.toLocalDateKey(new Date(topic.lastLessonAt)) === this.toLocalDateKey(new Date());
  }

  private toLocalDateKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  /**
   * Get user's top streaks
   */
  async getTopStreaks(userId: string, limit: number = 5): Promise<TopicStreak[]> {
    const { data, error } = await supabase
      .from('user_lesson_topics')
      .select('*')
      .eq('user_id', userId)
      .gt('streak_count', 0)
      .order('streak_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[TopicStreakService] Error fetching top streaks:', error);
      return [];
    }

    return (data || []).map(this.mapToTopicStreak);
  }

  /**
   * Get suggested topics based on user's history
   */
  async getSuggestedTopics(userId: string): Promise<string[]> {
    const topics = await this.getUserTopics(userId);

    // Get topics with broken streaks that had good progress
    const brokenStreaks = topics
      .filter((t) => !this.didLessonToday(t) && t.bestStreak >= 3)
      .map((t) => t.topic);

    // Return topics that need attention
    return brokenStreaks.slice(0, 3);
  }

  /**
   * Delete a topic and all its history
   */
  async deleteTopic(topicId: string): Promise<boolean> {
    const { error } = await supabase.from('user_lesson_topics').delete().eq('id', topicId);

    if (error) {
      console.error('[TopicStreakService] Error deleting topic:', error);
      return false;
    }

    return true;
  }

  /**
   * Map database row to TopicStreak interface
   */
  private mapToTopicStreak(row: any): TopicStreak {
    return {
      id: row.id,
      topic: row.topic,
      normalizedTopic: row.normalized_topic,
      category: row.category,
      streakCount: row.streak_count,
      bestStreak: row.best_streak,
      totalLessonsCompleted: row.total_lessons_completed,
      totalXpEarned: row.total_xp_earned,
      lastLessonAt: row.last_lesson_at,
      createdAt: row.created_at,
    };
  }
}

export const topicStreakService = new TopicStreakService();
export default topicStreakService;
