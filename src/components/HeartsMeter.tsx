/**
 * HeartsMeter - Lives/Hearts Display Component
 * Duolingo-style hearts indicator
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Heart } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, LIVES_CONFIG } from '../constants/theme';

interface HeartsMeterProps {
    currentLives: number;
    maxLives?: number;
    isPremium?: boolean;
    nextRegenTime?: number; // minutes until next heart
    onPress?: () => void;
}

export const HeartsMeter: React.FC<HeartsMeterProps> = ({
    currentLives,
    maxLives = LIVES_CONFIG.maxLives,
    isPremium = false,
    nextRegenTime,
    onPress,
}) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Pulse animation when low on hearts
    useEffect(() => {
        if (currentLives <= 1 && !isPremium) {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.15,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ])
            );
            pulse.start();
            return () => pulse.stop();
        }
    }, [currentLives, isPremium]);

    if (isPremium) {
        return (
            <TouchableOpacity style={styles.container} onPress={onPress}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Unlimited hearts, premium active"
            >
                <View style={styles.premiumBadge}>
                    <Heart size={20} color={COLORS.primary} fill={COLORS.primary} />
                    <Text style={styles.infinitySymbol}>∞</Text>
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity style={styles.container} onPress={onPress}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`${currentLives} of ${maxLives} hearts remaining`}
            accessibilityHint="View heart details"
        >
            <Animated.View>
                <Animated.View style={[styles.heartsContainer, { transform: [{ scale: pulseAnim }] }]}>
                    <Heart
                        size={22}
                        color={currentLives > 0 ? COLORS.primary : COLORS.error}
                        fill={currentLives > 0 ? COLORS.primary : 'transparent'}
                    />
                    <Text style={[
                        styles.heartCount,
                        currentLives === 0 && styles.heartCountEmpty,
                    ]}>
                        {currentLives}
                    </Text>
                </Animated.View>
            </Animated.View>

            {nextRegenTime && currentLives < maxLives && (
                <Text style={styles.regenTime}>{nextRegenTime}dk</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    heartsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background.tertiary,
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: RADIUS.pill,
    },
    heartCount: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.primary,
        marginLeft: SPACING.xs,
    },
    heartCountEmpty: {
        color: COLORS.text.muted,
    },
    regenTime: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.text.secondary,
        marginLeft: SPACING.xs,
    },
    premiumBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background.tertiary,
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: RADIUS.pill,
    },
    infinitySymbol: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.primary,
        marginLeft: SPACING.xs,
    },
});

export default React.memo(HeartsMeter);
