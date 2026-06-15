/**
 * Home Screen - Modern Category Grid
 */
import React, { useState, useCallback, useRef } from 'react';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity, RefreshControl, StatusBar, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import {
    Flame, Heart, Star, Zap, Trophy,
    Calculator, Code, Music, Palette, Globe, Brain, Microscope, BookOpen, Sparkles, ChevronRight, Wand2, Crown,
    Swords, Mic, Shirt, Map, Headphones, BookMarked, Layers, MessageCircle as ChatIcon, Trophy as TrophyIcon, Bot, BarChart3, Lightbulb,
    CalendarDays, Timer, Users, Award, ShoppingBag, GraduationCap, Wallet, MailPlus, TreePine, Medal,
} from 'lucide-react-native';
import { supabase } from '../../src/config/supabase';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../src/context/ThemeContext';
import { ShadowFox } from '../../src/components';
import { dailyLessonService, DailyLessonData } from '../../src/services/DailyLessonService';
import { CATEGORY_TREE, Category } from '../../src/data/categories';
import i18n from '../../src/i18n';
import PremiumPopup from '../../src/components/PremiumPopup';

const { width } = Dimensions.get('window');

interface ProfileData {
    username: string | null;
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
    current_streak: number | null;
    total_xp: number | null;
    current_lives: number | null;
    is_premium: boolean | null;
}

// CATEGORY_TREE imported from src/data/categories.ts

