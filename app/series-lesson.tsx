/**
 * Series Lesson Screen
 * Plays a specific lesson from a lesson series
 * Re-uses the main lesson logic with series context
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity, StatusBar,
    ActivityIndicator, ScrollView, Dimensions, Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import TTSButton from '../src/components/TTSButton';
import { ArrowLeft, CheckCircle, XCircle, Zap, ChevronRight, Heart, BookOpen, X, Flame, Star, Trophy } from 'lucide-react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    withSequence,
    withDelay,
    FadeIn,
    FadeOut,
    SlideInDown,
    SlideInUp,
    ZoomIn,
    runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../src/config/supabase';
import { lessonSeriesService } from '../src/services/LessonSeriesService';
import i18n from '../src/i18n';
import { useTheme } from '../src/context/ThemeContext';
import { useToast } from '../src/context/ToastContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SeriesLessonScreen() {
    const insets = useSafeAreaInsets();
    const { theme, isDark } = useTheme();
    const { showToast } = useToast();
    const { lessonId, seriesId, title } = useLocalSearchParams<{
        lessonId: string;
        seriesId: string;
        title: string;
    }>();

    const [loading, setLoading] = useState(true);
    const [lesson, setLesson] = useState<any>(null);
    const [currentStep, setCurrentStep] = useState<'overview' | 'quiz' | 'complete'>('overview');
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [hearts, setHearts] = useState(5);

    // Animations
    const progressWidth = useSharedValue(0);
    const feedbackScale = useSharedValue(0);

    useEffect(() => {
        loadLesson();
    }, [lessonId]);

    const loadLesson = async () => {
        if (!lessonId || !seriesId) return;
        setLoading(true);
        try {
            const lessons = await lessonSeriesService.getSeriesLessons(seriesId);
            const found = lessons.find((l: any) => l.id === lessonId);
            if (found) {
                setLesson(found);
            } else {
                showToast('Lesson not found', { type: 'error' });
                router.back();
            }
        } catch (error) {
            console.error('Error loading series lesson:', error);
            showToast('Failed to load lesson', { type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (answer: string) => {
        if (showFeedback || !lesson?.questions?.[currentQuestion]) return;

        setSelectedAnswer(answer);
        const correct = answer === lesson.questions[currentQuestion].correctAnswer;
        setIsCorrect(correct);
        setShowFeedback(true);

        if (correct) {
            setScore(prev => prev + 1);
        } else {
            setHearts(prev => Math.max(0, prev - 1));
        }

        feedbackScale.value = withSpring(1, { damping: 10 });
    };

    const handleNext = () => {
        setShowFeedback(false);
        setSelectedAnswer(null);
        feedbackScale.value = 0;

        if (!lesson?.questions) return;

        if (currentQuestion < lesson.questions.length - 1) {
            setCurrentQuestion(prev => prev + 1);
            progressWidth.value = withTiming(
                ((currentQuestion + 2) / lesson.questions.length) * 100,
                { duration: 300 }
            );
        } else {
            setCurrentStep('complete');
            // Mark lesson completed in series
            markLessonComplete();
        }
    };

    const markLessonComplete = async () => {
        if (!lessonId || !seriesId) return;
        try {
            await lessonSeriesService.completeLesson(lessonId, score);

            // Add XP via RPC
            const session = await supabase.auth.getSession();
            const userId = session.data?.session?.user?.id;
            if (userId) {
                const xpEarned = score * 10;
                const { error } = await supabase.rpc('increment_xp', { user_id: userId, amount: xpEarned });
                if (error) {
                    console.log(`Would add ${xpEarned} XP for user ${userId}`);
                }
            }
        } catch (error) {
            console.error('Error marking lesson complete:', error);
        }
    };

    const progressStyle = useAnimatedStyle(() => ({
        width: `${progressWidth.value}%`,
    }));

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.text.secondary }]}>
                        {i18n.t('common.loading')}
                    </Text>
                </View>
            </View>
        );
    }

    if (currentStep === 'complete') {
        const accuracy = lesson?.questions?.length
            ? Math.round((score / lesson.questions.length) * 100)
            : 0;

        return (
            <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                <LinearGradient
                    colors={isDark ? ['#1A2C34', '#0D1B21'] : ['#E8F5E9', '#FFFFFF']}
                    style={StyleSheet.absoluteFill}
                />
                <View style={[styles.completeContainer, { paddingTop: insets.top + 40 }]}>
                    <Animated.View entering={ZoomIn.delay(200)}>
                        <Trophy size={80} color="#FFC800" />
                    </Animated.View>
                    <Text style={[styles.completeTitle, { color: theme.text.primary }]}>
                        {i18n.t('lesson.complete')}
                    </Text>
                    <Text style={[styles.completeSubtitle, { color: theme.text.secondary }]}>
                        {title || 'Series Lesson'}
                    </Text>

                    <View style={[styles.statsCard, { backgroundColor: theme.background.secondary }]}>
                        <View style={styles.statRow}>
                            <Star size={20} color="#FFC800" />
                            <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Score</Text>
                            <Text style={[styles.statValue, { color: theme.text.primary }]}>{score}/{lesson?.questions?.length || 0}</Text>
                        </View>
                        <View style={styles.statRow}>
                            <Zap size={20} color="#FF9600" />
                            <Text style={[styles.statLabel, { color: theme.text.secondary }]}>{i18n.t('lesson.accuracy')}</Text>
                            <Text style={[styles.statValue, { color: theme.text.primary }]}>{accuracy}%</Text>
                        </View>
                        <View style={styles.statRow}>
                            <Flame size={20} color="#FF4B4B" />
                            <Text style={[styles.statLabel, { color: theme.text.secondary }]}>XP Earned</Text>
                            <Text style={[styles.statValue, { color: theme.text.primary }]}>+{score * 10}</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.continueBtn, { backgroundColor: theme.primary }]}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.continueBtnText}>{i18n.t('common.continue')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const questions = lesson?.questions || [];
    const currentQ = questions[currentQuestion];

    if (currentStep === 'overview') {
        return (
            <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={24} color={theme.text.primary} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text.primary }]} numberOfLines={1}>
                        {title || 'Series Lesson'}
                    </Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView style={styles.overviewContent} contentContainerStyle={{ paddingBottom: 100 }}>
                    <View style={[styles.overviewCard, { backgroundColor: theme.background.secondary }]}>
                        <BookOpen size={40} color={theme.primary} />
                        <Text style={[styles.overviewTitle, { color: theme.text.primary }]}>
                            {lesson?.title || 'Lesson'}
                        </Text>
                        {lesson?.content && (
                            <Text style={[styles.overviewContent, { color: theme.text.secondary }]}>
                                {typeof lesson.content === 'string'
                                    ? lesson.content
                                    : lesson.content?.theory || 'Review the content and test your knowledge.'}
                            </Text>
                        )}
                        <Text style={[styles.questionCount, { color: theme.text.muted }]}>
                            {questions.length} questions
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.startBtn, { backgroundColor: theme.primary }]}
                        onPress={() => {
                            setCurrentStep('quiz');
                            progressWidth.value = withTiming(
                                (1 / Math.max(1, questions.length)) * 100,
                                { duration: 300 }
                            );
                        }}
                    >
                        <Text style={styles.startBtnText}>{i18n.t('lesson.start_quiz')}</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        );
    }

    // Quiz step
    return (
        <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={[styles.quizHeader, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <X size={24} color={theme.text.primary} />
                </TouchableOpacity>

                {/* Progress Bar */}
                <View style={[styles.progressTrack, { backgroundColor: theme.background.secondary }]}>
                    <Animated.View style={[styles.progressFill, { backgroundColor: theme.primary }, progressStyle]} />
                </View>

                {/* Hearts */}
                <View style={styles.heartsContainer}>
                    <Heart size={20} color="#FF4B4B" fill="#FF4B4B" />
                    <Text style={[styles.heartsText, { color: '#FF4B4B' }]}>{hearts}</Text>
                </View>
            </View>

            <ScrollView style={styles.quizContent} contentContainerStyle={{ paddingBottom: 120 }}>
                {currentQ && (
                    <Animated.View entering={FadeIn} style={styles.questionContainer}>
                        <Text style={[styles.questionNumber, { color: theme.text.muted }]}>
                            {i18n.t('lesson.question')} {currentQuestion + 1}/{questions.length}
                        </Text>
                        <Text style={[styles.questionText, { color: theme.text.primary }]}>
                            {currentQ.question}
                        </Text>
                        {currentQ.question && <TTSButton text={currentQ.question} />}

                        <View style={styles.optionsContainer}>
                            {(currentQ.options || []).map((option: string, idx: number) => {
                                const isSelected = selectedAnswer === option;
                                const isCorrectOption = option === currentQ.correctAnswer;
                                let optionStyle = [styles.optionBtn, { borderColor: theme.border.light }];
                                let textColor = theme.text.primary;

                                if (showFeedback) {
                                    if (isCorrectOption) {
                                        optionStyle = [...optionStyle, styles.optionCorrect];
                                        textColor = '#58CC02';
                                    } else if (isSelected && !isCorrectOption) {
                                        optionStyle = [...optionStyle, styles.optionWrong];
                                        textColor = '#FF4B4B';
                                    }
                                } else if (isSelected) {
                                    optionStyle = [...optionStyle, { borderColor: theme.primary, borderWidth: 2 } as any];
                                }

                                return (
                                    <TouchableOpacity
                                        key={idx}
                                        style={optionStyle}
                                        onPress={() => handleAnswer(option)}
                                        disabled={showFeedback}
                                    >
                                        <Text style={[styles.optionText, { color: textColor }]}>{option}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </Animated.View>
                )}
            </ScrollView>

            {/* Feedback & Next */}
            {showFeedback && (
                <Animated.View
                    entering={SlideInDown}
                    style={[
                        styles.feedbackBar,
                        { backgroundColor: isCorrect ? '#58CC02' : '#FF4B4B' },
                    ]}
                >
                    <View style={styles.feedbackContent}>
                        {isCorrect ? (
                            <CheckCircle size={24} color="#FFF" />
                        ) : (
                            <XCircle size={24} color="#FFF" />
                        )}
                        <Text style={styles.feedbackText}>
                            {isCorrect ? i18n.t('lesson.correct') : i18n.t('lesson.incorrect')}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                        <Text style={styles.nextBtnText}>{i18n.t('common.continue')}</Text>
                    </TouchableOpacity>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    backBtn: {
        padding: 8,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
    },
    overviewContent: {
        flex: 1,
        padding: 20,
    },
    overviewCard: {
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        gap: 12,
    },
    overviewTitle: {
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
    },
    questionCount: {
        fontSize: 14,
        marginTop: 8,
    },
    startBtn: {
        marginTop: 24,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    startBtnText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
    },
    quizHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        gap: 12,
    },
    progressTrack: {
        flex: 1,
        height: 12,
        borderRadius: 6,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 6,
    },
    heartsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    heartsText: {
        fontSize: 16,
        fontWeight: '700',
    },
    quizContent: {
        flex: 1,
        padding: 20,
    },
    questionContainer: {
        gap: 16,
    },
    questionNumber: {
        fontSize: 14,
        fontWeight: '600',
    },
    questionText: {
        fontSize: 20,
        fontWeight: '700',
        lineHeight: 28,
    },
    optionsContainer: {
        gap: 12,
        marginTop: 20,
    },
    optionBtn: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1.5,
    },
    optionCorrect: {
        borderColor: '#58CC02',
        backgroundColor: 'rgba(88, 204, 2, 0.1)',
    },
    optionWrong: {
        borderColor: '#FF4B4B',
        backgroundColor: 'rgba(255, 75, 75, 0.1)',
    },
    optionText: {
        fontSize: 16,
        fontWeight: '500',
    },
    feedbackBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: 40,
    },
    feedbackContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    feedbackText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
    },
    nextBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    nextBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    completeContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        gap: 16,
    },
    completeTitle: {
        fontSize: 28,
        fontWeight: '800',
        marginTop: 16,
    },
    completeSubtitle: {
        fontSize: 16,
    },
    statsCard: {
        width: '100%',
        borderRadius: 16,
        padding: 20,
        marginTop: 24,
        gap: 16,
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statLabel: {
        flex: 1,
        fontSize: 16,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
    },
    continueBtn: {
        marginTop: 32,
        paddingVertical: 16,
        paddingHorizontal: 48,
        borderRadius: 12,
    },
    continueBtnText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
    },
});
