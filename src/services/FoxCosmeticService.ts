/**
 * FoxCosmeticService - Tilki Maskot Kozmetik Sistemi
 * 
 * Siber Gözlük, Şapka, Pelerin, vs. gibi kozmetik eşyalarla
 * Shadow Fox maskotunu giydirme sistemi
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type CosmeticCategory = 'glasses' | 'hat' | 'cape' | 'collar' | 'aura' | 'pattern';
export type CosmeticRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface FoxCosmetic {
    id: string;
    name: string;
    nameTr: string;
    category: CosmeticCategory;
    rarity: CosmeticRarity;
    /** Ikon / SVG path veya emoji */
    icon: string;
    /** Renk kodu */
    color: string;
    /** Glow rengi (legendary eşyalar için) */
    glowColor?: string;
    /** Premium gerektirir mi? */
    isPremium: boolean;
    /** Gem maliyeti (free eşyaları satın almak için) */
    gemCost: number;
    /** XP seviye gereksinimi */
    requiredLevel: number;
    /** Açıklama */
    description: string;
    descriptionTr: string;
}

export interface FoxOutfit {
    glasses?: string;  // Cosmetic ID
    hat?: string;
    cape?: string;
    collar?: string;
    aura?: string;
    pattern?: string;
}

export interface OwnedCosmetic {
    cosmeticId: string;
    purchasedAt: number;
    equippedSlot?: CosmeticCategory;
}

// ═══════════════════════════════════════════════════════════════════════════
// COSMETIC CATALOG
// ═══════════════════════════════════════════════════════════════════════════

