/**
 * Social Screen - Friends, Suggestions & Activity Feed
 */
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Users, UserPlus, Share2, MessageCircle, Heart, Award, UserCheck, Swords } from 'lucide-react-native';
import { supabase } from '../../src/config/supabase';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import i18n from '../../src/i18n';
import { useTheme } from '../../src/context/ThemeContext';
import { useRouter } from 'expo-router';
import { DeepLinkService } from '../../src/services/DeepLinkService';

interface SuggestedUser {
    id: string;
    display_name: string;
    avatar_url: string | null;
    total_xp: number;
    streak: number;
}

interface ActivityItem {
    id: string;
    user_name: string;
    action: string;
    type: 'achievement' | 'streak' | 'level' | 'lesson';
    created_at: string;
}

export default function SocialScreen() {
    const insets = useSafeAreaInsets();
    const { theme, isDark } = useTheme();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('friends');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
    const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
    const [followingCount, setFollowingCount] = useState(0);
    const [followersCount, setFollowersCount] = useState(0);
    const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const session = await supabase.auth.getSession();
            const userId = session.data?.session?.user?.id;

            if (userId) {
                // Load counts
                const [followingRes, followersRes] = await Promise.all([
                    supabase.from('follows').select('id', { count: 'exact' }).eq('follower_id', userId),
                    supabase.from('follows').select('id', { count: 'exact' }).eq('following_id', userId),
                ]);
                setFollowingCount(followingRes.count || 0);
                setFollowersCount(followersRes.count || 0);

                // Load followed user IDs
                const { data: followedData } = await supabase
                    .from('follows')
                    .select('following_id')
                    .eq('follower_id', userId);
                // Build a local Set for immediate use (avoid stale state)
                const followedSet = followedData
                    ? new Set(followedData.map(f => f.following_id))
                    : new Set<string>();
                setFollowedIds(followedSet);

                // Load suggested users (users not followed yet, sorted by XP)
                const { data: suggested } = await supabase
                    .from('profiles')
                    .select('id, display_name, avatar_url, total_xp, streak')
                    .neq('id', userId)
                    .order('total_xp', { ascending: false })
                    .limit(10);

                if (suggested) {
                    // Filter out already followed users using local variable
                    const filtered = suggested.filter(u => !followedSet.has(u.id));
                    setSuggestedUsers(filtered.slice(0, 5));
                }

                // Load recent activity from followed users
                const { data: activity } = await supabase
                    .from('user_activity')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (activity) {
                    setActivityFeed(activity);
                }
            }
        } catch (e) {
            console.warn('[Social] Error loading data:', e);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, []);

    const handleFollow = async (userId: string) => {
        try {
            const session = await supabase.auth.getSession();
            const currentUserId = session.data?.session?.user?.id;
            if (!currentUserId) return;

            const { error } = await supabase.from('follows').insert({
                follower_id: currentUserId,
                following_id: userId,
            });

            if (!error) {
                setFollowedIds(prev => new Set([...prev, userId]));
                setFollowingCount(c => c + 1);
                setSuggestedUsers(prev => prev.filter(u => u.id !== userId));
            }
        } catch (e) {
            console.warn('[Social] Follow error:', e);
        }
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'achievement': return '🏆';
            case 'streak': return '🔥';
            case 'level': return '⬆️';
            case 'lesson': return '✅';
            default: return '📚';
        }
    };

    const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return i18n.t('social.just_now');
        if (diffMins < 60) return i18n.t('social.minutes_ago', { count: diffMins });
        if (diffHours < 24) return i18n.t('social.hours_ago', { count: diffHours });
        return i18n.t('social.days_ago', { count: diffDays });
    };

    const EmptyState = ({ icon: Icon, title, subtitle }: { icon: any, title: string, subtitle: string }) => (
        <View style={styles.emptyState}>
            <Icon size={48} color={theme.text.muted} />
            <Text style={[styles.emptyTitle, { color: theme.text.secondary }]}>{title}</Text>
            <Text style={[styles.emptySubtitle, { color: theme.text.muted }]}>{subtitle}</Text>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background.primary }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.background.secondary, borderBottomColor: theme.border.light }]}>
                <Text style={[styles.headerTitle, { color: theme.text.primary }]}>{i18n.t('social.title')}</Text>
                <TouchableOpacity style={[styles.addBtn, { backgroundColor: isDark ? '#2D4A3E' : '#E8F5E9' }]}>
                    <UserPlus size={24} color={theme.primary} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.text.secondary }]}>{i18n.t('common.loading')}</Text>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[theme.primary]}
                            tintColor={theme.primary}
                        />
                    }
                >
                    {/* STATUS CARDS */}
                    <View style={styles.statsRow}>
                        <View style={[styles.statCard, { backgroundColor: theme.background.secondary, borderColor: theme.border.light }]}>
                            <Users size={24} color={theme.primary} style={{ marginBottom: 4 }} />
                            <Text style={[styles.statNumber, { color: theme.text.primary }]}>{followingCount}</Text>
                            <Text style={[styles.statLabel, { color: theme.text.secondary }]}>{i18n.t('social.following')}</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: theme.background.secondary, borderColor: theme.border.light }]}>
                            <Users size={24} color={theme.secondary || theme.primary} style={{ marginBottom: 4 }} />
                            <Text style={[styles.statNumber, { color: theme.text.primary }]}>{followersCount}</Text>
                            <Text style={[styles.statLabel, { color: theme.text.secondary }]}>{i18n.t('social.followers')}</Text>
                        </View>
                    </View>

                    {/* CHALLENGE ARENA */}
                    <TouchableOpacity
                        style={[styles.inviteCard, { backgroundColor: '#E17055' }]}
                        onPress={() => router.push('/duel')}
                    >
                        <View style={styles.inviteIcon}>
                            <Swords size={24} color="#FFF" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.inviteTitle}>{i18n.t('social.challenge_arena')}</Text>
                            <Text style={styles.inviteDesc}>{i18n.t('social.challenge_arena_desc')}</Text>
                        </View>
                    </TouchableOpacity>

                    {/* INVITE BANNER */}
                    <TouchableOpacity
                        style={styles.inviteCard}
                        onPress={async () => {
                            const { data } = await supabase.auth.getUser();
                            if (data.user) {
                                await DeepLinkService.shareInviteLink(data.user.id);
                            }
                        }}
                    >
                        <View style={styles.inviteIcon}>
                            <Share2 size={24} color="#FFF" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.inviteTitle}>{i18n.t('social.invite')}</Text>
                            <Text style={styles.inviteDesc}>{i18n.t('social.invite_desc')}</Text>
                        </View>
                    </TouchableOpacity>

                    {/* SUGGESTED FRIENDS */}
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>{i18n.t('social.suggested_for_you')}</Text>
                    </View>
                    {suggestedUsers.length > 0 ? (
                        <FlatList
                            horizontal
                            data={suggestedUsers}
                            keyExtractor={item => item.id}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
                            renderItem={({ item, index }) => (
                                <Animated.View entering={FadeInRight.delay(index * 100).springify()}>
                                    <View style={[styles.suggestCard, { backgroundColor: theme.background.secondary, borderColor: theme.border.light }]}>
                                        <View style={styles.avatarPlaceholder}>
                                            {item.avatar_url ? (
                                                <Image source={{ uri: item.avatar_url }} style={{ width: 60, height: 60, borderRadius: 30 }} />
                                            ) : (
                                                <Text style={{ fontSize: 24 }}>👤</Text>
                                            )}
                                        </View>
                                        <Text style={[styles.suggestName, { color: theme.text.primary }]} numberOfLines={1}>{item.display_name || i18n.t('social.default_name')}</Text>
                                        <Text style={[styles.suggestLang, { color: theme.text.secondary }]}>{item.total_xp.toLocaleString()} XP</Text>
                                        <TouchableOpacity
                                            style={[styles.followBtn, { backgroundColor: theme.primary }, followedIds.has(item.id) && styles.followedBtn]}
                                            onPress={() => handleFollow(item.id)}
                                            disabled={followedIds.has(item.id)}
                                        >
                                            {followedIds.has(item.id) ? (
                                                <View style={styles.followedContent}>
                                                    <UserCheck size={14} color="#FFF" />
                                                    <Text style={styles.followText}>{i18n.t('social.following')}</Text>
                                                </View>
                                            ) : (
                                                <Text style={styles.followText}>{i18n.t('social.follow')}</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </Animated.View>
                            )}
                        />
                    ) : (
                        <EmptyState
                            icon={Users}
                            title={i18n.t('social.no_suggestions')}
                            subtitle={i18n.t('social.no_suggestions_desc')}
                        />
                    )}

                    {/* ACTIVITY FEED */}
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>{i18n.t('social.community_activity')}</Text>
                    </View>
                    <View style={styles.feedContainer}>
                        {activityFeed.length > 0 ? (
                            activityFeed.map((item, index) => (
                                <Animated.View
                                    key={item.id}
                                    entering={FadeInDown.delay(index * 100).springify()}
                                    style={[styles.feedItem, { backgroundColor: theme.background.secondary, borderColor: theme.border.light }]}
                                >
                                    <View style={[styles.feedIcon, { backgroundColor: theme.background.tertiary }]}>
                                        <Text style={{ fontSize: 20 }}>{getActivityIcon(item.type)}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            <Text style={[styles.feedUser, { color: theme.text.primary }]}>{item.user_name}</Text>
                                            <Text style={[styles.feedTime, { color: theme.text.muted }]}>• {formatTimeAgo(item.created_at)}</Text>
                                        </View>
                                        <Text style={[styles.feedAction, { color: theme.text.secondary }]}>{item.action}</Text>
                                    </View>
                                    <TouchableOpacity>
                                        <Heart size={20} color={theme.text.muted} />
                                    </TouchableOpacity>
                                </Animated.View>
                            ))
                        ) : (
                            <EmptyState
                                icon={MessageCircle}
                                title={i18n.t('social.no_activity_title')}
                                subtitle={i18n.t('social.no_activity_desc')}
                            />
                        )}
                    </View>
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    },
    headerTitle: { fontSize: 24, fontWeight: '800' },
    addBtn: { padding: 8, borderRadius: 12 },

    statsRow: { flexDirection: 'row', padding: 20, gap: 16 },
    statCard: {
        flex: 1, borderRadius: 16, padding: 16,
        alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4,
        borderWidth: 1,
    },
    statNumber: { fontSize: 20, fontWeight: '800' },
    statLabel: { fontSize: 13 },

    inviteCard: {
        flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 24,
        backgroundColor: '#6C5CE7', padding: 16, borderRadius: 20, gap: 16,
    },
    inviteIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    inviteTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
    inviteDesc: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },

    sectionHeader: { paddingHorizontal: 20, marginBottom: 12, marginTop: 8 },
    sectionTitle: { fontSize: 20, fontWeight: '800' },

    suggestCard: {
        width: 140, borderRadius: 20, padding: 16,
        alignItems: 'center', borderWidth: 1, marginRight: 4, elevation: 2, marginBottom: 10
    },
    avatarPlaceholder: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    suggestName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
    suggestLang: { fontSize: 12, marginBottom: 12 },
    followBtn: { width: '100%', paddingVertical: 8, borderRadius: 12, alignItems: 'center' },
    followText: { color: '#FFF', fontWeight: '700', fontSize: 13 },

    feedContainer: { paddingHorizontal: 20, paddingBottom: 20 },
    feedItem: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        padding: 16, borderRadius: 16, marginBottom: 12,
        borderWidth: 1,
    },
    feedIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    feedUser: { fontSize: 15, fontWeight: '800' },
    feedTime: { fontSize: 13 },
    feedAction: { fontSize: 14, marginTop: 2 },

    // New styles
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
    loadingText: { marginTop: 12, fontSize: 14 },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 20 },
    emptyTitle: { fontSize: 16, fontWeight: '600', marginTop: 12 },
    emptySubtitle: { fontSize: 14, marginTop: 4, textAlign: 'center' },
    followedBtn: { backgroundColor: '#8B9A9B' },
    followedContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
