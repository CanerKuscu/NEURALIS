/**
 * FreeTrialService — 7 Günlük Reklamsız Deneme
 * 
 * Yeni kullanıcılara 7 gün premium deneme
 * Deneme bitiminde premium satın alma ekranı
 * Deneme durumu takibi
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface TrialStatus {
    isTrialActive: boolean;
    isTrialExpired: boolean;
    hasUsedTrial: boolean;
    trialStartDate: string | null;
    trialEndDate: string | null;
    daysRemaining: number;
    isPremium: boolean;
}

export interface TrialBenefit {
    id: string;
    emoji: string;
    title: string;
    titleTr: string;
    description: string;
    descriptionTr: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// BENEFITS
// ═══════════════════════════════════════════════════════════════════════════

export const TRIAL_BENEFITS: TrialBenefit[] = [
    { id: 'no-ads', emoji: '🚫', title: 'No Ads', titleTr: 'Reklamsız', description: 'Enjoy uninterrupted learning', descriptionTr: 'Kesintisiz öğrenme deneyimi' },
    { id: 'unlimited-lessons', emoji: '♾️', title: 'Unlimited Lessons', titleTr: 'Sınırsız Ders', description: 'No daily lesson limit', descriptionTr: 'Günlük ders sınırı yok' },
    { id: 'unlimited-hearts', emoji: '❤️', title: 'Unlimited Hearts', titleTr: 'Sınırsız Can', description: 'Never run out of hearts', descriptionTr: 'Canların hiç bitmesin' },
    { id: 'ai-chat', emoji: '🤖', title: 'AI Chat Assistant', titleTr: 'AI Sohbet Asistanı', description: 'Personal AI tutor', descriptionTr: 'Kişisel AI öğretmen' },
    { id: 'exclusive-content', emoji: '⭐', title: 'Exclusive Content', titleTr: 'Özel İçerik', description: 'Premium lessons & stories', descriptionTr: 'Premium dersler ve hikayeler' },
    { id: 'streak-freeze', emoji: '🧊', title: 'Free Streak Freeze', titleTr: 'Ücretsiz Seri Dondurma', description: '1 free streak freeze per week', descriptionTr: 'Haftada 1 ücretsiz seri dondurma' },
];

const STORAGE_KEY = '@neuralis_free_trial';
const TRIAL_DURATION_DAYS = 7;

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════

class FreeTrialService {
    /** Deneme durumunu kontrol et */
    async getTrialStatus(): Promise<TrialStatus> {
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return {
                    isTrialActive: false, isTrialExpired: false,
                    hasUsedTrial: false, trialStartDate: null,
                    trialEndDate: null, daysRemaining: TRIAL_DURATION_DAYS,
                    isPremium: false,
                };
            }

            const data = JSON.parse(raw);
            const now = new Date();
            const endDate = new Date(data.trialEndDate);
            const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
            const isTrialActive = daysRemaining > 0 && !data.isPremium;
            const isTrialExpired = daysRemaining === 0 && !data.isPremium;

            return {
                isTrialActive: isTrialActive || data.isPremium,
                isTrialExpired,
                hasUsedTrial: true,
                trialStartDate: data.trialStartDate,
                trialEndDate: data.trialEndDate,
                daysRemaining,
                isPremium: data.isPremium || false,
            };
        } catch {
            return {
                isTrialActive: false, isTrialExpired: false,
                hasUsedTrial: false, trialStartDate: null,
                trialEndDate: null, daysRemaining: TRIAL_DURATION_DAYS,
                isPremium: false,
            };
        }
    }

    /** Denemeyi başlat */
    async startTrial(): Promise<TrialStatus> {
        const status = await this.getTrialStatus();
        if (status.hasUsedTrial) {
            throw new Error('Trial already used');
        }

        const now = new Date();
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() + TRIAL_DURATION_DAYS);

        const data = {
            trialStartDate: now.toISOString(),
            trialEndDate: endDate.toISOString(),
            isPremium: false,
        };

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return this.getTrialStatus();
    }

    /** Premium satın alma (IAP callback) */
    async activatePremium(): Promise<void> {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const data = raw ? JSON.parse(raw) : { trialStartDate: new Date().toISOString(), trialEndDate: new Date().toISOString() };
        data.isPremium = true;
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    /** Premium iptal */
    async deactivatePremium(): Promise<void> {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
            const data = JSON.parse(raw);
            data.isPremium = false;
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
    }

    /** Kullanıcının premium/trial erişimi var mı */
    async hasAccess(): Promise<boolean> {
        const status = await this.getTrialStatus();
        return status.isTrialActive || status.isPremium;
    }
}

export const freeTrialService = new FreeTrialService();
export default freeTrialService;
