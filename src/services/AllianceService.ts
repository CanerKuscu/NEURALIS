/**
 * AllianceService - Alliance System
 * Social discipline and shared streak management
 */

import { supabase } from '../config/supabase';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type AllianceStatus = 'pending' | 'active' | 'broken' | 'declined';

export interface Alliance {
  id: string;
  user1Id: string;
  user2Id: string;
  status: AllianceStatus;
  initiatedBy: string;
  allianceStreak: number;
  longestStreak: number;
  user1CompletedToday: boolean;
  user2CompletedToday: boolean;
  createdAt: number;
  acceptedAt?: number;
  // Partner info
  partnerName?: string;
  partnerAvatarUrl?: string;
}

export interface AllianceInvite {
  allianceId: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
  createdAt: number;
}

export interface AllianceNotification {
  id: string;
  type: 'invite' | 'accepted' | 'reminder' | 'streak' | 'broken';
  message: string;
  read: boolean;
  createdAt: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// ALLIANCE SERVICE
// ═══════════════════════════════════════════════════════════════════════════

class AllianceService {
  /**
   * Fetches the user's active alliances
   */
  async getUserAlliances(userId: string): Promise<Alliance[]> {
    try {
      const { data, error } = await supabase
        .from('alliances')
        .select(
          `
                    *,
                    partner1:profiles!alliances_user1_id_fkey(display_name, avatar_url),
                    partner2:profiles!alliances_user2_id_fkey(display_name, avatar_url)
                `,
        )
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .eq('status', 'active');

      if (error) throw error;

      return (data || []).map((row: any) => {
        const isUser1 = row.user1_id === userId;
        const partner = isUser1 ? row.partner2 : row.partner1;

        return {
          id: row.id,
          user1Id: row.user1_id,
          user2Id: row.user2_id,
          status: row.status as AllianceStatus,
          initiatedBy: row.initiated_by,
          allianceStreak: row.alliance_streak || 0,
          longestStreak: row.longest_streak || 0,
          user1CompletedToday: row.user1_completed_today || false,
          user2CompletedToday: row.user2_completed_today || false,
          createdAt: row.created_at,
          acceptedAt: row.accepted_at,
          partnerName: partner?.display_name,
          partnerAvatarUrl: partner?.avatar_url,
        };
      });
    } catch (error) {
      console.error('Failed to fetch alliances:', error);
      return [];
    }
  }

  /**
   * Fetches pending alliance invites
   */
  async getPendingInvites(userId: string): Promise<AllianceInvite[]> {
    try {
      const { data, error } = await supabase
        .from('alliances')
        .select(
          `
                    id,
                    initiated_by,
                    created_at,
                    inviter:profiles!alliances_user1_id_fkey(display_name, avatar_url)
                `,
        )
        .eq('user2_id', userId)
        .eq('status', 'pending');

      if (error) throw error;

      return (data || []).map((row: any) => ({
        allianceId: row.id,
        fromUserId: row.initiated_by,
        fromUserName: row.inviter?.display_name || 'User',
        fromUserAvatar: row.inviter?.avatar_url,
        createdAt: row.created_at,
      }));
    } catch (error) {
      console.error('Failed to fetch pending invites:', error);
      return [];
    }
  }

  /**
   * Sends an alliance invite
   */
  async sendInvite(
    fromUserId: string,
    toUserId: string,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // Self-invite check
      if (fromUserId === toUserId) {
        return { success: false, message: 'You cannot send an alliance invite to yourself.' };
      }

      // Existing alliance check
      const { data: existing } = await supabase
        .from('alliances')
        .select('id, status')
        .or(
          `and(user1_id.eq.${fromUserId},user2_id.eq.${toUserId}),and(user1_id.eq.${toUserId},user2_id.eq.${fromUserId})`,
        )
        .in('status', ['pending', 'active'])
        .single();

      if (existing) {
        if (existing.status === 'active') {
          return { success: false, message: 'You already have an alliance with this user.' };
        }
        return { success: false, message: 'A pending invite already exists.' };
      }

      // Create invite
      const { error } = await supabase.from('alliances').insert({
        user1_id: fromUserId,
        user2_id: toUserId,
        initiated_by: fromUserId,
        status: 'pending',
      });

      if (error) throw error;

      // Send notification (silent)
      await this.createNotification(toUserId, 'invite', 'You received a new alliance invite!');

      return { success: true };
    } catch (error) {
      console.error('Failed to send invite:', error);
      return { success: false, message: 'Failed to send invite.' };
    }
  }

