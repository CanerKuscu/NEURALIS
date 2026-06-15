/**
 * NEURALIS - AI Exam Simulator Screen
 * YKS / LGS / KPSS formatında AI sınav simülatörü
 */

import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, ActivityIndicator, Dimensions, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Timer, CheckCircle, XCircle, Trophy, Target, BookOpen, ChevronRight, BarChart3, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, ZoomIn, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import { supabase } from '../src/config/supabase';
import { examSimulatorService, ExamSession, ExamConfig, EXAM_CONFIGS } from '../src/services/ExamSimulatorService';
import * as Haptics from 'expo-haptics';
import i18n from '../src/i18n';

const { width } = Dimensions.get('window');

type ScreenState = 'menu' | 'loading' | 'exam' | 'result';

export default function ExamSimulatorScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { theme } = useTheme();

    const [screenState, setScreenState] = useState<ScreenState>('menu');
    const [session, setSession] = useState<ExamSession | null>(null);
    const [currentQ, setCurrentQ] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [userId, setUserId] = useState('');
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const progressWidth = useSharedValue(1);
    const progressStyle = useAnimatedStyle(() => ({ width: `${progressWidth.value * 100}%` }));

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) setUserId(session.user.id);
        });
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    const startExam = async (config: ExamConfig) => {
        setScreenState('loading');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const s = await examSimulatorService.startExam(userId, config);
        if (s.questions.length === 0) {
            setScreenState('menu');
            return;
        }
        setSession(s);
        setTimeLeft(config.durationMinutes * 60);
        setScreenState('exam');
        startTimer(config.durationMinutes * 60);
    };

    const startTimer = (totalSeconds: number) => {
        progressWidth.value = withTiming(0, { duration: totalSeconds * 1000 });
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) { finishExam(); return 0; }
                return prev - 1;
            });
        }, 1000);
    };

    const handleAnswer = (index: number) => {
        if (isAnswered || !session) return;
        setSelectedAnswer(index);
        setIsAnswered(true);
        const q = session.questions[currentQ];
        const result = examSimulatorService.submitAnswer(session, q.id, index);
        if (result.correct) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    };

    const handleNext = () => {
        if (!session) return;
        setSelectedAnswer(null);
        setIsAnswered(false);
        if (currentQ + 1 >= session.questions.length) {
            finishExam();
        } else {
            setCurrentQ(prev => prev + 1);
        }
    };

    const finishExam = async () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (!session) return;
        const finished = examSimulatorService.finishExam(session);
        setSession(finished);
        await examSimulatorService.saveResult(finished);
        setScreenState('result');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    // ─── MENU ───
    if (screenState === 'menu') {
        return (
            <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
                <LinearGradient colors={['#2980B9', '#2471A3']} style={[styles.header, { paddingTop: insets.top + 8 }]}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <ArrowLeft size={24} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>📝 Sınav Simülasyonu</Text>
                        <View style={{ width: 40 }} />
                    </View>
                    <Text style={styles.headerSub}>AI ile gerçek sınav deneyimi</Text>
                </LinearGradient>

                <FlatList
                    data={EXAM_CONFIGS}
                    keyExtractor={c => c.type}
                    contentContainerStyle={{ padding: 16, gap: 12 }}
                    renderItem={({ item, index }) => (
                        <Animated.View entering={FadeInDown.delay(index * 100)}>
                            <TouchableOpacity style={[styles.examCard, { backgroundColor: theme.background.secondary }]} onPress={() => startExam(item)}>
                                <Text style={styles.examEmoji}>{item.emoji}</Text>
                                <View style={styles.examInfo}>
                                    <Text style={[styles.examTitle, { color: theme.text.primary }]}>{item.label}</Text>
                                    <Text style={[styles.examDesc, { color: theme.text.secondary }]}>{item.description}</Text>
                                    <View style={styles.examMeta}>
                                        <View style={styles.metaBadge}>
                                            <BookOpen size={12} color="#3498DB" />
                                            <Text style={styles.metaText}>{item.questionCount} soru</Text>
                                        </View>
                                        <View style={styles.metaBadge}>
                                            <Clock size={12} color="#E67E22" />
                                            <Text style={styles.metaText}>{item.durationMinutes} dk</Text>
                                        </View>
                                    </View>
                                </View>
                                <ChevronRight size={20} color={theme.text.secondary} />
                            </TouchableOpacity>
                        </Animated.View>
                    )}
                />
            </View>
        );
    }

    // ─── LOADING ───
    if (screenState === 'loading') {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: theme.background.primary }]}>
                <ActivityIndicator size="large" color="#2980B9" />
                <Text style={[styles.loadingText, { color: theme.text.secondary }]}>{i18n.t('exam.creating_questions')}</Text>
            </View>
        );
    }

    // ─── RESULT ───
    if (screenState === 'result' && session) {
        const accuracy = session.questions.length > 0 ? Math.round((session.score / session.questions.length) * 100) : 0;
        return (
            <ScrollView style={[styles.container, { backgroundColor: theme.background.primary }]}>
                <LinearGradient colors={accuracy >= 70 ? ['#2ECC71', '#27AE60'] : ['#E74C3C', '#C0392B']}
                    style={[styles.resultHeader, { paddingTop: insets.top + 20 }]}>
                    <Animated.View entering={ZoomIn}>
                        <Trophy size={56} color="#FFD700" />
                    </Animated.View>
                    <Text style={styles.resultTitle}>{i18n.t('exam.exam_completed')}</Text>
                    <Text style={styles.resultScore}>%{accuracy}</Text>
                    <Text style={styles.resultSub}>{session.score}/{session.questions.length} doğru</Text>
                </LinearGradient>

                <View style={styles.breakdownContainer}>
                    <Text style={[styles.breakdownTitle, { color: theme.text.primary }]}>Kategori Kırılımı</Text>
                    {session.categoryBreakdown.filter(b => b.total > 0).map((b, i) => (
                        <Animated.View key={b.category} entering={FadeInDown.delay(i * 100)}
                            style={[styles.breakdownRow, { backgroundColor: theme.background.secondary }]}>
                            <Text style={[styles.breakdownCat, { color: theme.text.primary }]}>{b.category}</Text>
                            <View style={styles.breakdownBar}>
                                <View style={[styles.breakdownFill, { width: `${b.total > 0 ? (b.correct / b.total) * 100 : 0}%` }]} />
                            </View>
                            <Text style={[styles.breakdownScore, { color: theme.text.secondary }]}>{b.correct}/{b.total}</Text>
                        </Animated.View>
                    ))}
                </View>

                <View style={styles.resultActions}>
                    <TouchableOpacity style={styles.retryBtn} onPress={() => { setScreenState('menu'); setCurrentQ(0); setSession(null); }}>
                        <Text style={styles.retryBtnText}>Yeni Sınav</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.exitBtn} onPress={() => router.back()}>
                        <Text style={[styles.exitBtnText, { color: theme.text.secondary }]}>Çıkış</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    }

    // ─── EXAM ───
    if (!session || session.questions.length === 0) return null;
    const question = session.questions[currentQ];

    return (
        <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
            {/* Top Bar */}
            <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
                <Text style={[styles.qCounter, { color: theme.text.secondary }]}>{currentQ + 1}/{session.questions.length}</Text>
                <View style={styles.timerBadge}>
                    <Timer size={16} color={timeLeft <= 60 ? '#FF4B4B' : '#2980B9'} />
                    <Text style={[styles.timerText, timeLeft <= 60 && { color: '#FF4B4B' }]}>{formatTime(timeLeft)}</Text>
                </View>
            </View>

            {/* Progress */}
            <View style={styles.progressBar}>
                <Animated.View style={[styles.progressFill, progressStyle]} />
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
                {/* Question */}
                <View style={[styles.questionCard, { backgroundColor: theme.background.secondary }]}>
                    <Text style={[styles.questionText, { color: theme.text.primary }]}>{question.question}</Text>
                </View>

                {/* Options */}
                {(question.options || []).map((opt, i) => {
                    let bg = theme.background.secondary;
                    let borderColor = '#333';
                    if (isAnswered) {
                        if (i === question.correctAnswer) { bg = '#2ECC7133'; borderColor = '#2ECC71'; }
                        else if (i === selectedAnswer) { bg = '#FF4B4B33'; borderColor = '#FF4B4B'; }
                    }
                    return (
                        <Animated.View key={i} entering={FadeInDown.delay(i * 50)}>
                            <TouchableOpacity style={[styles.optionBtn, { backgroundColor: bg, borderColor }]}
                                onPress={() => handleAnswer(i)} disabled={isAnswered}>
                                <View style={[styles.optionLetter, { borderColor }]}>
                                    <Text style={[styles.letterText, { color: theme.text.primary }]}>{String.fromCharCode(65 + i)}</Text>
                                </View>
                                <Text style={[styles.optionText, { color: theme.text.primary }]}>{opt}</Text>
                                {isAnswered && i === question.correctAnswer && <CheckCircle size={20} color="#2ECC71" />}
                                {isAnswered && i === selectedAnswer && i !== question.correctAnswer && <XCircle size={20} color="#FF4B4B" />}
                            </TouchableOpacity>
                        </Animated.View>
                    );
                })}

                {/* Explanation */}
                {isAnswered && question.explanation && (
                    <Animated.View entering={FadeInDown} style={[styles.explanationCard, { backgroundColor: theme.background.secondary }]}>
                        <Text style={[styles.explanationLabel, { color: '#2980B9' }]}>📖 Açıklama:</Text>
                        <Text style={[styles.explanationText, { color: theme.text.primary }]}>{question.explanation}</Text>
                    </Animated.View>
                )}

                {/* Next Button */}
                {isAnswered && (
                    <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                        <Text style={styles.nextBtnText}>
                            {currentQ + 1 >= session.questions.length ? i18n.t('exam.finish_exam') : i18n.t('exam.next_question')}
                        </Text>
                        <ChevronRight size={20} color="#FFF" />
                    </TouchableOpacity>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { alignItems: 'center', justifyContent: 'center' },
    header: { paddingHorizontal: 16, paddingBottom: 20 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },
    headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'center', marginTop: 8 },
    loadingText: { marginTop: 16, fontSize: 15 },

    examCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, gap: 14 },
    examEmoji: { fontSize: 32 },
    examInfo: { flex: 1 },
    examTitle: { fontSize: 17, fontWeight: '700' },
    examDesc: { fontSize: 12, marginTop: 2, lineHeight: 16 },
    examMeta: { flexDirection: 'row', gap: 12, marginTop: 8 },
    metaBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 11, color: '#888', fontWeight: '600' },

    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8 },
    qCounter: { fontSize: 14, fontWeight: '700' },
    timerBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(41,128,185,0.12)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
    timerText: { fontSize: 16, fontWeight: '800', color: '#2980B9' },

    progressBar: { height: 4, backgroundColor: '#222', marginHorizontal: 16 },
    progressFill: { height: '100%', backgroundColor: '#2980B9', borderRadius: 2 },

    questionCard: { borderRadius: 18, padding: 20, marginBottom: 16 },
    questionText: { fontSize: 17, fontWeight: '600', lineHeight: 24 },

    optionBtn: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, borderWidth: 1.5, gap: 12, marginBottom: 8 },
    optionLetter: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
    letterText: { fontSize: 14, fontWeight: '700' },
    optionText: { flex: 1, fontSize: 15 },

    explanationCard: { borderRadius: 14, padding: 14, marginTop: 8, marginBottom: 8 },
    explanationLabel: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
    explanationText: { fontSize: 14, lineHeight: 20 },

    nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2980B9', borderRadius: 16, padding: 16, marginTop: 12 },
    nextBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

    resultHeader: { alignItems: 'center', paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    resultTitle: { fontSize: 22, fontWeight: '800', color: '#FFF', marginTop: 12 },
    resultScore: { fontSize: 48, fontWeight: '900', color: '#FFF', marginTop: 4 },
    resultSub: { color: 'rgba(255,255,255,0.8)', fontSize: 15, fontWeight: '600' },

    breakdownContainer: { padding: 16, gap: 8 },
    breakdownTitle: { fontSize: 17, fontWeight: '700', marginBottom: 8 },
    breakdownRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 12, gap: 10 },
    breakdownCat: { width: 90, fontSize: 13, fontWeight: '600' },
    breakdownBar: { flex: 1, height: 8, backgroundColor: '#333', borderRadius: 4, overflow: 'hidden' },
    breakdownFill: { height: '100%', backgroundColor: '#2ECC71', borderRadius: 4 },
    breakdownScore: { fontSize: 13, fontWeight: '700', width: 40, textAlign: 'right' },

    resultActions: { padding: 20, gap: 12 },
    retryBtn: { backgroundColor: '#2980B9', borderRadius: 16, padding: 16, alignItems: 'center' },
    retryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    exitBtn: { alignItems: 'center', padding: 12 },
    exitBtnText: { fontSize: 14, fontWeight: '600' },
});
