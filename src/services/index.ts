// ...existing code...

// AI services removed or replaced where applicable
/**
 * NEURALIS - Services Index
 * Central export for all services
 */

export {
  default as streakService,
  calculateStreakState,
  formatTimeRemaining,
} from './StreakService';
export { default as audioService, useAudioEffect } from './AudioService';
export { default as synapseService } from './SynapseService';
export { default as rankingService, calculateRankPoints, LEAGUE_CONFIGS } from './RankingService';
export { default as aiTutorService } from './AITutorService';
export { default as dopamineMonitorService } from './DopamineMonitorService';

// Notification System - Localization
export { localizationService, SUPPORTED_LOCALES } from './LocalizationService';
export type {
  NotificationLocale,
  ShadowFoxStatus,
  NotificationSeverity,
} from './LocalizationService';

// Notification System - Notification Engine
export * from './AuthService';
export * from './LessonSeriesService';
export * from './LocalizationService';
export * from './NotificationService';
export * from './DeepLinkService';
export * from './AchievementService';
export * from './DuelService';
export * from './userHelpers';
export { default as logger } from '../utils/logger';

// New Services
export { dailyLessonService, DAILY_LESSON_CONFIG } from './DailyLessonService';
export type { DailyLessonData } from './DailyLessonService';
export { voiceShadowService, VOICE_TOPICS, VOICE_LANGUAGES } from './VoiceShadowService';
export type { VoiceSession, VoiceShadowConfig, VoiceMessage } from './VoiceShadowService';
export {
  foxCosmeticService,
  FOX_COSMETICS,
  getCosmeticsByCategory,
  getCosmeticById,
  getRarityColor,
  getRarityLabel,
} from './FoxCosmeticService';
export type { FoxCosmetic, FoxOutfit, CosmeticCategory } from './FoxCosmeticService';
export { brainMapService } from './BrainMapService';
export type { BrainMapData, SkillNode, SkillHealth } from './BrainMapService';

// Feature Expansion Services
export { spacedRepetitionService } from './SpacedRepetitionService';
export { dailyCardService, CARD_CATEGORIES as DAILY_CATEGORIES } from './DailyCardService';
export { storyModeService, STORY_WORLDS } from './StoryModeService';
export { audioLessonService, AUDIO_LESSONS } from './AudioLessonService';
export { tournamentService } from './TournamentService';
export { chatService, STICKER_PACKS } from './ChatService';
export { shareCardService } from './ShareCardService';
export { analyticsService } from './AnalyticsService';
export { aiChatService, QUICK_PROMPTS } from './AIChatService';
export { freeTrialService, TRIAL_BENEFITS } from './FreeTrialService';
export { accessibilityService } from './AccessibilityService';
