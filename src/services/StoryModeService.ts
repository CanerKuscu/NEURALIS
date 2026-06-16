/**
 * StoryModeService — Hikaye Modu (RPG Tarzı)
 *
 * Konuları interaktif hikaye formatında öğretme.
 * Her hikaye bir dünya/bölüm, her ders bir görev.
 * Karakter gelişimi, karar noktaları ve ödüller.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface StoryWorld {
  id: string;
  title: string;
  titleTr: string;
  description: string;
  descriptionTr: string;
  emoji: string;
  color: string;
  bgColor: string;
  chapters: StoryChapter[];
  /** Gerekli seviye */
  requiredLevel: number;
  /** Kategori */
  category: string;
}

export interface StoryChapter {
  id: string;
  worldId: string;
  title: string;
  titleTr: string;
  /** Bölüm numarası */
  order: number;
  /** Hikaye anlatımı (markdown) */
  narrative: string;
  narrativeTr: string;
  /** Karar noktaları */
  choices: StoryChoice[];
  /** Bu bölümdeki sorular */
  questions: StoryQuestion[];
  /** XP ödülü */
  xpReward: number;
  /** Gem ödülü */
  gemReward: number;
  /** Kilit durumu */
  isLocked: boolean;
  /** Tamamlanma durumu */
  isCompleted: boolean;
}

export interface StoryChoice {
  id: string;
  text: string;
  textTr: string;
  /** Sonuç */
  outcome: string;
  outcomeTr: string;
  /** Bu seçim doğru mu */
  isCorrect: boolean;
  /** XP bonusu (doğru seçim için) */
  xpBonus: number;
}

export interface StoryQuestion {
  question: string;
  questionTr: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  explanationTr: string;
}

