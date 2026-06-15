/**
 * AudioLessonService — Sesli Dersler (Podcast Tarzı)
 * 
 * Expo-Speech TTS ile ders anlatımı.
 * Podcast stili sesli dersler, arka planda çalma.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface AudioLesson {
    id: string;
    title: string;
    titleTr: string;
    description: string;
    descriptionTr: string;
    category: string;
    emoji: string;
    /** TTS ile okunacak metin bölümleri */
    segments: AudioSegment[];
    /** Toplam tahmini süre (saniye) */
    estimatedDuration: number;
    /** Quiz soruları (dinleme sonrası) */
    quiz: AudioQuiz[];
    xpReward: number;
    level: 'beginner' | 'intermediate' | 'advanced';
}

export interface AudioSegment {
    id: string;
    text: string;
    textTr: string;
    /** Bekleme süresi (ms) - segment arası */
    pauseAfter: number;
    /** Önemli anahtar kelime */
    keyword?: string;
}

export interface AudioQuiz {
    question: string;
    questionTr: string;
    options: string[];
    correctIndex: number;
}

export interface AudioProgress {
    lessonId: string;
    completedSegments: string[];
    isCompleted: boolean;
    quizScore: number;
    lastPlayedAt: string;
    playCount: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// AUDIO LESSONS DATA
// ═══════════════════════════════════════════════════════════════════════════

export const AUDIO_LESSONS: AudioLesson[] = [
    {
        id: 'al-solar', title: 'The Solar System', titleTr: 'Güneş Sistemi',
        description: 'A journey through our cosmic neighborhood',
        descriptionTr: 'Kozmik komşuluğumuzda bir yolculuk',
        category: 'science', emoji: '🌍', estimatedDuration: 180, level: 'beginner', xpReward: 40,
        segments: [
            { id: 's1', text: 'Our solar system...', textTr: 'Güneş sistemimiz, Samanyolu galaksisinin bir köşesinde yer alıyor. Merkezinde, Dünya\'dan 1.3 milyon kat büyük olan Güneş var.', pauseAfter: 2000, keyword: 'Güneş' },
            { id: 's2', text: 'Inner planets...', textTr: 'İç gezegenler Merkür, Venüs, Dünya ve Mars\'tır. Bunlara kayaç gezegenler denir çünkü yüzeyleri katı kayadan oluşur.', pauseAfter: 2000, keyword: 'Kayaç' },
            { id: 's3', text: 'Outer planets...', textTr: 'Dış gezegenler Jüpiter, Satürn, Uranüs ve Neptün\'dür. Bunlar gaz devleridir ve çok daha büyüktürler.', pauseAfter: 2000, keyword: 'Gaz devleri' },
            { id: 's4', text: 'Fun fact...', textTr: 'İlginç bir bilgi: Jüpiter o kadar büyüktür ki, diğer tüm gezegenleri içine sığdırabilir! Ayrıca 79 bilinen uydusu vardır.', pauseAfter: 1000, keyword: 'Jüpiter' },
        ],
        quiz: [
            { question: 'How many inner planets?', questionTr: 'Kaç tane iç gezegen vardır?', options: ['2', '3', '4', '6'], correctIndex: 2 },
            { question: 'Jupiter is classified as?', questionTr: 'Jüpiter nasıl sınıflandırılır?', options: ['Kayaç gezegen', 'Gaz devi', 'Cüce gezegen', 'Asteroid'], correctIndex: 1 },
        ],
    },
    {
        id: 'al-brain', title: 'The Human Brain', titleTr: 'İnsan Beyni',
        description: 'Discover the most complex organ',
        descriptionTr: 'En karmaşık organı keşfet',
        category: 'biology', emoji: '🧠', estimatedDuration: 200, level: 'intermediate', xpReward: 50,
        segments: [
            { id: 's1', text: 'The brain...', textTr: 'İnsan beyni yaklaşık 1.4 kilogram ağırlığında olup, 86 milyar nöron içerir. Her nöron binlerce bağlantı kurarak devasa bir ağ oluşturur.', pauseAfter: 2000, keyword: '86 milyar' },
            { id: 's2', text: 'The brain parts...', textTr: 'Beyin dört ana bölümden oluşur: frontal lob karar verme, parietal lob dokunma, temporal lob işitme ve oksipital lob görme ile ilgilenir.', pauseAfter: 2000, keyword: 'Loblar' },
            { id: 's3', text: 'Neuroplasticity...', textTr: 'Nöroplastisite, beyinin kendini yeniden düzenleyebilme yeteneğidir. Yeni şeyler öğrendiğimizde beynimiz fiziksel olarak değişir!', pauseAfter: 2000, keyword: 'Nöroplastisite' },
        ],
        quiz: [
            { question: 'How many neurons?', questionTr: 'Beyinde kaç nöron vardır?', options: ['1 milyon', '1 milyar', '86 milyar', '100 trilyon'], correctIndex: 2 },
            { question: 'Neuroplasticity means?', questionTr: 'Nöroplastisite ne demektir?', options: ['Beyin büyümesi', 'Beynin kendini yenilemesi', 'Hafıza kaybı', 'Uyku döngüsü'], correctIndex: 1 },
        ],
    },
    {
        id: 'al-atoms', title: 'World of Atoms', titleTr: 'Atomlar Dünyası',
        description: 'The building blocks of everything',
        descriptionTr: 'Her şeyin yapı taşları',
        category: 'chemistry', emoji: '⚛️', estimatedDuration: 160, level: 'beginner', xpReward: 40,
        segments: [
            { id: 's1', text: 'Atoms...', textTr: 'Atom, maddenin en küçük yapı taşıdır. Her şey atomlardan oluşur: sen, ben, hava, su, yıldızlar... Her şey!', pauseAfter: 2000, keyword: 'Atom' },
            { id: 's2', text: 'Parts...', textTr: 'Bir atom üç temel parçacıktan oluşur: proton (artı yüklü), nötron (yüksüz) ve elektron (eksi yüklü). Proton ve nötronlar çekirdekte, elektronlar yörüngede döner.', pauseAfter: 2000, keyword: 'Parçacıklar' },
            { id: 's3', text: 'Elements...', textTr: 'Periyodik tabloda 118 element vardır. Her elementin kendine özgü proton sayısı vardır. Örneğin, hidrojen 1, karbon 6, altın 79 protona sahiptir.', pauseAfter: 1000, keyword: 'Periyodik tablo' },
        ],
        quiz: [
            { question: 'What are the three subatomic particles?', questionTr: 'Üç temel atom altı parçacık nedir?', options: ['Atom, molekül, bileşik', 'Proton, nötron, elektron', 'Katı, sıvı, gaz', 'Asit, baz, tuz'], correctIndex: 1 },
        ],
    },
    {
        id: 'al-turkish', title: 'Turkish Language Origins', titleTr: 'Türkçenin Kökenleri',
        description: 'The fascinating history of Turkish',
        descriptionTr: 'Türkçenin büyüleyici tarihi',
        category: 'language', emoji: '📖', estimatedDuration: 190, level: 'intermediate', xpReward: 45,
        segments: [
            { id: 's1', text: 'Origins...', textTr: 'Türkçe, Altay dil ailesinin Türk koluna ait bir dildir. Yaklaşık 300 milyon konuşucusuyla dünyanın en çok konuşulan dillerinden biridir.', pauseAfter: 2000, keyword: 'Altay' },
            { id: 's2', text: 'Orkhon...', textTr: 'Bilinen en eski Türkçe yazıtlar, 8. yüzyıla ait Orhun Yazıtlarıdır. Moğolistan\'da bulunan bu anıtlar, Göktürk alfabesiyle yazılmıştır.', pauseAfter: 2000, keyword: 'Orhun' },
            { id: 's3', text: 'Reform...', textTr: 'Atatürk\'ün 1928 harf devrimi ile Osmanlıca Arap alfabesinden Latin alfabesine geçildi. Bu devrim okuma yazma oranını büyük ölçüde artırdı.', pauseAfter: 1000, keyword: 'Harf devrimi' },
        ],
        quiz: [
            { question: 'Oldest Turkish inscriptions?', questionTr: 'En eski Türkçe yazıtlar hangileridir?', options: ['Sümer tabletleri', 'Orhun Yazıtları', 'Rosetta Taşı', 'Ölü Deniz Yazıtları'], correctIndex: 1 },
        ],
    },
];

const STORAGE_KEY = '@neuralis_audio_progress';

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════

class AudioLessonService {
    /** Tüm sesli dersleri ilerlemeyle al */
    async getLessonsWithProgress(): Promise<(AudioLesson & { progress?: AudioProgress })[]> {
        const allProgress = await this.getAllProgress();
        return AUDIO_LESSONS.map(l => ({
            ...l,
            progress: allProgress.find(p => p.lessonId === l.id),
        }));
    }

