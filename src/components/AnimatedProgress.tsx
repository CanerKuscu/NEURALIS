/**
 * AnimatedProgress - Animated Progress Bar
 * Progress bar with micro-animations
 */

import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../constants/theme';

interface AnimatedProgressProps {
    progress: number; // 0-100
    height?: number;
    showLabel?: boolean;
    label?: string;
    variant?: 'primary' | 'xp' | 'streak' | 'hearts';
    animated?: boolean;
}

export function AnimatedProgress({
    progress,
    height = 12,
    showLabel = false,
    label,
    variant = 'primary',
    animated = true,
}: AnimatedProgressProps) {
    const progressAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    const clampedProgress = Math.min(Math.max(progress, 0), 100);

    useEffect(() => {
        if (animated) {
            Animated.spring(progressAnim, {
                toValue: clampedProgress,
                friction: 8,
                tension: 40,
                useNativeDriver: false,
            }).start();

            // Pulse animation when progress is near completion
            if (clampedProgress >= 90) {
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(pulseAnim, {
                            toValue: 1.02,
                            duration: 500,
                            easing: Easing.inOut(Easing.ease),
                            useNativeDriver: true,
                        }),
                        Animated.timing(pulseAnim, {
                            toValue: 1,
                            duration: 500,
                            easing: Easing.inOut(Easing.ease),
                            useNativeDriver: true,
                        }),
                    ])
                ).start();
            }
        } else {
            progressAnim.setValue(clampedProgress);
        }
    }, [clampedProgress, animated]);

    const getGradientColors = (): [string, string] => {
        switch (variant) {
            case 'xp':
                return [COLORS.xp.gold, COLORS.xp.goldGlow];
            case 'streak':
                return [COLORS.streak.fire, COLORS.streak.fireGlow];
            case 'hearts':
                return [COLORS.hearts.full, '#FF6B6B'];
            default:
                return [COLORS.primary, COLORS.secondary];
        }
    };

    const getBackgroundColor = () => {
        return `${COLORS.background.primary}80`;
    };

    const animatedWidth = progressAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
        extrapolate: 'clamp',
    });

    return (
        <View style={styles.container}>
            {showLabel && (
                <View style={styles.labelContainer}>
                    <Text style={styles.label}>{label}</Text>
                    <Text style={styles.percentage}>{Math.round(clampedProgress)}%</Text>
                </View>
            )}
            <Animated.View
                style={[
                    styles.track,
                    {
                        height,
                        backgroundColor: getBackgroundColor(),
                        transform: [{ scale: pulseAnim }],
                    }
                ]}
            >
                <Animated.View style={[styles.progressContainer, { width: animatedWidth }]}>
                    <LinearGradient
                        colors={getGradientColors()}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.progress, { height }]}
                    >
                        {clampedProgress > 5 && (
                            <View style={styles.shine} />
                        )}
                    </LinearGradient>
                </Animated.View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    labelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.xs,
    },
    label: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.text.secondary,
    },
    percentage: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.text.primary,
    },
    track: {
        borderRadius: RADIUS.pill,
        overflow: 'hidden',
    },
    progressContainer: {
        height: '100%',
        overflow: 'hidden',
    },
    progress: {
        borderRadius: RADIUS.pill,
        flexDirection: 'row',
        alignItems: 'center',
    },
    shine: {
        position: 'absolute',
        top: 2,
        left: 8,
        right: 8,
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: RADIUS.pill,
    },
});

export default React.memo(AnimatedProgress);