export interface StoryProgress {
  worldId: string;
  completedChapters: string[];
  currentChapter: string;
  totalXpEarned: number;
  choicesMade: Record<string, string>; // chapterId -> choiceId
  startedAt: string;
  lastPlayedAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// STORY WORLDS (Turkish)
// ═══════════════════════════════════════════════════════════════════════════

export const STORY_WORLDS: StoryWorld[] = [
  {
    id: 'ancient-math',
    title: 'Realm of Numbers',
    titleTr: 'Sayılar Diyarı',
    description: 'Travel through time to discover the origins of mathematics',
    descriptionTr: 'Matematiğin kökenlerini keşfetmek için zamanda yolculuk yap',
    emoji: '🏛️',
    color: '#9B59B6',
    bgColor: '#2C1445',
    category: 'Mathematics',
    requiredLevel: 1,
    chapters: [
      {
        id: 'am-ch1',
        worldId: 'ancient-math',
        order: 1,
        title: 'The Babylonian Tablets',
        titleTr: 'Babil Tabletleri',
        narrative: 'You find yourself in ancient Babylon, 2000 BC...',
        narrativeTr:
          'Kendini MÖ 2000, antik Babil\'de buluyorsun. Tapınağın kütüphanesinde gizemli kil tabletler var. Başrahip sana yaklaşıp "Bu tabletlerdeki sırları çözebilir misin?" diyor.',
        choices: [
          {
            id: 'am1-c1',
            text: 'Accept the challenge',
            textTr: 'Meydan okumayı kabul et',
            outcome: 'The priest smiles',
            outcomeTr:
              "Rahip gülümseyerek seni kütüphaneye götürüyor. İçeride 60'lık sayı sistemini keşfediyorsun!",
            isCorrect: true,
            xpBonus: 20,
          },
          {
            id: 'am1-c2',
            text: 'Ask for more info',
            textTr: 'Daha fazla bilgi iste',
            outcome: 'The priest explains',
            outcomeTr:
              'Rahip açıklıyor: "Babilliler 60 tabanlı sayı sistemi kullandı. Bu yüzden saatte 60 dakika var!"',
            isCorrect: true,
            xpBonus: 10,
          },
        ],
        questions: [
          {
            question: 'What base did Babylonians use?',
            questionTr: 'Babilliler hangi sayı tabanını kullanıyordu?',
            options: ['10', '20', '60', '100'],
            correctIndex: 2,
            explanation: 'Babylonians used base-60',
            explanationTr: 'Babilliler 60 tabanlı (sexagesimal) sayı sistemi kullanıyordu.',
          },
          {
            question: 'Why 60 minutes in an hour?',
            questionTr: 'Bir saatte neden 60 dakika var?',
            options: ['Rastgele seçildi', 'Babil sayı sisteminden', "Roma İmp.'dan", "Mısır'dan"],
            correctIndex: 1,
            explanation: 'From Babylonian base-60',
            explanationTr: "Babil'in 60 tabanlı sayı sisteminden gelir.",
          },
        ],
        xpReward: 50,
        gemReward: 5,
        isLocked: false,
        isCompleted: false,
      },
      {
        id: 'am-ch2',
        worldId: 'ancient-math',
        order: 2,
        title: 'Greek Geometry',
        titleTr: 'Yunan Geometrisi',
        narrative: 'You travel to ancient Athens...',
        narrativeTr:
          'Zamanda ileri atlayıp kendini antik Atina\'da buluyorsun. Ünlü matematikçi Öklid\'in akademisinin önündesin. Bir öğrenci "Geometri bilmeyenler giremez!" diyor.',
        choices: [
          {
            id: 'am2-c1',
            text: 'Prove your worth',
            textTr: 'Yetkinliğini kanıtla',
            outcome: 'You solve the puzzle',
            outcomeTr: 'Kapıdaki geometri bulmacasını çözüyorsun ve akademiye kabul ediliyorsun!',
            isCorrect: true,
            xpBonus: 25,
          },
          {
            id: 'am2-c2',
            text: 'Sneak in',
            textTr: 'Gizlice gir',
            outcome: 'Caught but forgiven',
            outcomeTr:
              'Yakalanıyorsun ama Öklid merakını beğenip seni öğrenci olarak kabul ediyor.',
            isCorrect: false,
            xpBonus: 5,
          },
        ],
        questions: [
          {
            question: 'Who is the father of geometry?',
            questionTr: 'Geometrinin babası kimdir?',
            options: ['Pisagor', 'Öklid', 'Arşimet', 'Tales'],
            correctIndex: 1,
            explanation: 'Euclid wrote "Elements"',
            explanationTr: 'Öklid, "Elementler" kitabıyla geometrinin temellerini attı.',
          },
        ],
        xpReward: 60,
        gemReward: 8,
        isLocked: true,
        isCompleted: false,
      },
    ],
  },
  {
    id: 'science-quest',
    title: 'Science Odyssey',
    titleTr: 'Bilim Destanı',
    description: 'Journey through the greatest scientific discoveries',
    descriptionTr: 'Tarihin en büyük bilimsel keşiflerinin izinde bir yolculuk',
    emoji: '🔬',
    color: '#3498DB',
    bgColor: '#0C2744',
    category: 'Science',
    requiredLevel: 1,
    chapters: [
      {
        id: 'sq-ch1',
        worldId: 'science-quest',
        order: 1,
        title: "Newton's Apple",
        titleTr: "Newton'un Elması",
        narrative: 'England, 1666...',
        narrativeTr:
          'İngiltere, 1666. Veba salgını nedeniyle Cambridge kapatılmış. Genç Isaac Newton annesinin çiftliğinde oturuyor. Bir elma ağacının altında düşüncelere dalıyorsun...',
        choices: [
          {
            id: 'sq1-c1',
            text: 'Ask Newton about the apple',
            textTr: "Newton'a elma hakkında sor",
            outcome: 'Newton explains gravity',
            outcomeTr:
              'Newton heyecanla anlatıyor: "Elma neden yere düşer de yukarı çıkmaz? Bu kuvvete yerçekimi diyorum!"',
            isCorrect: true,
            xpBonus: 20,
          },
          {
            id: 'sq1-c2',
            text: 'Grab the apple and eat it',
            textTr: 'Elmayı al ve ye',
            outcome: 'Newton laughs',
            outcomeTr:
              'Newton gülerek "O elmayı inceleyecektim! Ama gel sana yerçekimini anlatayım" diyor.',
            isCorrect: false,
            xpBonus: 5,
          },
        ],
        questions: [
          {
            question: 'What did Newton discover?',
            questionTr: 'Newton ne keşfetti?',
            options: ['Elektrik', 'Yerçekimi', 'Evrim', 'Atom'],
            correctIndex: 1,
            explanation: 'Newton discovered gravity',
            explanationTr: 'Newton yerçekimi kanununu keşfetti.',
          },
        ],
        xpReward: 50,
        gemReward: 5,
        isLocked: false,
        isCompleted: false,
      },
    ],
  },
  {
    id: 'code-adventure',
    title: 'Code Chronicles',
    titleTr: 'Kod Maceraları',
    description: 'Learn programming through an epic adventure',
    descriptionTr: 'Epik bir macera boyunca programlamayı öğren',
    emoji: '💻',
    color: '#2ECC71',
    bgColor: '#0A3D21',
    category: 'Programming',
    requiredLevel: 3,
    chapters: [
      {
        id: 'ca-ch1',
        worldId: 'code-adventure',
        order: 1,
        title: 'Binary Gate',
        titleTr: 'İkili Kapı',
        narrative: 'A digital world awaits...',
        narrativeTr:
          'Dijital bir dünyaya adım atıyorsun. Önünde büyük bir kapı var ve üzerinde "0 ve 1" yazıyor. Kapıyı açmak için bilgisayarların dilini anlamalısın.',
        choices: [
          {
            id: 'ca1-c1',
            text: 'Study the gate',
            textTr: 'Kapıyı incele',
            outcome: 'You learn binary',
            outcomeTr:
              "Kapıdaki deseni çözüyorsun: Her şey 0 ve 1'lerden oluşuyor. İkili sayı sistemini keşfediyorsun!",
            isCorrect: true,
            xpBonus: 20,
          },
        ],
        questions: [
          {
            question: 'What is 1010 in decimal?',
            questionTr: '1010 ikili sayısı onluk tabanda kaçtır?',
            options: ['8', '10', '12', '1010'],
            correctIndex: 1,
            explanation: '1010 = 8+0+2+0 = 10',
            explanationTr: '1×8 + 0×4 + 1×2 + 0×1 = 10',
          },
        ],
        xpReward: 50,
        gemReward: 5,
        isLocked: false,
        isCompleted: false,
      },
    ],
  },
  {
    id: 'history-time',
    title: 'Time Travelers',
    titleTr: 'Zaman Yolcuları',
    description: "Witness history's turning points firsthand",
    descriptionTr: 'Tarihin dönüm noktalarına birinci elden tanık ol',
    emoji: '⏳',
    color: '#E67E22',
    bgColor: '#3D2200',
    category: 'History',
    requiredLevel: 2,
    chapters: [
      {
        id: 'ht-ch1',
        worldId: 'history-time',
        order: 1,
        title: 'The Silk Road',
        titleTr: 'İpek Yolu',
        narrative: 'Follow the ancient trade route...',
        narrativeTr:
          "MÖ 130, Çin'in batı sınırındasın. Önünde binlerce kilometre uzanan kadim ticaret yolu uzanıyor. Tüccar kafilesi yola çıkmak üzere.",
        choices: [
          {
            id: 'ht1-c1',
            text: 'Join the caravan',
            textTr: 'Kafileye katıl',
            outcome: 'Adventure begins',
            outcomeTr:
              'Kafileyle birlikte yola çıkıyorsun. İpek, baharat ve bilgi taşıyan bu yol medeniyetleri birbirine bağlıyor!',
            isCorrect: true,
            xpBonus: 20,
          },
        ],
        questions: [
          {
            question: 'What was the Silk Road?',
            questionTr: 'İpek Yolu neydi?',
            options: ['Bir nehir', 'Ticaret yolu', 'Bir şehir', 'Bir savaş'],
            correctIndex: 1,
            explanation: 'Ancient trade route',
            explanationTr: "Çin'den Akdeniz'e uzanan antik ticaret yoluydu.",
          },
        ],
        xpReward: 50,
        gemReward: 5,
        isLocked: false,
        isCompleted: false,
      },
    ],
  },
];

const STORAGE_KEY = '@neuralis_story_progress';

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════

class StoryModeService {
  /** Tüm dünyaları ilerleme durumuyla al */
  async getWorldsWithProgress(): Promise<(StoryWorld & { progress?: StoryProgress })[]> {
    const allProgress = await this.getAllProgress();
    return STORY_WORLDS.map((w) => ({
      ...w,
      progress: allProgress.find((p) => p.worldId === w.id),
      chapters: w.chapters.map((ch, idx) => ({
        ...ch,
        isCompleted: allProgress.some((p) => p.completedChapters.includes(ch.id)),
        isLocked:
          idx > 0 && !allProgress.some((p) => p.completedChapters.includes(w.chapters[idx - 1].id)),
      })),
    }));
  }

