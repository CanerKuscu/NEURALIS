-- =====================================================
-- NEURALIS DATABASE SCHEMA
-- Consolidated Schema: Profiles, Social, Gamification, Learning, Economy
-- =====================================================

-- 1. EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;
-- Note: 'uuid-ossp' is usually enabled by default in Supabase.

-- 2. PROFILES (CORE)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  email text,
  first_name text,
  last_name text,
  display_name text,
  birth_date timestamptz,
  gender text,
  merit_points integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  league_points integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  total_xp integer DEFAULT 0,
  neural_score integer DEFAULT 0,
  is_premium boolean DEFAULT false,
  subscription text DEFAULT 'free',
  account_status text DEFAULT 'active',
  email_verified boolean DEFAULT false,
  verification_status text DEFAULT 'pending',
  created_at bigint DEFAULT (extract(epoch from now())::bigint * 1000),
  updated_at bigint DEFAULT (extract(epoch from now())::bigint * 1000),
  last_login_at bigint,
  last_activity_at bigint,
  avatar_url text,
  premium_expires_at bigint,
  linked_user_id text,
  linked_user_name text,
  synapse_streak integer DEFAULT 0,
  level_test_completed boolean DEFAULT false,
  
  -- Economy & Gamification Defaults
  gems integer DEFAULT 200,
  league_tier text DEFAULT 'Bronze',
  
  -- Avatar Customization
  avatar_emoji text DEFAULT '🦊',
  avatar_bg text DEFAULT '#FFF3E0',
  
  -- Activity Tracking
  last_active_at timestamptz DEFAULT now(),
  weekly_xp integer DEFAULT 0,
  today_xp integer DEFAULT 0,
  lessons_today integer DEFAULT 0,
  perfect_lessons_today integer DEFAULT 0,
  fast_lessons_today integer DEFAULT 0,
  quests_completed_this_month integer DEFAULT 0,
  lessons_completed integer DEFAULT 0
);

-- RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles: allow insert for authenticated users" ON public.profiles;
CREATE POLICY "Profiles: allow insert for authenticated users" ON public.profiles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = id);

DROP POLICY IF EXISTS "Profiles: allow select for authenticated users" ON public.profiles;
CREATE POLICY "Profiles: allow select for authenticated users" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Profiles: allow update for authenticated users" ON public.profiles;
CREATE POLICY "Profiles: allow update for authenticated users" ON public.profiles
  FOR UPDATE USING (auth.role() = 'authenticated' AND auth.uid() = id)
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = id);

-- 3. SOCIAL FEATURES (Alliances & Friends)
-- =====================================================

-- Friends
CREATE TABLE IF NOT EXISTS public.friends (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, friend_id)
);

ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own friends" ON public.friends
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can add friends" ON public.friends
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Alliances (Co-op Streaks)
CREATE TABLE IF NOT EXISTS public.alliances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',  -- 'pending', 'active', 'broken', 'declined'
  initiated_by uuid NOT NULL,
  alliance_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  user1_completed_today boolean DEFAULT false,
  user2_completed_today boolean DEFAULT false,
  last_streak_date text,
  created_at bigint DEFAULT (extract(epoch from now())::bigint * 1000),
  accepted_at bigint,
  broken_at bigint,
  last_sync_at bigint DEFAULT (extract(epoch from now())::bigint * 1000),
  CONSTRAINT unique_alliance UNIQUE (user1_id, user2_id)
);

CREATE TABLE IF NOT EXISTS public.alliance_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alliance_id uuid REFERENCES public.alliances(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  message text,
  read boolean DEFAULT false,
  created_at bigint DEFAULT (extract(epoch from now())::bigint * 1000)
);

ALTER TABLE public.alliances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alliance_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alliances: own access" ON public.alliances
  FOR ALL USING (auth.uid() = user1_id OR auth.uid() = user2_id)
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Alliance notifications: own access" ON public.alliance_notifications
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. GAMIFICATION (Avatar, Achievements, Games)
-- =====================================================

-- Avatar Items
CREATE TABLE IF NOT EXISTS public.avatar_items (
  id text PRIMARY KEY,
  name text NOT NULL,
  name_tr text NOT NULL,
  category text NOT NULL,
  rarity text NOT NULL DEFAULT 'common',
  unlock_type text NOT NULL DEFAULT 'xp',
  unlock_value integer DEFAULT 0,
  unlock_league text,
  image_url text,
  preview_url text,
  is_premium boolean DEFAULT false,
  is_default boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at bigint DEFAULT (extract(epoch from now())::bigint * 1000)
);

