/**
 * NEURALIS - Neural Decay Hook
 * Visual/Audio fading during final 2 hours of streak deadline
 * 
 * Effects:
 * - Visual: Opacity decrease, grayscale increase, blur effect
 * - Audio: Distorted pulse notifications, low-pass filter on audio
 * 
 * Philosophy: Simulate the "fading" of neural energy as deadline approaches
 */

import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    Easing,
    cancelAnimation,
    interpolate,
    interpolateColor,
} from 'react-native-reanimated';
import * as Notifications from '../services/safeNotifications';
import { COLORS } from '../theme/colors';
import { tickService } from '../services/TickService';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const DECAY_CONFIG = {
    // Time thresholds (in milliseconds)
    NEURAL_DECAY_THRESHOLD: 2 * 60 * 60 * 1000, // 2 hours
    CRITICAL_THRESHOLD: 1 * 60 * 60 * 1000,     // 1 hour
    URGENT_THRESHOLD: 30 * 60 * 1000,           // 30 minutes
    FINAL_THRESHOLD: 15 * 60 * 1000,            // 15 minutes

    // Visual decay parameters
    OPACITY: {
        healthy: 1.0,
        warning: 0.9,
        neuralDecay: 0.7,
        critical: 0.5,
        urgent: 0.35,
        final: 0.2,
        dead: 0.1,
    } as Record<string, number>,

    GRAYSCALE: {
        healthy: 0,
        warning: 0,
        neuralDecay: 0.3,
        critical: 0.6,
        urgent: 0.8,
        final: 0.95,
        dead: 1,
    } as Record<string, number>,

    BLUR: {
        healthy: 0,
        warning: 0,
        neuralDecay: 2,
        critical: 5,
        urgent: 8,
        final: 12,
        dead: 15,
    } as Record<string, number>,

    // Animation durations
    TRANSITION_DURATION: 1000,
    PULSE_DURATION: 500,
    FLICKER_DURATION: 150,

    // Notification intervals
    NOTIFICATION_INTERVAL: 15 * 60 * 1000, // 15 minutes
};

// Audio filter coefficients (simulated low-pass)
type AudioFilterConfig = { lowPassFreq: number; volume: number; rate: number };
const AUDIO_FILTER: Record<string, AudioFilterConfig> = {
    healthy: { lowPassFreq: 20000, volume: 1.0, rate: 1.0 },
    warning: { lowPassFreq: 15000, volume: 0.95, rate: 1.0 },
    neuralDecay: { lowPassFreq: 8000, volume: 0.85, rate: 0.98 },
    critical: { lowPassFreq: 4000, volume: 0.75, rate: 0.95 },
    urgent: { lowPassFreq: 2000, volume: 0.65, rate: 0.9 },
    final: { lowPassFreq: 1000, volume: 0.5, rate: 0.85 },
    dead: { lowPassFreq: 500, volume: 0.3, rate: 0.8 },
};

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type DecayPhase =
    | 'healthy'
    | 'warning'
    | 'neuralDecay'
    | 'critical'
    | 'urgent'
    | 'final'
    | 'dead';

export interface NeuralDecayState {
    phase: DecayPhase;
    timeRemaining: number;
    opacity: number;
    grayscale: number;
    blur: number;
    pulseIntensity: number;
    isDistorted: boolean;
}

export interface UseNeuralDecayOptions {
    deadlineTimestamp: number;
    onPhaseChange?: (phase: DecayPhase) => void;
    onDeath?: () => void;
    enableNotifications?: boolean;
    enableAudioEffects?: boolean;
}

