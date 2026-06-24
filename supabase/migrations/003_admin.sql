-- Admin: profiles, generation logs, system settings

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_disabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_disabled ON profiles(is_disabled);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE TABLE IF NOT EXISTS generation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_urls TEXT[] NOT NULL DEFAULT '{}',
  tone TEXT,
  length TEXT,
  language TEXT,
  crawl_ok_count INT NOT NULL DEFAULT 0,
  crawl_fail_count INT NOT NULL DEFAULT 0,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generation_logs_user_id ON generation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_logs_created_at ON generation_logs(created_at DESC);

ALTER TABLE generation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own generation logs" ON generation_logs;
CREATE POLICY "Users can view own generation logs"
  ON generation_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read system settings" ON system_settings;
CREATE POLICY "Authenticated users can read system settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (true);

INSERT INTO system_settings (key, value) VALUES
  ('maintenance_mode', 'false'::jsonb),
  ('maintenance_message', '"The editor is temporarily unavailable for maintenance."'::jsonb),
  ('announcement', '""'::jsonb),
  ('daily_generate_limit', '50'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user')
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
