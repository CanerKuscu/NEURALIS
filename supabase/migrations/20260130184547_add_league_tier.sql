-- Add league_tier column for Duolingo-style Leagues
-- Tiers: Bronze, Silver, Gold, Sapphire, Ruby, Emerald, Amethyst, Pearl, Obsidian, Diamond
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS league_tier TEXT DEFAULT 'Bronze';
