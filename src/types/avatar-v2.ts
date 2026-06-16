/**
 * Avatar V2 Type Definitions
 * Instagram-level avatar customization system
 *
 * Inspired by Instagram Avatars / Bitmoji / Apple Memoji
 * Extensive facial feature, body, outfit and accessory customization
 */

// ═══════════════════════════════════════════════════════════════════════════
// FACE SHAPE & SKIN
// ═══════════════════════════════════════════════════════════════════════════

export type FaceShape = 'oval' | 'round' | 'square' | 'heart' | 'oblong' | 'diamond';

export type SkinTone =
  | '#FFF0DB'
  | '#FDEBD0'
  | '#F5CBA7'
  | '#F0B27A'
  | '#E5A06E'
  | '#D4956B'
  | '#C68642'
  | '#A0522D'
  | '#8B4513'
  | '#6B3410'
  | '#5C3317'
  | '#4A2511';

export const SKIN_TONES: SkinTone[] = [
  '#FFF0DB',
  '#FDEBD0',
  '#F5CBA7',
  '#F0B27A',
  '#E5A06E',
  '#D4956B',
  '#C68642',
  '#A0522D',
  '#8B4513',
  '#6B3410',
  '#5C3317',
  '#4A2511',
];

// ═══════════════════════════════════════════════════════════════════════════
// EYES
// ═══════════════════════════════════════════════════════════════════════════

export type EyeShape =
  | 'default'
  | 'almond'
  | 'round'
  | 'narrow'
  | 'wide'
  | 'hooded'
  | 'monolid'
  | 'downturned'
  | 'upturned';
export type EyeColor =
  | '#3B2F2F'
  | '#5D4037'
  | '#795548'
  | '#2196F3'
  | '#4CAF50'
  | '#9E9E9E'
  | '#FF9800'
  | '#1A237E'
  | '#006064';
export type EyelashStyle = 'none' | 'natural' | 'long' | 'dramatic';
export type EyebrowShape =
  | 'natural'
  | 'arched'
  | 'straight'
  | 'thick'
  | 'thin'
  | 'curved'
  | 'angeled'
  | 'bushy';

export const EYE_COLORS: EyeColor[] = [
  '#3B2F2F',
  '#5D4037',
  '#795548',
  '#2196F3',
  '#4CAF50',
  '#9E9E9E',
  '#FF9800',
  '#1A237E',
  '#006064',
];

// ═══════════════════════════════════════════════════════════════════════════
// NOSE
// ═══════════════════════════════════════════════════════════════════════════

export type NoseType =
  | 'default'
  | 'small'
  | 'wide'
  | 'pointed'
  | 'button'
  | 'aquiline'
  | 'snub'
  | 'greek';

// ═══════════════════════════════════════════════════════════════════════════
// MOUTH / LIPS
// ═══════════════════════════════════════════════════════════════════════════

export type LipShape = 'default' | 'thin' | 'full' | 'cupid' | 'wide' | 'heart' | 'round';
export type LipColor =
  | 'natural'
  | '#D32F2F'
  | '#E91E63'
  | '#AD1457'
  | '#C2185B'
  | '#880E4F'
  | '#BF360C'
  | '#FF8A80';
export type Expression =
  | 'neutral'
  | 'smile'
  | 'grin'
  | 'slight-smile'
  | 'open-mouth'
  | 'smirk'
  | 'pout'
  | 'laugh';

export const LIP_COLORS: LipColor[] = [
  'natural',
  '#D32F2F',
  '#E91E63',
  '#AD1457',
  '#C2185B',
  '#880E4F',
  '#BF360C',
  '#FF8A80',
];

// ═══════════════════════════════════════════════════════════════════════════
// HAIR
// ═══════════════════════════════════════════════════════════════════════════

export type HairStyle =
  | 'none'
  | 'buzz'
  | 'crew'
  | 'short-classic'
  | 'short-textured'
  | 'side-part'
  | 'medium-wavy'
  | 'medium-straight'
  | 'medium-curly'
  | 'long-straight'
  | 'long-wavy'
  | 'long-curly'
  | 'afro'
  | 'afro-puff'
  | 'braids'
  | 'cornrows'
  | 'dreadlocks'
  | 'bun-high'
  | 'bun-low'
  | 'bun-messy'
  | 'ponytail'
  | 'ponytail-high'
  | 'ponytail-side'
  | 'pixie'
  | 'bob'
  | 'lob'
  | 'mohawk'
  | 'undercut'
  | 'fade';

