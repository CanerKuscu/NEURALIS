/**
 * Lesson Series Service - Premium Feature
 * AI-powered lesson series generation and management
 */

import { supabase } from '../config/supabase';
import {
    LessonSeries,
    Lesson,
    CreateSeriesRequest,
    SeriesGenerationStatus,
    LessonQuestion,
} from '../types/lessonSeries';

class LessonSeriesService {
    /**
     * Create a new lesson series with AI
     */
    async createSeries(request: CreateSeriesRequest): Promise<LessonSeries | null> {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user?.id) {
                throw new Error('User must be authenticated');
            }

            const userId = session.user.id;
            const seriesId = `series_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Create series record
            const series: LessonSeries = {
                id: seriesId,
                userId,
                title: `${request.topic} Series`,
                description: `A comprehensive ${request.lessonCount}-lesson series about ${request.topic}`,
                topic: request.topic,
                totalLessons: request.lessonCount,
                completedLessons: 0,
                difficulty: request.difficulty,
                category: request.category,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isPublic: request.isPublic,
                lessons: [],
                totalXP: request.lessonCount * 50, // 50 XP per lesson
                earnedXP: 0,
                progress: 0,
                tags: [request.topic.toLowerCase(), request.category, request.difficulty],
            };

            // Save to Supabase
            const { error: seriesError } = await supabase
                .from('lesson_series')
                .insert({
                    id: series.id,
                    user_id: series.userId,
                    title: series.title,
                    description: series.description,
                    topic: series.topic,
                    total_lessons: series.totalLessons,
                    completed_lessons: 0,
                    difficulty: series.difficulty,
                    category: series.category,
                    is_public: series.isPublic,
                    total_xp: series.totalXP,
                    earned_xp: 0,
                    progress: 0,
                    tags: series.tags,
                    custom_instructions: request.customInstructions || null,
                });

            if (seriesError) {
                console.error('Error creating series:', seriesError);
                // Continue anyway with local series
            }

            return series;
        } catch (error) {
            console.error('Error in createSeries:', error);
            return null;
        }
    }

    /**
     * Generate lessons for a series using AI
     */
    async generateLessonsForSeries(
        seriesId: string,
        topic: string,
        lessonCount: number,
        difficulty: string,
        customInstructions?: string,
        onProgress?: (status: SeriesGenerationStatus) => void
    ): Promise<Lesson[]> {
        const lessons: Lesson[] = [];

        for (let i = 0; i < lessonCount; i++) {
            onProgress?.({
                status: 'generating',
                progress: Math.round((i / lessonCount) * 100),
                currentLesson: i + 1,
                totalLessons: lessonCount,
            });

            try {
                // Try to generate with AI
                const { data: { session } } = await supabase.auth.getSession();
                let lessonData = null;

                if (session?.user?.id) {
                    try {
                        const { data, error } = await supabase.functions.invoke('generate-lesson', {
                            body: {
                                topic: `${topic} - Part ${i + 1}`,
                                userId: session.user.id,
                                seriesContext: {
                                    seriesId,
                                    lessonNumber: i + 1,
                                    totalLessons: lessonCount,
                                    difficulty,
                                    customInstructions,
                                },
                            },
                        });

                        if (!error && data) {
                            lessonData = typeof data === 'string' ? JSON.parse(data) : data;
                        }
                    } catch (e) {
                        console.log('AI generation failed, using fallback');
                    }
                }

                // Fallback lesson data
                if (!lessonData) {
                    lessonData = this.generateFallbackLesson(topic, i + 1, lessonCount, difficulty);
                }

                const lesson: Lesson = {
                    id: `lesson_${seriesId}_${i + 1}`,
                    seriesId,
                    title: lessonData.title || `${topic} - Lesson ${i + 1}`,
                    description: lessonData.description || `Part ${i + 1} of ${lessonCount}`,
                    theory: lessonData.theory || `Learn about ${topic} in this lesson.`,
                    questions: this.formatQuestions(lessonData.questions || [], `lesson_${seriesId}_${i + 1}`),
                    order: i + 1,
                    difficulty: difficulty as 'beginner' | 'intermediate' | 'advanced',
                    estimatedMinutes: 5 + Math.floor(Math.random() * 10),
                    xpReward: 50,
                    completed: false,
                };

                lessons.push(lesson);

                // Save lesson to database
                await this.saveLesson(lesson);

            } catch (error) {
                console.error(`Error generating lesson ${i + 1}:`, error);
            }
        }

        onProgress?.({
            status: 'complete',
            progress: 100,
            currentLesson: lessonCount,
            totalLessons: lessonCount,
        });

        return lessons;
    }

    /**
     * Generate fallback lesson when AI is unavailable
     */
    private generateFallbackLesson(topic: string, lessonNumber: number, totalLessons: number, difficulty: string) {
        const difficultyModifier = difficulty === 'beginner' ? 'basic' : difficulty === 'advanced' ? 'advanced' : 'intermediate';

        return {
            title: `${topic}: Part ${lessonNumber}`,
            description: `Lesson ${lessonNumber} of ${totalLessons} - ${difficultyModifier} level`,
            theory: `This lesson covers ${difficultyModifier} concepts about ${topic}. You'll learn key principles and practice with interactive questions.\n\n**Key Points:**\n- Understanding the fundamentals\n- Applying knowledge practically\n- Building on previous lessons`,
            questions: [
                {
                    question: `What is a key concept in ${topic}?`,
                    options: ['Core principle', 'Unrelated idea', 'Random guess', 'None of above'],
                    correctAnswer: 'Core principle',
                    explanation: 'Understanding core principles is essential for mastering any topic.',
                },
                {
                    question: `How can you best learn about ${topic}?`,
                    options: ['Practice regularly', 'Ignore it', 'Guess randomly', 'Skip lessons'],
                    correctAnswer: 'Practice regularly',
                    explanation: 'Regular practice helps reinforce learning and build long-term memory.',
                },
                {
                    question: `What comes after learning the basics of ${topic}?`,
                    options: ['Advanced concepts', 'Nothing more', 'Start over', 'Give up'],
                    correctAnswer: 'Advanced concepts',
                    explanation: 'After mastering basics, you can progress to more advanced topics.',
                },
            ],
        };
    }

    /**
     * Format questions with proper IDs
     */
    private formatQuestions(questions: any[], lessonId: string): LessonQuestion[] {
        return questions.map((q, index) => ({
            id: `${lessonId}_q${index + 1}`,
            question: q.question || '',
            options: q.options || [],
            correctAnswer: q.correctAnswer || q.options?.[0] || '',
            explanation: q.explanation || '',
        }));
    }

    /**
     * Save lesson to database
     */
    private async saveLesson(lesson: Lesson): Promise<void> {
        try {
            await supabase.from('series_lessons').insert({
                id: lesson.id,
                series_id: lesson.seriesId,
                title: lesson.title,
                description: lesson.description,
                theory: lesson.theory,
                questions: lesson.questions,
                order_num: lesson.order,
                difficulty: lesson.difficulty,
                estimated_minutes: lesson.estimatedMinutes,
                xp_reward: lesson.xpReward,
            });
        } catch (error) {
            console.error('Error saving lesson:', error);
        }
    }

    /**
     * Get user's lesson series
     */
    async getUserSeries(userId: string): Promise<LessonSeries[]> {
        try {
            const { data, error } = await supabase
                .from('lesson_series')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return (data || []).map(this.mapDbSeriesToModel);
        } catch (error) {
            console.error('Error fetching user series:', error);
            return [];
        }
    }

    /**
     * Get lessons for a series
     */
    async getSeriesLessons(seriesId: string): Promise<Lesson[]> {
        try {
            const { data, error } = await supabase
                .from('series_lessons')
                .select('*')
                .eq('series_id', seriesId)
                .order('order_num', { ascending: true });

            if (error) throw error;

            return (data || []).map(this.mapDbLessonToModel);
        } catch (error) {
            console.error('Error fetching series lessons:', error);
            return [];
        }
    }

    /**
     * Mark lesson as completed
     */
    async completeLesson(lessonId: string, score: number): Promise<void> {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user?.id) return;

            await supabase.from('series_lessons').update({
                completed: true,
                score,
                completed_at: new Date().toISOString(),
            }).eq('id', lessonId);

            // Update series progress
            const lesson = await supabase
                .from('series_lessons')
                .select('series_id, xp_reward')
                .eq('id', lessonId)
                .single();

            if (lesson.data) {
                await supabase.rpc('increment_series_progress', {
                    p_series_id: lesson.data.series_id,
                    p_xp: lesson.data.xp_reward,
                });
            }

        } catch (error) {
            console.error('Error completing lesson:', error);
        }
    }

    /**
     * Delete a series
     */
    async deleteSeries(seriesId: string): Promise<boolean> {
        try {
            // Delete lessons first
            await supabase.from('series_lessons').delete().eq('series_id', seriesId);

            // Delete series
            const { error } = await supabase.from('lesson_series').delete().eq('id', seriesId);

            return !error;
        } catch (error) {
            console.error('Error deleting series:', error);
            return false;
        }
    }

    private mapDbSeriesToModel(data: any): LessonSeries {
        return {
            id: data.id,
            userId: data.user_id,
            title: data.title,
            description: data.description,
            topic: data.topic,
            totalLessons: data.total_lessons,
            completedLessons: data.completed_lessons || 0,
            difficulty: data.difficulty,
            category: data.category,
            imageUrl: data.image_url,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            isPublic: data.is_public,
            lessons: [],
            totalXP: data.total_xp,
            earnedXP: data.earned_xp || 0,
            progress: data.progress || 0,
            tags: data.tags || [],
        };
    }

    private mapDbLessonToModel(data: any): Lesson {
        return {
            id: data.id,
            seriesId: data.series_id,
            title: data.title,
            description: data.description,
            theory: data.theory,
            questions: data.questions || [],
            order: data.order_num,
            difficulty: data.difficulty,
            estimatedMinutes: data.estimated_minutes,
            xpReward: data.xp_reward,
            completed: data.completed || false,
            score: data.score,
            completedAt: data.completed_at,
        };
    }
}

export const lessonSeriesService = new LessonSeriesService();
export default lessonSeriesService;
