/**
 * Audio Lessons Screen — Sesli Dersler (Podcast Stili)
 */
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, Play, Pause, SkipForward, Volume2, Check, Clock, Headphones, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import { audioLessonService, AUDIO_LESSONS } from '../src/services/AudioLessonService';
import type { AudioLesson, AudioProgress, AudioSegment } from '../src/services/AudioLessonService';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import i18n from '../src/i18n';

const { width } = Dimensions.get('window');

export default function AudioLessonsScreen() {
    const insets = useSafeAreaInsets();
    const { theme, isDark } = useTheme();
    const [mode, setMode] = useState<'list' | 'player' | 'quiz'>('list');
    const [lessons, setLessons] = useState<(AudioLesson & { progress?: AudioProgress })[]>([]);
    const [activeLesson, setActiveLesson] = useState<AudioLesson | null>(null);
    const [currentSegment, setCurrentSegment] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [quizIndex, setQuizIndex] = useState(0);
    const [quizScore, setQuizScore] = useState(0);
    const [quizDone, setQuizDone] = useState(false);

    useEffect(() => {
        loadLessons();
        return () => { Speech.stop(); };
    }, []);

    const loadLessons = async () => {
        const l = await audioLessonService.getLessonsWithProgress();
        setLessons(l);
    };

    const startLesson = (lesson: AudioLesson) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setActiveLesson(lesson);
        setCurrentSegment(0);
        setIsPlaying(false);
        setMode('player');
    };

    const playSegment = async (segIdx: number) => {
        if (!activeLesson) return;
        const seg = activeLesson.segments[segIdx];
        if (!seg) return;

        setIsPlaying(true);
        setCurrentSegment(segIdx);

        await Speech.speak(seg.textTr, {
            language: 'tr-TR',
            rate: 0.9,
            onDone: () => {
                audioLessonService.completeSegment(activeLesson.id, seg.id);
                if (segIdx + 1 < activeLesson.segments.length) {
                    setTimeout(() => playSegment(segIdx + 1), seg.pauseAfter);
                } else {
                    setIsPlaying(false);
                    // Quiz'e geç
                    if (activeLesson.quiz.length > 0) {
                        setQuizIndex(0);
                        setQuizScore(0);
                        setQuizDone(false);
                        setMode('quiz');
                    }
                }
            },
            onStopped: () => setIsPlaying(false),
        });
    };

    const togglePlay = () => {
        if (isPlaying) {
            Speech.stop();
            setIsPlaying(false);
        } else {
            playSegment(currentSegment);
        }
    };

    const skipToNext = () => {
        Speech.stop();
        if (activeLesson && currentSegment + 1 < activeLesson.segments.length) {
            playSegment(currentSegment + 1);
        }
    };

    const answerQuiz = async (idx: number) => {
        if (!activeLesson) return;
        const q = activeLesson.quiz[quizIndex];
        const correct = idx === q.correctIndex;
        if (correct) setQuizScore(prev => prev + 1);
        Haptics.impactAsync(correct ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Heavy);

        if (quizIndex + 1 >= activeLesson.quiz.length) {
            await audioLessonService.completeLesson(activeLesson.id, quizScore + (correct ? 1 : 0));
            setQuizDone(true);
            await loadLessons();
        } else {
            setQuizIndex(prev => prev + 1);
        }
    };

    // ── LIST VIEW ──
    if (mode === 'list') {
        return (
            <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background.primary }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <ArrowLeft size={24} color={theme.text.primary} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Sesli Dersler</Text>
                    <Headphones size={24} color={theme.primary} />
                </View>

                <ScrollView contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 100 }}>
                    <Text style={[styles.subtitle, { color: theme.text.secondary }]}>
                        {i18n.t('audio.listen_learn_desc')}
                    </Text>
                    {lessons.map((lesson, i) => (
                        <Animated.View key={lesson.id} entering={FadeInDown.delay(i * 80).springify()}>
                            <TouchableOpacity
                                activeOpacity={0.9}
                                style={[styles.lessonCard, { backgroundColor: theme.background.secondary }]}
                                onPress={() => startLesson(lesson)}
                            >
                                <View style={[styles.lessonIcon, { backgroundColor: lesson.progress?.isCompleted ? '#2ECC7120' : `${theme.primary}15` }]}>
                                    {lesson.progress?.isCompleted ? <Check size={24} color="#2ECC71" /> : <Text style={{ fontSize: 24 }}>{lesson.emoji}</Text>}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.lessonTitle, { color: theme.text.primary }]}>{lesson.titleTr}</Text>
                                    <Text style={[styles.lessonDesc, { color: theme.text.secondary }]}>{lesson.descriptionTr}</Text>
                                    <View style={styles.lessonMeta}>
                                        <Clock size={12} color={theme.text.secondary} />
                                        <Text style={[styles.lessonMetaText, { color: theme.text.secondary }]}>
                                            ~{Math.ceil(lesson.estimatedDuration / 60)} dk
                                        </Text>
                                        <View style={[styles.levelBadge, {
                                            backgroundColor: lesson.level === 'beginner' ? '#2ECC7120' : lesson.level === 'intermediate' ? '#F1C40F20' : '#E74C3C20'
                                        }]}>
                                            <Text style={[styles.levelText, {
                                                color: lesson.level === 'beginner' ? '#2ECC71' : lesson.level === 'intermediate' ? '#F1C40F' : '#E74C3C'
                                            }]}>
                                                {lesson.level === 'beginner' ? i18n.t('category.beginner') : lesson.level === 'intermediate' ? i18n.t('voice.intermediate') : i18n.t('category.advanced')}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                <ChevronRight size={20} color={theme.text.secondary} />
                            </TouchableOpacity>
                        </Animated.View>
                    ))}
                </ScrollView>
            </View>
        );
    }

    // ── PLAYER VIEW ──
    if (mode === 'player' && activeLesson) {
        const seg = activeLesson.segments[currentSegment];
        const progress = ((currentSegment + (isPlaying ? 0.5 : 0)) / activeLesson.segments.length) * 100;

        return (
            <View style={[styles.container, { paddingTop: insets.top, backgroundColor: isDark ? '#0a0a1e' : '#1a1a2e' }]}>
                <StatusBar barStyle="light-content" />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => { Speech.stop(); setMode('list'); }}>
                        <ArrowLeft size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.playerTitle}>{activeLesson.titleTr}</Text>
                    <View style={{ width: 24 }} />
                </View>

                <View style={styles.playerBody}>
                    {/* Visualizer */}
                    <Animated.View entering={FadeIn.delay(200)} style={styles.visualizer}>
                        <LinearGradient colors={['#667EEA', '#764BA2']} style={styles.vizCircle}>
                            <Text style={{ fontSize: 48 }}>{activeLesson.emoji}</Text>
                        </LinearGradient>
                        {isPlaying && (
                            <View style={styles.vizRipple} />
                        )}
                    </Animated.View>

                    {/* Segment Text */}
                    <Animated.View entering={FadeInDown.springify()} style={styles.segmentBox}>
                        {seg?.keyword && (
                            <View style={styles.keywordBadge}>
                                <Text style={styles.keywordText}>🔑 {seg.keyword}</Text>
                            </View>
                        )}
                        <Text style={styles.segmentText}>{seg?.textTr}</Text>
                        <Text style={styles.segmentProgress}>
                            Bölüm {currentSegment + 1}/{activeLesson.segments.length}
                        </Text>
                    </Animated.View>

                    {/* Progress */}
                    <View style={styles.progressBarContainer}>
                        <View style={styles.progressBg}>
                            <View style={[styles.progressFill, { width: `${progress}%` }]} />
                        </View>
                    </View>

                    {/* Controls */}
                    <View style={styles.controls}>
                        <TouchableOpacity onPress={togglePlay} style={styles.playBtn}>
                            <LinearGradient colors={['#2ECC71', '#27AE60']} style={styles.playBtnGradient}>
                                {isPlaying ? <Pause size={32} color="#FFF" /> : <Play size={32} color="#FFF" />}
                            </LinearGradient>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={skipToNext} style={styles.skipBtn}>
                            <SkipForward size={24} color="rgba(255,255,255,0.6)" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    // ── QUIZ VIEW ──
    if (mode === 'quiz' && activeLesson) {
        if (quizDone) {
            return (
                <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background.primary }]}>
                    <View style={styles.quizDoneContainer}>
                        <LinearGradient colors={['#2ECC71', '#27AE60']} style={styles.doneBadge}>
                            <Check size={48} color="#FFF" />
                        </LinearGradient>
                        <Text style={[styles.doneTitle, { color: theme.text.primary }]}>{i18n.t('audio.lesson_completed')}</Text>
                        <Text style={[styles.doneScore, { color: theme.text.secondary }]}>
                            Quiz Skoru: {quizScore}/{activeLesson.quiz.length}
                        </Text>
                        <Text style={[styles.doneXp, { color: '#F1C40F' }]}>+{activeLesson.xpReward} XP</Text>
                        <TouchableOpacity style={styles.doneBtn} onPress={() => setMode('list')}>
                            <Text style={styles.doneBtnText}>Tamam</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        const q = activeLesson.quiz[quizIndex];
        return (
            <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background.primary }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Dinleme Testi</Text>
                    <Text style={[styles.headerTitle, { color: theme.text.secondary }]}>{quizIndex + 1}/{activeLesson.quiz.length}</Text>
                </View>
                <View style={{ padding: 24, gap: 16, flex: 1 }}>
                    <Text style={[styles.quizQ, { color: theme.text.primary }]}>{q.questionTr}</Text>
                    {q.options.map((opt, i) => (
                        <TouchableOpacity key={i} style={[styles.quizOpt, { backgroundColor: theme.background.secondary }]} onPress={() => answerQuiz(i)}>
                            <Text style={[styles.quizOptText, { color: theme.text.primary }]}>{opt}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    }

    return null;
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    subtitle: { fontSize: 14, marginBottom: 8 },
    lessonCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16 },
    lessonIcon: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    lessonTitle: { fontSize: 15, fontWeight: '700' },
    lessonDesc: { fontSize: 12, marginTop: 2 },
    lessonMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
    lessonMetaText: { fontSize: 11, fontWeight: '500' },
    levelBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    levelText: { fontSize: 10, fontWeight: '700' },
    playerTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    playerBody: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 24 },
    visualizer: { alignItems: 'center', justifyContent: 'center' },
    vizCircle: { width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center' },
    vizRipple: { position: 'absolute', width: 170, height: 170, borderRadius: 85, borderWidth: 2, borderColor: 'rgba(102,126,234,0.3)' },
    segmentBox: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 24, width: '100%', gap: 10 },
    keywordBadge: { backgroundColor: 'rgba(241,196,15,0.15)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    keywordText: { color: '#F1C40F', fontSize: 12, fontWeight: '700' },
    segmentText: { color: '#FFF', fontSize: 16, lineHeight: 26, fontWeight: '500' },
    segmentProgress: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '500' },
    progressBarContainer: { width: '100%', paddingHorizontal: 20 },
    progressBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#2ECC71', borderRadius: 2 },
    controls: { flexDirection: 'row', alignItems: 'center', gap: 24 },
    playBtn: { elevation: 4 },
    playBtnGradient: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
    skipBtn: { padding: 12 },
    quizQ: { fontSize: 20, fontWeight: '700', lineHeight: 28 },
    quizOpt: { padding: 18, borderRadius: 16 },
    quizOptText: { fontSize: 16, fontWeight: '600' },
    quizDoneContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 40 },
    doneBadge: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
    doneTitle: { fontSize: 24, fontWeight: '800' },
    doneScore: { fontSize: 16 },
    doneXp: { fontSize: 20, fontWeight: '800' },
    doneBtn: { backgroundColor: '#2ECC71', paddingHorizontal: 40, paddingVertical: 14, borderRadius: 16, marginTop: 8 },
    doneBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