export type HairColor =
  | '#0A0A0A'
  | '#1C1C1C'
  | '#3D2B1F'
  | '#4A3728'
  | '#6B4226'
  | '#8B5E3C'
  | '#B5651D'
  | '#D2691E'
  | '#DAA520'
  | '#FFD700'
  | '#E8E8E8'
  | '#C0C0C0'
  | '#8B0000'
  | '#DC143C'
  | '#FF1493'
  | '#FF69B4'
  | '#4B0082'
  | '#6A0DAD'
  | '#00CED1'
  | '#1E90FF'
  | '#32CD32';

export const HAIR_COLORS: HairColor[] = [
  '#0A0A0A',
  '#1C1C1C',
  '#3D2B1F',
  '#4A3728',
  '#6B4226',
  '#8B5E3C',
  '#B5651D',
  '#D2691E',
  '#DAA520',
  '#FFD700',
  '#E8E8E8',
  '#C0C0C0',
  '#8B0000',
  '#DC143C',
  '#FF1493',
  '#FF69B4',
  '#4B0082',
  '#6A0DAD',
  '#00CED1',
  '#1E90FF',
  '#32CD32',
];

// ═══════════════════════════════════════════════════════════════════════════
// FACIAL HAIR
// ═══════════════════════════════════════════════════════════════════════════

export type FacialHair =
  | 'none'
  | 'stubble'
  | 'mustache'
  | 'goatee'
  | 'full-beard'
  | 'short-beard'
  | 'chinstrap'
  | 'soul-patch'
  | 'handlebar'
  | 'van-dyke';

// ═══════════════════════════════════════════════════════════════════════════
// GLASSES
// ═══════════════════════════════════════════════════════════════════════════

export type GlassesStyle =
  | 'none'
  | 'round'
  | 'square'
  | 'aviator'
  | 'cat-eye'
  | 'wayfarer'
  | 'rectangular'
  | 'rimless'
  | 'oversized'
  | 'sunglasses-round'
  | 'sunglasses-aviator'
  | 'sunglasses-sport';
export type GlassesColor =
  | '#1A1A1A'
  | '#4A3728'
  | '#3498DB'
  | '#E74C3C'
  | '#F1C40F'
  | '#9B59B6'
  | '#C0C0C0'
  | '#FFD700';

export const GLASSES_COLORS: GlassesColor[] = [
  '#1A1A1A',
  '#4A3728',
  '#3498DB',
  '#E74C3C',
  '#F1C40F',
  '#9B59B6',
  '#C0C0C0',
  '#FFD700',
];

// ═══════════════════════════════════════════════════════════════════════════
// HEADWEAR
// ═══════════════════════════════════════════════════════════════════════════

export type HeadwearType =
  | 'none'
  | 'cap'
  | 'beanie'
  | 'fedora'
  | 'bucket-hat'
  | 'bandana'
  | 'turban'
  | 'headband'
  | 'crown'
  | 'beret'
  | 'hijab';

// ═══════════════════════════════════════════════════════════════════════════
// OUTFIT
// ═══════════════════════════════════════════════════════════════════════════

export type OutfitTop =
  | 'tshirt'
  | 'hoodie'
  | 'sweater'
  | 'jacket'
  | 'tank'
  | 'shirt-collar'
  | 'turtleneck'
  | 'crop-top'
  | 'blazer'
  | 'vest'
  | 'dress'
  | 'overalls';
export type OutfitColor =
  | '#3498DB'
  | '#2ECC71'
  | '#E74C3C'
  | '#9B59B6'
  | '#F39C12'
  | '#1ABC9C'
  | '#34495E'
  | '#E91E63'
  | '#FF9800'
  | '#607D8B'
  | '#1A1A1A'
  | '#FFFFFF'
  | '#FFC0CB'
  | '#87CEEB'
  | '#DDA0DD';

export const OUTFIT_COLORS: OutfitColor[] = [
  '#3498DB',
  '#2ECC71',
  '#E74C3C',
  '#9B59B6',
  '#F39C12',
  '#1ABC9C',
  '#34495E',
  '#E91E63',
  '#FF9800',
  '#607D8B',
  '#1A1A1A',
  '#FFFFFF',
  '#FFC0CB',
  '#87CEEB',
  '#DDA0DD',
];

// ═══════════════════════════════════════════════════════════════════════════
// ACCESSORIES
// ═══════════════════════════════════════════════════════════════════════════

