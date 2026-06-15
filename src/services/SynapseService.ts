/**
 * NEURALIS - Synapse Link Service
 * Social Interdependency & Shared Fate System
 */

import { supabase } from '../config/supabase';
import { SynapseLink, SynapseLinkRequest, SynapseLinkStatus, UserProfile } from '../types';
import streakService from './StreakService';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const LINK_REQUEST_EXPIRY_HOURS = 24;
const MAX_ACTIVE_LINKS = 1; // Users can only have 1 active synapse link

// ═══════════════════════════════════════════════════════════════════════════
// SYNAPSE SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════

class SynapseService {
    private listeners: Map<string, () => void> = new Map();

    /**
     * Send a synapse link request to another user
     */
    async sendLinkRequest(
        fromUserId: string,
        toUserId: string
    ): Promise<SynapseLinkRequest | null> {
        // Check if user already has an active link
        const existingLink = await this.getActiveLink(fromUserId);
        if (existingLink) {
            console.warn('[SynapseService] User already has an active link');
            return null;
        }

        // Check if there's already a pending request
        const existingRequest = await this.getPendingRequest(fromUserId, toUserId);
        if (existingRequest) {
            console.warn('[SynapseService] Request already pending');
            return existingRequest;
        }

        // Get user profiles
        const [fromUser, toUser] = await Promise.all([
            this.getUserProfile(fromUserId),
            this.getUserProfile(toUserId),
        ]);

        if (!fromUser || !toUser) {
            console.error('[SynapseService] User not found');
            return null;
        }

        const now = Date.now();
        const requestId = `${fromUserId}_${toUserId}_${now}`;

        const request: SynapseLinkRequest = {
            id: requestId,
            fromUserId,
            fromUserName: fromUser.displayName,
            toUserId,
            toUserName: toUser.displayName,
            createdAt: now,
            expiresAt: now + LINK_REQUEST_EXPIRY_HOURS * 60 * 60 * 1000,
            status: 'pending',
        };

        await supabase.from('link_requests').insert({
            id: request.id,
            from_user_id: request.fromUserId,
            from_user_name: request.fromUserName,
            to_user_id: request.toUserId,
            to_user_name: request.toUserName,
            created_at: request.createdAt,
            expires_at: request.expiresAt,
            status: request.status,
        });

        return request;
    }

    /**
     * Accept a synapse link request
     */
    async acceptLinkRequest(requestId: string): Promise<SynapseLink | null> {
        const { data: requestData, error } = await supabase
            .from('link_requests')
            .select('*')
            .eq('id', requestId)
            .maybeSingle();

        if (!requestData) {
            console.error('[SynapseService] Request not found', error);
            return null;
        }

        // Map DB shape to SynapseLinkRequest shape
        const req: SynapseLinkRequest = {
            id: requestData.id,
            fromUserId: requestData.from_user_id,
            fromUserName: requestData.from_user_name,
            toUserId: requestData.to_user_id,
            toUserName: requestData.to_user_name,
            createdAt: requestData.created_at,
            expiresAt: requestData.expires_at,
            status: requestData.status,
        };

        if (req.status !== 'pending') {
            console.error('[SynapseService] Request is not pending');
            return null;
        }

        if (Date.now() > req.expiresAt) {
            await supabase.from('link_requests').update({ status: 'expired' }).eq('id', requestId);
            return null;
        }

        // Check both users don't have existing links
        const [userALink, userBLink] = await Promise.all([
            this.getActiveLink(req.fromUserId),
            this.getActiveLink(req.toUserId),
        ]);

        if (userALink || userBLink) {
            console.error('[SynapseService] One or both users already have an active link');
            return null;
        }

        // Get streak data for both users
        const [userAStreak, userBStreak] = await Promise.all([
            streakService.getStreakData(requestData.fromUserId),
            streakService.getStreakData(requestData.toUserId),
        ]);

        const now = Date.now();
        const linkId = `synapse_${req.fromUserId}_${req.toUserId}`;

        const synapseLink: SynapseLink = {
            id: linkId,
            createdAt: now,
            status: 'active',
            userAId: req.fromUserId,
            userADisplayName: req.fromUserName,
            userAStreak: userAStreak?.currentStreak || 0,
            userALastActivity: userAStreak?.lastCompletedAt || now,
            userBId: req.toUserId,
            userBDisplayName: req.toUserName,
            userBStreak: userBStreak?.currentStreak || 0,
            userBLastActivity: userBStreak?.lastCompletedAt || now,
            sharedStreak: Math.min(userAStreak?.currentStreak || 0, userBStreak?.currentStreak || 0),
            sharedStreakStartedAt: now,
        };

        // Insert synapse link and update request atomically where possible
        await supabase.from('synapse_links').insert({
            id: synapseLink.id,
            created_at: synapseLink.createdAt,
            status: synapseLink.status,
            user_a_id: synapseLink.userAId,
            user_a_display_name: synapseLink.userADisplayName,
            user_a_streak: synapseLink.userAStreak,
            user_a_last_activity: synapseLink.userALastActivity,
            user_b_id: synapseLink.userBId,
            user_b_display_name: synapseLink.userBDisplayName,
            user_b_streak: synapseLink.userBStreak,
            user_b_last_activity: synapseLink.userBLastActivity,
            shared_streak: synapseLink.sharedStreak,
            shared_streak_started_at: synapseLink.sharedStreakStartedAt,
        });

        await supabase.from('link_requests').update({ status: 'accepted' }).eq('id', requestId);

        return synapseLink;
    }

