/**
 * NEURALIS - Synapse Link Component
 * Display connected partner and shared fate status
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ViewStyle,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SynapseLink, SynapseLinkStatus } from '../../types';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../theme/colors';

// ═══════════════════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════════════════

interface SynapseLinkCardProps {
    link: SynapseLink;
    currentUserId: string;
    onPress?: () => void;
    onDissolve?: () => void;
    style?: ViewStyle;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const SynapseLinkCard: React.FC<SynapseLinkCardProps> = ({
    link,
    currentUserId,
    onPress,
    onDissolve,
    style,
}) => {
    const isUserA = link.userAId === currentUserId;
    const partner = {
        name: (isUserA ? link.userBDisplayName : link.userADisplayName) ?? 'Partner',
        streak: (isUserA ? link.userBStreak : link.userAStreak) ?? 0,
        lastActivity: (isUserA ? link.userBLastActivity : link.userALastActivity) ?? Date.now(),
    };

    const myStreak = isUserA ? link.userAStreak : link.userBStreak;

    const getStatusColor = () => {
        switch (link.status) {
            case 'active':
                return COLORS.neonPurple;
            case 'pending':
                return COLORS.warning;
            case 'broken':
                return COLORS.danger;
            case 'dissolved':
                return COLORS.gray[600];
        }
    };

    const getStatusText = () => {
        switch (link.status) {
            case 'active':
                return 'SYNAPSE ACTIVE';
            case 'pending':
                return 'PENDING';
            case 'broken':
                return 'LINK BROKEN';
            case 'dissolved':
                return 'DISSOLVED';
        }
    };

    const timeSinceActivity = Date.now() - partner.lastActivity;
    const hoursAgo = Math.floor(timeSinceActivity / (1000 * 60 * 60));
    const isPartnerActive = hoursAgo < 24;

    return (
        <TouchableOpacity
            style={[styles.container, style]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <LinearGradient
                colors={[
                    link.status === 'active' ? COLORS.glass.purple : COLORS.gray[900],
                    COLORS.pureBlack,
                ]}
                style={styles.gradient}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
                        <Text style={[styles.statusText, { color: getStatusColor() }]}>
                            {getStatusText()}
                        </Text>
                    </View>

                    {link.status === 'active' && (
                        <View style={styles.sharedStreakBadge}>
                            <Text style={styles.sharedStreakLabel}>SHARED STREAK</Text>
                            <Text style={styles.sharedStreakValue}>{link.sharedStreak}</Text>
                        </View>
                    )}
                </View>

                {/* Connection visualization */}
                <View style={styles.connectionContainer}>
                    {/* Your side */}
                    <View style={styles.userCard}>
                        <View style={styles.avatarContainer}>
                            <LinearGradient
                                colors={[COLORS.neonPurple, COLORS.purple[800]]}
                                style={styles.avatarGradient}
                            >
                                <Text style={styles.avatarText}>YOU</Text>
                            </LinearGradient>
                        </View>
                        <Text style={styles.userName}>You</Text>
                        <View style={styles.userStreakBadge}>
                            <Text style={styles.userStreakValue}>{myStreak}</Text>
                            <Text style={styles.userStreakLabel}>days</Text>
                        </View>
                    </View>

                    {/* Connection line */}
                    <View style={styles.connectionLine}>
                        <View
                            style={[
                                styles.linePulse,
                                { backgroundColor: getStatusColor() },
                            ]}
                        />
                        <View style={styles.lineContainer}>
                            <View
                                style={[
                                    styles.line,
                                    { backgroundColor: getStatusColor() },
                                ]}
                            />
                        </View>
                        <Text style={styles.linkIcon}>
                            {link.status === 'active' ? '🔗' : link.status === 'broken' ? '💔' : '⏳'}
                        </Text>
                    </View>

                    {/* Partner side */}
                    <View style={styles.userCard}>
                        <View style={styles.avatarContainer}>
                            <LinearGradient
                                colors={
                                    isPartnerActive
                                        ? [COLORS.success, '#16A34A']
                                        : [COLORS.gray[600], COLORS.gray[800]]
                                }
                                style={styles.avatarGradient}
                            >
                                <Text style={styles.avatarText}>
                                    {partner.name.charAt(0).toUpperCase()}
                                </Text>
                            </LinearGradient>
                            {isPartnerActive && (
                                <View style={styles.activeIndicator} />
                            )}
                        </View>
                        <Text style={styles.userName} numberOfLines={1}>
                            {partner.name}
                        </Text>
                        <View style={styles.userStreakBadge}>
                            <Text style={styles.userStreakValue}>{partner.streak}</Text>
                            <Text style={styles.userStreakLabel}>days</Text>
                        </View>
                    </View>
                </View>

                {/* Warning message */}
                {link.status === 'active' && (
                    <View style={styles.warningContainer}>
                        <Text style={styles.warningIcon}>⚠️</Text>
                        <Text style={styles.warningText}>
                            SHARED FATE: If either misses their deadline, both streaks break
                        </Text>
                    </View>
                )}

                {/* Broken link info */}
                {link.status === 'broken' && link.brokenBy && (
                    <View style={styles.brokenInfoContainer}>
                        <Text style={styles.brokenInfoText}>
                            Broken by: {link.brokenBy === currentUserId ? 'You' : partner.name}
                        </Text>
                        <Text style={styles.brokenReasonText}>
                            Reason: {link.breakReason?.replace('_', ' ').toUpperCase()}
                        </Text>
                    </View>
                )}

                {/* Actions */}
                {link.status === 'active' && onDissolve && (
                    <TouchableOpacity
                        style={styles.dissolveButton}
                        onPress={onDissolve}
                    >
                        <Text style={styles.dissolveButtonText}>Dissolve Link</Text>
                    </TouchableOpacity>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// NO LINK PLACEHOLDER
// ═══════════════════════════════════════════════════════════════════════════

interface NoSynapseLinkProps {
    onCreateLink?: () => void;
    style?: ViewStyle;
}

export const NoSynapseLink: React.FC<NoSynapseLinkProps> = ({
    onCreateLink,
    style,
}) => {
    return (
        <TouchableOpacity
            style={[styles.noLinkContainer, style]}
            onPress={onCreateLink}
            activeOpacity={0.8}
        >
            <LinearGradient
                colors={[COLORS.gray[900], COLORS.pureBlack]}
                style={styles.noLinkGradient}
            >
                <View style={styles.noLinkIcon}>
                    <Text style={styles.noLinkIconText}>🔗</Text>
                </View>
                <Text style={styles.noLinkTitle}>CREATE SYNAPSE LINK</Text>
                <Text style={styles.noLinkDescription}>
                    Connect with a friend for shared accountability.{'\n'}
                    Your fates become intertwined.
                </Text>
                <View style={styles.noLinkButton}>
                    <LinearGradient
                        colors={[COLORS.neonPurple, COLORS.purple[700]]}
                        style={styles.noLinkButtonGradient}
                    >
                        <Text style={styles.noLinkButtonText}>+ Link a Friend</Text>
                    </LinearGradient>
                </View>
            </LinearGradient>
        </TouchableOpacity>
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
        borderColor: COLORS.border.purple,
    },
    gradient: {
        padding: SPACING.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    statusText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: '700',
        letterSpacing: TYPOGRAPHY.letterSpacing.wider,
    },
    sharedStreakBadge: {
        backgroundColor: COLORS.glass.purple,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'center',
    },
    sharedStreakLabel: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.gray[400],
        letterSpacing: TYPOGRAPHY.letterSpacing.wider,
    },
    sharedStreakValue: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: '700',
        color: COLORS.neonPurple,
    },
    connectionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.lg,
    },
    userCard: {
        alignItems: 'center',
        flex: 1,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: SPACING.sm,
    },
    avatarGradient: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: '700',
        color: COLORS.gray[100],
    },
    activeIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: COLORS.success,
        borderWidth: 2,
        borderColor: COLORS.pureBlack,
    },
    userName: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: '600',
        color: COLORS.gray[200],
        marginBottom: SPACING.xs,
    },
    userStreakBadge: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    userStreakValue: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: '700',
        color: COLORS.royalGold,
    },
    userStreakLabel: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.gray[500],
    },
    connectionLine: {
        alignItems: 'center',
        flex: 1,
        paddingHorizontal: SPACING.md,
    },
    linePulse: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginBottom: SPACING.xs,
    },
    lineContainer: {
        width: '100%',
        height: 2,
        backgroundColor: COLORS.gray[800],
        marginBottom: SPACING.xs,
    },
    line: {
        height: '100%',
        width: '100%',
    },
    linkIcon: {
        fontSize: 20,
    },
    warningContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        gap: SPACING.sm,
    },
    warningIcon: {
        fontSize: 16,
    },
    warningText: {
        flex: 1,
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.warning,
        fontWeight: '500',
    },
    brokenInfoContainer: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
    },
    brokenInfoText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.danger,
        fontWeight: '600',
    },
    brokenReasonText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.gray[400],
        marginTop: SPACING.xs,
    },
    dissolveButton: {
        marginTop: SPACING.md,
        alignItems: 'center',
    },
    dissolveButtonText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.gray[500],
        textDecorationLine: 'underline',
    },

    // No link styles
    noLinkContainer: {
        borderRadius: BORDER_RADIUS.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border.subtle,
        borderStyle: 'dashed',
    },
    noLinkGradient: {
        padding: SPACING.xl,
        alignItems: 'center',
    },
    noLinkIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: COLORS.glass.purple,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.md,
    },
    noLinkIconText: {
        fontSize: 28,
    },
    noLinkTitle: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: '700',
        color: COLORS.gray[200],
        letterSpacing: TYPOGRAPHY.letterSpacing.wide,
        marginBottom: SPACING.sm,
    },
    noLinkDescription: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.gray[500],
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: SPACING.lg,
    },
    noLinkButton: {
        borderRadius: BORDER_RADIUS.lg,
        overflow: 'hidden',
    },
    noLinkButtonGradient: {
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xl,
    },
    noLinkButtonText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: '700',
        color: COLORS.gray[100],
    },
});

export default SynapseLinkCard;