export type EarringStyle = 'none' | 'stud' | 'hoop-small' | 'hoop-large' | 'drop' | 'bar';
export type NecklaceStyle = 'none' | 'chain' | 'pendant' | 'choker' | 'pearls';
export type PiercingStyle = 'none' | 'nose-stud' | 'nose-ring' | 'septum' | 'lip';

// ═══════════════════════════════════════════════════════════════════════════
// FACE FEATURES
// ═══════════════════════════════════════════════════════════════════════════

export type CheeksStyle = 'none' | 'blush' | 'freckles' | 'dimples' | 'blush-freckles';
export type WrinklesStyle = 'none' | 'laugh-lines' | 'forehead' | 'crow-feet';
export type BeautyMark = 'none' | 'left-cheek' | 'right-cheek' | 'chin' | 'upper-lip';

// ═══════════════════════════════════════════════════════════════════════════
// BACKGROUND
// ═══════════════════════════════════════════════════════════════════════════

export type BgStyle = 'solid' | 'gradient' | 'pattern';
export type BgColor =
  | '#1A1A2E'
  | '#16213E'
  | '#0F3460'
  | '#533483'
  | '#2C3E50'
  | '#1ABC9C'
  | '#9B59B6'
  | '#E74C3C'
  | '#F39C12'
  | '#2ECC71'
  | '#3498DB'
  | '#E91E63'
  | '#FF6B6B'
  | '#74B9FF'
  | '#A29BFE'
  | '#FFEAA7';