CREATE TABLE IF NOT EXISTS public.user_avatar_items (
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id text REFERENCES public.avatar_items(id) ON DELETE CASCADE,
  unlocked_at bigint DEFAULT (extract(epoch from now())::bigint * 1000),
  equipped boolean DEFAULT false,
  PRIMARY KEY (user_id, item_id)
);

CREATE TABLE IF NOT EXISTS public.user_avatar_state (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  equipped_glasses text REFERENCES public.avatar_items(id),
  equipped_outfit text REFERENCES public.avatar_items(id),
  equipped_accessory text REFERENCES public.avatar_items(id),
  equipped_costume text REFERENCES public.avatar_items(id),
  equipped_hat text REFERENCES public.avatar_items(id),
  fox_mood text DEFAULT 'neutral',
  fox_level integer DEFAULT 1,
  updated_at bigint DEFAULT (extract(epoch from now())::bigint * 1000)
);

ALTER TABLE public.avatar_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_avatar_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_avatar_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Avatar items: public read" ON public.avatar_items FOR SELECT USING (true);
CREATE POLICY "User avatar items: own access" ON public.user_avatar_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "User avatar state: own access" ON public.user_avatar_state FOR ALL USING (auth.uid() = user_id);

-- Achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
  user_id uuid REFERENCES auth.users NOT NULL,
  achievement_id text NOT NULL,
  progress int DEFAULT 0,
  unlocked_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, achievement_id)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own achievements" ON public.user_achievements FOR ALL USING (auth.uid() = user_id);

-- Real-time Games
CREATE TABLE IF NOT EXISTS public.games (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  player1_id uuid REFERENCES auth.users NOT NULL,
  player2_id uuid REFERENCES auth.users,
  status text DEFAULT 'waiting' CHECK (status in ('waiting', 'active', 'finished')),
  winner_id uuid REFERENCES auth.users,
  current_turn uuid REFERENCES auth.users,
  board_state jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active games" ON public.games FOR SELECT USING (true);
CREATE POLICY "Players can update their games" ON public.games FOR UPDATE USING (auth.uid() = player1_id OR auth.uid() = player2_id);
CREATE POLICY "Players can create games" ON public.games FOR INSERT WITH CHECK (auth.uid() = player1_id);

-- Quests
CREATE TABLE IF NOT EXISTS public.quest_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    quest_id INTEGER NOT NULL,
    current INTEGER DEFAULT 0,
    target INTEGER NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at DATE DEFAULT CURRENT_DATE,
    UNIQUE(user_id, quest_id, created_at)
);
ALTER TABLE public.quest_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own quest progress" ON public.quest_progress FOR ALL USING (auth.uid() = user_id);

-- 5. LEARNING (Lessons & Topics)
-- =====================================================

-- Generated Lessons
CREATE TABLE IF NOT EXISTS public.generated_lessons (
    id text PRIMARY KEY,
    user_id uuid NULL REFERENCES public.profiles(id),
    title text NOT NULL,
    description text NULL,
    content jsonb NULL,
    recommended_xp integer NULL,
    premium_only boolean DEFAULT false,
    created_at bigint NOT NULL,
    updated_at bigint NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_generated_lessons_user_id ON public.generated_lessons(user_id);

-- User Category Levels
CREATE TABLE IF NOT EXISTS public.user_category_levels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    placement_score INTEGER DEFAULT 0,
    lessons_completed INTEGER DEFAULT 0,
    total_xp_in_category INTEGER DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, category)
);
ALTER TABLE public.user_category_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own category levels" ON public.user_category_levels FOR ALL USING (auth.uid() = user_id);

-- Custom Lesson Streaks & Topics
CREATE TABLE IF NOT EXISTS public.user_lesson_topics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    topic text NOT NULL,
    normalized_topic text NOT NULL,
    category text DEFAULT 'custom',
    streak_count integer DEFAULT 0,
    best_streak integer DEFAULT 0,
    total_lessons_completed integer DEFAULT 0,
    total_xp_earned integer DEFAULT 0,
    last_lesson_at timestamptz,
    streak_freeze_used_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, normalized_topic)
);

