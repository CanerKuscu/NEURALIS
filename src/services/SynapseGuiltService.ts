/**
 * NEURALIS - Synapse Guilt Service (Suçluluk)
 * Social interdependency notification system
 * 
 * @description When User A's streak enters decay phase,
 * notify User B (linked partner) about the risk to shared synapse
 */

// Supabase or other backend logic should be used where necessary.
import * as Notifications from './safeNotifications';

import { supabase } from '../config/supabase';
import { SynapseLink, UserProfile } from '../types';
import { localizationService, NotificationLocale } from './LocalizationService';

// Rate limit window for partner notifications (ms)
const NOTIFICATION_RATE_LIMIT_MS = 60 * 1000; // 60 seconds

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface SynapseGuiltNotification {
    id: string;
    fromUserId: string;
    fromUserName: string;
    toUserId: string;
    toUserName: string;
    synapseId: string;
    type: 'decay_warning' | 'critical_warning' | 'streak_death' | 'revival';
    message: string;
    createdAt: number;
    read: boolean;
}

export interface SynapseHealthStatus {
    synapseId: string;
    userAStatus: 'healthy' | 'decay' | 'critical' | 'dead';
    userBStatus: 'healthy' | 'decay' | 'critical' | 'dead';
    overallHealth: 'strong' | 'weakening' | 'critical' | 'broken';
    riskLevel: number;  // 0-100
}

// ═══════════════════════════════════════════════════════════════════════════
// GUILT MESSAGE TRANSLATIONS
// ═══════════════════════════════════════════════════════════════════════════