export const BG_COLORS: BgColor[] = [
  '#1A1A2E',
  '#16213E',
  '#0F3460',
  '#533483',
  '#2C3E50',
  '#1ABC9C',
  '#9B59B6',
  '#E74C3C',
  '#F39C12',
  '#2ECC71',
  '#3498DB',
  '#E91E63',
  '#FF6B6B',
  '#74B9FF',
  '#A29BFE',
  '#FFEAA7',
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN CONFIG
// ═══════════════════════════════════════════════════════════════════════════

export interface AvatarV2Config {
  // Face
  faceShape: FaceShape;
  skinTone: string;
  cheeks: CheeksStyle;
  wrinkles: WrinklesStyle;
  beautyMark: BeautyMark;

  // Eyes
  eyeShape: EyeShape;
  eyeColor: string;
  eyelashes: EyelashStyle;
  eyebrowShape: EyebrowShape;
  eyebrowColor: string;

  // Nose
  noseType: NoseType;

  // Mouth
  lipShape: LipShape;
  lipColor: LipColor;
  expression: Expression;

  // Hair
  hairStyle: HairStyle;
  hairColor: string;

  // Facial Hair
  facialHair: FacialHair;
  facialHairColor: string;

  // Glasses
  glassesStyle: GlassesStyle;
  glassesColor: string;

  // Headwear
  headwear: HeadwearType;
  headwearColor: string;

  // Outfit
  outfitTop: OutfitTop;
  outfitColor: string;

  // Accessories
  earrings: EarringStyle;
  necklace: NecklaceStyle;
  piercing: PiercingStyle;

  // Background
  bgStyle: BgStyle;
  bgColor: string;
  bgSecondaryColor: string;
}

export const DEFAULT_AVATAR_V2: AvatarV2Config = {
  faceShape: 'oval',
  skinTone: '#F5CBA7',
  cheeks: 'none',
  wrinkles: 'none',
  beautyMark: 'none',

  eyeShape: 'default',
  eyeColor: '#5D4037',
  eyelashes: 'natural',
  eyebrowShape: 'natural',
  eyebrowColor: '#3D2B1F',

  noseType: 'default',

  lipShape: 'default',
  lipColor: 'natural',
  expression: 'slight-smile',

  hairStyle: 'short-classic',
  hairColor: '#3D2B1F',

  facialHair: 'none',
  facialHairColor: '#3D2B1F',

  glassesStyle: 'none',
  glassesColor: '#1A1A1A',

  headwear: 'none',
  headwearColor: '#34495E',

  outfitTop: 'tshirt',
  outfitColor: '#3498DB',

  earrings: 'none',
  necklace: 'none',
  piercing: 'none',

  bgStyle: 'gradient',
  bgColor: '#533483',
  bgSecondaryColor: '#0F3460',
};

// ═══════════════════════════════════════════════════════════════════════════
// EDITOR CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════

export interface AvatarCategory {
  id: string;
  labelKey: string;
  icon: string;
  color: string;
  subCategories: AvatarSubCategory[];
}

export interface AvatarSubCategory {
  key: keyof AvatarV2Config;
  labelKey: string;
  type: 'color' | 'option';
  options?: string[];
  colors?: string[];
}

// Map option values to i18n keys (avatar.opt_*)
export function getOptionLabelKey(opt: string): string {
  return `avatar.opt_${opt.replace(/-/g, '_')}`;
}

export const AVATAR_V2_CATEGORIES: AvatarCategory[] = [
  {
    id: 'face',
    labelKey: 'avatar.face',
    icon: '😊',
    color: '#FFB74D',
    subCategories: [
      {
        key: 'faceShape',
        labelKey: 'avatar.face_shape',
        type: 'option',
        options: ['oval', 'round', 'square', 'heart', 'oblong', 'diamond'],
      },
      { key: 'skinTone', labelKey: 'avatar.skin_tone', type: 'color', colors: SKIN_TONES },
      {
        key: 'cheeks',
        labelKey: 'avatar.cheeks',
        type: 'option',
        options: ['none', 'blush', 'freckles', 'dimples', 'blush-freckles'],
      },
      {
        key: 'beautyMark',
        labelKey: 'avatar.beauty_mark',
        type: 'option',
        options: ['none', 'left-cheek', 'right-cheek', 'chin', 'upper-lip'],
      },
    ],
  },
  {
    id: 'eyes',
    labelKey: 'avatar.eyes',
    icon: '👁️',
    color: '#42A5F5',
    subCategories: [
      {
        key: 'eyeShape',
        labelKey: 'avatar.eye_shape',
        type: 'option',
        options: [
          'default',
          'almond',
          'round',
          'narrow',
          'wide',
          'hooded',
          'monolid',
          'downturned',
          'upturned',
        ],
      },
      { key: 'eyeColor', labelKey: 'avatar.eye_color', type: 'color', colors: EYE_COLORS },
      {
        key: 'eyelashes',
        labelKey: 'avatar.eyelashes',
        type: 'option',
        options: ['none', 'natural', 'long', 'dramatic'],
      },
      {
        key: 'eyebrowShape',
        labelKey: 'avatar.eyebrows',
        type: 'option',
        options: ['natural', 'arched', 'straight', 'thick', 'thin', 'curved', 'angeled', 'bushy'],
      },
      { key: 'eyebrowColor', labelKey: 'avatar.eyebrow_color', type: 'color', colors: HAIR_COLORS },
    ],
  },
  {
    id: 'nose-mouth',
    labelKey: 'avatar.nose_mouth',
    icon: '👃',
    color: '#EF5350',
    subCategories: [
      {
        key: 'noseType',
        labelKey: 'avatar.nose',
        type: 'option',
        options: ['default', 'small', 'wide', 'pointed', 'button', 'aquiline', 'snub', 'greek'],
      },
      {
        key: 'lipShape',
        labelKey: 'avatar.lips',
        type: 'option',
        options: ['default', 'thin', 'full', 'cupid', 'wide', 'heart', 'round'],
      },
      { key: 'lipColor', labelKey: 'avatar.lip_color', type: 'color', colors: LIP_COLORS },
      {
        key: 'expression',
        labelKey: 'avatar.expression',
        type: 'option',
        options: [
          'neutral',
          'smile',
          'grin',
          'slight-smile',
          'open-mouth',
          'smirk',
          'pout',
          'laugh',
        ],
      },
    ],
  },
  {
    id: 'hair',
    labelKey: 'avatar.hair',
    icon: '💇',
    color: '#AB47BC',
    subCategories: [
      {
        key: 'hairStyle',
        labelKey: 'avatar.hair_style',
        type: 'option',
        options: [
          'none',
          'buzz',
          'crew',
          'short-classic',
          'short-textured',
          'side-part',
          'medium-wavy',
          'medium-straight',
          'medium-curly',
          'long-straight',
          'long-wavy',
          'long-curly',
          'afro',
          'afro-puff',
          'braids',
          'cornrows',
          'dreadlocks',
          'bun-high',
          'bun-low',
          'bun-messy',
          'ponytail',
          'ponytail-high',
          'ponytail-side',
          'pixie',
          'bob',
          'lob',
          'mohawk',
          'undercut',
          'fade',
        ],
      },
      { key: 'hairColor', labelKey: 'avatar.hair_color', type: 'color', colors: HAIR_COLORS },
      {
        key: 'facialHair',
        labelKey: 'avatar.facial_hair',
        type: 'option',
        options: [
          'none',
          'stubble',
          'mustache',
          'goatee',
          'full-beard',
          'short-beard',
          'chinstrap',
          'soul-patch',
          'handlebar',
          'van-dyke',
        ],
      },
      {
        key: 'facialHairColor',
        labelKey: 'avatar.facial_hair_color',
        type: 'color',
        colors: HAIR_COLORS,
      },
    ],
  },
  {
    id: 'accessories',
    labelKey: 'avatar.accessories',
    icon: '✨',
    color: '#26C6DA',
    subCategories: [
      {
        key: 'glassesStyle',
        labelKey: 'avatar.glasses',
        type: 'option',
        options: [
          'none',
          'round',
          'square',
          'aviator',
          'cat-eye',
          'wayfarer',
          'rectangular',
          'rimless',
          'oversized',
          'sunglasses-round',
          'sunglasses-aviator',
          'sunglasses-sport',
        ],
      },
      {
        key: 'glassesColor',
        labelKey: 'avatar.frame_color',
        type: 'color',
        colors: GLASSES_COLORS,
      },
      {
        key: 'headwear',
        labelKey: 'avatar.headwear',
        type: 'option',
        options: [
          'none',
          'cap',
          'beanie',
          'fedora',
          'bucket-hat',
          'bandana',
          'turban',
          'headband',
          'crown',
          'beret',
          'hijab',
        ],
      },
      {
        key: 'earrings',
        labelKey: 'avatar.earrings',
        type: 'option',
        options: ['none', 'stud', 'hoop-small', 'hoop-large', 'drop', 'bar'],
      },
      {
        key: 'necklace',
        labelKey: 'avatar.necklace',
        type: 'option',
        options: ['none', 'chain', 'pendant', 'choker', 'pearls'],
      },
      {
        key: 'piercing',
        labelKey: 'avatar.piercing',
        type: 'option',
        options: ['none', 'nose-stud', 'nose-ring', 'septum', 'lip'],
      },
    ],
  },
  {
    id: 'outfit',
    labelKey: 'avatar.outfit',
    icon: '👕',
    color: '#66BB6A',
    subCategories: [
      {
        key: 'outfitTop',
        labelKey: 'avatar.top',
        type: 'option',
        options: [
          'tshirt',
          'hoodie',
          'sweater',
          'jacket',
          'tank',
          'shirt-collar',
          'turtleneck',
          'crop-top',
          'blazer',
          'vest',
          'dress',
          'overalls',
        ],
      },
      { key: 'outfitColor', labelKey: 'avatar.color', type: 'color', colors: OUTFIT_COLORS },
    ],
  },
  {
    id: 'background',
    labelKey: 'avatar.background',
    icon: '🎨',
    color: '#FFA726',
    subCategories: [
      {
        key: 'bgStyle',
        labelKey: 'avatar.style',
        type: 'option',
        options: ['solid', 'gradient', 'pattern'],
      },
      { key: 'bgColor', labelKey: 'avatar.color', type: 'color', colors: BG_COLORS },
      {
        key: 'bgSecondaryColor',
        labelKey: 'avatar.second_color',
        type: 'color',
        colors: BG_COLORS,
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// OPTION DISPLAY NAMES (Turkish - kept for backward compatibility)
// ═══════════════════════════════════════════════════════════════════════════

export const OPTION_LABELS_TR: Record<string, string> = {
  // Face shapes
  oval: 'Oval',
  round: 'Yuvarlak',
  square: 'Kare',
  heart: 'Kalp',
  oblong: 'Uzun',
  diamond: 'Elmas',
  // Eyes
  default: 'Varsayılan',
  almond: 'Badem',
  narrow: 'Dar',
  wide: 'Geniş',
  hooded: 'Kapaklı',
  monolid: 'Tek Kat',
  downturned: 'Düşük',
  upturned: 'Kalkık',
  // Eyelashes
  none: 'Yok',
  natural: 'Doğal',
  long: 'Uzun',
  dramatic: 'Dramatik',
  // Eyebrows
  arched: 'Kavisli',
  straight: 'Düz',
  thick: 'Kalın',
  thin: 'İnce',
  curved: 'Eğri',
  angeled: 'Açılı',
  bushy: 'Gür',
  // Nose
  small: 'Küçük',
  pointed: 'Sivri',
  button: 'Buton',
  aquiline: 'Kartal',
  snub: 'Kalkık',
  greek: 'Yunan',
  // Lips
  full: 'Dolgun',
  cupid: 'Cupid',
  // Expression
  neutral: 'Nötr',
  smile: 'Gülümseme',
  grin: 'Sırıtma',
  'slight-smile': 'Hafif Gülüş',
  'open-mouth': 'Açık Ağız',
  smirk: 'Sırıtış',
  pout: 'Somurtma',
  laugh: 'Kahkaha',
  // Hair styles
  buzz: 'Kazınmış',
  crew: 'Crew Cut',
  'short-classic': 'Kısa Klasik',
  'short-textured': 'Kısa Doku',
  'side-part': 'Yan Ayrık',
  'medium-wavy': 'Orta Dalgalı',
  'medium-straight': 'Orta Düz',
  'medium-curly': 'Orta Kıvırcık',
  'long-straight': 'Uzun Düz',
  'long-wavy': 'Uzun Dalgalı',
  'long-curly': 'Uzun Kıvırcık',
  afro: 'Afro',
  'afro-puff': 'Afro Puff',
  braids: 'Örgü',
  cornrows: 'Cornrow',
  dreadlocks: 'Dreadlock',
  'bun-high': 'Yüksek Topuz',
  'bun-low': 'Alçak Topuz',
  'bun-messy': 'Dağınık Topuz',
  ponytail: 'At Kuyruğu',
  'ponytail-high': 'Yüksek Kuyruk',
  'ponytail-side': 'Yan Kuyruk',
  pixie: 'Pixie',
  bob: 'Bob',
  lob: 'Lob',
  mohawk: 'Mohawk',
  undercut: 'Undercut',
  fade: 'Fade',
  // Facial hair
  stubble: 'Sakal Izi',
  mustache: 'Bıyık',
  goatee: 'Keçi Sakalı',
  'full-beard': 'Tam Sakal',
  'short-beard': 'Kısa Sakal',
  chinstrap: 'Çene Sakalı',
  'soul-patch': 'Soul Patch',
  handlebar: 'Handlebar',
  'van-dyke': 'Van Dyke',
  // Glasses
  aviator: 'Aviator',
  'cat-eye': 'Kedi Göz',
  wayfarer: 'Wayfarer',
  rectangular: 'Dikdörtgen',
  rimless: 'Çerçevesiz',
  oversized: 'Büyük',
  'sunglasses-round': 'Güneş Yuvarlak',
  'sunglasses-aviator': 'Güneş Aviator',
  'sunglasses-sport': 'Spor Güneş',
  // Headwear
  cap: 'Şapka',
  beanie: 'Bere',
  fedora: 'Fedora',
  'bucket-hat': 'Kova Şapka',
  bandana: 'Bandana',
  turban: 'Türban',
  headband: 'Kafa Bandı',
  crown: 'Taç',
  beret: 'Bere',
  hijab: 'Tesettür',
  // Earrings
  stud: 'Tırnak',
  'hoop-small': 'Küçük Halka',
  'hoop-large': 'Büyük Halka',
  drop: 'Sallantılı',
  bar: 'Çubuk',
  // Necklace
  chain: 'Zincir',
  pendant: 'Kolye Ucu',
  choker: 'Boğaz',
  pearls: 'İnci',
  // Piercing
  'nose-stud': 'Burun Tırnak',
  'nose-ring': 'Burun Halkası',
  septum: 'Septum',
  lip: 'Dudak',
  // Cheeks
  blush: 'Allık',
  freckles: 'Çil',
  dimples: 'Gamze',
  'blush-freckles': 'Allık & Çil',
  // Beauty marks
  'left-cheek': 'Sol Yanak',
  'right-cheek': 'Sağ Yanak',
  chin: 'Çene',
  'upper-lip': 'Üst Dudak',
  // Outfit
  tshirt: 'Tişört',
  hoodie: 'Kapşonlu',
  sweater: 'Kazak',
  jacket: 'Ceket',
  tank: 'Atlet',
  'shirt-collar': 'Gömlek',
  turtleneck: 'Balıkçı Yaka',
  'crop-top': 'Crop Top',
  blazer: 'Blazer',
  vest: 'Yelek',
  dress: 'Elbise',
  overalls: 'Tulum',
  // Background
  solid: 'Düz',
  gradient: 'Gradyan',
  pattern: 'Desen',
};
