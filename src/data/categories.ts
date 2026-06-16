/**
 * NEURALIS - Category & Subcategory Tree
 * Hierarchical learning paths with subcategories
 */

import {
  Calculator,
  Code,
  Music,
  Palette,
  Globe,
  Brain,
  Microscope,
  BookOpen,
} from 'lucide-react-native';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface SubCategory {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
}

export interface Category {
  id: string;
  title: string;
  titleTR: string;
  subtitle: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  gradient: readonly [string, string];
  shadow: string;
  subcategories: SubCategory[];
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY TREE
// ═══════════════════════════════════════════════════════════════════════════

export const CATEGORY_TREE: Category[] = [
  {
    id: 'languages',
    title: 'Languages',
    titleTR: 'Diller',
    subtitle: 'Yeni diller öğren',
    icon: Globe,
    gradient: ['#5EE7DF', '#B490CA'] as const,
    shadow: '#31A29D',
    subcategories: [
      {
        id: 'english',
        name: 'İngilizce',
        emoji: '🇬🇧',
        color: '#4FACFE',
        description: 'A1-C2 seviye İngilizce',
      },
      {
        id: 'german',
        name: 'Almanca',
        emoji: '🇩🇪',
        color: '#FFD700',
        description: 'Deutsch lernen',
      },
      {
        id: 'french',
        name: 'Fransızca',
        emoji: '🇫🇷',
        color: '#FF6B6B',
        description: 'Apprendre le français',
      },
      {
        id: 'spanish',
        name: 'İspanyolca',
        emoji: '🇪🇸',
        color: '#FF9600',
        description: 'Aprender español',
      },
      {
        id: 'japanese',
        name: 'Japonca',
        emoji: '🇯🇵',
        color: '#E0115F',
        description: '日本語を学ぶ',
      },
      { id: 'korean', name: 'Korece', emoji: '🇰🇷', color: '#A18CD1', description: '한국어 배우기' },
      {
        id: 'italian',
        name: 'İtalyanca',
        emoji: '🇮🇹',
        color: '#43E97B',
        description: "Impara l'italiano",
      },
      { id: 'russian', name: 'Rusça', emoji: '🇷🇺', color: '#30CFD0', description: 'Учить русский' },
    ],
  },
  {
    id: 'programming',
    title: 'Programming',
    titleTR: 'Programlama',
    subtitle: 'Kod yazmayı öğren',
    icon: Code,
    gradient: ['#A18CD1', '#FBC2EB'] as const,
    shadow: '#A4508B',
    subcategories: [
      {
        id: 'python',
        name: 'Python',
        emoji: '🐍',
        color: '#306998',
        description: 'Başlangıç & ileri seviye',
      },
      {
        id: 'javascript',
        name: 'JavaScript',
        emoji: '⚡',
        color: '#F7DF1E',
        description: 'Web geliştirme temeli',
      },
      {
        id: 'react_native',
        name: 'React Native',
        emoji: '⚛️',
        color: '#61DAFB',
        description: 'Mobil uygulama geliştirme',
      },
      { id: 'sql', name: 'SQL', emoji: '🗄️', color: '#4479A1', description: 'Veritabanı yönetimi' },
      { id: 'csharp', name: 'C#', emoji: '💜', color: '#9B4993', description: 'Unity & .NET' },
      {
        id: 'java',
        name: 'Java',
        emoji: '☕',
        color: '#ED8B00',
        description: 'Nesne yönelimli programlama',
      },
    ],
  },
  {
    id: 'mathematics',
    title: 'Mathematics',
    titleTR: 'Matematik',
    subtitle: 'Cebir, Geometri & daha',
    icon: Calculator,
    gradient: ['#4FACFE', '#00F2FE'] as const,
    shadow: '#00C6FB',
    subcategories: [
      {
        id: 'algebra',
        name: 'Cebir',
        emoji: '🔢',
        color: '#4FACFE',
        description: 'Denklemler & fonksiyonlar',
      },
      {
        id: 'geometry',
        name: 'Geometri',
        emoji: '📐',
        color: '#00F2FE',
        description: 'Şekiller & uzay',
      },
      {
        id: 'statistics',
        name: 'İstatistik',
        emoji: '📊',
        color: '#43E97B',
        description: 'Olasılık & veri analizi',
      },
      {
        id: 'calculus',
        name: 'Analiz',
        emoji: '∫',
        color: '#FA709A',
        description: 'Türev & integral',
      },
    ],
  },
  {
    id: 'science',
    title: 'Science',
    titleTR: 'Bilim',
    subtitle: 'Fizik, Kimya, Biyoloji',
    icon: Microscope,
    gradient: ['#30CFD0', '#330867'] as const,
    shadow: '#289299',
    subcategories: [
      {
        id: 'physics',
        name: 'Fizik',
        emoji: '⚛️',
        color: '#30CFD0',
        description: 'Hareket, enerji & dalga',
      },
      {
        id: 'chemistry',
        name: 'Kimya',
        emoji: '🧪',
        color: '#43E97B',
        description: 'Elementler & reaksiyonlar',
      },
      {
        id: 'biology',
        name: 'Biyoloji',
        emoji: '🧬',
        color: '#A18CD1',
        description: 'Hücre, genetik & evrim',
      },
      {
        id: 'astronomy',
        name: 'Astronomi',
        emoji: '🔭',
        color: '#330867',
        description: 'Uzay & gezegenler',
      },
    ],
  },
  {
    id: 'music',
    title: 'Music Theory',
    titleTR: 'Müzik',
    subtitle: 'Notalar, Skalalar, Ritim',
    icon: Music,
    gradient: ['#FF9A9E', '#FECFEF'] as const,
    shadow: '#FF6B6B',
    subcategories: [
      {
        id: 'music_theory',
        name: 'Teori & Nota',
        emoji: '🎵',
        color: '#FF9A9E',
        description: 'Müzik temelleri',
      },
      {
        id: 'piano',
        name: 'Piyano',
        emoji: '🎹',
        color: '#A18CD1',
        description: 'Piyano dersleri',
      },
      {
        id: 'guitar',
        name: 'Gitar',
        emoji: '🎸',
        color: '#FF6B6B',
        description: 'Gitar temelleri',
      },
    ],
  },
  {
    id: 'technology',
    title: 'Technology',
    titleTR: 'Teknoloji',
    subtitle: 'Yapay Zeka, Gelecek',
    icon: Brain,
    gradient: ['#43E97B', '#38F9D7'] as const,
    shadow: '#2ECC71',
    subcategories: [
      {
        id: 'ai_ml',
        name: 'Yapay Zeka',
        emoji: '🤖',
        color: '#43E97B',
        description: 'AI & Machine Learning',
      },
      {
        id: 'cybersecurity',
        name: 'Siber Güvenlik',
        emoji: '🔒',
        color: '#E0115F',
        description: 'Güvenlik temelleri',
      },
      {
        id: 'blockchain',
        name: 'Blockchain',
        emoji: '⛓️',
        color: '#F7931A',
        description: 'Kripto & DeFi',
      },
    ],
  },
  {
    id: 'art',
    title: 'Art & Design',
    titleTR: 'Sanat',
    subtitle: 'Sanat Tarihi, Renk',
    icon: Palette,
    gradient: ['#FA709A', '#FEE140'] as const,
    shadow: '#F83600',
    subcategories: [
      {
        id: 'art_history',
        name: 'Sanat Tarihi',
        emoji: '🖼️',
        color: '#FA709A',
        description: "Rönesans'tan Moderna",
      },
      {
        id: 'color_theory',
        name: 'Renk Teorisi',
        emoji: '🎨',
        color: '#FEE140',
        description: 'Renk bilimi',
      },
      {
        id: 'digital_design',
        name: 'Dijital Tasarım',
        emoji: '💻',
        color: '#4FACFE',
        description: 'UI/UX & grafik',
      },
    ],
  },
  {
    id: 'general',
    title: 'General',
    titleTR: 'Genel Kültür',
    subtitle: 'Genel Kültür & Bilgi',
    icon: BookOpen,
    gradient: ['#F6D365', '#FDA085'] as const,
    shadow: '#F39C12',
    subcategories: [
      { id: 'history', name: 'Tarih', emoji: '📜', color: '#F6D365', description: 'Dünya tarihi' },
      {
        id: 'geography',
        name: 'Coğrafya',
        emoji: '🌍',
        color: '#43E97B',
        description: 'Ülkeler & kıtalar',
      },
      {
        id: 'scientists',
        name: 'Bilim İnsanları',
        emoji: '👨‍🔬',
        color: '#30CFD0',
        description: 'Tesla, Einstein & daha',
      },
      {
        id: 'philosophy',
        name: 'Felsefe',
        emoji: '🤔',
        color: '#A18CD1',
        description: 'Büyük düşünceler',
      },
    ],
  },
];

/**
 * Get a category by its ID
 */
export function getCategoryById(id: string): Category | undefined {
  return CATEGORY_TREE.find((c) => c.id === id);
}

/**
 * Get a subcategory by category and subcategory ID
 */
export function getSubcategory(categoryId: string, subcategoryId: string): SubCategory | undefined {
  const cat = getCategoryById(categoryId);
  return cat?.subcategories.find((sc) => sc.id === subcategoryId);
}

/**
 * Build a subject string for lesson generation (e.g., "Languages/İngilizce")
 */
export function buildSubjectKey(categoryId: string, subcategoryId: string): string {
  const cat = getCategoryById(categoryId);
  const sub = cat?.subcategories.find((sc) => sc.id === subcategoryId);
  return sub ? `${cat!.title}/${sub.name}` : categoryId;
}