    /**
     * Reject a synapse link request
     */
    async rejectLinkRequest(requestId: string): Promise<void> {
        await supabase.from('link_requests').update({ status: 'rejected' }).eq('id', requestId);
    }

    /**
     * Dissolve an active synapse link
     */
    async dissolveLink(linkId: string, initiatorUserId: string): Promise<void> {
        const { data: link } = await supabase.from('synapse_links').select('*').eq('id', linkId).maybeSingle();
        if (!link) return;

        await supabase.from('synapse_links').update({
            status: 'dissolved',
            broken_by: initiatorUserId,
            broken_at: new Date().toISOString(),
            break_reason: 'manual_dissolve',
        }).eq('id', linkId);
    }

    /**
     * Break link due to missed deadline (SHARED FATE)
     */
    async breakLinkDueToMissedDeadline(userId: string): Promise<void> {
        const activeLink = await this.getActiveLink(userId);
        if (!activeLink) return;

        const partnerId = activeLink.userAId === userId ? activeLink.userBId : activeLink.userAId;

        await supabase.from('synapse_links').update({
            status: 'broken',
            broken_by: userId,
            broken_at: new Date().toISOString(),
            break_reason: 'missed_deadline',
        }).eq('id', activeLink.id);

        // SHARED FATE: Kill both streaks
        await Promise.all([
            streakService.killStreak(userId, 'synapse_break'),
            streakService.killStreak(partnerId, 'synapse_break'),
        ]);

        console.log(`[SynapseService] SHARED FATE: Both users' streaks killed due to ${userId}`);
    }

    /**
     * Get active synapse link for a user
     */
    async getActiveLink(userId: string): Promise<SynapseLink | null> {
        // Query synapse_links table for any active link where user is user A or user B
        const { data, error } = await supabase
            .from('synapse_links')
            .select('*')
            .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
            .eq('status', 'active')
            .limit(1)
            .maybeSingle();

        if (!data) return null;

        // Map DB row to SynapseLink
        return this.parseLinkData({
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
        });
    }

    /**
     * Subscribe to active link updates
     */
    subscribeToActiveLink(
        userId: string,
        callback: (link: SynapseLink | null) => void
    ): () => void {
        // Supabase Realtime not set up here; use a lightweight polling fallback
        const interval = setInterval(async () => {
            const link = await this.getActiveLink(userId);
            callback(link);
        }, 30000);

        const unsubscribe = () => clearInterval(interval);
        this.listeners.set(`link_${userId}`, unsubscribe);
        return unsubscribe;
    }

    /**
     * Get pending link requests for a user
     */
    async getPendingRequests(userId: string): Promise<SynapseLinkRequest[]> {
        const { data, error } = await supabase
            .from('link_requests')
            .select('*')
            .eq('to_user_id', userId)
            .eq('status', 'pending');

        const now = Date.now();
        if (!data) return [];

        return data
            .map((r) => ({
                id: r.id,
                fromUserId: r.from_user_id,
                fromUserName: r.from_user_name,
                toUserId: r.to_user_id,
                toUserName: r.to_user_name,
                createdAt: r.created_at,
                expiresAt: r.expires_at,
                status: r.status,
            } as SynapseLinkRequest))
            .filter((request) => request.expiresAt > now);
    }

    /**
     * Update partner activity (called when user completes daily)
     */
    async updatePartnerActivity(userId: string): Promise<void> {
        const activeLink = await this.getActiveLink(userId);
        if (!activeLink) return;

        const isUserA = activeLink.userAId === userId;
        const streakData = await streakService.getStreakData(userId);

        const updates: Record<string, unknown> = {};
        if (isUserA) {
            updates.user_a_last_activity = Date.now();
            updates.user_a_streak = streakData?.currentStreak || 0;
        } else {
            updates.user_b_last_activity = Date.now();
            updates.user_b_streak = streakData?.currentStreak || 0;
        }

        updates.shared_streak = Math.min(
            isUserA ? (streakData?.currentStreak || 0) : activeLink.userAStreak,
            isUserA ? activeLink.userBStreak : (streakData?.currentStreak || 0)
        );

        await supabase.from('synapse_links').update(updates).eq('id', activeLink.id);
    }

