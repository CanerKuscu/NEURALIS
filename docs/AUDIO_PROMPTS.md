# Audio File Generation Prompts for Neuralis

Use these prompts with AI sound generation tools (ElevenLabs Sound Effects, Adobe Podcast, Suno, etc.) to create the audio assets.

## Directory Structure
```
assets/audio/
├── correct.mp3          # Correct answer sound
├── wrong.mp3            # Wrong answer sound  
├── lesson-complete.mp3  # Lesson completion jingle
├── level-up.mp3         # Level up fanfare
├── streak.mp3           # Streak milestone sound
├── tap.mp3              # Button tap feedback
├── countdown.mp3        # Timer countdown tick
├── achievement.mp3      # Achievement unlocked
├── coin.mp3             # Gem/coin earned
├── whoosh.mp3           # Screen transition
├── pop.mp3              # UI pop/bubble
├── notification.mp3     # Push notification sound
├── daily-reminder.mp3   # Daily reminder chime
├── placement-start.mp3  # Placement test intro
├── combo.mp3            # Combo/streak fire sound
```

---

## Prompts

### 1. correct.mp3 — Correct Answer
> **Prompt:** "Short, bright, uplifting digital chime. Like a Duolingo correct answer ding. Happy, rewarding, 0.5 seconds. Clean bell-like tone ascending two notes. Game UI sound effect."

### 2. wrong.mp3 — Wrong Answer  
> **Prompt:** "Short, soft error buzz sound. Gentle 'wrong answer' tone, not harsh. Two descending notes, slightly muffled. 0.5 seconds. Mobile game error sound, not jarring or scary."

### 3. lesson-complete.mp3 — Lesson Completion Jingle
> **Prompt:** "Cheerful, triumphant short jingle. 3-4 ascending notes with a final satisfying chord. Like completing a level in a mobile learning game. Bright xylophone and soft synth. 2 seconds. Celebratory and warm."

### 4. level-up.mp3 — Level Up Fanfare
> **Prompt:** "Epic level-up fanfare. Starts with a dramatic ascending synth sweep, then bursts into a brief triumphant melody. Magical sparkle sounds mixed with a heroic brass-like synth. 3 seconds. Feels like an RPG level-up moment."

### 5. streak.mp3 — Streak Milestone 🔥
> **Prompt:** "Fire whoosh followed by ascending staccato notes. Quick, energetic, builds excitement. Like a streak counter going up in a mobile game. Include a subtle sizzle/flame crackle. 1.5 seconds."

### 6. tap.mp3 — Button Tap
> **Prompt:** "Very short, subtle tap/click sound. Soft wooden tap or soft bubble pop. Clean, minimal, satisfying. 0.1 seconds. UI button press feedback sound."

### 7. countdown.mp3 — Timer Countdown
> **Prompt:** "Single metronome-like tick. Short, crisp, digital clock tick sound. Slightly tense but not aggressive. 0.2 seconds. For quiz timer countdown."

### 8. achievement.mp3 — Achievement Unlocked
> **Prompt:** "Achievement unlocked sound effect. Starts with a magical shimmer, then a satisfying 'unlock' click, followed by a brief celebratory chord. Sparkles and soft bell chimes. 2 seconds. Mobile game reward sound."

### 9. coin.mp3 — Gem/Coin Earned
> **Prompt:** "Classic coin collection sound. Bright, metallic 'cha-ching' with a sparkle. Short and satisfying, like picking up coins in Mario. 0.5 seconds. Crystal-clear and rewarding."

### 10. whoosh.mp3 — Screen Transition
> **Prompt:** "Soft whoosh/swipe sound effect. Quick air movement, smooth and clean. Like a card being swiped or a smooth page transition. 0.3 seconds. Subtle UI animation sound."

### 11. pop.mp3 — UI Pop/Bubble
> **Prompt:** "Soft bubble pop sound. Playful, round, satisfying 'pop'. Like a soap bubble popping or a soft notification bubble appearing. 0.2 seconds. Cute and non-intrusive."

### 12. notification.mp3 — Push Notification
> **Prompt:** "Friendly notification chime. Two-tone ascending notes, warm and inviting. Not alarming, but attention-getting. Like a friendly app notification. Soft bell or marimba. 1 second."

### 13. daily-reminder.mp3 — Daily Reminder
> **Prompt:** "Gentle, warm reminder chime. Sounds like a friendly fox calling you back. Playful two-note melody with a soft warm synth pad. Encouraging and cozy. 1.5 seconds. Not urgent."

### 14. placement-start.mp3 — Placement Test Start
> **Prompt:** "Dramatic test-start sound. A brief 'ready, go' rhythm: soft drumroll building to a single confident chime. Creates anticipation then release. 2 seconds. Like the start of a game show."

### 15. combo.mp3 — Combo/Streak Fire
> **Prompt:** "Quick combo hit sound. Punchy, energetic impact with a slight echo. Like hitting a combo in a fighting game. Bright, electric, satisfying. 0.4 seconds. Gets the player pumped up."

---

## Technical Specs
- **Format:** MP3 (128kbps or higher) or WAV
- **Sample Rate:** 44.1kHz
- **Channels:** Mono (saves file size for mobile)
- **Target File Size:** Under 50KB each (for fast mobile loading)
- **Normalize:** All files should be normalized to -3dB peak

## Recommended Tools
1. **ElevenLabs Sound Effects** — Best for UI sounds (free tier available)
2. **Suno** — For musical jingles (lesson-complete, level-up)
3. **Adobe Podcast** — For voice-based sounds
4. **Freesound.org** — Free CC0 alternatives for basic sounds
5. **JSFXR/SFXR** — Retro game sound generator (good for correct/wrong/tap)

## Implementation Note
After generating the audio files, place them in `assets/audio/` and import them in the app:

```typescript
// src/utils/sounds.ts
import { Audio } from 'expo-av';

const sounds = {
  correct: require('../../assets/audio/correct.mp3'),
  wrong: require('../../assets/audio/wrong.mp3'),
  lessonComplete: require('../../assets/audio/lesson-complete.mp3'),
  levelUp: require('../../assets/audio/level-up.mp3'),
  streak: require('../../assets/audio/streak.mp3'),
  tap: require('../../assets/audio/tap.mp3'),
  coin: require('../../assets/audio/coin.mp3'),
  achievement: require('../../assets/audio/achievement.mp3'),
  combo: require('../../assets/audio/combo.mp3'),
};

let loadedSounds: Record<string, Audio.Sound> = {};

export async function playSound(name: keyof typeof sounds) {
  try {
    if (!loadedSounds[name]) {
      const { sound } = await Audio.Sound.createAsync(sounds[name]);
      loadedSounds[name] = sound;
    }
    await loadedSounds[name].replayAsync();
  } catch (e) {
    console.warn('Sound play error:', e);
  }
}

export async function preloadSounds() {
  for (const [name, source] of Object.entries(sounds)) {
    try {
      const { sound } = await Audio.Sound.createAsync(source);
      loadedSounds[name] = sound;
    } catch {}
  }
}
```
