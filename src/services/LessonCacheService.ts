/**
 * LessonCacheService - Database-first lesson caching
 *
 * Strategy:
 * 1. Check DB cache first (FREE, instant)
 * 2. If cache hit → serve cached lesson + generate cheap personalized intro (50-100 tokens)
 * 3. If cache miss → generate full lesson via AI → cache it for future users
 *
 * Cost savings: ~90% reduction in AI API calls after initial cache warmup
 */

import { supabase } from '../config/supabase';
import i18n from '../i18n';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface CachedLesson {
  id: string;
  title: string;
  theory: string | null;
  questions: any[];
  quality_score: number;
  usage_count: number;
  fromCache: boolean;
  personalizedIntro?: string;
}

export interface CacheLookupResult {
  found: boolean;
  lesson: CachedLesson | null;
  cacheId: string | null;
}

export interface LessonCacheEntry {
  category: string;
  difficulty: string;
  language: string;
  title: string;
  theory: string | null;
  questions: any[];
  question_count: number;
  question_types: string[];
  tags: string[];
  is_ai_generated: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// CACHE SERVICE
// ═══════════════════════════════════════════════════════════════════════════

class LessonCacheService {
  /**
   * PRIMARY METHOD: Try to get a lesson from cache first
   * Returns cached lesson if available, null if cache miss
   */
  async getCachedLesson(
    category: string,
    difficulty: string,
    language?: string,
    excludeIds?: string[],
  ): Promise<CacheLookupResult> {
    const lang = language || this.getContentLanguage();

    try {
      const { data, error } = await supabase.rpc('find_cached_lesson', {
        p_category: category,
        p_difficulty: difficulty,
        p_language: lang,
        p_exclude_ids: excludeIds || [],
      });

      if (error) {
        console.warn('LessonCacheService: RPC error, falling back to direct query', error.message);
        return this.directCacheLookup(category, difficulty, lang, excludeIds);
      }

      if (data && data.length > 0) {
        const cached = data[0];
        console.log(
          `✅ Cache HIT: "${cached.title}" (quality: ${cached.quality_score}, served: ${cached.usage_count}x)`,
        );

        return {
          found: true,
          lesson: {
            id: cached.id,
            title: cached.title,
            theory: cached.theory,
            questions: cached.questions,
            quality_score: cached.quality_score,
            usage_count: cached.usage_count,
            fromCache: true,
          },
          cacheId: cached.id,
        };
      }

      console.log(`❌ Cache MISS: ${category} / ${difficulty} / ${lang}`);
      return { found: false, lesson: null, cacheId: null };
    } catch (err) {
      console.warn('LessonCacheService: getCachedLesson error', err);
      return { found: false, lesson: null, cacheId: null };
    }
  }

