/**
 * NEURALIS - Skill Tree RPG Service
 * Ön koşullu RPG yetenek ağacı — konuları sırayla aç
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface SkillNode {
    id: string;
    title: string;
    description: string;
    category: string;
    icon: string;
    xpRequired: number;
    prerequisites: string[]; // node IDs
    status: 'locked' | 'available' | 'in-progress' | 'completed';
    progress: number; // 0-100
    level: number; // 1-5
    position: { x: number; y: number }; // for tree layout
    rewards: { xp: number; badge?: string };
}

export interface SkillTree {
    id: string;
    category: string;
    title: string;
    nodes: SkillNode[];
    totalNodes: number;
    completedNodes: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// SKILL TREE DATA  
// ═══════════════════════════════════════════════════════════════════════════

const MATH_TREE: Omit<SkillNode, 'status' | 'progress'>[] = [
    { id: 'math_basics', title: 'Temel İşlemler', description: 'Toplama, çıkarma, çarpma, bölme', category: 'mathematics', icon: '➕', xpRequired: 0, prerequisites: [], level: 1, position: { x: 0.5, y: 0.9 }, rewards: { xp: 50 } },
    { id: 'math_fractions', title: 'Kesirler', description: 'Kesir işlemleri ve dönüşümler', category: 'mathematics', icon: '🔢', xpRequired: 50, prerequisites: ['math_basics'], level: 1, position: { x: 0.3, y: 0.75 }, rewards: { xp: 75 } },
    { id: 'math_decimals', title: 'Ondalıklar', description: 'Ondalık sayılar ve yüzdeler', category: 'mathematics', icon: '📊', xpRequired: 50, prerequisites: ['math_basics'], level: 1, position: { x: 0.7, y: 0.75 }, rewards: { xp: 75 } },
    { id: 'math_algebra1', title: 'Cebir I', description: 'Denklemler ve eşitsizlikler', category: 'mathematics', icon: '🔤', xpRequired: 100, prerequisites: ['math_fractions', 'math_decimals'], level: 2, position: { x: 0.5, y: 0.6 }, rewards: { xp: 100 } },
    { id: 'math_geometry1', title: 'Geometri I', description: 'Açılar, üçgenler, çokgenler', category: 'mathematics', icon: '📐', xpRequired: 100, prerequisites: ['math_basics'], level: 2, position: { x: 0.15, y: 0.55 }, rewards: { xp: 100 } },
    { id: 'math_stats', title: 'İstatistik', description: 'Ortalama, medyan, mod', category: 'mathematics', icon: '📈', xpRequired: 100, prerequisites: ['math_decimals'], level: 2, position: { x: 0.85, y: 0.55 }, rewards: { xp: 100 } },
    { id: 'math_algebra2', title: 'Cebir II', description: 'Polinomlar ve fonksiyonlar', category: 'mathematics', icon: '📐', xpRequired: 200, prerequisites: ['math_algebra1'], level: 3, position: { x: 0.4, y: 0.4 }, rewards: { xp: 150, badge: 'Algebra Master' } },
    { id: 'math_geometry2', title: 'Geometri II', description: 'Daire, hacim, alan', category: 'mathematics', icon: '🔵', xpRequired: 200, prerequisites: ['math_geometry1', 'math_algebra1'], level: 3, position: { x: 0.2, y: 0.35 }, rewards: { xp: 150 } },
    { id: 'math_trig', title: 'Trigonometri', description: 'Sin, cos, tan ve uygulamalar', category: 'mathematics', icon: '📏', xpRequired: 250, prerequisites: ['math_algebra2', 'math_geometry2'], level: 4, position: { x: 0.3, y: 0.2 }, rewards: { xp: 200 } },
    { id: 'math_calculus', title: 'Türev & İntegral', description: 'Limit, türev, integral', category: 'mathematics', icon: '∫', xpRequired: 300, prerequisites: ['math_trig'], level: 5, position: { x: 0.5, y: 0.05 }, rewards: { xp: 300, badge: 'Math Champion' } },
];

const SCIENCE_TREE: Omit<SkillNode, 'status' | 'progress'>[] = [
    { id: 'sci_matter', title: 'Madde', description: 'Maddenin halleri ve özellikleri', category: 'science', icon: '⚗️', xpRequired: 0, prerequisites: [], level: 1, position: { x: 0.5, y: 0.9 }, rewards: { xp: 50 } },
    { id: 'sci_energy', title: 'Enerji', description: 'Enerji türleri ve dönüşümler', category: 'science', icon: '⚡', xpRequired: 50, prerequisites: ['sci_matter'], level: 1, position: { x: 0.3, y: 0.75 }, rewards: { xp: 75 } },
    { id: 'sci_cells', title: 'Hücre', description: 'Hücre yapısı ve bölünme', category: 'science', icon: '🧬', xpRequired: 50, prerequisites: ['sci_matter'], level: 1, position: { x: 0.7, y: 0.75 }, rewards: { xp: 75 } },
    { id: 'sci_forces', title: 'Kuvvetler', description: 'Newton yasaları', category: 'science', icon: '🏋️', xpRequired: 100, prerequisites: ['sci_energy'], level: 2, position: { x: 0.2, y: 0.55 }, rewards: { xp: 100 } },
    { id: 'sci_chemistry', title: 'Kimya', description: 'Atom, element, bileşik', category: 'science', icon: '🧪', xpRequired: 100, prerequisites: ['sci_matter', 'sci_energy'], level: 2, position: { x: 0.5, y: 0.55 }, rewards: { xp: 100 } },
    { id: 'sci_biology', title: 'Biyoloji', description: 'Canlılar ve sistemler', category: 'science', icon: '🌿', xpRequired: 100, prerequisites: ['sci_cells'], level: 2, position: { x: 0.8, y: 0.55 }, rewards: { xp: 100 } },
    { id: 'sci_waves', title: 'Dalgalar', description: 'Ses ve ışık dalgaları', category: 'science', icon: '🌊', xpRequired: 200, prerequisites: ['sci_forces'], level: 3, position: { x: 0.15, y: 0.35 }, rewards: { xp: 150 } },
    { id: 'sci_organic', title: 'Organik Kimya', description: 'Karbon bileşikleri', category: 'science', icon: '💎', xpRequired: 250, prerequisites: ['sci_chemistry', 'sci_biology'], level: 4, position: { x: 0.5, y: 0.2 }, rewards: { xp: 200, badge: 'Science Pro' } },
    { id: 'sci_quantum', title: 'Modern Fizik', description: 'Kuantum ve relativite', category: 'science', icon: '🌌', xpRequired: 300, prerequisites: ['sci_waves', 'sci_organic'], level: 5, position: { x: 0.5, y: 0.05 }, rewards: { xp: 300, badge: 'Science Champion' } },
];

const TREE_DATA: Record<string, Omit<SkillNode, 'status' | 'progress'>[]> = {
    mathematics: MATH_TREE,
    science: SCIENCE_TREE,
};

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = '@neuralis/skill_tree';

class SkillTreeService {
    async getTree(userId: string, category: string): Promise<SkillTree | null> {
        const templateNodes = TREE_DATA[category];
        if (!templateNodes) return null;

        const progressData = await this.getProgress(userId, category);
        const { data: catLevel } = await supabase.from('user_category_levels')
            .select('total_xp_in_category')
            .eq('user_id', userId)
            .eq('category', category)
            .single();

        const userXP = catLevel?.total_xp_in_category || 0;

        const nodes: SkillNode[] = templateNodes.map(t => {
            const saved = progressData[t.id];
            const prereqsMet = t.prerequisites.length === 0 ||
                t.prerequisites.every(p => (progressData[p]?.status === 'completed'));
            const hasXP = userXP >= t.xpRequired;

            let status: SkillNode['status'] = 'locked';
            if (saved?.status === 'completed') status = 'completed';
            else if (saved?.status === 'in-progress') status = 'in-progress';
            else if (prereqsMet && hasXP) status = 'available';

            return {
                ...t,
                status,
                progress: saved?.progress || 0,
            };
        });

        return {
            id: `tree_${category}`,
            category,
            title: category === 'mathematics' ? 'Matematik Yetenek Ağacı' : 'Bilim Yetenek Ağacı',
            nodes,
            totalNodes: nodes.length,
            completedNodes: nodes.filter(n => n.status === 'completed').length,
        };
    }

    async updateNodeProgress(userId: string, category: string, nodeId: string, progress: number): Promise<void> {
        const data = await this.getProgress(userId, category);
        data[nodeId] = {
            status: progress >= 100 ? 'completed' : 'in-progress',
            progress: Math.min(progress, 100),
        };
        await AsyncStorage.setItem(`${STORAGE_KEY}_${userId}_${category}`, JSON.stringify(data));
    }

    async completeNode(userId: string, category: string, nodeId: string): Promise<void> {
        await this.updateNodeProgress(userId, category, nodeId, 100);
    }

    private async getProgress(userId: string, category: string): Promise<Record<string, { status: string; progress: number }>> {
        try {
            const raw = await AsyncStorage.getItem(`${STORAGE_KEY}_${userId}_${category}`);
            return raw ? JSON.parse(raw) : {};
        } catch { return {}; }
    }

    getAvailableCategories(): { id: string; title: string; emoji: string }[] {
        return [
            { id: 'mathematics', title: 'Matematik', emoji: '🔢' },
            { id: 'science', title: 'Bilim', emoji: '🔬' },
        ];
    }
}

export const skillTreeService = new SkillTreeService();
