/**
 * NEURALIS - Core Type Definitions
 * The Neural Architecture for Maximum Mental Performance
 */

// ═══════════════════════════════════════════════════════════════════════════
// USER & AUTHENTICATION TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type SupportedLocale = 'en-US' | 'tr-TR' | 'ar-SA' | 'ja-JP' | 'zh-CN' | 'de-DE' | 'fr-FR' | 'es-ES';

export type LeagueTier =
    | 'bronze'
    | 'silver'
    | 'gold'
    | 'sapphire'
    | 'ruby'
    | 'emerald'
    | 'amethyst'
    | 'pearl'
    | 'obsidian'
    | 'diamond';

export type SubscriptionTier = 'free' | 'premium' | 'shadow_elite';

export type VerificationStatus = 'unverified' | 'pending' | 'verified';

export type Gender = 'male' | 'female' | 'other';

export type AccountStatus = 'active' | 'suspended' | 'banned' | 'deleted';

export type StreakState = 'healthy' | 'warning' | 'neural_decay' | 'critical' | 'dead';

export type EnergyState = 'full' | 'high' | 'medium' | 'low' | 'depleted';

/**
 * Unified UserProfile — merges all fields from the app-state
 * (energy, league, settings) and auth/profile (name, birth, premium).
 * Fields unique to one context are optional so both consumers compile.
 */
export interface UserProfile {
    uid: string;
    displayName: string;
    email: string;
    avatarUrl?: string;
    createdAt: number | string;
    updatedAt: number | string;
    locale?: SupportedLocale;
    timezone?: string;
    subscription?: SubscriptionTier;

    // Neuralis Stats
    totalXP: number;
    currentEnergy?: number;
    maxEnergy?: number;
    neuralScore: number;

    // Streak Data
    currentStreak?: number;
    streakCount?: number; // Alias used by some auth flows
    longestStreak: number;
    lastActivityAt: number | string;
    streakStartedAt?: number;

    // League Data
    currentLeague?: LeagueTier;
    leaguePoints?: number;
    weeklyAccuracy?: number;
    weeklySpeed?: number;
    bracketId?: string;

    // Settings
    notificationsEnabled?: boolean;
    aggressiveWakeUpEnabled?: boolean;
    soundEnabled?: boolean;
    hapticEnabled?: boolean;
    emailVerified?: boolean;
    verificationStatus?: VerificationStatus;
    accountStatus?: AccountStatus | string;
    push_token?: string;
    expoPushToken?: string;

    // Extended Profile Fields
    firstName?: string;
    lastName?: string;
    username?: string; // @handle
    birthDate?: number | string;
    meritPoints?: number;
    onboardingCompleted?: boolean;
    levelTestCompleted?: boolean;
    isPremium?: boolean;
    premiumExpiresAt?: number | string;
    subscriptionTier?: SubscriptionTier;
    linkedUserId?: string;
    linkedUserName?: string;
    synapseStreak?: number;
    lastLoginAt?: number | string;
}

// ═══════════════════════════════════════════════════════════════════════════
// STREAK & ENERGY SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

export interface StreakData {
    userId: string;
    currentStreak: number;
    streakStartedAt: number;
    lastCompletedAt: number;
    deadlineAt: number;
    state: StreakState;

    // Neural Decay Tracking
    decayStartedAt?: number;
    mercyUsedToday: boolean;
    totalMerciesUsed: number;

    // History
    streakHistory: StreakHistoryEntry[];
}

export interface StreakHistoryEntry {
    date: string; // YYYY-MM-DD
    completed: boolean;
    energySpent: number;
    tasksCompleted: number;
    mercyUsed: boolean;
}

export interface EnergyData {
    userId: string;
    current: number;
    max: number;
    lastRegenAt: number;
    regenRatePerHour: number;
    bonusEnergy: number;
}

// LIVES / LIVES SYSTEM
export interface LivesData {
    userId?: string;
    current: number;
    max: number;
    lastUpdate: number; // timestamp ms
    refillIntervalMinutes?: number; // minutes per life refill
}

// ═══════════════════════════════════════════════════════════════════════════
// SYNAPSE LINKS (SOCIAL INTERDEPENDENCY)
// ═══════════════════════════════════════════════════════════════════════════

export type SynapseLinkStatus = 'pending' | 'active' | 'broken' | 'dissolved';

export interface SynapseLink {
    id: string;
    createdAt: number | string;
    status: SynapseLinkStatus;

    // User A
    userAId: string;
    userADisplayName?: string;
    userAName?: string; // Alias
    userAStreak: number;
    userALastActivity?: number;

    // User B
    userBId: string;
    userBDisplayName?: string;
    userBName?: string; // Alias
    userBStreak: number;
    userBLastActivity?: number;

    // Shared Fate
    sharedStreak: number;
    sharedStreakStartedAt?: number;
    lastSyncAt?: number | string;
    brokenBy?: string;
    brokenAt?: number | string;
    breakReason?: 'missed_deadline' | 'manual_dissolve' | 'inactivity';
}

export interface SynapseLinkRequest {
    id: string;
    fromUserId: string;
    fromUserName: string;
    toUserId: string;
    toUserName: string;
    createdAt: number;
    expiresAt: number;
    status: 'pending' | 'accepted' | 'rejected' | 'expired';
}

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL LEAGUES & RANKING
// ═══════════════════════════════════════════════════════════════════════════