  /**
   * Fallback: Direct query if RPC is not available
   */
  private async directCacheLookup(
    category: string,
    difficulty: string,
    language: string,
    excludeIds?: string[],
  ): Promise<CacheLookupResult> {
    try {
      let query = supabase
        .from('lesson_cache')
        .select('id, title, theory, questions, quality_score, usage_count')
        .eq('category', category)
        .eq('difficulty', difficulty)
        .eq('language', language)
        .gt('quality_score', 0.3)
        .order('quality_score', { ascending: false })
        .limit(5);

      if (excludeIds && excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`);
      }

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        return { found: false, lesson: null, cacheId: null };
      }

      // Pick a random lesson from top quality results for variety
      const randomIndex = Math.floor(Math.random() * Math.min(data.length, 3));
      const cached = data[randomIndex];

      return {
        found: true,
        lesson: {
          id: cached.id,
          title: cached.title,
          theory: cached.theory,
          questions: cached.questions,
          quality_score: cached.quality_score,
          usage_count: cached.usage_count,
          fromCache: true,
        },
        cacheId: cached.id,
      };
    } catch (err) {
      console.warn('LessonCacheService: directCacheLookup error', err);
      return { found: false, lesson: null, cacheId: null };
    }
  }

  /**
   * Save a newly generated lesson to cache for future reuse
   */
  async cacheLesson(entry: LessonCacheEntry): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('lesson_cache')
        .upsert(
          {
            category: entry.category,
            difficulty: entry.difficulty,
            language: entry.language,
            title: entry.title,
            theory: entry.theory,
            questions: entry.questions,
            question_count: entry.question_count,
            question_types: entry.question_types,
            tags: entry.tags,
            is_ai_generated: entry.is_ai_generated,
            quality_score: 0.8, // Default quality for new lessons
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'category,difficulty,language,title',
          },
        )
        .select('id')
        .single();

      if (error) {
        console.warn('LessonCacheService: cacheLesson error', error.message);
        return null;
      }

      console.log(`💾 Cached lesson: "${entry.title}" → ${data?.id}`);
      return data?.id || null;
    } catch (err) {
      console.warn('LessonCacheService: cacheLesson unexpected error', err);
      return null;
    }
  }

  /**
   * Record user interaction with a cached lesson (for quality tracking)
   */
  async recordInteraction(
    userId: string,
    cacheId: string,
    score: number,
    completionTimeSeconds: number,
    rating?: -1 | 0 | 1,
  ): Promise<void> {
    try {
      await supabase.from('lesson_cache_interactions').insert({
        user_id: userId,
        lesson_cache_id: cacheId,
        score,
        completion_time_seconds: completionTimeSeconds,
        rating: rating ?? 0,
        completed: true,
      });
    } catch (err) {
      console.warn('LessonCacheService: recordInteraction error', err);
    }
  }

  /**
   * Generate a personalized intro for cached lessons (CHEAP: ~50-100 tokens)
   * This makes cached lessons feel fresh and personal
   */
  generatePersonalizedIntro(
    userName: string | null,
    streak: number,
    topic: string,
    level: string,
  ): string {
    const greetings = [
      i18n.t('cache.greeting_1', { defaultValue: "Let's keep learning!" }),
      i18n.t('cache.greeting_2', { defaultValue: 'Ready for a new challenge?' }),
      i18n.t('cache.greeting_3', { defaultValue: 'Time to level up!' }),
      i18n.t('cache.greeting_4', { defaultValue: "Let's master this topic!" }),
    ];

    const streakMessages =
      streak > 0
        ? [
            i18n.t('cache.streak_msg', {
              count: streak,
              defaultValue: `🔥 ${streak} day streak! Keep it up!`,
            }),
          ]
        : [];

    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    const streakMsg = streakMessages.length > 0 ? `\n${streakMessages[0]}` : '';

    return `${greeting}${streakMsg}`;
  }

  /**
   * Get user's recently completed cached lesson IDs
   * Used to exclude from cache lookup (avoid repeats)
   */
  async getRecentlyServedIds(userId: string, limit: number = 10): Promise<string[]> {
    try {
      const { data } = await supabase
        .from('lesson_cache_interactions')
        .select('lesson_cache_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      return data?.map((r) => r.lesson_cache_id) || [];
    } catch {
      return [];
    }
  }

  /**
   * Get the appropriate content language
   * Based on the user's i18n locale
   */
  getContentLanguage(): string {
    return i18n.locale?.split('-')[0] || 'en';
  }

  /**
   * Get language name for AI prompts
   */
  getLanguageName(): string {
    const langMap: Record<string, string> = {
      tr: 'Turkish',
      en: 'English',
      de: 'German',
      fr: 'French',
      es: 'Spanish',
      pt: 'Portuguese',
      it: 'Italian',
      nl: 'Dutch',
      ru: 'Russian',
      uk: 'Ukrainian',
      pl: 'Polish',
      cs: 'Czech',
      ro: 'Romanian',
      hu: 'Hungarian',
      sv: 'Swedish',
      no: 'Norwegian',
      da: 'Danish',
      fi: 'Finnish',
      el: 'Greek',
      zh: 'Chinese',
      ja: 'Japanese',
      ko: 'Korean',
      ar: 'Arabic',
      he: 'Hebrew',
      fa: 'Persian',
      hi: 'Hindi',
      bn: 'Bengali',
      th: 'Thai',
      vi: 'Vietnamese',
      id: 'Indonesian',
      ms: 'Malay',
      tl: 'Filipino',
      sw: 'Swahili',
    };
    const code = this.getContentLanguage();
    return langMap[code] || 'English';
  }

  /**
   * Extract question types from a questions array
   */
  extractQuestionTypes(questions: any[]): string[] {
    const types = new Set<string>();
    questions.forEach((q) => {
      if (q.type) types.add(q.type);
    });
    return Array.from(types);
  }

  /**
   * Extract tags from category and content
   */
  extractTags(category: string, title: string): string[] {
    const tags: string[] = [];
    // Add category parts as tags
    category.split('/').forEach((part) => {
      tags.push(part.toLowerCase().trim());
    });
    // Add significant title words
    title.split(/\s+/).forEach((word) => {
      if (word.length > 3) tags.push(word.toLowerCase());
    });
    return [...new Set(tags)];
  }

  /**
   * Get cache statistics (for analytics/debugging)
   */
  async getCacheStats(): Promise<{
    totalCached: number;
    avgQuality: number;
    totalServed: number;
    topCategories: { category: string; count: number }[];
  }> {
    try {
      const { data, error } = await supabase
        .from('lesson_cache')
        .select('category, quality_score, usage_count');

      if (error || !data) {
        return { totalCached: 0, avgQuality: 0, totalServed: 0, topCategories: [] };
      }

      const totalCached = data.length;
      const avgQuality =
        data.reduce((sum, l) => sum + (l.quality_score || 0), 0) / (totalCached || 1);
      const totalServed = data.reduce((sum, l) => sum + (l.usage_count || 0), 0);

      // Count by category
      const catCounts: Record<string, number> = {};
      data.forEach((l) => {
        catCounts[l.category] = (catCounts[l.category] || 0) + 1;
      });
      const topCategories = Object.entries(catCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return { totalCached, avgQuality, totalServed, topCategories };
    } catch {
      return { totalCached: 0, avgQuality: 0, totalServed: 0, topCategories: [] };
    }
  }
}

export const lessonCacheService = new LessonCacheService();
export default lessonCacheService;
