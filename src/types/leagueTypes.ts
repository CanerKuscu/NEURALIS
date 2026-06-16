/**
 * NEURALIS - League Types
 * Duolingo-style league/ranking system types
 */

import type { LeagueTier } from './index';
export type { LeagueTier };

// ═══════════════════════════════════════════════════════════════════════════
// LEAGUE INFO
// ═══════════════════════════════════════════════════════════════════════════

export interface LeagueInfo {
  tier: LeagueTier;
  name: string;
  turkishName: string;
  color: string;
  iconColor: string;
  minXPToPromote: number; // Weekly XP required to promote to the next league
}

// League definitions
export const LEAGUES: Record<LeagueTier, LeagueInfo> = {
  bronze: {
    tier: 'bronze',
    name: 'Bronze',
    turkishName: 'Bronze',
    color: '#CD7F32',
    iconColor: '#CD7F32',
    minXPToPromote: 50,
  },
  silver: {
    tier: 'silver',
    name: 'Silver',
    turkishName: 'Silver',
    color: '#C0C0C0',
    iconColor: '#C0C0C0',
    minXPToPromote: 100,
  },
  gold: {
    tier: 'gold',
    name: 'Gold',
    turkishName: 'Gold',
    color: '#FFD700',
    iconColor: '#FFD700',
    minXPToPromote: 200,
  },
  sapphire: {
    tier: 'sapphire',
    name: 'Sapphire',
    turkishName: 'Sapphire',
    color: '#0F52BA',
    iconColor: '#0F52BA',
    minXPToPromote: 350,
  },
  ruby: {
    tier: 'ruby',
    name: 'Ruby',
    turkishName: 'Ruby',
    color: '#E0115F',
    iconColor: '#E0115F',
    minXPToPromote: 500,
  },
  emerald: {
    tier: 'emerald',
    name: 'Emerald',
    turkishName: 'Emerald',
    color: '#50C878',
    iconColor: '#50C878',
    minXPToPromote: 750,
  },
  amethyst: {
    tier: 'amethyst',
    name: 'Amethyst',
    turkishName: 'Amethyst',
    color: '#9966CC',
    iconColor: '#9966CC',
    minXPToPromote: 1000,
  },
  pearl: {
    tier: 'pearl',
    name: 'Pearl',
    turkishName: 'Pearl',
    color: '#FDEEF4',
    iconColor: '#E8CCD7',
    minXPToPromote: 1500,
  },
  obsidian: {
    tier: 'obsidian',
    name: 'Obsidian',
    turkishName: 'Obsidian',
    color: '#3D3D3D',
    iconColor: '#1A1A2E',
    minXPToPromote: 2000,
  },
  diamond: {
    tier: 'diamond',
    name: 'Diamond',
    turkishName: 'Diamond',
    color: '#B9F2FF',
    iconColor: '#00CED1',
    minXPToPromote: 9999, // Highest league
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// LEAGUE PARTICIPANT
// ═══════════════════════════════════════════════════════════════════════════

export interface LeagueParticipant {
  id: string;
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  countryCode?: string; // "TR", "US", etc.
  countryFlag?: string; // "🇹🇷", "🇺🇸", etc.
  weeklyXP: number;
  streak?: number;
  isPremium?: boolean;
  isCurrentUser?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// LEAGUE STATE
// ═══════════════════════════════════════════════════════════════════════════

export interface LeagueState {
  currentTier: LeagueTier;
  participants: LeagueParticipant[];
  currentUserRank: number;
  promotionZoneEnd: number; // Top N users get promoted
  relegationZoneStart: number; // Bottom N users get relegated
  weekEndsAt: number; // timestamp
  isLoading: boolean;
  error: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export function getLeagueInfo(tier: LeagueTier): LeagueInfo {
  return LEAGUES[tier];
}

export function getNextLeague(tier: LeagueTier): LeagueTier | null {
  const tiers: LeagueTier[] = [
    'bronze',
    'silver',
    'gold',
    'sapphire',
    'ruby',
    'emerald',
    'amethyst',
    'pearl',
    'obsidian',
    'diamond',
  ];
  const index = tiers.indexOf(tier);
  if (index < tiers.length - 1) {
    return tiers[index + 1];
  }
  return null;
}

export function getPreviousLeague(tier: LeagueTier): LeagueTier | null {
  const tiers: LeagueTier[] = [
    'bronze',
    'silver',
    'gold',
    'sapphire',
    'ruby',
    'emerald',
    'amethyst',
    'pearl',
    'obsidian',
    'diamond',
  ];
  const index = tiers.indexOf(tier);
  if (index > 0) {
    return tiers[index - 1];
  }
  return null;
}

export function isInPromotionZone(rank: number, promotionZoneEnd: number): boolean {
  return rank <= promotionZoneEnd;
}

export function isInRelegationZone(rank: number, relegationZoneStart: number): boolean {
  return rank >= relegationZoneStart;
}

// ═══════════════════════════════════════════════════════════════════════════
// BADGE TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type BadgeCategory = 'streak' | 'xp' | 'league' | 'social' | 'special';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji or image URL
  category: BadgeCategory;
  earnedAt?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// ═══════════════════════════════════════════════════════════════════════════
// FRIEND STREAK TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface FriendStreak {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar?: string;
  streakDays: number;
  lastActivityAt: number;
  isActive: boolean;
}
