/**
 * NEURALIS - AI Tutor Service
 * Generates simple personalized lessons based on user mistakes, accuracy and progress level.
 * This is a lightweight, local heuristic-based implementation that can be extended
 * to call a model (e.g. GeminiService) for richer content.
 */

import { supabase } from '../config/supabase';
import * as db from '../config/db';
const { db: database, doc, COLLECTIONS, setDoc, Timestamp } = db as any;
import {
    UserProfile,
    AIProvider,
    AITutorSession,
    AITutorMessage,
    NeuralPathAnalysis,
    NeuralPathStep,
    Task,
    TaskAttempt,
} from '../types';

export type Exercise = {
    id: string;
    type: 'multiple_choice' | 'fill_blank' | 'translation' | 'listening';
    prompt: string;
    options?: string[];
    answer?: string | number | string[];
    difficulty?: 'easy' | 'medium' | 'hard';
    premiumOnly?: boolean;
};

export type Lesson = {
    id: string;
    title: string;
    description?: string;
    exercises: Exercise[];
    recommendedXP?: number;
    premiumOnly?: boolean;
};

export type PerformanceSummary = {
    accuracy: number; // 0-1
    mistakesByConcept: Record<string, number>;
    recentErrors: string[]; // concept ids or tags
    progressLevel: number; // 0..N
};

// AI provider configuration is managed server-side via Supabase Edge Functions.
// See `ai-tutor` edge function for provider routing logic.

const SHADOW_TUTOR_SYSTEM_PROMPT = `You are the Shadow Tutor, an AI mentor within the Neuralis anti-brain-rot system. Your role is to analyze cognitive errors and guide users to understand the "Neural Path" to correct answers.

PERSONALITY:
- Direct and analytical, but encouraging
- Focus on understanding, not just answers
- Use metaphors related to neural pathways and cognitive optimization
- Be concise but thorough

RESPONSE FORMAT:
1. Identify the error type (conceptual, calculation, misread, time pressure)
2. Explain WHY the error occurred
3. Show the step-by-step "Neural Path" to the correct answer
4. Provide a memorable tip or mental model
5. End with an encouraging push to try again

NEVER just give the answer. Always teach the PATH to the answer.

Keep responses under 300 words. Use bullet points and clear structure.`;

class AITutorService {
    private static instance: AITutorService;

    /**
     * API keys are intentionally NOT stored client-side.
     * All AI calls are routed through Supabase Edge Functions to keep secrets server-side.
     */
    private constructor() { }

    static getInstance() {
        if (!AITutorService.instance) AITutorService.instance = new AITutorService();
        return AITutorService.instance;
    }

    // Simple heuristic-based lesson generator
    async generateLesson(user: UserProfile | null, perf: PerformanceSummary, opts?: { premium?: boolean }): Promise<Lesson> {
        const weakConcepts = this.getWeakConcepts(perf);
        const difficulty = this.chooseDifficulty(perf.progressLevel, opts?.premium || false);
        const exercises: Exercise[] = [];
        // Prioritize weak concepts
        for (let i = 0; i < Math.min(4, weakConcepts.length); i++) {
            const concept = weakConcepts[i];
            exercises.push(this.makeExerciseForConcept(concept, difficulty, false));
        }
        // Add reinforcement exercises
        exercises.push(this.makeExerciseForConcept(weakConcepts[0] || 'general-vocab', difficulty, false));
        // Premium-only deep drill
        if (opts?.premium) {
            exercises.push(this.makeExerciseForConcept('timed-drill', 'hard', true));
            exercises.push(this.makeExerciseForConcept('comprehension', 'hard', true));
        }
        // If user is very weak, add an easy refresher
        if (perf.accuracy < 0.5) {
            exercises.unshift(this.makeExerciseForConcept('basics', 'easy', false));
        }
        const title = weakConcepts.length ? `Practice: ${weakConcepts[0]}` : 'Daily Practice';
        return {
            id: `lesson_${Date.now()}`,
            title,
            description: 'Adaptive lesson generated from recent performance',
            exercises,
            recommendedXP: exercises.length * (opts?.premium ? 20 : 10),
            premiumOnly: false,
        };
    }

