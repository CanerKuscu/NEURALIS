/**
 * AccessibilityService — Erişilebilirlik Ayarları
 *
 * Yazı boyutu ayarı
 * Yüksek kontrast modu
 * Ekran okuyucu desteği
 * Animasyon azaltma
 * Renk körlüğü modları
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AccessibilityInfo } from 'react-native';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface AccessibilitySettings {
  /** Yazı boyutu çarpanı (0.8 - 1.5) */
  fontScale: number;
  /** Yüksek kontrast modu */
  highContrast: boolean;
  /** Animasyonları azalt */
  reduceMotion: boolean;
  /** Haptic feedback */
  hapticEnabled: boolean;
  /** Ses efektleri */
  soundEnabled: boolean;
  /** Renk körlüğü modu */
  colorBlindMode: ColorBlindMode;
  /** Büyük dokunma hedefleri */
  largeTouchTargets: boolean;
  /** Otomatik TTS */
  autoReadQuestions: boolean;
  /** TTS hızı (0.5 - 2.0) */
  ttsSpeed: number;
  /** Ekran okuyucu aktif mi (sistem) */
  screenReaderEnabled: boolean;
}

export type ColorBlindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';

export interface ColorBlindOption {
  id: ColorBlindMode;
  label: string;
  labelTr: string;
  description: string;
  descriptionTr: string;
  emoji: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// COLOR BLIND OPTIONS
// ═══════════════════════════════════════════════════════════════════════════

export const COLOR_BLIND_OPTIONS: ColorBlindOption[] = [
  {
    id: 'none',
    label: 'Default',
    labelTr: 'Varsayılan',
    description: 'Standard colors',
    descriptionTr: 'Standart renkler',
    emoji: '🎨',
  },
  {
    id: 'protanopia',
    label: 'Protanopia',
    labelTr: 'Protanopi',
    description: 'Red-green (red weak)',
    descriptionTr: 'Kırmızı-yeşil (kırmızı zayıf)',
    emoji: '🔴',
  },
  {
    id: 'deuteranopia',
    label: 'Deuteranopia',
    labelTr: 'Döteranopi',
    description: 'Red-green (green weak)',
    descriptionTr: 'Kırmızı-yeşil (yeşil zayıf)',
    emoji: '🟢',
  },
  {
    id: 'tritanopia',
    label: 'Tritanopia',
    labelTr: 'Tritanopi',
    description: 'Blue-yellow',
    descriptionTr: 'Mavi-sarı',
    emoji: '🔵',
  },
];

/** Renk körlüğü modlarına göre renk dönüşümleri */
export const COLOR_TRANSFORMS: Record<ColorBlindMode, Record<string, string>> = {
  none: {},
  protanopia: {
    '#E74C3C': '#D4A017', // Red → Gold
    '#2ECC71': '#3498DB', // Green → Blue
    '#FF6B35': '#FFD700', // Orange → Yellow
  },
  deuteranopia: {
    '#2ECC71': '#9B59B6', // Green → Purple
    '#E74C3C': '#E67E22', // Red → Orange
    '#27AE60': '#8E44AD', // Dark green → Dark purple
  },
  tritanopia: {
    '#3498DB': '#E74C3C', // Blue → Red
    '#F1C40F': '#FF69B4', // Yellow → Pink
    '#2980B9': '#C0392B', // Dark blue → Dark red
  },
};

const STORAGE_KEY = '@neuralis_accessibility';

const DEFAULT_SETTINGS: AccessibilitySettings = {
  fontScale: 1.0,
  highContrast: false,
  reduceMotion: false,
  hapticEnabled: true,
  soundEnabled: true,
  colorBlindMode: 'none',
  largeTouchTargets: false,
  autoReadQuestions: false,
  ttsSpeed: 1.0,
  screenReaderEnabled: false,
};

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE
// ═══════════════════════════════════════════════════════════════════════════

class AccessibilityService {
  private settings: AccessibilitySettings = { ...DEFAULT_SETTINGS };
  private listeners: ((settings: AccessibilitySettings) => void)[] = [];

  /** Ayarları yükle */
  async loadSettings(): Promise<AccessibilitySettings> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
      }

      // Sistem ekran okuyucu durumu
      const screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      this.settings.screenReaderEnabled = screenReaderEnabled;

      return this.settings;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  /** Ayar güncelle */
  async updateSetting<K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K],
  ): Promise<void> {
    this.settings[key] = value;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    this.notifyListeners();
  }

  /** Toplu ayar güncelle */
  async updateSettings(partial: Partial<AccessibilitySettings>): Promise<void> {
    this.settings = { ...this.settings, ...partial };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    this.notifyListeners();
  }

  /** Mevcut ayarları al */
  getSettings(): AccessibilitySettings {
    return { ...this.settings };
  }

  /** Renk dönüşümü uygula */
  transformColor(color: string): string {
    const transforms = COLOR_TRANSFORMS[this.settings.colorBlindMode];
    return transforms[color] || color;
  }

  /** Yazı boyutunu al */
  getFontSize(baseSize: number): number {
    return Math.round(baseSize * this.settings.fontScale);
  }

  /** Dokunma hedef boyutunu al */
  getTouchTargetSize(baseSize: number): number {
    return this.settings.largeTouchTargets ? Math.max(baseSize, 48) : baseSize;
  }

  /** Animasyon süresi */
  getAnimationDuration(baseDuration: number): number {
    return this.settings.reduceMotion ? 0 : baseDuration;
  }

  /** Listener ekle */
  addListener(cb: (settings: AccessibilitySettings) => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  /** Varsayılana sıfırla */
  async resetToDefault(): Promise<void> {
    this.settings = { ...DEFAULT_SETTINGS };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach((cb) => cb(this.settings));
  }
}

export const accessibilityService = new AccessibilityService();
export default accessibilityService;
