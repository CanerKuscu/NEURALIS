/**
 * LivesService - Hearts/Lives Management
 * 5-heart system, regeneration over time, unlimited for premium users.
 * Uses the 'profiles' table for lives data.
 */

import { supabase } from '../config/supabase';
import { LIVES_CONFIG } from '../constants/theme';

export interface LivesData {
    current: number;
    max: number;
    lastLostAt: string | null;
    nextRegenAt: string | null;
    isPremium: boolean;
}

class LivesService {
    private readonly MAX_LIVES = LIVES_CONFIG.maxLives;
    private readonly REGEN_MINUTES = LIVES_CONFIG.regenerationMinutes;

    /**
     * Fetch the user's current lives/hearts data
     */
    async getLives(userId: string): Promise<LivesData> {
        try {
            // Fetch profile and lives data
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('is_premium, lives, last_lost_at')
                .eq('id', userId)
                .single();

            if (error) {
                // Return defaults if error (including no rows)
                console.warn('Lives data fetch error, defaulting to max:', error.message);
                return {
                    current: this.MAX_LIVES,
                    max: this.MAX_LIVES,
                    lastLostAt: null,
                    nextRegenAt: null,
                    isPremium: false,
                };
            }

            if (profile?.is_premium) {
                return {
                    current: Infinity,
                    max: Infinity,
                    lastLostAt: null,
                    nextRegenAt: null,
                    isPremium: true,
                };
            }

            // Calculate regeneration
            const livesData = {
                current_lives: profile.lives ?? this.MAX_LIVES,
                last_lost_at: profile.last_lost_at,
                updated_at: new Date().toISOString() // Just for type compatibility in calc
            };

            const regeneratedLives = this.calculateRegeneration(livesData);

            return {
                current: regeneratedLives.current,
                max: this.MAX_LIVES,
                lastLostAt: livesData.last_lost_at,
                nextRegenAt: regeneratedLives.nextRegenAt,
                isPremium: false,
            };
        } catch (error) {
            console.error('Failed to get lives:', error);
            return {
                current: this.MAX_LIVES,
                max: this.MAX_LIVES,
                lastLostAt: null,
                nextRegenAt: null,
                isPremium: false,
            };
        }
    }

    /**
     * Lose a life (wrong answer)
     */
    async loseLife(userId: string): Promise<LivesData> {
        try {
            const lives = await this.getLives(userId);

            if (lives.isPremium) {
                return lives; // Premium users don't lose lives
            }

            if (lives.current <= 0) {
                return lives; // Already out of lives
            }

            const newCurrent = lives.current - 1;
            const now = new Date().toISOString();

            const { error } = await supabase
                .from('profiles')
                .update({
                    lives: newCurrent,
                    last_lost_at: lives.current === this.MAX_LIVES ? now : lives.lastLostAt
                })
                .eq('id', userId);

            if (error) throw error;

            return {
                ...lives,
                current: newCurrent,
                lastLostAt: lives.current === this.MAX_LIVES ? now : lives.lastLostAt,
                nextRegenAt: this.calculateNextRegen(now),
            };
        } catch (error) {
            console.error('Failed to lose life:', error);
            const fallback = await this.getLives(userId);
            return {
                ...fallback,
                current: Math.max(0, fallback.current - 1),
            };
        }
    }

    /**
     * Add lives (ad reward, purchase, etc.)
     */
    async addLives(userId: string, count: number): Promise<LivesData> {
        try {
            const lives = await this.getLives(userId);

            if (lives.isPremium) {
                return lives;
            }

            const newCurrent = Math.min(lives.current + count, this.MAX_LIVES);

            await supabase
                .from('profiles')
                .update({
                    lives: newCurrent,
                })
                .eq('id', userId);

            return {
                ...lives,
                current: newCurrent,
            };
        } catch (error) {
            console.error('Failed to add lives:', error);
            throw error;
        }
    }

    /**
     * Refill all lives to maximum
     */
    async refillLives(userId: string): Promise<LivesData> {
        return this.addLives(userId, this.MAX_LIVES);
    }

    /**
     * Watch an ad to earn a life (free users only)
     */
    async watchAdForLife(userId: string): Promise<{ success: boolean; lives: LivesData; message: string }> {
        try {
            const lives = await this.getLives(userId);

            if (lives.isPremium) {
                return {
                    success: false,
                    lives,
                    message: 'Premium users have unlimited lives!',
                };
            }

            if (lives.current >= this.MAX_LIVES) {
                return {
                    success: false,
                    lives,
                    message: 'Your lives are already full!',
                };
            }

            const newLives = await this.addLives(userId, 1);

            return {
                success: true,
                lives: newLives,
                message: 'You earned 1 life! \uD83C\uDF89',
            };
        } catch (error) {
            console.error('Failed to add life from ad:', error);
            return {
                success: false,
                lives: await this.getLives(userId),
                message: 'Something went wrong, try again.',
            };
        }
    }

    /**
     * Calculate lives regeneration based on elapsed time
     */
    private calculateRegeneration(livesData: {
        current_lives: number;
        last_lost_at: string | null;
        updated_at: string;
    }): { current: number; nextRegenAt: string | null } {
        if (livesData.current_lives >= this.MAX_LIVES) {
            return { current: this.MAX_LIVES, nextRegenAt: null };
        }

        if (!livesData.last_lost_at) {
            return { current: livesData.current_lives, nextRegenAt: null };
        }

        const lastLost = new Date(livesData.last_lost_at);
        const now = new Date();
        const elapsedMs = now.getTime() - lastLost.getTime();
        const elapsedMinutes = elapsedMs / (1000 * 60);

        // How many lives have regenerated?
        const livesRegained = Math.floor(elapsedMinutes / this.REGEN_MINUTES);
        const newCurrent = Math.min(
            livesData.current_lives + livesRegained,
            this.MAX_LIVES
        );

        // Calculate next regeneration time
        let nextRegenAt: string | null = null;
        if (newCurrent < this.MAX_LIVES) {
            const minutesUntilNext = this.REGEN_MINUTES - (elapsedMinutes % this.REGEN_MINUTES);
            const nextRegen = new Date(now.getTime() + minutesUntilNext * 60 * 1000);
            nextRegenAt = nextRegen.toISOString();
        }

        return { current: newCurrent, nextRegenAt };
    }

    /**
     * Calculate the next regeneration timestamp
     */
    private calculateNextRegen(lastLostAt: string): string {
        const lastLost = new Date(lastLostAt);
        const nextRegen = new Date(lastLost.getTime() + this.REGEN_MINUTES * 60 * 1000);
        return nextRegen.toISOString();
    }

    /**
     * Initialize default lives for a new user (fallback — should be handled by profile creation)
     */
    private async initializeLives(userId: string): Promise<void> {
        // Profile should already exist. Just update defaults.
        await supabase.from('profiles').update({
            lives: this.MAX_LIVES
        }).eq('id', userId);
    }

    /**
     * Get minutes remaining until next life regeneration
     */
    getMinutesUntilRegen(nextRegenAt: string | null): number | null {
        if (!nextRegenAt) return null;

        const now = new Date();
        const regen = new Date(nextRegenAt);
        const diff = regen.getTime() - now.getTime();

        if (diff <= 0) return 0;
        return Math.ceil(diff / (1000 * 60));
    }
}

export const livesService = new LivesService();
export default livesService;
