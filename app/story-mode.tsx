/**
 * Story Mode Screen — Hikaye Modu (RPG)
 */
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Lock,
  Check,
  Star,
  ChevronRight,
  Play,
  BookOpen,
  Award,
  Sparkles,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import { storyModeService } from '../src/services/StoryModeService';
import type {
  StoryWorld,
  StoryChapter,
  StoryProgress,
  StoryChoice,
} from '../src/services/StoryModeService';
import * as Haptics from 'expo-haptics';
import i18n from '../src/i18n';
import { CustomModal, useModal } from '../src/components/CustomModal';

const { width } = Dimensions.get('window');

export default function StoryModeScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const modal = useModal();
  const [worlds, setWorlds] = useState<(StoryWorld & { progress?: StoryProgress })[]>([]);
  const [selectedWorld, setSelectedWorld] = useState<
    (StoryWorld & { progress?: StoryProgress }) | null
  >(null);
  const [activeChapter, setActiveChapter] = useState<StoryChapter | null>(null);
  const [phase, setPhase] = useState<
    'worlds' | 'chapters' | 'narrative' | 'choice' | 'quiz' | 'result'
  >('worlds');
  const [choiceMade, setChoiceMade] = useState<StoryChoice | null>(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [chapterResult, setChapterResult] = useState<{ xp: number; gems: number } | null>(null);

  useEffect(() => {
    loadWorlds();
  }, []);

  const loadWorlds = async () => {
    const w = await storyModeService.getWorldsWithProgress();
    setWorlds(w);
  };

  const selectWorld = (world: StoryWorld & { progress?: StoryProgress }) => {
    setSelectedWorld(world);
    setPhase('chapters');
  };

  const startChapter = (chapter: StoryChapter) => {
    if (chapter.isLocked) {
      modal.info(i18n.t('story.locked'), i18n.t('story.complete_previous'));
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveChapter(chapter);
    setPhase('narrative');
    setQuizIndex(0);
    setQuizScore(0);
    setChoiceMade(null);
  };

  const makeChoice = (choice: StoryChoice) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setChoiceMade(choice);
    setTimeout(() => {
      if (activeChapter && activeChapter.questions.length > 0) {
        setPhase('quiz');
      } else {
        completeChapter(choice);
      }
    }, 2000);
  };

  const answerQuiz = (idx: number) => {
    const q = activeChapter?.questions[quizIndex];
    if (!q) return;
    const correct = idx === q.correctIndex;
    if (correct) setQuizScore((prev) => prev + 1);
    Haptics.impactAsync(
      correct ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Heavy,
    );

    if (quizIndex + 1 >= (activeChapter?.questions.length || 0)) {
      completeChapter(choiceMade);
    } else {
      setQuizIndex((prev) => prev + 1);
    }
  };

  const completeChapter = async (choice: StoryChoice | null) => {
    if (!activeChapter || !selectedWorld) return;
    const result = await storyModeService.completeChapter(
      selectedWorld.id,
      activeChapter.id,
      choice?.id,
    );
    setChapterResult({ xp: result.xpEarned, gems: result.gemEarned });
    setPhase('result');
    await loadWorlds();
  };

  // ── RENDER: WORLDS ──
  if (phase === 'worlds') {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, backgroundColor: theme.background.primary },
        ]}
      >
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={theme.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Hikaye Modu</Text>
          <BookOpen size={24} color={theme.primary} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 100 }}>
          <Text style={[styles.sectionDesc, { color: theme.text.secondary }]}>
            Tarihin ve bilimin en heyecanlı anlarını keşfet. Her hikaye bir macera!
          </Text>
          {worlds.map((world, i) => {
            const completedChapters = world.progress?.completedChapters.length || 0;
            const totalChapters = world.chapters.length;
            const progressPct = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;
            return (
              <Animated.View key={world.id} entering={FadeInDown.delay(i * 100).springify()}>
                <TouchableOpacity activeOpacity={0.9} onPress={() => selectWorld(world)}>
                  <LinearGradient colors={[world.color, world.bgColor]} style={styles.worldCard}>
                    <View style={styles.worldHeader}>
                      <Text style={styles.worldEmoji}>{world.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.worldTitle}>{world.titleTr}</Text>
                        <Text style={styles.worldDesc}>{world.descriptionTr}</Text>
                      </View>
                      <ChevronRight size={24} color="rgba(255,255,255,0.6)" />
                    </View>
                    <View style={styles.worldProgress}>
                      <View style={styles.worldProgressBar}>
                        <View style={[styles.worldProgressFill, { width: `${progressPct}%` }]} />
                      </View>
                      <Text style={styles.worldProgressText}>
                        {completedChapters}/{totalChapters}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  // ── RENDER: CHAPTERS ──
  if (phase === 'chapters' && selectedWorld) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, backgroundColor: theme.background.primary },
        ]}
      >
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setPhase('worlds')}>
            <ArrowLeft size={24} color={theme.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>
            {selectedWorld.emoji} {selectedWorld.titleTr}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 100 }}>
          {selectedWorld.chapters.map((ch, i) => (
            <Animated.View key={ch.id} entering={FadeInRight.delay(i * 100)}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => startChapter(ch)}
                style={[
                  styles.chapterCard,
                  { backgroundColor: theme.background.secondary, opacity: ch.isLocked ? 0.5 : 1 },
                ]}
              >
                <View
                  style={[
                    styles.chapterNum,
                    {
                      backgroundColor: ch.isCompleted
                        ? '#2ECC71'
                        : ch.isLocked
                          ? theme.border.light
                          : selectedWorld.color,
                    },
                  ]}
                >
                  {ch.isCompleted ? (
                    <Check size={18} color="#FFF" />
                  ) : ch.isLocked ? (
                    <Lock size={18} color={theme.text.secondary} />
                  ) : (
                    <Text style={styles.chapterNumText}>{ch.order}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.chapterTitle, { color: theme.text.primary }]}>
                    {ch.titleTr}
                  </Text>
                  <Text style={[styles.chapterReward, { color: theme.text.secondary }]}>
                    +{ch.xpReward} XP • +{ch.gemReward} 💎
                  </Text>
                </View>
                {!ch.isLocked && !ch.isCompleted && <Play size={20} color={selectedWorld.color} />}
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>
        <CustomModal {...modal.modalProps} />
      </View>
    );
  }

  // ── RENDER: NARRATIVE + CHOICE ──
  if ((phase === 'narrative' || phase === 'choice') && activeChapter) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, backgroundColor: isDark ? '#0a0a1e' : '#1a1a2e' },
        ]}
      >
        <StatusBar barStyle="light-content" />
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
          <Animated.View entering={FadeInDown.springify()}>
            <Text style={styles.narrativeChapter}>{activeChapter.titleTr}</Text>
            <Text style={styles.narrativeText}>{activeChapter.narrativeTr}</Text>
          </Animated.View>

          {choiceMade ? (
            <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.outcomeBox}>
              <Text style={styles.outcomeText}>{choiceMade.outcomeTr}</Text>
              {choiceMade.xpBonus > 0 && (
                <Text style={styles.outcomeXp}>+{choiceMade.xpBonus} XP Bonus!</Text>
              )}
            </Animated.View>
          ) : (
            <View style={{ gap: 12, marginTop: 24 }}>
              <Text style={styles.choicePrompt}>Ne yaparsın?</Text>
              {activeChapter.choices.map((choice, i) => (
                <Animated.View key={choice.id} entering={FadeInDown.delay(300 + i * 100)}>
                  <TouchableOpacity style={styles.choiceBtn} onPress={() => makeChoice(choice)}>
                    <Text style={styles.choiceBtnText}>{choice.textTr}</Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  // ── RENDER: QUIZ ──
  if (phase === 'quiz' && activeChapter) {
    const q = activeChapter.questions[quizIndex];
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, backgroundColor: theme.background.primary },
        ]}
      >
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Bilgi Testi</Text>
          <Text style={[styles.progress, { color: theme.text.secondary }]}>
            {quizIndex + 1}/{activeChapter.questions.length}
          </Text>
        </View>

        <View style={{ padding: 24, gap: 16, flex: 1 }}>
          <Text style={[styles.quizQuestion, { color: theme.text.primary }]}>{q.questionTr}</Text>
          {q.options.map((opt, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.quizOption, { backgroundColor: theme.background.secondary }]}
              onPress={() => answerQuiz(i)}
            >
              <Text style={[styles.quizOptionText, { color: theme.text.primary }]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  // ── RENDER: RESULT ──
  if (phase === 'result') {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, backgroundColor: theme.background.primary },
        ]}
      >
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.resultContainer}>
          <Animated.View entering={FadeInDown.springify()}>
            <LinearGradient colors={['#F1C40F', '#E67E22']} style={styles.resultBadge}>
              <Award size={48} color="#FFF" />
            </LinearGradient>
          </Animated.View>
          <Text style={[styles.resultTitle, { color: theme.text.primary }]}>
            {i18n.t('story.chapter_completed')}
          </Text>
          <View style={styles.rewardRow}>
            <View style={styles.rewardItem}>
              <Star size={24} color="#F1C40F" fill="#F1C40F" />
              <Text style={[styles.rewardText, { color: theme.text.primary }]}>
                +{chapterResult?.xp || 0} XP
              </Text>
            </View>
            <View style={styles.rewardItem}>
              <Sparkles size={24} color="#3498DB" />
              <Text style={[styles.rewardText, { color: theme.text.primary }]}>
                +{chapterResult?.gems || 0} 💎
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => {
              setPhase('chapters');
              setActiveChapter(null);
            }}
          >
            <Text style={styles.continueBtnText}>{i18n.t('common.continue')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  progress: { fontSize: 14, fontWeight: '600' },
  sectionDesc: { fontSize: 14, lineHeight: 21, marginBottom: 8 },
  worldCard: { borderRadius: 20, padding: 20, gap: 12 },
  worldHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  worldEmoji: { fontSize: 36 },
  worldTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  worldDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 },
  worldProgress: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  worldProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  worldProgressFill: { height: '100%', backgroundColor: '#FFF', borderRadius: 3 },
  worldProgressText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '700' },
  chapterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
  },
  chapterNum: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapterNumText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  chapterTitle: { fontSize: 15, fontWeight: '700' },
  chapterReward: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  narrativeChapter: {
    color: '#F1C40F',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 1,
  },
  narrativeText: { color: '#FFF', fontSize: 17, lineHeight: 28, fontWeight: '500' },
  choicePrompt: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '600' },
  choiceBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: 18,
  },
  choiceBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600', textAlign: 'center' },
  outcomeBox: {
    backgroundColor: 'rgba(46,204,113,0.15)',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    gap: 8,
  },
  outcomeText: { color: '#FFF', fontSize: 15, lineHeight: 24 },
  outcomeXp: { color: '#F1C40F', fontSize: 14, fontWeight: '700' },
  quizQuestion: { fontSize: 20, fontWeight: '700', lineHeight: 28 },
  quizOption: { padding: 18, borderRadius: 16 },
  quizOptionText: { fontSize: 16, fontWeight: '600' },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    padding: 40,
  },
  resultBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultTitle: { fontSize: 24, fontWeight: '800' },
  rewardRow: { flexDirection: 'row', gap: 24 },
  rewardItem: { alignItems: 'center', gap: 6 },
  rewardText: { fontSize: 18, fontWeight: '700' },
  continueBtn: {
    backgroundColor: '#2ECC71',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
  },
  continueBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
