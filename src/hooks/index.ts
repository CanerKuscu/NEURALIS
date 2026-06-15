/**
 * NEURALIS - Hooks Index
 * Central export for all hooks
 */

export { default as useNeuralisCore } from './useNeuralisCore';
export { useAudioEffect } from '../services/AudioService';

// User Store
export { useUserStore } from './useUserStore';

// Social Hook
export { default as useSocial } from './useSocial';

// Premium Hook
export { default as usePremium } from './usePremium';

// Neural Decay Hook
export { useNeuralDecay } from './useNeuralDecay';

// Notification System
export { useNotifications } from './useNotifications';

// Audio Decay Hook (Duolingo-style persistence)
export { useAudioDecay, DECAY_PHASES, DECAY_COLORS, TIME_THRESHOLDS } from './AudioDecayHook';
export type { DecayPhase, AudioDecayState, UseAudioDecayOptions, UseAudioDecayReturn } from './AudioDecayHook';

// Dynamic Visual Widget Hook (The Eye)
export {
    useDynamicVisualWidget,
    VISUAL_THEMES,
    getGradientColors,
    getTextColorForState,
    getBorderColorForState,
    getMascotOpacityForHours,
} from './useDynamicVisualWidget';
export type {
    VisualState,
    VisualTheme,
    WidgetAnimations,
    DynamicVisualWidgetState,
} from './useDynamicVisualWidget';