    /** Segment tamamla */
    async completeSegment(lessonId: string, segmentId: string): Promise<void> {
        const all = await this.getAllProgress();
        let progress = all.find(p => p.lessonId === lessonId);
        if (!progress) {
            progress = { lessonId, completedSegments: [], isCompleted: false, quizScore: 0, lastPlayedAt: new Date().toISOString(), playCount: 1 };
            all.push(progress);
        }
        if (!progress.completedSegments.includes(segmentId)) {
            progress.completedSegments.push(segmentId);
        }
        progress.lastPlayedAt = new Date().toISOString();
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    }

    /** Ders tamamla */
    async completeLesson(lessonId: string, quizScore: number): Promise<{ xpEarned: number }> {
        const all = await this.getAllProgress();
        let progress = all.find(p => p.lessonId === lessonId);
        const lesson = AUDIO_LESSONS.find(l => l.id === lessonId);
        if (!progress) {
            progress = { lessonId, completedSegments: [], isCompleted: false, quizScore: 0, lastPlayedAt: new Date().toISOString(), playCount: 0 };
            all.push(progress);
        }
        progress.isCompleted = true;
        progress.quizScore = Math.max(progress.quizScore, quizScore);
        progress.playCount += 1;
        progress.lastPlayedAt = new Date().toISOString();
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        return { xpEarned: lesson?.xpReward || 0 };
    }

    /** Tüm ilerleme */
    private async getAllProgress(): Promise<AudioProgress[]> {
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch { return []; }
    }

    /** İstatistikler */
    async getStats(): Promise<{ total: number; completed: number; totalPlayTime: number }> {
        const all = await this.getAllProgress();
        return {
            total: AUDIO_LESSONS.length,
            completed: all.filter(p => p.isCompleted).length,
            totalPlayTime: all.reduce((sum, p) => {
                const lesson = AUDIO_LESSONS.find(l => l.id === p.lessonId);
                return sum + (p.isCompleted ? (lesson?.estimatedDuration || 0) : 0);
            }, 0),
        };
    }
}

export const audioLessonService = new AudioLessonService();
export default audioLessonService;
