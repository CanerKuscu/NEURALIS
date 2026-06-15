/**
 * NEURALIS - Notification Scheduler
 * The Nerves: Aggressive Notification & Audio Architecture
 * 
 * Audio Assets:
 * - 1.mp3: Safe (>12h) - Authoritative warning
 * - 2.mp3: Urgent (12h-2h) - Rising tension  
 * - 3.mp3: Decay (2h-0) - Desperation
 * 
 * Frequency Logic:
 * - >12h: 1.mp3 once
 * - 12h-2h: 2.mp3 every 4 hours
 * - 2h-1h: 3.mp3 every 30 mins
 * - 60-15 mins: 3.mp3 every 15 mins + Monetization trigger
 * - 15-0 mins: 3.mp3 every 5 mins with Audio Decay (volume 0.4, pitch 0.7)
 */

import * as Notifications from './safeNotifications';
import { Audio, AVPlaybackStatus } from 'expo-av';
import * as Device from 'expo-device';
import { supabase } from '../config/supabase';
// Notification scheduling uses Supabase.

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export type SupportedLocale = 'en' | 'tr' | 'de' | 'es' | 'fr';

export type NotificationPhase = 'safe' | 'urgent' | 'decay' | 'critical' | 'final';

export type AudioFile = '1.mp3' | '2.mp3' | '3.mp3';

export interface NotificationConfig {
    phase: NotificationPhase;
    audioFile: AudioFile;
    intervalMinutes: number;
    volume: number;
    pitch: number;
    showMonetization: boolean;
}

export interface ScheduledNotification {
    id: string;
    userId: string;
    streakId: string;
    phase: NotificationPhase;
    scheduledAt: number;
    firedAt?: number;
    audioFile: AudioFile;
    message: string;
    locale: SupportedLocale;
}

