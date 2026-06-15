/**
 * TournamentService — Haftalık Turnuva Sistemi
 * 
 * Her hafta özel turnuva teması
 * Sınırlı süreli yarışmalar (3 gün)
 * Büyük ödüller (Gem + Exclusive Badge)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface Tournament {
    id: string;
    title: string;
    titleTr: string;
    description: string;
    descriptionTr: string;
    emoji: string;
    theme: TournamentTheme;
    /** Başlangıç ve bitiş tarihi */
    startsAt: string;
    endsAt: string;
    /** Katılım ücreti (gem) */
    entryFee: number;
    /** Ödüller */
    prizes: TournamentPrize[];
    /** Soru sayısı */
    questionCount: number;
    /** Süre limiti (saniye) */
    timeLimit: number;
    /** Max katılımcı */
    maxParticipants: number;
    /** Kategori */
    category: string;
}

export type TournamentTheme = 'speed' | 'accuracy' | 'streak' | 'survival' | 'team';

export interface TournamentPrize {
    rank: number; // 1 = 1st place
    gems: number;
    xp: number;
    badge?: string;
}

export interface TournamentEntry {
    odId: string;
    score: number;
    correctAnswers: number;
    totalAnswers: number;
    timeSpent: number;
    rank: number;
    joinedAt: string;
    completedAt?: string;
}

export interface TournamentLeaderboard {
    entries: TournamentLeaderboardEntry[];
    myEntry?: TournamentLeaderboardEntry;
}

export interface TournamentLeaderboardEntry {
    userId: string;
    displayName: string;
    avatarUrl?: string;
    score: number;
    rank: number;
    correctAnswers: number;
    timeSpent: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// WEEKLY TOURNAMENTS
// ═══════════════════════════════════════════════════════════════════════════

const TOURNAMENT_TEMPLATES: Omit<Tournament, 'id' | 'startsAt' | 'endsAt'>[] = [
    {
        title: 'Speed Blitz', titleTr: 'Hız Fırtınası',
        description: 'Answer as fast as you can!', descriptionTr: 'Olabildiğince hızlı cevapla!',
        emoji: '⚡', theme: 'speed', entryFee: 50, questionCount: 20, timeLimit: 300, maxParticipants: 100, category: 'mixed',
        prizes: [
            { rank: 1, gems: 500, xp: 1000, badge: '⚡ Speed King' },
            { rank: 2, gems: 300, xp: 600 },
            { rank: 3, gems: 200, xp: 400 },
        ],
    },
    {
        title: 'Perfect Score', titleTr: 'Mükemmel Skor',
        description: 'Accuracy matters most', descriptionTr: 'Doğruluk her şeyden önemli',
        emoji: '🎯', theme: 'accuracy', entryFee: 30, questionCount: 15, timeLimit: 600, maxParticipants: 100, category: 'mixed',
        prizes: [
            { rank: 1, gems: 400, xp: 800, badge: '🎯 Perfectionist' },
            { rank: 2, gems: 250, xp: 500 },
            { rank: 3, gems: 150, xp: 300 },
        ],
    },
    {
        title: 'Survival Mode', titleTr: 'Hayatta Kalma',
        description: 'One wrong answer and you\'re out!', descriptionTr: 'Bir yanlış cevap ve elenirsin!',
        emoji: '💀', theme: 'survival', entryFee: 100, questionCount: 30, timeLimit: 900, maxParticipants: 50, category: 'mixed',
        prizes: [
            { rank: 1, gems: 800, xp: 1500, badge: '💀 Survivor' },
            { rank: 2, gems: 500, xp: 1000 },
            { rank: 3, gems: 300, xp: 600 },
        ],
    },
    {
        title: 'Streak Master', titleTr: 'Seri Ustası',
        description: 'Build the longest correct streak', descriptionTr: 'En uzun doğru cevap serisini kur',
        emoji: '🔥', theme: 'streak', entryFee: 40, questionCount: 25, timeLimit: 500, maxParticipants: 100, category: 'mixed',
        prizes: [
            { rank: 1, gems: 450, xp: 900, badge: '🔥 Streak Lord' },
            { rank: 2, gems: 280, xp: 550 },
            { rank: 3, gems: 180, xp: 350 },
        ],
    },
];

const STORAGE_KEY = '@neuralis_tournament';

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════

class TournamentService {
    /** Aktif turnuvayı al */
    async getActiveTournament(): Promise<Tournament | null> {
        const now = new Date();
        const weekOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
        const templateIdx = weekOfYear % TOURNAMENT_TEMPLATES.length;
        const template = TOURNAMENT_TEMPLATES[templateIdx];

        // Haftanın Perşembe → Pazar arası (3 gün)
        const dayOfWeek = now.getDay();
        const thursdayOffset = (dayOfWeek >= 4) ? dayOfWeek - 4 : dayOfWeek + 3;
        const thursday = new Date(now);
        thursday.setDate(now.getDate() - thursdayOffset);
        thursday.setHours(0, 0, 0, 0);

        const sunday = new Date(thursday);
        sunday.setDate(thursday.getDate() + 3);
        sunday.setHours(23, 59, 59, 999);

        if (now < thursday || now > sunday) return null;

        return {
            ...template,
            id: `tournament-w${weekOfYear}`,
            startsAt: thursday.toISOString(),
            endsAt: sunday.toISOString(),
        };
    }

