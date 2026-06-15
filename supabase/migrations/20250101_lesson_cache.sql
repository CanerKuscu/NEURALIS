-- =====================================================
-- LESSON CACHE SYSTEM
-- Database-first approach: check cache before calling AI
-- =====================================================

-- 1. Enable pgvector extension for smart topic matching
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Lesson Cache Table
-- Stores pre-generated and AI-generated lessons for reuse
CREATE TABLE IF NOT EXISTS public.lesson_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Composite key for cache lookup
    category TEXT NOT NULL,           -- e.g., "Languages/İngilizce"
    difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    language TEXT NOT NULL DEFAULT 'tr',  -- UI/content language code
    
    -- Lesson content
    title TEXT NOT NULL,
    theory TEXT,                      -- Markdown theory section
    questions JSONB NOT NULL,         -- Full questions array
    
    -- Metadata
    question_count INTEGER NOT NULL DEFAULT 10,
    question_types TEXT[] DEFAULT '{}', -- e.g., {'multiple_choice','true_false','fill_blank'}
    tags TEXT[] DEFAULT '{}',          -- searchable tags
    
    -- Quality & Usage tracking
    quality_score REAL DEFAULT 0.8,   -- 0.0-1.0, from user ratings & completion rates
    usage_count INTEGER DEFAULT 0,     -- how many times served
    avg_score REAL DEFAULT 0,          -- average user score on this lesson
    total_completions INTEGER DEFAULT 0,
    positive_ratings INTEGER DEFAULT 0,
    negative_ratings INTEGER DEFAULT 0,
    
    -- AI Generation metadata
    is_ai_generated BOOLEAN DEFAULT true,
    is_curated BOOLEAN DEFAULT false,  -- manually reviewed & approved
    model_used TEXT DEFAULT 'gemini-2.0-flash',
    generation_cost_tokens INTEGER DEFAULT 0,
    
    -- Vector embedding for semantic search
    embedding vector(768),             -- for pgvector similarity search
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    last_served_at TIMESTAMPTZ,
    
    -- Composite unique: one cached lesson per category+difficulty+language+variant
    UNIQUE(category, difficulty, language, title)
);

-- 3. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_lesson_cache_lookup 
    ON public.lesson_cache(category, difficulty, language);

CREATE INDEX IF NOT EXISTS idx_lesson_cache_quality 
    ON public.lesson_cache(quality_score DESC) 
    WHERE quality_score > 0.5;

CREATE INDEX IF NOT EXISTS idx_lesson_cache_tags 
    ON public.lesson_cache USING GIN(tags);

-- pgvector index for similarity search
CREATE INDEX IF NOT EXISTS idx_lesson_cache_embedding 
    ON public.lesson_cache 
    USING ivfflat (embedding vector_cosine_ops) 
    WITH (lists = 50);

-- 4. User Lesson Interactions (for quality tracking)
CREATE TABLE IF NOT EXISTS public.lesson_cache_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_cache_id UUID NOT NULL REFERENCES public.lesson_cache(id) ON DELETE CASCADE,
    score REAL,                        -- user's score 0-100
    completion_time_seconds INTEGER,
    rating SMALLINT CHECK (rating IN (-1, 0, 1)), -- thumbs down/neutral/up
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, lesson_cache_id, created_at)
);

CREATE INDEX IF NOT EXISTS idx_lesson_cache_interactions_user 
    ON public.lesson_cache_interactions(user_id);

CREATE INDEX IF NOT EXISTS idx_lesson_cache_interactions_lesson 
    ON public.lesson_cache_interactions(lesson_cache_id);

-- 5. RLS Policies
ALTER TABLE public.lesson_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_cache_interactions ENABLE ROW LEVEL SECURITY;

-- Everyone can read cached lessons
CREATE POLICY "Lesson cache: public read" ON public.lesson_cache
    FOR SELECT USING (true);

-- Only service role can insert/update cache (via edge functions)
CREATE POLICY "Lesson cache: service role write" ON public.lesson_cache
    FOR ALL USING (auth.role() = 'service_role');

-- Users interact with their own records
CREATE POLICY "Lesson cache interactions: own access" ON public.lesson_cache_interactions
    FOR ALL USING (auth.uid() = user_id);