    /**
     * Get user profile helper
     */
    private async getUserProfile(userId: string): Promise<UserProfile | null> {
        // profiles table is the canonical user profile table in this project
        const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
        if (!data) return null;
        return ({
            id: data.id,
            displayName: data.display_name,
            email: data.email,
            avatarUrl: data.avatar_url,
        } as unknown) as UserProfile;
    }

    /**
     * Get pending request between two users
     */
    private async getPendingRequest(
        fromUserId: string,
        toUserId: string
    ): Promise<SynapseLinkRequest | null> {
        const { data } = await supabase
            .from('link_requests')
            .select('*')
            .eq('from_user_id', fromUserId)
            .eq('to_user_id', toUserId)
            .eq('status', 'pending')
            .limit(1)
            .maybeSingle();

        if (!data) return null;

        const request: SynapseLinkRequest = {
            id: data.id,
            fromUserId: data.from_user_id,
            fromUserName: data.from_user_name,
            toUserId: data.to_user_id,
            toUserName: data.to_user_name,
            createdAt: data.created_at,
            expiresAt: data.expires_at,
            status: data.status,
        };

        return request.expiresAt > Date.now() ? request : null;
    }

    /**
     * Parse data to SynapseLink
     */
    private parseLinkData(data: Record<string, unknown>): SynapseLink {
        const toTs = (val: unknown): number => {
            if (!val) return 0;
            if (typeof val === 'number') return val;
            if (typeof val === 'string') {
                const parsed = Date.parse(val);
                return Number.isNaN(parsed) ? 0 : parsed;
            }
            return 0;
        };

        return {
            id: (data.id as string) || (data['id'] as string),
            createdAt: toTs((data.createdAt as any) ?? (data.created_at as any)),
            status: (data.status as SynapseLinkStatus) || (data['status'] as SynapseLinkStatus),
            userAId: (data.userAId as string) || (data['user_a_id'] as string),
            userADisplayName: (data.userADisplayName as string) || (data['user_a_display_name'] as string),
            userAStreak: (data.userAStreak as number) || (data['user_a_streak'] as number) || 0,
            userALastActivity: toTs((data.userALastActivity as any) ?? (data['user_a_last_activity'] as any)),
            userBId: (data.userBId as string) || (data['user_b_id'] as string),
            userBDisplayName: (data.userBDisplayName as string) || (data['user_b_display_name'] as string),
            userBStreak: (data.userBStreak as number) || (data['user_b_streak'] as number) || 0,
            userBLastActivity: toTs((data.userBLastActivity as any) ?? (data['user_b_last_activity'] as any)),
            sharedStreak: (data.sharedStreak as number) || (data['shared_streak'] as number) || 0,
            sharedStreakStartedAt: toTs((data.sharedStreakStartedAt as any) ?? (data['shared_streak_started_at'] as any)),
            brokenBy: (data.brokenBy as string) || (data['broken_by'] as string) || undefined,
            brokenAt: toTs((data.brokenAt as any) ?? (data['broken_at'] as any)) || undefined,
            breakReason: (data.breakReason as SynapseLink['breakReason']) || (data['break_reason'] as SynapseLink['breakReason']),
        };
    }

    /**
     * Parse data to SynapseLinkRequest
     */
    private parseRequestData(data: Record<string, unknown>): SynapseLinkRequest {
        const getNum = (k1: string, k2?: string) => {
            const v1 = data[k1] as unknown;
            const v2 = k2 ? (data[k2] as unknown) : undefined;
            if (typeof v1 === 'number') return v1;
            if (typeof v2 === 'number') return v2 as number;
            if (typeof v1 === 'string') return Date.parse(v1) || 0;
            if (typeof v2 === 'string') return Date.parse(v2 as string) || 0;
            return 0;
        };

        return {
            id: (data.id as string) || (data['id'] as string),
            fromUserId: (data.fromUserId as string) || (data['from_user_id'] as string),
            fromUserName: (data.fromUserName as string) || (data['from_user_name'] as string),
            toUserId: (data.toUserId as string) || (data['to_user_id'] as string),
            toUserName: (data.toUserName as string) || (data['to_user_name'] as string),
            createdAt: getNum('createdAt', 'created_at'),
            expiresAt: getNum('expiresAt', 'expires_at'),
            status: (data.status as SynapseLinkRequest['status']) || (data['status'] as SynapseLinkRequest['status']),
        };
    }

    /**
     * Cleanup listeners
     */
    cleanup(): void {
        this.listeners.forEach((unsubscribe) => unsubscribe());
        this.listeners.clear();
    }
}

export const synapseService = new SynapseService();
export default synapseService;
