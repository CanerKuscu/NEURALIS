/**
 * AvatarService - Avatar Evolution System
 * Fox avatar customization and evolution management
 */

import { supabase } from '../config/supabase';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type AvatarCategory = 'glasses' | 'outfit' | 'accessory' | 'costume' | 'hat';
export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type UnlockType = 'free' | 'xp' | 'streak' | 'league' | 'premium';
export type FoxMood = 'happy' | 'neutral' | 'sad' | 'excited' | 'sleepy';

export interface AvatarItem {
    id: string;
    name: string;
    nameTr: string;
    category: AvatarCategory;
    rarity: ItemRarity;
    unlockType: UnlockType;
    unlockValue: number;
    unlockLeague?: string;
    imageUrl?: string;
    previewUrl?: string;
    isPremium: boolean;
    isDefault: boolean;
    sortOrder: number;
}

export interface UserAvatarItem {
    itemId: string;
    unlockedAt: number;
    equipped: boolean;
    item?: AvatarItem;
}

export interface UserAvatarState {
    equippedGlasses?: string;
    equippedOutfit?: string;
    equippedAccessory?: string;
    equippedCostume?: string;
    equippedHat?: string;
    foxMood: FoxMood;
    foxLevel: number;
}

export interface UnlockProgress {
    item: AvatarItem;
    canUnlock: boolean;
    isOwned: boolean;
    progress: number;  // 0-100
    requirement: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// AVATAR SERVICE
// ═══════════════════════════════════════════════════════════════════════════

class AvatarService {
    /**
     * Fetches all avatar items (catalog)
     */
    async getAllItems(): Promise<AvatarItem[]> {
        try {
            const { data, error } = await supabase
                .from('avatar_items')
                .select('*')
                .order('category')
                .order('sort_order');

            if (error) throw error;
            return (data || []).map(this.mapToAvatarItem);
        } catch (error) {
            console.error('Failed to fetch avatar items:', error);
            return [];
        }
    }

    /**
     * Fetches avatar items by category
     */
    async getItemsByCategory(category: AvatarCategory): Promise<AvatarItem[]> {
        try {
            const { data, error } = await supabase
                .from('avatar_items')
                .select('*')
                .eq('category', category)
                .order('sort_order');

            if (error) throw error;
            return (data || []).map(this.mapToAvatarItem);
        } catch (error) {
            console.error('Failed to fetch items by category:', error);
            return [];
        }
    }

    /**
     * Fetches items owned by the user
     */
    async getUserItems(userId: string): Promise<UserAvatarItem[]> {
        try {
            const { data, error } = await supabase
                .from('user_avatar_items')
                .select(`
                    item_id,
                    unlocked_at,
                    equipped,
                    avatar_items (*)
                `)
                .eq('user_id', userId);

            if (error) throw error;

            return (data || []).map(row => ({
                itemId: row.item_id,
                unlockedAt: row.unlocked_at,
                equipped: row.equipped,
                item: row.avatar_items ? this.mapToAvatarItem(row.avatar_items) : undefined,
            }));
        } catch (error) {
            console.error('Failed to fetch user items:', error);
            return [];
        }
    }

    /**
     * Fetches the user's current avatar state
     */
    async getUserAvatarState(userId: string): Promise<UserAvatarState | null> {
        try {
            const { data, error } = await supabase
                .from('user_avatar_state')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (!data) {
                // If no state exists yet, create default
                return await this.initializeUserAvatar(userId);
            }

            return {
                equippedGlasses: data.equipped_glasses,
                equippedOutfit: data.equipped_outfit,
                equippedAccessory: data.equipped_accessory,
                equippedCostume: data.equipped_costume,
                equippedHat: data.equipped_hat,
                foxMood: data.fox_mood as FoxMood,
                foxLevel: data.fox_level,
            };
        } catch (error) {
            console.error('Failed to fetch avatar state:', error);
            return null;
        }
    }

    /**
     * Creates default avatar for a new user
     */
    async initializeUserAvatar(userId: string): Promise<UserAvatarState> {
        try {
            // Add default items
            const defaultItems = await this.getDefaultItems();
            for (const item of defaultItems) {
                await this.unlockItem(userId, item.id);
            }

            // Create state
            const defaultState: UserAvatarState = {
                equippedGlasses: 'glasses_none',
                equippedOutfit: 'outfit_student',
                foxMood: 'neutral',
                foxLevel: 1,
            };

            await supabase.from('user_avatar_state').upsert({
                user_id: userId,
                equipped_glasses: defaultState.equippedGlasses,
                equipped_outfit: defaultState.equippedOutfit,
                fox_mood: defaultState.foxMood,
                fox_level: defaultState.foxLevel,
            });

            return defaultState;
        } catch (error) {
            console.error('Failed to initialize avatar:', error);
            return { foxMood: 'neutral', foxLevel: 1 };
        }
    }