CREATE TABLE IF NOT EXISTS public.topic_lesson_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    topic_id uuid NOT NULL REFERENCES public.user_lesson_topics(id) ON DELETE CASCADE,
    lesson_id text NOT NULL,
    score integer DEFAULT 0,
    xp_earned integer DEFAULT 0,
    time_spent_seconds integer DEFAULT 0,
    completed_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_lesson_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_lesson_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own topics" ON public.user_lesson_topics FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own history" ON public.topic_lesson_history FOR ALL USING (auth.uid() = user_id);

-- Lesson Series (Premium)
CREATE TABLE IF NOT EXISTS public.lesson_series (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    topic TEXT NOT NULL,
    total_lessons INTEGER NOT NULL DEFAULT 5,
    completed_lessons INTEGER NOT NULL DEFAULT 0,
    difficulty TEXT NOT NULL DEFAULT 'beginner',
    category TEXT NOT NULL DEFAULT 'custom',
    image_url TEXT,
    is_public BOOLEAN NOT NULL DEFAULT false,
    total_xp INTEGER NOT NULL DEFAULT 0,
    earned_xp INTEGER NOT NULL DEFAULT 0,
    progress INTEGER NOT NULL DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    custom_instructions TEXT,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.series_lessons (
    id TEXT PRIMARY KEY,
    series_id TEXT NOT NULL REFERENCES public.lesson_series(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    theory TEXT,
    questions JSONB DEFAULT '[]',
    order_num INTEGER NOT NULL DEFAULT 1,
    difficulty TEXT NOT NULL DEFAULT 'beginner',
    estimated_minutes INTEGER NOT NULL DEFAULT 8,
    xp_reward INTEGER NOT NULL DEFAULT 50,
    completed BOOLEAN NOT NULL DEFAULT false,
    score INTEGER,
    completed_at timestamptz,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.lesson_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own series" ON public.lesson_series FOR ALL USING (auth.uid() = user_id OR (is_public = true AND auth.role() = 'authenticated'));
CREATE POLICY "Users own series lessons" ON public.series_lessons FOR ALL USING (
  EXISTS (SELECT 1 FROM public.lesson_series ls WHERE ls.id = series_lessons.series_id AND (ls.user_id = auth.uid() OR ls.is_public = true))
);


-- 6. FUNCTIONS & TRIGGERS
-- =====================================================

-- Reset Daily Stats (Cron)
CREATE OR REPLACE FUNCTION reset_daily_stats() RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET today_xp = 0, lessons_today = 0, perfect_lessons_today = 0, fast_lessons_today = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reset Monthly Stats (Cron)
CREATE OR REPLACE FUNCTION reset_monthly_stats() RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles SET quests_completed_this_month = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add XP Helper
CREATE OR REPLACE FUNCTION add_user_xp(p_user_id UUID, p_xp_amount INTEGER) RETURNS void AS $$
BEGIN
    UPDATE profiles
    SET total_xp = COALESCE(total_xp, 0) + p_xp_amount,
        lessons_completed = COALESCE(lessons_completed, 0) + 1,
        updated_at = NOW()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update Topic Streak Trigger
CREATE OR REPLACE FUNCTION update_topic_streak() RETURNS TRIGGER AS $$
DECLARE
    last_completion timestamptz;
    current_streak integer;
    current_best integer;
BEGIN
    SELECT last_lesson_at, streak_count, best_streak 
    INTO last_completion, current_streak, current_best
    FROM public.user_lesson_topics WHERE id = NEW.topic_id;

    IF last_completion IS NULL OR DATE(last_completion AT TIME ZONE 'UTC') = DATE(NOW() AT TIME ZONE 'UTC') - INTERVAL '1 day' THEN
        current_streak := current_streak + 1;
    ELSIF DATE(last_completion AT TIME ZONE 'UTC') = DATE(NOW() AT TIME ZONE 'UTC') THEN
        NULL; -- Same day
    ELSE
        current_streak := 1; -- Broken
    END IF;

    IF current_streak > current_best THEN current_best := current_streak; END IF;

    UPDATE public.user_lesson_topics
    SET streak_count = current_streak, best_streak = current_best,
        total_lessons_completed = total_lessons_completed + 1,
        total_xp_earned = total_xp_earned + NEW.xp_earned,
        last_lesson_at = NOW(), updated_at = NOW()
    WHERE id = NEW.topic_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_topic_streak ON public.topic_lesson_history;
CREATE TRIGGER trigger_update_topic_streak
    AFTER INSERT ON public.topic_lesson_history
    FOR EACH ROW EXECUTE FUNCTION update_topic_streak();
