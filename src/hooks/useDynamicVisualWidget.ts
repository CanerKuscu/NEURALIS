/**
 * NEURALIS - Dynamic Visual Widget Hook
 * The Eye: Visual evolution based on streak state
 * 
 * UI Evolution:
 * - Safe: Deep Purple background
 * - Urgent: Transitioning to Dark Red
 * - Decay: Pulsing Blood Red
 * 
 * Mascot Fade: Shadow Fox opacity decreases as countdown approaches zero
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { tickService } from '../services/TickService';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export type VisualState = 'safe' | 'urgent' | 'decay' | 'critical' | 'dead';

export interface VisualTheme {
    backgroundColor: string;
    secondaryColor: string;
    accentColor: string;
    textColor: string;
    mascotOpacity: number;
    pulseIntensity: number;
    glowColor: string;
    borderColor: string;
}

export interface WidgetAnimations {
    pulseAnim: Animated.Value;
    fadeAnim: Animated.Value;
    colorAnim: Animated.Value;
    shakeAnim: Animated.Value;
    glowAnim: Animated.Value;
}

export interface DynamicVisualWidgetState {
    theme: VisualTheme;
    visualState: VisualState;
    animations: WidgetAnimations;
    hoursRemaining: number;
    percentageRemaining: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// VISUAL THEMES
// ═══════════════════════════════════════════════════════════════════════════

const VISUAL_THEMES: Record<VisualState, VisualTheme> = {
    safe: {
        backgroundColor: '#1A0A2E',      // Deep Purple
        secondaryColor: '#2D1B4E',       // Lighter Purple
        accentColor: '#8B5CF6',          // Vibrant Purple
        textColor: '#E0D4F7',            // Light Purple
        mascotOpacity: 1.0,
        pulseIntensity: 0,
        glowColor: '#8B5CF6',
        borderColor: '#6B21A8',
    },
    urgent: {
        backgroundColor: '#2D1B4E',      // Transitioning Purple
        secondaryColor: '#4A1D5C',       // Purple-Red
        accentColor: '#DC2626',          // Red accent
        textColor: '#FCA5A5',            // Light Red
        mascotOpacity: 0.8,
        pulseIntensity: 0.3,
        glowColor: '#EF4444',
        borderColor: '#991B1B',
    },
    decay: {
        backgroundColor: '#4A1D1D',      // Dark Red
        secondaryColor: '#7F1D1D',       // Deep Red
        accentColor: '#DC2626',          // Bright Red
        textColor: '#FECACA',            // Pale Red
        mascotOpacity: 0.6,
        pulseIntensity: 0.6,
        glowColor: '#EF4444',
        borderColor: '#B91C1C',
    },
    critical: {
        backgroundColor: '#7F1D1D',      // Blood Red
        secondaryColor: '#991B1B',       // Deep Blood Red
        accentColor: '#EF4444',          // Bright Red
        textColor: '#FEE2E2',            // Light Red
        mascotOpacity: 0.4,
        pulseIntensity: 0.9,
        glowColor: '#F87171',
        borderColor: '#DC2626',
    },
    dead: {
        backgroundColor: '#0A0A0A',      // Pure Black
        secondaryColor: '#1A1A1A',       // Dark Gray
        accentColor: '#6B21A8',          // Muted Purple (death color)
        textColor: '#9333EA',            // Purple text
        mascotOpacity: 0.1,
        pulseIntensity: 0,
        glowColor: '#581C87',
        borderColor: '#3B0764',
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// HOOK IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════

export function useDynamicVisualWidget(
    deadlineAt: number,
    totalDuration: number = 24 * 60 * 60 * 1000, // 24 hours default
    isStreakDead: boolean = false
): DynamicVisualWidgetState & {
    startAnimations: () => void;
    stopAnimations: () => void;
    interpolateColor: (fromColor: string, toColor: string, progress: number) => string;
} {
    // Animation values
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const colorAnim = useRef(new Animated.Value(0)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    // State
    const [visualState, setVisualState] = useState<VisualState>('safe');
    const [theme, setTheme] = useState<VisualTheme>(VISUAL_THEMES.safe);
    const [hoursRemaining, setHoursRemaining] = useState<number>(24);
    const [percentageRemaining, setPercentageRemaining] = useState<number>(100);

    const animationRef = useRef<Animated.CompositeAnimation | null>(null);

    // ─────────────────────────────────────────────────────────────────────────
    // DETERMINE VISUAL STATE
    // ─────────────────────────────────────────────────────────────────────────

    const determineVisualState = useCallback((hours: number, isDead: boolean): VisualState => {
        if (isDead) return 'dead';
        if (hours > 12) return 'safe';
        if (hours > 2) return 'urgent';
        if (hours > 0.5) return 'decay';
        if (hours > 0) return 'critical';
        return 'dead';
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // COLOR INTERPOLATION
    // ─────────────────────────────────────────────────────────────────────────

    const interpolateColor = useCallback((fromColor: string, toColor: string, progress: number): string => {
        const from = hexToRgb(fromColor);
        const to = hexToRgb(toColor);

        if (!from || !to) return fromColor;

        const r = Math.round(from.r + (to.r - from.r) * progress);
        const g = Math.round(from.g + (to.g - from.g) * progress);
        const b = Math.round(from.b + (to.b - from.b) * progress);

        return `rgb(${r}, ${g}, ${b})`;
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // ANIMATIONS
    // ─────────────────────────────────────────────────────────────────────────

    const startPulseAnimation = useCallback((intensity: number) => {
        if (intensity <= 0) return;

        const pulseDuration = Math.max(300, 1000 - intensity * 500);

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1 + intensity * 0.15,
                    duration: pulseDuration,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: pulseDuration,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [pulseAnim]);

    const startGlowAnimation = useCallback((intensity: number) => {
        if (intensity <= 0) return;

        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: intensity,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                }),
                Animated.timing(glowAnim, {
                    toValue: intensity * 0.3,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                }),
            ])
        ).start();
    }, [glowAnim]);

    const startShakeAnimation = useCallback((intensity: number) => {
        if (intensity < 0.8) return;

        Animated.loop(
            Animated.sequence([
                Animated.timing(shakeAnim, {
                    toValue: intensity * 3,
                    duration: 50,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(shakeAnim, {
                    toValue: -intensity * 3,
                    duration: 100,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(shakeAnim, {
                    toValue: 0,
                    duration: 50,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.delay(500),
            ])
        ).start();
    }, [shakeAnim]);

    const startAnimations = useCallback(() => {
        const currentTheme = VISUAL_THEMES[visualState];
        startPulseAnimation(currentTheme.pulseIntensity);
        startGlowAnimation(currentTheme.pulseIntensity);
        startShakeAnimation(currentTheme.pulseIntensity);
    }, [visualState, startPulseAnimation, startGlowAnimation, startShakeAnimation]);

    const stopAnimations = useCallback(() => {
        pulseAnim.stopAnimation();
        glowAnim.stopAnimation();
        shakeAnim.stopAnimation();

        pulseAnim.setValue(1);
        glowAnim.setValue(0);
        shakeAnim.setValue(0);
    }, [pulseAnim, glowAnim, shakeAnim]);

    // ─────────────────────────────────────────────────────────────────────────
    // UPDATE TIMER
    // ─────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        const updateVisuals = () => {
            const now = Date.now();
            const remaining = deadlineAt - now;
            const hours = remaining / (1000 * 60 * 60);
            const percentage = totalDuration > 0 ? (remaining / totalDuration) * 100 : 0;

            setHoursRemaining(Math.max(0, hours));
            setPercentageRemaining(Math.max(0, Math.min(100, percentage)));

            const newState = determineVisualState(hours, isStreakDead);

            if (newState !== visualState) {
                setVisualState(newState);
                setTheme(VISUAL_THEMES[newState]);

                // Update mascot opacity based on time remaining
                const mascotOpacity = isStreakDead
                    ? 0.1
                    : Math.max(0.1, Math.min(1, hours / 12));

                Animated.timing(fadeAnim, {
                    toValue: mascotOpacity,
                    duration: 500,
                    useNativeDriver: true,
                }).start();
            }
        };

        updateVisuals();
        const unsubscribe = tickService.subscribe(updateVisuals);

        return unsubscribe;
    }, [deadlineAt, totalDuration, isStreakDead, visualState, determineVisualState, fadeAnim]);

    // Start animations when visual state changes
    useEffect(() => {
        stopAnimations();
        if (visualState !== 'dead' && visualState !== 'safe') {
            startAnimations();
        }
    }, [visualState, startAnimations, stopAnimations]);

    return {
        theme,
        visualState,
        animations: {
            pulseAnim,
            fadeAnim,
            colorAnim,
            shakeAnim,
            glowAnim,
        },
        hoursRemaining,
        percentageRemaining,
        startAnimations,
        stopAnimations,
        interpolateColor,
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        }
        : null;
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLED COMPONENTS HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export const getGradientColors = (state: VisualState): string[] => {
    const theme = VISUAL_THEMES[state];
    return [theme.backgroundColor, theme.secondaryColor];
};

export const getTextColorForState = (state: VisualState): string => {
    return VISUAL_THEMES[state].textColor;
};

export const getBorderColorForState = (state: VisualState): string => {
    return VISUAL_THEMES[state].borderColor;
};

export const getMascotOpacityForHours = (hours: number, isDead: boolean): number => {
    if (isDead) return 0.1;
    if (hours > 12) return 1.0;
    if (hours > 6) return 0.9;
    if (hours > 2) return 0.7;
    if (hours > 1) return 0.5;
    if (hours > 0.25) return 0.3;
    return 0.1;
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export { VISUAL_THEMES };
export default useDynamicVisualWidget;
