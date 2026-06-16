/**
 * NEURALIS - Core Hook
 * useNeuralisCore: Master lifecycle management for Energy/Streak/Audio-Fade
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';
import type { AppStateStatus } from 'react-native';
import { AppState } from 'react-native';
import useNeuralisStore from '../store/useNeuralisStore';
import type { NeuralisState, NeuralisActions } from '../store/useNeuralisStore';
import { useShallow } from 'zustand/react/shallow';
import { tickService } from '../services/TickService';
import {
  streakService,
  audioService,
  synapseService,
  rankingService,
  dopamineMonitorService,
  calculateStreakState,
  formatTimeRemaining,
} from '../services';
import type { StreakState, StreakData, EnergyData } from '../types';

// Type for store state
type StoreState = NeuralisState & NeuralisActions;

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const TICK_INTERVAL_MS = 1000; // Update every second
const ENERGY_REGEN_INTERVAL_MS = 60000; // Regen check every minute
const ENERGY_REGEN_RATE = 1; // 1 energy per minute
const DEFAULT_MAX_ENERGY = 100;
const NEURAL_DECAY_THRESHOLD_HOURS = 2;
const CRITICAL_THRESHOLD_MINUTES = 30;

// ═══════════════════════════════════════════════════════════════════════════
// HOOK RETURN TYPE
// ═══════════════════════════════════════════════════════════════════════════

interface UseNeuralisCoreReturn {
  // Streak State
  streak: StreakData | null;
  streakState: StreakState;
  timeRemaining: string;
  timeRemainingMs: number;
  isStreakHealthy: boolean;
  isNeuralDecay: boolean;
  isCritical: boolean;
  isStreakDead: boolean;

  // Energy State
  energy: number;
  maxEnergy: number;
  energyPercentage: number;
  isEnergyDepleted: boolean;
  canAfford: (cost: number) => boolean;

  // UI State
  uiOpacity: number;
  isGrayscale: boolean;
  grayscaleValue: number;

  // Actions
  completeDaily: () => Promise<void>;
  useMercy: (challengeCompleted: boolean) => Promise<boolean>;
  consumeEnergy: (amount: number) => void;
  playNotification: () => Promise<void>;

  // Status
  isLoading: boolean;
  isInitialized: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════

export function useNeuralisCore(): UseNeuralisCoreReturn {
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const energyRegenRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const isInitializedRef = useRef(false);

  // Store state — batched with shallow equality to minimize re-renders
  const {
    user,
    streakData,
    streakState,
    timeUntilDeadline,
    energyData,
    uiOpacity,
    isGrayscale,
    isLoading,
  } = useNeuralisStore(
    useShallow((s: StoreState) => ({
      user: s.user,
      streakData: s.streakData,
      streakState: s.streakState,
      timeUntilDeadline: s.timeUntilDeadline,
      energyData: s.energyData,
      uiOpacity: s.uiOpacity,
      isGrayscale: s.isGrayscale,
      isLoading: s.isLoading,
    })),
  );

  // Store actions — stable references, safe to select individually
  const setStreakData = useNeuralisStore((s: StoreState) => s.setStreakData);
  const setTimeUntilDeadline = useNeuralisStore((s: StoreState) => s.setTimeUntilDeadline);
  const updateStreakFromState = useNeuralisStore((s: StoreState) => s.updateStreakFromState);
  const setEnergyData = useNeuralisStore((s: StoreState) => s.setEnergyData);
  const consumeEnergyAction = useNeuralisStore((s: StoreState) => s.consumeEnergy);
  const regenerateEnergy = useNeuralisStore((s: StoreState) => s.regenerateEnergy);
  const setLoading = useNeuralisStore((s: StoreState) => s.setLoading);

  // ─────────────────────────────────────────────────────────────────────────
  // Initialize Core Systems
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user?.uid || isInitializedRef.current) return;

    const initialize = async () => {
      setLoading(true);

      try {
        // Initialize audio system
        await audioService.initialize();

        // Subscribe to streak updates
        streakService.subscribeToStreak(user.uid, handleStreakUpdate);

        // Initialize energy data
        initializeEnergy(user.uid);

        // Start dopamine monitoring if enabled
        if (user.aggressiveWakeUpEnabled) {
          dopamineMonitorService.startMonitoring(user.uid);
        }

        isInitializedRef.current = true;
      } catch (error) {
        console.error('[useNeuralisCore] Initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initialize();

    return () => {
      cleanup();
    };
  }, [user?.uid]);

  // ─────────────────────────────────────────────────────────────────────────
  // Tick System (Real-time countdown)
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!streakData?.deadlineAt) return;

    // Subscribe to shared tick service instead of creating a new interval
    const unsubscribe = tickService.subscribe(() => {
      const remaining = streakData.deadlineAt - Date.now();
      setTimeUntilDeadline(Math.max(0, remaining));

      // Check for state transitions
      const newState = calculateStreakState(streakData.deadlineAt);
      if (newState !== streakState) {
        handleStateTransition(newState);
      }

      // Check for streak death
      if (remaining <= 0 && streakState !== 'dead') {
        handleStreakDeath();
      }
    });

    return unsubscribe;
  }, [streakData?.deadlineAt, streakState]);

  // ─────────────────────────────────────────────────────────────────────────
  // Energy Regeneration System
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!energyData) return;

    energyRegenRef.current = setInterval(() => {
      if (energyData.current < energyData.max) {
        regenerateEnergy(ENERGY_REGEN_RATE);
      }
    }, ENERGY_REGEN_INTERVAL_MS);

    return () => {
      if (energyRegenRef.current) {
        clearInterval(energyRegenRef.current);
      }
    };
  }, [energyData?.current, energyData?.max]);

  // ─────────────────────────────────────────────────────────────────────────
  // App State Handling (Background/Foreground)
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleStreakUpdate = useCallback((streak: StreakData | null, state: StreakState) => {
    setStreakData(streak);
    updateStreakFromState(state);

    if (streak) {
      const remaining = streak.deadlineAt - Date.now();
      setTimeUntilDeadline(Math.max(0, remaining));

      // Start audio decay if in neural decay phase
      if (state === 'neural_decay' || state === 'critical') {
        audioService.startDecayFade(remaining);
      } else {
        audioService.stopDecayFade();
      }
    }
  }, []);

  const handleStateTransition = useCallback(
    async (newState: StreakState) => {
      updateStreakFromState(newState);

      // Play state-specific notification
      if (user?.soundEnabled !== false) {
        await audioService.playNotification(newState);
      }

      // Handle neural decay start
      if (newState === 'neural_decay' && streakData) {
        const remaining = streakData.deadlineAt - Date.now();
        audioService.startDecayFade(remaining);
      }

      console.log(`[useNeuralisCore] State transition: ${streakState} -> ${newState}`);
    },
    [streakState, user?.soundEnabled, streakData],
  );

  const handleStreakDeath = useCallback(async () => {
    if (!user?.uid) return;

    updateStreakFromState('dead');

    // Check for synapse link - shared fate
    const activeLink = await synapseService.getActiveLink(user.uid);
    if (activeLink) {
      await synapseService.breakLinkDueToMissedDeadline(user.uid);
    } else {
      await streakService.killStreak(user.uid, 'missed_deadline');
    }

    // Play death sound
    await audioService.playSFX('sfx_streak_break' as any);

    console.log('[useNeuralisCore] Streak died');
  }, [user?.uid]);

  const handleAppStateChange = useCallback(
    (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - recalculate state
        if (streakData) {
          const newState = calculateStreakState(streakData.deadlineAt);
          if (newState !== streakState) {
            handleStateTransition(newState);
          }
        }
      }
      appStateRef.current = nextAppState;
    },
    [streakData, streakState],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Initialize Energy
  // ─────────────────────────────────────────────────────────────────────────

  const initializeEnergy = useCallback((userId: string) => {
    // In production, this loads from Supabase
    const defaultEnergy: EnergyData = {
      userId,
      current: DEFAULT_MAX_ENERGY,
      max: DEFAULT_MAX_ENERGY,
      lastRegenAt: Date.now(),
      regenRatePerHour: 60,
      bonusEnergy: 0,
    };
    setEnergyData(defaultEnergy);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Cleanup
  // ─────────────────────────────────────────────────────────────────────────

  const cleanup = useCallback(() => {
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current);
    }
    if (energyRegenRef.current) {
      clearInterval(energyRegenRef.current);
    }

    if (user?.uid) {
      streakService.unsubscribe(user.uid);
    }

    audioService.cleanup();
    dopamineMonitorService.stopMonitoring();
    isInitializedRef.current = false;
  }, [user?.uid]);

  // ─────────────────────────────────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────────────────────────────────

  const completeDaily = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const updatedStreak = await streakService.completeDaily(user.uid);
      setStreakData(updatedStreak);
      updateStreakFromState('healthy');
      audioService.stopDecayFade();

      // Update synapse partner if linked
      await synapseService.updatePartnerActivity(user.uid);

      // Play success sound
      await audioService.playSFX('sfx_success' as any);
    } catch (error) {
      console.error('[useNeuralisCore] Complete daily error:', error);
    }
  }, [user?.uid]);

  const useMercy = useCallback(
    async (challengeCompleted: boolean): Promise<boolean> => {
      if (!user?.uid) return false;

      const success = await streakService.useMercy(user.uid, challengeCompleted);

      if (success) {
        await audioService.playSFX('sfx_mercy' as any);
      } else {
        await audioService.playSFX('sfx_failure' as any);
      }

      return success;
    },
    [user?.uid],
  );

  const consumeEnergy = useCallback((amount: number) => {
    consumeEnergyAction(amount);
  }, []);

  const playNotification = useCallback(async () => {
    await audioService.playNotification(streakState);
  }, [streakState]);

  // ─────────────────────────────────────────────────────────────────────────
  // Computed Values
  // ─────────────────────────────────────────────────────────────────────────

  const computed = useMemo(() => {
    const energy = energyData?.current ?? DEFAULT_MAX_ENERGY;
    const maxEnergy = energyData?.max ?? DEFAULT_MAX_ENERGY;
    const energyPercentage = (energy / maxEnergy) * 100;

    const grayscaleValue =
      streakState === 'dead'
        ? 1
        : streakState === 'critical'
          ? 0.6
          : streakState === 'neural_decay'
            ? 0.3
            : 0;

    return {
      energy,
      maxEnergy,
      energyPercentage,
      isEnergyDepleted: energy === 0,
      grayscaleValue,
      timeRemaining: formatTimeRemaining(timeUntilDeadline),
      isStreakHealthy: streakState === 'healthy',
      isNeuralDecay: streakState === 'neural_decay',
      isCritical: streakState === 'critical',
      isStreakDead: streakState === 'dead',
    };
  }, [energyData, streakState, timeUntilDeadline]);

  // ─────────────────────────────────────────────────────────────────────────
  // Return
  // ─────────────────────────────────────────────────────────────────────────

  return {
    // Streak
    streak: streakData,
    streakState,
    timeRemaining: computed.timeRemaining,
    timeRemainingMs: timeUntilDeadline,
    isStreakHealthy: computed.isStreakHealthy,
    isNeuralDecay: computed.isNeuralDecay,
    isCritical: computed.isCritical,
    isStreakDead: computed.isStreakDead,

    // Energy
    energy: computed.energy,
    maxEnergy: computed.maxEnergy,
    energyPercentage: computed.energyPercentage,
    isEnergyDepleted: computed.isEnergyDepleted,
    canAfford: (cost: number) => computed.energy >= cost,

    // UI
    uiOpacity,
    isGrayscale,
    grayscaleValue: computed.grayscaleValue,

    // Actions
    completeDaily,
    useMercy,
    consumeEnergy,
    playNotification,

    // Status
    isLoading,
    isInitialized: isInitializedRef.current,
  };
}

export default useNeuralisCore;