export interface UseNeuralDecayReturn {
    state: NeuralDecayState;
    animatedStyle: ReturnType<typeof useAnimatedStyle>;
    mascotAnimatedStyle: ReturnType<typeof useAnimatedStyle>;
    playDecaySound: () => Promise<void>;
    triggerDecayNotification: () => Promise<void>;
    getAudioFilter: () => AudioFilterConfig;
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════

export function useNeuralDecay(
    options: UseNeuralDecayOptions
): UseNeuralDecayReturn {
    const {
        deadlineTimestamp,
        onPhaseChange,
        onDeath,
        enableNotifications = true,
        enableAudioEffects = true,
    } = options;

    // Shared animation values
    const opacity = useSharedValue<number>(DECAY_CONFIG.OPACITY.healthy);
    const grayscale = useSharedValue<number>(DECAY_CONFIG.GRAYSCALE.healthy);
    const blur = useSharedValue<number>(DECAY_CONFIG.BLUR.healthy);
    const pulseIntensity = useSharedValue<number>(0);
    const flickerValue = useSharedValue<number>(1);
    const glowIntensity = useSharedValue<number>(1);

    // State tracking
    const currentPhase = useRef<DecayPhase>('healthy');
    const lastNotificationTime = useRef<number>(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ─────────────────────────────────────────────────────────────────────────
    // Calculate Decay Phase
    // ─────────────────────────────────────────────────────────────────────────

    const calculatePhase = useCallback((timeRemaining: number): DecayPhase => {
        if (timeRemaining <= 0) return 'dead';
        if (timeRemaining <= DECAY_CONFIG.FINAL_THRESHOLD) return 'final';
        if (timeRemaining <= DECAY_CONFIG.URGENT_THRESHOLD) return 'urgent';
        if (timeRemaining <= DECAY_CONFIG.CRITICAL_THRESHOLD) return 'critical';
        if (timeRemaining <= DECAY_CONFIG.NEURAL_DECAY_THRESHOLD) return 'neuralDecay';
        if (timeRemaining <= DECAY_CONFIG.NEURAL_DECAY_THRESHOLD * 2) return 'warning';
        return 'healthy';
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // Update Visual Effects
    // ─────────────────────────────────────────────────────────────────────────

    const updateVisualEffects = useCallback((phase: DecayPhase) => {
        const config = {
            duration: DECAY_CONFIG.TRANSITION_DURATION,
            easing: Easing.inOut(Easing.cubic),
        };

        switch (phase) {
            case 'healthy':
                opacity.value = withTiming(DECAY_CONFIG.OPACITY.healthy, config);
                grayscale.value = withTiming(DECAY_CONFIG.GRAYSCALE.healthy, config);
                blur.value = withTiming(DECAY_CONFIG.BLUR.healthy, config);
                pulseIntensity.value = 0;
                cancelAnimation(flickerValue);
                flickerValue.value = 1;
                break;

            case 'warning':
                opacity.value = withTiming(DECAY_CONFIG.OPACITY.warning, config);
                grayscale.value = withTiming(DECAY_CONFIG.GRAYSCALE.warning, config);
                blur.value = withTiming(DECAY_CONFIG.BLUR.warning, config);
                // Subtle pulse
                pulseIntensity.value = withRepeat(
                    withSequence(
                        withTiming(0.1, { duration: DECAY_CONFIG.PULSE_DURATION }),
                        withTiming(0, { duration: DECAY_CONFIG.PULSE_DURATION })
                    ),
                    -1,
                    true
                );
                break;

            case 'neuralDecay':
                opacity.value = withTiming(DECAY_CONFIG.OPACITY.neuralDecay, config);
                grayscale.value = withTiming(DECAY_CONFIG.GRAYSCALE.neuralDecay, config);
                blur.value = withTiming(DECAY_CONFIG.BLUR.neuralDecay, config);
                // Medium pulse
                pulseIntensity.value = withRepeat(
                    withSequence(
                        withTiming(0.3, { duration: DECAY_CONFIG.PULSE_DURATION }),
                        withTiming(0, { duration: DECAY_CONFIG.PULSE_DURATION })
                    ),
                    -1,
                    true
                );
                break;

            case 'critical':
                opacity.value = withTiming(DECAY_CONFIG.OPACITY.critical, config);
                grayscale.value = withTiming(DECAY_CONFIG.GRAYSCALE.critical, config);
                blur.value = withTiming(DECAY_CONFIG.BLUR.critical, config);
                // Strong pulse
                pulseIntensity.value = withRepeat(
                    withSequence(
                        withTiming(0.5, { duration: DECAY_CONFIG.PULSE_DURATION * 0.75 }),
                        withTiming(0.1, { duration: DECAY_CONFIG.PULSE_DURATION * 0.75 })
                    ),
                    -1,
                    true
                );
                break;

            case 'urgent':
                opacity.value = withTiming(DECAY_CONFIG.OPACITY.urgent, config);
                grayscale.value = withTiming(DECAY_CONFIG.GRAYSCALE.urgent, config);
                blur.value = withTiming(DECAY_CONFIG.BLUR.urgent, config);
                // Aggressive flicker
                flickerValue.value = withRepeat(
                    withSequence(
                        withTiming(0.6, { duration: DECAY_CONFIG.FLICKER_DURATION }),
                        withTiming(1, { duration: DECAY_CONFIG.FLICKER_DURATION }),
                        withTiming(0.8, { duration: DECAY_CONFIG.FLICKER_DURATION }),
                        withTiming(1, { duration: DECAY_CONFIG.FLICKER_DURATION })
                    ),
                    -1,
                    false
                );
                break;

            case 'final':
                opacity.value = withTiming(DECAY_CONFIG.OPACITY.final, config);
                grayscale.value = withTiming(DECAY_CONFIG.GRAYSCALE.final, config);
                blur.value = withTiming(DECAY_CONFIG.BLUR.final, config);
                // Rapid flicker - near death
                flickerValue.value = withRepeat(
                    withSequence(
                        withTiming(0.3, { duration: DECAY_CONFIG.FLICKER_DURATION * 0.5 }),
                        withTiming(0.8, { duration: DECAY_CONFIG.FLICKER_DURATION * 0.5 }),
                        withTiming(0.2, { duration: DECAY_CONFIG.FLICKER_DURATION * 0.5 }),
                        withTiming(0.7, { duration: DECAY_CONFIG.FLICKER_DURATION * 0.5 })
                    ),
                    -1,
                    false
                );
                break;

            case 'dead':
                opacity.value = withTiming(0.1, config);
                grayscale.value = withTiming(1, config);
                blur.value = withTiming(15, config);
                cancelAnimation(flickerValue);
                cancelAnimation(pulseIntensity);
                flickerValue.value = withTiming(0.1, config);
                break;
        }
    }, [opacity, grayscale, blur, pulseIntensity, flickerValue]);

    // ─────────────────────────────────────────────────────────────────────────
    // Play Decay Sound
    // ─────────────────────────────────────────────────────────────────────────

    const playDecaySound = useCallback(async () => {
        if (!enableAudioEffects) return;

        // Audio files not bundled yet - skip silently
        // When decay_pulse.wav is added to assets/audio/, implement actual playback
        const phase = currentPhase.current;
        const filter = AUDIO_FILTER[phase] || AUDIO_FILTER.healthy;
        console.log(`[useNeuralDecay] Would play decay sound with filter:`, filter);
    }, [enableAudioEffects]);

    // ─────────────────────────────────────────────────────────────────────────
    // Trigger Decay Notification
    // ─────────────────────────────────────────────────────────────────────────

    const triggerDecayNotification = useCallback(async () => {
        if (!enableNotifications) return;

        const now = Date.now();
        if (now - lastNotificationTime.current < DECAY_CONFIG.NOTIFICATION_INTERVAL) {
            return; // Rate limit
        }
        lastNotificationTime.current = now;

        const phase = currentPhase.current;
        const timeRemaining = deadlineTimestamp - now;
        const minutesRemaining = Math.ceil(timeRemaining / 60000);

        let title = '';
        let body = '';
        let sound = 'default';

        switch (phase) {
            case 'neuralDecay':
                title = '⚠️ NEURAL DECAY INITIATED';
                body = `${minutesRemaining} minutes until your streak dies. Your brain is fading.`;
                break;
            case 'critical':
                title = '🔴 CRITICAL STATE';
                body = `Only ${minutesRemaining} minutes left! Complete a task NOW or lose everything.`;
                sound = 'critical';
                break;
            case 'urgent':
                title = '💀 STREAK DYING';
                body = `${minutesRemaining} MINUTES! This is your final warning.`;
                sound = 'urgent';
                break;
            case 'final':
                title = '☠️ LAST CHANCE';
                body = `${minutesRemaining} minutes. Your streak is about to DIE. Final Mercy available.`;
                sound = 'final';
                break;
            default:
                return; // No notification for healthy/warning
        }

        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound,
                priority: Notifications.AndroidNotificationPriority.MAX,
                color: phase === 'final' ? COLORS.danger : COLORS.neonPurple,
            },
            trigger: null, // Immediate
        });
    }, [enableNotifications, deadlineTimestamp]);

    // ─────────────────────────────────────────────────────────────────────────
    // Get Audio Filter Parameters
    // ─────────────────────────────────────────────────────────────────────────

    const getAudioFilter = useCallback(() => {
        return AUDIO_FILTER[currentPhase.current] || AUDIO_FILTER.healthy;
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // Main Update Loop
    // ─────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        const updateDecay = () => {
            const now = Date.now();
            const timeRemaining = deadlineTimestamp - now;
            const newPhase = calculatePhase(timeRemaining);

            if (newPhase !== currentPhase.current) {
                const previousPhase = currentPhase.current;
                currentPhase.current = newPhase;

                // Update visuals
                updateVisualEffects(newPhase);

                // Notify phase change (regular JS context, not a worklet)
                if (onPhaseChange) {
                    onPhaseChange(newPhase);
                }

                // Play sound on phase transition (decay phases only)
                if (
                    enableAudioEffects &&
                    ['neuralDecay', 'critical', 'urgent', 'final'].includes(newPhase)
                ) {
                    playDecaySound();
                }

                // Trigger notification
                if (enableNotifications && newPhase !== 'healthy' && newPhase !== 'warning') {
                    triggerDecayNotification();
                }

                // Handle death
                if (newPhase === 'dead' && onDeath) {
                    onDeath();
                }
            }
        };

        // Initial update
        updateDecay();

        // Subscribe to shared tick service instead of creating a new interval
        const unsubscribe = tickService.subscribe(updateDecay);

        return unsubscribe;
    }, [
        deadlineTimestamp,
        calculatePhase,
        updateVisualEffects,
        onPhaseChange,
        onDeath,
        enableAudioEffects,
        enableNotifications,
        playDecaySound,
        triggerDecayNotification,
    ]);

