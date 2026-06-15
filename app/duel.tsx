/**
 * NEURALIS - Duel Screen
 * Real-time 1v1 matchmaking and competitive quiz gameplay.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useTheme } from '../src/context/ThemeContext';
import { useRouter } from 'expo-router';
import { ArrowLeft, Swords, Search, User, Zap, Trophy, Shield, Flame, AlertTriangle } from 'lucide-react-native';
import { supabase } from '../src/config/supabase';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    ZoomIn,
    FadeInDown,
    FadeIn
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AvatarV2View from '../src/components/avatar/AvatarV2View';
import { DuelService } from '../src/services/DuelService';
import i18n from '../src/i18n';

const { width } = Dimensions.get('window');

type DuelState = 'lobby' | 'searching' | 'matched';

export default function DuelScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [state, setState] = useState<DuelState>('lobby');
    const [opponent, setOpponent] = useState<any>(null);
    const channelRef = React.useRef<any>(null);

    // Cleanup channel subscription on unmount
    useEffect(() => {
        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, []);

    // Animations
    const pulseScale = useSharedValue(1);
    const rotation = useSharedValue(0);

    const startSearch = async () => {
        setState('searching');
        // Pulse animation
        pulseScale.value = withRepeat(
            withSequence(
                withTiming(1.2, { duration: 1000 }),
                withTiming(1, { duration: 1000 })
            ),
            -1,
            true
        );

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { game, role } = await DuelService.findMatch(user.id);
            console.log('Joined game:', game.id, role);

            // Subscribe to updates (store ref for cleanup)
            const channel = DuelService.subscribeToGame(game.id, (updatedGame: any) => {
                channelRef.current = channel;
                if (updatedGame.status === 'active' && updatedGame.player2_id) {
                    // Fetch opponent info
                    const opponentId = role === 'player1' ? updatedGame.player2_id : updatedGame.player1_id;
                    fetchOpponent(opponentId).then(opp => {
                        setOpponent(opp);
                        setState('matched');
                        pulseScale.value = 1;
                    });
                }
            });

            // If we joined as player2 (game active immediately) or we waiting
            if (game.status === 'active') {
                const opponentId = role === 'player1' ? game.player2_id : game.player1_id;
                const opp = await fetchOpponent(opponentId);
                setOpponent(opp);
                setState('matched');
                pulseScale.value = 1;
            }

            // Store channel for cleanup
            channelRef.current = channel;

        } catch (e) {
            console.error('Error finding match:', e);
            setState('lobby');
        }
    };

    const fetchOpponent = async (id: string) => {
        const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
        return {
            name: data?.display_name || 'Opponent',
            level: Math.floor((data?.total_xp || 0) / 100) + 1,
            avatar: data?.avatar_url || "https://cdn-icons-png.flaticon.com/512/616/616430.png"
        };
    };

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }]
    }));

    return (
        <View style={[styles.container, { backgroundColor: theme.background.primary }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={theme.text.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Arena</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                {state === 'lobby' && (
                    <Animated.View entering={FadeInDown} style={styles.lobbyContainer}>
                        <View style={styles.heroIcon}>
                            <Swords size={80} color={theme.primary} />
                        </View>
                        <Text style={[styles.title, { color: theme.text.primary }]}>Nöral Düello</Text>
                        <Text style={[styles.subtitle, { color: theme.text.secondary }]}>
                            {i18n.t('duel_screen.compete_desc')}
                        </Text>

                        {/* Stakes Info */}
                        <View style={[styles.stakesContainer, { backgroundColor: theme.background.secondary }]}>
                            <View style={styles.stakeRow}>
                                <Trophy size={20} color="#FFD700" />
                                <Text style={[styles.stakeText, { color: theme.text.primary }]}>{i18n.t('duel_screen.winner_reward')}</Text>
                            </View>
                            <View style={styles.stakeRow}>
                                <AlertTriangle size={20} color="#FF4B4B" />
                                <Text style={[styles.stakeText, { color: theme.text.primary }]}>Kaybeden: -15 XP Ceza</Text>
                            </View>
                            <View style={styles.stakeRow}>
                                <Flame size={20} color="#FF6B35" />
                                <Text style={[styles.stakeText, { color: theme.text.primary }]}>Kaybeden: Seri kaybedebilir</Text>
                            </View>
                        </View>

                        <TouchableOpacity style={[styles.btn, { backgroundColor: theme.primary }]} onPress={startSearch}>
                            <Text style={styles.btnText}>RAKİP BUL</Text>
                            <Search size={20} color="#FFF" />
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {state === 'searching' && (
                    <Animated.View entering={FadeIn} style={styles.searchingContainer}>
                        <Animated.View style={[styles.pulseCircle, pulseStyle, { borderColor: theme.primary }]}>
                            <Search size={48} color={theme.primary} />
                        </Animated.View>
                        <Text style={[styles.searchingText, { color: theme.text.primary }]}>Rakip aranıyor...</Text>
                    </Animated.View>
                )}

                {state === 'matched' && opponent && (
                    <Animated.View entering={ZoomIn} style={styles.matchContainer}>
                        <Text style={[styles.matchTitle, { color: theme.primary }]}>RAKİP BULUNDU!</Text>

                        <View style={styles.vsContainer}>
                            <View style={styles.playerWrapper}>
                                <AvatarV2View
                                    // Default or User's avatar
                                    size={100}
                                    showBg={true}
                                />
                                <Text style={[styles.playerName, { color: theme.text.primary }]}>Sen</Text>
                            </View>

                            <View style={styles.vsBadge}>
                                <Text style={styles.vsText}>VS</Text>
                            </View>

                            <View style={styles.playerWrapper}>
                                <Image source={{ uri: opponent.avatar }} style={[styles.opponentAvatar, { backgroundColor: theme.background.tertiary }]} />
                                <Text style={[styles.playerName, { color: theme.text.primary }]}>{opponent.name}</Text>
                                <Text style={[styles.playerLevel, { color: theme.text.secondary }]}>Lvl {opponent.level}</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.btn, { backgroundColor: theme.primary, marginTop: 40 }]}
                            onPress={() => router.push({ pathname: '/lesson', params: { subject: 'Duel' } })}
                        >
                            <Text style={styles.btnText}>{i18n.t('duel_screen.start_battle')}</Text>
                            <Swords size={20} color="#FFF" />
                        </TouchableOpacity>
                    </Animated.View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    backBtn: { padding: 4 },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    lobbyContainer: {
        alignItems: 'center',
        gap: 16,
    },
    heroIcon: {
        marginBottom: 20,
        transform: [{ rotate: '-10deg' }]
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 24,
    },
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    btnText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 1,
    },
    searchingContainer: {
        alignItems: 'center',
        gap: 24,
    },
    pulseCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchingText: {
        fontSize: 18,
        fontWeight: '600',
    },
    matchContainer: {
        width: '100%',
        alignItems: 'center',
    },
    matchTitle: {
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 40,
        letterSpacing: 2,
    },
    vsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    playerWrapper: {
        alignItems: 'center',
        gap: 8,
    },
    playerName: {
        fontSize: 18,
        fontWeight: '700',
    },
    playerLevel: {
        fontSize: 14,
    },
    opponentAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    vsBadge: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FF4B4B',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: '#FFF',
        marginTop: -30,
    },
    vsText: {
        color: '#FFF',
        fontWeight: '900',
        fontSize: 16,
    },
    stakesContainer: {
        width: '100%',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        gap: 10,
    },
    stakeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    stakeText: {
        fontSize: 15,
        fontWeight: '600',
    },
});
