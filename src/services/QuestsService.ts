/**
 * NEURALIS - Quests Service
 * Quest system service (currently using mock data)
 */

import {
    MonthlyQuest,
    FriendQuest,
    DailyQuest,
    QuestsState,
    getQuestProgress,
    getRemainingTime
} from '../types/questTypes';

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

function getEndOfMonth(): number {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return endOfMonth.getTime();
}

function getEndOfDay(): number {
    const now = new Date();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    return endOfDay.getTime();
}

// ═══════════════════════════════════════════════════════════════════════════
// QUESTS SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════

class QuestsService {
    /**
     * Get monthly quest for current month
     */
    async getMonthlyQuest(userId: string): Promise<MonthlyQuest> {
        // TODO: Fetch from Supabase
        const now = new Date();
        const monthName = MONTH_NAMES[now.getMonth()];

        return {
            id: `monthly_${now.getFullYear()}_${now.getMonth()}`,
            type: 'monthly',
            title: `${monthName} Quest`,
            description: 'Earn 30 Quest Points',
            currentProgress: 0,
            targetProgress: 30,
            xpReward: 500,
            questPointsReward: 30,
            status: 'active',
            expiresAt: getEndOfMonth(),
            createdAt: new Date(now.getFullYear(), now.getMonth(), 1).getTime(),
            monthName,
        };
    }

    /**
     * Get friend quests
     */
    async getFriendQuests(userId: string): Promise<FriendQuest[]> {
        // TODO: Fetch from Supabase
        return []; // No friend quests by default to avoid confusion
    }

    /**
     * Get daily quests
     */
    async getDailyQuests(userId: string): Promise<DailyQuest[]> {
        // TODO: Fetch from Supabase
        return [
            {
                id: 'daily_1',
                type: 'daily',
                title: 'Complete 2 lessons',
                description: 'Finish 2 lessons today',
                currentProgress: 0,
                targetProgress: 2,
                xpReward: 20,
                status: 'active',
                expiresAt: getEndOfDay(),
                createdAt: Date.now() - 2 * 60 * 60 * 1000,
                icon: 'book-open',
            },
            {
                id: 'daily_2',
                type: 'daily',
                title: 'Maintain Streak',
                description: 'Complete at least 1 lesson today',
                currentProgress: 0,
                targetProgress: 1,
                xpReward: 10,
                status: 'active',
                expiresAt: getEndOfDay(),
                createdAt: Date.now() - 2 * 60 * 60 * 1000,
                icon: 'flame',
            },
            {
                id: 'daily_3',
                type: 'daily',
                title: 'Practice for 5 minutes',
                description: 'Spend a total of 5 minutes practicing',
                currentProgress: 0,
                targetProgress: 5,
                xpReward: 15,
                status: 'active',
                expiresAt: getEndOfDay(),
                createdAt: Date.now() - 2 * 60 * 60 * 1000,
                icon: 'clock',
            },
        ];
    }

    /**
     * Get all quests
     */
    async getAllQuests(userId: string): Promise<QuestsState> {
        try {
            const [monthlyQuest, friendQuests, dailyQuests] = await Promise.all([
                this.getMonthlyQuest(userId),
                this.getFriendQuests(userId),
                this.getDailyQuests(userId),
            ]);

            return {
                monthlyQuest,
                friendQuests,
                dailyQuests,
                isLoading: false,
                error: null,
            };
        } catch (error: any) {
            return {
                monthlyQuest: null,
                friendQuests: [],
                dailyQuests: [],
                isLoading: false,
                error: error.message || 'Failed to load quests',
            };
        }
    }

    /**
     * Nudge a friend
     */
    async nudgeFriend(questId: string, fromUserId: string, toUserId: string): Promise<boolean> {
        // TODO: Send push notification via Supabase
        console.log(`[QuestsService] Nudging ${toUserId} for quest ${questId}`);
        return true;
    }

    /**
     * Send gift to friend
     */
    async sendGift(
        questId: string,
        fromUserId: string,
        toUserId: string,
        giftType: 'heart' | 'xp_boost'
    ): Promise<boolean> {
        // TODO: Update via Supabase
        console.log(`[QuestsService] Sending ${giftType} gift to ${toUserId}`);
        return true;
    }

    /**
     * Update quest progress
     */
    async updateProgress(questId: string, userId: string, progress: number): Promise<boolean> {
        // TODO: Update via Supabase
        console.log(`[QuestsService] Updating quest ${questId} progress to ${progress}`);
        return true;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const questsService = new QuestsService();
export default questsService;