export interface NotificationMessage {
    title: string;
    body: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATION MESSAGES (i18n)
// ═══════════════════════════════════════════════════════════════════════════

const NOTIFICATION_MESSAGES: Record<NotificationPhase, Record<SupportedLocale, NotificationMessage>> = {
    safe: {
        en: {
            title: '🦊 Shadow Fox Reminder',
            body: 'Your neural pathways require maintenance. Complete your daily task.'
        },
        tr: {
            title: '🦊 Shadow Fox Reminder',
            body: 'Your neural pathways require maintenance. Complete your daily task.'
        },
        de: {
            title: '🦊 Shadow Fox Erinnerung',
            body: 'Deine neuronalen Pfade erfordern Wartung. Erledige deine tägliche Aufgabe.'
        },
        es: {
            title: '🦊 Recordatorio de Shadow Fox',
            body: 'Tus vías neuronales requieren mantenimiento. Completa tu tarea diaria.'
        },
        fr: {
            title: '🦊 Rappel de Shadow Fox',
            body: 'Tes voies neuronales nécessitent un entretien. Accomplis ta tâche quotidienne.'
        },
    },
    urgent: {
        en: {
            title: '⚠️ NEURAL ALERT',
            body: 'Time is running out. Your streak is at risk. Act now or face decay.'
        },
        tr: {
            title: '⚠️ NEURAL ALERT',
            body: 'Time is running out. Your streak is at risk. Act now or face decay.'
        },
        de: {
            title: '⚠️ NEURALE WARNUNG',
            body: 'Die Zeit läuft ab. Dein Streak ist gefährdet. Handle jetzt oder stelle dich dem Verfall.'
        },
        es: {
            title: '⚠️ ALERTA NEURAL',
            body: 'El tiempo se acaba. Tu racha está en riesgo. Actúa ahora o enfréntate a la decadencia.'
        },
        fr: {
            title: '⚠️ ALERTE NEURALE',
            body: 'Le temps presse. Ta série est en danger. Agis maintenant ou fais face à la décadence.'
        },
    },
    decay: {
        en: {
            title: '🔴 NEURAL DECAY INITIATED',
            body: 'Your momentum is decreasing. Complete a task to maintain your progress.'
        },
        tr: {
            title: '🔴 NEURAL DECAY INITIATED',
            body: 'Your momentum is decreasing. Complete a task to maintain your progress.'
        },
        de: {
            title: '🔴 NEURALER VERFALL EINGELEITET',
            body: 'Dein Fortschritt nimmt ab. Schließe eine Aufgabe ab, um deinen Fortschritt zu erhalten.'
        },
        es: {
            title: '🔴 DECADENCIA NEURAL INICIADA',
            body: 'Tu progreso está disminuyendo. Completa una tarea para mantener tu progreso.'
        },
        fr: {
            title: '🔴 DÉCADENCE NEURALE INITIÉE',
            body: 'Ta progression diminue. Accomplis une tâche pour maintenir ta progression.'
        },
    },
    critical: {
        en: {
            title: '💀 CRITICAL: MINUTES REMAINING',
            body: 'This is your final reminder. Complete a task to keep your streak.'
        },
        tr: {
            title: '💀 CRITICAL: MINUTES REMAINING',
            body: 'This is your final reminder. Complete a task to keep your streak.'
        },
        de: {
            title: '💀 KRITISCH: MINUTEN VERBLEIBEN',
            body: 'Dies ist deine letzte Erinnerung. Erledige eine Aufgabe, um deine Serie zu behalten.'
        },
        es: {
            title: '💀 CRÍTICO: MINUTOS RESTANTES',
            body: 'Este es tu último recordatorio. Completa una tarea para mantener tu racha.'
        },
        fr: {
            title: '💀 CRITIQUE: MINUTES RESTANTES',
            body: 'Ceci est ton dernier rappel. Accomplis une tâche pour conserver ta série.'
        },
    },
    final: {
        en: {
            title: '☠️ SHADOW FOX FINAL CALL',
            body: '5 minutes left — finish a task to retain your streak.'
        },
        tr: {
            title: '☠️ SHADOW FOX FINAL CALL',
            body: '5 minutes left — finish a task to retain your streak.'
        },
        de: {
            title: '☠️ SHADOW FOX LETZTER AUFRUF',
            body: 'Noch 5 Minuten — Schließe eine Aufgabe ab, um deine Serie zu behalten.'
        },
        es: {
            title: '☠️ LLAMADA FINAL DE SHADOW FOX',
            body: 'Quedan 5 minutos — completa una tarea para conservar tu racha.'
        },
        fr: {
            title: '☠️ APPEL FINAL DE SHADOW FOX',
            body: 'Il te reste 5 minutes — accomplis une tâche pour conserver ta série.'
        },
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// MONETIZATION MESSAGES
// ═══════════════════════════════════════════════════════════════════════════

const MONETIZATION_MESSAGES: Record<SupportedLocale, NotificationMessage> = {
    en: {
        title: '💎 Neuralis Pro: Streak Freeze',
        body: 'Save your streak with Pro. One tap to freeze time and protect your progress.'
    },
    tr: {
        title: '💎 Neuralis Pro: Streak Freeze',
        body: 'Save your streak with Pro. One tap to freeze time and protect your progress.'
    },
    de: {
        title: '💎 Neuralis Pro: Streak Einfrieren',
        body: 'Rette deinen Streak mit Pro. Ein Tippen, um die Zeit einzufrieren und deinen Fortschritt zu schützen.'
    },
    es: {
        title: '💎 Neuralis Pro: Congelar Racha',
        body: 'Salva tu racha con Pro. Un toque para congelar el tiempo y proteger tu progreso.'
    },
    fr: {
        title: '💎 Neuralis Pro: Gel de Série',
        body: 'Sauve ta série avec Pro. Un toucher pour geler le temps et protéger ta progression.'
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// PHASE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const PHASE_CONFIGS: Record<NotificationPhase, NotificationConfig> = {
    safe: {
        phase: 'safe',
        audioFile: '1.mp3',
        intervalMinutes: Infinity, // Only once
        volume: 1.0,
        pitch: 1.0,
        showMonetization: false,
    },
    urgent: {
        phase: 'urgent',
        audioFile: '2.mp3',
        intervalMinutes: 240, // Every 4 hours
        volume: 1.0,
        pitch: 1.0,
        showMonetization: false,
    },
    decay: {
        phase: 'decay',
        audioFile: '3.mp3',
        intervalMinutes: 30, // Every 30 minutes
        volume: 0.85,
        pitch: 0.9,
        showMonetization: false,
    },
    critical: {
        phase: 'critical',
        audioFile: '3.mp3',
        intervalMinutes: 15, // Every 15 minutes
        volume: 0.6,
        pitch: 0.8,
        showMonetization: true, // Trigger monetization
    },
    final: {
        phase: 'final',
        audioFile: '3.mp3',
        intervalMinutes: 5, // Every 5 minutes
        volume: 0.4, // Audio decay
        pitch: 0.7, // Audio decay
        showMonetization: true,
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATION SCHEDULER CLASS
// ═══════════════════════════════════════════════════════════════════════════

class NotificationScheduler {
    private static instance: NotificationScheduler;
    private soundObject: Audio.Sound | null = null;
    private scheduledIds: Set<string> = new Set();

    private constructor() {
        this.initializeNotifications();
    }

    static getInstance(): NotificationScheduler {
        if (!NotificationScheduler.instance) {
            NotificationScheduler.instance = new NotificationScheduler();
        }
        return NotificationScheduler.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INITIALIZATION
    // ─────────────────────────────────────────────────────────────────────────

    private async initializeNotifications(): Promise<void> {
        // Configure notification handler
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: false, // We handle sound separately for pitch/volume control
                shouldSetBadge: true,
                shouldShowBanner: true,
                shouldShowList: true,
            }),
        });

        // Request permissions
        if (Device.isDevice) {
            try {
                const { status } = await Notifications.requestPermissionsAsync();
                if (status !== 'granted') {
                    console.warn('[NotificationScheduler] Permission not granted');
                }
            } catch (e) {
                console.warn('[NotificationScheduler] Error requesting permissions:', e);
            }
        }

        // Configure audio
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            staysActiveInBackground: true,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PHASE DETERMINATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Determine notification phase based on hours remaining
     */
    determinePhase(hoursRemaining: number): NotificationPhase {
        if (hoursRemaining > 12) return 'safe';
        if (hoursRemaining > 2) return 'urgent';
        if (hoursRemaining > 1) return 'decay';
        if (hoursRemaining > 0.25) return 'critical'; // > 15 minutes
        return 'final';
    }

    /**
     * Get phase configuration
     */
    getPhaseConfig(phase: NotificationPhase): NotificationConfig {
        return PHASE_CONFIGS[phase];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NOTIFICATION SCHEDULING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Schedule all notifications based on deadline
     */
    async scheduleStreakNotifications(
        userId: string,
        streakId: string,
        deadlineAt: number,
        locale: SupportedLocale = 'en'
    ): Promise<void> {
        const now = Date.now();
        const hoursRemaining = (deadlineAt - now) / (1000 * 60 * 60);

        // Cancel existing notifications for this streak
        await this.cancelStreakNotifications(userId, streakId);

        // Schedule based on time remaining
        if (hoursRemaining > 12) {
            // Safe phase: single notification
            await this.scheduleNotification({
                userId,
                streakId,
                phase: 'safe',
                scheduledAt: now + (1000 * 60 * 60), // 1 hour from now
                locale,
            });
        }

        if (hoursRemaining > 2) {
            // Urgent phase: every 4 hours
            const urgentStart = Math.max(now, deadlineAt - (12 * 60 * 60 * 1000));
            const urgentEnd = deadlineAt - (2 * 60 * 60 * 1000);

            for (let time = urgentStart; time < urgentEnd; time += 4 * 60 * 60 * 1000) {
                if (time > now) {
                    await this.scheduleNotification({
                        userId,
                        streakId,
                        phase: 'urgent',
                        scheduledAt: time,
                        locale,
                    });
                }
            }
        }

        if (hoursRemaining > 1) {
            // Decay phase: every 30 minutes
            const decayStart = Math.max(now, deadlineAt - (2 * 60 * 60 * 1000));
            const decayEnd = deadlineAt - (60 * 60 * 1000);

            for (let time = decayStart; time < decayEnd; time += 30 * 60 * 1000) {
                if (time > now) {
                    await this.scheduleNotification({
                        userId,
                        streakId,
                        phase: 'decay',
                        scheduledAt: time,
                        locale,
                    });
                }
            }
        }

        if (hoursRemaining > 0.25) {
            // Critical phase: every 15 minutes
            const criticalStart = Math.max(now, deadlineAt - (60 * 60 * 1000));
            const criticalEnd = deadlineAt - (15 * 60 * 1000);

            for (let time = criticalStart; time < criticalEnd; time += 15 * 60 * 1000) {
                if (time > now) {
                    await this.scheduleNotification({
                        userId,
                        streakId,
                        phase: 'critical',
                        scheduledAt: time,
                        locale,
                    });
                }
            }
        }

        // Final phase: every 5 minutes in last 15 minutes
        const finalStart = Math.max(now, deadlineAt - (15 * 60 * 1000));
        for (let time = finalStart; time < deadlineAt; time += 5 * 60 * 1000) {
            if (time > now) {
                await this.scheduleNotification({
                    userId,
                    streakId,
                    phase: 'final',
                    scheduledAt: time,
                    locale,
                });
            }
        }
    }

    /**
     * Schedule a single notification
     */
    private async scheduleNotification(params: {
        userId: string;
        streakId: string;
        phase: NotificationPhase;
        scheduledAt: number;
        locale: SupportedLocale;
    }): Promise<string> {
        const { userId, streakId, phase, scheduledAt, locale } = params;
        const config = PHASE_CONFIGS[phase];
        const messages = NOTIFICATION_MESSAGES[phase][locale];

        const notificationId = `${userId}_${streakId}_${phase}_${scheduledAt}`;

        // Schedule with Expo
        const trigger = new Date(scheduledAt);

        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: messages.title,
                    body: messages.body,
                    data: {
                        userId,
                        streakId,
                        phase,
                        audioFile: config.audioFile,
                        volume: config.volume,
                        pitch: config.pitch,
                        showMonetization: config.showMonetization,
                    },
                    sound: false, // We handle audio separately
                    badge: 1,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: trigger,
                },
            });

            this.scheduledIds.add(notificationId);


            // Persist to Supabase
            const notificationDoc: ScheduledNotification = {
                id: notificationId,
                userId,
                streakId,
                phase,
                scheduledAt,
                audioFile: config.audioFile,
                message: messages.body,
                locale,
            };
            try {
                const { error } = await supabase.from('scheduled_notifications').upsert(notificationDoc);
                if (error) {
                    console.error('[NotificationScheduler] Failed to upsert scheduled_notifications:', error);
                    const details = String(error?.details || '').toLowerCase();
                    const message = String(error?.message || '').toLowerCase();
                    const isMissingTable = error?.code === 'PGRST205' || details.includes('could not find') || message.includes('could not find') || message.includes('table');
                    if (isMissingTable) {
                        console.warn('[NotificationScheduler] Missing table detected; skipping scheduled_notifications persistence.');
                    } else {
                        throw error;
                    }
                }
            } catch (err) {
                console.error('[NotificationScheduler] Unexpected error during scheduled_notifications upsert:', err);
            }

            return notificationId;
        } catch (error) {
            console.error('[NotificationScheduler] Failed to schedule:', error);
            throw error;
        }
    }

    /**
     * Cancel all notifications for a streak
     */
    async cancelStreakNotifications(userId: string, streakId: string): Promise<void> {
        // Cancel from Expo
        await Notifications.cancelAllScheduledNotificationsAsync();

        // Remove from Supabase
        const { error } = await supabase
            .from('scheduled_notifications')
            .delete()
            .eq('userId', userId)
            .eq('streakId', streakId);
        // Remove all scheduledIds for this user/streak
        // (Assuming scheduledIds is a Set of notification IDs)
        // If you want to be more precise, you could fetch before delete, but here we clear all for this streak
        this.scheduledIds.forEach((id) => {
            // If you encode userId/streakId in the id, filter here. Otherwise, just clear all.
            this.scheduledIds.delete(id);
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AUDIO PLAYBACK WITH DECAY
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Play audio with volume and pitch control
     */
    async playNotificationAudio(
        audioFile: AudioFile,
        volume: number = 1.0,
        pitch: number = 1.0
    ): Promise<void> {
        try {
            // Unload previous sound
            if (this.soundObject) {
                await this.soundObject.unloadAsync();
            }

            // Map audio file to asset
            const audioAssets: Record<AudioFile, number> = {
                '1.mp3': require('../../assets/audio/1.mp3'),
                '2.mp3': require('../../assets/audio/2.mp3'),
                '3.mp3': require('../../assets/audio/3.mp3'),
            };

            const { sound } = await Audio.Sound.createAsync(
                audioAssets[audioFile],
                {
                    volume: Math.max(0, Math.min(1, volume)),
                    rate: Math.max(0.5, Math.min(2, pitch)), // pitch via rate
                    shouldCorrectPitch: true,
                }
            );

            this.soundObject = sound;
            await sound.playAsync();

            // Auto-unload after playback
            sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
                if (status.isLoaded && status.didJustFinish) {
                    sound.unloadAsync();
                }
            });
        } catch (error) {
            console.error('[NotificationScheduler] Audio playback error:', error);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NOTIFICATION HANDLING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Handle received notification
     */
    async handleNotificationReceived(notification: Notifications.Notification): Promise<void> {
        const data = notification.request.content.data as {
            phase: NotificationPhase;
            audioFile: AudioFile;
            volume: number;
            pitch: number;
            showMonetization: boolean;
        };

        // Play audio with decay settings
        await this.playNotificationAudio(data.audioFile, data.volume, data.pitch);

        // Show monetization prompt if applicable
        if (data.showMonetization) {
            this.triggerMonetizationPrompt(notification.request.content.data.userId as string);
        }
    }

    /**
     * Trigger monetization prompt
     */
    private triggerMonetizationPrompt(userId: string): void {
        // Emit event for UI to show monetization modal
        // This would typically use an event emitter or state management
        console.log('[NotificationScheduler] Monetization trigger for:', userId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SYNAPSE GUILT NOTIFICATIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Send guilt notification to partner
     */
    async sendSynapseGuiltNotification(
        partnerId: string,
        failingUserName: string,
        locale: SupportedLocale = 'en'
    ): Promise<void> {
        const guiltMessages: Record<SupportedLocale, NotificationMessage> = {
            en: {
                title: '⚡ SYNAPSE ALERT',
                body: `Your partner ${failingUserName} lost their discipline and risked your synapse bond. Warn them immediately!`,
            },
            tr: {
                title: '⚡ SİNAPS UYARISI',
                body: `Partnerin ${failingUserName} disiplinini kaybetti ve sinaps bağını riske attı. Hemen uyar!`,
            },
            de: {
                title: '⚡ SYNAPSE-ALARM',
                body: `Dein Partner ${failingUserName} hat seine Disziplin verloren und eure Synapse-Bindung riskiert. Warne ihn sofort!`,
            },
            es: {
                title: '⚡ ALERTA DE SINAPSIS',
                body: `Tu compañero ${failingUserName} perdió su disciplina y arriesgó tu vínculo de sinapsis. ¡Advierte inmediatamente!`,
            },
            fr: {
                title: '⚡ ALERTE SYNAPSE',
                body: `Ton partenaire ${failingUserName} a perdu sa discipline et a mis en péril votre lien synaptique. Avertis-le immédiatement!`,
            },
        };

        const message = guiltMessages[locale];

        await Notifications.scheduleNotificationAsync({
            content: {
                title: message.title,
                body: message.body,
                sound: true,
                badge: 1,
                data: {
                    type: 'synapse_guilt',
                    partnerId,
                    failingUserName,
                },
            },
            trigger: null, // Immediate
        });

        // Play urgent audio
        await this.playNotificationAudio('2.mp3', 1.0, 1.0);

        // Log to Supabase
        await supabase.from('guilt_notifications').insert({
            partnerId,
            failingUserName,
            locale,
            sentAt: Date.now(),
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // IMMEDIATE NOTIFICATIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Send immediate notification
     */
    async sendImmediateNotification(
        title: string,
        body: string,
        data?: Record<string, unknown>,
        playAudio: boolean = false,
        audioFile: AudioFile = '1.mp3'
    ): Promise<void> {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: !playAudio, // Use system sound if not playing custom
                badge: 1,
                data,
            },
            trigger: null,
        });

        if (playAudio) {
            await this.playNotificationAudio(audioFile, 1.0, 1.0);
        }
    }

    /**
     * Send localized notification
     */
    async sendLocalizedNotification(
        phase: NotificationPhase,
        locale: SupportedLocale,
        userId: string,
        playAudio: boolean = true
    ): Promise<void> {
        const message = NOTIFICATION_MESSAGES[phase][locale];
        const config = PHASE_CONFIGS[phase];

        await this.sendImmediateNotification(
            message.title,
            message.body,
            { userId, phase },
            playAudio,
            config.audioFile
        );

        if (playAudio) {
            await this.playNotificationAudio(config.audioFile, config.volume, config.pitch);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UTILITY
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get all scheduled notification IDs
     */
    getScheduledIds(): string[] {
        return Array.from(this.scheduledIds);
    }

    /**
     * Clear all notifications
     */
    async clearAllNotifications(): Promise<void> {
        await Notifications.cancelAllScheduledNotificationsAsync();
        await Notifications.dismissAllNotificationsAsync();
        this.scheduledIds.clear();
    }

    /**
     * Get badge count
     */
    async getBadgeCount(): Promise<number> {
        return await Notifications.getBadgeCountAsync();
    }

    /**
     * Set badge count
     */
    async setBadgeCount(count: number): Promise<void> {
        await Notifications.setBadgeCountAsync(count);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export const notificationScheduler = NotificationScheduler.getInstance();
export { NOTIFICATION_MESSAGES, MONETIZATION_MESSAGES, PHASE_CONFIGS };
export default NotificationScheduler;
