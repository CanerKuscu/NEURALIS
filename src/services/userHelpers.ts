import type { UserProfile, FriendRequest, SynapseLink } from '../types/user';

export function userDocumentToProfile(doc: any): UserProfile {
  return {
    uid: doc.id || doc.uid || '',
    email: doc.email || '',
    firstName: doc.firstName || doc.first_name || '',
    lastName: doc.lastName || doc.last_name || '',
    displayName:
      doc.displayName ||
      `${doc.firstName || ''} ${doc.lastName || ''}`.trim() ||
      doc.display_name ||
      '',
    birthDate: doc.birthDate || doc.birth_date || 0,
    avatarUrl: doc.avatarUrl || doc.avatar_url || undefined,
    meritPoints: doc.meritPoints ?? doc.merit_points ?? 0,
    streakCount: doc.streakCount ?? doc.streak_count ?? 0,
    longestStreak: doc.longestStreak ?? doc.longest_streak ?? 0,
    totalXP: doc.totalXP ?? doc.total_xp ?? 0,
    neuralScore: doc.neuralScore ?? doc.neural_score ?? 0,
    onboardingCompleted: doc.onboardingCompleted ?? doc.onboarding_completed ?? false,
    levelTestCompleted: doc.levelTestCompleted ?? doc.level_test_completed ?? false,
    isPremium: doc.isPremium ?? doc.is_premium ?? false,
    premiumExpiresAt: doc.premiumExpiresAt ?? doc.premium_expires_at,
    subscriptionTier: doc.subscriptionTier ?? doc.subscription_tier ?? 'free',
    linkedUserId: doc.linkedUserId ?? doc.linked_user_id,
    linkedUserName: doc.linkedUserName ?? doc.linked_user_name,
    synapseStreak: doc.synapseStreak ?? doc.synapse_streak ?? 0,
    accountStatus: doc.accountStatus ?? doc.account_status ?? 'active',
    createdAt: doc.createdAt ?? doc.created_at ?? Date.now(),
    updatedAt: doc.updatedAt ?? doc.updated_at ?? Date.now(),
    lastLoginAt: doc.lastLoginAt ?? doc.last_login_at ?? Date.now(),
    lastActivityAt: doc.lastActivityAt ?? doc.last_activity_at ?? Date.now(),
  } as UserProfile;
}

export function friendRequestDocToModel(doc: any): FriendRequest {
  return {
    id: doc.id,
    fromUserId: doc.fromUserId || doc.from_user_id,
    fromUserName: doc.fromUserName || doc.from_user_name,
    fromUserAvatar: doc.fromUserAvatar || doc.from_user_avatar,
    toUserId: doc.toUserId || doc.to_user_id,
    toUserName: doc.toUserName || doc.to_user_name,
    toUserAvatar: doc.toUserAvatar || doc.to_user_avatar,
    status: doc.status,
    message: doc.message,
    createdAt: doc.createdAt || doc.created_at,
    expiresAt: doc.expiresAt || doc.expires_at,
    respondedAt: doc.respondedAt || doc.responded_at,
  } as FriendRequest;
}

export function synapseLinkDocToModel(doc: any): SynapseLink {
  return {
    id: doc.id,
    userAId: doc.userAId || doc.user_a_id,
    userAName: doc.userAName || doc.user_a_name,
    userAStreak: doc.userAStreak ?? doc.user_a_streak ?? 0,
    userBId: doc.userBId || doc.user_b_id,
    userBName: doc.userBName || doc.user_b_name,
    userBStreak: doc.userBStreak ?? doc.user_b_streak ?? 0,
    sharedStreak: doc.sharedStreak ?? doc.shared_streak ?? 0,
    status: doc.status,
    createdAt: doc.createdAt || doc.created_at,
    lastSyncAt: doc.lastSyncAt || doc.last_sync_at,
    brokenBy: doc.brokenBy || doc.broken_by,
    brokenAt: doc.brokenAt || doc.broken_at,
    breakReason: doc.breakReason || doc.break_reason,
  } as SynapseLink;
}
