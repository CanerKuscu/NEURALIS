/**
 * NEURALIS - Core Zustand Store
 * Central state management for streak, energy, and UI state
 */

import { create } from 'zustand';
import type {
  UserProfile,
  StreakData,
  StreakState,
  EnergyData,
  EnergyState,
  SynapseLink,
  SynapseLinkRequest,
  LeagueBracket,
  AudioEffectType,
  SupportedLocale,
  LivesData,
} from '../types';

// ═══════════════════════════════════════════════════════════════════════════
// STATE INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

export interface NeuralisState {
  // User
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Streak
  streakData: StreakData | null;
  streakState: StreakState;
  timeUntilDeadline: number;

  // Energy
  energyData: EnergyData | null;
  energyState: EnergyState;

  // Synapse
  activeLink: SynapseLink | null;
  linkRequests: SynapseLinkRequest[];

  // League
  currentBracket: LeagueBracket | null;
  userPosition: number;

  // UI State
  uiOpacity: number;
  isGrayscale: boolean;
  currentAudioEffect: AudioEffectType;

  // Feature flags
  unlimitedEnergy?: boolean;
  adFree?: boolean;
  commanderModeEnabled?: boolean;

  // Locale
  locale: SupportedLocale;
  isRTL: boolean;

  // Lives
  livesData?: LivesData | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// ACTIONS INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

export interface NeuralisActions {
  // User
  setUser: (user: UserProfile | null) => void;
  setAuthenticated: (value: boolean) => void;
  setLoading: (value: boolean) => void;

  // Streak
  setStreakData: (data: StreakData | null) => void;
  setStreakState: (state: StreakState) => void;
  setTimeUntilDeadline: (ms: number) => void;
  updateStreakFromState: (state: StreakState) => void;

  // Energy
  setEnergyData: (data: EnergyData | null) => void;
  consumeEnergy: (amount: number) => void;
  regenerateEnergy: (amount: number) => void;

  // Synapse
  setActiveLink: (link: SynapseLink | null) => void;
  setLinkRequests: (requests: SynapseLinkRequest[]) => void;

  // League
  setCurrentBracket: (bracket: LeagueBracket | null) => void;
  setUserPosition: (position: number) => void;

  // UI
  setUiOpacity: (opacity: number) => void;
  setGrayscale: (value: boolean) => void;
  setAudioEffect: (effect: AudioEffectType) => void;

  // Locale
  setLocale: (locale: SupportedLocale) => void;
  setRTL: (value: boolean) => void;

  // Lives
  setLivesData: (data: LivesData | null) => void;

  // Reset
  reset: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// INITIAL STATE
// ═══════════════════════════════════════════════════════════════════════════

const initialState: NeuralisState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,

  streakData: null,
  streakState: 'healthy',
  timeUntilDeadline: 0,

  energyData: null,
  energyState: 'full',

  activeLink: null,
  linkRequests: [],

  currentBracket: null,
  userPosition: 0,

  uiOpacity: 1,
  isGrayscale: false,
  currentAudioEffect: 'normal',

  locale: 'en-US',
  isRTL: false,

  livesData: null,
};

// ═══════════════════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════════════════

const useNeuralisStore = create<NeuralisState & NeuralisActions>((set, get) => ({
  ...initialState,

  // ─── User ────────────────────────────────────────────────────────────
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setLoading: (isLoading) => set({ isLoading }),

  // ─── Streak ──────────────────────────────────────────────────────────
  setStreakData: (streakData) => set({ streakData }),
  setStreakState: (streakState) => set({ streakState }),
  setTimeUntilDeadline: (timeUntilDeadline) => set({ timeUntilDeadline }),
  updateStreakFromState: (state: StreakState) => {
    const uiUpdates: Partial<NeuralisState> = { streakState: state };

    switch (state) {
      case 'healthy':
        uiUpdates.uiOpacity = 1;
        uiUpdates.isGrayscale = false;
        uiUpdates.currentAudioEffect = 'normal';
        break;
      case 'warning':
        uiUpdates.uiOpacity = 0.9;
        uiUpdates.isGrayscale = false;
        uiUpdates.currentAudioEffect = 'normal';
        break;
      case 'neural_decay':
        uiUpdates.uiOpacity = 0.7;
        uiUpdates.isGrayscale = false;
        uiUpdates.currentAudioEffect = 'lowpass';
        break;
      case 'critical':
        uiUpdates.uiOpacity = 0.5;
        uiUpdates.isGrayscale = true;
        uiUpdates.currentAudioEffect = 'bitcrush';
        break;
      case 'dead':
        uiUpdates.uiOpacity = 0.2;
        uiUpdates.isGrayscale = true;
        uiUpdates.currentAudioEffect = 'distorted';
        break;
    }

    set(uiUpdates);
  },

  // ─── Energy ──────────────────────────────────────────────────────────
  setEnergyData: (energyData) => set({ energyData }),
  consumeEnergy: (amount) => {
    const { energyData } = get();
    if (!energyData) return;

    const newCurrent = Math.max(0, energyData.current - amount);
    const newState: EnergyState =
      newCurrent === 0
        ? 'depleted'
        : newCurrent <= energyData.max * 0.25
          ? 'low'
          : newCurrent <= energyData.max * 0.5
            ? 'medium'
            : newCurrent <= energyData.max * 0.75
              ? 'high'
              : 'full';

    set({
      energyData: { ...energyData, current: newCurrent },
      energyState: newState,
    });
  },
  regenerateEnergy: (amount) => {
    const { energyData } = get();
    if (!energyData) return;

    const newCurrent = Math.min(energyData.max, energyData.current + amount);
    set({
      energyData: {
        ...energyData,
        current: newCurrent,
        lastRegenAt: Date.now(),
      },
    });
  },

  // ─── Synapse ─────────────────────────────────────────────────────────
  setActiveLink: (activeLink) => set({ activeLink }),
  setLinkRequests: (linkRequests) => set({ linkRequests }),

  // ─── League ──────────────────────────────────────────────────────────
  setCurrentBracket: (currentBracket) => set({ currentBracket }),
  setUserPosition: (userPosition) => set({ userPosition }),

  // ─── UI ──────────────────────────────────────────────────────────────
  setUiOpacity: (uiOpacity) => set({ uiOpacity }),
  setGrayscale: (isGrayscale) => set({ isGrayscale }),
  setAudioEffect: (currentAudioEffect) => set({ currentAudioEffect }),

  // ─── Locale ──────────────────────────────────────────────────────────
  setLocale: (locale) => set({ locale }),
  setRTL: (isRTL) => set({ isRTL }),

  // ─── Lives ───────────────────────────────────────────────────────────
  setLivesData: (livesData) => set({ livesData }),

  // ─── Reset ───────────────────────────────────────────────────────────
  reset: () => set(initialState),
}));

export default useNeuralisStore;
