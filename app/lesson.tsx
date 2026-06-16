/**
 * Category Lesson Screen - Duolingo Style
 * - Theory first, then questions
 * - Colorful feedback (green correct, red wrong)
 * - Streak animation
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  Image,
  Dimensions,
  Modal,
  TextInput,
  Vibration,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import TTSButton from '../src/components/TTSButton';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Zap,
  ChevronRight,
  Heart,
  BookOpen,
  X,
  Flame,
  Star,
  Trophy,
  Award,
  Target,
  Lightbulb,
  Volume2,
} from 'lucide-react-native';
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
  ZoomOut,
  FadeInDown,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../src/config/supabase';
import type { DailyLessonData } from '../src/services/DailyLessonService';
import { dailyLessonService } from '../src/services/DailyLessonService';
import { deepSeekService } from '../src/services/DeepSeekService';
import { lessonCacheService } from '../src/services/LessonCacheService';
import { playSound, preloadSounds } from '../src/utils/sounds';
import i18n from '../src/i18n';

// Timeout wrapper for AI calls
const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('AI_TIMEOUT')), ms)),
  ]);
};
const AI_TIMEOUT_MS = 10000;
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLORS = {
  bg: '#131F24',
  card: '#1A2C34',
  primary: '#58CC02',
  primaryDark: '#4CAD02',
  blue: '#1CB0F6',
  purple: '#CE82FF',
  gold: '#FFC800',
  orange: '#FF9600',
  red: '#FF4B4B',
  redLight: '#FF6B6B',
  text: '#FFFFFF',
  textSecondary: '#AFAFAF',
  correctGreen: '#58CC02',
  correctBg: '#1A3D1F',
  wrongRed: '#FF4B4B',
  wrongBg: '#3D1A1A',
  border: '#3C4D56',
};

type LessonPhase =
  | 'loading'
  | 'placement-test'
  | 'result'
  | 'lesson'
  | 'theory'
  | 'error'
  | 'streak-celebration'
  | 'daily-limit'
  | 'ad-reward';

type QuestionType = 'multiple_choice' | 'fill_blank' | 'true_false' | 'matching' | 'ordering';

interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options: string[];
  correctAnswer: number; // for multiple_choice / true_false
  correctText?: string; // for fill_blank
  matchPairs?: Array<{ left: string; right: string }>; // for matching
  orderItems?: string[]; // correct order for ordering
  explanation: string;
  image_keyword?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  hint?: string;
}

// Streak Celebration Modal Component
const StreakCelebration = ({
  visible,
  streak,
  onClose,
}: {
  visible: boolean;
  streak: number;
  onClose: () => void;
}) => {
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);
  const fireScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 10 });
      rotation.value = withSequence(
        withTiming(-10, { duration: 100 }),
        withTiming(10, { duration: 100 }),
        withTiming(-5, { duration: 100 }),
        withTiming(5, { duration: 100 }),
        withTiming(0, { duration: 100 }),
      );
      fireScale.value = withSequence(
        withTiming(1.3, { duration: 300 }),
        withTiming(1, { duration: 300 }),
        withTiming(1.2, { duration: 200 }),
        withTiming(1, { duration: 200 }),
      );
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }));

  const fireStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fireScale.value }],
  }));

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.streakModal}>
        <LinearGradient
          colors={['rgba(255,150,0,0.3)', 'rgba(255,75,75,0.2)', 'transparent']}
          style={styles.streakGradient}
        />
        <Animated.View style={[styles.streakContent, containerStyle]}>
          <Animated.View style={fireStyle}>
            <View style={styles.streakFireContainer}>
              <Flame size={100} color={COLORS.orange} fill={COLORS.orange} />
            </View>
          </Animated.View>
          <Animated.Text entering={ZoomIn.delay(200)} style={styles.streakNumber}>
            {streak}
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(400)} style={styles.streakTitle}>
            {i18n.t('lesson.streak_fire') || 'Streak on Fire! 🔥'}
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(600)} style={styles.streakSubtitle}>
            {i18n.t('lesson.keep_going') || 'Keep the momentum going!'}
          </Animated.Text>
          <TouchableOpacity style={styles.streakBtn} onPress={onClose}>
            <Text style={styles.streakBtnText}>{i18n.t('common.continue') || 'Continue'}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default function LessonScreen() {
  const insets = useSafeAreaInsets();
  const { subject } = useLocalSearchParams<{ subject: string }>();

  const [phase, setPhase] = useState<LessonPhase>('loading');
  const [userLevel, setUserLevel] = useState<'beginner' | 'intermediate' | 'advanced' | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [xpEarned, setXpEarned] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Gamification & Personalization
  const [age, setAge] = useState('');
  const [theoryContent, setTheoryContent] = useState<string | null>(null);

  // Wrong questions queue - re-ask wrong answers like Duolingo
  const [wrongQuestionQueue, setWrongQuestionQueue] = useState<Question[]>([]);

  // XP & Streak Tracking
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [lessonStreak, setLessonStreak] = useState(0);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [streakIncreased, setStreakIncreased] = useState(false);

  // Daily Lesson Limit & Ad System
  const [dailyLessonData, setDailyLessonData] = useState<DailyLessonData | null>(null);
  const [adLoading, setAdLoading] = useState(false);

  // Diverse question types state
  const [fillBlankInput, setFillBlankInput] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<string[]>([]);
  const [matchSelections, setMatchSelections] = useState<Record<string, string>>({});
  const [matchLeftSelected, setMatchLeftSelected] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showCorrectEffect, setShowCorrectEffect] = useState(false);
  const [showWrongEffect, setShowWrongEffect] = useState(false);

  // ELI5 Explain Button
  const [eli5Text, setEli5Text] = useState<string | null>(null);
  const [eli5Loading, setEli5Loading] = useState(false);

  // Cache tracking
  const [currentCacheId, setCurrentCacheId] = useState<string | null>(null);

  // Animation Values
  const bgColorAnim = useSharedValue(0);
  const shakeAnim = useSharedValue(0);
  const feedbackScale = useSharedValue(0);
  const correctScale = useSharedValue(0);
  const wrongShake = useSharedValue(0);
  const comboScale = useSharedValue(1);

  const bgAnimStyle = useAnimatedStyle(() => {
    const bgColor =
      bgColorAnim.value === 1
        ? COLORS.correctBg
        : bgColorAnim.value === -1
          ? COLORS.wrongBg
          : COLORS.bg;
    return { backgroundColor: bgColor };
  });

  useEffect(() => {
    setStartTime(Date.now());
    preloadSounds().catch(() => {});
    checkUserLevel();
  }, []);

  const checkUserLevel = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        router.replace('/');
        return;
      }
      setUserId(session.user.id);

      // Check daily lesson limit
      const dailyStatus = await dailyLessonService.getDailyStatus(session.user.id);
      setDailyLessonData(dailyStatus);

      if (!dailyStatus.canStartLesson && !dailyStatus.isPremium) {
        setPhase('daily-limit');
        return;
      }

      // Fetch user profile for age/streak
      const { data: profile } = await supabase
        .from('profiles')
        .select('age, streak_count')
        .eq('id', session.user.id)
        .single();
      if (profile) {
        setDailyStreak(profile.streak_count ?? 0);
        if (profile.age) setAge(profile.age.toString());
      }

      // Check level
      const { data: progress } = await supabase
        .from('user_category_levels')
        .select('level')
        .eq('user_id', session.user.id)
        .eq('category', subject)
        .maybeSingle();

      if (progress?.level) {
        setUserLevel(progress.level);
        await generateLesson(progress.level);
      } else {
        await startPlacementTest(profile?.age);
      }
    } catch (err) {
      console.error('Level check error:', err);
      setPhase('error');
    }
  };

  const startPlacementTest = async (userAge?: number) => {
    setPhase('loading');
    const langName = lessonCacheService.getLanguageName();
    try {
      const { data, error } = await withTimeout(
        supabase.functions.invoke('generate-lesson', {
          body: {
            prompt: `Generate a placement test for ${subject} with 8 questions. 
Mix difficulties (easy/medium/hard).
Use diverse question types: 4 multiple_choice, 2 true_false, 1 fill_blank, 1 ordering.
For each question include: id, type, question, options (4 choices), correctAnswer (0-based index), explanation.
For fill_blank: include correctText field with the answer.
For ordering: include orderItems with the correct order.
For true_false: options should be ["True", "False"].
Write all questions in ${langName}.`,
            category: subject,
            questionCount: 8,
            isPlacementTest: true,
            age: userAge || 18,
            userLevel: 'beginner',
          },
        }),
        AI_TIMEOUT_MS,
      );

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const lessonData = data?.lesson || data;
      const rawQ = lessonData.questions || [];
      // Normalize: add type field if missing
      const normalized = rawQ.map((q: any, i: number) => ({
        ...q,
        type: q.type || 'multiple_choice',
        id: q.id || `q_${i}`,
      }));
      setQuestions(normalized);
      setLessonTitle(
        lessonData.title ||
          `${i18n.t('lesson.placement_test', { defaultValue: 'Placement Test' })}: ${subject}`,
      );

      if (lessonData.theory) {
        setTheoryContent(lessonData.theory);
        setPhase('theory');
      } else {
        setPhase('placement-test');
      }
    } catch (err: any) {
      console.warn('AI unavailable, using fallback lesson:', err?.message);
      // Fallback: use static lesson
      const fallback = deepSeekService.getFallbackLesson(subject, 'beginner');
      setQuestions(fallback.questions as any);
      setLessonTitle('🦊 ' + fallback.title);
      setTheoryContent(
        i18n.t('lesson.ai_busy_fallback', {
          defaultValue: 'AI is busy right now, but here is a practice set we prepared for you!',
        }),
      );
      setPhase('theory');
    }
  };

  const generateLesson = async (level: string) => {
    setPhase('loading');
    const contentLang = lessonCacheService.getContentLanguage();
    const langName = lessonCacheService.getLanguageName();

    try {
      // ── STEP 1: Check cache first (FREE, instant) ──
      const recentIds = userId ? await lessonCacheService.getRecentlyServedIds(userId) : [];
      const cacheResult = await lessonCacheService.getCachedLesson(
        subject,
        level,
        contentLang,
        recentIds,
      );

      if (cacheResult.found && cacheResult.lesson) {
        // ✅ CACHE HIT — serve cached lesson
        const cached = cacheResult.lesson;
        setCurrentCacheId(cacheResult.cacheId);

        const normalized = (cached.questions || []).map((q: any, i: number) => ({
          ...q,
          type: q.type || 'multiple_choice',
          id: q.id || `q_${i}`,
        }));
        setQuestions(normalized);
        setLessonTitle(
          cached.title || `${subject} ${i18n.t('lesson.lesson_title', { defaultValue: 'Lesson' })}`,
        );
        setCurrentIndex(0);
        setScore(0);
        setSelectedAnswer(null);
        setIsAnswered(false);
        setLessonStreak(0);
        setStartTime(Date.now());
        setFillBlankInput('');
        setSelectedOrder([]);
        setMatchSelections({});

        // Add personalized intro to theory
        const personalIntro = lessonCacheService.generatePersonalizedIntro(
          null,
          dailyStreak,
          subject,
          level,
        );
        const theory = cached.theory ? `${personalIntro}\n\n${cached.theory}` : personalIntro;
        setTheoryContent(theory);
        setPhase('theory');
        return;
      }

      // ── STEP 2: Cache miss → generate via AI ──
      const { data, error } = await withTimeout(
        supabase.functions.invoke('generate-lesson', {
          body: {
            prompt: `Create a ${level} level lesson about ${subject} with 10 questions.
Include theory section first, then diverse questions.
Question types to use:
- 4x multiple_choice (4 options each, correctAnswer as 0-based index)
- 2x true_false (options: ["True", "False"], correctAnswer: 0 or 1)
- 2x fill_blank (include correctText with the answer word/phrase)
- 1x ordering (include orderItems array with correct sequence, options with shuffled items)
- 1x matching (include matchPairs array with {left, right} pairs)

Each question needs: id, type, question, options, correctAnswer, explanation.
For fill_blank questions, mark the blank with ___ in the question text.
Write everything in ${langName}. Make it educational and engaging.
Focus on real-world applications and examples.`,
            category: subject,
            difficulty: level,
            questionCount: 10,
            age: parseInt(age) || 18,
            userLevel: level,
          },
        }),
        AI_TIMEOUT_MS,
      );

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const lessonData = data?.lesson || data;
      const rawQ = lessonData.questions || [];
      const normalized = rawQ.map((q: any, i: number) => ({
        ...q,
        type: q.type || 'multiple_choice',
        id: q.id || `q_${i}`,
      }));
      setQuestions(normalized);
      setLessonTitle(
        lessonData.title ||
          `${subject} ${i18n.t('lesson.lesson_title', { defaultValue: 'Lesson' })}`,
      );
      setCurrentIndex(0);
      setScore(0);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setLessonStreak(0);
      setStartTime(Date.now());
      setFillBlankInput('');
      setSelectedOrder([]);
      setMatchSelections({});

      if (lessonData.theory) {
        setTheoryContent(lessonData.theory);
        setPhase('theory');
      } else {
        setPhase('lesson');
      }

      // ── STEP 3: Cache the newly generated lesson (async, non-blocking) ──
      lessonCacheService
        .cacheLesson({
          category: subject,
          difficulty: level,
          language: contentLang,
          title: lessonData.title || `${subject} Lesson`,
          theory: lessonData.theory || null,
          questions: rawQ,
          question_count: rawQ.length,
          question_types: lessonCacheService.extractQuestionTypes(rawQ),
          tags: lessonCacheService.extractTags(subject, lessonData.title || ''),
          is_ai_generated: true,
        })
        .then((cacheId) => {
          if (cacheId) setCurrentCacheId(cacheId);
        })
        .catch(() => {});
    } catch (err: any) {
      console.warn('AI unavailable, using fallback lesson:', err?.message);
      // Fallback: use static lesson instead of showing error
      const fallback = deepSeekService.getFallbackLesson(subject, level);
      setQuestions(fallback.questions as any);
      setLessonTitle('🦊 ' + fallback.title);
      setCurrentIndex(0);
      setScore(0);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setLessonStreak(0);
      setStartTime(Date.now());
      setFillBlankInput('');
      setSelectedOrder([]);
      setMatchSelections({});
      setTheoryContent(
        i18n.t('lesson.ai_busy_fallback', {
          defaultValue: 'AI is busy right now, but here is a practice set we prepared for you!',
        }),
      );
      setPhase('theory');
    }
  };

  const triggerCorrectEffect = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    playSound('correct').catch(() => {});
    setShowCorrectEffect(true);
    correctScale.value = withSequence(
      withSpring(1.3, { damping: 6 }),
      withSpring(1, { damping: 10 }),
    );
    comboScale.value = withSequence(withSpring(1.4, { damping: 5 }), withSpring(1, { damping: 8 }));
    setTimeout(() => setShowCorrectEffect(false), 1200);
  };

  const handleEli5 = async () => {
    if (eli5Loading || !currentQuestion) return;
    setEli5Loading(true);
    const langName = lessonCacheService.getLanguageName();
    try {
      const prompt = `Explain like I'm 5 (ELI5). The question was: "${currentQuestion.question}". The correct answer is: "${currentQuestion.options?.[currentQuestion.correctAnswer as number] || currentQuestion.correctText || currentQuestion.correctAnswer}". Explain why this is the correct answer in 2-3 simple sentences. Use fun analogies. Answer in ${langName}. Keep it under 100 words.`;
      const { data } = await supabase.functions.invoke('generate-lesson', {
        body: { prompt, maxTokens: 200, type: 'eli5' },
      });
      setEli5Text(
        data?.explanation ||
          data?.text ||
          data?.content ||
          'Açıklama üretildi ama bir sorun oluştu.',
      );
    } catch (e) {
      setEli5Text(currentQuestion.explanation || i18n.t('explanation_failed'));
    } finally {
      setEli5Loading(false);
    }
  };

  const triggerWrongEffect = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {}
    playSound('wrong').catch(() => {});
    Vibration.vibrate([0, 80, 60, 80]);
    setShowWrongEffect(true);
    setTimeout(() => setShowWrongEffect(false), 1000);
  };

  const handleAnswer = async (index: number) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
    setIsAnswered(true);

    const isCorrect = index === questions[currentIndex].correctAnswer;

    if (isCorrect) {
      bgColorAnim.value = withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(800, withTiming(0, { duration: 300 })),
      );
      setScore((prev) => prev + 1);
      setLessonStreak((prev) => prev + 1);
      feedbackScale.value = withSpring(1, { damping: 8 });
      triggerCorrectEffect();
    } else {
      bgColorAnim.value = withSequence(
        withTiming(-1, { duration: 200 }),
        withDelay(800, withTiming(0, { duration: 300 })),
      );
      shakeAnim.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
      setLessonStreak(0);
      feedbackScale.value = withSpring(1, { damping: 8 });
      triggerWrongEffect();

      // Add wrong question to re-ask queue (Duolingo style)
      if (currentQuestion) {
        setWrongQuestionQueue((prev) => [
          ...prev,
          { ...currentQuestion, id: `${currentQuestion.id}_retry_${Date.now()}` },
        ]);
      }
    }
  };

  const handleFillBlankSubmit = () => {
    if (isAnswered || !fillBlankInput.trim()) return;
    setIsAnswered(true);

    const correct = currentQuestion?.correctText?.toLowerCase().trim() || '';
    const userInput = fillBlankInput.toLowerCase().trim();
    const isCorrect = userInput === correct;

    if (isCorrect) {
      bgColorAnim.value = withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(800, withTiming(0, { duration: 300 })),
      );
      setScore((prev) => prev + 1);
      setLessonStreak((prev) => prev + 1);
      triggerCorrectEffect();
    } else {
      bgColorAnim.value = withSequence(
        withTiming(-1, { duration: 200 }),
        withDelay(800, withTiming(0, { duration: 300 })),
      );
      shakeAnim.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
      setLessonStreak(0);
      triggerWrongEffect();
      // Add wrong question to re-ask queue
      if (currentQuestion) {
        setWrongQuestionQueue((prev) => [
          ...prev,
          { ...currentQuestion, id: `${currentQuestion.id}_retry_${Date.now()}` },
        ]);
      }
    }
    feedbackScale.value = withSpring(1, { damping: 8 });
    setSelectedAnswer(isCorrect ? 1 : 0);
  };

  const handleOrderSelect = (item: string) => {
    if (isAnswered) return;
    if (selectedOrder.includes(item)) {
      setSelectedOrder(selectedOrder.filter((i) => i !== item));
    } else {
      setSelectedOrder([...selectedOrder, item]);
    }
  };

  const handleOrderSubmit = () => {
    if (isAnswered) return;
    setIsAnswered(true);

    const correctOrder = currentQuestion?.orderItems || [];
    const isCorrect = JSON.stringify(selectedOrder) === JSON.stringify(correctOrder);

    if (isCorrect) {
      bgColorAnim.value = withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(800, withTiming(0, { duration: 300 })),
      );
      setScore((prev) => prev + 1);
      setLessonStreak((prev) => prev + 1);
      triggerCorrectEffect();
    } else {
      bgColorAnim.value = withSequence(
        withTiming(-1, { duration: 200 }),
        withDelay(800, withTiming(0, { duration: 300 })),
      );
      shakeAnim.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
      setLessonStreak(0);
      triggerWrongEffect();
      // Add wrong question to re-ask queue
      if (currentQuestion) {
        setWrongQuestionQueue((prev) => [
          ...prev,
          { ...currentQuestion, id: `${currentQuestion.id}_retry_${Date.now()}` },
        ]);
      }
    }
    feedbackScale.value = withSpring(1, { damping: 8 });
    setSelectedAnswer(isCorrect ? 1 : 0);
  };

  const handleMatchPair = (left: string, right: string) => {
    setMatchSelections((prev) => ({ ...prev, [left]: right }));
    setMatchLeftSelected(null);
  };

  const handleMatchSubmit = () => {
    if (isAnswered) return;
    setIsAnswered(true);

    const pairs = currentQuestion?.matchPairs || [];
    const isCorrect = pairs.every((p) => matchSelections[p.left] === p.right);

    if (isCorrect) {
      bgColorAnim.value = withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(800, withTiming(0, { duration: 300 })),
      );
      setScore((prev) => prev + 1);
      setLessonStreak((prev) => prev + 1);
      triggerCorrectEffect();
    } else {
      bgColorAnim.value = withSequence(
        withTiming(-1, { duration: 200 }),
        withDelay(800, withTiming(0, { duration: 300 })),
      );
      shakeAnim.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
      setLessonStreak(0);
      triggerWrongEffect();
      // Add wrong question to re-ask queue
      if (currentQuestion) {
        setWrongQuestionQueue((prev) => [
          ...prev,
          { ...currentQuestion, id: `${currentQuestion.id}_retry_${Date.now()}` },
        ]);
      }
    }
    feedbackScale.value = withSpring(1, { damping: 8 });
  };

  const handleNext = async () => {
    feedbackScale.value = 0;
    setFillBlankInput('');
    setSelectedOrder([]);
    setMatchSelections({});
    setMatchLeftSelected(null);
    setShowHint(false);
    setEli5Text(null);
    setEli5Loading(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else if (wrongQuestionQueue.length > 0) {
      // Re-ask wrong questions (Duolingo style)
      const retryQuestions = [...wrongQuestionQueue];
      setWrongQuestionQueue([]);
      setQuestions((prev) => [...prev, ...retryQuestions]);
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      await handleComplete();
    }
  };

  const handleComplete = async () => {
    const accuracy = score / questions.length;
    let finalLevel = userLevel;

    if (phase === 'placement-test') {
      if (accuracy >= 0.8) finalLevel = 'advanced';
      else if (accuracy >= 0.5) finalLevel = 'intermediate';
      else finalLevel = 'beginner';

      setUserLevel(finalLevel);
      if (userId) {
        await supabase.from('user_category_levels').upsert({
          user_id: userId,
          category: subject,
          level: finalLevel,
          placement_score: Math.round(accuracy * 100),
          updated_at: new Date().toISOString(),
        });
      }
    }

    const durationSec = (Date.now() - startTime) / 1000;
    const zenBonus = durationSec > 30 && durationSec < 300 ? 20 : 0;

    const diffMult = finalLevel === 'advanced' ? 2.0 : finalLevel === 'intermediate' ? 1.5 : 1.0;
    const baseXP = 10 * diffMult;
    const accXP = Math.round(accuracy * 50);
    const streakXP = Math.min(lessonStreak, 10);

    const totalXP = Math.round(baseXP + accXP + streakXP + zenBonus);
    setXpEarned(totalXP);

    // Play completion sounds
    playSound('lessonComplete').catch(() => {});
    if (totalXP > 0) playSound('coin', 0.5).catch(() => {});

    if (userId) {
      // XP + Gems
      await supabase.rpc('add_user_xp', { p_user_id: userId, p_xp_amount: totalXP });
      await supabase.rpc('add_gems', { p_user_id: userId, p_amount: Math.floor(totalXP / 10) });

      // Record lesson completion for daily limit tracking
      await dailyLessonService.recordLessonCompleted(userId);

      // Record cache interaction for quality tracking
      if (currentCacheId) {
        lessonCacheService
          .recordInteraction(
            userId,
            currentCacheId,
            Math.round(accuracy * 100),
            Math.round(durationSec),
          )
          .catch(() => {});
      }

      // Update streak - 1 lesson = streak increase
      const today = new Date().toISOString().split('T')[0];
      const { data: profile } = await supabase
        .from('profiles')
        .select('last_streak_date, streak_count')
        .eq('id', userId)
        .single();

      if (profile) {
        const lastStreakDate = profile.last_streak_date;
        const currentStreak = profile.streak_count || 0;

        if (lastStreakDate !== today) {
          // New day - increase streak
          const newStreak = currentStreak + 1;
          await supabase
            .from('profiles')
            .update({
              streak_count: newStreak,
              last_streak_date: today,
            })
            .eq('id', userId);
          setDailyStreak(newStreak);
          setStreakIncreased(true);
          setShowStreakCelebration(true);
          playSound('streak').catch(() => {});
          return; // Don't go to result yet, show streak first
        }
      }
    }

    setPhase('result');
  };

  const handleStreakCelebrationClose = () => {
    setShowStreakCelebration(false);
    setPhase('result');
  };

  // Ad watch handler for daily lesson limit
  const handleWatchAd = async () => {
    if (!userId) return;
    setAdLoading(true);
    try {
      // Simulate ad watching (replace with actual ad SDK)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const result = await dailyLessonService.recordAdWatched(userId);
      setDailyLessonData(result.data);

      if (result.success && result.data.canStartLesson) {
        // Reklam başarılı, ders başlayabilir
        checkUserLevel();
      } else if (!result.success) {
        setPhase('daily-limit');
      }
    } catch (e) {
      console.error('Ad watch error:', e);
    } finally {
      setAdLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeAnim.value }],
  }));

  const feedbackAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: feedbackScale.value }],
    opacity: feedbackScale.value,
  }));

  return (
    <Animated.View style={[styles.container, { paddingTop: insets.top }, bgAnimStyle]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Streak Celebration */}
      <StreakCelebration
        visible={showStreakCelebration}
        streak={dailyStreak}
        onClose={handleStreakCelebrationClose}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <X size={28} color={COLORS.textSecondary} />
        </TouchableOpacity>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        <View style={styles.headerRight} />
      </View>

      {/* Content By Phase */}
      {phase === 'loading' && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{i18n.t('lesson.creating')}</Text>
        </View>
      )}

      {phase === 'error' && (
        <View style={styles.errorContainer}>
          <XCircle size={64} color={COLORS.red} />
          <Text style={styles.errorTitle}>{i18n.t('common.error')}</Text>
          <Text style={styles.errorText}>{error || i18n.t('common.error')}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
            <Text style={styles.retryBtnText}>{i18n.t('common.back')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Daily Lesson Limit Reached */}
      {phase === 'daily-limit' && (
        <View style={styles.errorContainer}>
          <View style={styles.dailyLimitIcon}>
            <BookOpen size={60} color={COLORS.blue} />
          </View>
          <Text style={styles.errorTitle}>{i18n.t('lesson_limit.daily_limit_reached')}</Text>
          <Text style={styles.dailyLimitInfo}>
            {i18n.t('lesson_limit.lessons_completed', {
              completed: dailyLessonData?.lessonsCompletedToday || 0,
              total: dailyLessonData?.totalLessonsAvailable || 2,
            })}
          </Text>

          <View style={styles.adSection}>
            <Text style={styles.adTitle}>{i18n.t('lesson_limit.watch_ad_extra')}</Text>
            <Text style={styles.adSubtitle}>
              {i18n.t('lesson_limit.ads_for_lesson')}
              {'\n'}
              {dailyLessonData?.adsUntilNextLesson
                ? `Sonraki ders için ${dailyLessonData.adsUntilNextLesson} reklam daha izle`
                : 'Reklamları izleyerek sınırsız ders açabilirsin'}
            </Text>

            {/* Ad progress indicator */}
            <View style={styles.adProgressRow}>
              {[0, 1, 2].map((i) => {
                const watchedInCurrent = dailyLessonData ? dailyLessonData.adsWatchedToday % 3 : 0;
                const filled = i < watchedInCurrent;
                return (
                  <View
                    key={i}
                    style={[styles.adProgressDot, filled && styles.adProgressDotFilled]}
                  />
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.adBtn, adLoading && { opacity: 0.6 }]}
              onPress={handleWatchAd}
              disabled={adLoading}
            >
              <Text style={styles.adBtnText}>
                {adLoading ? i18n.t('lesson_limit.ad_loading') : i18n.t('lesson_limit.watch_ad')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.premiumUpsell}>
            <Text style={styles.premiumUpsellTitle}>
              {i18n.t('lesson_limit.unlimited_premium')}
            </Text>
            <Text style={styles.premiumUpsellPrice}>Sadece $3.99/ay</Text>
            <TouchableOpacity
              style={styles.premiumUpsellBtn}
              onPress={() => router.push('/premium')}
            >
              <Text style={styles.premiumUpsellBtnText}>Premium'a Geç</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
            <Text style={styles.retryBtnText}>Ana Sayfa</Text>
          </TouchableOpacity>
        </View>
      )}

      {phase === 'theory' && theoryContent && (
        <ScrollView contentContainerStyle={styles.theoryContainer}>
          <Animated.View entering={FadeIn.duration(500)} style={styles.theoryHeader}>
            <LinearGradient colors={[COLORS.blue, COLORS.purple]} style={styles.theoryIconBg}>
              <BookOpen size={40} color="#FFF" />
            </LinearGradient>
            <Text style={styles.theoryTitle}>{i18n.t('lesson.overview') || 'Konu Anlatımı'}</Text>
            <Text style={styles.theorySubtitle}>{subject}</Text>
          </Animated.View>
          <Animated.View entering={SlideInUp.delay(200)} style={styles.theoryContent}>
            <Text style={styles.theoryText}>
              {theoryContent.replace(/## /g, '').replace(/\*\*/g, '')}
            </Text>
          </Animated.View>
          <Animated.View entering={FadeIn.delay(500)}>
            <TouchableOpacity
              style={styles.startBtn}
              onPress={() => setPhase(userLevel ? 'lesson' : 'placement-test')}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.startBtnGradient}
              >
                <Text style={styles.startBtnText}>
                  {i18n.t('lesson.start_quiz') || 'Teste Başla'}
                </Text>
                <ChevronRight size={24} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      )}

      {(phase === 'placement-test' || phase === 'lesson') && currentQuestion && (
        <Animated.ScrollView
          style={shakeStyle}
          contentContainerStyle={[styles.questionContent, { paddingBottom: insets.bottom + 100 }]}
        >
          {/* Correct effect overlay */}
          {showCorrectEffect && (
            <Animated.View
              entering={ZoomIn.duration(300)}
              exiting={FadeOut.duration(400)}
              style={styles.correctEffectOverlay}
            >
              <Text style={styles.correctEffectEmoji}>🎉</Text>
              <Text style={styles.correctEffectText}>Mükemmel!</Text>
            </Animated.View>
          )}

          {/* Wrong effect overlay */}
          {showWrongEffect && (
            <Animated.View
              entering={ZoomIn.duration(200)}
              exiting={FadeOut.duration(300)}
              style={styles.wrongEffectOverlay}
            >
              <Text style={styles.wrongEffectEmoji}>😔</Text>
            </Animated.View>
          )}

          {/* Streak indicator */}
          {lessonStreak >= 3 && (
            <Animated.View entering={ZoomIn} style={styles.streakIndicator}>
              <Flame size={20} color={COLORS.orange} fill={COLORS.orange} />
              <Text style={styles.streakIndicatorText}>{lessonStreak} Seri! 🔥</Text>
            </Animated.View>
          )}

          {/* Combo indicator */}
          {lessonStreak >= 5 && (
            <Animated.View entering={ZoomIn} style={styles.comboIndicator}>
              <Text style={styles.comboText}>⚡ KOMBO x{lessonStreak}</Text>
            </Animated.View>
          )}

          {/* Question type badge */}
          <Animated.View entering={FadeInDown.delay(50)} style={styles.questionTypeBadge}>
            <Text style={styles.questionTypeBadgeText}>
              {currentQuestion.type === 'multiple_choice'
                ? '📝 Çoktan Seçmeli'
                : currentQuestion.type === 'true_false'
                  ? i18n.t('true_false')
                  : currentQuestion.type === 'fill_blank'
                    ? '✏️ Boşluk Doldur'
                    : currentQuestion.type === 'ordering'
                      ? '🔢 Sırala'
                      : currentQuestion.type === 'matching'
                        ? '🔗 Eşleştir'
                        : '📝 Soru'}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeIn} style={styles.questionCard}>
            {currentQuestion.image_keyword && (
              <Image
                source={{ uri: `https://loremflickr.com/400/300/${currentQuestion.image_keyword}` }}
                style={styles.questionImage}
                resizeMode="cover"
              />
            )}
            <Text style={styles.questionLabel}>
              {phase === 'placement-test'
                ? i18n.t('level_test')
                : i18n.t('question_n', { current: currentIndex + 1, total: questions.length })}
            </Text>
            <View style={styles.questionRow}>
              <Text style={styles.questionText}>{currentQuestion.question}</Text>
              <TTSButton text={currentQuestion.question} />
            </View>

            {/* Hint button */}
            {currentQuestion.hint && !showHint && !isAnswered && (
              <TouchableOpacity style={styles.hintBtn} onPress={() => setShowHint(true)}>
                <Lightbulb size={16} color={COLORS.gold} />
                <Text style={styles.hintBtnText}>İpucu</Text>
              </TouchableOpacity>
            )}
            {showHint && currentQuestion.hint && (
              <Animated.View entering={FadeIn} style={styles.hintBox}>
                <Lightbulb size={16} color={COLORS.gold} />
                <Text style={styles.hintText}>{currentQuestion.hint}</Text>
              </Animated.View>
            )}
          </Animated.View>

          {/* ═══════════ MULTIPLE CHOICE & TRUE/FALSE ═══════════ */}
          {(currentQuestion.type === 'multiple_choice' ||
            currentQuestion.type === 'true_false' ||
            !currentQuestion.type) && (
            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((option, index) => {
                const isCorrect = index === currentQuestion.correctAnswer;
                const isSelected = index === selectedAnswer;
                const isWrong = isAnswered && isSelected && !isCorrect;

                let optionStyle: any = styles.optionBtn;
                let textStyle: any = styles.optionText;

                if (isAnswered) {
                  if (isCorrect) {
                    optionStyle = [styles.optionBtn, styles.optionCorrect];
                    textStyle = [styles.optionText, styles.optionTextCorrect];
                  } else if (isWrong) {
                    optionStyle = [styles.optionBtn, styles.optionWrong];
                    textStyle = [styles.optionText, styles.optionTextWrong];
                  }
                }

                return (
                  <Animated.View key={index} entering={SlideInDown.delay(index * 80)}>
                    <TouchableOpacity
                      style={optionStyle}
                      onPress={() => handleAnswer(index)}
                      disabled={isAnswered}
                      activeOpacity={0.8}
                    >
                      <View style={styles.optionIndexBadge}>
                        <Text style={styles.optionIndexText}>
                          {String.fromCharCode(65 + index)}
                        </Text>
                      </View>
                      <Text style={textStyle}>{option}</Text>
                      {isAnswered && isCorrect && (
                        <Animated.View entering={ZoomIn}>
                          <CheckCircle size={24} color={COLORS.correctGreen} />
                        </Animated.View>
                      )}
                      {isWrong && (
                        <Animated.View entering={ZoomIn}>
                          <XCircle size={24} color={COLORS.wrongRed} />
                        </Animated.View>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          )}

          {/* ═══════════ FILL IN THE BLANK ═══════════ */}
          {currentQuestion.type === 'fill_blank' && (
            <Animated.View entering={FadeInDown} style={styles.fillBlankContainer}>
              <TextInput
                style={[
                  styles.fillBlankInput,
                  isAnswered &&
                  fillBlankInput.toLowerCase().trim() ===
                    (currentQuestion.correctText?.toLowerCase().trim() || '')
                    ? styles.fillBlankCorrect
                    : isAnswered
                      ? styles.fillBlankWrong
                      : null,
                ]}
                value={fillBlankInput}
                onChangeText={setFillBlankInput}
                placeholder="Cevabını yaz..."
                placeholderTextColor={COLORS.textSecondary}
                editable={!isAnswered}
                autoCapitalize="none"
                onSubmitEditing={handleFillBlankSubmit}
              />
              {!isAnswered && (
                <TouchableOpacity style={styles.fillBlankSubmitBtn} onPress={handleFillBlankSubmit}>
                  <Text style={styles.fillBlankSubmitText}>{i18n.t('lesson.check_answer')}</Text>
                  <ChevronRight size={20} color="#FFF" />
                </TouchableOpacity>
              )}
              {isAnswered &&
                fillBlankInput.toLowerCase().trim() !==
                  (currentQuestion.correctText?.toLowerCase().trim() || '') && (
                  <Animated.View entering={FadeIn} style={styles.fillBlankCorrectAnswer}>
                    <Text style={styles.fillBlankCorrectLabel}>{i18n.t('correct_answer')}</Text>
                    <Text style={styles.fillBlankCorrectText}>{currentQuestion.correctText}</Text>
                  </Animated.View>
                )}
            </Animated.View>
          )}

          {/* ═══════════ ORDERING ═══════════ */}
          {currentQuestion.type === 'ordering' && (
            <View style={styles.orderingContainer}>
              <Text style={styles.orderingLabel}>{i18n.t('drag_order')}</Text>

              {/* Selected order */}
              <View style={styles.orderSelectedArea}>
                {selectedOrder.length > 0 ? (
                  selectedOrder.map((item, idx) => (
                    <Animated.View key={`sel_${idx}`} entering={FadeInDown.delay(idx * 50)}>
                      <TouchableOpacity
                        style={[styles.orderChip, styles.orderChipSelected]}
                        onPress={() => !isAnswered && handleOrderSelect(item)}
                        disabled={isAnswered}
                      >
                        <Text style={styles.orderChipNumber}>{idx + 1}</Text>
                        <Text style={styles.orderChipText}>{item}</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  ))
                ) : (
                  <Text style={styles.orderPlaceholder}>Aşağıdaki öğelere tıklayarak sırala</Text>
                )}
              </View>

              {/* Available items */}
              <View style={styles.orderAvailableArea}>
                {(currentQuestion.options || []).map((item, idx) => {
                  const alreadySelected = selectedOrder.includes(item);
                  return (
                    <Animated.View key={`avail_${idx}`} entering={FadeInDown.delay(idx * 60)}>
                      <TouchableOpacity
                        style={[styles.orderChip, alreadySelected && styles.orderChipDisabled]}
                        onPress={() => !isAnswered && handleOrderSelect(item)}
                        disabled={isAnswered || alreadySelected}
                      >
                        <Text style={[styles.orderChipText, alreadySelected && { opacity: 0.3 }]}>
                          {item}
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>

              {!isAnswered && selectedOrder.length === (currentQuestion.options?.length || 0) && (
                <TouchableOpacity style={styles.orderSubmitBtn} onPress={handleOrderSubmit}>
                  <Text style={styles.orderSubmitText}>{i18n.t('lesson.check_answer')}</Text>
                </TouchableOpacity>
              )}

              {isAnswered && (
                <Animated.View entering={FadeIn} style={styles.orderCorrectAnswer}>
                  <Text style={styles.orderCorrectLabel}>Doğru sıra:</Text>
                  {(currentQuestion.orderItems || []).map((item, idx) => (
                    <Text key={idx} style={styles.orderCorrectItem}>
                      {idx + 1}. {item}
                    </Text>
                  ))}
                </Animated.View>
              )}
            </View>
          )}

          {/* ═══════════ MATCHING ═══════════ */}
          {currentQuestion.type === 'matching' && (
            <View style={styles.matchingContainer}>
              <Text style={styles.matchingLabel}>Eşleştir:</Text>
              {(currentQuestion.matchPairs || []).map((pair, idx) => (
                <Animated.View
                  key={idx}
                  entering={FadeInDown.delay(idx * 80)}
                  style={styles.matchRow}
                >
                  <TouchableOpacity
                    style={[
                      styles.matchLeft,
                      matchLeftSelected === pair.left && styles.matchLeftActive,
                      isAnswered &&
                        matchSelections[pair.left] === pair.right &&
                        styles.matchCorrectBorder,
                      isAnswered &&
                        matchSelections[pair.left] &&
                        matchSelections[pair.left] !== pair.right &&
                        styles.matchWrongBorder,
                    ]}
                    onPress={() => !isAnswered && setMatchLeftSelected(pair.left)}
                    disabled={isAnswered}
                  >
                    <Text style={styles.matchItemText}>{pair.left}</Text>
                  </TouchableOpacity>

                  <Text style={styles.matchArrow}>{matchSelections[pair.left] ? '→' : '·'}</Text>

                  <View
                    style={[
                      styles.matchRight,
                      matchSelections[pair.left] && styles.matchRightFilled,
                    ]}
                  >
                    <Text style={styles.matchItemText}>{matchSelections[pair.left] || '?'}</Text>
                  </View>
                </Animated.View>
              ))}

              {/* Right side options */}
              {!isAnswered && matchLeftSelected && (
                <Animated.View entering={FadeIn} style={styles.matchOptionsRow}>
                  <Text style={styles.matchOptionsLabel}>"{matchLeftSelected}" ile eşleştir:</Text>
                  {(currentQuestion.matchPairs || []).map((pair, idx) => {
                    const alreadyUsed = Object.values(matchSelections).includes(pair.right);
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.matchOption, alreadyUsed && { opacity: 0.3 }]}
                        onPress={() =>
                          !alreadyUsed && handleMatchPair(matchLeftSelected!, pair.right)
                        }
                        disabled={alreadyUsed}
                      >
                        <Text style={styles.matchOptionText}>{pair.right}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </Animated.View>
              )}

              {!isAnswered &&
                Object.keys(matchSelections).length ===
                  (currentQuestion.matchPairs?.length || 0) && (
                  <TouchableOpacity style={styles.orderSubmitBtn} onPress={handleMatchSubmit}>
                    <Text style={styles.orderSubmitText}>{i18n.t('lesson.check_answer')}</Text>
                  </TouchableOpacity>
                )}
            </View>
          )}

          {/* ═══════════ FEEDBACK ═══════════ */}
          {isAnswered && (
            <Animated.View
              style={[
                styles.feedbackContainer,
                currentQuestion.type === 'multiple_choice' ||
                currentQuestion.type === 'true_false' ||
                !currentQuestion.type
                  ? selectedAnswer === currentQuestion.correctAnswer
                    ? styles.feedbackCorrect
                    : styles.feedbackWrong
                  : selectedAnswer === 1
                    ? styles.feedbackCorrect
                    : styles.feedbackWrong,
              ]}
              entering={SlideInDown.springify()}
            >
              <View style={styles.feedbackHeader}>
                {(
                  currentQuestion.type === 'multiple_choice' ||
                  currentQuestion.type === 'true_false' ||
                  !currentQuestion.type
                    ? selectedAnswer === currentQuestion.correctAnswer
                    : selectedAnswer === 1
                ) ? (
                  <>
                    <Animated.View entering={ZoomIn}>
                      <CheckCircle size={32} color={COLORS.correctGreen} />
                    </Animated.View>
                    <Text style={[styles.feedbackTitle, { color: COLORS.correctGreen }]}>
                      {lessonStreak >= 3 ? 'Muhteşem! 🔥' : 'Harika! 🎉'}
                    </Text>
                    {lessonStreak >= 3 && (
                      <View style={styles.feedbackStreakBadge}>
                        <Flame size={14} color={COLORS.orange} fill={COLORS.orange} />
                        <Text style={styles.feedbackStreakText}>{lessonStreak}</Text>
                      </View>
                    )}
                  </>
                ) : (
                  <>
                    <Animated.View entering={ZoomIn}>
                      <XCircle size={32} color={COLORS.wrongRed} />
                    </Animated.View>
                    <Text style={[styles.feedbackTitle, { color: COLORS.wrongRed }]}>
                      {i18n.t('lesson.incorrect')}
                    </Text>
                  </>
                )}
              </View>

              {currentQuestion.explanation && (
                <View style={styles.explanationContainer}>
                  <Text style={styles.explanationLabel}>Açıklama:</Text>
                  <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
                </View>
              )}

              {/* ELI5 Explain Button — only on wrong answers */}
              {isAnswered &&
                (currentQuestion.type === 'multiple_choice' ||
                currentQuestion.type === 'true_false' ||
                !currentQuestion.type
                  ? selectedAnswer !== currentQuestion.correctAnswer
                  : selectedAnswer !== 1) && (
                  <View style={styles.eli5Container}>
                    {eli5Text ? (
                      <View style={styles.eli5Card}>
                        <Text style={styles.eli5Label}>🦊 Basitçe Açıklama:</Text>
                        <Text style={styles.eli5Text}>{eli5Text}</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.eli5Btn}
                        onPress={handleEli5}
                        disabled={eli5Loading}
                      >
                        {eli5Loading ? (
                          <ActivityIndicator size="small" color="#FFD700" />
                        ) : (
                          <>
                            <Lightbulb size={18} color="#FFD700" />
                            <Text style={styles.eli5BtnText}>Bunu Açıkla 🦊</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                )}

              <TouchableOpacity
                style={[
                  styles.nextBtn,
                  (
                    currentQuestion.type === 'multiple_choice' ||
                    currentQuestion.type === 'true_false' ||
                    !currentQuestion.type
                      ? selectedAnswer === currentQuestion.correctAnswer
                      : selectedAnswer === 1
                  )
                    ? styles.nextBtnCorrect
                    : styles.nextBtnWrong,
                ]}
                onPress={handleNext}
              >
                <Text style={styles.nextBtnText}>
                  {currentIndex < questions.length - 1
                    ? i18n.t('common.continue')
                    : i18n.t('common.finish')}
                </Text>
                <ChevronRight size={24} color="#FFF" />
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.ScrollView>
      )}

      {phase === 'result' && (
        <View style={styles.resultContainer}>
          <LinearGradient colors={[COLORS.primary, '#3A9B00']} style={styles.resultGradient}>
            <Animated.View entering={ZoomIn} style={styles.resultCard}>
              <View style={styles.resultIconContainer}>
                <Trophy size={80} color={COLORS.gold} fill={COLORS.gold} />
              </View>
              <Text style={styles.resultTitle}>
                {i18n.t('lesson.complete') || 'Ders Tamamlandı!'}
              </Text>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Zap size={32} color={COLORS.gold} fill={COLORS.gold} />
                  <Text style={styles.statValue}>+{xpEarned}</Text>
                  <Text style={styles.statLabel}>XP</Text>
                </View>
                <View style={styles.statItem}>
                  <Star size={32} color={COLORS.gold} fill={COLORS.gold} />
                  <Text style={styles.statValue}>
                    {questions.length > 0 ? Math.round((score / questions.length) * 100) : 0}%
                  </Text>
                  <Text style={styles.statLabel}>{i18n.t('lesson.accuracy')}</Text>
                </View>
                {streakIncreased && (
                  <View style={styles.statItem}>
                    <Flame size={32} color={COLORS.orange} fill={COLORS.orange} />
                    <Text style={styles.statValue}>{dailyStreak}</Text>
                    <Text style={styles.statLabel}>Seri</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity style={styles.homeBtn} onPress={() => router.back()}>
                <Text style={styles.homeBtnText}>{i18n.t('common.continue') || 'Devam Et'}</Text>
              </TouchableOpacity>
            </Animated.View>
          </LinearGradient>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: { padding: 8 },
  progressBarContainer: { flex: 1 },
  progressBar: {
    height: 16,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  headerRight: { flexDirection: 'row', gap: 12 },
  heartsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.card,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  heartsText: { fontSize: 16, fontWeight: '700', color: COLORS.text },

  // Loading & Error
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { fontSize: 16, color: COLORS.textSecondary },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  errorTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  errorText: { textAlign: 'center', color: COLORS.textSecondary, fontSize: 16 },
  retryBtn: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
  },
  retryBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },

  // Theory Section
  theoryContainer: { padding: 24, paddingBottom: 100 },
  theoryHeader: { alignItems: 'center', marginBottom: 24 },
  theoryIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  theoryTitle: { fontSize: 28, fontWeight: '800', color: COLORS.text },
  theorySubtitle: { fontSize: 16, color: COLORS.textSecondary, marginTop: 4 },
  theoryContent: {
    backgroundColor: COLORS.card,
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
  },
  theoryText: { fontSize: 17, lineHeight: 28, color: COLORS.text },
  startBtn: { borderRadius: 16, overflow: 'hidden' },
  startBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 8,
  },
  startBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },

  // Question Section
  questionContent: { padding: 20 },
  streakIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,150,0,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 16,
    gap: 6,
  },
  streakIndicatorText: { color: COLORS.orange, fontWeight: '700', fontSize: 14 },
  questionCard: { marginBottom: 24 },
  questionImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: COLORS.card,
  },
  questionContainer: {
    paddingHorizontal: 20,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  questionLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  questionText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  }, // Options
  optionsContainer: { gap: 12 },
  optionBtn: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 4,
  },
  optionText: { fontSize: 17, color: COLORS.text, fontWeight: '600', flex: 1 },
  optionCorrect: {
    backgroundColor: COLORS.correctBg,
    borderColor: COLORS.correctGreen,
  },
  optionWrong: {
    backgroundColor: COLORS.wrongBg,
    borderColor: COLORS.wrongRed,
  },
  optionTextCorrect: { color: COLORS.correctGreen },
  optionTextWrong: { color: COLORS.wrongRed },

  // Feedback Section
  feedbackContainer: {
    marginTop: 24,
    padding: 24,
    borderRadius: 20,
  },
  feedbackCorrect: { backgroundColor: COLORS.correctBg },
  feedbackWrong: { backgroundColor: COLORS.wrongBg },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  feedbackTitle: { fontSize: 22, fontWeight: '800' },
  explanationContainer: { marginBottom: 20 },
  explanationLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 12,
    marginBottom: 4,
  },
  correctAnswerText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.correctGreen,
  },
  explanationText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  eli5Container: { marginBottom: 16 },
  eli5Btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,215,0,0.12)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  eli5BtnText: { color: '#FFD700', fontSize: 15, fontWeight: '700' },
  eli5Card: {
    backgroundColor: 'rgba(255,215,0,0.08)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
  },
  eli5Label: { fontSize: 13, fontWeight: '700', color: '#FFD700', marginBottom: 6 },
  eli5Text: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  nextBtn: {
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextBtnCorrect: { backgroundColor: COLORS.correctGreen },
  nextBtnWrong: { backgroundColor: COLORS.red },
  nextBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },

  // Result Section
  resultContainer: { flex: 1 },
  resultGradient: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  resultCard: {
    width: '100%',
    backgroundColor: COLORS.card,
    padding: 32,
    borderRadius: 32,
    alignItems: 'center',
  },
  resultIconContainer: { marginBottom: 16 },
  resultTitle: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginBottom: 24 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 32,
  },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: { fontSize: 28, fontWeight: '900', color: COLORS.text },
  statLabel: { fontSize: 14, color: COLORS.textSecondary },
  homeBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: COLORS.primaryDark,
  },
  homeBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },

  // Streak Celebration Modal
  streakModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.5,
  },
  streakContent: { alignItems: 'center', padding: 32 },
  streakFireContainer: { marginBottom: 16 },
  streakNumber: {
    fontSize: 80,
    fontWeight: '900',
    color: COLORS.orange,
    textShadowColor: 'rgba(255,150,0,0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 20,
  },
  streakTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 8,
  },
  streakSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  streakBtn: {
    marginTop: 32,
    backgroundColor: COLORS.orange,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 16,
    borderBottomWidth: 4,
    borderBottomColor: '#CC7A00',
  },
  streakBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },

  // Daily Lesson Limit Styles
  dailyLimitIcon: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 40,
    backgroundColor: 'rgba(28, 176, 246, 0.15)',
  },
  dailyLimitInfo: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  adSection: {
    width: '100%',
    backgroundColor: 'rgba(88, 204, 2, 0.1)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(88, 204, 2, 0.3)',
  },
  adTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  adSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 20,
  },
  adProgressRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  adProgressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: 'rgba(88, 204, 2, 0.4)',
    backgroundColor: 'transparent',
  },
  adProgressDotFilled: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  adBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    borderBottomWidth: 4,
    borderBottomColor: '#4CAD02',
  },
  adBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  dailyLimitMaxAds: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  premiumUpsell: {
    width: '100%',
    backgroundColor: 'rgba(255, 200, 0, 0.1)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 200, 0, 0.3)',
  },
  premiumUpsellTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.gold,
    marginBottom: 4,
  },
  premiumUpsellPrice: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  premiumUpsellBtn: {
    backgroundColor: COLORS.gold,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  premiumUpsellBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
  },

  // ═══════════ CORRECT/WRONG EFFECTS ═══════════
  correctEffectOverlay: {
    position: 'absolute',
    top: 40,
    alignSelf: 'center',
    zIndex: 100,
    alignItems: 'center',
  },
  correctEffectEmoji: { fontSize: 60 },
  correctEffectText: { fontSize: 24, fontWeight: '900', color: COLORS.correctGreen, marginTop: 4 },
  wrongEffectOverlay: {
    position: 'absolute',
    top: 40,
    alignSelf: 'center',
    zIndex: 100,
    alignItems: 'center',
  },
  wrongEffectEmoji: { fontSize: 50 },
  comboIndicator: {
    alignSelf: 'center',
    backgroundColor: 'rgba(206,130,255,0.2)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  comboText: { fontSize: 14, fontWeight: '800', color: COLORS.purple },

  // ═══════════ QUESTION TYPE BADGE ═══════════
  questionTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(28,176,246,0.15)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  questionTypeBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.blue },

  // ═══════════ HINTS ═══════════
  hintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,200,0,0.12)',
  },
  hintBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.gold },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,200,0,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,200,0,0.2)',
  },
  hintText: { flex: 1, fontSize: 13, color: COLORS.gold, lineHeight: 18 },

  // ═══════════ OPTION INDEX ═══════════
  optionIndexBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  optionIndexText: { fontSize: 14, fontWeight: '800', color: COLORS.textSecondary },

  // ═══════════ FEEDBACK STREAK ═══════════
  feedbackStreakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
    backgroundColor: 'rgba(255,150,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  feedbackStreakText: { fontSize: 13, fontWeight: '800', color: COLORS.orange },

  // ═══════════ FILL IN THE BLANK ═══════════
  fillBlankContainer: { gap: 12, marginTop: 4 },
  fillBlankInput: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    fontSize: 18,
    color: COLORS.text,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderBottomWidth: 4,
    fontWeight: '600',
  },
  fillBlankCorrect: { borderColor: COLORS.correctGreen, backgroundColor: COLORS.correctBg },
  fillBlankWrong: { borderColor: COLORS.wrongRed, backgroundColor: COLORS.wrongBg },
  fillBlankSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 16,
    borderBottomWidth: 4,
    borderBottomColor: COLORS.primaryDark,
  },
  fillBlankSubmitText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  fillBlankCorrectAnswer: {
    backgroundColor: COLORS.correctBg,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(88,204,2,0.3)',
  },
  fillBlankCorrectLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  fillBlankCorrectText: { fontSize: 16, fontWeight: '700', color: COLORS.correctGreen },

  // ═══════════ ORDERING ═══════════
  orderingContainer: { gap: 12, marginTop: 4 },
  orderingLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  orderSelectedArea: {
    minHeight: 60,
    backgroundColor: 'rgba(88,204,2,0.05)',
    borderRadius: 16,
    padding: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: 'rgba(88,204,2,0.2)',
    borderStyle: 'dashed',
  },
  orderPlaceholder: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', padding: 8 },
  orderAvailableArea: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  orderChip: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderChipSelected: { borderColor: COLORS.primary, backgroundColor: 'rgba(88,204,2,0.1)' },
  orderChipDisabled: { opacity: 0.25 },
  orderChipNumber: { fontSize: 12, fontWeight: '800', color: COLORS.primary, width: 20 },
  orderChipText: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  orderSubmitBtn: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: COLORS.primaryDark,
  },
  orderSubmitText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  orderCorrectAnswer: {
    backgroundColor: COLORS.correctBg,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(88,204,2,0.3)',
  },
  orderCorrectLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
  },
  orderCorrectItem: {
    fontSize: 15,
    color: COLORS.correctGreen,
    fontWeight: '600',
    marginBottom: 4,
  },

  // ═══════════ MATCHING ═══════════
  matchingContainer: { gap: 12, marginTop: 4 },
  matchingLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matchLeft: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  matchLeftActive: { borderColor: COLORS.blue, backgroundColor: 'rgba(28,176,246,0.1)' },
  matchCorrectBorder: { borderColor: COLORS.correctGreen },
  matchWrongBorder: { borderColor: COLORS.wrongRed },
  matchArrow: { fontSize: 20, color: COLORS.textSecondary, fontWeight: '700' },
  matchRight: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  matchRightFilled: { borderStyle: 'solid', borderColor: COLORS.blue },
  matchItemText: { fontSize: 14, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
  matchOptionsRow: {
    backgroundColor: 'rgba(28,176,246,0.08)',
    padding: 14,
    borderRadius: 16,
    gap: 8,
  },
  matchOptionsLabel: { fontSize: 13, fontWeight: '600', color: COLORS.blue, marginBottom: 4 },
  matchOption: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.blue,
  },
  matchOptionText: { fontSize: 14, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
});
