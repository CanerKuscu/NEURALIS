/**
 * DeepSeekService - AI Lesson Generation
 * Generates personalized lessons using DeepSeek API via Supabase Edge Functions
 */

import { supabase } from '../config/supabase';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface Question {
    id: string;
    type: 'multiple_choice' | 'fill_blank' | 'true_false' | 'matching' | 'translate';
    question: string;
    options?: string[];
    correctAnswer: string | number;
    explanation: string;
    difficulty: 'easy' | 'medium' | 'hard';
    points: number;
}

export interface GeneratedLesson {
    id: string;
    title: string;
    description: string;
    category: string;
    topic: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    questions: Question[];
    estimatedMinutes: number;
    xpReward: number;
    createdAt: string;
}

export interface LessonRequest {
    userId: string;
    category: string;
    topic?: string;
    customPrompt?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    questionCount?: number;
    focusOnWeaknesses?: boolean;
}

export interface UserProgress {
    category: string;
    topic: string;
    correctCount: number;
    wrongCount: number;
    averageTime: number;
    lastAttempt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEEPSEEK SERVICE
// ═══════════════════════════════════════════════════════════════════════════

const LIVES_CONFIG = {
    maxLives: 5,
    regenerationMinutes: 288, // 24 hours / 5 lives = 4.8 hours
} as const;

export interface LessonAvailabilityResult {
    canGenerate: boolean;
    currentLives: number;
    maxLives: number;
    isPremium: boolean;
    message?: string;
    minutesUntilNextLife?: number;
}

class DeepSeekService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
    }

    /**
     * Check if user can generate a lesson
     * Free: 5 lives / 24h
     * Premium: Unlimited
     */
    async checkLessonAvailability(userId: string): Promise<LessonAvailabilityResult> {
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('is_premium, subscription, current_lives, last_lost_at, updated_at')
                .eq('id', userId)
                .single();

            if (error) throw error;

            const isPremium = profile?.is_premium || profile?.subscription === 'premium';

            if (isPremium) {
                return {
                    canGenerate: true,
                    currentLives: LIVES_CONFIG.maxLives,
                    maxLives: LIVES_CONFIG.maxLives,
                    isPremium: true,
                };
            }

            const regeneratedLives = this.calculateRegeneratedLives(profile);
            const currentLives = Math.min(regeneratedLives, LIVES_CONFIG.maxLives);

            const minutesUntilNextLife = currentLives < LIVES_CONFIG.maxLives
                ? this.calculateMinutesUntilNextLife(profile?.last_lost_at)
                : undefined;

            return {
                canGenerate: currentLives > 0,
                currentLives,
                maxLives: LIVES_CONFIG.maxLives,
                isPremium: false,
                message: currentLives === 0
                    ? 'Out of lives! Watch an ad or upgrade to Premium for unlimited lessons.'
                    : undefined,
                minutesUntilNextLife,
            };
        } catch (error) {
            console.error('Lesson availability check failed:', error);
            // Default to allow if check fails to avoid blocking users
            return {
                canGenerate: true,
                currentLives: 1,
                maxLives: LIVES_CONFIG.maxLives,
                isPremium: false,
            };
        }
    }

    /**
     * Consume a life when lesson is generated
     */
    async consumeLifeForLesson(userId: string): Promise<boolean> {
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('is_premium, subscription, current_lives')
                .eq('id', userId)
                .single();

            if (profile?.is_premium || profile?.subscription === 'premium') {
                return true;
            }

            const newLives = Math.max(0, (profile?.current_lives || 0) - 1);

            await supabase
                .from('profiles')
                .update({
                    current_lives: newLives,
                    last_lost_at: new Date().toISOString(),
                })
                .eq('id', userId);

            return true;
        } catch (error) {
            console.error('Failed to consume life:', error);
            return false;
        }
    }

    private calculateRegeneratedLives(profile: any): number {
        if (!profile?.last_lost_at) {
            return profile?.current_lives ?? LIVES_CONFIG.maxLives;
        }

        const lastLostTime = new Date(profile.last_lost_at).getTime();
        const now = Date.now();
        const minutesPassed = (now - lastLostTime) / (1000 * 60);
        const livesRegenerated = Math.floor(minutesPassed / LIVES_CONFIG.regenerationMinutes);

        return Math.min(
            (profile?.current_lives ?? 0) + livesRegenerated,
            LIVES_CONFIG.maxLives
        );
    }

    private calculateMinutesUntilNextLife(lastLostAt: string | null): number {
        if (!lastLostAt) return 0;

        const lastLostTime = new Date(lastLostAt).getTime();
        const now = Date.now();
        const minutesPassed = (now - lastLostTime) / (1000 * 60);
        const minutesInCurrentCycle = minutesPassed % LIVES_CONFIG.regenerationMinutes;

        return Math.ceil(LIVES_CONFIG.regenerationMinutes - minutesInCurrentCycle);
    }

    /**
     * Generate personalized lesson
     */
    async generateLesson(request: LessonRequest): Promise<GeneratedLesson> {
        try {
            const userProgress = await this.getUserProgress(request.userId, request.category);
            const difficulty = request.difficulty || this.calculateOptimalDifficulty(userProgress);

            const prompt = this.buildLessonPrompt({
                ...request,
                difficulty,
                userProgress,
            });

            const { data, error } = await supabase.functions.invoke('generate-lesson', {
                body: {
                    prompt,
                    category: request.category,
                    topic: request.topic || request.customPrompt,
                    difficulty,
                    questionCount: request.questionCount || 5,
                    userId: request.userId,
                },
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            await this.saveLesson(request.userId, data.lesson);

            return data.lesson;
        } catch (error) {
            console.error('Lesson generation failed:', error);
            throw error;
        }
    }

    async generateCustomLesson(
        userId: string,
        customTopic: string,
        additionalContext?: string
    ): Promise<GeneratedLesson> {
        const isTopicSafe = await this.checkTopicSafety(customTopic);
        if (!isTopicSafe) {
            throw new Error('This topic is not appropriate.');
        }

        return this.generateLesson({
            userId,
            category: 'custom',
            customPrompt: customTopic,
            focusOnWeaknesses: false,
        });
    }

    private async getUserProgress(userId: string, category: string): Promise<UserProgress[]> {
        try {
            const { data, error } = await supabase
                .from('user_progress')
                .select('*')
                .eq('user_id', userId)
                .eq('category', category)
                .order('last_attempt', { ascending: false })
                .limit(20);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.warn('Could not fetch user progress:', error);
            return [];
        }
    }

    private calculateOptimalDifficulty(
        progress: UserProgress[]
    ): 'beginner' | 'intermediate' | 'advanced' {
        if (progress.length === 0) return 'beginner';

        const recentProgress = progress.slice(0, 10);
        const totalCorrect = recentProgress.reduce((sum, p) => sum + p.correctCount, 0);
        const totalWrong = recentProgress.reduce((sum, p) => sum + p.wrongCount, 0);
        const total = totalCorrect + totalWrong;

        if (total === 0) return 'beginner';

        const accuracy = totalCorrect / total;

        if (accuracy >= 0.85) return 'advanced';
        if (accuracy >= 0.60) return 'intermediate';
        return 'beginner';
    }

    private buildLessonPrompt(params: {
        category: string;
        topic?: string;
        customPrompt?: string;
        difficulty: string;
        userProgress: UserProgress[];
        questionCount?: number;
    }): string {
        const { category, topic, customPrompt, difficulty, userProgress, questionCount = 5 } = params;

        const weakTopics = userProgress
            .filter(p => p.wrongCount > p.correctCount)
            .map(p => p.topic)
            .slice(0, 3);

        let prompt = `
You are an educational content creator. Create a lesson based on:

CATEGORY: ${category}
${topic ? `TOPIC: ${topic}` : ''}
${customPrompt ? `CUSTOM TOPIC: ${customPrompt}` : ''}
DIFFICULTY: ${difficulty}
QUESTION COUNT: ${questionCount}

${weakTopics.length > 0 ? `
FOCUS ON WEAK AREAS:
${weakTopics.join(', ')}
` : ''}

RULES:
1. Questions must be educational and engaging
2. Wrong answers must be plausible but incorrect
3. Detailed explanation for every question
4. Order from easy to hard
5. Use encouraging language
6. LANGUAGE: ENGLISH

Response JSON format:
{
  "title": "Lesson Title",
  "description": "Short description",
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "Explanation of the answer",
      "difficulty": "easy",
      "points": 10
    }
  ],
  "estimatedMinutes": 5,
  "xpReward": 50
}
`;
        return prompt;
    }

    private async saveLesson(userId: string, lesson: GeneratedLesson): Promise<void> {
        try {
            await supabase.from('lessons').insert({
                id: lesson.id,
                user_id: userId,
                title: lesson.title,
                description: lesson.description,
                category: lesson.category,
                topic: lesson.topic,
                difficulty: lesson.difficulty,
                questions: lesson.questions,
                estimated_minutes: lesson.estimatedMinutes,
                xp_reward: lesson.xpReward,
                created_at: new Date().toISOString(),
            });
        } catch (error) {
            console.warn('Could not save lesson:', error);
        }
    }

    private async checkTopicSafety(topic: string): Promise<boolean> {
        const bannedKeywords = [
            'weapon', 'drug', 'hack', 'illegal', 'bomb', 'terror', 'porn', 'nudity'
        ];

        const lowerTopic = topic.toLowerCase();
        return !bannedKeywords.some(word => lowerTopic.includes(word));
    }

    async saveLessonResult(
        userId: string,
        lessonId: string,
        results: {
            correctCount: number;
            wrongCount: number;
            timeSpent: number;
            answers: { questionId: string; isCorrect: boolean; userAnswer: string }[];
        }
    ): Promise<{ xpEarned: number; newStreak: boolean }> {
        try {
            const { data: progressData, error: progressError } = await supabase
                .from('lesson_results')
                .insert({
                    user_id: userId,
                    lesson_id: lessonId,
                    correct_count: results.correctCount,
                    wrong_count: results.wrongCount,
                    time_spent: results.timeSpent,
                    answers: results.answers,
                    completed_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (progressError) throw progressError;

            const accuracy = results.correctCount / (results.correctCount + results.wrongCount);
            const baseXP = 50;
            const accuracyBonus = Math.floor(accuracy * 30);
            const speedBonus = results.timeSpent < 180 ? 20 : 0;
            const xpEarned = baseXP + accuracyBonus + speedBonus;

            await supabase.rpc('add_user_xp', {
                p_user_id: userId,
                p_xp_amount: xpEarned,
            });

            const { data: streakData } = await supabase
                .from('streaks')
                .select('*')
                .eq('user_id', userId)
                .single();

            const now = new Date();
            const lastActivity = streakData?.last_activity_date
                ? new Date(streakData.last_activity_date)
                : null;

            let newStreak = false;
            if (!lastActivity || this.isNewDay(lastActivity, now)) {
                newStreak = true;
                await supabase.from('streaks').upsert({
                    user_id: userId,
                    current_streak: (streakData?.current_streak || 0) + 1,
                    last_activity_date: now.toISOString(),
                });
            }

            return { xpEarned, newStreak };
        } catch (error) {
            console.error('Failed to save lesson result:', error);
            throw error;
        }
    }

    private isNewDay(lastDate: Date, currentDate: Date): boolean {
        return lastDate.toDateString() !== currentDate.toDateString();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FALLBACK LESSONS (Static, used when AI is unavailable)
    // ═══════════════════════════════════════════════════════════════════════════

    private static FALLBACK_LESSONS: Record<string, GeneratedLesson> = {
        default: {
            id: 'fallback_default',
            title: 'Genel Kültür Pratik Seti',
            description: 'AI şu an meşgul, işte sana genel bir pratik seti!',
            category: 'general',
            topic: 'Genel Kültür',
            difficulty: 'beginner',
            estimatedMinutes: 5,
            xpReward: 40,
            createdAt: new Date().toISOString(),
            questions: [
                {
                    id: 'fb_q1', type: 'multiple_choice',
                    question: 'Dünyanın en büyük okyanusu hangisidir?',
                    options: ['Atlantik Okyanusu', 'Pasifik Okyanusu', 'Hint Okyanusu', 'Kuzey Buz Denizi'],
                    correctAnswer: 1, explanation: 'Pasifik Okyanusu, dünya yüzeyinin yaklaşık üçte birini kaplar ve en büyük okyanustur.',
                    difficulty: 'easy', points: 10
                },
                {
                    id: 'fb_q2', type: 'true_false',
                    question: 'Ay, Dünya\'nın tek doğal uydusudur.',
                    options: ['Doğru', 'Yanlış'],
                    correctAnswer: 0, explanation: 'Evet, Ay Dünya\'nın bilinen tek doğal uydusudur.',
                    difficulty: 'easy', points: 10
                },
                {
                    id: 'fb_q3', type: 'multiple_choice',
                    question: 'İnsan vücudundaki en büyük organ hangisidir?',
                    options: ['Karaciğer', 'Beyin', 'Deri', 'Akciğer'],
                    correctAnswer: 2, explanation: 'Deri, yaklaşık 2 m² yüzey alanıyla vücudun en büyük organıdır.',
                    difficulty: 'medium', points: 15
                },
                {
                    id: 'fb_q4', type: 'multiple_choice',
                    question: 'Hangisi bir programlama dili değildir?',
                    options: ['Python', 'HTML', 'Java', 'Photoshop'],
                    correctAnswer: 3, explanation: 'Photoshop bir görüntü düzenleme yazılımıdır, programlama dili değildir. (Not: HTML de tartışmalıdır ama seçeneklerde Photoshop açıkça yazılım.)',
                    difficulty: 'medium', points: 15
                },
                {
                    id: 'fb_q5', type: 'true_false',
                    question: 'Işık, sesten daha hızlı hareket eder.',
                    options: ['Doğru', 'Yanlış'],
                    correctAnswer: 0, explanation: 'Işık saniyede ~300.000 km hızla hareket ederken, ses saniyede ~343 m hızla hareket eder.',
                    difficulty: 'easy', points: 10
                },
            ],
        },
    };

    /**
     * Get a static fallback lesson when AI is unavailable
     */
    getFallbackLesson(category?: string, difficulty?: string): GeneratedLesson {
        const fallback = DeepSeekService.FALLBACK_LESSONS[category || '']
            || DeepSeekService.FALLBACK_LESSONS['default'];
        return {
            ...fallback,
            id: `fallback_${Date.now()}`,
            category: category || 'general',
            difficulty: (difficulty as any) || 'beginner',
            createdAt: new Date().toISOString(),
        };
    }
}

export const deepSeekService = new DeepSeekService();
export default deepSeekService;