export default function HomeScreen() {
    const insets = useSafeAreaInsets();
    const { theme, isDark } = useTheme();
    const [refreshing, setRefreshing] = useState(false);
    const [state, setState] = useState<{
        profile: ProfileData | null;
        streak: number;
        totalXp: number;
        lives: number;
        isPremium: boolean;
        dailyData: DailyLessonData | null;
    }>({ profile: null, streak: 0, totalXp: 0, lives: 5, isPremium: false, dailyData: null });

    const { profile, streak, totalXp, lives, isPremium, dailyData } = state;

    // Profile cache TTL — skip re-fetch if data is less than 30 seconds old
    const lastFetchedAtRef = useRef<number>(0);
    const PROFILE_CACHE_TTL = 30_000; // 30 seconds

    const loadProfile = async (force = false) => {
        const now = Date.now();
        if (!force && now - lastFetchedAtRef.current < PROFILE_CACHE_TTL) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const { data, error } = await supabase
                .from('profiles')
                .select('username, display_name, first_name, last_name, current_streak, total_xp, current_lives, is_premium')
                .eq('id', session.user.id)
                .maybeSingle();

            if (data) {
                const daily = await dailyLessonService.getDailyStatus(session.user.id);
                lastFetchedAtRef.current = Date.now();
                setState({
                    profile: data,
                    streak: data.current_streak || 0,
                    totalXp: data.total_xp || 0,
                    lives: data.current_lives ?? 5,
                    isPremium: Boolean(data.is_premium),
                    dailyData: daily,
                });
            }
        } catch (err) {
            if (__DEV__) console.warn('[Home] Profile load error:', err);
        }
    };

    // Reload profile when screen gains focus
    useFocusEffect(
        useCallback(() => {
            loadProfile();
        }, [])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadProfile(true); // force bypass cache on manual refresh
        setRefreshing(false);
    };

    const handleSubjectPress = (cat: Category) => {
        router.push({
            pathname: '/category-topics',
            params: { category: cat.id }
        });
    };

    // Priority: first_name -> display_name -> username -> 'Learner'
    const fallbackName = i18n.t('home.student') || 'Learner';
    const userName = (profile?.first_name || profile?.display_name || profile?.username || fallbackName).trim() || fallbackName;

    const getTimeGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 6) return i18n.t('home.good_night');
        if (hour < 12) return i18n.t('home.good_morning');
        if (hour < 18) return i18n.t('home.good_afternoon');
        return i18n.t('home.good_evening');
    };

    const getMotivation = () => {
        if (streak >= 7) return 'Muhteşem bir seride gidiyorsun! 🔥';
        if (streak >= 3) return 'Serin devam ediyor, harika! ⚡';
        if (dailyData && dailyData.lessonsCompletedToday > 0) return 'Bugün harika gidiyorsun! 🚀';
        return i18n.t('home.motivational');
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top + 10, backgroundColor: theme.background.primary }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.background.primary} />

            {/* Premium Upsell Popup */}
            <PremiumPopup isPremium={isPremium} />

            {/* HEADER */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={[styles.greeting, { color: theme.text.primary }]}>{getTimeGreeting()}, {userName}!</Text>
                    <Text style={[styles.subGreeting, { color: theme.text.secondary }]}>{getMotivation()}</Text>
                </View>

                <View style={styles.statsRow}>
                    <TouchableOpacity style={[styles.statBadge, { backgroundColor: theme.background.secondary }]} activeOpacity={0.8}>
                        <Flame size={20} color="#FF9600" fill="#FF9600" />
                        <Text style={[styles.statText, { color: theme.text.primary }]}>{streak}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.statBadge, { backgroundColor: theme.background.secondary }]} activeOpacity={0.8}>
                        <Star size={20} color="#FFC800" fill="#FFC800" />
                        <Text style={[styles.statText, { color: theme.text.primary }]}>{totalXp}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                }
            >
                {/* HERO BANNER */}
                <Animated.View entering={FadeInDown.delay(100).springify()}>
                    <TouchableOpacity activeOpacity={0.9} style={styles.heroCard} onPress={() => handleSubjectPress(CATEGORY_TREE[0])}>
                        <LinearGradient
                            colors={['#667EEA', '#764BA2']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.heroGradient}
                        >
                            <View style={styles.heroContent}>
                                <View style={styles.heroText}>
                                    <Text style={styles.heroBadge}>GÜNLÜK MEYDAN OKUMA</Text>
                                    <Text style={styles.heroTitle}>Beyin Gücünü Artır!</Text>
                                    <Text style={styles.heroDesc}>{i18n.t('home.daily_task')}</Text>
                                </View>
                                <View style={styles.heroIcon}>
                                    <Zap size={48} color="#FFF" fill="#FFF" />
                                </View>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                {/* CATEGORIES TITLE */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Kategoriler</Text>
                    <Sparkles size={20} color={theme.primary} />
                </View>

                {/* MASONRY-STYLE GRID */}
                <View style={styles.gridContainer}>
                    {CATEGORY_TREE.map((cat, index) => (
                        <Animated.View
                            key={cat.id}
                            entering={FadeInDown.delay(index * 100).springify()}
                            style={styles.cardWrapper}
                        >
                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() => handleSubjectPress(cat)}
                                style={styles.cardTouch}
                            >
                                <View style={[styles.cardShadow, { backgroundColor: cat.shadow }]} />
                                <LinearGradient
                                    colors={cat.gradient}
                                    style={styles.cardGradient}
                                >
                                    <View style={styles.cardIcon}>
                                        <cat.icon size={32} color="#FFF" />
                                    </View>
                                    <View>
                                        <Text style={styles.cardTitle}>{cat.titleTR}</Text>
                                        <Text style={styles.cardSubtitle}>{cat.subtitle}</Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    ))}
                </View>

                {/* DAILY LESSON STATUS */}
                {dailyData && !isPremium && (
                    <Animated.View entering={FadeInDown.delay(100)}>
                        <View style={[styles.dailyStatusCard, { backgroundColor: theme.background.secondary }]}>
                            <View style={styles.dailyStatusLeft}>
                                <BookOpen size={20} color={theme.primary} />
                                <Text style={[styles.dailyStatusText, { color: theme.text.primary }]}>
                                    Günlük Ders: {dailyData.lessonsCompletedToday}/{dailyData.lessonsCompletedToday + dailyData.remainingLessons}
                                </Text>
                            </View>
                            {dailyData.adsWatchedToday < 3 && (
                                <View style={styles.dailyAdBadge}>
                                    <Text style={styles.dailyAdText}>+{3 - dailyData.adsWatchedToday} Reklam</Text>
                                </View>
                            )}
                        </View>
                    </Animated.View>
                )}

                {/* FEATURE CARDS */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Özellikler</Text>
                    <Zap size={20} color={theme.primary} />
                </View>

                <View style={styles.featureGrid}>
                    {/* Brain Map */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.featureCard}
                        onPress={() => router.push('/brain-map')}
                    >
                        <LinearGradient colors={['#6C5CE7', '#A29BFE']} style={styles.featureGradient}>
                            <Map size={28} color="#FFF" />
                            <Text style={styles.featureTitle}>Beyin Haritası</Text>
                            <Text style={styles.featureDesc}>Çürüme durumunu gör</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Neural Duel */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.featureCard}
                        onPress={() => router.push('/duel')}
                    >
                        <LinearGradient colors={['#E0115F', '#FF6B6B']} style={styles.featureGradient}>
                            <Swords size={28} color="#FFF" />
                            <Text style={styles.featureTitle}>Nöral Düello</Text>
                            <Text style={styles.featureDesc}>PvP yarış başlat</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Voice Shadow */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.featureCard}
                        onPress={() => router.push('/voice-shadow')}
                    >
                        <LinearGradient colors={['#00B894', '#55EFC4']} style={styles.featureGradient}>
                            <View style={styles.featurePremiumBadge}>
                                <Crown size={10} color="#F1C40F" />
                            </View>
                            <Mic size={28} color="#FFF" />
                            <Text style={styles.featureTitle}>Sesli Gölge</Text>
                            <Text style={styles.featureDesc}>YZ ile konuş</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Fox Cosmetics */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.featureCard}
                        onPress={() => router.push('/fox-cosmetics')}
                    >
                        <LinearGradient colors={['#FF9600', '#FDCB6E']} style={styles.featureGradient}>
                            <ShadowFox state="healthy" mood="happy" size="small" showGlow={false} style={{ width: 40, height: 40 }} />
                            <Text style={styles.featureTitle}>Kozmetik</Text>
                            <Text style={styles.featureDesc}>Tilkini giydir</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* LEAGUE TEASER */}
                <TouchableOpacity style={[styles.leagueTeaser, { backgroundColor: theme.background.secondary }]} onPress={() => router.push('/league')}>
                    <View style={styles.leagueIcon}>
                        <Trophy size={24} color="#FFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.leagueTitle, { color: theme.text.primary }]}>Haftalık Lig</Text>
                        <Text style={[styles.leagueSub, { color: theme.text.secondary }]}>Diğerleriyle yarış!</Text>
                    </View>
                    <ChevronRight size={24} color={theme.text.secondary} />
                </TouchableOpacity>

                {/* NEW FEATURES SECTION */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Keşfet</Text>
                    <Sparkles size={20} color="#F1C40F" />
                </View>

                <View style={styles.featureGrid}>
                    {/* Story Mode */}
                    <TouchableOpacity activeOpacity={0.8} style={styles.featureCard} onPress={() => router.push('/story-mode')}>
                        <LinearGradient colors={['#9B59B6', '#8E44AD']} style={styles.featureGradient}>
                            <BookMarked size={28} color="#FFF" />
                            <Text style={styles.featureTitle}>Hikaye Modu</Text>
                            <Text style={styles.featureDesc}>RPG macera</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Audio Lessons */}
                    <TouchableOpacity activeOpacity={0.8} style={styles.featureCard} onPress={() => router.push('/audio-lessons')}>
                        <LinearGradient colors={['#3498DB', '#2980B9']} style={styles.featureGradient}>
                            <Headphones size={28} color="#FFF" />
                            <Text style={styles.featureTitle}>Sesli Ders</Text>
                            <Text style={styles.featureDesc}>{i18n.t('home.listen_learn')}</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Spaced Repetition */}
                    <TouchableOpacity activeOpacity={0.8} style={styles.featureCard} onPress={() => router.push('/spaced-repetition')}>
                        <LinearGradient colors={['#E67E22', '#D35400']} style={styles.featureGradient}>
                            <Layers size={28} color="#FFF" />
                            <Text style={styles.featureTitle}>Tekrar Kartı</Text>
                            <Text style={styles.featureDesc}>Leitner sistemi</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Daily Card */}
                    <TouchableOpacity activeOpacity={0.8} style={styles.featureCard} onPress={() => router.push('/daily-card')}>
                        <LinearGradient colors={['#1ABC9C', '#16A085']} style={styles.featureGradient}>
                            <Lightbulb size={28} color="#FFF" />
                            <Text style={styles.featureTitle}>Günlük Bilgi</Text>
                            <Text style={styles.featureDesc}>Her gün 1 kart</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* MORE FEATURES ROW */}
                <View style={styles.featureGrid}>
                    {/* Tournament */}
                    <TouchableOpacity activeOpacity={0.8} style={styles.featureCard} onPress={() => router.push('/tournament')}>
                        <LinearGradient colors={['#F39C12', '#E74C3C']} style={styles.featureGradient}>
                            <TrophyIcon size={28} color="#FFF" />
                            <Text style={styles.featureTitle}>Turnuva</Text>
                            <Text style={styles.featureDesc}>Haftalık yarış</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Chat */}
                    <TouchableOpacity activeOpacity={0.8} style={styles.featureCard} onPress={() => router.push('/chat')}>
                        <LinearGradient colors={['#2ECC71', '#27AE60']} style={styles.featureGradient}>
                            <ChatIcon size={28} color="#FFF" />
                            <Text style={styles.featureTitle}>Mesajlar</Text>
                            <Text style={styles.featureDesc}>Arkadaşlarla</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* AI Chat */}
                    <TouchableOpacity activeOpacity={0.8} style={styles.featureCard} onPress={() => router.push('/ai-chat')}>
                        <LinearGradient colors={['#667EEA', '#764BA2']} style={styles.featureGradient}>
                            <Bot size={28} color="#FFF" />
                            <Text style={styles.featureTitle}>AI Asistan</Text>
                            <Text style={styles.featureDesc}>Neural Fox</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Analytics */}
                    <TouchableOpacity activeOpacity={0.8} style={styles.featureCard} onPress={() => router.push('/analytics')}>
                        <LinearGradient colors={['#00B894', '#00CEC9']} style={styles.featureGradient}>
                            <BarChart3 size={28} color="#FFF" />
                            <Text style={styles.featureTitle}>Analitik</Text>
                            <Text style={styles.featureDesc}>İstatistikler</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* CREATE CUSTOM SERIES - Premium Feature */}
                <TouchableOpacity
                    style={styles.createSeriesCard}
                    onPress={() => router.push('/create-series')}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={['#2ECC71', '#27AE60']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.createSeriesGradient}
                    >
                        <View style={styles.createSeriesContent}>
                            <View style={styles.createSeriesIcon}>
                                <Wand2 size={28} color="#FFF" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <View style={styles.premiumTagRow}>
                                    <Text style={styles.createSeriesTitle}>Özel Ders Oluştur</Text>
                                    <View style={styles.premiumTag}>
                                        <Crown size={12} color="#F1C40F" />
                                        <Text style={styles.premiumTagText}>PRO</Text>
                                    </View>
                                </View>
                                <Text style={styles.createSeriesDesc}>
                                    YZ ile istediğin konuda ders serisi oluştur
                                </Text>
                            </View>
                            <ChevronRight size={24} color="#FFF" />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                {/* ─── NEW FEATURES SECTION ─── */}
                <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Yeni Özellikler</Text>
                    <Sparkles size={20} color="#E74C3C" />
                </View>

                <View style={styles.featureGrid}>
                    {/* AI Learning Plan */}
                    <TouchableOpacity activeOpacity={0.8} style={styles.featureCard} onPress={() => router.push('/learning-plan')}>
                        <LinearGradient colors={['#8E44AD', '#9B59B6']} style={styles.featureGradient}>
                            <CalendarDays size={28} color="#FFF" />
                            <Text style={styles.featureTitle}>{i18n.t('home.learning_plan')}</Text>
                            <Text style={styles.featureDesc}>YZ haftalık plan</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Quick Fire 60s */}
                    <TouchableOpacity activeOpacity={0.8} style={styles.featureCard} onPress={() => router.push('/quick-fire')}>
                        <LinearGradient colors={['#E74C3C', '#FF6348']} style={styles.featureGradient}>
                            <Timer size={28} color="#FFF" />
                            <Text style={styles.featureTitle}>Hızlı Ateş 60s</Text>
                            <Text style={styles.featureDesc}>60 saniye quiz</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Study Rooms */}
                    <TouchableOpacity activeOpacity={0.8} style={styles.featureCard} onPress={() => router.push('/study-rooms')}>
                        <LinearGradient colors={['#00B894', '#00CEC9']} style={styles.featureGradient}>
                            <Users size={28} color="#FFF" />
                            <Text style={styles.featureTitle}>Çalışma Odası</Text>
                            <Text style={styles.featureDesc}>{i18n.t('home.learn_together')}</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Exam Simulator */}
                    <TouchableOpacity activeOpacity={0.8} style={styles.featureCard} onPress={() => router.push('/exam-simulator')}>
                        <LinearGradient colors={['#2980B9', '#3498DB']} style={styles.featureGradient}>
                            <GraduationCap size={28} color="#FFF" />
                            <Text style={styles.featureTitle}>Sınav Simülasyonu</Text>
                            <Text style={styles.featureDesc}>TYT / AYT / LGS</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                <View style={styles.featureGrid}>
                    {/* Flashcard Creator */}
                    <TouchableOpacity activeOpacity={0.8} style={styles.featureCard} onPress={() => router.push('/flashcard-creator')}>
                        <LinearGradient colors={['#6C5CE7', '#A29BFE']} style={styles.featureGradient}>
                            <Wallet size={28} color="#FFF" />
                            <Text style={styles.featureTitle}>Flash Kart</Text>
                            <Text style={styles.featureDesc}>Kartlarını oluştur</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Skill Tree */}
                    <TouchableOpacity activeOpacity={0.8} style={styles.featureCard} onPress={() => router.push('/skill-tree')}>
                        <LinearGradient colors={['#2C3E50', '#34495E']} style={styles.featureGradient}>
                            <TreePine size={28} color="#FFF" />
                            <Text style={styles.featureTitle}>Yetenek Ağacı</Text>
                            <Text style={styles.featureDesc}>RPG ilerlemesi</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Wall of Fame */}
                    <TouchableOpacity activeOpacity={0.8} style={styles.featureCard} onPress={() => router.push('/wall-of-fame')}>
                        <LinearGradient colors={['#D4A017', '#C49B0F']} style={styles.featureGradient}>
                            <Medal size={28} color="#FFF" />
                            <Text style={styles.featureTitle}>Şöhret Duvarı</Text>
                            <Text style={styles.featureDesc}>En iyiler listesi</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Weekly Summary */}
                    <TouchableOpacity activeOpacity={0.8} style={styles.featureCard} onPress={() => router.push('/weekly-summary')}>
                        <LinearGradient colors={['#F39C12', '#E67E22']} style={styles.featureGradient}>
                            <MailPlus size={28} color="#FFF" />
                            <Text style={styles.featureTitle}>Haftalık Özet</Text>
                            <Text style={styles.featureDesc}>YZ mentor raporu</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Streak Recovery + Topic Leaderboard + Community Marketplace */}
                <View style={styles.featureGrid}>
                    {/* Streak Recovery */}
                    <TouchableOpacity activeOpacity={0.8} style={styles.featureCard} onPress={() => router.push('/streak-recovery')}>
                        <LinearGradient colors={['#E74C3C', '#C0392B']} style={styles.featureGradient}>
                            <Flame size={28} color="#FFF" />
                            <Text style={styles.featureTitle}>Seri Kurtarma</Text>
                            <Text style={styles.featureDesc}>{i18n.t('home.recover_streak')}</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Topic Leaderboard */}
                    <TouchableOpacity activeOpacity={0.8} style={styles.featureCard} onPress={() => router.push('/topic-leaderboard')}>
                        <LinearGradient colors={['#1ABC9C', '#16A085']} style={styles.featureGradient}>
                            <Award size={28} color="#FFF" />
                            <Text style={styles.featureTitle}>Konu Sıralaması</Text>
                            <Text style={styles.featureDesc}>Kategoride en iyi</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Community Marketplace */}
                    <TouchableOpacity activeOpacity={0.8} style={styles.featureCard} onPress={() => router.push('/community-marketplace')}>
                        <LinearGradient colors={['#FF9600', '#FDCB6E']} style={styles.featureGradient}>
                            <ShoppingBag size={28} color="#FFF" />
                            <Text style={styles.featureTitle}>Topluluk Pazarı</Text>
                            <Text style={styles.featureDesc}>Kullanıcı dersleri</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    header: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        gap: 20,
    },
    headerLeft: {},
    greeting: { fontSize: 26, fontWeight: '800' },
    subGreeting: { fontSize: 16, fontWeight: '500', marginTop: 4 },

    statsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        gap: 6,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    statText: { fontSize: 16, fontWeight: '700' },

    heroCard: {
        marginBottom: 24,
        borderRadius: 24,
        elevation: 8,
        shadowColor: '#667EEA',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
    },
    heroGradient: {
        borderRadius: 24,
        padding: 24,
    },
    heroContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    heroText: { flex: 1, paddingRight: 16 },
    heroBadge: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: 1, marginBottom: 4 },
    heroTitle: { fontSize: 22, fontWeight: '800', color: '#FFF', marginBottom: 4, lineHeight: 28 },
    heroDesc: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
    heroIcon: {
        width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center'
    },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    sectionTitle: { fontSize: 20, fontWeight: '800' },

    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between' },
    cardWrapper: { width: (width - 56) / 2, marginBottom: 8 },
    cardTouch: { position: 'relative', height: 160 },
    cardShadow: {
        position: 'absolute', top: 6, width: '100%', height: 160, borderRadius: 24,
    },
    cardGradient: {
        height: 160, borderRadius: 24, padding: 16, justifyContent: 'space-between',
        marginBottom: 6,
    },
    cardIcon: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 8,
        borderRadius: 12,
    },
    cardTitle: { fontSize: 17, fontWeight: '800', color: '#FFF', marginBottom: 4 },
    cardSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },

    leagueTeaser: {
        marginTop: 24,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        gap: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    leagueIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E0115F', alignItems: 'center', justifyContent: 'center' },
    leagueTitle: { fontSize: 17, fontWeight: '700' },
    leagueSub: { fontSize: 14 },

    // Daily Status
    dailyStatusCard: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 14, borderRadius: 16, marginBottom: 20,
    },
    dailyStatusLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dailyStatusText: { fontSize: 14, fontWeight: '700' },
    dailyAdBadge: {
        backgroundColor: '#FF960020', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
    },
    dailyAdText: { fontSize: 12, fontWeight: '700', color: '#FF9600' },

    // Feature Grid
    featureGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8,
    },
    featureCard: {
        width: (width - 52) / 2, borderRadius: 20, overflow: 'hidden',
        elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15, shadowRadius: 8,
    },
    featureGradient: {
        padding: 16, height: 120, justifyContent: 'space-between',
    },
    featureTitle: {
        fontSize: 15, fontWeight: '800', color: '#FFF', marginTop: 8,
    },
    featureDesc: {
        fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '600',
    },
    featurePremiumBadge: {
        position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.25)',
        width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
    },

    // Create Series Card Styles
    createSeriesCard: {
        marginTop: 16,
        borderRadius: 20,
        elevation: 4,
        shadowColor: '#2ECC71',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    createSeriesGradient: {
        borderRadius: 20,
        padding: 16,
    },
    createSeriesContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    createSeriesIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    premiumTagRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    createSeriesTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
    premiumTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    premiumTagText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#F1C40F',
    },
    createSeriesDesc: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.85)',
    },
});
