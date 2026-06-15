/**
 * NEURALIS - AI Personal Learning Plan Screen
 * Haftalık kişisel öğrenme planı — Neural Fox AI tarafından oluşturulur
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Brain, Target, CheckCircle, Circle, Sparkles, Calendar, TrendingUp, Flame, RefreshCw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import { supabase } from '../src/config/supabase';
import { learningPlanService, WeeklyPlan, DailyPlanItem } from '../src/services/LearningPlanService';
import * as Haptics from 'expo-haptics';
import i18n from '../src/i18n';

const { width } = Dimensions.get('window');

const CATEGORY_EMOJI: Record<string, string> = {
    mathematics: '🔢', science: '🔬', coding: '💻', history: '📜',
    language: '🌍', music: '🎵', art: '🎨', geography: '🗺️',
};

const PRIORITY_COLORS = { high: '#FF4B4B', medium: '#FFD700', low: '#2ECC71' };

export default function LearningPlanScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { theme } = useTheme();
    const [plan, setPlan] = useState<WeeklyPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [selectedDay, setSelectedDay] = useState<string>('');

    useEffect(() => { loadPlan(); }, []);

    const loadPlan = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;
            let existing = await learningPlanService.getCurrentPlan(session.user.id);
            if (!existing) {
                setGenerating(true);
                existing = await learningPlanService.generateWeeklyPlan(session.user.id);
                setGenerating(false);
            }
            setPlan(existing);
            const todayName = [i18n.t('learning.days.sun'), i18n.t('learning.days.mon'), i18n.t('learning.days.tue'), i18n.t('learning.days.wed'), i18n.t('learning.days.thu'), i18n.t('learning.days.fri'), i18n.t('learning.days.sat')][new Date().getDay()];
            setSelectedDay(todayName);
        } catch (e) { console.warn(e); } finally { setLoading(false); }
    };

    const regeneratePlan = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setGenerating(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        const newPlan = await learningPlanService.generateWeeklyPlan(session.user.id);
        setPlan(newPlan);
        setGenerating(false);
    };

    const handleComplete = async (dayKey: string, cat: string) => {
        if (!plan) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        await learningPlanService.markItemCompleted(session.user.id, dayKey, cat);
        const updated = await learningPlanService.getCurrentPlan(session.user.id);
        if (updated) setPlan(updated);
    };

    const completionRate = plan ? learningPlanService.getCompletionRate(plan) : 0;

    if (loading || generating) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
                <ActivityIndicator size="large" color="#2ECC71" style={{ marginTop: 200 }} />
                <Text style={[styles.loadingText, { color: theme.text.secondary }]}>
                    {generating ? i18n.t('learning.ai_creating') : i18n.t('learning.loading')}
                </Text>
            </View>
        );
    }

    const dayItems = plan?.days[selectedDay] || [];
    const dayKeys = plan ? Object.keys(plan.days) : [];

    return (
        <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
            {/* Header */}
            <LinearGradient colors={['#9B59B6', '#8E44AD']} style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>📋 Haftalık Plan</Text>
                    <TouchableOpacity onPress={regeneratePlan} style={styles.backBtn}>
                        <RefreshCw size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* Progress */}
                <Animated.View entering={FadeIn.delay(200)} style={styles.progressSection}>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${completionRate}%` }]} />
                    </View>
                    <Text style={styles.progressText}>%{completionRate} {i18n.t('learning.completed')} • {plan?.weeklyGoal.totalLessons} {i18n.t('learning.lesson')}</Text>
                </Animated.View>

                {/* AI Insight */}
                <Animated.View entering={FadeInDown.delay(300)} style={styles.insightCard}>
                    <Sparkles size={16} color="#FFD700" />
                    <Text style={styles.insightText}>{plan?.aiInsight}</Text>
                </Animated.View>
            </LinearGradient>

            {/* Day Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daySelector} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
                {dayKeys.map((day) => {
                    const isSelected = day === selectedDay;
                    const dayCompleted = (plan?.days[day] || []).every(item =>
                        plan?.completedItems.includes(`${day}_${item.category}`)
                    );
                    return (
                        <TouchableOpacity key={day} onPress={() => { setSelectedDay(day); Haptics.selectionAsync(); }}
                            style={[styles.dayChip, isSelected && styles.dayChipActive, dayCompleted && styles.dayChipDone]}>
                            <Text style={[styles.dayChipText, isSelected && styles.dayChipTextActive]}>
                                {dayCompleted ? '✅ ' : ''}{day.substring(0, 3)}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Day Plan */}
            <ScrollView style={styles.content} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
                <Text style={[styles.dayTitle, { color: theme.text.primary }]}>
                    <Calendar size={18} color={theme.primary} /> {selectedDay}
                </Text>

                {dayItems.map((item, i) => {
                    const isCompleted = plan?.completedItems.includes(`${selectedDay}_${item.category}`);
                    return (
                        <Animated.View key={`${selectedDay}_${i}`} entering={FadeInDown.delay(i * 80)}>
                            <TouchableOpacity
                                style={[styles.planItem, { backgroundColor: theme.background.secondary, borderLeftColor: PRIORITY_COLORS[item.priority] }]}
                                onPress={() => isCompleted ? null : handleComplete(selectedDay, item.category)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.planItemLeft}>
                                    <Text style={{ fontSize: 28 }}>{CATEGORY_EMOJI[item.category] || '📚'}</Text>
                                </View>
                                <View style={styles.planItemCenter}>
                                    <Text style={[styles.planCategory, { color: theme.text.primary }]}>
                                        {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                                    </Text>
                                    <Text style={[styles.planReason, { color: theme.text.secondary }]}>{item.reason}</Text>
                                    <View style={styles.planMeta}>
                                        <Text style={[styles.planMetaText, { color: theme.text.secondary }]}>
                                            {item.lessonCount} ders • {item.estimatedMinutes} dk
                                        </Text>
                                        <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[item.priority] + '20' }]}>
                                            <Text style={[styles.priorityText, { color: PRIORITY_COLORS[item.priority] }]}>
                                                {item.priority === 'high' ? i18n.t('learning.priority') : item.priority === 'medium' ? i18n.t('learning.normal') : i18n.t('learning.optional')}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                <View style={styles.planItemRight}>
                                    {isCompleted ? (
                                        <CheckCircle size={28} color="#2ECC71" />
                                    ) : (
                                        <Circle size={28} color={theme.text.secondary} />
                                    )}
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    );
                })}

                {dayItems.length === 0 && (
                    <Text style={[styles.emptyText, { color: theme.text.secondary }]}>Bu gün için plan yok 🎉</Text>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 16, paddingBottom: 20 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },
    progressSection: { marginTop: 16 },
    progressBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#2ECC71', borderRadius: 4 },
    progressText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 6, textAlign: 'center' },
    insightCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 12, marginTop: 12 },
    insightText: { flex: 1, color: '#FFF', fontSize: 13, lineHeight: 18 },
    daySelector: { maxHeight: 50, marginTop: 12 },
    dayChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1A1A2E', borderWidth: 1, borderColor: '#333' },
    dayChipActive: { backgroundColor: '#9B59B6', borderColor: '#9B59B6' },
    dayChipDone: { borderColor: '#2ECC71' },
    dayChipText: { color: '#888', fontWeight: '600', fontSize: 13 },
    dayChipTextActive: { color: '#FFF' },
    content: { flex: 1 },
    dayTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
    planItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4 },
    planItemLeft: { marginRight: 12 },
    planItemCenter: { flex: 1 },
    planCategory: { fontSize: 16, fontWeight: '700' },
    planReason: { fontSize: 12, marginTop: 2 },
    planMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
    planMetaText: { fontSize: 11 },
    priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    priorityText: { fontSize: 10, fontWeight: '700' },
    planItemRight: { marginLeft: 8 },
    emptyText: { textAlign: 'center', marginTop: 40, fontSize: 16 },
    loadingText: { textAlign: 'center', marginTop: 16, fontSize: 14 },
});
