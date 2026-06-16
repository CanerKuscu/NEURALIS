/**
 * NEURALIS - Localization Service
 * Multilingual notification and widget text support
 * Supports: English, Turkish, German, Spanish, French
 */

import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type NotificationLocale = 'en' | 'tr' | 'de' | 'es' | 'fr';

export type NotificationSeverity = 'normal' | 'urgent' | 'decay' | 'critical' | 'dead';

export type ShadowFoxStatus = 'happy' | 'tense' | 'fading' | 'critical' | 'dead';

interface NotificationTemplate {
  title: string;
  body: string;
}

interface WidgetStrings {
  streakLabel: string;
  timeLeft: string;
  foxStatus: Record<ShadowFoxStatus, string>;
  hours: string;
  minutes: string;
  seconds: string;
  dayStreak: string;
  daysStreak: string;
  taskComplete: string;
  taskPending: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SUPPORTED LOCALES
// ═══════════════════════════════════════════════════════════════════════════

export const SUPPORTED_LOCALES: readonly NotificationLocale[] = [
  'en',
  'tr',
  'de',
  'es',
  'fr',
] as const;

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATION TRANSLATIONS
// ═══════════════════════════════════════════════════════════════════════════

const NOTIFICATION_STRINGS: Record<
  NotificationLocale,
  Record<NotificationSeverity, NotificationTemplate>
> = {
  en: {
    normal: {
      title: '🦊 Shadow Fox is watching',
      body: 'Protect your synapse. Streak safe for now.',
    },
    urgent: {
      title: '⚠️ WARNING: Shadow is fading!',
      body: 'Warning! The shadow is fading. {{hours}}h left!',
    },
    decay: {
      title: '💀 NEURAL DECAY ACTIVE',
      body: 'Help... the link is dying... SAVE ME!',
    },
    critical: {
      title: '🚨 CRITICAL: {{minutes}} MINUTES LEFT',
      body: 'Your streak is about to DIE! This is your FINAL warning!',
    },
    dead: {
      title: '☠️ STREAK TERMINATED',
      body: 'The Shadow Fox has fallen. Your {{streak}} day streak is gone.',
    },
  },
  tr: {
    normal: {
      title: '🦊 Shadow Fox is watching',
      body: 'Protect your synapse. Streak safe for now.',
    },
    urgent: {
      title: '⚠️ WARNING: Shadow is fading!',
      body: 'Warning! The shadow is fading. {{hours}}h left!',
    },
    decay: {
      title: '💀 NEURAL DECAY ACTIVE',
      body: 'Help... the link is dying... SAVE ME!',
    },
    critical: {
      title: '🚨 CRITICAL: {{minutes}} MINUTES LEFT',
      body: 'Your streak is about to DIE! This is your FINAL warning!',
    },
    dead: {
      title: '☠️ STREAK TERMINATED',
      body: 'The Shadow Fox has fallen. Your {{streak}} day streak is gone.',
    },
  },
  de: {
    normal: {
      title: '🦊 Der Schattenfuchs beobachtet',
      body: 'Schütze deine Synapse. Serie vorerst sicher.',
    },
    urgent: {
      title: '⚠️ WARNUNG: Schatten verblasst!',
      body: 'Warnung! Der Schatten verblasst. Noch {{hours}} Stunden!',
    },
    decay: {
      title: '💀 NEURONALER VERFALL AKTIV',
      body: 'Hilfe... die Verbindung stirbt... RETTE MICH!',
    },
    critical: {
      title: '🚨 KRITISCH: {{minutes}} MINUTEN ÜBRIG',
      body: 'Deine Serie stirbt gleich! Dies ist deine LETZTE Warnung!',
    },
    dead: {
      title: '☠️ SERIE BEENDET',
      body: 'Der Schattenfuchs ist gefallen. Deine {{streak}}-Tage-Serie ist vorbei.',
    },
  },
  es: {
    normal: {
      title: '🦊 El Zorro Sombra observa',
      body: 'Protege tu sinapsis. Racha segura por ahora.',
    },
    urgent: {
      title: '⚠️ ¡ADVERTENCIA: La sombra se desvanece!',
      body: '¡Advertencia! La sombra se desvanece. ¡Quedan {{hours}} horas!',
    },
    decay: {
      title: '💀 DETERIORO NEURAL ACTIVO',
      body: 'Ayuda... el enlace muere... ¡SÁLVAME!',
    },
    critical: {
      title: '🚨 CRÍTICO: {{minutes}} MINUTOS RESTANTES',
      body: '¡Tu racha está a punto de MORIR! ¡Esta es tu ÚLTIMA advertencia!',
    },
    dead: {
      title: '☠️ RACHA TERMINADA',
      body: 'El Zorro Sombra ha caído. Tu racha de {{streak}} días se ha ido.',
    },
  },
  fr: {
    normal: {
      title: '🦊 Le Renard Ombre surveille',
      body: 'Protège ta synapse. Série en sécurité pour le moment.',
    },
    urgent: {
      title: "⚠️ ATTENTION: L'ombre s'estompe!",
      body: "Attention! L'ombre s'estompe. {{hours}}h restantes!",
    },
    decay: {
      title: '💀 DÉCLIN NEURAL ACTIF',
      body: "À l'aide... le lien meurt... SAUVE-MOI!",
    },
    critical: {
      title: '🚨 CRITIQUE: {{minutes}} MINUTES RESTANTES',
      body: 'Ta série va MOURIR! Ceci est ton DERNIER avertissement!',
    },
    dead: {
      title: '☠️ SÉRIE TERMINÉE',
      body: 'Le Renard Ombre est tombé. Ta série de {{streak}} jours est partie.',
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// WIDGET TRANSLATIONS
// ═══════════════════════════════════════════════════════════════════════════

const WIDGET_STRINGS: Record<NotificationLocale, WidgetStrings> = {
  en: {
    streakLabel: 'Current Streak',
    timeLeft: 'Time Left',
    foxStatus: {
      happy: 'Shadow Fox is Happy',
      tense: 'Shadow Fox is Tense',
      fading: 'Shadow Fox is Fading',
      critical: 'CRITICAL STATE',
      dead: 'Streak Lost',
    },
    hours: 'hours',
    minutes: 'minutes',
    seconds: 'seconds',
    dayStreak: 'day streak',
    daysStreak: 'days streak',
    taskComplete: 'Task Complete ✓',
    taskPending: 'Complete Task',
  },
  tr: {
    streakLabel: 'Current Streak',
    timeLeft: 'Time Left',
    foxStatus: {
      happy: 'Shadow Fox is Happy',
      tense: 'Shadow Fox is Tense',
      fading: 'Shadow Fox is Fading',
      critical: 'CRITICAL STATE',
      dead: 'Streak Lost',
    },
    hours: 'hours',
    minutes: 'minutes',
    seconds: 'seconds',
    dayStreak: 'day streak',
    daysStreak: 'days streak',
    taskComplete: 'Task Complete ✓',
    taskPending: 'Complete Task',
  },
  de: {
    streakLabel: 'Aktuelle Serie',
    timeLeft: 'Verbleibende Zeit',
    foxStatus: {
      happy: 'Schattenfuchs ist glücklich',
      tense: 'Schattenfuchs ist angespannt',
      fading: 'Schattenfuchs verblasst',
      critical: 'KRITISCHER ZUSTAND',
      dead: 'Serie verloren',
    },
    hours: 'Stunden',
    minutes: 'Minuten',
    seconds: 'Sekunden',
    dayStreak: 'Tage Serie',
    daysStreak: 'Tage Serie',
    taskComplete: 'Aufgabe erledigt ✓',
    taskPending: 'Aufgabe erledigen',
  },
  es: {
    streakLabel: 'Racha Actual',
    timeLeft: 'Tiempo Restante',
    foxStatus: {
      happy: 'Zorro Sombra está feliz',
      tense: 'Zorro Sombra está tenso',
      fading: 'Zorro Sombra se desvanece',
      critical: 'ESTADO CRÍTICO',
      dead: 'Racha perdida',
    },
    hours: 'horas',
    minutes: 'minutos',
    seconds: 'segundos',
    dayStreak: 'día de racha',
    daysStreak: 'días de racha',
    taskComplete: 'Tarea Completada ✓',
    taskPending: 'Completar Tarea',
  },
  fr: {
    streakLabel: 'Série Actuelle',
    timeLeft: 'Temps Restant',
    foxStatus: {
      happy: 'Renard Ombre est heureux',
      tense: 'Renard Ombre est tendu',
      fading: "Renard Ombre s'estompe",
      critical: 'ÉTAT CRITIQUE',
      dead: 'Série perdue',
    },
    hours: 'heures',
    minutes: 'minutes',
    seconds: 'secondes',
    dayStreak: 'jour de série',
    daysStreak: 'jours de série',
    taskComplete: 'Tâche Terminée ✓',
    taskPending: 'Compléter la Tâche',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// AGGRESSIVE NOTIFICATION MESSAGES (Duolingo-style persistence)
// ═══════════════════════════════════════════════════════════════════════════

const AGGRESSIVE_MESSAGES: Record<NotificationLocale, string[]> = {
  en: [
    '🦊 The Shadow Fox misses you...',
    "🦊 Don't abandon the Shadow Fox!",
    '🦊 Your neural pathways are degrading...',
    "🦊 Just 5 minutes. That's all it takes.",
    '🦊 Your streak is CRYING for help!',
    '🦊 The fox is getting lonely...',
    '🦊 Winners train. Losers scroll. Choose.',
    '🦊 Your future self will thank you. START NOW.',
    '🦊 The decay is accelerating. Help!',
    '🦊 Your brain is ROTTING. Wake up!',
  ],
  tr: [
    '🦊 The Shadow Fox misses you...',
    "🦊 Don't abandon the Shadow Fox!",
    '🦊 Your neural pathways are degrading...',
    "🦊 Just 5 minutes. That's all it takes.",
    '🦊 Your streak is CRYING for help!',
    '🦊 The fox is getting lonely...',
    '🦊 Winners train. Losers scroll. Choose.',
    '🦊 Your future self will thank you. START NOW.',
    '🦊 The decay is accelerating. Help!',
    '🦊 Your brain is ROTTING. Wake up!',
  ],
  de: [
    '🦊 Der Schattenfuchs vermisst dich...',
    '🦊 Verlass den Schattenfuchs nicht!',
    '🦊 Deine neuronalen Bahnen degradieren...',
    '🦊 Nur 5 Minuten. Mehr nicht.',
    '🦊 Deine Serie SCHREIT um Hilfe!',
    '🦊 Der Fuchs wird einsam...',
    '🦊 Gewinner trainieren. Verlierer scrollen. Wähle.',
    '🦊 Dein zukünftiges Ich wird dir danken. FANG JETZT AN.',
    '🦊 Der Verfall beschleunigt sich. Hilfe!',
    '🦊 Dein Gehirn VERROTTET. Wach auf!',
  ],
  es: [
    '🦊 El Zorro Sombra te extraña...',
    '🦊 ¡No abandones al Zorro Sombra!',
    '🦊 Tus vías neuronales se degradan...',
    '🦊 Solo 5 minutos. Eso es todo.',
    '🦊 ¡Tu racha está GRITANDO por ayuda!',
    '🦊 El zorro se siente solo...',
    '🦊 Los ganadores entrenan. Los perdedores deslizan. Elige.',
    '🦊 Tu yo futuro te lo agradecerá. EMPIEZA AHORA.',
    '🦊 ¡El deterioro se acelera. Ayuda!',
    '🦊 ¡Tu cerebro se está PUDRIENDO. Despierta!',
  ],
  fr: [
    '🦊 Le Renard Ombre te manque...',
    "🦊 N'abandonne pas le Renard Ombre!",
    '🦊 Tes voies neuronales se dégradent...',
    "🦊 Juste 5 minutes. C'est tout.",
    "🦊 Ta série CRIE à l'aide!",
    '🦊 Le renard se sent seul...',
    "🦊 Les gagnants s'entraînent. Les perdants défilent. Choisis.",
    '🦊 Ton futur toi te remerciera. COMMENCE MAINTENANT.',
    "🦊 Le déclin s'accélère. À l'aide!",
    '🦊 Ton cerveau POURRIT. Réveille-toi!',
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// STORAGE KEYS
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_KEYS = {
  LOCALE: '@neuralis/notification_locale',
  TIMEZONE: '@neuralis/timezone',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// LOCALIZATION SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════

class LocalizationService {
  private currentLocale: NotificationLocale = 'en';
  private timezone: string = 'UTC';
  private isInitialized: boolean = false;

  /**
   * Initialize localization service with device settings
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Get stored locale or detect from device
      const storedLocale = await AsyncStorage.getItem(STORAGE_KEYS.LOCALE);

      if (storedLocale && this.isValidLocale(storedLocale)) {
        this.currentLocale = storedLocale as NotificationLocale;
      } else {
        // Detect from device
        const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'en';
        this.currentLocale = this.mapDeviceLocale(deviceLocale);
      }

      // Get timezone
      this.timezone = Localization.getCalendars()[0]?.timeZone ?? 'UTC';

      this.isInitialized = true;
      console.log(
        `[LocalizationService] Initialized: locale=${this.currentLocale}, timezone=${this.timezone}`,
      );
    } catch (error) {
      console.error('[LocalizationService] Initialization error:', error);
      this.currentLocale = 'en';
      this.timezone = 'UTC';
      this.isInitialized = true;
    }
  }

  /**
   * Map device locale code to supported locale
   */
  private mapDeviceLocale(deviceLocale: string): NotificationLocale {
    const localeMap: Record<string, NotificationLocale> = {
      en: 'en',
      tr: 'tr',
      de: 'de',
      es: 'es',
      fr: 'fr',
    };

    return localeMap[deviceLocale.toLowerCase()] ?? 'en';
  }

  /**
   * Check if locale is valid
   */
  private isValidLocale(locale: string): boolean {
    return ['en', 'tr', 'de', 'es', 'fr'].includes(locale);
  }

  /**
   * Set current locale
   */
  async setLocale(locale: NotificationLocale): Promise<void> {
    this.currentLocale = locale;
    await AsyncStorage.setItem(STORAGE_KEYS.LOCALE, locale);
  }

  /**
   * Get current locale
   */
  getLocale(): NotificationLocale {
    return this.currentLocale;
  }

  /**
   * Get timezone
   */
  getTimezone(): string {
    return this.timezone;
  }

  /**
   * Get notification text for severity level
   */
  getNotification(
    severity: NotificationSeverity,
    params?: { hours?: number; minutes?: number; streak?: number },
  ): NotificationTemplate {
    const template = NOTIFICATION_STRINGS[this.currentLocale][severity];

    let title = template.title;
    let body = template.body;

    // Replace placeholders
    if (params?.hours !== undefined) {
      title = title.replace('{{hours}}', params.hours.toString());
      body = body.replace('{{hours}}', params.hours.toString());
    }
    if (params?.minutes !== undefined) {
      title = title.replace('{{minutes}}', params.minutes.toString());
      body = body.replace('{{minutes}}', params.minutes.toString());
    }
    if (params?.streak !== undefined) {
      title = title.replace('{{streak}}', params.streak.toString());
      body = body.replace('{{streak}}', params.streak.toString());
    }

    return { title, body };
  }

  /**
   * Get random aggressive message (Duolingo-style)
   */
  getAggressiveMessage(): string {
    const messages = AGGRESSIVE_MESSAGES[this.currentLocale];
    const randomIndex = Math.floor(Math.random() * messages.length);
    return messages[randomIndex];
  }

  /**
   * Get widget strings
   */
  getWidgetStrings(): WidgetStrings {
    return WIDGET_STRINGS[this.currentLocale];
  }

  /**
   * Format countdown time
   */
  formatCountdown(remainingMs: number): string {
    const strings = this.getWidgetStrings();
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} ${strings.minutes}`;
  }

  /**
   * Format streak count
   */
  formatStreak(count: number): string {
    const strings = this.getWidgetStrings();
    const streakWord = count === 1 ? strings.dayStreak : strings.daysStreak;
    return `${count} ${streakWord}`;
  }

  /**
   * Get Shadow Fox status text
   */
  getFoxStatusText(status: ShadowFoxStatus): string {
    return this.getWidgetStrings().foxStatus[status];
  }

  /**
   * Get all supported locales
   */
  getSupportedLocales(): Array<{ code: NotificationLocale; name: string; flag: string }> {
    return [
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
      { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
      { code: 'es', name: 'Español', flag: '🇪🇸' },
      { code: 'fr', name: 'Français', flag: '🇫🇷' },
    ];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const localizationService = new LocalizationService();
export default localizationService;