export interface LeagueBracket {
    id: string;
    tier: LeagueTier;
    weekStartedAt: number;
    weekEndsAt: number;
    participants: BracketParticipant[];
    maxParticipants: number; // 30
}

export interface BracketParticipant {
    userId: string;
    displayName: string;
    avatarUrl?: string;
    rankPoints: number;
    weeklyAccuracy: number;
    weeklySpeed: number;
    streakBonus: number;
    position: number;
    promotionZone: boolean; // Top 3
    demotionZone: boolean;  // Bottom 3
}

export interface LeagueConfig {
    tier: LeagueTier;
    displayName: string;
    minPoints: number;
    maxPoints: number;
    color: string;
    icon: string;
    multiplier: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// CHALLENGES & TASKS
// ═══════════════════════════════════════════════════════════════════════════

export type TaskDifficulty = 'easy' | 'medium' | 'hard' | 'nightmare' | 'mercy';

export type TaskCategory = 'logic' | 'memory' | 'math' | 'pattern' | 'verbal' | 'spatial';

export interface Task {
    id: string;
    category: TaskCategory;
    difficulty: TaskDifficulty;
    question: string;
    options?: string[];
    correctAnswer: string;
    explanation: string;
    timeLimit: number; // seconds
    xpReward: number;
    energyCost: number;

    // Localization
    translations: Record<SupportedLocale, TaskTranslation>;
}

export interface TaskTranslation {
    question: string;
    options?: string[];
    correctAnswer: string;
    explanation: string;
}

export interface TaskAttempt {
    taskId: string;
    userId: string;
    startedAt: number;
    completedAt?: number;
    answer?: string;
    isCorrect?: boolean;
    timeTaken?: number;
    xpEarned?: number;
}

export interface MercyChallenge extends Task {
    isMercy: true;
    streakAtRisk: number;
    timeLimit: 60; // 60 seconds for mercy
}

// ═══════════════════════════════════════════════════════════════════════════
// DOPAMINE MONITORING (ANTI-BRAIN-ROT)
// ═══════════════════════════════════════════════════════════════════════════

export interface ScreenTimeData {
    userId: string;
    date: string; // YYYY-MM-DD
    totalScreenTime: number; // minutes
    brainRotApps: BrainRotAppUsage[];
    productiveApps: AppUsage[];
    neuralisTime: number;
    wakeUpTriggered: boolean;
    wakeUpCount: number;
}

export interface BrainRotAppUsage {
    appId: string;
    appName: string;
    usageMinutes: number;
    triggeredWakeUp: boolean;
}

export interface AppUsage {
    appId: string;
    appName: string;
    usageMinutes: number;
}

export const BRAIN_ROT_APPS = [
    'com.zhiliaoapp.musically', // TikTok
    'com.instagram.android',
    'com.facebook.katana',
    'com.snapchat.android',
    'com.twitter.android',
    'com.reddit.frontpage',
    'com.ss.android.ugc.trill', // TikTok alternative
] as const;

// ═══════════════════════════════════════════════════════════════════════════
// AI SHADOW TUTOR
// ═══════════════════════════════════════════════════════════════════════════

export type AIProvider = 'claude' | 'gpt4o';

export interface AITutorSession {
    id: string;
    userId: string;
    taskId: string;
    provider: AIProvider;
    startedAt: number;

    messages: AITutorMessage[];
    neuralPathExplained: boolean;
    tokensUsed: number;
}

export interface AITutorMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
}

export interface NeuralPathAnalysis {
    taskId: string;
    userAnswer: string;
    correctAnswer: string;
    errorType: 'conceptual' | 'calculation' | 'misread' | 'time_pressure' | 'unknown';
    explanation: string;
    steps: NeuralPathStep[];
    recommendations: string[];
}

export interface NeuralPathStep {
    stepNumber: number;
    description: string;
    isUserMistake: boolean;
    correction?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// AUDIO SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

export type AudioEffectType = 'normal' | 'lowpass' | 'bitcrush' | 'fade' | 'distorted';

export interface AudioConfig {
    effectType: AudioEffectType;
    volume: number; // 0-1
    lowpassFrequency?: number; // Hz
    bitcrushDepth?: number; // bits
    fadeProgress?: number; // 0-1
}

export interface NotificationSound {
    id: string;
    name: string;
    uri: string;
    duration: number;
    forState: StreakState[];
}

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════

export type NotificationType =
    | 'streak_warning'
    | 'neural_decay'
    | 'streak_critical'
    | 'streak_dead'
    | 'synapse_danger'
    | 'wake_up_aggressive'
    | 'league_promotion'
    | 'league_demotion'
    | 'mercy_available'
    | 'daily_reminder';

export interface NeuralisNotification {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    scheduledAt: number;
    soundId?: string;
    priority: 'low' | 'normal' | 'high' | 'critical';
}

// ═══════════════════════════════════════════════════════════════════════════
// APP STATE
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
    uiOpacity: number; // For neural decay fade
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
// RE-EXPORTS FROM DOMAIN FILES
// ═══════════════════════════════════════════════════════════════════════════

export type {
    LeagueParticipant,
    LeagueState,
    LeagueInfo,
    BadgeCategory,
    Badge,
    FriendStreak,
} from './leagueTypes';