-- 6. Function: Find best cached lesson
CREATE OR REPLACE FUNCTION find_cached_lesson(
    p_category TEXT,
    p_difficulty TEXT,
    p_language TEXT DEFAULT 'tr',
    p_exclude_ids UUID[] DEFAULT '{}'
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    theory TEXT,
    questions JSONB,
    quality_score REAL,
    usage_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lc.id,
        lc.title,
        lc.theory,
        lc.questions,
        lc.quality_score,
        lc.usage_count
    FROM public.lesson_cache lc
    WHERE lc.category = p_category
      AND lc.difficulty = p_difficulty
      AND lc.language = p_language
      AND lc.quality_score > 0.3
      AND lc.id != ALL(p_exclude_ids)
    ORDER BY 
        -- Prefer high quality, less served lessons
        (lc.quality_score * 0.7) + (1.0 / (lc.usage_count + 1) * 0.3) DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Function: Update lesson quality after interaction
CREATE OR REPLACE FUNCTION update_lesson_quality()
RETURNS TRIGGER AS $$
BEGIN
    -- Update cache stats when an interaction is recorded
    UPDATE public.lesson_cache
    SET 
        usage_count = usage_count + (CASE WHEN NEW.completed THEN 1 ELSE 0 END),
        total_completions = total_completions + (CASE WHEN NEW.completed THEN 1 ELSE 0 END),
        positive_ratings = positive_ratings + (CASE WHEN NEW.rating = 1 THEN 1 ELSE 0 END),
        negative_ratings = negative_ratings + (CASE WHEN NEW.rating = -1 THEN 1 ELSE 0 END),
        avg_score = (
            SELECT COALESCE(AVG(score), 0)
            FROM public.lesson_cache_interactions
            WHERE lesson_cache_id = NEW.lesson_cache_id AND score IS NOT NULL
        ),
        quality_score = LEAST(1.0, GREATEST(0.0,
            0.5 + 
            (COALESCE((SELECT AVG(score) FROM public.lesson_cache_interactions WHERE lesson_cache_id = NEW.lesson_cache_id AND score IS NOT NULL), 50) / 100.0) * 0.3 +
            (CASE 
                WHEN (positive_ratings + negative_ratings) > 0 
                THEN (positive_ratings::REAL / (positive_ratings + negative_ratings)) * 0.2
                ELSE 0.1
            END)
        )),
        last_served_at = NOW(),
        updated_at = NOW()
    WHERE id = NEW.lesson_cache_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_lesson_quality ON public.lesson_cache_interactions;
CREATE TRIGGER trigger_update_lesson_quality
    AFTER INSERT ON public.lesson_cache_interactions
    FOR EACH ROW EXECUTE FUNCTION update_lesson_quality();

-- 8. Function: Vector similarity search for topics
CREATE OR REPLACE FUNCTION find_similar_lessons(
    p_embedding vector(768),
    p_difficulty TEXT DEFAULT NULL,
    p_language TEXT DEFAULT 'tr',
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    category TEXT,
    title TEXT,
    theory TEXT,
    questions JSONB,
    quality_score REAL,
    similarity REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lc.id,
        lc.category,
        lc.title,
        lc.theory,
        lc.questions,
        lc.quality_score,
        (1 - (lc.embedding <=> p_embedding))::REAL as similarity
    FROM public.lesson_cache lc
    WHERE lc.embedding IS NOT NULL
      AND lc.quality_score > 0.3
      AND lc.language = p_language
      AND (p_difficulty IS NULL OR lc.difficulty = p_difficulty)
    ORDER BY lc.embedding <=> p_embedding
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Daily Lesson Tracking - stores daily usage per user
CREATE TABLE IF NOT EXISTS public.daily_lesson_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    lessons_completed INTEGER DEFAULT 0,
    ads_watched INTEGER DEFAULT 0,
    language TEXT DEFAULT 'tr',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_lesson_tracking_user
    ON public.daily_lesson_tracking(user_id, date DESC);

ALTER TABLE public.daily_lesson_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Daily lesson tracking: own access" ON public.daily_lesson_tracking
    FOR ALL USING (auth.uid() = user_id);

-- 10. Feedback Table - user bug reports & suggestions
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'bug_report',
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Feedback: users can insert own" ON public.feedback
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Feedback: users can read own" ON public.feedback
    FOR SELECT USING (auth.uid()::TEXT = user_id);
