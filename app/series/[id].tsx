/**
 * Series Detail Screen - View and play lesson series
 * Premium Feature
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    ArrowLeft,
    Play,
    CheckCircle,
    Lock,
    Trash2,
    Share2,
    BookOpen,
    Clock,
    Zap,
    Trophy,
    ChevronRight,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useTheme } from '../../src/context/ThemeContext';
import { useToast } from '../../src/context/ToastContext';
import { lessonSeriesService } from '../../src/services/LessonSeriesService';
import { LessonSeries, Lesson, LESSON_CATEGORIES } from '../../src/types/lessonSeries';
import { CustomModal, useModal } from '../../src/components/CustomModal';

const { width } = Dimensions.get('window');

export default function SeriesDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { showToast } = useToast();
    const modal = useModal();

    const [series, setSeries] = useState<LessonSeries | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSeriesData();
    }, [id]);

    const loadSeriesData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const seriesLessons = await lessonSeriesService.getSeriesLessons(id);
            setLessons(seriesLessons);

            // Mock series data for now (in real app would fetch from getUserSeries)
            if (seriesLessons.length > 0) {
                const completedCount = seriesLessons.filter(l => l.completed).length;
                setSeries({
                    id,
                    userId: '',
                    title: seriesLessons[0]?.title?.split(':')[0] || 'Lesson Series',
                    description: `A ${seriesLessons.length}-lesson series`,
                    topic: seriesLessons[0]?.title?.split(':')[0] || 'Topic',
                    totalLessons: seriesLessons.length,
                    completedLessons: completedCount,
                    difficulty: seriesLessons[0]?.difficulty || 'beginner',
                    category: 'custom',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    isPublic: false,
                    lessons: seriesLessons,
                    totalXP: seriesLessons.length * 50,
                    earnedXP: completedCount * 50,
                    progress: seriesLessons.length > 0 ? Math.round((completedCount / seriesLessons.length) * 100) : 0,
                    tags: [],
                });
            }
        } catch (error) {
            console.error('Error loading series:', error);
            showToast('Failed to load series', { type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleStartLesson = (lesson: Lesson) => {
        router.push({
            pathname: '/series-lesson',
            params: {
                lessonId: lesson.id,
                seriesId: id,
                title: lesson.title,
            },
        });
    };

    const handleDeleteSeries = () => {
        modal.confirm(
            'Delete Series',
            'Are you sure you want to delete this lesson series? This action cannot be undone.',
            async () => {
                const success = await lessonSeriesService.deleteSeries(id!);
                if (success) {
                    showToast('Series deleted', { type: 'success' });
                    router.back();
                } else {
                    showToast('Failed to delete series', { type: 'error' });
                }
            },
            'Delete',
            'Cancel'
        );
    };

    const getCategoryInfo = (categoryId: string) => {
        return LESSON_CATEGORIES.find(c => c.id === categoryId) || LESSON_CATEGORIES[LESSON_CATEGORIES.length - 1];
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: theme.background.primary }]}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.text.secondary }]}>Loading series...</Text>
            </View>
        );
    }

    if (!series) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: theme.background.primary }]}>
                <Text style={[styles.errorText, { color: theme.text.primary }]}>Series not found</Text>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: theme.primary }]}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const categoryInfo = getCategoryInfo(series.category);
    const nextLesson = lessons.find(l => !l.completed);

    return (
        <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
            {/* Header */}
            <LinearGradient
                colors={[categoryInfo.color, adjustColor(categoryInfo.color, -40)]}
                style={[styles.header, { paddingTop: insets.top + 10 }]}
            >
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                        <ArrowLeft size={24} color="#FFF" />
                    </TouchableOpacity>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.headerBtn}>
                            <Share2 size={20} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.headerBtn} onPress={handleDeleteSeries}>
                            <Trash2 size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.headerContent}>
                    <Text style={styles.categoryIcon}>{categoryInfo.icon}</Text>
                    <Text style={styles.seriesTitle}>{series.title}</Text>
                    <Text style={styles.seriesDesc}>{series.description}</Text>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <BookOpen size={16} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.statText}>{series.totalLessons} lessons</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Clock size={16} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.statText}>~{series.totalLessons * 8} min</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Zap size={16} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.statText}>{series.totalXP} XP</Text>
                        </View>
                    </View>

                    {/* Progress */}
                    <View style={styles.progressSection}>
                        <View style={styles.progressHeader}>
                            <Text style={styles.progressLabel}>Progress</Text>
                            <Text style={styles.progressPercent}>{series.progress}%</Text>
                        </View>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${series.progress}%` }]} />
                        </View>
                        <Text style={styles.progressText}>
                            {series.completedLessons} of {series.totalLessons} completed
                        </Text>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Continue Button */}
                {nextLesson && (
                    <Animated.View entering={FadeInDown.duration(500)}>
                        <TouchableOpacity
                            style={[styles.continueBtn, { backgroundColor: theme.primary }]}
                            onPress={() => handleStartLesson(nextLesson)}
                        >
                            <Play size={24} color="#FFF" fill="#FFF" />
                            <View style={styles.continueBtnContent}>
                                <Text style={styles.continueBtnTitle}>Continue Learning</Text>
                                <Text style={styles.continueBtnSubtitle}>{nextLesson.title}</Text>
                            </View>
                            <ChevronRight size={24} color="#FFF" />
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {/* Lessons List */}
                <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Lessons</Text>

                {lessons.map((lesson, index) => {
                    const isLocked = index > 0 && !lessons[index - 1].completed && !lesson.completed;
                    const isCompleted = lesson.completed;
                    const isCurrent = !isCompleted && !isLocked;

                    return (
                        <Animated.View
                            key={lesson.id}
                            entering={FadeInRight.delay(index * 100).duration(500)}
                        >
                            <TouchableOpacity
                                style={[
                                    styles.lessonCard,
                                    {
                                        backgroundColor: theme.background.secondary,
                                        borderColor: isCompleted
                                            ? '#2ECC71'
                                            : isCurrent
                                                ? theme.primary
                                                : theme.border.light,
                                        opacity: isLocked ? 0.5 : 1,
                                    },
                                ]}
                                onPress={() => !isLocked && handleStartLesson(lesson)}
                                disabled={isLocked}
                            >
                                <View
                                    style={[
                                        styles.lessonNumber,
                                        {
                                            backgroundColor: isCompleted
                                                ? '#2ECC71'
                                                : isCurrent
                                                    ? theme.primary
                                                    : theme.background.tertiary,
                                        },
                                    ]}
                                >
                                    {isCompleted ? (
                                        <CheckCircle size={20} color="#FFF" />
                                    ) : isLocked ? (
                                        <Lock size={18} color={theme.text.muted} />
                                    ) : (
                                        <Text style={styles.lessonNumberText}>{lesson.order}</Text>
                                    )}
                                </View>

                                <View style={styles.lessonContent}>
                                    <Text
                                        style={[
                                            styles.lessonTitle,
                                            { color: theme.text.primary },
                                            isCompleted && styles.lessonTitleCompleted,
                                        ]}
                                    >
                                        {lesson.title}
                                    </Text>
                                    <View style={styles.lessonMeta}>
                                        <Text style={[styles.lessonMetaText, { color: theme.text.secondary }]}>
                                            {lesson.estimatedMinutes} min
                                        </Text>
                                        <Text style={[styles.lessonMetaText, { color: theme.text.secondary }]}>
                                            •
                                        </Text>
                                        <Text style={[styles.lessonMetaText, { color: '#F1C40F' }]}>
                                            +{lesson.xpReward} XP
                                        </Text>
                                        {isCompleted && lesson.score && (
                                            <>
                                                <Text style={[styles.lessonMetaText, { color: theme.text.secondary }]}>
                                                    •
                                                </Text>
                                                <Text style={[styles.lessonMetaText, { color: '#2ECC71' }]}>
                                                    {lesson.score}%
                                                </Text>
                                            </>
                                        )}
                                    </View>
                                </View>

                                {!isLocked && (
                                    <ChevronRight size={20} color={theme.text.muted} />
                                )}
                            </TouchableOpacity>
                        </Animated.View>
                    );
                })}

                {/* Completion Badge */}
                {series.progress === 100 && (
                    <Animated.View
                        entering={FadeInDown.delay(lessons.length * 100).duration(500)}
                        style={styles.completionBadge}
                    >
                        <LinearGradient
                            colors={['#F1C40F', '#E67E22']}
                            style={styles.completionGradient}
                        >
                            <Trophy size={40} color="#FFF" />
                            <Text style={styles.completionTitle}>Series Completed! 🎉</Text>
                            <Text style={styles.completionText}>
                                You've earned {series.earnedXP} XP
                            </Text>
                        </LinearGradient>
                    </Animated.View>
                )}
            </ScrollView>
            <CustomModal {...modal.modalProps} />
        </View>
    );
}

function adjustColor(color: string, amount: number): string {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
    },
    errorText: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    backButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    backButtonText: {
        color: '#FFF',
        fontWeight: '600',
    },
    header: {
        paddingBottom: 24,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    headerBtn: {
        padding: 8,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    headerContent: {
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    categoryIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    seriesTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: 8,
    },
    seriesDesc: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 16,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 20,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
    },
    progressSection: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
        padding: 16,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 14,
        color: '#FFF',
        fontWeight: '600',
    },
    progressPercent: {
        fontSize: 14,
        color: '#FFF',
        fontWeight: '700',
    },
    progressBar: {
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 4,
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#FFF',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
    },
    content: {
        padding: 20,
        paddingBottom: 100,
    },
    continueBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        gap: 12,
    },
    continueBtnContent: {
        flex: 1,
    },
    continueBtnTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
    continueBtnSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    lessonCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 2,
        gap: 12,
    },
    lessonNumber: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    lessonNumberText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
    lessonContent: {
        flex: 1,
    },
    lessonTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
    },
    lessonTitleCompleted: {
        textDecorationLine: 'line-through',
        opacity: 0.7,
    },
    lessonMeta: {
        flexDirection: 'row',
        gap: 8,
    },
    lessonMetaText: {
        fontSize: 12,
    },
    completionBadge: {
        marginTop: 24,
        borderRadius: 20,
        overflow: 'hidden',
    },
    completionGradient: {
        alignItems: 'center',
        padding: 32,
    },
    completionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFF',
        marginTop: 12,
    },
    completionText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 8,
    },
});