export const FOX_COSMETICS: FoxCosmetic[] = [
    // ── GLASSES ──
    {
        id: 'cyber_goggles',
        name: 'Cyber Goggles',
        nameTr: 'Siber Gözlük',
        category: 'glasses',
        rarity: 'epic',
        icon: '🥽',
        color: '#00F0FF',
        glowColor: '#00F0FF40',
        isPremium: false,
        gemCost: 500,
        requiredLevel: 10,
        description: 'Futuristic cyber goggles with LED glow',
        descriptionTr: 'LED ışıklı fütüristik siber gözlük',
    },
    {
        id: 'neon_shades',
        name: 'Neon Shades',
        nameTr: 'Neon Gözlük',
        category: 'glasses',
        rarity: 'rare',
        icon: '😎',
        color: '#FF00FF',
        isPremium: false,
        gemCost: 300,
        requiredLevel: 5,
        description: 'Cool neon sunglasses',
        descriptionTr: 'Havalı neon güneş gözlüğü',
    },
    {
        id: 'hacker_visor',
        name: 'Hacker Visor',
        nameTr: 'Hacker Vizörü',
        category: 'glasses',
        rarity: 'legendary',
        icon: '🖥️',
        color: '#00FF41',
        glowColor: '#00FF4140',
        isPremium: true,
        gemCost: 0,
        requiredLevel: 20,
        description: 'Matrix-style hacker visor with scrolling code',
        descriptionTr: 'Kayan kod efektli Matrix tarzı hacker vizörü',
    },
    {
        id: 'steampunk_monocle',
        name: 'Steampunk Monocle',
        nameTr: 'Steampunk Tek Göz',
        category: 'glasses',
        rarity: 'epic',
        icon: '🔍',
        color: '#CD7F32',
        isPremium: false,
        gemCost: 400,
        requiredLevel: 15,
        description: 'A brass monocle with gears',
        descriptionTr: 'Dişli çarklı pirinç tek göz',
    },

    // ── HATS ──
    {
        id: 'galaxy_crown',
        name: 'Galaxy Crown',
        nameTr: 'Galaksi Tacı',
        category: 'hat',
        rarity: 'legendary',
        icon: '👑',
        color: '#9B59B6',
        glowColor: '#9B59B640',
        isPremium: true,
        gemCost: 0,
        requiredLevel: 30,
        description: 'A crown made of stars and galaxies',
        descriptionTr: 'Yıldızlardan yapılmış galaksi tacı',
    },
    {
        id: 'neural_antenna',
        name: 'Neural Antenna',
        nameTr: 'Nöral Anten',
        category: 'hat',
        rarity: 'epic',
        icon: '📡',
        color: '#3498DB',
        isPremium: false,
        gemCost: 350,
        requiredLevel: 12,
        description: 'Brain-wave receiving antenna',
        descriptionTr: 'Beyin dalgası alıcı anten',
    },
    {
        id: 'flame_mohawk',
        name: 'Flame Mohawk',
        nameTr: 'Alev Mohikan',
        category: 'hat',
        rarity: 'rare',
        icon: '🔥',
        color: '#FF6B35',
        isPremium: false,
        gemCost: 250,
        requiredLevel: 8,
        description: 'A fiery mohawk hairstyle',
        descriptionTr: 'Ateşli mohikan saç stili',
    },
    {
        id: 'wizard_hat',
        name: 'Wizard Hat',
        nameTr: 'Büyücü Şapkası',
        category: 'hat',
        rarity: 'rare',
        icon: '🎩',
        color: '#2C3E50',
        isPremium: false,
        gemCost: 200,
        requiredLevel: 3,
        description: 'Classic wizard hat',
        descriptionTr: 'Klasik büyücü şapkası',
    },

    // ── CAPES ──
    {
        id: 'shadow_cloak',
        name: 'Shadow Cloak',
        nameTr: 'Gölge Pelerini',
        category: 'cape',
        rarity: 'legendary',
        icon: '🦇',
        color: '#1A1A2E',
        glowColor: '#6C5CE740',
        isPremium: true,
        gemCost: 0,
        requiredLevel: 25,
        description: 'A mysterious shadow cloak with purple glow',
        descriptionTr: 'Mor parıltılı gizemli gölge pelerini',
    },
    {
        id: 'code_cape',
        name: 'Code Cape',
        nameTr: 'Kod Pelerini',
        category: 'cape',
        rarity: 'epic',
        icon: '💻',
        color: '#2ECC71',
        isPremium: false,
        gemCost: 450,
        requiredLevel: 18,
        description: 'A cape with scrolling code patterns',
        descriptionTr: 'Kayan kod desenli pelerin',
    },
    {
        id: 'fire_wings',
        name: 'Fire Wings',
        nameTr: 'Ateş Kanatları',
        category: 'cape',
        rarity: 'epic',
        icon: '🔥',
        color: '#FF4500',
        isPremium: false,
        gemCost: 500,
        requiredLevel: 20,
        description: 'Blazing fire wings',
        descriptionTr: 'Yanan ateş kanatları',
    },

    // ── COLLARS ──
    {
        id: 'diamond_collar',
        name: 'Diamond Collar',
        nameTr: 'Elmas Tasma',
        category: 'collar',
        rarity: 'legendary',
        icon: '💎',
        color: '#00CED1',
        glowColor: '#00CED140',
        isPremium: true,
        gemCost: 0,
        requiredLevel: 35,
        description: 'A sparkling diamond collar',
        descriptionTr: 'Işıldayan elmas tasma',
    },
    {
        id: 'tech_collar',
        name: 'Tech Collar',
        nameTr: 'Teknoloji Tasması',
        category: 'collar',
        rarity: 'rare',
        icon: '⚡',
        color: '#3498DB',
        isPremium: false,
        gemCost: 200,
        requiredLevel: 5,
        description: 'LED strip collar with electric effects',
        descriptionTr: 'LED şeritli elektrik efektli tasma',
    },

    // ── AURAS ──
    {
        id: 'neural_aura',
        name: 'Neural Aura',
        nameTr: 'Nöral Aura',
        category: 'aura',
        rarity: 'legendary',
        icon: '🧠',
        color: '#A020F0',
        glowColor: '#A020F040',
        isPremium: true,
        gemCost: 0,
        requiredLevel: 40,
        description: 'A pulsating brain-wave aura',
        descriptionTr: 'Titreşen beyin dalgası aurası',
    },
    {
        id: 'fire_aura',
        name: 'Fire Aura',
        nameTr: 'Ateş Aurası',
        category: 'aura',
        rarity: 'epic',
        icon: '🔥',
        color: '#FF6B35',
        isPremium: false,
        gemCost: 600,
        requiredLevel: 22,
        description: 'Burning fire aura around the fox',
        descriptionTr: 'Tilkiyi saran yanan ateş aurası',
    },
    {
        id: 'ice_aura',
        name: 'Frost Aura',
        nameTr: 'Buz Aurası',
        category: 'aura',
        rarity: 'epic',
        icon: '❄️',
        color: '#74B9FF',
        isPremium: false,
        gemCost: 500,
        requiredLevel: 16,
        description: 'Icy frost particles surround you',
        descriptionTr: 'Buzlu parçacıklar seni sarıyor',
    },

    // ── PATTERNS ──
    {
        id: 'galaxy_fur',
        name: 'Galaxy Fur',
        nameTr: 'Galaksi Kürk',
        category: 'pattern',
        rarity: 'legendary',
        icon: '🌌',
        color: '#6C5CE7',
        glowColor: '#6C5CE740',
        isPremium: true,
        gemCost: 0,
        requiredLevel: 50,
        description: 'Cosmic galaxy pattern on fur',
        descriptionTr: 'Kürk üzerinde kozmik galaksi deseni',
    },
    {
        id: 'circuit_pattern',
        name: 'Circuit Pattern',
        nameTr: 'Devre Deseni',
        category: 'pattern',
        rarity: 'rare',
        icon: '🔌',
        color: '#00FF41',
        isPremium: false,
        gemCost: 300,
        requiredLevel: 10,
        description: 'Electronic circuit board pattern',
        descriptionTr: 'Elektronik devre kartı deseni',
    },
    {
        id: 'tiger_stripes',
        name: 'Tiger Stripes',
        nameTr: 'Kaplan Çizgileri',
        category: 'pattern',
        rarity: 'common',
        icon: '🐯',
        color: '#FF9800',
        isPremium: false,
        gemCost: 100,
        requiredLevel: 1,
        description: 'Classic tiger stripe pattern',
        descriptionTr: 'Klasik kaplan çizgisi deseni',
    },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export function getCosmeticsByCategory(category: CosmeticCategory): FoxCosmetic[] {
    return FOX_COSMETICS.filter(c => c.category === category);
}

export function getCosmeticById(id: string): FoxCosmetic | undefined {
    return FOX_COSMETICS.find(c => c.id === id);
}

export function getRarityColor(rarity: CosmeticRarity): string {
    switch (rarity) {
        case 'common': return '#95A5A6';
        case 'rare': return '#3498DB';
        case 'epic': return '#9B59B6';
        case 'legendary': return '#FFD700';
    }
}

export function getRarityLabel(rarity: CosmeticRarity): string {
    switch (rarity) {
        case 'common': return 'Yaygın';
        case 'rare': return 'Nadir';
        case 'epic': return 'Epik';
        case 'legendary': return 'Efsanevi';
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_KEY_OUTFIT = '@neuralis_fox_outfit';
const STORAGE_KEY_OWNED = '@neuralis_fox_owned';

class FoxCosmeticService {
    /**
     * Kullanıcının sahip olduğu kozmetikleri al
     */
    async getOwnedCosmetics(userId: string): Promise<OwnedCosmetic[]> {
        try {
            const raw = await AsyncStorage.getItem(`${STORAGE_KEY_OWNED}_${userId}`);
            if (raw) return JSON.parse(raw);
        } catch (e) {
            console.error('FoxCosmeticService: getOwnedCosmetics error', e);
        }
        return [];
    }

    /**
     * Aktif kıyafeti al
     */
    async getActiveOutfit(userId: string): Promise<FoxOutfit> {
        try {
            const raw = await AsyncStorage.getItem(`${STORAGE_KEY_OUTFIT}_${userId}`);
            if (raw) return JSON.parse(raw);
        } catch (e) {
            console.error('FoxCosmeticService: getActiveOutfit error', e);
        }
        return {};
    }

    /**
     * Kozmetik satın al
     */
    async purchaseCosmetic(
        userId: string,
        cosmeticId: string,
        currentGems: number
    ): Promise<{
        success: boolean;
        message: string;
        remainingGems: number;
    }> {
        const cosmetic = getCosmeticById(cosmeticId);
        if (!cosmetic) {
            return { success: false, message: 'Kozmetik bulunamadı.', remainingGems: currentGems };
        }

        // Premium kontrolü
        if (cosmetic.isPremium) {
            return { success: false, message: 'Bu eşya sadece Premium üyelere özel!', remainingGems: currentGems };
        }

        // Gem kontrolü
        if (currentGems < cosmetic.gemCost) {
            return {
                success: false,
                message: `Yeterli gem yok! ${cosmetic.gemCost} gem gerekiyor, ${currentGems} gem var.`,
                remainingGems: currentGems,
            };
        }

        // Zaten sahip mi?
        const owned = await this.getOwnedCosmetics(userId);
        if (owned.find(o => o.cosmeticId === cosmeticId)) {
            return { success: false, message: 'Bu eşyaya zaten sahipsin!', remainingGems: currentGems };
        }

        // Satın al
        owned.push({ cosmeticId, purchasedAt: Date.now() });
        await AsyncStorage.setItem(`${STORAGE_KEY_OWNED}_${userId}`, JSON.stringify(owned));

        // Gem düş
        const newGems = currentGems - cosmetic.gemCost;
        try {
            await supabase.rpc('add_gems', { p_user_id: userId, p_amount: -cosmetic.gemCost });
        } catch (e) {
            console.warn('FoxCosmeticService: gem deduction server sync failed', e);
        }

        return {
            success: true,
            message: `${cosmetic.nameTr} satın alındı! 🎉`,
            remainingGems: newGems,
        };
    }

    /**
     * Kozmetik eşyayı kuşan
     */
    async equipCosmetic(
        userId: string,
        cosmeticId: string
    ): Promise<FoxOutfit> {
        const cosmetic = getCosmeticById(cosmeticId);
        if (!cosmetic) return this.getActiveOutfit(userId);

        const outfit = await this.getActiveOutfit(userId);
        outfit[cosmetic.category] = cosmeticId;

        await AsyncStorage.setItem(`${STORAGE_KEY_OUTFIT}_${userId}`, JSON.stringify(outfit));

        // Sunucuya senkronize et
        try {
            await supabase.from('profiles').update({
                fox_outfit: outfit,
            }).eq('id', userId);
        } catch (e) {
            console.warn('FoxCosmeticService: outfit sync failed', e);
        }

        return outfit;
    }

    /**
     * Kozmetik eşyayı çıkar
     */
    async unequipCosmetic(
        userId: string,
        category: CosmeticCategory
    ): Promise<FoxOutfit> {
        const outfit = await this.getActiveOutfit(userId);
        delete outfit[category];

        await AsyncStorage.setItem(`${STORAGE_KEY_OUTFIT}_${userId}`, JSON.stringify(outfit));

        try {
            await supabase.from('profiles').update({ fox_outfit: outfit }).eq('id', userId);
        } catch (e) {
            console.warn('FoxCosmeticService: outfit sync failed', e);
        }

        return outfit;
    }

    /**
     * Premium kozmetikleri otomatik aç
     */
    async unlockPremiumCosmetics(userId: string): Promise<void> {
        const owned = await this.getOwnedCosmetics(userId);
        const premiumItems = FOX_COSMETICS.filter(c => c.isPremium);

        let updated = false;
        for (const item of premiumItems) {
            if (!owned.find(o => o.cosmeticId === item.id)) {
                owned.push({ cosmeticId: item.id, purchasedAt: Date.now() });
                updated = true;
            }
        }

        if (updated) {
            await AsyncStorage.setItem(`${STORAGE_KEY_OWNED}_${userId}`, JSON.stringify(owned));
        }
    }
}

export const foxCosmeticService = new FoxCosmeticService();
export default foxCosmeticService;