    /**
     * Unlocks an item for the user
     */
    async unlockItem(userId: string, itemId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('user_avatar_items')
                .upsert({
                    user_id: userId,
                    item_id: itemId,
                    unlocked_at: new Date().toISOString(),
                    equipped: false,
                });

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Failed to unlock item:', error);
            return false;
        }
    }

    /**
     * Equips an item
     */
    async equipItem(userId: string, itemId: string, category: AvatarCategory): Promise<boolean> {
        try {
            // First check if user owns the item
            const { data: owned } = await supabase
                .from('user_avatar_items')
                .select('item_id')
                .eq('user_id', userId)
                .eq('item_id', itemId)
                .single();

            if (!owned) {
                console.warn('User does not own this item');
                return false;
            }

            // Update avatar state
            const columnMap: Record<AvatarCategory, string> = {
                glasses: 'equipped_glasses',
                outfit: 'equipped_outfit',
                accessory: 'equipped_accessory',
                costume: 'equipped_costume',
                hat: 'equipped_hat',
            };

            const updateData: Record<string, any> = {
                user_id: userId,
                [columnMap[category]]: itemId,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('user_avatar_state')
                .upsert(updateData);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Failed to equip item:', error);
            return false;
        }
    }

    /**
     * Checks items the user can unlock and auto-unlocks them
     */
    async checkAndUnlockNewItems(userId: string): Promise<AvatarItem[]> {
        try {
            // User profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('total_xp, longest_streak, league_points, is_premium')
                .eq('id', userId)
                .single();

            if (!profile) return [];

            // Items not owned
            const { data: allItems } = await supabase
                .from('avatar_items')
                .select('*');

            const { data: ownedItems } = await supabase
                .from('user_avatar_items')
                .select('item_id')
                .eq('user_id', userId);

            const ownedIds = new Set((ownedItems || []).map(i => i.item_id));
            const newUnlocks: AvatarItem[] = [];

            for (const item of allItems || []) {
                if (ownedIds.has(item.id)) continue;

                const canUnlock = this.checkUnlockCondition(item, profile);
                if (canUnlock) {
                    await this.unlockItem(userId, item.id);
                    newUnlocks.push(this.mapToAvatarItem(item));
                }
            }

            return newUnlocks;
        } catch (error) {
            console.error('Failed to check unlocks:', error);
            return [];
        }
    }

    /**
     * Updates the fox mood
     */
    async updateFoxMood(userId: string, mood: FoxMood): Promise<void> {
        try {
            await supabase
                .from('user_avatar_state')
                .upsert({
                    user_id: userId,
                    fox_mood: mood,
                    updated_at: new Date().toISOString(),
                });
        } catch (error) {
            console.error('Failed to update fox mood:', error);
        }
    }

    /**
     * Calculates fox level based on XP
     */
    calculateFoxLevel(totalXP: number): number {
        if (totalXP < 100) return 1;
        if (totalXP < 500) return 2;
        if (totalXP < 2000) return 3;
        if (totalXP < 5000) return 4;
        if (totalXP < 15000) return 5;
        if (totalXP < 50000) return 6;
        return 7; // Max level
    }

    // ═══════════════════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ═══════════════════════════════════════════════════════════════

    private async getDefaultItems(): Promise<AvatarItem[]> {
        const { data } = await supabase
            .from('avatar_items')
            .select('*')
            .eq('is_default', true);
        return (data || []).map(this.mapToAvatarItem);
    }

    private checkUnlockCondition(item: any, profile: any): boolean {
        switch (item.unlock_type) {
            case 'free':
                return true;
            case 'xp':
                return profile.total_xp >= item.unlock_value;
            case 'streak':
                return profile.longest_streak >= item.unlock_value;
            case 'league':
                return this.checkLeagueUnlock(profile.league_points, item.unlock_league);
            case 'premium':
                return profile.is_premium;
            default:
                return false;
        }
    }

    private checkLeagueUnlock(points: number, league: string): boolean {
        const thresholds: Record<string, number> = {
            bronze: 0,
            silver: 500,
            gold: 2000,
            platinum: 5000,
            diamond: 15000,
            master: 50000,
            legend: 100000,
        };
        return points >= (thresholds[league] || Infinity);
    }

    private mapToAvatarItem(row: any): AvatarItem {
        return {
            id: row.id,
            name: row.name,
            nameTr: row.name_tr,
            category: row.category as AvatarCategory,
            rarity: row.rarity as ItemRarity,
            unlockType: row.unlock_type as UnlockType,
            unlockValue: row.unlock_value || 0,
            unlockLeague: row.unlock_league,
            imageUrl: row.image_url,
            previewUrl: row.preview_url,
            isPremium: row.is_premium || false,
            isDefault: row.is_default || false,
            sortOrder: row.sort_order || 0,
        };
    }
}

export const avatarService = new AvatarService();
export default avatarService;
