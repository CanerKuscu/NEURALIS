/**
 * Sound System - Preloaded audio for UI feedback
 * Uses expo-av for fast, low-latency sound playback
 */

import { Audio } from 'expo-av';

// ═══════════════════════════════════════════════════════════════════════════
// SOUND ASSETS
// ═══════════════════════════════════════════════════════════════════════════

const SOUND_ASSETS = {
    correct: require('../../assets/audio/correct.mp3'),
    wrong: require('../../assets/audio/wrong.mp3'),
    lessonComplete: require('../../assets/audio/lesson-complete.mp3'),
    levelUp: require('../../assets/audio/level-up.mp3'),
    streak: require('../../assets/audio/streak.mp3'),
    tap: require('../../assets/audio/tap.mp3'),
    countdown: require('../../assets/audio/countdown.mp3'),
    achievement: require('../../assets/audio/achievement.mp3'),
    coin: require('../../assets/audio/coin.mp3'),
    whoosh: require('../../assets/audio/whoosh.mp3'),
    pop: require('../../assets/audio/pop.mp3'),
    notification: require('../../assets/audio/notification.mp3'),
    dailyReminder: require('../../assets/audio/daily-reminder.mp3'),
    placementStart: require('../../assets/audio/placement-start.mp3'),
    combo: require('../../assets/audio/combo.mp3'),
} as const;

export type SoundName = keyof typeof SOUND_ASSETS;

// ═══════════════════════════════════════════════════════════════════════════
// SOUND MANAGER
// ═══════════════════════════════════════════════════════════════════════════

let loadedSounds: Partial<Record<SoundName, Audio.Sound>> = {};
let isInitialized = false;
let isMuted = false;

/**
 * Initialize audio mode for the app
 * Call once at app startup
 */
export async function initAudio(): Promise<void> {
    try {
        await Audio.setAudioModeAsync({
            playsInSilentModeIOS: false,
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
        });
    } catch (e) {
        console.warn('Audio init error:', e);
    }
}

/**
 * Preload frequently used sounds for instant playback
 * Call after app initialization to avoid startup delay
 */
export async function preloadSounds(): Promise<void> {
    if (isInitialized) return;

    // Preload only critical sounds to save memory
    const criticalSounds: SoundName[] = ['correct', 'wrong', 'tap', 'coin', 'combo', 'pop'];

    const promises = criticalSounds.map(async (name) => {
        try {
            const { sound } = await Audio.Sound.createAsync(SOUND_ASSETS[name], {
                shouldPlay: false,
                volume: 0.7,
            });
            loadedSounds[name] = sound;
        } catch (e) {
            console.warn(`Failed to preload sound: ${name}`, e);
        }
    });

    await Promise.all(promises);
    isInitialized = true;
}

/**
 * Play a sound effect
 * Loads on-demand if not preloaded
 */
export async function playSound(name: SoundName, volume?: number): Promise<void> {
    if (isMuted) return;

    try {
        // Use preloaded sound if available
        if (loadedSounds[name]) {
            const sound = loadedSounds[name]!;
            await sound.setPositionAsync(0);
            if (volume !== undefined) {
                await sound.setVolumeAsync(volume);
            }
            await sound.replayAsync();
            return;
        }

        // Load on-demand for non-preloaded sounds
        const { sound } = await Audio.Sound.createAsync(SOUND_ASSETS[name], {
            shouldPlay: true,
            volume: volume ?? 0.7,
        });

        // Cache it for next time
        loadedSounds[name] = sound;
    } catch (e) {
        // Silently fail — sound is non-critical
        console.warn(`Sound play error (${name}):`, e);
    }
}

/**
 * Mute / unmute all sounds
 */
export function setMuted(muted: boolean): void {
    isMuted = muted;
}

export function getMuted(): boolean {
    return isMuted;
}

/**
 * Cleanup all loaded sounds (call on app exit)
 */
export async function unloadAllSounds(): Promise<void> {
    const promises = Object.values(loadedSounds).map(async (sound) => {
        try {
            await sound?.unloadAsync();
        } catch { }
    });
    await Promise.all(promises);
    loadedSounds = {};
    isInitialized = false;
}
