/**
 * Tournament Screen — Haftalık Turnuva
 */
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, Trophy, Clock, Users, Gem, Star, Zap, Shield, Crown, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useTheme } from '../src/context/ThemeContext';
import { tournamentService } from '../src/services/TournamentService';
import type { Tournament, TournamentLeaderboard } from '../src/services/TournamentService';
import * as Haptics from 'expo-haptics';
import i18n from '../src/i18n';

export default function TournamentScreen() {
    const insets = useSafeAreaInsets();
    const { theme, isDark } = useTheme();
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [leaderboard, setLeaderboard] = useState<TournamentLeaderboard | null>(null);
    const [hasJoined, setHasJoined] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState('');

    useEffect(() => {
        loadTournament();
        const timer = setInterval(updateTimer, 1000);
        return () => clearInterval(timer);
    }, []);

    const loadTournament = async () => {
        const t = await tournamentService.getActiveTournament();
        setTournament(t);
        if (t) {
            const lb = await tournamentService.getLeaderboard(t.id);
            setLeaderboard(lb);
            const hist = await tournamentService.getHistory();
            setHasJoined(hist.some(h => h.odId === t.id) || lb.myEntry !== undefined);
        }
    };

    const updateTimer = () => {
        if (!tournament) return;
        const end = new Date(tournament.endsAt).getTime();
        const now = Date.now();
        const diff = Math.max(0, end - now);
        const hours = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeRemaining(`${hours}s ${mins}dk ${secs}sn`);
    };

    const joinTournament = async () => {
        if (!tournament) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        const success = await tournamentService.joinTournament(tournament.id);
        if (success) {
            setHasJoined(true);
            // Simüle skor
            await tournamentService.submitScore(tournament.id, 14, 20, 240);
            const lb = await tournamentService.getLeaderboard(tournament.id);
            setLeaderboard(lb);
        }
    };

    const themeColors: Record<string, [string, string]> = {
        speed: ['#F39C12', '#E74C3C'],
        accuracy: ['#3498DB', '#2ECC71'],
        survival: ['#E74C3C', '#8E44AD'],
        streak: ['#FF6B35', '#F7931E'],
        team: ['#2ECC71', '#3498DB'],
    };

    if (!tournament) {
        return (
            <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background.primary }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <ArrowLeft size={24} color={theme.text.primary} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Turnuva</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.emptyContainer}>
                    <Trophy size={64} color={theme.text.secondary} />
                    <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>Aktif Turnuva Yok</Text>
                    <Text style={[styles.emptyDesc, { color: theme.text.secondary }]}>
                        {i18n.t('tournament_screen.starts_thursday')}
                    </Text>
                </View>
            </View>
        );
    }

    const colors = themeColors[tournament.theme] || themeColors.speed;

    return (
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background.primary }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <ArrowLeft size={24} color={theme.text.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Turnuva</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 100 }}>
                {/* Tournament Banner */}
                <Animated.View entering={FadeInDown.springify()}>
                    <LinearGradient colors={colors} style={styles.banner}>
                        <View style={styles.bannerContent}>
                            <Text style={styles.bannerEmoji}>{tournament.emoji}</Text>
                            <Text style={styles.bannerTitle}>{tournament.titleTr}</Text>
                            <Text style={styles.bannerDesc}>{tournament.descriptionTr}</Text>
                        </View>

                        <View style={styles.bannerStats}>
                            <View style={styles.bannerStat}>
                                <Clock size={14} color="rgba(255,255,255,0.7)" />
                                <Text style={styles.bannerStatText}>{timeRemaining}</Text>
                            </View>
                            <View style={styles.bannerStat}>
                                <Users size={14} color="rgba(255,255,255,0.7)" />
                                <Text style={styles.bannerStatText}>{tournament.maxParticipants} kişi</Text>
                            </View>
                            <View style={styles.bannerStat}>
                                <Gem size={14} color="rgba(255,255,255,0.7)" />
                                <Text style={styles.bannerStatText}>{tournament.entryFee} {i18n.t('tournament_screen.entry')}</Text>
                            </View>
                        </View>

                        {!hasJoined && (
                            <TouchableOpacity style={styles.joinBtn} onPress={joinTournament}>
                                <Text style={styles.joinBtnText}>Katıl ({tournament.entryFee} 💎)</Text>
                            </TouchableOpacity>
                        )}
                    </LinearGradient>
                </Animated.View>

                {/* Prizes */}
                <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Ödüller</Text>
                <View style={styles.prizesRow}>
                    {tournament.prizes.map((p, i) => (
                        <Animated.View key={p.rank} entering={FadeInDown.delay(100 + i * 80)} style={[styles.prizeCard, { backgroundColor: theme.background.secondary }]}>
                            <Text style={styles.prizeRank}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</Text>
                            <Text style={[styles.prizeGems, { color: '#3498DB' }]}>{p.gems} 💎</Text>
                            <Text style={[styles.prizeXp, { color: '#F1C40F' }]}>{p.xp} XP</Text>
                            {p.badge && <Text style={styles.prizeBadge}>{p.badge}</Text>}
                        </Animated.View>
                    ))}
                </View>

                {/* Leaderboard */}
                <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Sıralama</Text>
                {leaderboard?.entries.map((entry, i) => (
                    <Animated.View key={entry.userId} entering={FadeInDown.delay(200 + i * 60)}>
                        <View style={[styles.lbRow, {
                            backgroundColor: theme.background.secondary,
                            borderColor: entry.userId === 'me' ? '#2ECC71' : 'transparent',
                            borderWidth: entry.userId === 'me' ? 2 : 0,
                        }]}>
                            <Text style={[styles.lbRank, { color: i < 3 ? '#F1C40F' : theme.text.secondary }]}>
                                {entry.rank}
                            </Text>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.lbName, { color: theme.text.primary }]}>{entry.displayName}</Text>
                                <Text style={[styles.lbMeta, { color: theme.text.secondary }]}>
                                    {entry.correctAnswers} {i18n.t('tournament_screen.correct')} • {Math.round(entry.timeSpent)}s
                                </Text>
                            </View>
                            <Text style={[styles.lbScore, { color: theme.text.primary }]}>{entry.score}</Text>
                        </View>
                    </Animated.View>
                ))}

                {leaderboard?.myEntry && (
                    <View style={[styles.lbRow, { backgroundColor: '#2ECC7115', borderColor: '#2ECC71', borderWidth: 2 }]}>
                        <Text style={[styles.lbRank, { color: '#2ECC71' }]}>{leaderboard.myEntry.rank}</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.lbName, { color: theme.text.primary }]}>Sen 🦊</Text>
                            <Text style={[styles.lbMeta, { color: theme.text.secondary }]}>
                                {leaderboard.myEntry.correctAnswers} {i18n.t('tournament_screen.correct')} • {Math.round(leaderboard.myEntry.timeSpent)}s
                            </Text>
                        </View>
                        <Text style={[styles.lbScore, { color: '#2ECC71' }]}>{leaderboard.myEntry.score}</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 40 },
    emptyTitle: { fontSize: 20, fontWeight: '800' },
    emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 21 },
    banner: { borderRadius: 24, padding: 24, gap: 16 },
    bannerContent: { gap: 8 },
    bannerEmoji: { fontSize: 40 },
    bannerTitle: { color: '#FFF', fontSize: 24, fontWeight: '800' },
    bannerDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
    bannerStats: { flexDirection: 'row', gap: 16 },
    bannerStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    bannerStatText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
    joinBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 16, borderRadius: 16, alignItems: 'center' },
    joinBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginTop: 8 },
    prizesRow: { flexDirection: 'row', gap: 12 },
    prizeCard: { flex: 1, alignItems: 'center', padding: 16, borderRadius: 16, gap: 6 },
    prizeRank: { fontSize: 28 },
    prizeGems: { fontSize: 14, fontWeight: '700' },
    prizeXp: { fontSize: 12, fontWeight: '600' },
    prizeBadge: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
    lbRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 14 },
    lbRank: { fontSize: 18, fontWeight: '800', width: 30, textAlign: 'center' },
    lbName: { fontSize: 15, fontWeight: '700' },
    lbMeta: { fontSize: 12, marginTop: 2 },
    lbScore: { fontSize: 18, fontWeight: '800' },
});
