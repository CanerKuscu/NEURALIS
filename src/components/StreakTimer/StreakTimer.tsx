/**
 * NEURALIS - Streak Timer Component
 * 24-hour countdown with Neural Decay visualization
 */

import React, { useEffect, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Easing,
    ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { StreakState } from '../../types';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS } from '../../theme/colors';

// ═══════════════════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════════════════

interface StreakTimerProps {
    timeRemaining: string;
    timeRemainingMs: number;
    currentStreak: number;
    state: StreakState;
    showMercyButton?: boolean;
    onMercyPress?: () => void;
    style?: ViewStyle;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const StreakTimer: React.FC<StreakTimerProps> = ({
    timeRemaining,
    timeRemainingMs,
    currentStreak,
    state,
    showMercyButton = false,
    onMercyPress,
    style,
}) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;

    // Calculate progress (24 hours = 100%)
    const FULL_DAY_MS = 24 * 60 * 60 * 1000;
    const progress = Math.min(100, (timeRemainingMs / FULL_DAY_MS) * 100);

    // Animations based on state
    useEffect(() => {
        switch (state) {
            case 'healthy':
                // Gentle pulse
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(pulseAnim, {
                            toValue: 1.02,
                            duration: 2000,
                            useNativeDriver: true,
                        }),
                        Animated.timing(pulseAnim, {
                            toValue: 1,
                            duration: 2000,
                            useNativeDriver: true,
                        }),
                    ])
                ).start();
                break;

            case 'warning':
                // Faster pulse with glow
                Animated.parallel([
                    Animated.loop(
                        Animated.sequence([
                            Animated.timing(pulseAnim, {
                                toValue: 1.05,
                                duration: 1000,
                                useNativeDriver: true,
                            }),
                            Animated.timing(pulseAnim, {
                                toValue: 1,
                                duration: 1000,
                                useNativeDriver: true,
                            }),
                        ])
                    ),
                    Animated.loop(
                        Animated.sequence([
                            Animated.timing(glowAnim, {
                                toValue: 1,
                                duration: 1000,
                                useNativeDriver: false,
                            }),
                            Animated.timing(glowAnim, {
                                toValue: 0.5,
                                duration: 1000,
                                useNativeDriver: false,
                            }),
                        ])
                    ),
                ]).start();
                break;

            case 'neural_decay':
            case 'critical':
                // Aggressive pulse + shake
                Animated.parallel([
                    Animated.loop(
                        Animated.sequence([
                            Animated.timing(pulseAnim, {
                                toValue: 1.08,
                                duration: 500,
                                useNativeDriver: true,
                            }),
                            Animated.timing(pulseAnim, {
                                toValue: 0.98,
                                duration: 500,
                                useNativeDriver: true,
                            }),
                        ])
                    ),
                    Animated.loop(
                        Animated.sequence([
                            Animated.timing(shakeAnim, {
                                toValue: 3,
                                duration: 100,
                                useNativeDriver: true,
                            }),
                            Animated.timing(shakeAnim, {
                                toValue: -3,
                                duration: 100,
                                useNativeDriver: true,
                            }),
                            Animated.timing(shakeAnim, {
                                toValue: 0,
                                duration: 100,
                                useNativeDriver: true,
                            }),
                        ])
                    ),
                ]).start();
                break;