  /**
   * Accepts an alliance invite
   */
  async acceptInvite(allianceId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('alliances')
        .update({
          status: 'active',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', allianceId)
        .eq('user2_id', userId)
        .eq('status', 'pending');

      if (error) throw error;

      // Notify the other party
      const { data: alliance } = await supabase
        .from('alliances')
        .select('user1_id')
        .eq('id', allianceId)
        .single();

      if (alliance) {
        await this.createNotification(
          alliance.user1_id,
          'accepted',
          'Your alliance invite was accepted! 🎉',
        );
      }

      return true;
    } catch (error) {
      console.error('Failed to accept invite:', error);
      return false;
    }
  }

  /**
   * Declines an alliance invite
   */
  async declineInvite(allianceId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('alliances')
        .update({ status: 'declined' })
        .eq('id', allianceId)
        .eq('user2_id', userId)
        .eq('status', 'pending');

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to decline invite:', error);
      return false;
    }
  }

  /**
   * Terminates an alliance
   */
  async breakAlliance(allianceId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('alliances')
        .update({
          status: 'broken',
          broken_at: new Date().toISOString(),
        })
        .eq('id', allianceId)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

      if (error) throw error;

      // Notify the partner
      const { data: alliance } = await supabase
        .from('alliances')
        .select('user1_id, user2_id')
        .eq('id', allianceId)
        .single();

      if (alliance) {
        const partnerId = alliance.user1_id === userId ? alliance.user2_id : alliance.user1_id;
        await this.createNotification(partnerId, 'broken', 'Alliance has been terminated.');
      }

      return true;
    } catch (error) {
      console.error('Failed to break alliance:', error);
      return false;
    }
  }

  /**
   * Marks the user's daily lesson completion
   */
  async markDailyCompletion(userId: string): Promise<void> {
    try {
      // Call the RPC function
      await supabase.rpc('mark_alliance_completion', {
        p_user_id: userId,
      });
    } catch (error) {
      console.error('Failed to mark completion:', error);
    }
  }

  /**
   * Checks alliance streak status
   */
  async checkAllianceStreak(
    allianceId: string,
  ): Promise<{ bothCompleted: boolean; streak: number }> {
    try {
      const { data, error } = await supabase
        .from('alliances')
        .select('alliance_streak, user1_completed_today, user2_completed_today')
        .eq('id', allianceId)
        .single();

      if (error) throw error;

      return {
        bothCompleted: data.user1_completed_today && data.user2_completed_today,
        streak: data.alliance_streak || 0,
      };
    } catch (error) {
      console.error('Failed to check streak:', error);
      return { bothCompleted: false, streak: 0 };
    }
  }

  /**
   * Creates a notification (silent - no vibration)
   */
  private async createNotification(userId: string, type: string, message: string): Promise<void> {
    try {
      await supabase.from('alliance_notifications').insert({
        user_id: userId,
        type,
        message,
      });
    } catch (error) {
      console.warn('Failed to create notification:', error);
    }
  }

  /**
   * Fetches the user's unread notifications
   */
  async getUnreadNotifications(userId: string): Promise<AllianceNotification[]> {
    try {
      const { data, error } = await supabase
        .from('alliance_notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('read', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((row) => ({
        id: row.id,
        type: row.type,
        message: row.message,
        read: row.read,
        createdAt: row.created_at,
      }));
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }
  }

  /**
   * Marks notifications as read
   */
  async markNotificationsRead(userId: string): Promise<void> {
    try {
      await supabase
        .from('alliance_notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);
    } catch (error) {
      console.warn('Failed to mark notifications read:', error);
    }
  }
}

export const allianceService = new AllianceService();
export default allianceService;
