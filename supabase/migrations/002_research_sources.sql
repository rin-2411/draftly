-- Migration: Research Library — saved sources per user
-- Table stores URLs with optional title, notes, and tags for the Research Library page.

CREATE TABLE IF NOT EXISTS research_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  notes TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_research_sources_user_id ON research_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_research_sources_updated_at ON research_sources(updated_at DESC);

ALTER TABLE research_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own research_sources" ON research_sources;
DROP POLICY IF EXISTS "Users can insert own research_sources" ON research_sources;
DROP POLICY IF EXISTS "Users can update own research_sources" ON research_sources;
DROP POLICY IF EXISTS "Users can delete own research_sources" ON research_sources;

CREATE POLICY "Users can view own research_sources"
  ON research_sources FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own research_sources"
  ON research_sources FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own research_sources"
  ON research_sources FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own research_sources"
  ON research_sources FOR DELETE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_research_sources_updated_at ON research_sources;
CREATE TRIGGER update_research_sources_updated_at
  BEFORE UPDATE ON research_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
