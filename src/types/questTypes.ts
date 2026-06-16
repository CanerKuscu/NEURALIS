/**
 * NEURALIS - Quest Types
 * Duolingo-style quest system types
 */

// ═══════════════════════════════════════════════════════════════════════════
// QUEST TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type QuestStatus = 'active' | 'completed' | 'expired' | 'locked';
export type QuestType = 'monthly' | 'friend' | 'daily';

// Base Quest Interface
export interface BaseQuest {
  id: string;
  type: QuestType;
  title: string;
  description: string;
  currentProgress: number;
  targetProgress: number;
  xpReward: number;
  status: QuestStatus;
  expiresAt: number; // timestamp
  createdAt: number;
}

// Monthly Quest
export interface MonthlyQuest extends BaseQuest {
  type: 'monthly';
  monthName: string; // "January", "February", etc.
  questPointsReward: number;
}

// Friend Quest
export interface FriendQuest extends BaseQuest {
  type: 'friend';
  partnerId: string;
  partnerName: string;
  partnerAvatar?: string;
  partnerProgress: number;
  canNudge: boolean; // Is "Nudge" button active
  lastNudgeAt?: number;
}

// Daily Quest
export interface DailyQuest extends BaseQuest {
  type: 'daily';
  icon: string; // lucide icon name
  isBonus?: boolean; // Is it a bonus quest
}

// Union type for all quests
export type Quest = MonthlyQuest | FriendQuest | DailyQuest;

// ═══════════════════════════════════════════════════════════════════════════
// QUEST ACTIONS
// ═══════════════════════════════════════════════════════════════════════════

export interface NudgeAction {
  questId: string;
  fromUserId: string;
  toUserId: string;
  sentAt: number;
}

export interface GiftAction {
  questId: string;
  fromUserId: string;
  toUserId: string;
  giftType: 'heart' | 'xp_boost';
  amount: number;
  sentAt: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// QUEST STORE STATE
// ═══════════════════════════════════════════════════════════════════════════

export interface QuestsState {
  monthlyQuest: MonthlyQuest | null;
  friendQuests: FriendQuest[];
  dailyQuests: DailyQuest[];
  isLoading: boolean;
  error: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export function getQuestProgress(quest: BaseQuest): number {
  if (quest.targetProgress === 0) return 0;
  return Math.min(quest.currentProgress / quest.targetProgress, 1);
}

export function getRemainingTime(expiresAt: number): {
  days: number;
  hours: number;
  minutes: number;
  formatted: string;
} {
  const now = Date.now();
  const diff = Math.max(0, expiresAt - now);

  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

  let formatted: string;
  if (days > 0) {
    formatted = `${days} DAYS`;
  } else if (hours > 0) {
    formatted = `${hours} HOURS`;
  } else {
    formatted = `${minutes} MINUTES`;
  }

  return { days, hours, minutes, formatted };
}
