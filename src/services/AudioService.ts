/**
 * NEURALIS - Audio Service
 * Dynamic Audio System with Neural Decay Effects
 * Optimized for performance - lazy loading
 */

import { Audio } from 'expo-av';
import { StreakState, AudioEffectType, AudioConfig } from '../types';

// ═══════════════════════════════════════════════════════════════════════════
// AUDIO CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

// Audio file paths - will be loaded lazily when files exist
const AUDIO_FILE_PATHS: Record<string, string> = {
    notification_normal: 'notification_normal.mp3',
    notification_warning: 'notification_warning.mp3',
    notification_decay: 'notification_decay.mp3',
    notification_critical: 'notification_critical.mp3',
    notification_dead: 'notification_dead.mp3',
    ambient_focus: 'ambient_focus.mp3',
    sfx_success: 'sfx_success.mp3',
    sfx_failure: 'sfx_failure.mp3',
    sfx_mercy: 'sfx_mercy.mp3',
    sfx_streak_break: 'sfx_streak_break.mp3',
    sfx_level_up: 'sfx_level_up.mp3',
    sfx_synapse_break: 'sfx_synapse_break.mp3',
    wake_up_aggressive: 'wake_up_aggressive.mp3',
};

type AudioFileKey = keyof typeof AUDIO_FILE_PATHS;

// ═══════════════════════════════════════════════════════════════════════════
// AUDIO EFFECT PRESETS
// ═══════════════════════════════════════════════════════════════════════════

const EFFECT_PRESETS: Record<AudioEffectType, AudioConfig> = {
    normal: {
        effectType: 'normal',
        volume: 1.0,
    },
    lowpass: {
        effectType: 'lowpass',
        volume: 0.8,
        lowpassFrequency: 1000,
    },
    bitcrush: {
        effectType: 'bitcrush',
        volume: 0.7,
        bitcrushDepth: 4,
    },
    fade: {
        effectType: 'fade',
        volume: 0.5,
        fadeProgress: 0.5,
    },
    distorted: {
        effectType: 'distorted',
        volume: 0.6,
        lowpassFrequency: 500,
        bitcrushDepth: 2,
    },
};

// Map streak states to audio effects
const STREAK_STATE_EFFECTS: Record<StreakState, AudioEffectType> = {
    healthy: 'normal',
    warning: 'normal',
    neural_decay: 'lowpass',
    critical: 'bitcrush',
    dead: 'distorted',
};

// ═══════════════════════════════════════════════════════════════════════════
// AUDIO SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════

class AudioService {
    private sounds: Map<string, Audio.Sound> = new Map();
    private currentEffect: AudioEffectType = 'normal';
    private isMuted: boolean = false;
    private masterVolume: number = 1.0;
    private fadeInterval: ReturnType<typeof setInterval> | null = null;
    private isInitialized: boolean = false;

    /**
     * Initialize the audio system
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                staysActiveInBackground: true,
                playsInSilentModeIOS: true,
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: false,
            });

            this.isInitialized = true;
            console.log('[AudioService] Initialized successfully');
        } catch (error) {
            console.error('[AudioService] Initialization failed:', error);
        }
    }

    /**
     * Play notification sound based on streak state
     */
    async playNotification(streakState: StreakState): Promise<void> {
        if (this.isMuted) return;

        const soundKey = `notification_${streakState === 'neural_decay' ? 'decay' : streakState}` as AudioFileKey;
        await this.playSound(soundKey, streakState);
    }

    /**
     * Play a sound effect
     */
    async playSFX(sfxName: AudioFileKey): Promise<void> {
        if (this.isMuted) return;
        await this.playSound(sfxName, 'healthy');
    }

    /**
     * Play wake-up aggressive notification (Tate-style)
     */
    async playWakeUpAggressive(): Promise<void> {
        if (this.isMuted) return;

        // Audio files not bundled yet - skip silently
        console.log('[AudioService] Wake up sound would play here');
    }