            case 'dead':
                pulseAnim.setValue(1);
                glowAnim.setValue(0);
                shakeAnim.setValue(0);
                break;
        }

        return () => {
            pulseAnim.stopAnimation();
            glowAnim.stopAnimation();
            shakeAnim.stopAnimation();
        };
    }, [state]);

    const getStateColors = useMemo(() => {
        switch (state) {
            case 'healthy':
                return {
                    primary: COLORS.neonPurple,
                    secondary: COLORS.purple[800],
                    text: COLORS.neonPurple,
                    glow: COLORS.neonPurple,
                };
            case 'warning':
                return {
                    primary: COLORS.warning,
                    secondary: COLORS.gold[800],
                    text: COLORS.warning,
                    glow: COLORS.warning,
                };
            case 'neural_decay':
                return {
                    primary: COLORS.purple[500],
                    secondary: COLORS.purple[900],
                    text: COLORS.purple[400],
                    glow: COLORS.neonPurple,
                };
            case 'critical':
                return {
                    primary: COLORS.danger,
                    secondary: '#7F1D1D',
                    text: COLORS.danger,
                    glow: COLORS.danger,
                };
            case 'dead':
                return {
                    primary: COLORS.gray[600],
                    secondary: COLORS.gray[900],
                    text: COLORS.gray[500],
                    glow: 'transparent',
                };
        }
    }, [state]);

    const [hours, minutes, seconds] = timeRemaining.split(':');

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [
                        { scale: pulseAnim },
                        { translateX: shakeAnim },
                    ],
                },
                style,
            ]}
        >
            {/* Glow effect */}
            <Animated.View
                style={[
                    styles.glowContainer,
                    {
                        backgroundColor: getStateColors.glow,
                        opacity: glowAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 0.2],
                        }),
                    },
                ]}
            />

            <LinearGradient
                colors={[getStateColors.secondary, COLORS.pureBlack]}
                style={styles.gradient}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.streakLabel}>CURRENT STREAK</Text>
                    <View style={styles.streakBadge}>
                        <Text style={[styles.streakNumber, { color: getStateColors.primary }]}>
                            {currentStreak}
                        </Text>
                        <Text style={styles.streakDays}>DAYS</Text>
                    </View>
                </View>

                {/* Timer */}
                <View style={styles.timerContainer}>
                    <View style={styles.timeBlock}>
                        <Text style={[styles.timeValue, { color: getStateColors.text }]}>
                            {hours}
                        </Text>
                        <Text style={styles.timeLabel}>HRS</Text>
                    </View>

                    <Text style={[styles.timeSeparator, { color: getStateColors.text }]}>
                        :
                    </Text>

                    <View style={styles.timeBlock}>
                        <Text style={[styles.timeValue, { color: getStateColors.text }]}>
                            {minutes}
                        </Text>
                        <Text style={styles.timeLabel}>MIN</Text>
                    </View>

                    <Text style={[styles.timeSeparator, { color: getStateColors.text }]}>
                        :
                    </Text>

                    <View style={styles.timeBlock}>
                        <Text style={[styles.timeValue, { color: getStateColors.text }]}>
                            {seconds}
                        </Text>
                        <Text style={styles.timeLabel}>SEC</Text>
                    </View>
                </View>

                {/* Progress bar */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressBackground}>
                        <LinearGradient
                            colors={[getStateColors.primary, getStateColors.secondary]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.progressFill, { width: `${progress}%` }]}
                        />
                    </View>
                </View>

                {/* State indicator */}
                <View style={styles.stateIndicator}>
                    <View
                        style={[
                            styles.stateDot,
                            { backgroundColor: getStateColors.primary },
                        ]}
                    />
                    <Text style={[styles.stateText, { color: getStateColors.text }]}>
                        {getStateLabel(state)}
                    </Text>
                </View>

                {/* Mercy button for critical state */}
                {showMercyButton && state === 'critical' && onMercyPress && (
                    <Animated.View
                        style={[
                            styles.mercyButton,
                            {
                                transform: [{ scale: pulseAnim }],
                            },
                        ]}
                    >
                        <LinearGradient
                            colors={[COLORS.royalGold, COLORS.gold[700]]}
                            style={styles.mercyGradient}
                        >
                            <Text style={styles.mercyText}>⚡ FINAL MERCY</Text>
                        </LinearGradient>
                    </Animated.View>
                )}
            </LinearGradient>
        </Animated.View>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const getStateLabel = (state: StreakState): string => {
    switch (state) {
        case 'healthy':
            return 'NEURAL PATHWAYS OPTIMAL';
        case 'warning':
            return 'ATTENTION REQUIRED';
        case 'neural_decay':
            return '⚠️ NEURAL DECAY INITIATED';
        case 'critical':
            return '🚨 CRITICAL - MERCY AVAILABLE';
        case 'dead':
            return '💀 STREAK TERMINATED';
    }
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
    glowContainer: {
        position: 'absolute',
        top: -50,
        left: -50,
        right: -50,
        bottom: -50,
        borderRadius: 100,
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
    streakLabel: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.gray[500],
        letterSpacing: TYPOGRAPHY.letterSpacing.wider,
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: SPACING.xs,
    },
    streakNumber: {
        fontSize: TYPOGRAPHY.fontSize.xxxl,
        fontWeight: '700',
    },
    streakDays: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.gray[500],
        letterSpacing: TYPOGRAPHY.letterSpacing.wider,
    },
    timerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    timeBlock: {
        alignItems: 'center',
        minWidth: 70,
    },
    timeValue: {
        fontSize: TYPOGRAPHY.fontSize.display,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },
    timeLabel: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.gray[600],
        letterSpacing: TYPOGRAPHY.letterSpacing.wider,
        marginTop: SPACING.xs,
    },
    timeSeparator: {
        fontSize: TYPOGRAPHY.fontSize.display,
        fontWeight: '300',
        marginHorizontal: SPACING.xs,
    },
    progressContainer: {
        marginBottom: SPACING.md,
    },
    progressBackground: {
        height: 6,
        backgroundColor: COLORS.gray[800],
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    stateIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
    },
    stateDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    stateText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: '600',
        letterSpacing: TYPOGRAPHY.letterSpacing.wide,
    },
    mercyButton: {
        marginTop: SPACING.lg,
        borderRadius: BORDER_RADIUS.lg,
        overflow: 'hidden',
    },
    mercyGradient: {
        paddingVertical: SPACING.md,
        alignItems: 'center',
    },
    mercyText: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: '700',
        color: COLORS.pureBlack,
        letterSpacing: TYPOGRAPHY.letterSpacing.wide,
    },
});

export default StreakTimer;