    // Use Supabase Edge Function (DeepSeek) to generate a rich unit/lesson server-side
    async generateLessonFromDeepseek(userId?: string): Promise<Lesson | null> {
        try {
            // Try to get a session token to forward (RLS-aware)
            const sessionRes = await supabase.auth.getSession();
            const token = sessionRes?.data?.session?.access_token;
            // Use supabase.functions.invoke when available (supabase-js v2)
            if ((supabase as any).functions && (supabase as any).functions.invoke) {
                const invokeOptions: any = { body: JSON.stringify({ userId }), headers: { 'Content-Type': 'application/json' } };
                if (token) invokeOptions.headers.Authorization = `Bearer ${token}`;
                const { data, error } = await (supabase as any).functions.invoke('deepseek-architect', invokeOptions);
                if (error) {
                    console.warn('[AITutorService] Deepseek function error:', error);
                    return null;
                }
                const unit = data?.unit || data;
                if (!unit) return null;
                // Convert returned unit into Lesson shape (best-effort)
                const lesson: Lesson = {
                    id: `deepseek_${Date.now()}`,
                    title: unit.title || unit.name || 'AI Unit',
                    description: unit.subtitle || unit.content || '',
                    exercises: [
                        {
                            id: `deepseek_content_${Date.now()}`,
                            type: 'fill_blank',
                            prompt: unit.content || unit.description || 'Practice this unit content',
                            answer: '',
                            difficulty: 'medium',
                            premiumOnly: false,
                        },
                    ],
                    recommendedXP: unit.xp_reward || 50,
                    premiumOnly: false,
                };
                // Try to persist generated lesson to DB for durability
                try {
                    const saved = await this.saveGeneratedLesson(lesson, userId);
                    if (saved) {
                        // map DB row back to Lesson if possible
                        return {
                            id: saved.id || lesson.id,
                            title: saved.title || lesson.title,
                            description: saved.description || lesson.description,
                            exercises: lesson.exercises,
                            recommendedXP: saved.recommended_xp || lesson.recommendedXP,
                            premiumOnly: !!saved.premium_only,
                        } as Lesson;
                    }
                } catch (e) {
                    console.warn('[AITutorService] Could not save generated lesson:', e);
                }
                return lesson;
            }
            // Fallback: attempt to call the edge function via fetch using Supabase URL (best-effort)
            console.warn('[AITutorService] supabase.functions.invoke not available; Deepseek call skipped.');
            return null;
        } catch (err) {
            console.error('[AITutorService] generateLessonFromDeepseek error:', err);
            return null;
        }
    }

    // Persist a generated lesson into the `generated_lessons` table (upsert)
    async saveGeneratedLesson(lesson: Lesson, userId?: string): Promise<any | null> {
        try {
            // Ensure we set user_id from session if not provided so RLS allows the upsert
            let targetUserId: string | undefined = userId;
            if (!targetUserId) {
                try {
                    const sessionRes = await supabase.auth.getSession();
                    targetUserId = sessionRes?.data?.session?.user?.id ?? undefined;
                } catch (e) {
                    targetUserId = undefined;
                }
            }
            const payload: any = {
                id: lesson.id,
                user_id: targetUserId,
                title: lesson.title,
                description: lesson.description || null,
                content: JSON.stringify(lesson),
                recommended_xp: lesson.recommendedXP || null,
                premium_only: lesson.premiumOnly || false,
                updated_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
            };
            const { data, error } = await supabase.from('generated_lessons').upsert(payload).select().maybeSingle();
            if (error) {
                console.warn('[AITutorService] saveGeneratedLesson upsert error:', error);
                return null;
            }
            return data || payload;
        } catch (err) {
            console.error('[AITutorService] saveGeneratedLesson error:', err);
            return null;
        }
    }

    // Convert performance into ranked weak concepts

