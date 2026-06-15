/**
 * NEURALIS - Modern Zen Light Theme
 * Duolingo-Style Design System
 */

export const COLORS = {
    // Modern Zen Colors
    cardBg: '#FFFFFF',
    cardShadow: 'rgba(0, 0, 0, 0.08)',
    buttonGradient: ['#2ECC71', '#27AE60'],

    // Primary Palette - Modern Zen
    pureWhite: '#FFFFFF',
    softWhite: '#F8F9FA',
    primary: '#2ECC71',        // Vitality Green
    primaryDark: '#27AE60',
    foxOrange: '#E67E22',      // Fox accent
    foxOrangeDark: '#D35400',

    // Legacy aliases (renamed to avoid confusion)
    /** @deprecated Use `softWhite` instead */
    pureBlack: '#F8F9FA',      // NOTE: This is actually a light background (legacy name kept for compat)
    /** @deprecated Use `primary` instead */
    neonPurple: '#2ECC71',     // NOTE: This is actually green (legacy name kept for compat)
    royalGold: '#FFC800',

    // Purple scale (used by ShadowFox, StreakTimer, SynapseLink, LeagueCard)
    purple: {
        50: '#F3E5F5',
        100: '#E1BEE7',
        200: '#CE93D8',
        300: '#BA68C8',
        400: '#AB47BC',
        500: '#9C27B0',
        600: '#8E24AA',
        700: '#7B1FA2',
        800: '#6A1B9A',
        900: '#4A148C',
    },

    // Gold accent
    gold: '#FFC800',

    // Extended Green Scale (replacing purple)
    green: {
        50: '#EAFAF1',
        100: '#D5F5E3',
        200: '#ABEBC6',
        300: '#82E0AA',
        400: '#58D68D',
        500: '#2ECC71',
        600: '#27AE60',
        700: '#1E8449',
        800: '#196F3D',
        900: '#145A32',
    },

    // Gray Scale
    gray: {
        50: '#F8F9FA',
        100: '#EEF2F6',
        200: '#E8ECEF',
        300: '#DDE3E9',
        400: '#BDC3C7',
        500: '#7F8C8D',
        600: '#5D6D7E',
        700: '#4A5568',
        800: '#2C3E50',
        900: '#1A252F',
    },

    // Semantic Colors
    success: '#2ECC71',
    warning: '#FFC800',
    danger: '#FF4B4B',
    critical: '#EA2B2B',
    info: '#3498DB',

    // Streak States
    streak: {
        healthy: '#2ECC71',
        warning: '#FFC800',
        neuralDecay: '#E67E22',
        critical: '#FF4B4B',
        dead: '#BDC3C7',
    },

    // Energy States
    energy: {
        full: '#2ECC71',
        high: '#58D68D',
        medium: '#FFC800',
        low: '#FF4B4B',
        depleted: '#BDC3C7',
    },

    // League Colors
    league: {
        bronze: '#CD7F32',
        silver: '#C0C0C0',
        gold: '#FFD700',
        sapphire: '#0F52BA',
        ruby: '#E0115F',
        emerald: '#50C878',
        amethyst: '#9966CC',
        pearl: '#FDEEF4',
        obsidian: '#3D3D3D',
        diamond: '#B9F2FF',
    },

    // Glass/Overlay - Light versions
    glass: {
        light: 'rgba(255, 255, 255, 0.9)',
        medium: 'rgba(255, 255, 255, 0.95)',
        dark: 'rgba(0, 0, 0, 0.3)',
        green: 'rgba(46, 204, 113, 0.1)',
        gold: 'rgba(255, 200, 0, 0.1)',
        purple: 'rgba(156, 39, 176, 0.1)',
    },

    // Borders - Light versions
    border: {
        subtle: '#EEF2F6',
        normal: '#E8ECEF',
        strong: '#DDE3E9',
        green: 'rgba(46, 204, 113, 0.3)',
        gold: 'rgba(255, 200, 0, 0.3)',
        purple: 'rgba(156, 39, 176, 0.3)',
    },
} as const;

export const SHADOWS = {
    none: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 8,
    },
    glow: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    goldGlow: {
        shadowColor: COLORS.gold,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 6,
    },
} as const;

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
} as const;

export const BORDER_RADIUS = {
    none: 0,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
} as const;

export const TYPOGRAPHY = {
    fontFamily: {
        regular: 'System',
        medium: 'System',
        semibold: 'System',
        bold: 'System',
        mono: 'monospace',
    },
    fontSize: {
        xs: 10,
        sm: 12,
        md: 14,
        lg: 16,
        xl: 18,
        xxl: 24,
        xxxl: 32,
        display: 48,
    },
    lineHeight: {
        tight: 1.1,
        normal: 1.4,
        relaxed: 1.6,
    },
    letterSpacing: {
        tight: -0.5,
        normal: 0,
        wide: 0.5,
        wider: 1,
    },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// SEMANTIC COLORS ALIAS - Used by AppNavigator
// ═══════════════════════════════════════════════════════════════════════════

export const colors = {
    primary: {
        neonCyan: '#2ECC71',     // CHANGED: Now green
        neonPurple: '#2ECC71',   // CHANGED: Now green
        royalGold: '#FFC800',
    },
    background: {
        primary: '#F8F9FA',      // CHANGED: Light background
        secondary: '#FFFFFF',    // CHANGED: White
        tertiary: '#EEF2F6',     // CHANGED: Light gray
    },
    text: {
        primary: '#2C3E50',      // CHANGED: Dark text
        secondary: '#7F8C8D',    // CHANGED: Gray text
        muted: '#BDC3C7',        // CHANGED: Light gray
    },
    border: {
        default: '#E8ECEF',
        dark: '#DDE3E9',
        light: '#EEF2F6',
    },
    status: {
        success: COLORS.success,
        warning: COLORS.warning,
        error: COLORS.danger,
        info: COLORS.info,
    },
} as const;

export type ColorKey = keyof typeof COLORS;
export type SpacingKey = keyof typeof SPACING;
export type BorderRadiusKey = keyof typeof BORDER_RADIUS;

// Shadow Fox Configuration
export const SHADOW_FOX_CONFIG = {
    happyColor: COLORS.primary,
    warningColor: COLORS.foxOrange,
    criticalColor: COLORS.danger,
    deadColor: COLORS.gray[500],
    eyeColor: '#FFFFFF',
    foxAccent: COLORS.foxOrange,
    states: {
        healthy: { opacity: 1.0, glowIntensity: 0.8, animation: 'idle' as const },
        warning: { opacity: 0.85, glowIntensity: 0.5, animation: 'alert' as const },
        neural_decay: { opacity: 0.6, glowIntensity: 0.3, animation: 'fade' as const },
        critical: { opacity: 0.4, glowIntensity: 0.1, animation: 'flicker' as const },
        dead: { opacity: 0.2, glowIntensity: 0, animation: 'none' as const },
    },
} as const;
