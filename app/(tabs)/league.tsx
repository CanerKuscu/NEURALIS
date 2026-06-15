/**
 * League Screen - Modern Leaderboard & Bronze Start
 */
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trophy, Shield, Crown, ChevronUp, ChevronDown, Minus, Clock, Calendar } from 'lucide-react-native';
import { supabase } from '../../src/config/supabase';
import { COLORS } from '../../src/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import i18n from '../../src/i18n';
import { useTheme } from '../../src/context/ThemeContext';
import { LeagueBadge, LeagueRank, RANK_NAMES } from '../../src/components/league/LeagueBadge';

// League gradient colors for each rank
const getLeagueGradient = (rank: LeagueRank): [string, string] => {
    const gradients: Record<LeagueRank, [string, string]> = {
        bronze: ['#CD7F32', '#8B5A2B'],
        silver: ['#C0C0C0', '#808080'],
        gold: ['#FFD700', '#DAA520'],
        platinum: ['#00CED1', '#008B8B'],
        diamond: ['#B9F2FF', '#00BFFF'],
        master: ['#9932CC', '#6B238E'],
        grandmaster: ['#FF4500', '#DC143C'],
        challenger: ['#FFD700', '#FF69B4'],
    };
    return gradients[rank];
};

// Promotion text for each rank
const getPromotionText = (rank: LeagueRank): string => {
    const nextRank: Record<LeagueRank, string> = {
        bronze: i18n.t('league.promote_silver'),
        silver: i18n.t('league.promote_gold'),
        gold: i18n.t('league.promote_platinum'),
        platinum: i18n.t('league.promote_diamond'),
        diamond: i18n.t('league.promote_master'),
        master: i18n.t('league.promote_grandmaster'),
        grandmaster: i18n.t('league.promote_challenger'),
        challenger: i18n.t('league.defend_challenger'),
    };
    return nextRank[rank];
};

interface LeaderboardEntry {
    id: string;
    username: string | null;
    display_name: string | null;
    league_points: number;
    avatar_emoji: string | null;
    rank?: number;
}