    /**
     * Generate a custom lesson from a free-form user prompt (Commander Mode)
     */
    async generateCustomLesson(prompt: string, userId?: string): Promise<Lesson | null> {
        try {
            const lesson: Lesson = {
                id: `custom_${Date.now()}`,
                title: `Custom: ${prompt.slice(0, 60)}`,
                description: `User-created lesson: ${prompt}`,
                exercises: [
                    {
                        id: `custom_ex_${Date.now()}`,
                        type: 'fill_blank',
                        prompt: prompt,
                        answer: '',
                        difficulty: 'medium',
                        premiumOnly: false,
                    },
                ],
                recommendedXP: 20,
                premiumOnly: false,
            };

            // Try to persist the custom lesson
            try {
                await this.saveGeneratedLesson(lesson, userId);
            } catch (e) {
                // Non-fatal
                console.warn('[AITutorService] Could not save custom lesson:', e);
            }
            return lesson;
        } catch (err) {
            console.error('[AITutorService] generateCustomLesson error:', err);
            return null;
        }
    }

    /**
     * Generate a weekly error analysis report summarizing mistakes in the last 7 days.
     */
    async generateWeeklyErrorReport(userId?: string): Promise<{ summary: Record<string, number>; recentErrors: any[] } | null> {
        try {
            if (!userId) {
                try {
                    const sessionRes = await supabase.auth.getSession();
                    userId = sessionRes?.data?.session?.user?.id;
                } catch (e) {
                    // continue
                }
            }
            if (!userId) return null;

            const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            const { data, error } = await supabase
                .from('task_attempts')
                .select('task_id,task_category,is_correct,created_at,answer,correct_answer')
                .gte('created_at', sevenDaysAgo)
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(500);

            if (error) {
                console.warn('[AITutorService] generateWeeklyErrorReport supabase error:', error);
                return null;
            }

            const attempts = data || [];
            const summary: Record<string, number> = {};
            const recentErrors: any[] = [];

            for (const a of attempts) {
                if (!a.is_correct) {
                    const key = a.task_category || a.task_id || 'unknown';
                    summary[key] = (summary[key] || 0) + 1;
                    recentErrors.push(a);
                }
            }

            return { summary, recentErrors };
        } catch (err) {
            console.error('[AITutorService] generateWeeklyErrorReport error:', err);
            return null;
        }
    }
    private getWeakConcepts(perf: PerformanceSummary): string[] {
        const arr = Object.entries(perf.mistakesByConcept || {});
        arr.sort((a, b) => b[1] - a[1]);
        return arr.map(([concept]) => concept);
    }

    private chooseDifficulty(progressLevel: number, premium: boolean): 'easy' | 'medium' | 'hard' {
        if (premium && progressLevel >= 5) return 'hard';
        if (progressLevel >= 3) return 'medium';
        return 'easy';
    }

    private makeExerciseForConcept(concept: string, difficulty: 'easy' | 'medium' | 'hard', premiumOnly = false): Exercise {
        switch (concept) {
            case 'listening':
            case 'timed-drill':
                return {
                    id: `${concept}_${Math.random().toString(36).slice(2, 9)}`,
                    type: 'listening',
                    prompt: `Listen and transcribe the sentence related to ${concept}`,
                    difficulty,
                    premiumOnly,
                };
            case 'translation':
                return {
                    id: `${concept}_${Math.random().toString(36).slice(2, 9)}`,
                    type: 'translation',
                    prompt: `Translate the following sentence about ${concept}`,
                    difficulty,
                    premiumOnly,
                };
            case 'basics':
                return {
                    id: `${concept}_${Math.random().toString(36).slice(2, 9)}`,
                    type: 'multiple_choice',
                    prompt: `Quick basics check`,
                    options: ['A', 'B', 'C', 'D'],
                    answer: 'A',
                    difficulty,
                    premiumOnly,
                };
            default:
                return {
                    id: `${concept}_${Math.random().toString(36).slice(2, 9)}`,
                    type: 'fill_blank',
                    prompt: `Fill the blank: an example exercise for ${concept}`,
                    answer: 'example',
                    difficulty,
                    premiumOnly,
                };
        }
    }

    // Evaluate user's answers and produce summary updates
    evaluateAnswers(lesson: Lesson, answers: Record<string, any>): { accuracy: number; mistakesByConcept: Record<string, number> } {
        let correct = 0;
        let total = 0;
        const mistakes: Record<string, number> = {};
        for (const ex of lesson.exercises) {
            total++;
            const ans = answers[ex.id];
            const isCorrect = this.isAnswerCorrect(ex, ans);
            if (isCorrect) correct++; else {
                const key = ex.id.split('_')[0] || 'general';
                mistakes[key] = (mistakes[key] || 0) + 1;
            }
        }
        return { accuracy: total ? correct / total : 0, mistakesByConcept: mistakes };
    }

