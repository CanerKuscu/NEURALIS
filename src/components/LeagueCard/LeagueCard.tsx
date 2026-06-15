/**
 * NEURALIS - League Card Component
 * Display user's current league and ranking
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LeagueTier, BracketParticipant } from '../../types';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../theme/colors';
import { LEAGUE_CONFIGS } from '../../services/RankingService';

// ═══════════════════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════════════════

interface LeagueCardProps {
    tier: LeagueTier;
    position: number;
    totalParticipants: number;
    rankPoints: number;
    promotionZone: boolean;
    demotionZone: boolean;
    weekEndsAt: number;
    onPress?: () => void;
    style?: ViewStyle;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const LeagueCard: React.FC<LeagueCardProps> = ({
    tier,
    position,
    totalParticipants,
    rankPoints,
    promotionZone,
    demotionZone,
    weekEndsAt,
    onPress,
    style,
}) => {
    const config = LEAGUE_CONFIGS[tier];
    const timeUntilReset = weekEndsAt - Date.now();
    const daysRemaining = Math.max(0, Math.ceil(timeUntilReset / (1000 * 60 * 60 * 24)));

    const getGradientColors = (): [string, string] => {
        switch (tier) {
            case 'bronze':
                return ['#CD7F32', '#8B4513'];
            case 'silver':
                return ['#C0C0C0', '#808080'];
            case 'gold':
                return [COLORS.royalGold, '#B8860B'];
            case 'sapphire':
                return ['#0F52BA', '#082567'];
            case 'ruby':
                return ['#E0115F', '#900C3F'];
            case 'emerald':
                return ['#50C878', '#2E8B57'];
            case 'amethyst':
                return ['#9966CC', '#6A0DAD'];
            case 'pearl':
                return ['#FDEEF4', '#D4A5A5'];
            case 'obsidian':
                return ['#3D3D3D', '#1A1A1A'];
            case 'diamond':
                return ['#B9F2FF', '#87CEEB'];
            default:
                return ['#CD7F32', '#8B4513'];
        }
    };

    const getZoneBadge = () => {
        if (promotionZone) {
            return (
                <View style={[styles.zoneBadge, styles.promotionBadge]}>
                    <Text style={styles.zoneBadgeText}>↑ PROMOTION</Text>
                </View>
            );
        }
        if (demotionZone) {
            return (
                <View style={[styles.zoneBadge, styles.demotionBadge]}>
                    <Text style={styles.zoneBadgeText}>↓ DEMOTION</Text>
                </View>
            );
        }
        return null;
    };

    return (
        <TouchableOpacity
            style={[styles.container, style]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <LinearGradient
                colors={[COLORS.gray[900], COLORS.pureBlack]}
                style={styles.cardGradient}
            >
                {/* League badge */}
                <View style={styles.header}>
                    <LinearGradient
                        colors={getGradientColors()}
                        style={styles.leagueBadge}
                    >
                        <Text style={styles.leagueIcon}>{config.icon}</Text>
                    </LinearGradient>

                    <View style={styles.leagueInfo}>
                        <Text style={[styles.leagueName, { color: config.color }]}>
                            {config.displayName.toUpperCase()}
                        </Text>
                        <Text style={styles.leagueSubtext}>LEAGUE</Text>
                    </View>

                    {getZoneBadge()}
                </View>

                {/* Stats row */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: config.color }]}>
                            #{position}
                        </Text>
                        <Text style={styles.statLabel}>POSITION</Text>
                    </View>

                    <View style={styles.statDivider} />

                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>
                            {Math.round(rankPoints).toLocaleString()}
                        </Text>
                        <Text style={styles.statLabel}>RANK POINTS</Text>
                    </View>

                    <View style={styles.statDivider} />

                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>
                            {totalParticipants}
                        </Text>
                        <Text style={styles.statLabel}>PLAYERS</Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <View style={styles.resetInfo}>
                        <Text style={styles.resetLabel}>WEEKLY RESET IN</Text>
                        <Text style={styles.resetValue}>{daysRemaining} DAYS</Text>
                    </View>

                    <View style={styles.multiplierBadge}>
                        <Text style={styles.multiplierText}>
                            {config.multiplier}x XP
                        </Text>
                    </View>
                </View>

                {/* Progress bar showing position */}
                <View style={styles.positionBar}>
                    <View style={styles.positionBarBackground}>
                        <View
                            style={[
                                styles.positionMarker,
                                {
                                    left: `${totalParticipants > 0 ? ((totalParticipants - position + 1) / totalParticipants) * 100 : 0}%`,
                                    backgroundColor: config.color,
                                },
                            ]}
                        />
                        {/* Promotion zone indicator */}
                        <View
                            style={[
                                styles.zoneIndicator,
                                styles.promotionZone,
                                { width: `${totalParticipants > 0 ? (3 / totalParticipants) * 100 : 0}%` },
                            ]}
                        />
                        {/* Demotion zone indicator */}
                        <View
                            style={[
                                styles.zoneIndicator,
                                styles.demotionZoneIndicator,
                                { width: `${totalParticipants > 0 ? (3 / totalParticipants) * 100 : 0}%` },
                            ]}
                        />
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// MINI LEAGUE BADGE (For compact displays)
// ═══════════════════════════════════════════════════════════════════════════