export default function LeagueScreen() {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [userLeague, setUserLeague] = useState<LeagueRank>('bronze');
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'leaderboard' | 'history'>('leaderboard');
    const [history, setHistory] = useState<{ week: string; rank: number; league: LeagueRank; xp: number; promoted: boolean }[]>([]);

    useEffect(() => {
        loadLeagueData();
    }, []);

    const loadLeagueData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            setCurrentUserId(session.user.id);

            // Get User Profile for current League
            const { data: profile } = await supabase
                .from('profiles')
                .select('league_tier')
                .eq('id', session.user.id)
                .single();

            // Default to Bronze if null
            const tierStr = (profile?.league_tier || 'Bronze').toLowerCase() as LeagueRank;
            setUserLeague(tierStr);

            // Fetch Leaderboard (Mocking "League" scope by just getting top XP users for now)
            // In real app, filter by `league_tier`
            const { data: leaders } = await supabase
                .from('profiles')
                .select('id, username, display_name, league_points, avatar_emoji')
                .order('league_points', { ascending: false })
                .limit(20);

            // Merge with mock if empty for visual demo
            const finalLeaders: LeaderboardEntry[] = (leaders && leaders.length > 0 ? leaders : [])
                .map((l, i) => ({ ...l, rank: i + 1 }));
            setLeaderboard(finalLeaders);

            // Load league history (simulated)
            setHistory([
                { week: i18n.t('features.this_week'), rank: 5, league: tierStr, xp: 420, promoted: false },
                { week: i18n.t('features.last_week'), rank: 2, league: tierStr, xp: 680, promoted: true },
                { week: i18n.t('league.weeks_ago', { count: 2 }), rank: 7, league: 'bronze' as LeagueRank, xp: 310, promoted: false },
                { week: i18n.t('league.weeks_ago', { count: 3 }), rank: 1, league: 'bronze' as LeagueRank, xp: 890, promoted: true },
                { week: i18n.t('league.weeks_ago', { count: 4 }), rank: 4, league: 'bronze' as LeagueRank, xp: 520, promoted: false },
            ]);

        } catch (err) {
            // Error handled silently - empty state will be shown
        } finally {
            setLoading(false);
        }
    };

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Crown size={24} color="#F1C40F" fill="#F1C40F" />;
        if (rank === 2) return <Shield size={24} color="#95A5A6" fill="#95A5A6" />; // Silver-ish
        if (rank === 3) return <Shield size={24} color="#D35400" fill="#D35400" />; // Bronze-ish
        return <Text style={styles.rankText}>{rank}</Text>;
    };

    const getRankStyle = (rank: number) => {
        if (rank === 1) return { borderColor: '#F1C40F', borderWidth: 2 };
        if (rank === 2) return { borderColor: '#95A5A6', borderWidth: 2 };
        if (rank === 3) return { borderColor: '#D35400', borderWidth: 2 };
        return {};
    };

    const renderItem = ({ item, index }: { item: LeaderboardEntry, index: number }) => {
        const isMe = item.id === currentUserId;
        return (
            <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
                <View style={[styles.leaderCard, { backgroundColor: theme.background.secondary }, isMe && styles.myCard, getRankStyle(item.rank || index + 1)]}>
                    <View style={styles.rankContainer}>
                        {getRankIcon(item.rank || index + 1)}
                    </View>

                    <View style={styles.avatarContainer}>
                        {/* Fallback Avatar */}
                        <View style={[styles.avatarPlaceholder, { backgroundColor: theme.background.tertiary }]}>
                            <Text style={{ fontSize: 24 }}>{item.avatar_emoji || '👤'}</Text>
                        </View>
                    </View>

                    <View style={styles.infoContainer}>
                        <Text style={[styles.nameText, { color: theme.text.primary }, isMe && { color: theme.primary }]}>
                            {item.display_name || item.username || i18n.t('league.anonymous')}
                        </Text>
                        <Text style={[styles.xpText, { color: theme.text.secondary }]}>{item.league_points} XP</Text>
                    </View>

                    {/* Status Indicator (Up/Down/Same) */}
                    <View style={styles.statusIcon}>
                        {index < 3 ? <ChevronUp size={20} color="#2ECC71" /> : <Minus size={20} color="#BDC3C7" />}
                    </View>
                </View>
            </Animated.View>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background.primary }]}>
            {/* Header Area - League Info */}
            <LinearGradient
                colors={getLeagueGradient(userLeague)}
                style={styles.headerGradient}
            >
                <View style={styles.headerContent}>
                    <LeagueBadge rank={userLeague} size={70} />
                    <View style={{ alignItems: 'center', flex: 1 }}>
                        <Text style={styles.leagueLabel}>{i18n.t('league.label')}</Text>
                        <Text style={styles.leagueTitle}>{RANK_NAMES[userLeague].toUpperCase()}</Text>
                    </View>
                    <View style={styles.timerBadge}>
                        <Text style={styles.timerText}>{i18n.t('league.time_left', { days: 3 })}</Text>
                    </View>
                </View>

                <View style={styles.zoneInfo}>
                    <Text style={styles.zoneText}>{getPromotionText(userLeague)}</Text>
                </View>
            </LinearGradient>

            {/* Tab Switcher */}
            <View style={[styles.tabContainer, { backgroundColor: theme.background.secondary }]}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'leaderboard' && { backgroundColor: theme.primary }]}
                    onPress={() => setActiveTab('leaderboard')}
                >
                    <Trophy size={16} color={activeTab === 'leaderboard' ? '#FFF' : theme.text.secondary} />
                    <Text style={[styles.tabText, { color: activeTab === 'leaderboard' ? '#FFF' : theme.text.secondary }]}>{i18n.t('league.ranking')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'history' && { backgroundColor: theme.primary }]}
                    onPress={() => setActiveTab('history')}
                >
                    <Clock size={16} color={activeTab === 'history' ? '#FFF' : theme.text.secondary} />
                    <Text style={[styles.tabText, { color: activeTab === 'history' ? '#FFF' : theme.text.secondary }]}>{i18n.t('league.history')}</Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'history' ? (
                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                    {history.map((h, idx) => (
                        <Animated.View key={idx} entering={FadeInDown.delay(idx * 80)}>
                            <View style={[styles.historyCard, { backgroundColor: theme.background.secondary }]}>
                                <View style={styles.historyLeft}>
                                    <Calendar size={18} color={theme.text.tertiary} />
                                    <View>
                                        <Text style={[styles.historyWeek, { color: theme.text.primary }]}>{h.week}</Text>
                                        <Text style={[styles.historyLeague, { color: theme.text.secondary }]}>{RANK_NAMES[h.league]}</Text>
                                    </View>
                                </View>
                                <View style={styles.historyRight}>
                                    <View style={styles.historyRank}>
                                        <Text style={[styles.historyRankText, { color: h.rank <= 3 ? '#F1C40F' : theme.text.primary }]}>#{h.rank}</Text>
                                    </View>
                                    <Text style={[styles.historyXp, { color: theme.text.secondary }]}>{h.xp} XP</Text>
                                    {h.promoted && (
                                        <View style={styles.promotedBadge}>
                                            <ChevronUp size={12} color="#FFF" />
                                            <Text style={styles.promotedText}>Terfi</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </Animated.View>
                    ))}
                </ScrollView>
            ) : (
                <>
                    {loading ? (
                        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
                    ) : leaderboard.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Trophy size={64} color={theme.text.muted} />
                            <Text style={[styles.emptyTitle, { color: theme.text.secondary }]}>{i18n.t('league.no_players')}</Text>
                            <Text style={[styles.emptySubtitle, { color: theme.text.muted }]}>{i18n.t('league.empty_subtitle')}</Text>
                        </View>
                    ) : (
                        <View style={[styles.listContainer, { backgroundColor: theme.background.primary }]}>
                            <FlatList
                                data={leaderboard}
                                keyExtractor={(item, index) => item.id || `lb-${index}`}
                                renderItem={renderItem}
                                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                                showsVerticalScrollIndicator={false}
                                removeClippedSubviews
                                initialNumToRender={15}
                                maxToRenderPerBatch={10}
                                windowSize={5}
                                getItemLayout={(_, index) => ({ length: 72, offset: 72 * index + 16, index })}
                            />
                        </View>
                    )}
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    headerGradient: {
        paddingTop: 20, paddingBottom: 30, paddingHorizontal: 20,
        borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
        elevation: 8,
    },
    headerContent: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 16,
    },
    leagueLabel: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
    leagueTitle: { fontSize: 24, fontWeight: '900', color: '#FFF' },
    timerBadge: {
        backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
    },
    timerText: { color: '#FFF', fontWeight: '700' },

    zoneInfo: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 8, borderRadius: 12 },
    zoneText: { color: '#FFF', fontWeight: '700' },

    listContainer: { flex: 1, marginTop: -20 },

    leaderCard: {
        flexDirection: 'row', alignItems: 'center',
        padding: 12, borderRadius: 16,
        marginBottom: 8,
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2,
    },
    myCard: { backgroundColor: '#E8F5E9', borderColor: COLORS.primary, borderWidth: 1 },

    rankContainer: { width: 40, alignItems: 'center', justifyContent: 'center' },
    rankText: { fontSize: 18, fontWeight: '700' },

    avatarContainer: { marginRight: 12 },
    avatarPlaceholder: {
        width: 48, height: 48, borderRadius: 24,
        alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF'
    },

    infoContainer: { flex: 1 },
    nameText: { fontSize: 16, fontWeight: '700' },
    xpText: { fontSize: 13 },

    statusIcon: { width: 30, alignItems: 'center' },

    // Empty state styles
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
    emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 8 },
    emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },

    // Tab Switcher
    tabContainer: {
        flexDirection: 'row', marginHorizontal: 16, marginTop: -10,
        borderRadius: 14, padding: 4, gap: 4, zIndex: 5,
    },
    tab: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, paddingVertical: 10, borderRadius: 10,
    },
    tabText: { fontSize: 14, fontWeight: '700' },

    // History
    historyCard: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 16, borderRadius: 16, marginBottom: 10,
    },
    historyLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    historyWeek: { fontSize: 15, fontWeight: '700' },
    historyLeague: { fontSize: 12, fontWeight: '500' },
    historyRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    historyRank: {},
    historyRankText: { fontSize: 18, fontWeight: '800' },
    historyXp: { fontSize: 13, fontWeight: '600' },
    promotedBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 2,
        backgroundColor: '#2ECC71', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
    },
    promotedText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
});
