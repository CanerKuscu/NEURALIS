/**
 * Lesson Series Types - Premium Feature
 * Allows users to create custom lesson series with AI
 */

export interface LessonQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: string;
    explanation?: string;
}

export interface Lesson {
    id: string;
    seriesId: string;
    title: string;
    description: string;
    theory: string;
    questions: LessonQuestion[];
    order: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedMinutes: number;
    xpReward: number;
    completed?: boolean;
    score?: number;
    completedAt?: string;
}

export interface LessonSeries {
    id: string;
    userId: string;
    title: string;
    description: string;
    topic: string;
    totalLessons: number;
    completedLessons: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    category: string;
    imageUrl?: string;
    createdAt: string;
    updatedAt: string;
    isPublic: boolean;
    lessons: Lesson[];
    totalXP: number;
    earnedXP: number;
    progress: number; // 0-100
    tags: string[];
}

export interface CreateSeriesRequest {
    topic: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    lessonCount: number;
    category: string;
    isPublic: boolean;
    customInstructions?: string;
}

export interface SeriesGenerationStatus {
    status: 'idle' | 'generating' | 'complete' | 'error';
    progress: number;
    currentLesson: number;
    totalLessons: number;
    error?: string;
}

// Default categories for lesson series
export const LESSON_CATEGORIES = [
    { id: 'science', name: 'Science', icon: '🔬', color: '#3498DB' },
    { id: 'math', name: 'Mathematics', icon: '🔢', color: '#9B59B6' },
    { id: 'history', name: 'History', icon: '📜', color: '#E67E22' },
    { id: 'language', name: 'Language', icon: '🌍', color: '#2ECC71' },
    { id: 'programming', name: 'Programming', icon: '💻', color: '#1ABC9C' },
    { id: 'art', name: 'Art & Design', icon: '🎨', color: '#E74C3C' },
    { id: 'music', name: 'Music', icon: '🎵', color: '#F1C40F' },
    { id: 'business', name: 'Business', icon: '💼', color: '#34495E' },
    { id: 'health', name: 'Health', icon: '❤️', color: '#E91E63' },
    { id: 'custom', name: 'Custom', icon: '✨', color: '#667EEA' },
];

export const DIFFICULTY_LEVELS = [
    { id: 'beginner', name: 'Beginner', icon: '🌱', description: 'Start from basics' },
    { id: 'intermediate', name: 'Intermediate', icon: '🌿', description: 'Some prior knowledge' },
    { id: 'advanced', name: 'Advanced', icon: '🌳', description: 'Deep dive content' },
];