  /** İlerleme kaydet */
  async saveProgress(progress: StoryProgress): Promise<void> {
    const all = await this.getAllProgress();
    const idx = all.findIndex((p) => p.worldId === progress.worldId);
    if (idx >= 0) all[idx] = progress;
    else all.push(progress);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }

  /** Bölüm tamamla */
  async completeChapter(
    worldId: string,
    chapterId: string,
    choiceId?: string,
  ): Promise<{ xpEarned: number; gemEarned: number }> {
    const all = await this.getAllProgress();
    let progress = all.find((p) => p.worldId === worldId);
    const world = STORY_WORLDS.find((w) => w.id === worldId);
    const chapter = world?.chapters.find((c) => c.id === chapterId);

    if (!progress) {
      progress = {
        worldId,
        completedChapters: [],
        currentChapter: chapterId,
        totalXpEarned: 0,
        choicesMade: {},
        startedAt: new Date().toISOString(),
        lastPlayedAt: new Date().toISOString(),
      };
    }

    if (!progress.completedChapters.includes(chapterId)) {
      progress.completedChapters.push(chapterId);
    }
    if (choiceId) {
      progress.choicesMade[chapterId] = choiceId;
    }

    const xpEarned = chapter?.xpReward || 0;
    const choiceBonus = chapter?.choices.find((c) => c.id === choiceId)?.xpBonus || 0;
    progress.totalXpEarned += xpEarned + choiceBonus;
    progress.lastPlayedAt = new Date().toISOString();

    await this.saveProgress(progress);
    return { xpEarned: xpEarned + choiceBonus, gemEarned: chapter?.gemReward || 0 };
  }

  /** Tüm ilerleme verilerini al */
  private async getAllProgress(): Promise<StoryProgress[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /** İstatistikler */
  async getStats(): Promise<{
    totalWorlds: number;
    completedWorlds: number;
    totalChapters: number;
    completedChapters: number;
    totalXp: number;
  }> {
    const all = await this.getAllProgress();
    const totalChapters = STORY_WORLDS.reduce((sum, w) => sum + w.chapters.length, 0);
    const completedChapters = all.reduce((sum, p) => sum + p.completedChapters.length, 0);
    const completedWorlds = all.filter((p) => {
      const world = STORY_WORLDS.find((w) => w.id === p.worldId);
      return world && p.completedChapters.length >= world.chapters.length;
    }).length;
    const totalXp = all.reduce((sum, p) => sum + p.totalXpEarned, 0);

    return {
      totalWorlds: STORY_WORLDS.length,
      completedWorlds,
      totalChapters,
      completedChapters,
      totalXp,
    };
  }
}

export const storyModeService = new StoryModeService();
export default storyModeService;
