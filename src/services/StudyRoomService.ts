/**
 * NEURALIS - Study Room Service
 * Supabase Realtime tabanlı grup çalışma odaları (2-5 kişi)
 */

import { supabase } from '../config/supabase';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface StudyRoom {
  id: string;
  hostId: string;
  hostName: string;
  topic: string;
  category: string;
  maxPlayers: number;
  participants: RoomParticipant[];
  status: 'waiting' | 'active' | 'finished';
  createdAt: string;
  xpBonus: number;
}

export interface RoomParticipant {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  score: number;
  isReady: boolean;
  joinedAt: string;
}

export interface RoomMessage {
  userId: string;
  displayName: string;
  type: 'chat' | 'answer' | 'system';
  text: string;
  timestamp: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════

const CATEGORIES = ['mathematics', 'science', 'coding', 'history', 'language', 'geography'];
const XP_BONUS_MULTIPLIER = 1.5;

class StudyRoomService {
  private channels: Map<string, any> = new Map();

  async createRoom(
    userId: string,
    displayName: string,
    category: string,
    topic: string,
  ): Promise<StudyRoom> {
    const room: StudyRoom = {
      id: `room_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      hostId: userId,
      hostName: displayName,
      topic,
      category,
      maxPlayers: 5,
      participants: [
        {
          userId,
          displayName,
          score: 0,
          isReady: true,
          joinedAt: new Date().toISOString(),
        },
      ],
      status: 'waiting',
      createdAt: new Date().toISOString(),
      xpBonus: XP_BONUS_MULTIPLIER,
    };

    // Store room in supabase
    await supabase.from('study_rooms').insert({
      id: room.id,
      host_id: userId,
      host_name: displayName,
      topic,
      category,
      max_players: room.maxPlayers,
      status: 'waiting',
      xp_bonus: XP_BONUS_MULTIPLIER,
    });

    return room;
  }

  async getAvailableRooms(): Promise<StudyRoom[]> {
    try {
      const { data } = await supabase
        .from('study_rooms')
        .select('*')
        .eq('status', 'waiting')
        .order('created_at', { ascending: false })
        .limit(20);

      return (data || []).map((r: any) => ({
        id: r.id,
        hostId: r.host_id,
        hostName: r.host_name,
        topic: r.topic,
        category: r.category,
        maxPlayers: r.max_players,
        participants: r.participants || [],
        status: r.status,
        createdAt: r.created_at,
        xpBonus: r.xp_bonus,
      }));
    } catch {
      return [];
    }
  }

  joinRoom(
    roomId: string,
    userId: string,
    displayName: string,
    callbacks: {
      onParticipantJoin?: (p: RoomParticipant) => void;
      onParticipantLeave?: (userId: string) => void;
      onMessage?: (msg: RoomMessage) => void;
      onGameStart?: () => void;
      onScoreUpdate?: (userId: string, score: number) => void;
    },
  ): void {
    const channel = supabase.channel(`study-room-${roomId}`, {
      config: { presence: { key: userId } },
    });

    channel
      .on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
        const p = newPresences[0];
        callbacks.onParticipantJoin?.({
          userId: key,
          displayName: p?.displayName || 'Anon',
          avatarUrl: p?.avatarUrl,
          score: 0,
          isReady: false,
          joinedAt: new Date().toISOString(),
        });
      })
      .on('presence', { event: 'leave' }, ({ key }: any) => {
        callbacks.onParticipantLeave?.(key);
      })
      .on('broadcast', { event: 'message' }, ({ payload }: any) => {
        callbacks.onMessage?.(payload);
      })
      .on('broadcast', { event: 'game-start' }, () => {
        callbacks.onGameStart?.();
      })
      .on('broadcast', { event: 'score-update' }, ({ payload }: any) => {
        callbacks.onScoreUpdate?.(payload.userId, payload.score);
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ displayName, joinedAt: new Date().toISOString() });
        }
      });

    this.channels.set(roomId, channel);
  }

  sendMessage(roomId: string, msg: RoomMessage): void {
    const channel = this.channels.get(roomId);
    channel?.send({ type: 'broadcast', event: 'message', payload: msg });
  }

  startGame(roomId: string): void {
    const channel = this.channels.get(roomId);
    channel?.send({ type: 'broadcast', event: 'game-start', payload: {} });
    supabase.from('study_rooms').update({ status: 'active' }).eq('id', roomId).then();
  }

  updateScore(roomId: string, userId: string, score: number): void {
    const channel = this.channels.get(roomId);
    channel?.send({ type: 'broadcast', event: 'score-update', payload: { userId, score } });
  }

  leaveRoom(roomId: string): void {
    const channel = this.channels.get(roomId);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(roomId);
    }
  }

  async closeRoom(roomId: string): Promise<void> {
    this.leaveRoom(roomId);
    await supabase.from('study_rooms').update({ status: 'finished' }).eq('id', roomId);
  }
}

export const studyRoomService = new StudyRoomService();
