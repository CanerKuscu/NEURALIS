/**
 * NEURALIS - Audio Decay Hook
 * Aggressive audio-notification system with visual decay
 *
 * @description Implements Duolingo-style obsessive persistence
 * with dynamic audio pitch/volume modifications during decay phases
 */

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import type { AVPlaybackStatus } from 'expo-av';
import { Audio } from 'expo-av';
import type { AppStateStatus } from 'react-native';
import { AppState, Vibration, Platform } from 'react-native';
import * as Notifications from '../services/safeNotifications';

import type { ShadowFoxStatus } from '../services/LocalizationService';
import { NotificationSeverity, localizationService } from '../services/LocalizationService';
import type { StreakStatus } from '../services/NotificationEngine';
import { notificationEngine } from '../services/NotificationEngine';
import { tickService } from '../services/TickService';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface DecayPhase {
  name: 'normal' | 'urgent' | 'decay' | 'critical' | 'dead';
  soundFile: '1.mp3' | '2.mp3' | '3.mp3';
  intervalMs: number;
  volume: number;
  pitch: number;
  vibrationPattern: number[];
  backgroundColor: string;
  foxOpacity: number;
}

export interface AudioDecayState {
  currentPhase: DecayPhase;
  remainingMs: number;
  remainingFormatted: string;
  foxStatus: ShadowFoxStatus;
  isPlaying: boolean;
  lastPlayedAt: number | null;
  nextScheduledAt: number | null;
}

export interface UseAudioDecayOptions {
  enabled?: boolean;
  streakStatus: StreakStatus | null;
  onStreakDeath?: () => void;
  onPhaseChange?: (phase: DecayPhase) => void;
  onMonetizationTrigger?: () => void; // Trigger Neuralis Pro offer
}

