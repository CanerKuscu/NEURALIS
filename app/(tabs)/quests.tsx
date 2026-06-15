/**
 * Quests Screen - Monthly AI Challenges & Rich UI
 */
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Animated as RNAnimated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Target, Gift, Zap, Calendar, Trophy, Star, CheckCircle, Lock, Flame, BookOpen, Clock } from 'lucide-react-native';
import { supabase } from '../../src/config/supabase';
import { COLORS } from '../../src/constants/theme';
import Animated, { FadeInDown, Layout, ZoomIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import i18n from '../../src/i18n';
import { useTheme } from '../../src/context/ThemeContext';

const { width } = Dimensions.get('window');

// Quest types with icons
const QUEST_ICONS: Record<string, any> = {
    target: Target,
    star: Star,
    zap: Zap,
    flame: Flame,
    book: BookOpen,
    clock: Clock,
};

interface DailyQuest {
    id: string;
    title: string;
    desc: string;
    target: number;
    current: number;
    xp: number;
    icon: string;
    color: string;
    completed: boolean;
}

interface MonthlyChallenge {
    title: string;
    description: string;
    current: number;
    target: number;
    monthName: string;
}

export default function QuestsScreen() {
    const insets = useSafeAreaInsets();
    const { theme, isDark } = useTheme();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [dailyQuests, setDailyQuests] = useState<DailyQuest[]>([]);
    const [monthlyChallenge, setMonthlyChallenge] = useState<MonthlyChallenge | null>(null);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
            setProfile(data);

            // Calculate real quest progress from user data
            const todayXP = data?.today_xp || 0;
            const lessonsToday = data?.lessons_today || 0;
            const perfectLessons = data?.perfect_lessons_today || 0;
            const fastLessons = data?.fast_lessons_today || 0;
            const questsCompleted = data?.quests_completed_this_month || 0;

            // Set daily quests with real progress
            setDailyQuests([
                {
                    id: '1',
                    title: i18n.t('quests.daily_goal'),
                    desc: i18n.t('quests.earn_xp'),
                    target: 50,
                    current: Math.min(todayXP, 50),
                    xp: 10,
                    icon: 'target',
                    color: '#2ECC71',
                    completed: todayXP >= 50
                },
                {
                    id: '2',
                    title: i18n.t('quests.perfect_lesson'),
                    desc: i18n.t('quests.perfect_lesson_desc'),
                    target: 1,
                    current: Math.min(perfectLessons, 1),
                    xp: 20,
                    icon: 'star',
                    color: '#F1C40F',
                    completed: perfectLessons >= 1
                },
                {
                    id: '3',
                    title: i18n.t('quests.lightning_round'),
                    desc: i18n.t('quests.lightning_round_desc'),
                    target: 1,
                    current: Math.min(fastLessons, 1),
                    xp: 15,
                    icon: 'zap',
                    color: '#9B59B6',
                    completed: fastLessons >= 1
                },
            ]);

            // Set monthly challenge
            const now = new Date();
            const monthKeys = ['quests.months.january', 'quests.months.february', 'quests.months.march', 'quests.months.april', 'quests.months.may', 'quests.months.june',
                'quests.months.july', 'quests.months.august', 'quests.months.september', 'quests.months.october', 'quests.months.november', 'quests.months.december'];
            setMonthlyChallenge({
                title: i18n.t('quests.ai_explorer'),
                description: i18n.t('quests.monthly_desc'),
                current: questsCompleted,
                target: 30,
                monthName: i18n.t(monthKeys[now.getMonth()]),
            });
        }
        setLoading(false);
    };

    const ProgressBar = ({ current, target, color, completed }: { current: number, target: number, color: string, completed?: boolean }) => {
        const progress = target > 0 ? Math.max(0, Math.min(current / target, 1)) : 0;
        return (
            <View style={styles.progressTrack}>
                <View style={[
                    styles.progressBar,
                    {
                        width: `${progress * 100}%`,
                        backgroundColor: completed ? '#2ECC71' : color
                    }
                ]} />
            </View>
        );
    };

    const getQuestIcon = (iconName: string) => {
        return QUEST_ICONS[iconName] || Target;
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background.primary }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.background.secondary }]}>
                <Text style={[styles.headerTitle, { color: theme.text.primary }]}>{i18n.t('quests.title')}</Text>
                <TouchableOpacity style={[styles.historyBtn, { backgroundColor: isDark ? '#2D4A3E' : '#E8F5E9' }]}>
                    <Calendar size={20} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* MONTHLY CHALLENGE CARD */}
                {monthlyChallenge && (
                    <Animated.View entering={ZoomIn.duration(600)} style={styles.monthlyCard}>
                        <LinearGradient
                            colors={['#667EEA', '#764BA2']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.monthlyGradient}
                        >
                            <View style={styles.monthlyHeader}>
                                <View>
                                    <Text style={styles.monthlyLabel}>{monthlyChallenge.monthName.toUpperCase()} {i18n.t('quests.challenge')}</Text>
                                    <Text style={styles.monthlyTitle}>{monthlyChallenge.title}</Text>
                                </View>
                                <View style={styles.badgeContainer}>
                                    <Trophy size={24} color="#FFF" fill="#F1C40F" />
                                </View>
                            </View>
                            <Text style={styles.monthlyDesc}>{monthlyChallenge.description}</Text>

                            <View style={styles.monthlyProgressRow}>
                                <View style={{ flex: 1 }}>
                                    <View style={styles.monthlyTrack}>
                                        <View style={[styles.monthlyBar, { width: `${(monthlyChallenge.current / monthlyChallenge.target) * 100}%` }]} />
                                    </View>
                                    <Text style={styles.monthlyStats}>{monthlyChallenge.current} / {monthlyChallenge.target} {i18n.t('quests.completed')}</Text>
                                </View>
                                <Gift size={32} color="#FFF" />
                            </View>
                        </LinearGradient>
                    </Animated.View>
                )}

                {/* DAILY QUESTS SECTIONS */}
                <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>{i18n.t('quests.daily')}</Text>

                {dailyQuests.map((quest, index) => {
                    const QuestIcon = getQuestIcon(quest.icon);
                    return (
                        <Animated.View
                            key={quest.id}
                            entering={FadeInDown.delay(index * 150).springify()}
                            style={[
                                styles.questCard,
                                {
                                    backgroundColor: theme.background.secondary,
                                    borderColor: quest.completed ? '#2ECC71' : theme.border.light,
                                    opacity: quest.completed ? 0.8 : 1
                                }
                            ]}
                        >
                            <View style={[
                                styles.questIcon,
                                { backgroundColor: quest.completed ? '#2ECC71' : quest.color }
                            ]}>
                                {quest.completed ? (
                                    <CheckCircle size={24} color="#FFF" />
                                ) : (
                                    <QuestIcon size={24} color="#FFF" />
                                )}
                            </View>
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={[
                                        styles.questTitle,
                                        { color: theme.text.primary },
                                        quest.completed && styles.questTitleCompleted
                                    ]}>
                                        {quest.title}
                                    </Text>
                                    <Text style={[
                                        styles.questXp,
                                        quest.completed && { color: '#2ECC71' }
                                    ]}>
                                        {quest.completed ? '✓' : `+${quest.xp} XP`}
                                    </Text>
                                </View>
                                <Text style={[styles.questDesc, { color: theme.text.secondary }]}>{quest.desc}</Text>
                                <ProgressBar
                                    current={quest.current}
                                    target={quest.target}
                                    color={quest.color}
                                    completed={quest.completed}
                                />
                                {!quest.completed && (
                                    <Text style={[styles.questProgress, { color: theme.text.tertiary }]}>
                                        {quest.current} / {quest.target}
                                    </Text>
                                )}
                            </View>
                        </Animated.View>
                    );
                })}

                {/* LOCKED / UPCOMING */}
                <View style={[styles.questCard, { opacity: 0.6, backgroundColor: theme.background.secondary, borderColor: theme.border.light }]}>
                    <View style={[styles.questIcon, { backgroundColor: '#BDC3C7' }]}>
                        <Lock size={24} color="#FFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.questTitle, { color: theme.text.primary }]}>{i18n.t('quests.mystery_quest')}</Text>
                        <Text style={[styles.questDesc, { color: theme.text.secondary }]}>{i18n.t('quests.mystery_quest_desc')}</Text>
                    </View>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 24, paddingVertical: 16,
    },
    headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text.primary },
    historyBtn: { padding: 8, backgroundColor: '#E8F5E9', borderRadius: 12 },

    monthlyCard: {
        marginBottom: 32,
        borderRadius: 24,
        elevation: 8,
        shadowColor: '#667EEA',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
    },
    monthlyGradient: { padding: 24, borderRadius: 24 },
    monthlyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    monthlyLabel: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
    monthlyTitle: { fontSize: 24, fontWeight: '800', color: '#FFF' },
    badgeContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    monthlyDesc: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 20 },
    monthlyProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    monthlyTrack: { height: 10, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 5, marginBottom: 4 },
    monthlyBar: { height: 10, backgroundColor: '#FFF', borderRadius: 5 },
    monthlyStats: { fontSize: 12, fontWeight: '700', color: '#FFF' },

    sectionTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text.primary, marginBottom: 16 },

    questCard: {
        flexDirection: 'row', alignItems: 'center', gap: 16,
        backgroundColor: '#FFF', padding: 16, borderRadius: 20, marginBottom: 12,
        borderWidth: 2, borderColor: '#E5E5E5',
    },
    questIcon: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    questTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text.primary, marginBottom: 4 },
    questTitleCompleted: { textDecorationLine: 'line-through', opacity: 0.7 },
    questXp: { fontSize: 14, fontWeight: '800', color: '#F1C40F' },
    questDesc: { fontSize: 13, color: COLORS.text.secondary, marginBottom: 8 },
    questProgress: { fontSize: 11, marginTop: 4, fontWeight: '600' },

    progressTrack: { height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, width: '100%' },
    progressBar: { height: 8, borderRadius: 4 },
});