    private isAnswerCorrect(ex: Exercise, ans: any): boolean {
        if (typeof ex.answer === 'undefined') return false;
        if (Array.isArray(ex.answer)) return JSON.stringify(ex.answer) === JSON.stringify(ans);
        return String(ex.answer).toLowerCase() === String(ans).toLowerCase();
    }

    // ========== SHADOW TUTOR AI METHODS ========== //

    /**
     * Analyze user error and provide Neural Path explanation
     */
    async analyzeError(
        task: Task,
        attempt: TaskAttempt,
        preferredProvider: AIProvider = 'claude'
    ): Promise<NeuralPathAnalysis> {
        const provider = preferredProvider;
        if (!provider) {
            return this.getFallbackAnalysis(task, attempt);
        }
        try {
            const analysis = await this.callAI(provider, task, attempt);
            await this.storeSession(attempt.userId, task.id, provider, analysis);
            return analysis;
        } catch (error) {
            console.error('[AITutorService] AI call failed:', error);
            return this.getFallbackAnalysis(task, attempt);
        }
    }

    /**
     * Get interactive help during a task (Premium feature)
     */
    async getHint(
        task: Task,
        currentProgress: string,
        provider: AIProvider = 'claude'
    ): Promise<string> {
        const activeProvider = provider;
        if (!activeProvider) {
            return this.getFallbackHint(task);
        }
        const prompt = `The user is working on this problem and needs a hint (NOT the answer):\n\nPROBLEM: ${task.question}\nTHEIR CURRENT WORK: ${currentProgress || 'Just started'}\n\nProvide ONE small hint that nudges them in the right direction without revealing the answer. Be cryptic but helpful. Max 50 words.`;
        try {
            const response = await this.makeAPICall(activeProvider, prompt);
            return response;
        } catch (error) {
            return this.getFallbackHint(task);
        }
    }

    /**
     * Call AI provider for error analysis
     */
    private async callAI(
        provider: AIProvider,
        task: Task,
        attempt: TaskAttempt
    ): Promise<NeuralPathAnalysis> {
        const prompt = this.buildAnalysisPrompt(task, attempt);
        const response = await this.makeAPICall(provider, prompt);
        return this.parseAIResponse(response, task, attempt);
    }

    /**
     * Build the analysis prompt
     */
    private buildAnalysisPrompt(task: Task, attempt: TaskAttempt): string {
        return `Analyze this cognitive error:\n\nTASK CATEGORY: ${task.category}\nDIFFICULTY: ${task.difficulty}\n\nQUESTION: ${task.question}\n${task.options ? `OPTIONS: ${task.options.join(' | ')}` : ''}\n\nCORRECT ANSWER: ${task.correctAnswer}\nUSER'S ANSWER: ${attempt.answer}\nTIME TAKEN: ${attempt.timeTaken}s (Time limit: ${task.timeLimit}s)\n\nProvide a Neural Path analysis in this exact JSON format:\n{\n  "errorType": "conceptual|calculation|misread|time_pressure|unknown",\n  "explanation": "Brief explanation of the error",\n  "steps": [\n    {"stepNumber": 1, "description": "First step", "isUserMistake": false},\n    {"stepNumber": 2, "description": "Where they went wrong", "isUserMistake": true, "correction": "What they should have done"}\n  ],\n  "recommendations": ["Tip 1", "Tip 2"]\n}`;
    }

    /**
     * Make API call via Supabase Edge Function proxy.
     * AI provider keys are stored server-side as Supabase secrets — never in the client bundle.
     */
    private async makeAPICall(provider: AIProvider, userPrompt: string): Promise<string> {
        const { supabase } = await import('../config/supabase');

        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;
        if (!accessToken) {
            throw new Error('User must be authenticated to use AI Tutor');
        }

        const { data, error } = await supabase.functions.invoke('ai-tutor', {
            body: {
                provider,
                prompt: userPrompt,
                systemPrompt: SHADOW_TUTOR_SYSTEM_PROMPT,
            },
        });

        if (error) {
            throw new Error(`AI Tutor proxy error: ${error.message}`);
        }

        return data?.response ?? '';
    }