export interface UseAudioDecayReturn {
  state: AudioDecayState;
  playDecaySound: () => Promise<void>;
  stopSound: () => Promise<void>;
  triggerVibration: () => void;
  backgroundColor: string;
  foxOpacity: number;
  isInDecayPhase: boolean;
  shouldShowProOffer: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

// Color gradient from safe to death
const DECAY_COLORS = {
  SAFE: '#A020F0', // Royal Purple - Safe
  WARNING: '#8B5CF6', // Violet - Getting worried
  URGENT: '#DC2626', // Red - Urgent
  CRITICAL: '#991B1B', // Dark Red - Critical
  DEATH: '#8B0000', // Blood Red - Dead
} as const;

// Phase configurations matching the spec
const DECAY_PHASES: Record<string, DecayPhase> = {
  NORMAL: {
    name: 'normal',
    soundFile: '1.mp3',
    intervalMs: Infinity, // Single notification
    volume: 1.0,
    pitch: 1.0,
    vibrationPattern: [0, 200],
    backgroundColor: DECAY_COLORS.SAFE,
    foxOpacity: 1.0,
  },
  URGENT: {
    name: 'urgent',
    soundFile: '2.mp3',
    intervalMs: 4 * 60 * 60 * 1000, // Every 4 hours
    volume: 1.0,
    pitch: 1.0,
    vibrationPattern: [0, 300, 100, 300],
    backgroundColor: DECAY_COLORS.WARNING,
    foxOpacity: 0.85,
  },
  DECAY: {
    name: 'decay',
    soundFile: '3.mp3',
    intervalMs: 15 * 60 * 1000, // Every 15 minutes
    volume: 0.8,
    pitch: 0.9,
    vibrationPattern: [0, 500, 200, 500, 200, 500],
    backgroundColor: DECAY_COLORS.URGENT,
    foxOpacity: 0.6,
  },
  CRITICAL: {
    name: 'critical',
    soundFile: '3.mp3',
    intervalMs: 5 * 60 * 1000, // Every 5 minutes
    volume: 0.4, // Fading volume
    pitch: 0.7, // Lower pitch
    vibrationPattern: [0, 1000, 200, 1000, 200, 1000],
    backgroundColor: DECAY_COLORS.CRITICAL,
    foxOpacity: 0.3,
  },
  DEAD: {
    name: 'dead',
    soundFile: '3.mp3',
    intervalMs: 0,
    volume: 0.2,
    pitch: 0.5,
    vibrationPattern: [0, 2000],
    backgroundColor: DECAY_COLORS.DEATH,
    foxOpacity: 0,
  },
};

// Sound file mapping
const SOUND_FILES = {
  '1.mp3': require('../../assets/audio/1.mp3'),
  '2.mp3': require('../../assets/audio/2.mp3'),
  '3.mp3': require('../../assets/audio/3.mp3'),
} as const;

// Time thresholds (in milliseconds)
const TIME_THRESHOLDS = {
  NORMAL: 12 * 60 * 60 * 1000, // >12 hours
  URGENT: 2 * 60 * 60 * 1000, // 12h - 2h
  DECAY: 1 * 60 * 60 * 1000, // 2h - 1h (MONETIZATION TRIGGER)
  CRITICAL: 15 * 60 * 1000, // 1h - 15m
  DEAD: 0, // Streak terminated
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Determine decay phase based on remaining time
 */
const determinePhase = (remainingMs: number): DecayPhase => {
  if (remainingMs <= 0) {
    return DECAY_PHASES.DEAD;
  } else if (remainingMs <= TIME_THRESHOLDS.CRITICAL) {
    return DECAY_PHASES.CRITICAL;
  } else if (remainingMs <= TIME_THRESHOLDS.DECAY) {
    return DECAY_PHASES.DECAY;
  } else if (remainingMs <= TIME_THRESHOLDS.URGENT) {
    return DECAY_PHASES.URGENT;
  }
  return DECAY_PHASES.NORMAL;
};

/**
 * Calculate dynamic pitch based on remaining time in critical phase
 * Pitch decreases as time runs out (0.7 → 0.5)
 */
const calculateDynamicPitch = (remainingMs: number): number => {
  if (remainingMs <= 0) return 0.5;
  if (remainingMs > TIME_THRESHOLDS.CRITICAL) return 1.0;

  // Linear interpolation: 15min → 0.7, 0min → 0.5
  const ratio = remainingMs / TIME_THRESHOLDS.CRITICAL;
  return 0.5 + ratio * 0.2;
};

/**
 * Calculate dynamic volume based on remaining time
 * Volume fades as time runs out in critical phase
 */
const calculateDynamicVolume = (remainingMs: number): number => {
  if (remainingMs <= 0) return 0.2;
  if (remainingMs > TIME_THRESHOLDS.CRITICAL) return 1.0;

  // Linear interpolation: 15min → 0.4, 0min → 0.2
  const ratio = remainingMs / TIME_THRESHOLDS.CRITICAL;
  return 0.2 + ratio * 0.2;
};

/**
 * Calculate background color gradient based on remaining time
 */
const calculateBackgroundColor = (remainingMs: number): string => {
  if (remainingMs <= 0) return DECAY_COLORS.DEATH;
  if (remainingMs <= TIME_THRESHOLDS.CRITICAL) return DECAY_COLORS.CRITICAL;
  if (remainingMs <= TIME_THRESHOLDS.DECAY) return DECAY_COLORS.URGENT;
  if (remainingMs <= TIME_THRESHOLDS.URGENT) return DECAY_COLORS.WARNING;
  return DECAY_COLORS.SAFE;
};

/**
 * Calculate fox opacity based on remaining time
 * Fox fades as decay progresses
 */
const calculateFoxOpacity = (remainingMs: number): number => {
  if (remainingMs <= 0) return 0;
  if (remainingMs >= TIME_THRESHOLDS.NORMAL) return 1.0;

  // Smooth fade from 1.0 to 0 over the entire decay period
  const totalDecayTime = TIME_THRESHOLDS.NORMAL;
  return Math.max(0, Math.min(1, remainingMs / totalDecayTime));
};

/**
 * Format remaining time for display
 */
const formatRemainingTime = (ms: number): string => {
  if (ms <= 0) return '00:00:00';

  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((ms % (60 * 1000)) / 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════════════════

export function useAudioDecay(options: UseAudioDecayOptions): UseAudioDecayReturn {
  const {
    enabled = true,
    streakStatus,
    onStreakDeath,
    onPhaseChange,
    onMonetizationTrigger,
  } = options;

  // ─────────────────────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────────────────────

  const [state, setState] = useState<AudioDecayState>({
    currentPhase: DECAY_PHASES.NORMAL,
    remainingMs: Infinity,
    remainingFormatted: '--:--:--',
    foxStatus: 'happy',
    isPlaying: false,
    lastPlayedAt: null,
    nextScheduledAt: null,
  });

  const [shouldShowProOffer, setShouldShowProOffer] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // REFS
  // ─────────────────────────────────────────────────────────────────────────

  const soundRef = useRef<Audio.Sound | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const previousPhaseRef = useRef<DecayPhase['name']>('normal');
  const monetizationTriggeredRef = useRef(false);
  const isPlayingRef = useRef(false);
  const lastPlayedAtRef = useRef<number | null>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // SOUND LOADING
  // ─────────────────────────────────────────────────────────────────────────

  const loadSound = useCallback(async (soundFile: '1.mp3' | '2.mp3' | '3.mp3'): Promise<void> => {
    try {
      // Unload previous sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      // Load new sound
      const { sound } = await Audio.Sound.createAsync(SOUND_FILES[soundFile]);
      soundRef.current = sound;
    } catch (error) {
      console.error('[AudioDecayHook] Failed to load sound:', error);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // PLAY DECAY SOUND
  // ─────────────────────────────────────────────────────────────────────────

  const playDecaySound = useCallback(async (): Promise<void> => {
    if (!enabled || !soundRef.current) return;

    try {
      const remainingMs = streakStatus ? streakStatus.deadlineTimestamp - Date.now() : Infinity;

      const pitch = calculateDynamicPitch(remainingMs);
      const volume = calculateDynamicVolume(remainingMs);

      // Configure playback
      await soundRef.current.setVolumeAsync(volume);

      // Note: pitch/rate modification requires special handling
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await soundRef.current.setRateAsync(pitch, true);
      }

      // Reset and play
      await soundRef.current.setPositionAsync(0);
      await soundRef.current.playAsync();

      setState((prev) => ({
        ...prev,
        isPlaying: true,
        lastPlayedAt: Date.now(),
      }));
      isPlayingRef.current = true;
      lastPlayedAtRef.current = Date.now();

      // Listen for playback completion
      soundRef.current.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if ('didJustFinish' in status && status.didJustFinish) {
          isPlayingRef.current = false;
          setState((prev) => ({ ...prev, isPlaying: false }));
        }
      });
    } catch (error) {
      console.error('[AudioDecayHook] Failed to play sound:', error);
    }
  }, [enabled, streakStatus]);

  // ─────────────────────────────────────────────────────────────────────────
  // STOP SOUND
  // ─────────────────────────────────────────────────────────────────────────

  const stopSound = useCallback(async (): Promise<void> => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        isPlayingRef.current = false;
        setState((prev) => ({ ...prev, isPlaying: false }));
      } catch (error) {
        console.error('[AudioDecayHook] Failed to stop sound:', error);
      }
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // VIBRATION
  // ─────────────────────────────────────────────────────────────────────────

  const triggerVibration = useCallback((): void => {
    const pattern = state.currentPhase.vibrationPattern;
    Vibration.vibrate(pattern);
  }, [state.currentPhase]);

  // ─────────────────────────────────────────────────────────────────────────
  // UPDATE LOOP
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!enabled || !streakStatus) return;

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const updateDecayState = async (): Promise<void> => {
      const now = Date.now();
      const remainingMs = streakStatus.deadlineTimestamp - now;
      const phase = determinePhase(remainingMs);

      // Check for phase change
      if (phase.name !== previousPhaseRef.current) {
        previousPhaseRef.current = phase.name;

        // Load appropriate sound for new phase
        await loadSound(phase.soundFile);

        // Trigger callbacks
        onPhaseChange?.(phase);

        // Check for monetization trigger (entering decay phase)
        if (phase.name === 'decay' && !monetizationTriggeredRef.current) {
          monetizationTriggeredRef.current = true;
          setShouldShowProOffer(true);
          onMonetizationTrigger?.();
        }

        // Check for streak death
        if (phase.name === 'dead' && !streakStatus.taskCompletedToday) {
          onStreakDeath?.();
        }
      }

      // Map phase to fox status
      const foxStatus: ShadowFoxStatus =
        phase.name === 'normal'
          ? 'happy'
          : phase.name === 'urgent'
            ? 'tense'
            : phase.name === 'decay'
              ? 'fading'
              : phase.name === 'critical'
                ? 'critical'
                : 'dead';

      // Update state
      setState((prev) => ({
        currentPhase: phase,
        remainingMs,
        remainingFormatted: formatRemainingTime(remainingMs),
        foxStatus,
        isPlaying: isPlayingRef.current,
        lastPlayedAt: lastPlayedAtRef.current,
        nextScheduledAt: phase.intervalMs !== Infinity ? now + phase.intervalMs : null,
      }));

      // Schedule sound if needed
      if (
        phase.intervalMs !== Infinity &&
        phase.intervalMs > 0 &&
        lastPlayedAtRef.current &&
        now - lastPlayedAtRef.current >= phase.intervalMs
      ) {
        await playDecaySound();
        triggerVibration();
      }
    };

    // Initial update
    updateDecayState();

    // Subscribe to shared tick service instead of creating a new interval
    const unsubscribe = tickService.subscribe(updateDecayState);

    return unsubscribe;
  }, [
    enabled,
    streakStatus,
    loadSound,
    onPhaseChange,
    onMonetizationTrigger,
    onStreakDeath,
    playDecaySound,
    triggerVibration,
  ]);

  // ─────────────────────────────────────────────────────────────────────────
  // APP STATE HANDLING
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleAppStateChange = async (nextState: AppStateStatus): Promise<void> => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active' &&
        streakStatus
      ) {
        // App returned to foreground - check if we need to play sound
        const remainingMs = streakStatus.deadlineTimestamp - Date.now();
        const phase = determinePhase(remainingMs);

        if (phase.name === 'critical' || phase.name === 'decay') {
          await playDecaySound();
          triggerVibration();
        }
      }

      appStateRef.current = nextState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [streakStatus, playDecaySound, triggerVibration]);

  // ─────────────────────────────────────────────────────────────────────────
  // CLEANUP
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // MEMOIZED VALUES
  // ─────────────────────────────────────────────────────────────────────────

  const backgroundColor = useMemo(
    () => calculateBackgroundColor(state.remainingMs),
    [state.remainingMs],
  );

  const foxOpacity = useMemo(() => calculateFoxOpacity(state.remainingMs), [state.remainingMs]);

  const isInDecayPhase = useMemo(
    () => ['decay', 'critical', 'dead'].includes(state.currentPhase.name),
    [state.currentPhase.name],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // RETURN
  // ─────────────────────────────────────────────────────────────────────────

  return {
    state,
    playDecaySound,
    stopSound,
    triggerVibration,
    backgroundColor,
    foxOpacity,
    isInDecayPhase,
    shouldShowProOffer,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export { DECAY_PHASES, DECAY_COLORS, TIME_THRESHOLDS };
export default useAudioDecay;
