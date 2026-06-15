-- Supabase Profiles Table Migration
-- Run this in Supabase SQL Editor to add missing columns

-- Add first_name column if not exists
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT DEFAULT '';

-- Add last_name column if not exists
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_name TEXT DEFAULT '';

-- Add display_name column if not exists
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT DEFAULT '';

-- Add birth_date column if not exists (timestamptz to match schema.sql)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS birth_date TIMESTAMPTZ;

-- Add gender column if not exists
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'other';

-- Add username column if not exists
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS username TEXT DEFAULT '';

-- Verify columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