interface LeagueBadgeProps {
    tier: LeagueTier;
    size?: 'small' | 'medium' | 'large';
    showLabel?: boolean;
}

export const LeagueBadge: React.FC<LeagueBadgeProps> = ({
    tier,
    size = 'medium',
    showLabel = true,
}) => {
    const config = LEAGUE_CONFIGS[tier];

    const sizes = {
        small: { badge: 32, icon: 16 },
        medium: { badge: 44, icon: 22 },
        large: { badge: 60, icon: 30 },
    };

    const getGradientColors = (): [string, string] => {
        switch (tier) {
            case 'bronze':
                return ['#CD7F32', '#8B4513'];
            case 'silver':
                return ['#C0C0C0', '#808080'];
            case 'gold':
                return [COLORS.royalGold, '#B8860B'];
            case 'sapphire':
                return ['#0F52BA', '#082567'];
            case 'ruby':
                return ['#E0115F', '#900C3F'];
            case 'emerald':
                return ['#50C878', '#2E8B57'];
            case 'amethyst':
                return ['#9966CC', '#6A0DAD'];
            case 'pearl':
                return ['#FDEEF4', '#D4A5A5'];
            case 'obsidian':
                return ['#3D3D3D', '#1A1A1A'];
            case 'diamond':
                return ['#B9F2FF', '#87CEEB'];
            default:
                return ['#CD7F32', '#8B4513'];
        }
    };

    return (
        <View style={badgeStyles.container}>
            <LinearGradient
                colors={getGradientColors()}
                style={[
                    badgeStyles.badge,
                    {
                        width: sizes[size].badge,
                        height: sizes[size].badge,
                        borderRadius: sizes[size].badge / 2,
                    },
                ]}
            >
                <Text style={[badgeStyles.icon, { fontSize: sizes[size].icon }]}>
                    {config.icon}
                </Text>
            </LinearGradient>
            {showLabel && (
                <Text style={[badgeStyles.label, { color: config.color }]}>
                    {config.displayName}
                </Text>
            )}
        </View>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
    container: {
        borderRadius: BORDER_RADIUS.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border.subtle,
    },
    cardGradient: {
        padding: SPACING.lg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    leagueBadge: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    leagueIcon: {
        fontSize: 28,
    },
    leagueInfo: {
        marginLeft: SPACING.md,
        flex: 1,
    },
    leagueName: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: '700',
        letterSpacing: TYPOGRAPHY.letterSpacing.wide,
    },
    leagueSubtext: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.gray[500],
        letterSpacing: TYPOGRAPHY.letterSpacing.wider,
    },
    zoneBadge: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.sm,
    },
    promotionBadge: {
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
    },
    demotionBadge: {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
    },
    zoneBadgeText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        fontWeight: '700',
        color: COLORS.gray[200],
        letterSpacing: TYPOGRAPHY.letterSpacing.wider,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.glass.light,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.md,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: TYPOGRAPHY.fontSize.xxl,
        fontWeight: '700',
        color: COLORS.gray[100],
    },
    statLabel: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.gray[500],
        letterSpacing: TYPOGRAPHY.letterSpacing.wider,
        marginTop: SPACING.xs,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: COLORS.border.subtle,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    resetInfo: {},
    resetLabel: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.gray[500],
        letterSpacing: TYPOGRAPHY.letterSpacing.wider,
    },
    resetValue: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: '600',
        color: COLORS.gray[300],
    },
    multiplierBadge: {
        backgroundColor: COLORS.glass.gold,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border.gold,
    },
    multiplierText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: '700',
        color: COLORS.royalGold,
    },
    positionBar: {
        marginTop: SPACING.sm,
    },
    positionBarBackground: {
        height: 8,
        backgroundColor: COLORS.gray[800],
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
    },
    positionMarker: {
        position: 'absolute',
        top: -2,
        width: 12,
        height: 12,
        borderRadius: 6,
        marginLeft: -6,
        borderWidth: 2,
        borderColor: COLORS.pureBlack,
    },
    zoneIndicator: {
        position: 'absolute',
        top: 0,
        height: '100%',
        opacity: 0.3,
    },
    promotionZone: {
        right: 0,
        backgroundColor: COLORS.success,
    },
    demotionZoneIndicator: {
        left: 0,
        backgroundColor: COLORS.danger,
    },
});

const badgeStyles = StyleSheet.create({
    container: {
        alignItems: 'center',
    },
    badge: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {},
    label: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        fontWeight: '600',
        marginTop: SPACING.xs,
    },
});

export default LeagueCard;