    /**
     * Start fading audio effect based on time remaining
     * Used during neural decay phase (last 2 hours)
     */
    startDecayFade(timeRemainingMs: number): void {
        this.stopDecayFade();

        const DECAY_DURATION = 2 * 60 * 60 * 1000; // 2 hours
        const CRITICAL_DURATION = 30 * 60 * 1000; // 30 minutes

        // Compute the absolute end timestamp so remaining = endTs - now
        const endTimestamp = Date.now() + Math.max(0, timeRemainingMs);

        this.fadeInterval = setInterval(() => {
            const remaining = Math.max(0, endTimestamp - Date.now());

            if (remaining <= CRITICAL_DURATION) {
                // Last 30 minutes - heavy distortion
                this.setEffect('distorted');
                this.setVolume(0.3 + (remaining / CRITICAL_DURATION) * 0.4);
            } else if (remaining <= DECAY_DURATION) {
                // 2 hours to 30 minutes - progressive lowpass
                const progress = (DECAY_DURATION - remaining) / (DECAY_DURATION - CRITICAL_DURATION);

                if (progress > 0.7) {
                    this.setEffect('bitcrush');
                } else if (progress > 0.3) {
                    this.setEffect('lowpass');
                } else {
                    this.setEffect('fade');
                }

                this.setVolume(0.7 + (1 - progress) * 0.3);
            }

            // If finished, stop the fade interval
            if (remaining <= 0) {
                this.stopDecayFade();
            }
        }, 5000); // Update every 5 seconds
    }

    /**
     * Stop decay fade effect
     */
    stopDecayFade(): void {
        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
        }
        this.setEffect('normal');
        this.setVolume(1.0);
    }

    /**
     * Set current audio effect
     */
    setEffect(effect: AudioEffectType): void {
        this.currentEffect = effect;
        console.log(`[AudioService] Effect set to: ${effect}`);
    }

    /**
     * Set master volume
     */
    setVolume(volume: number): void {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }

    /**
     * Mute/unmute audio
     */
    setMuted(muted: boolean): void {
        this.isMuted = muted;
    }

    /**
     * Get current audio configuration
     */
    getCurrentConfig(): AudioConfig {
        return {
            ...EFFECT_PRESETS[this.currentEffect],
            volume: this.masterVolume,
        };
    }

    /**
     * Internal method to play a sound with effects
     * Currently a no-op until audio files are added to assets/audio/
     */
    private async playSound(
        soundKey: AudioFileKey,
        streakState: StreakState
    ): Promise<void> {
        // Audio files not bundled yet - skip silently
        // When audio files are added, implement actual playback here
        console.log(`[AudioService] Would play: ${soundKey} with state: ${streakState}`);
    }

    /**
     * Get playback rate based on streak state (for pitch effect simulation)
     */
    private getPlaybackRate(streakState: StreakState): number {
        switch (streakState) {
            case 'healthy':
                return 1.0;
            case 'warning':
                return 0.95;
            case 'neural_decay':
                return 0.85;
            case 'critical':
                return 0.75;
            case 'dead':
                return 0.6;
            default:
                return 1.0;
        }
    }

    /**
     * Unload a specific sound
     */
    private async unloadSound(key: string): Promise<void> {
        const sound = this.sounds.get(key);
        if (sound) {
            try {
                await sound.unloadAsync();
            } catch (error) {
                // Ignore unload errors
            }
            this.sounds.delete(key);
        }
    }

    /**
     * Cleanup all sounds
     */
    async cleanup(): Promise<void> {
        this.stopDecayFade();

        for (const [key, sound] of this.sounds) {
            try {
                await sound.unloadAsync();
            } catch (error) {
                // Ignore cleanup errors
            }
        }

        this.sounds.clear();
        this.isInitialized = false;
    }
}

export const audioService = new AudioService();
export default audioService;

// ═══════════════════════════════════════════════════════════════════════════
// AUDIO HOOKS
// ═══════════════════════════════════════════════════════════════════════════

export const useAudioEffect = () => {
    return {
        playNotification: audioService.playNotification.bind(audioService),
        playSFX: audioService.playSFX.bind(audioService),
        playWakeUp: audioService.playWakeUpAggressive.bind(audioService),
        setMuted: audioService.setMuted.bind(audioService),
        setVolume: audioService.setVolume.bind(audioService),
        getCurrentConfig: audioService.getCurrentConfig.bind(audioService),
    };
};