const GUILT_MESSAGES: Record<NotificationLocale, {
    decay_warning: string;
    critical_warning: string;
    streak_death: string;
    revival: string;
}> = {
    en: {
        decay_warning: "⚠️ Your partner {{name}} is losing discipline and risking YOUR synapse link! Warn them NOW!",
        critical_warning: "🚨 CRITICAL! {{name}} has {{minutes}} minutes left! Your shared synapse is about to BREAK!",
        streak_death: "💀 {{name}} has FAILED. Your synapse link is BROKEN. Shame them or forgive them.",
        revival: "🌟 {{name}} has returned! The synapse link is healing. Welcome back, warrior.",
    },
    tr: {
        decay_warning: "⚠️ Your partner {{name}} is losing discipline and risking YOUR synapse link! Warn them NOW!",
        critical_warning: "🚨 CRITICAL! {{name}} has {{minutes}} minutes left! Your shared synapse is about to BREAK!",
        streak_death: "💀 {{name}} has FAILED. Your synapse link is BROKEN. Shame them or forgive them.",
        revival: "🌟 {{name}} has returned! The synapse link is healing. Welcome back, warrior.",
    },
    de: {
        decay_warning: "⚠️ Dein Partner {{name}} verliert die Disziplin und riskiert DEINE Synapsenverbindung! Warne ihn JETZT!",
        critical_warning: "🚨 KRITISCH! {{name}} hat noch {{minutes}} Minuten! Eure gemeinsame Synapse wird BRECHEN!",
        streak_death: "💀 {{name}} hat VERSAGT. Eure Synapsenverbindung ist GEBROCHEN. Beschäme oder vergib.",
        revival: "🌟 {{name}} ist zurück! Die Synapsenverbindung heilt. Willkommen zurück, Krieger.",
    },
    es: {
        decay_warning: "⚠️ ¡Tu compañero {{name}} está perdiendo disciplina y arriesgando TU enlace de sinapsis! ¡Adviértele AHORA!",
        critical_warning: "🚨 ¡CRÍTICO! ¡{{name}} tiene {{minutes}} minutos! ¡Su sinapsis compartida está a punto de ROMPERSE!",
        streak_death: "💀 {{name}} ha FALLADO. Su enlace de sinapsis está ROTO. Avergüénzalo o perdónalo.",
        revival: "🌟 ¡{{name}} ha vuelto! El enlace de sinapsis se está curando. Bienvenido de nuevo, guerrero.",
    },
    fr: {
        decay_warning: "⚠️ Ton partenaire {{name}} perd sa discipline et risque TON lien synaptique ! Avertis-le MAINTENANT !",
        critical_warning: "🚨 CRITIQUE ! {{name}} a {{minutes}} minutes ! Votre synapse partagée va SE BRISER !",
        streak_death: "💀 {{name}} a ÉCHOUÉ. Votre lien synaptique est BRISÉ. Fais-lui honte ou pardonne-lui.",
        revival: "🌟 {{name}} est de retour ! Le lien synaptique guérit. Bienvenue, guerrier.",
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// SYNAPSE GUILT SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════

class SynapseGuiltService {
    private listeners: Map<string, () => void> = new Map();
    private activeMonitoring: Set<string> = new Set();
    private recentNotifications: Map<string, number> = new Map();
    private recentNotificationTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

    // ─────────────────────────────────────────────────────────────────────────
    // SYNAPSE MONITORING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Start monitoring a user's streak for synapse partners
     */
    startStreakMonitoring(userId: string): () => void {
        if (this.activeMonitoring.has(userId)) {
            return () => this.stopStreakMonitoring(userId);
        }

        // Polling fallback for user profile changes (30s)
        const interval = setInterval(async () => {
            const userData = await this.getUserProfile(userId);
            if (!userData) return;

            const deadlineAt = Number(userData.lastActivityAt) + 24 * 60 * 60 * 1000;
            const remainingMs = deadlineAt - Date.now();
            const remainingHours = remainingMs / (60 * 60 * 1000);

            if (remainingHours <= 1 && remainingHours > 0) {
                await this.notifyPartners(userId, 'decay_warning');
            }
            if (remainingMs <= 15 * 60 * 1000 && remainingMs > 0) {
                const minutes = Math.floor(remainingMs / (60 * 1000));
                await this.notifyPartners(userId, 'critical_warning', { minutes });
            }
            if (remainingMs <= 0) {
                await this.notifyPartners(userId, 'streak_death');
            }
        }, 30000);

        this.activeMonitoring.add(userId);
        this.listeners.set(`streak_${userId}`, () => clearInterval(interval));

        return () => this.stopStreakMonitoring(userId);
    }

    /**
     * Stop monitoring a user's streak
     */
    stopStreakMonitoring(userId: string): void {
        const unsubscribe = this.listeners.get(`streak_${userId}`);
        if (unsubscribe) {
            unsubscribe();
            this.listeners.delete(`streak_${userId}`);
            this.activeMonitoring.delete(userId);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PARTNER NOTIFICATIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Notify all synapse partners about user's streak status
     */
    async notifyPartners(
        userId: string,
        type: SynapseGuiltNotification['type'],
        params: Record<string, unknown> = {}
    ): Promise<void> {
        // Get user's active synapse links
        const synapseLinks = await this.getUserSynapseLinks(userId);

        if (synapseLinks.length === 0) return;

        const userProfile = await this.getUserProfile(userId);
        if (!userProfile) return;

        const tasks = synapseLinks.map(async (link) => {
            const partnerId = link.userAId === userId ? link.userBId : link.userAId;
            const key = `${link.id}:${type}:${partnerId}`;

            // Rate-limit: skip if a recent notification for the same event+partner exists
            const lastTs = this.recentNotifications.get(key);
            const now = Date.now();
            if (lastTs && now - lastTs < NOTIFICATION_RATE_LIMIT_MS) {
                // skip to avoid spamming
                console.log(`[SynapseGuiltService] Skipping notification (rate-limited) for ${key}`);
                return;
            }

            const partnerProfile = await this.getUserProfile(partnerId);
            if (!partnerProfile) return;

            // Do not send partner notifications if partner has disabled notifications
            // or the account is not active (signed out / disabled)
            if (partnerProfile.notificationsEnabled === false || partnerProfile.accountStatus !== 'active') {
                console.log(`[SynapseGuiltService] Skipping partner notifications for ${partnerId} (notificationsEnabled=${partnerProfile.notificationsEnabled} accountStatus=${partnerProfile.accountStatus})`);
                return;
            }

            // Create guilt notification (store in DB)
            const notification = await this.createGuiltNotification({
                fromUserId: userId,
                fromUserName: userProfile.displayName,
                toUserId: partnerId,
                toUserName: partnerProfile.displayName,
                synapseId: link.id,
                type,
                params: { ...params, name: userProfile.displayName },
            });

            // If partner has a push token, attempt to notify their device (otherwise we only create DB record)
            if (partnerProfile.expoPushToken) {
                await this.sendPushNotification(partnerId, notification, partnerProfile.locale || 'en');
            } else {
                console.log(`[SynapseGuiltService] Partner ${partnerId} has no push token; created DB notification only.`);
            }

            // Record send timestamp and schedule removal after window
            this.recentNotifications.set(key, Date.now());
            console.log(`[SynapseGuiltService] Notification sent and rate-limited for ${key} for ${NOTIFICATION_RATE_LIMIT_MS}ms`);
            try {
                const t = setTimeout(() => {
                    this.recentNotifications.delete(key);
                    const tm = this.recentNotificationTimers.get(key);
                    if (tm) {
                        clearTimeout(tm);
                        this.recentNotificationTimers.delete(key);
                    }
                }, NOTIFICATION_RATE_LIMIT_MS);
                this.recentNotificationTimers.set(key, t);
            } catch (e) {
                // ignore timer failures
            }
        });

        await Promise.all(tasks);
    }

    /**
     * Create a guilt notification record
     */
    private async createGuiltNotification(data: {
        fromUserId: string;
        fromUserName: string;
        toUserId: string;
        toUserName: string;
        synapseId: string;
        type: SynapseGuiltNotification['type'];
        params: Record<string, unknown>;
    }): Promise<SynapseGuiltNotification> {
        const locale = localizationService.getLocale();
        const messageTemplate = GUILT_MESSAGES[locale][data.type];
        const message = this.interpolateMessage(messageTemplate, data.params);

        const notification: SynapseGuiltNotification = {
            id: `guilt_${data.fromUserId}_${data.toUserId}_${Date.now()}`,
            fromUserId: data.fromUserId,
            fromUserName: data.fromUserName,
            toUserId: data.toUserId,
            toUserName: data.toUserName,
            synapseId: data.synapseId,
            type: data.type,
            message,
            createdAt: Date.now(),
            read: false,
        };

        // Store notification in Supabase
        await supabase.from('guilt_notifications').insert({
            id: notification.id,
            from_user_id: notification.fromUserId,
            from_user_name: notification.fromUserName,
            to_user_id: notification.toUserId,
            to_user_name: notification.toUserName,
            synapse_id: notification.synapseId,
            type: notification.type,
            message: notification.message,
            created_at: new Date().toISOString(),
            read: false,
        });

        return notification;
    }

    /**
     * Send push notification to partner
     */
    private async sendPushNotification(
        userId: string,
        notification: SynapseGuiltNotification,
        locale: string
    ): Promise<void> {
        try {
            // Get title based on notification type
            const titles: Record<NotificationLocale, Record<string, string>> = {
                en: {
                    decay_warning: '⚠️ Synapse at Risk!',
                    critical_warning: '🚨 CRITICAL: Synapse Breaking!',
                    streak_death: '💀 Synapse Link Broken',
                    revival: '🌟 Synapse Healing',
                },
                tr: {
                    decay_warning: '⚠️ Synapse at Risk!',
                    critical_warning: '🚨 CRITICAL: Synapse Breaking!',
                    streak_death: '💀 Synapse Link Broken',
                    revival: '🌟 Synapse Healing',
                },
                de: {
                    decay_warning: '⚠️ Synapse in Gefahr!',
                    critical_warning: '🚨 KRITISCH: Synapse bricht!',
                    streak_death: '💀 Synapsenverbindung gebrochen',
                    revival: '🌟 Synapse heilt',
                },
                es: {
                    decay_warning: '⚠️ ¡Sinapsis en riesgo!',
                    critical_warning: '🚨 ¡CRÍTICO: Sinapsis rompiéndose!',
                    streak_death: '💀 Enlace de sinapsis roto',
                    revival: '🌟 Sinapsis sanando',
                },
                fr: {
                    decay_warning: '⚠️ Synapse en danger !',
                    critical_warning: '🚨 CRITIQUE : Synapse se brise !',
                    streak_death: '💀 Lien synaptique brisé',
                    revival: '🌟 Synapse en guérison',
                },
            };

            const notificationLocale = (locale.substring(0, 2) as NotificationLocale) || 'en';
            const title = titles[notificationLocale]?.[notification.type] || titles.en[notification.type];

            await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body: notification.message,
                    sound: notification.type === 'critical_warning' ? '3.mp3' : '2.mp3',
                    data: {
                        type: 'synapse_guilt',
                        notificationId: notification.id,
                        synapseId: notification.synapseId,
                        fromUserId: notification.fromUserId,
                    },
                },
                trigger: null, // Immediate
            });
        } catch (error) {
            console.error('[SynapseGuiltService] Failed to send push notification:', error);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SYNAPSE HEALTH
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get synapse health status
     */
    async getSynapseHealth(synapseId: string): Promise<SynapseHealthStatus | null> {
        const { data } = await supabase.from('synapse_links').select('*').eq('id', synapseId).maybeSingle();
        if (!data) return null;

        const link: SynapseLink = {
            id: data.id,
            createdAt: data.created_at,
            status: data.status,
            userAId: data.user_a_id,
            userADisplayName: data.user_a_display_name,
            userAStreak: data.user_a_streak,
            userALastActivity: data.user_a_last_activity,
            userBId: data.user_b_id,
            userBDisplayName: data.user_b_display_name,
            userBStreak: data.user_b_streak,
            userBLastActivity: data.user_b_last_activity,
            sharedStreak: data.shared_streak,
            sharedStreakStartedAt: data.shared_streak_started_at,
            brokenBy: data.broken_by,
            brokenAt: data.broken_at,
            breakReason: data.break_reason,
        };

        const userAProfile = await this.getUserProfile(link.userAId);
        const userBProfile = await this.getUserProfile(link.userBId);

        if (!userAProfile || !userBProfile) return null;

        const userAStatus = this.calculateUserStatus(userAProfile);
        const userBStatus = this.calculateUserStatus(userBProfile);

        const overallHealth = this.calculateOverallHealth(userAStatus, userBStatus);
        const riskLevel = this.calculateRiskLevel(userAStatus, userBStatus);

        return {
            synapseId,
            userAStatus,
            userBStatus,
            overallHealth,
            riskLevel,
        };
    }

    /**
     * Calculate user's streak status
     */
    private calculateUserStatus(
        user: UserProfile
    ): 'healthy' | 'decay' | 'critical' | 'dead' {
        const deadlineAt = Number(user.lastActivityAt) + 24 * 60 * 60 * 1000;
        const remainingMs = deadlineAt - Date.now();
        const remainingHours = remainingMs / (60 * 60 * 1000);

        if (remainingMs <= 0) return 'dead';
        if (remainingHours <= 0.25) return 'critical';  // 15 minutes
        if (remainingHours <= 1) return 'decay';
        return 'healthy';
    }

    /**
     * Calculate overall synapse health
     */
    private calculateOverallHealth(
        statusA: 'healthy' | 'decay' | 'critical' | 'dead',
        statusB: 'healthy' | 'decay' | 'critical' | 'dead'
    ): 'strong' | 'weakening' | 'critical' | 'broken' {
        if (statusA === 'dead' || statusB === 'dead') return 'broken';
        if (statusA === 'critical' || statusB === 'critical') return 'critical';
        if (statusA === 'decay' || statusB === 'decay') return 'weakening';
        return 'strong';
    }

    /**
     * Calculate risk level (0-100)
     */
    private calculateRiskLevel(
        statusA: 'healthy' | 'decay' | 'critical' | 'dead',
        statusB: 'healthy' | 'decay' | 'critical' | 'dead'
    ): number {
        const statusValues = { healthy: 0, decay: 40, critical: 80, dead: 100 };
        return Math.max(statusValues[statusA], statusValues[statusB]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPER METHODS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get user's active synapse links
     */
    private async getUserSynapseLinks(userId: string): Promise<SynapseLink[]> {
        const { data } = await supabase.from('synapse_links').select('*').or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`).eq('status', 'active');
        if (!data) return [];

        return data.map((d: any) => ({
            id: d.id,
            createdAt: d.created_at,
            status: d.status,
            userAId: d.user_a_id,
            userADisplayName: d.user_a_display_name,
            userAStreak: d.user_a_streak,
            userALastActivity: d.user_a_last_activity,
            userBId: d.user_b_id,
            userBDisplayName: d.user_b_display_name,
            userBStreak: d.user_b_streak,
            userBLastActivity: d.user_b_last_activity,
            sharedStreak: d.shared_streak,
            sharedStreakStartedAt: d.shared_streak_started_at,
            brokenBy: d.broken_by,
            brokenAt: d.broken_at,
            breakReason: d.break_reason,
        } as SynapseLink));
    }

    /**
     * Get user profile
     */
    private async getUserProfile(userId: string): Promise<UserProfile | null> {
        // Use the central `profiles` table to fetch the richer profile fields
        const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
        if (!data) return null;
        return ({
            uid: data.id,
            displayName: data.display_name || `${data.first_name || ''} ${data.last_name || ''}`.trim(),
            email: data.email,
            birthDate: data.birth_date,
            lastActivityAt: data.last_activity_at,
            locale: data.locale || 'en',
            notificationsEnabled: typeof data.notifications_enabled !== 'undefined' ? data.notifications_enabled : true,
            accountStatus: data.account_status || 'active',
            expoPushToken: data.expo_push_token || data.push_token || null,
        } as unknown) as UserProfile;
    }

    /**
     * Interpolate message template with params
     */
    private interpolateMessage(
        template: string,
        params: Record<string, unknown>
    ): string {
        let result = template;
        for (const [key, value] of Object.entries(params)) {
            result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
        }
        return result;
    }

    /**
     * Mark notification as read
     */
    async markNotificationRead(notificationId: string): Promise<void> {
        await supabase.from('guilt_notifications').update({ read: true }).eq('id', notificationId);
    }

    /**
     * Cleanup all listeners
     */
    cleanup(): void {
        this.listeners.forEach((unsubscribe) => unsubscribe());
        this.listeners.clear();
        this.activeMonitoring.clear();

        // Clear recent notification timers
        for (const t of this.recentNotificationTimers.values()) {
            try { clearTimeout(t); } catch (e) { /* ignore */ }
        }
        this.recentNotificationTimers.clear();
        this.recentNotifications.clear();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER IMPORTS (needed for getDocs)
// ═══════════════════════════════════════════════════════════════════════════

// Uses Supabase backend.

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const synapseGuiltService = new SynapseGuiltService();
export { GUILT_MESSAGES };
export default synapseGuiltService;
