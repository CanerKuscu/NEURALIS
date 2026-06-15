/**
 * BrainMapService - Beyin Haritası Çürüme Sistemi
 * 
 * Kullanmadığın yeteneklerin "çürüdüğünü" görsel olarak gösterir.
 * Her yetenek/kategori bir nöron noktası olarak görselleştirilir.
 * Kullanılmayan yetenekler zamanla solar, aktif olanlar parlar.
 */

import { supabase } from '../config/supabase';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type SkillHealth = 'thriving' | 'healthy' | 'fading' | 'decaying' | 'dead';

export interface SkillNode {
    /** Yetenek/kategori adı */
    skillId: string;
    /** Görüntülenen isim */
    name: string;
    /** Türkçe isim */
    nameTr: string;
    /** Kategori rengi */
    color: string;
    /** Sağlık durumu (0-100) */
    health: number;
    /** Sağlık seviyesi */
    healthState: SkillHealth;
    /** Son pratik yapılan tarih */
    lastPracticedAt: string | null;
    /** Toplam tamamlanan ders */
    totalLessons: number;
    /** Seviye */
    level: 'beginner' | 'intermediate' | 'advanced';
    /** Çürüme gün sayısı */
    daysSinceLastPractice: number;
    /** Opaklık (0-1) - UI için */
    opacity: number;
    /** Boyut çarpanı (0.3-1.0) - UI için */
    scale: number;
    /** Titreşim yoğunluğu (parlaklık animasyonu) */
    pulseIntensity: number;
    /** Renk doygunluğu (0-1) */
    saturation: number;
}

