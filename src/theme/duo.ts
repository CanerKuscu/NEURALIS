/**
 * NEURALIS - Duo Style Theme
 * Modern Zen Light Theme Values
 */

export const DUO_COLORS = {
  // Primary - Duolingo inspired but Modern Zen
  green: '#2ECC71', // Vitality Green (Primary)
  greenDark: '#27AE60',

  blue: '#3498DB',
  purple: '#9B59B6',
  orange: '#E67E22', // Fox Orange
  red: '#FF4B4B', // Hearts/Error
  gold: '#FFC800',

  // Backgrounds - Light Theme
  bg: '#F8F9FA', // Soft Pearl White
  bgCard: '#FFFFFF', // Pure White Cards
  bgSecondary: '#EEF2F6',

  // Text
  textPrimary: '#2C3E50',
  textSecondary: '#7F8C8D',
  textMuted: '#BDC3C7',
  textWhite: '#FFFFFF',

  // Borders
  border: '#E8ECEF',
  borderLight: '#F0F3F5',
};

export const DUO_SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const DUO_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const DUO_TYPO = {
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
};

export const DUO_SHADOW = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};
