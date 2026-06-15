# NEURALIS Audio Assets

This directory should contain the following audio files for the full Neuralis experience:

## Required Audio Files

### Notifications
- `notification.wav` - Default notification sound (short, crisp)
- `warning.wav` - Warning state notification (2-3 seconds, building tension)
- `critical.wav` - Critical state alarm (urgent, attention-grabbing)
- `decay.wav` - Neural decay ambient (loopable, degrading sound)
- `mercy.wav` - Mercy challenge available sound (hopeful but urgent)
- `success.wav` - Task completion celebration
- `failure.wav` - Task failure/streak death (somber, impactful)

### Wake Up Sounds
- `wake_up_aggressive.wav` - Aggressive wake-up call (loud, jarring)
- `wake_up_alarm.wav` - Secondary alarm sound

### UI Sounds
- `button_tap.wav` - Button interaction feedback
- `energy_low.wav` - Energy depleted warning
- `level_up.wav` - League promotion sound
- `synapse_link.wav` - Synapse connection established

## Audio Specifications
- Format: WAV or MP3 (WAV preferred for short sounds)
- Sample Rate: 44.1kHz
- Bit Depth: 16-bit
- Channels: Stereo (mono acceptable for notifications)

## Theme Guidelines
Audio should match the Neuralis aesthetic:
- Dark, mysterious undertones
- Electronic/synthetic elements
- Tension-building for warnings
- Crisp, satisfying feedback for success

## Placeholder Usage
Until audio files are added, the AudioService will gracefully
handle missing files and continue operation without sound.
