/**
 * NEURALIS - WallOfFameService
 * En iyi oyuncuları ve rekorları göster.
 */

import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FameEntry {
    userId: string;
    username: string;
    avatarUrl?: string;
    value: number;
    label: string;
}

export interface WallOfFameData {
    topStreaks: FameEntry[];
    topXP: FameEntry[];
    topLessons: FameEntry[];
    topQuests: FameEntry[];
    recentAchievements: FameEntry[];
    generatedAt: number;
}

const CACHE_KEY = 'wall_of_fame_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 min

class WallOfFameService {
    async getData(): Promise<WallOfFameData> {
        // Check cache
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
            const parsed = JSON.parse(cached) as WallOfFameData;
            if (Date.now() - parsed.generatedAt < CACHE_DURATION) return parsed;
        }

        const [streaks, xp, lessons, quests] = await Promise.all([
            this.getTopStreaks(),
            this.getTopXP(),
            this.getTopLessons(),
            this.getTopQuests(),
        ]);

        const data: WallOfFameData = {
            topStreaks: streaks,
            topXP: xp,
            topLessons: lessons,
            topQuests: quests,
            recentAchievements: [],
            generatedAt: Date.now(),
        };

        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
        return data;
    }

    private async getTopStreaks(): Promise<FameEntry[]> {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('id, username, avatar_url, streak')
                .order('streak', { ascending: false })
                .limit(10);

            return (data || []).map(p => ({
                userId: p.id,
                username: p.username || 'Anonim',
                avatarUrl: p.avatar_url,
                value: p.streak || 0,
                label: `${p.streak || 0} gün seri`,
            }));
        } catch {
            return [];
        }
    }

    private async getTopXP(): Promise<FameEntry[]> {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('id, username, avatar_url, xp')
                .order('xp', { ascending: false })
                .limit(10);

            return (data || []).map(p => ({
                userId: p.id,
                username: p.username || 'Anonim',
                avatarUrl: p.avatar_url,
                value: p.xp || 0,
                label: `${(p.xp || 0).toLocaleString()} XP`,
            }));
        } catch {
            return [];
        }
    }

    private async getTopLessons(): Promise<FameEntry[]> {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('id, username, avatar_url, lessons_completed')
                .order('lessons_completed', { ascending: false })
                .limit(10);

            return (data || []).map(p => ({
                userId: p.id,
                username: p.username || 'Anonim',
                avatarUrl: p.avatar_url,
                value: p.lessons_completed || 0,
                label: `${p.lessons_completed || 0} ders`,
            }));
        } catch {
            return [];
        }
    }

    private async getTopQuests(): Promise<FameEntry[]> {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('id, username, avatar_url, quests_completed')
                .order('quests_completed', { ascending: false })
                .limit(10);

            return (data || []).map(p => ({
                userId: p.id,
                username: p.username || 'Anonim',
                avatarUrl: p.avatar_url,
                value: p.quests_completed || 0,
                label: `${p.quests_completed || 0} görev`,
            }));
        } catch {
            return [];
        }
    }

    async clearCache(): Promise<void> {
        await AsyncStorage.removeItem(CACHE_KEY);
    }
}

export const wallOfFameService = new WallOfFameService();