    /** Turnuvaya katıl */
    async joinTournament(tournamentId: string): Promise<boolean> {
        const data = await this.getData();
        if (data.entries[tournamentId]) return false; // Zaten katılmış
        data.entries[tournamentId] = {
            odId: tournamentId,
            score: 0,
            correctAnswers: 0,
            totalAnswers: 0,
            timeSpent: 0,
            rank: 0,
            joinedAt: new Date().toISOString(),
        };
        await this.saveData(data);
        return true;
    }

    /** Skor güncelle */
    async submitScore(tournamentId: string, correct: number, total: number, timeSpent: number): Promise<void> {
        const data = await this.getData();
        const entry = data.entries[tournamentId];
        if (!entry) return;

        // Skor hesaplama: doğru cevap × (1 + hız bonusu)
        const accuracyScore = correct * 100;
        const speedBonus = Math.max(0, 1 - timeSpent / 600) * 50;
        entry.score = Math.round(accuracyScore + speedBonus * correct);
        entry.correctAnswers = correct;
        entry.totalAnswers = total;
        entry.timeSpent = timeSpent;
        entry.completedAt = new Date().toISOString();

        await this.saveData(data);
    }

    /** Simulated leaderboard (gerçek uygulamada Supabase'den gelir) */
    async getLeaderboard(tournamentId: string): Promise<TournamentLeaderboard> {
        const data = await this.getData();
        const myEntry = data.entries[tournamentId];

        // Simüle rakipler
        const simulated: TournamentLeaderboardEntry[] = [
            { userId: 'bot1', displayName: 'Yıldız🌟', score: 1850, rank: 1, correctAnswers: 19, timeSpent: 180 },
            { userId: 'bot2', displayName: 'MathGenius', score: 1720, rank: 2, correctAnswers: 18, timeSpent: 200 },
            { userId: 'bot3', displayName: 'BrainPower', score: 1650, rank: 3, correctAnswers: 17, timeSpent: 220 },
            { userId: 'bot4', displayName: 'QuizMaster', score: 1500, rank: 4, correctAnswers: 16, timeSpent: 250 },
            { userId: 'bot5', displayName: 'NeuralisP', score: 1380, rank: 5, correctAnswers: 15, timeSpent: 280 },
        ];

        const myLeaderEntry: TournamentLeaderboardEntry | undefined = myEntry ? {
            userId: 'me',
            displayName: 'Sen',
            score: myEntry.score,
            rank: simulated.filter(s => s.score > myEntry.score).length + 1,
            correctAnswers: myEntry.correctAnswers,
            timeSpent: myEntry.timeSpent,
        } : undefined;

        return { entries: simulated, myEntry: myLeaderEntry };
    }

    /** Geçmiş turnuvalar */
    async getHistory(): Promise<TournamentEntry[]> {
        const data = await this.getData();
        return Object.values(data.entries).filter(e => e.completedAt);
    }

    private async getData(): Promise<{ entries: Record<string, TournamentEntry> }> {
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : { entries: {} };
        } catch { return { entries: {} }; }
    }

    private async saveData(data: { entries: Record<string, TournamentEntry> }): Promise<void> {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
}

export const tournamentService = new TournamentService();
export default tournamentService;
