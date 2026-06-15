/**
 * Spaced Repetition Screen — Flash Card Tekrar Sistemi
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, RotateCcw, Check, X, Brain, Layers, TrendingUp, Calendar, ChevronRight, Sparkles } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withSpring, withTiming, interpolate, Extrapolation } from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import { spacedRepetitionService } from '../src/services/SpacedRepetitionService';
import type { FlashCard, ReviewSession } from '../src/services/SpacedRepetitionService';
import * as Haptics from 'expo-haptics';
import i18n from '../src/i18n';

const { width } = Dimensions.get('window');

export default function SpacedRepetitionScreen() {
    const insets = useSafeAreaInsets();
    const { theme, isDark } = useTheme();
    const [session, setSession] = useState<ReviewSession | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [results, setResults] = useState<{ correct: number; wrong: number }>({ correct: 0, wrong: 0 });
    const [isComplete, setIsComplete] = useState(false);
    const flipAnim = useSharedValue(0);

    useEffect(() => {
        loadSession();
    }, []);

    const loadSession = async () => {
        const s = await spacedRepetitionService.getReviewSession();
        setSession(s);
        if (s.dueCards.length === 0) setIsComplete(true);
    };

    const currentCard = session?.dueCards[currentIndex];

    const flipCard = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsFlipped(!isFlipped);
        flipAnim.value = withSpring(isFlipped ? 0 : 1);
    };

    const handleAnswer = async (correct: boolean) => {
        if (!currentCard) return;
        Haptics.impactAsync(correct ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Heavy);
        await spacedRepetitionService.reviewCard(currentCard.id, correct);

        setResults(prev => ({
            correct: prev.correct + (correct ? 1 : 0),
            wrong: prev.wrong + (correct ? 0 : 1),
        }));

        if (currentIndex + 1 >= (session?.dueCards.length || 0)) {
            setIsComplete(true);
        } else {
            setCurrentIndex(prev => prev + 1);
            setIsFlipped(false);
            flipAnim.value = withTiming(0, { duration: 200 });
        }
    };

    const frontStyle = useAnimatedStyle(() => ({
        transform: [{ rotateY: `${interpolate(flipAnim.value, [0, 1], [0, 180])}deg` }],
        opacity: interpolate(flipAnim.value, [0, 0.5, 1], [1, 0, 0]),
    }));
    const backStyle = useAnimatedStyle(() => ({
        transform: [{ rotateY: `${interpolate(flipAnim.value, [0, 1], [180, 360])}deg` }],
        opacity: interpolate(flipAnim.value, [0, 0.5, 1], [0, 0, 1]),
    }));

    if (isComplete) {
        return (
            <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background.primary }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <ArrowLeft size={24} color={theme.text.primary} />
                </TouchableOpacity>
                <View style={styles.completeContainer}>
                    <Animated.View entering={FadeInDown.springify()}>
                        <LinearGradient colors={['#2ECC71', '#27AE60']} style={styles.completeBadge}>
                            <Check size={48} color="#FFF" />
                        </LinearGradient>
                    </Animated.View>
                    <Text style={[styles.completeTitle, { color: theme.text.primary }]}>
                        {session?.dueCards.length === 0 ? i18n.t('spaced.no_cards') : i18n.t('spaced.review_completed')}
                    </Text>
                    {results.correct + results.wrong > 0 && (
                        <View style={styles.resultRow}>
                            <View style={[styles.resultBadge, { backgroundColor: '#2ECC71' }]}>
                                <Check size={16} color="#FFF" />
                                <Text style={styles.resultText}>{results.correct} {i18n.t('spaced.correct')}</Text>
                            </View>
                            <View style={[styles.resultBadge, { backgroundColor: '#E74C3C' }]}>
                                <X size={16} color="#FFF" />
                                <Text style={styles.resultText}>{results.wrong} {i18n.t('spaced.incorrect')}</Text>
                            </View>
                        </View>
                    )}
                    <Text style={[styles.completeDesc, { color: theme.text.secondary }]}>
                        {session?.dueCards.length === 0
                            ? i18n.t('spaced.cards_auto_add')
                            : `Mastery: %${session?.masteryPercentage || 0}`}
                    </Text>
                    <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
                        <Text style={styles.doneBtnText}>{i18n.t('common.ok')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background.primary }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <ArrowLeft size={24} color={theme.text.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Tekrar Kartları</Text>
                <Text style={[styles.progress, { color: theme.text.secondary }]}>
                    {currentIndex + 1}/{session?.dueCards.length || 0}
                </Text>
            </View>

            {/* Progress Bar */}
            <View style={[styles.progressBar, { backgroundColor: theme.border.light }]}>
                <View style={[styles.progressFill, { width: `${(currentIndex / (session?.dueCards.length || 1)) * 100}%` }]} />
            </View>

            {/* Box Info */}
            {currentCard && (
                <View style={styles.boxInfo}>
                    <Layers size={14} color={theme.text.secondary} />
                    <Text style={[styles.boxText, { color: theme.text.secondary }]}>
                        Kutu {currentCard.box}/5 • {currentCard.category}
                    </Text>
                </View>
            )}

            {/* Flash Card */}
            <TouchableOpacity activeOpacity={0.95} style={styles.cardContainer} onPress={flipCard}>
                {/* Front */}
                <Animated.View style={[styles.card, frontStyle]}>
                    <LinearGradient colors={isDark ? ['#1a1a2e', '#16213e'] : ['#667EEA', '#764BA2']} style={styles.cardGradient}>
                        <Brain size={32} color="rgba(255,255,255,0.3)" />
                        <Text style={styles.cardCategory}>{currentCard?.category?.toUpperCase()}</Text>
                        <Text style={styles.cardText}>{currentCard?.front}</Text>
                        <Text style={styles.flipHint}>Cevabı görmek için dokun</Text>
                    </LinearGradient>
                </Animated.View>

                {/* Back */}
                <Animated.View style={[styles.card, styles.cardBack, backStyle]}>
                    <LinearGradient colors={isDark ? ['#16213e', '#0f3460'] : ['#2ECC71', '#27AE60']} style={styles.cardGradient}>
                        <Sparkles size={32} color="rgba(255,255,255,0.3)" />
                        <Text style={styles.cardCategory}>CEVAP</Text>
                        <Text style={styles.cardText}>{currentCard?.back}</Text>
                    </LinearGradient>
                </Animated.View>
            </TouchableOpacity>

            {/* Answer Buttons (shown when flipped) */}
            {isFlipped && (
                <Animated.View entering={FadeInUp.springify()} style={styles.answerRow}>
                    <TouchableOpacity style={[styles.answerBtn, { backgroundColor: '#E74C3C' }]} onPress={() => handleAnswer(false)}>
                        <X size={24} color="#FFF" />
                        <Text style={styles.answerBtnText}>Bilmedim</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.answerBtn, { backgroundColor: '#2ECC71' }]} onPress={() => handleAnswer(true)}>
                        <Check size={24} color="#FFF" />
                        <Text style={styles.answerBtnText}>Bildim</Text>
                    </TouchableOpacity>
                </Animated.View>
            )}

            {/* Stats Bar */}
            <View style={[styles.statsBar, { backgroundColor: theme.background.secondary }]}>
                <View style={styles.stat}>
                    <Text style={[styles.statNum, { color: '#2ECC71' }]}>{results.correct}</Text>
                    <Text style={[styles.statLabel, { color: theme.text.secondary }]}>{i18n.t('spaced.correct')}</Text>
                </View>
                <View style={styles.stat}>
                    <Text style={[styles.statNum, { color: '#E74C3C' }]}>{results.wrong}</Text>
                    <Text style={[styles.statLabel, { color: theme.text.secondary }]}>{i18n.t('spaced.incorrect')}</Text>
                </View>
                <View style={styles.stat}>
                    <Text style={[styles.statNum, { color: '#F1C40F' }]}>{session?.masteryPercentage || 0}%</Text>
                    <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Ustalık</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    backBtn: { position: 'absolute', top: 60, left: 20, zIndex: 10 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    progress: { fontSize: 14, fontWeight: '600' },
    progressBar: { height: 4, marginHorizontal: 20, borderRadius: 2, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#2ECC71', borderRadius: 2 },
    boxInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, marginTop: 8 },
    boxText: { fontSize: 13, fontWeight: '500' },
    cardContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    card: { width: width - 40, height: 280, borderRadius: 24, overflow: 'hidden', position: 'absolute' },
    cardBack: { backfaceVisibility: 'hidden' },
    cardGradient: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center', gap: 12 },
    cardCategory: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '800', letterSpacing: 2 },
    cardText: { color: '#FFF', fontSize: 22, fontWeight: '700', textAlign: 'center', lineHeight: 32 },
    flipHint: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '500', position: 'absolute', bottom: 20 },
    answerRow: { flexDirection: 'row', gap: 16, paddingHorizontal: 20, paddingBottom: 20 },
    answerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16 },
    answerBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    statsBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, marginHorizontal: 20, borderRadius: 16, marginBottom: 20 },
    stat: { alignItems: 'center' },
    statNum: { fontSize: 20, fontWeight: '800' },
    statLabel: { fontSize: 12, fontWeight: '500', marginTop: 2 },
    completeContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, gap: 16 },
    completeBadge: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
    completeTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
    completeDesc: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
    resultRow: { flexDirection: 'row', gap: 12 },
    resultBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
    resultText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
    doneBtn: { backgroundColor: '#2ECC71', paddingHorizontal: 40, paddingVertical: 14, borderRadius: 16, marginTop: 8 },
    doneBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
