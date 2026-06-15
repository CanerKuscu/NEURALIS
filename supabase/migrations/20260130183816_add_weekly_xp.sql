-- Add weekly_xp column for League Leaderboards
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weekly_xp INTEGER DEFAULT 0;
