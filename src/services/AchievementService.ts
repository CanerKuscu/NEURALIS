import { supabase } from '../config/supabase';

export interface Achievement {
  id: string;
  progress: number;
  unlocked_at: string | null;
}

export const AchievementService = {
  /**
   * Fetch user's achievements
   */
  getUserAchievements: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  },

  /**
   * Update progress for a specific achievement
   */
  updateProgress: async (
    userId: string,
    achievementId: string,
    currentProgress: number,
    target: number,
  ) => {
    const isUnlocked = currentProgress >= target;

    const updateData: any = {
      progress: currentProgress,
      updated_at: new Date().toISOString(),
    };

    if (isUnlocked) {
      updateData.unlocked_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('user_achievements')
      .upsert({
        user_id: userId,
        achievement_id: achievementId,
        ...updateData,
      })
      .select()
      .single();

    if (error) console.error('Error updating achievement:', error);
    return data;
  },

  /**
   * Increment progress helper
   */
  incrementProgress: async (
    userId: string,
    achievementId: string,
    amount: number = 1,
    target: number,
  ) => {
    // Fetch current
    const { data } = await supabase
      .from('user_achievements')
      .select('progress')
      .eq('user_id', userId)
      .eq('achievement_id', achievementId)
      .single();

    const newProgress = (data?.progress || 0) + amount;
    return AchievementService.updateProgress(userId, achievementId, newProgress, target);
  },
};
