/**
 * NEURALIS - Modern Zen Theme
 * Personalized AI Learning Platform
 *
 * Mascot: Shadow Fox (Wise Fox) 🦊
 * Design: Clean, Modern, Dopamine-Driven
 */

// ═══════════════════════════════════════════════════════════════════════════
// COLOR PALETTE
// ═══════════════════════════════════════════════════════════════════════════

export const PALETTE = {
  // Base Colors
  green: '#2ECC71',
  greenDark: '#27AE60',
  greenLight: '#58D68D',
  blue: '#3498DB',
  blueDark: '#2980B9',
  orange: '#E67E22',
  orangeDark: '#D35400',
  red: '#FF4B4B',
  redDark: '#EA2B2B',
  gold: '#FFC800',

  // Neutrals
  white: '#FFFFFF',
  offWhite: '#F8F9FA',
  gray100: '#F0F2F5',
  gray200: '#E8ECEF',
  gray300: '#BDC3C7',
  gray400: '#95A5A6',
  gray500: '#7F8C8D',
  gray800: '#2C3E50',
  black: '#1A1A2E',
  blackPure: '#000000',
  darkSurface: '#16213E',
};

const LightColors = {
  primary: PALETTE.green,
  primaryDark: PALETTE.greenDark,
  secondary: PALETTE.blue,
  warning: PALETTE.gold,
  error: PALETTE.red,
  background: {
    primary: PALETTE.offWhite,
    secondary: PALETTE.white,
    tertiary: PALETTE.gray100,
  },
  text: {
    primary: PALETTE.gray800,
    secondary: PALETTE.gray500,
    tertiary: PALETTE.gray400,
    muted: PALETTE.gray300,
    light: PALETTE.white,
    accent: PALETTE.orange,
  },
  border: {
    light: 'rgba(0,0,0,0.08)',
    medium: 'rgba(0,0,0,0.15)',
  },
  surface: {
    card: PALETTE.white,
  },
  fox: {
    orange: PALETTE.orange,
    orangeDark: PALETTE.orangeDark,
  },
  xp: {
    gold: PALETTE.gold,
    goldGlow: 'rgba(255, 200, 0, 0.4)',
  },
  streak: {
    fire: '#FF6B35',
    fireGlow: 'rgba(255, 107, 53, 0.4)',
  },
  hearts: {
    full: PALETTE.red,
    empty: PALETTE.gray300,
  },
};

const DarkColors = {
  primary: PALETTE.green,
  primaryDark: PALETTE.greenDark,
  secondary: PALETTE.blue,
  warning: PALETTE.gold,
  error: PALETTE.red,
  background: {
    primary: PALETTE.black,
    secondary: PALETTE.darkSurface,
    tertiary: '#0F3460',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#A0A0A0',
    tertiary: '#808080',
    muted: '#606060',
    light: '#1A1A2E',
    accent: PALETTE.orange,
  },
  border: {
    light: 'rgba(255,255,255,0.1)',
    medium: 'rgba(255,255,255,0.2)',
  },
  surface: {
    card: PALETTE.darkSurface,
  },
  fox: {
    orange: PALETTE.orange,
    orangeDark: PALETTE.orangeDark,
  },
  xp: {
    gold: PALETTE.gold,
    goldGlow: 'rgba(255, 200, 0, 0.4)',
  },
  streak: {
    fire: '#FF6B35',
    fireGlow: 'rgba(255, 107, 53, 0.4)',
  },
  hearts: {
    full: PALETTE.red,
    empty: '#606060',
  },
};

export const COLORS = LightColors; // Default backward compatibility

export const THEMES = {
  light: LightColors,
  dark: DarkColors,
};

// ═══════════════════════════════════════════════════════════════════════════
// SPACING
// ═══════════════════════════════════════════════════════════════════════════

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// BORDER RADIUS
// ═══════════════════════════════════════════════════════════════════════════

export const RADIUS = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  xxxl: 32,
  pill: 999,
  full: 9999,
  // Modern Zen - Yüksek Yuvarlama (20px+)
  card: 20,
  button: 24,
  input: 16,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// TYPOGRAPHY
// ═══════════════════════════════════════════════════════════════════════════