    // ─────────────────────────────────────────────────────────────────────────
    // Animated Styles
    // ─────────────────────────────────────────────────────────────────────────

    // General container animated style
    const animatedStyle = useAnimatedStyle(() => {
        const grayValue = grayscale.value;

        return {
            opacity: opacity.value * flickerValue.value,
            // Note: React Native doesn't support CSS filters natively
            // For full grayscale effect, use a library like react-native-color-matrix-image-filters
            transform: [
                { scale: 1 + pulseIntensity.value * 0.05 },
            ],
        };
    });

    // Shadow Fox mascot specific animated style
    const mascotAnimatedStyle = useAnimatedStyle(() => {
        const phase = currentPhase.current;

        // Glow color interpolation based on phase
        const glowColor = interpolateColor(
            grayscale.value,
            [0, 0.3, 0.6, 1],
            [COLORS.neonPurple, COLORS.warning, COLORS.danger, COLORS.gray[600]]
        );

        return {
            opacity: opacity.value * flickerValue.value,
            transform: [
                { scale: 1 + pulseIntensity.value * 0.1 },
                { rotate: `${pulseIntensity.value * 2}deg` },
            ],
            shadowColor: glowColor,
            shadowOpacity: interpolate(grayscale.value, [0, 1], [0.8, 0.1]),
            shadowRadius: interpolate(grayscale.value, [0, 1], [20, 5]),
        };
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Return State
    // ─────────────────────────────────────────────────────────────────────────

    // Track phase in state for reactivity (ref doesn't trigger re-render)
    const [phaseState, setPhaseState] = useState<DecayPhase>('healthy');

    // Update phaseState whenever currentPhase ref changes
    const updatePhaseState = useCallback((newPhase: DecayPhase) => {
        currentPhase.current = newPhase;
        setPhaseState(newPhase);
    }, []);

    const state = useMemo<NeuralDecayState>(() => ({
        phase: phaseState,
        timeRemaining: Math.max(0, deadlineTimestamp - Date.now()),
        opacity: DECAY_CONFIG.OPACITY[phaseState] || 1,
        grayscale: DECAY_CONFIG.GRAYSCALE[phaseState] || 0,
        blur: DECAY_CONFIG.BLUR[phaseState] || 0,
        pulseIntensity: ['critical', 'urgent', 'final'].includes(phaseState) ? 1 : 0,
        isDistorted: ['urgent', 'final', 'dead'].includes(phaseState),
    }), [deadlineTimestamp, phaseState]);

    return {
        state,
        animatedStyle,
        mascotAnimatedStyle,
        playDecaySound,
        triggerDecayNotification,
        getAudioFilter,
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY HOOK - Apply Decay to Audio
// ═══════════════════════════════════════════════════════════════════════════

export function useDecayAudio(phase: DecayPhase) {
    const filter = AUDIO_FILTER[phase] || AUDIO_FILTER.healthy;

    const playWithDecay = useCallback(
        async (_audioSource: unknown) => {
            // Audio playback disabled until audio files are added
            console.log('[useDecayAudio] Would play audio with filter:', filter);
            return null;
        },
        [filter]
    );

    return { playWithDecay, filter };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export { DECAY_CONFIG, AUDIO_FILTER };
export default useNeuralDecay;
