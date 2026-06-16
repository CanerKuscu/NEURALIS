/**
 * NEURALIS - Quick Fire 60s Quiz Screen
 * 60 saniyede 10 soru — hızlı yanıtla, bonus kazan!
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Vibration,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Zap, Timer, Trophy, Target, Flame, RotateCcw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeIn,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import { supabase } from '../src/config/supabase';
import type { QuickFireRound } from '../src/services/QuickFireService';
import { quickFireService, QuickFireQuestion } from '../src/services/QuickFireService';
import * as Haptics from 'expo-haptics';
import i18n from '../src/i18n';

const { width } = Dimensions.get('window');

const TOTAL_TIME = 60; // seconds

type GameState = 'loading' | 'countdown' | 'playing' | 'result';

export default function QuickFireScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme } = useTheme();

  const [gameState, setGameState] = useState<GameState>('loading');
  const [round, setRound] = useState<QuickFireRound | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const questionStartRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const progressWidth = useSharedValue(1);
  const shakeX = useSharedValue(0);

  useEffect(() => {
    loadRound();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const loadRound = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return;
    const r = await quickFireService.generateRound(session.user.id);
    setRound(r);
    setGameState('countdown');
    startCountdown();
  };

  const startCountdown = () => {
    let c = 3;
    setCountdown(c);
    const iv = setInterval(() => {
      c--;
      setCountdown(c);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (c <= 0) {
        clearInterval(iv);
        setGameState('playing');
        startTimer();
        questionStartRef.current = Date.now();
      }
    }, 1000);
  };

  const startTimer = () => {
    progressWidth.value = withTiming(0, { duration: TOTAL_TIME * 1000 });
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          finishGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const finishGame = useCallback(async () => {
    setGameState('result');
    if (timerRef.current) clearInterval(timerRef.current);
    if (!round) return;
    round.totalScore = score;
    round.correctCount = correct;
    round.finishedAt = new Date().toISOString();
    await quickFireService.saveResult(round);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [round, score, correct]);

  const handleAnswer = (answerIdx: number) => {
    if (showFeedback || !round) return;
    const q = round.questions[currentQ];
    const timeMs = Date.now() - questionStartRef.current;
    const isCorrect = answerIdx === q.correctAnswer;
    const pts = quickFireService.calculateScore(timeMs, isCorrect, q.points, q.timeBonus);

    setSelectedAnswer(answerIdx);
    setShowFeedback(true);

    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScore((prev) => prev + pts);
      setCorrect((prev) => prev + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shakeX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    }

    round.answers.push({ questionId: q.id, selectedAnswer: answerIdx, correct: isCorrect, timeMs });

    setTimeout(() => {
      setShowFeedback(false);
      setSelectedAnswer(null);
      if (currentQ + 1 >= round.questions.length) {
        finishGame();
      } else {
        setCurrentQ((prev) => prev + 1);
        questionStartRef.current = Date.now();
      }
    }, 500);
  };

  const progressStyle = useAnimatedStyle(() => ({ width: `${progressWidth.value * 100}%` }));
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  // ─── LOADING ───
  if (gameState === 'loading') {
    return (
      <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
        <ActivityIndicator size="large" color="#FF6B00" style={{ marginTop: 200 }} />
        <Text style={[styles.loadingText, { color: theme.text.secondary }]}>
          ⚡ Sorular hazırlanıyor...
        </Text>
      </View>
    );
  }

  // ─── COUNTDOWN ───
  if (gameState === 'countdown') {
    return (
      <View
        style={[styles.container, styles.center, { backgroundColor: theme.background.primary }]}
      >
        <Animated.Text entering={ZoomIn} style={styles.countdownText}>
          {countdown}
        </Animated.Text>
        <Text style={[styles.countdownSub, { color: theme.text.secondary }]}>Hazır ol!</Text>
      </View>
    );
  }

  // ─── RESULT ───
  if (gameState === 'result') {
    const accuracy = round ? Math.round((correct / round.questions.length) * 100) : 0;
    return (
      <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
        <LinearGradient
          colors={['#FF6B00', '#FF8C00']}
          style={[styles.resultHeader, { paddingTop: insets.top + 20 }]}
        >
          <Animated.View entering={ZoomIn}>
            <Trophy size={64} color="#FFD700" />
          </Animated.View>
          <Text style={styles.resultTitle}>⚡ Quick Fire Bitti!</Text>
        </LinearGradient>
        <View style={styles.resultBody}>
          <Animated.View
            entering={FadeInDown.delay(200)}
            style={[styles.statCard, { backgroundColor: theme.background.secondary }]}
          >
            <Target size={24} color="#2ECC71" />
            <Text style={[styles.statValue, { color: theme.text.primary }]}>{score}</Text>
            <Text style={[styles.statLabel, { color: theme.text.secondary }]}>
              {i18n.t('quickfire.total_score')}
            </Text>
          </Animated.View>
          <Animated.View
            entering={FadeInDown.delay(300)}
            style={[styles.statCard, { backgroundColor: theme.background.secondary }]}
          >
            <Flame size={24} color="#FF6B00" />
            <Text style={[styles.statValue, { color: theme.text.primary }]}>
              {correct}/{round?.questions.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.text.secondary }]}>
              {i18n.t('quickfire.correct')}
            </Text>
          </Animated.View>
          <Animated.View
            entering={FadeInDown.delay(400)}
            style={[styles.statCard, { backgroundColor: theme.background.secondary }]}
          >
            <Zap size={24} color="#FFD700" />
            <Text style={[styles.statValue, { color: theme.text.primary }]}>%{accuracy}</Text>
            <Text style={[styles.statLabel, { color: theme.text.secondary }]}>
              {i18n.t('quickfire.accuracy')}
            </Text>
          </Animated.View>
        </View>
        <View style={styles.resultActions}>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              setGameState('loading');
              setScore(0);
              setCorrect(0);
              setCurrentQ(0);
              setTimeLeft(TOTAL_TIME);
              progressWidth.value = 1;
              loadRound();
            }}
          >
            <RotateCcw size={20} color="#FFF" />
            <Text style={styles.retryText}>Tekrar Oyna</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exitBtn} onPress={() => router.back()}>
            <Text style={styles.exitText}>{i18n.t('quickfire.exit')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── PLAYING ───
  const question = round?.questions[currentQ];
  if (!question) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => {
            if (timerRef.current) clearInterval(timerRef.current);
            router.back();
          }}
          style={styles.closeBtn}
        >
          <ArrowLeft size={22} color={theme.text.primary} />
        </TouchableOpacity>
        <View style={styles.timerContainer}>
          <Timer size={18} color={timeLeft <= 10 ? '#FF4B4B' : '#FF6B00'} />
          <Text style={[styles.timerText, timeLeft <= 10 && { color: '#FF4B4B' }]}>
            {timeLeft}s
          </Text>
        </View>
        <View style={styles.scoreContainer}>
          <Zap size={16} color="#FFD700" />
          <Text style={[styles.scoreText, { color: theme.text.primary }]}>{score}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <Animated.View style={[styles.progressBarFill, progressStyle]} />
      </View>

      {/* Question counter */}
      <Text style={[styles.questionCounter, { color: theme.text.secondary }]}>
        {currentQ + 1} / {round?.questions.length}
      </Text>

      {/* Question */}
      <Animated.View
        style={[styles.questionCard, shakeStyle, { backgroundColor: theme.background.secondary }]}
      >
        <Text style={[styles.categoryBadge, { color: '#FF6B00' }]}>{question.category}</Text>
        <Text style={[styles.questionText, { color: theme.text.primary }]}>
          {question.question}
        </Text>
      </Animated.View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {question.options.map((opt, i) => {
          let bg = theme.background.secondary;
          let border = '#333';
          if (showFeedback) {
            if (i === question.correctAnswer) {
              bg = '#2ECC7133';
              border = '#2ECC71';
            } else if (i === selectedAnswer && i !== question.correctAnswer) {
              bg = '#FF4B4B33';
              border = '#FF4B4B';
            }
          }
          return (
            <Animated.View key={i} entering={FadeInDown.delay(i * 60)}>
              <TouchableOpacity
                onPress={() => handleAnswer(i)}
                disabled={showFeedback}
                style={[styles.optionBtn, { backgroundColor: bg, borderColor: border }]}
              >
                <View style={[styles.optionLetter, { borderColor: border }]}>
                  <Text style={[styles.optionLetterText, { color: theme.text.primary }]}>
                    {String.fromCharCode(65 + i)}
                  </Text>
                </View>
                <Text style={[styles.optionText, { color: theme.text.primary }]}>{opt}</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  loadingText: { textAlign: 'center', marginTop: 16, fontSize: 14 },
  countdownText: { fontSize: 96, fontWeight: '900', color: '#FF6B00' },
  countdownSub: { fontSize: 20, fontWeight: '600', marginTop: 8 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,107,0,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timerText: { fontSize: 18, fontWeight: '800', color: '#FF6B00' },
  scoreContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  scoreText: { fontSize: 18, fontWeight: '700' },

  progressBarContainer: { height: 4, backgroundColor: '#333', marginHorizontal: 16 },
  progressBarFill: { height: '100%', backgroundColor: '#FF6B00', borderRadius: 2 },

  questionCounter: { textAlign: 'center', fontSize: 12, marginTop: 12, fontWeight: '600' },

  questionCard: {
    margin: 16,
    borderRadius: 20,
    padding: 20,
    minHeight: 120,
    justifyContent: 'center',
  },
  categoryBadge: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 },
  questionText: { fontSize: 18, fontWeight: '700', lineHeight: 26 },

  optionsContainer: { paddingHorizontal: 16, gap: 10 },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLetterText: { fontSize: 14, fontWeight: '700' },
  optionText: { flex: 1, fontSize: 15, fontWeight: '600' },

  resultHeader: {
    alignItems: 'center',
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  resultTitle: { fontSize: 24, fontWeight: '800', color: '#FFF', marginTop: 12 },
  resultBody: { flexDirection: 'row', justifyContent: 'space-around', padding: 20, gap: 12 },
  statCard: { flex: 1, alignItems: 'center', borderRadius: 16, padding: 16, gap: 8 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600' },
  resultActions: { padding: 20, gap: 12 },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF6B00',
    borderRadius: 14,
    padding: 16,
  },
  retryText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  exitBtn: { alignItems: 'center', padding: 12 },
  exitText: { color: '#888', fontSize: 14, fontWeight: '600' },
});