export interface BrainMapData {
    userId: string;
    skills: SkillNode[];
    overallHealth: number;
    decayingCount: number;
    thrivingCount: number;
    totalSkills: number;
    lastUpdated: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SKILL DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

const SKILL_DEFINITIONS: Array<{
    id: string;
    name: string;
    nameTr: string;
    color: string;
    category: string;
}> = [
        { id: 'mathematics', name: 'Mathematics', nameTr: 'Matematik', color: '#4FACFE', category: 'science' },
        { id: 'programming', name: 'Programming', nameTr: 'Programlama', color: '#A18CD1', category: 'tech' },
        { id: 'music_theory', name: 'Music Theory', nameTr: 'Müzik Teorisi', color: '#FF9A9E', category: 'arts' },
        { id: 'technology', name: 'Technology', nameTr: 'Teknoloji', color: '#43E97B', category: 'tech' },
        { id: 'art_design', name: 'Art & Design', nameTr: 'Sanat & Tasarım', color: '#FA709A', category: 'arts' },
        { id: 'science', name: 'Science', nameTr: 'Bilim', color: '#30CFD0', category: 'science' },
        { id: 'languages', name: 'Languages', nameTr: 'Diller', color: '#5EE7DF', category: 'languages' },
        { id: 'general', name: 'General Knowledge', nameTr: 'Genel Kültür', color: '#F6D365', category: 'general' },
        { id: 'english', name: 'English', nameTr: 'İngilizce', color: '#1CB0F6', category: 'languages' },
        { id: 'german', name: 'German', nameTr: 'Almanca', color: '#FFD700', category: 'languages' },
        { id: 'python', name: 'Python', nameTr: 'Python', color: '#3776AB', category: 'tech' },
        { id: 'javascript', name: 'JavaScript', nameTr: 'JavaScript', color: '#F7DF1E', category: 'tech' },
        { id: 'physics', name: 'Physics', nameTr: 'Fizik', color: '#FF6B6B', category: 'science' },
        { id: 'chemistry', name: 'Chemistry', nameTr: 'Kimya', color: '#2ECC71', category: 'science' },
        { id: 'history', name: 'History', nameTr: 'Tarih', color: '#CD7F32', category: 'general' },
        { id: 'finance', name: 'Finance', nameTr: 'Finans', color: '#58CC02', category: 'finance' },
    ];

// ═══════════════════════════════════════════════════════════════════════════
// DECAY CALCULATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Gün sayısına göre sağlık durumunu hesapla
 * 0 gün: 100 (thriving)
 * 1-2 gün: 80-100 (healthy)
 * 3-5 gün: 50-80 (fading)
 * 6-10 gün: 20-50 (decaying) 
 * 11+ gün: 0-20 (dead)
 */
function calculateHealth(daysSince: number, level: string): number {
    if (daysSince === 0) return 100;

    // Seviye bonusu - ileri seviye yetenekler daha yavaş çürür
    const levelBonus = level === 'advanced' ? 0.7 : level === 'intermediate' ? 0.85 : 1.0;
    const effectiveDays = daysSince * levelBonus;

    if (effectiveDays <= 2) return Math.max(80, 100 - effectiveDays * 10);
    if (effectiveDays <= 5) return Math.max(50, 80 - (effectiveDays - 2) * 10);
    if (effectiveDays <= 10) return Math.max(20, 50 - (effectiveDays - 5) * 6);
    return Math.max(0, 20 - (effectiveDays - 10) * 2);
}

function getHealthState(health: number): SkillHealth {
    if (health >= 90) return 'thriving';
    if (health >= 60) return 'healthy';
    if (health >= 40) return 'fading';
    if (health >= 15) return 'decaying';
    return 'dead';
}

function getVisualParams(health: number): {
    opacity: number;
    scale: number;
    pulseIntensity: number;
    saturation: number;
} {
    // Health 0 → düşük/soluk, Health 100 → parlak/büyük
    return {
        opacity: 0.15 + (health / 100) * 0.85,
        scale: 0.3 + (health / 100) * 0.7,
        pulseIntensity: health >= 80 ? 1.0 : health >= 50 ? 0.5 : 0,
        saturation: health / 100,
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════

class BrainMapService {
    /**
     * Kullanıcının beyin haritası verisini al
     */
    async getBrainMap(userId: string): Promise<BrainMapData> {
        // Kullanıcının tüm kategori seviyelerini al
        const { data: categoryLevels } = await supabase
            .from('user_category_levels')
            .select('category, level, updated_at, placement_score')
            .eq('user_id', userId);

        // Kullanıcının ders geçmişini al (son tarihler)
        const { data: lessonHistory } = await supabase
            .from('profiles')
            .select('lessons_completed, last_streak_date')
            .eq('id', userId)
            .single();

        const now = new Date();
        const today = now.toISOString().split('T')[0];

        const skills: SkillNode[] = SKILL_DEFINITIONS.map(def => {
            const catLevel = categoryLevels?.find(c =>
                c.category?.toLowerCase() === def.id.toLowerCase() ||
                c.category?.toLowerCase() === def.name.toLowerCase() ||
                c.category?.toLowerCase() === def.nameTr.toLowerCase()
            );

            const lastPracticed = catLevel?.updated_at || null;
            const level = (catLevel?.level as 'beginner' | 'intermediate' | 'advanced') || 'beginner';
            const totalLessons = catLevel ? 1 : 0;

            // Gün farkı hesapla
            let daysSince = 999;
            if (lastPracticed) {
                const lastDate = new Date(lastPracticed);
                daysSince = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
            } else if (!catLevel) {
                // Hiç çalışılmamış - haritada göster ama çürümüş
                daysSince = 30;
            }

            const health = totalLessons > 0 ? calculateHealth(daysSince, level) : 0;
            const healthState = getHealthState(health);
            const { opacity, scale, pulseIntensity, saturation } = getVisualParams(health);

            return {
                skillId: def.id,
                name: def.name,
                nameTr: def.nameTr,
                color: def.color,
                health,
                healthState,
                lastPracticedAt: lastPracticed,
                totalLessons,
                level,
                daysSinceLastPractice: daysSince,
                opacity,
                scale,
                pulseIntensity,
                saturation,
            };
        });

        // Sadece en az bir kez çalışılmış olan yetenekleri değerlendir
        const activeSkills = skills.filter(s => s.totalLessons > 0);
        const overallHealth = activeSkills.length > 0
            ? Math.round(activeSkills.reduce((sum, s) => sum + s.health, 0) / activeSkills.length)
            : 0;

        return {
            userId,
            skills,
            overallHealth,
            decayingCount: skills.filter(s => s.healthState === 'decaying' || s.healthState === 'dead').length,
            thrivingCount: skills.filter(s => s.healthState === 'thriving' || s.healthState === 'healthy').length,
            totalSkills: skills.length,
            lastUpdated: today,
        };
    }

    /**
     * Belirli bir yeteneğin sağlık durumunu güncelle (ders tamamlandıktan sonra)
     */
    async refreshSkill(userId: string, skillId: string): Promise<SkillNode | null> {
        const map = await this.getBrainMap(userId);
        return map.skills.find(s => s.skillId === skillId) || null;
    }

    /**
     * En çürümüş yetenekleri getir (motivasyon amaçlı)
     */
    async getMostDecayed(userId: string, limit: number = 3): Promise<SkillNode[]> {
        const map = await this.getBrainMap(userId);
        return map.skills
            .filter(s => s.totalLessons > 0)
            .sort((a, b) => a.health - b.health)
            .slice(0, limit);
    }
}

export const brainMapService = new BrainMapService();
export default brainMapService;
