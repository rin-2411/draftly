-- Migration: Create drafts table with RLS policies
-- Version: 1.0
-- Description: Creates the drafts table for storing user-generated content with proper security

-- Create drafts table
CREATE TABLE IF NOT EXISTS drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  source_urls TEXT[] NOT NULL DEFAULT '{}',
  tone TEXT,
  length TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_drafts_user_id ON drafts(user_id);

-- Create index on created_at for chronological sorting
CREATE INDEX IF NOT EXISTS idx_drafts_created_at ON drafts(created_at DESC);

-- Enable Row Level Security
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view own drafts" ON drafts;
DROP POLICY IF EXISTS "Users can insert own drafts" ON drafts;
DROP POLICY IF EXISTS "Users can update own drafts" ON drafts;
DROP POLICY IF EXISTS "Users can delete own drafts" ON drafts;

-- RLS Policy: Users can only SELECT their own drafts
CREATE POLICY "Users can view own drafts"
  ON drafts FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only INSERT their own drafts
CREATE POLICY "Users can insert own drafts"
  ON drafts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only UPDATE their own drafts
CREATE POLICY "Users can update own drafts"
  ON drafts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only DELETE their own drafts
CREATE POLICY "Users can delete own drafts"
  ON drafts FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on row update
DROP TRIGGER IF EXISTS update_drafts_updated_at ON drafts;
CREATE TRIGGER update_drafts_updated_at
  BEFORE UPDATE ON drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
