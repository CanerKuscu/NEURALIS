/**
 * StreakBadge - Daily Streak Display Component
 * Fire animation when on a streak
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Flame } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../constants/theme';

interface StreakBadgeProps {
    currentStreak: number;
    isActive?: boolean; // Did user complete today's lesson?
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({
    currentStreak,
    isActive = false,
}) => {
    const flameAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        if (currentStreak > 0 && isActive) {
            // Flame wiggle animation
            const wiggle = Animated.loop(
                Animated.sequence([
                    Animated.timing(flameAnim, {
                        toValue: 1.1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(flameAnim, {
                        toValue: 0.95,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(flameAnim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ])
            );

            // Glow pulse
            const glow = Animated.loop(
                Animated.sequence([
                    Animated.timing(glowAnim, {
                        toValue: 0.6,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(glowAnim, {
                        toValue: 0.3,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            );

            wiggle.start();
            glow.start();

            return () => {
                wiggle.stop();
                glow.stop();
            };
        }
    }, [currentStreak, isActive]);

    const flameColor = currentStreak > 0 ? COLORS.warning : COLORS.text.muted;

    return (
        <View style={styles.container}>
            {/* Glow effect */}
            {currentStreak > 0 && isActive && (
                <Animated.View
                    style={[
                        styles.glow,
                        { opacity: glowAnim }
                    ]}
                />
            )}

            <View style={styles.badge}>
                <Animated.View>
                    <Animated.View style={{ transform: [{ scale: flameAnim }] }}>
                        <Flame
                            size={22}
                            color={flameColor}
                            fill={currentStreak > 0 ? flameColor : 'transparent'}
                        />
                    </Animated.View>
                </Animated.View>
                <Text style={[
                    styles.streakCount,
                    currentStreak === 0 && styles.streakCountInactive,
                ]}>
                    {currentStreak}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    glow: {
        position: 'absolute',
        top: -4,
        left: -4,
        right: -4,
        bottom: -4,
        backgroundColor: COLORS.warning,
        borderRadius: RADIUS.pill,
        opacity: 0.3,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background.tertiary,
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: RADIUS.pill,
    },
    streakCount: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.warning,
        marginLeft: SPACING.xs,
    },
    streakCountInactive: {
        color: COLORS.text.muted,
    },
});

export default React.memo(StreakBadge);
