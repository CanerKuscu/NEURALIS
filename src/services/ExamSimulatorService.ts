/**
 * NEURALIS - AI Exam Simulator Service
 * YKS/LGS/AYT formatında AI ile sınav simülasyonu
 */

import { supabase } from '../config/supabase';
import { deepSeekService, Question } from './DeepSeekService';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ExamType = 'yks-tyt' | 'yks-ayt' | 'lgs' | 'kpss' | 'custom';

export interface ExamConfig {
    type: ExamType;
    label: string;
    description: string;
    questionCount: number;
    durationMinutes: number;
    categories: string[];
    emoji: string;
}

export interface ExamSession {
    id: string;
    userId: string;
    config: ExamConfig;
    questions: Question[];
    answers: { questionId: string; selectedAnswer: number | string; correct: boolean }[];
    score: number;
    startedAt: string;
    finishedAt?: string;
    status: 'generating' | 'active' | 'finished';
    categoryBreakdown: { category: string; correct: number; total: number }[];
}

export interface ExamHistory {
    id: string;
    examType: ExamType;
    score: number;
    totalQuestions: number;
    accuracy: number;
    date: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGS
// ═══════════════════════════════════════════════════════════════════════════

export const EXAM_CONFIGS: ExamConfig[] = [
    {
        type: 'yks-tyt',
        label: 'TYT Denemesi',
        description: 'Temel Yeterlilik Testi — Türkçe, Matematik, Fen, Sosyal',
        questionCount: 20,
        durationMinutes: 30,
        categories: ['mathematics', 'science', 'language', 'history'],
        emoji: '📝',
    },
    {
        type: 'yks-ayt',
        label: 'AYT Denemesi',
        description: 'Alan Yeterlilik Testi — Seçilen alan bazlı',
        questionCount: 20,
        durationMinutes: 35,
        categories: ['mathematics', 'science'],
        emoji: '📊',
    },
    {
        type: 'lgs',
        label: 'LGS Denemesi',
        description: 'Liseye Geçiş Sınavı formatı',
        questionCount: 15,
        durationMinutes: 20,
        categories: ['mathematics', 'science', 'language'],
        emoji: '🎓',
    },
    {
        type: 'custom',
        label: 'Özel Sınav',
        description: 'Kendi konu ve soru sayını belirle',
        questionCount: 10,
        durationMinutes: 15,
        categories: ['mathematics'],
        emoji: '⚙️',
    },
];

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════

class ExamSimulatorService {
    async startExam(userId: string, config: ExamConfig): Promise<ExamSession> {
        const session: ExamSession = {
            id: `exam_${Date.now()}`,
            userId,
            config,
            questions: [],
            answers: [],
            score: 0,
            startedAt: new Date().toISOString(),
            status: 'generating',
            categoryBreakdown: config.categories.map(c => ({ category: c, correct: 0, total: 0 })),
        };

        // Generate questions using DeepSeek
        try {
            const questionsPerCat = Math.ceil(config.questionCount / config.categories.length);
            const allQuestions: Question[] = [];

            for (const cat of config.categories) {
                const lesson = await deepSeekService.generateLesson({
                    userId,
                    category: cat,
                    difficulty: 'intermediate',
                    questionCount: questionsPerCat,
                    customPrompt: `Generate ${questionsPerCat} exam-style multiple choice questions for Turkish ${config.type} exam format. Category: ${cat}. Each question should be challenging but fair. Use 4 options. Keep questions clear and concise.`,
                });
                if (lesson?.questions) {
                    allQuestions.push(...lesson.questions.map(q => ({ ...q, id: `${cat}_${q.id}` })));
                }
            }

            session.questions = allQuestions.slice(0, config.questionCount);
            session.status = 'active';
        } catch (e) {
            console.warn('Exam generation failed:', e);
            session.status = 'active';
        }

        return session;
    }

    submitAnswer(session: ExamSession, questionId: string, answer: number): { correct: boolean; explanation: string } {
        const q = session.questions.find(q => q.id === questionId);
        if (!q) return { correct: false, explanation: '' };

        const correct = answer === q.correctAnswer;
        session.answers.push({ questionId, selectedAnswer: answer, correct });

        if (correct) session.score += 1;

        // Update category breakdown
        const cat = questionId.split('_')[0];
        const breakdown = session.categoryBreakdown.find(b => b.category === cat);
        if (breakdown) {
            breakdown.total += 1;
            if (correct) breakdown.correct += 1;
        }

        return { correct, explanation: q.explanation };
    }

    finishExam(session: ExamSession): ExamSession {
        session.status = 'finished';
        session.finishedAt = new Date().toISOString();
        return session;
    }

    async saveResult(session: ExamSession): Promise<void> {
        try {
            await supabase.from('exam_results').insert({
                user_id: session.userId,
                exam_type: session.config.type,
                score: session.score,
                total_questions: session.questions.length,
                accuracy: session.questions.length > 0 ? session.score / session.questions.length : 0,
                category_breakdown: session.categoryBreakdown,
                started_at: session.startedAt,
                finished_at: session.finishedAt,
            });
        } catch (e) { console.warn('Failed to save exam result:', e); }
    }

    async getHistory(userId: string): Promise<ExamHistory[]> {
        try {
            const { data } = await supabase.from('exam_results')
                .select('id, exam_type, score, total_questions, accuracy, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(20);

            return (data || []).map((e: any) => ({
                id: e.id,
                examType: e.exam_type,
                score: e.score,
                totalQuestions: e.total_questions,
                accuracy: e.accuracy,
                date: e.created_at,
            }));
        } catch { return []; }
    }
}

export const examSimulatorService = new ExamSimulatorService();