export const TYPOGRAPHY = {
  fontFamily: {
    regular: 'System',
    bold: 'System',
  },

  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    title: 40,
    hero: 48,
  },

  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    black: '900' as const,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// SHADOWS
// ═══════════════════════════════════════════════════════════════════════════

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 4,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  }),
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATION
// ═══════════════════════════════════════════════════════════════════════════

export const ANIMATION = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  spring: {
    damping: 15,
    stiffness: 150,
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// LESSON CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════

export const CATEGORIES = {
  languages: {
    id: 'languages',
    name: 'Diller',
    icon: '🌍',
    color: '#1CB0F6',
    topics: ['İngilizce', 'Almanca', 'Japonca', 'İspanyolca'],
  },
  technology: {
    id: 'technology',
    name: 'Teknoloji',
    icon: '💻',
    color: '#9B59B6',
    topics: ['Python', 'JavaScript', 'AI/ML', 'Web Development'],
  },
  finance: {
    id: 'finance',
    name: 'Finans',
    icon: '💰',
    color: '#58CC02',
    topics: ['Yatırım', 'Kripto', 'Borsa', 'Kişisel Finans'],
  },
  science: {
    id: 'science',
    name: 'Bilim',
    icon: '🔬',
    color: '#FF9600',
    topics: ['Fizik', 'Kimya', 'Biyoloji', 'Astronomi'],
  },
  history: {
    id: 'history',
    name: 'Tarih',
    icon: '📜',
    color: '#CD7F32',
    topics: ['Dünya Tarihi', 'Türk Tarihi', 'Antik Uygarlıklar'],
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// LEAGUE/RANKING CONFIG
// ═══════════════════════════════════════════════════════════════════════════

export const LEAGUE_CONFIG = {
  participantsPerBracket: 30, // Daha yönetilebilir boyut

  // Optimal ranking distribution
  promotion: {
    percentage: 0.15, // Top 15% promotes (4-5 kişi)
    zone: 'promotion',
    color: COLORS.primary,
  },
  demotion: {
    percentage: 0.2, // Bottom 20% demotes (6 kişi)
    zone: 'demotion',
    color: COLORS.error,
  },
  // Middle 65% stays in same league

  tiers: [
    { id: 'bronze', name: 'Bronze', icon: '🥉', minXP: 0 },
    { id: 'silver', name: 'Silver', icon: '🥈', minXP: 500 },
    { id: 'gold', name: 'Gold', icon: '🥇', minXP: 2000 },
    { id: 'sapphire', name: 'Sapphire', icon: '💎', minXP: 5000 },
    { id: 'ruby', name: 'Ruby', icon: '❤️‍🔥', minXP: 8000 },
    { id: 'emerald', name: 'Emerald', icon: '🟢', minXP: 12000 },
    { id: 'amethyst', name: 'Amethyst', icon: '🔮', minXP: 18000 },
    { id: 'pearl', name: 'Pearl', icon: '🩩', minXP: 25000 },
    { id: 'obsidian', name: 'Obsidian', icon: '🖤', minXP: 35000 },
    { id: 'diamond', name: 'Diamond', icon: '💠', minXP: 50000 },
  ],
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// LIVES/HEARTS CONFIG
// 5 hearts, full regen in 24h (~4.8h per heart)
// ═══════════════════════════════════════════════════════════════════════════

export const LIVES_CONFIG = {
  maxLives: 5,
  regenerationMinutes: 288, // 24h / 5 hearts = 4.8h = 288 minutes per heart
  lossPerWrongAnswer: 1,
  lossPerLesson: 1, // 1 heart consumed when generating an AI lesson
  adRewardLives: 1, // 1 heart earned by watching an ad
  premiumUnlimited: true,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT DEFAULT
// ═══════════════════════════════════════════════════════════════════════════

const theme = {
  colors: COLORS,
  spacing: SPACING,
  radius: RADIUS,
  typography: TYPOGRAPHY,
  shadows: SHADOWS,
  animation: ANIMATION,
  categories: CATEGORIES,
  leagueConfig: LEAGUE_CONFIG,
  livesConfig: LIVES_CONFIG,
};

export default theme;