    /**
     * Parse AI response into structured analysis
     */
    private parseAIResponse(
        response: string,
        task: Task,
        attempt: TaskAttempt
    ): NeuralPathAnalysis {
        try {
            // Try to extract JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    taskId: task.id,
                    userAnswer: attempt.answer || '',
                    correctAnswer: task.correctAnswer,
                    errorType: parsed.errorType || 'unknown',
                    explanation: parsed.explanation || response,
                    steps: parsed.steps || [],
                    recommendations: parsed.recommendations || [],
                };
            }
        } catch (e) {
            // JSON parsing failed, use raw response
        }
        // Fallback: use response as explanation
        return {
            taskId: task.id,
            userAnswer: attempt.answer || '',
            correctAnswer: task.correctAnswer,
            errorType: 'unknown',
            explanation: response,
            steps: [],
            recommendations: [],
        };
    }

    /**
     * Store tutor session for analytics
     */
    private async storeSession(
        userId: string,
        taskId: string,
        provider: AIProvider,
        analysis: NeuralPathAnalysis
    ): Promise<void> {
        const sessionId = `session_${userId}_${taskId}_${Date.now()}`;
        const session: AITutorSession = {
            id: sessionId,
            userId,
            taskId,
            provider,
            startedAt: Date.now(),
            messages: [
                {
                    role: 'assistant',
                    content: analysis.explanation,
                    timestamp: Date.now(),
                },
            ],
            neuralPathExplained: true,
            tokensUsed: 0, // Would need to track from API response
        };
        await setDoc(doc(db, COLLECTIONS.TUTOR_SESSIONS, sessionId), {
            ...session,
            startedAt: Timestamp.fromMillis(session.startedAt),
        });
    }

    /**
     * Get preferred AI provider.
     * Since all calls go through the server-side proxy, the provider is always available.
     */
    private getAvailableProvider(): AIProvider | null {
        return 'claude'; // Default provider — server decides actual routing
    }

    /**
     * Fallback analysis when AI is unavailable
     */
    private getFallbackAnalysis(task: Task, attempt: TaskAttempt): NeuralPathAnalysis {
        const timePressure = (attempt.timeTaken || 0) >= task.timeLimit * 0.9;
        return {
            taskId: task.id,
            userAnswer: attempt.answer || '',
            correctAnswer: task.correctAnswer,
            errorType: timePressure ? 'time_pressure' : 'unknown',
            explanation: task.explanation,
            steps: [
                {
                    stepNumber: 1,
                    description: 'Review the question carefully',
                    isUserMistake: false,
                },
                {
                    stepNumber: 2,
                    description: `The correct answer is: ${task.correctAnswer}`,
                    isUserMistake: false,
                },
                {
                    stepNumber: 3,
                    description: task.explanation,
                    isUserMistake: false,
                },
            ],
            recommendations: [
                'Take your time to read the question fully',
                'Eliminate obviously wrong answers first',
                'Practice similar problems to build pattern recognition',
            ],
        };
    }

    /**
     * Fallback hint when AI is unavailable
     */
    private getFallbackHint(task: Task): string {
        const hints: Record<string, string[]> = {
            logic: ['Break it down into smaller parts', 'What must be true?', 'Try working backwards'],
            math: ['Check your operations', 'Did you account for all variables?', 'Simplify first'],
            pattern: ['Look for repetition', 'What changes? What stays the same?', 'Count the elements'],
            memory: ['Visualize it', 'Create associations', 'Chunk the information'],
            verbal: ['Context clues help', 'Root words matter', 'Eliminate extremes'],
            spatial: ['Rotate mentally', 'Count the faces', 'Trace the path'],
        };
        const categoryHints = hints[task.category] || hints.logic;
        return categoryHints[Math.floor(Math.random() * categoryHints.length)];
    }

    /**
     * @deprecated API keys are now managed server-side. This method is a no-op.
     */
    setAPIKey(_provider: AIProvider, _key: string): void {
        if (__DEV__) console.warn('[AITutorService] setAPIKey is deprecated — keys are managed server-side.');
    }
}

const aiTutorService = AITutorService.getInstance();
export default aiTutorService;
