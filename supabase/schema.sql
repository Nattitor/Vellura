-- ==============================================================================
-- ✦ Vellura | Complete Production Database Schema & Security Policies (schema.sql)
-- ==============================================================================
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor > New query).
-- This sets up the complete schema, RLS policies, automated triggers, indexes,
-- and atomic RPC functions for quota management and document persistence.
-- ==============================================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. Table: profiles
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_text TEXT DEFAULT '',
  daily_limit INTEGER NOT NULL DEFAULT 5,
  last_generation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  byok_key TEXT,
  output_language TEXT NOT NULL DEFAULT 'English',
  ui_language TEXT NOT NULL DEFAULT 'Spanish',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments for documentation
COMMENT ON TABLE public.profiles IS 'User profiles storing global context, quota limits, encrypted BYOK keys and preferences.';
COMMENT ON COLUMN public.profiles.byok_key IS 'Encrypted AES-256-GCM envelope (v1:iv:tag:ciphertext) storing user API keys.';
COMMENT ON COLUMN public.profiles.daily_limit IS 'Remaining generations for the current day (default 5/day reset daily at UTC midnight).';

-- ------------------------------------------------------------------------------
-- 3. Table: documents
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT DEFAULT '',
  job_description TEXT DEFAULT '',
  generated_content TEXT NOT NULL,
  ai_model_used TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.documents IS 'History of all generated cover letters and pitch documents.';

-- ------------------------------------------------------------------------------
-- 4. High-Performance Indexes
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_documents_user_id_created ON public.documents(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_last_generation ON public.profiles(id, last_generation_date);

-- ------------------------------------------------------------------------------
-- 5. Row Level Security (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile') THEN
    CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile') THEN
    CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Documents policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Users can view own documents') THEN
    CREATE POLICY "Users can view own documents" ON public.documents FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Users can insert own documents') THEN
    CREATE POLICY "Users can insert own documents" ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Users can delete own documents') THEN
    CREATE POLICY "Users can delete own documents" ON public.documents FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 6. Trigger: Automatically Create Profile on Signup
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    avatar_url,
    ui_language,
    output_language,
    daily_limit,
    last_generation_date
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    COALESCE(NEW.raw_user_meta_data->>'ui_language', 'Spanish'),
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'English'),
    5,
    CURRENT_DATE
  )
  ON CONFLICT (id) DO UPDATE SET
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 7. Atomic RPC Function: Consume Limit and Save Document (Race-condition free)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.consume_limit_and_save_document(
  p_company_name TEXT,
  p_job_description TEXT,
  p_generated_content TEXT,
  p_ai_model_used TEXT,
  p_is_using_own_key BOOLEAN
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_current_limit INT;
  v_last_date DATE;
  v_new_limit INT;
  v_doc_id UUID;
  v_today DATE := CURRENT_DATE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Quota Verification & Atomicity
  IF NOT p_is_using_own_key THEN
    -- Lock user profile row to prevent concurrent limit exploits
    SELECT daily_limit, last_generation_date
    INTO v_current_limit, v_last_date
    FROM public.profiles
    WHERE id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Profile not found';
    END IF;

    -- Reset limit if day has crossed (UTC)
    IF v_last_date IS NULL OR v_last_date < v_today THEN
      v_current_limit := 5;
    END IF;

    IF v_current_limit <= 0 THEN
      RAISE EXCEPTION 'Daily limit reached';
    END IF;

    v_new_limit := v_current_limit - 1;

    -- Decrement limit atomically
    UPDATE public.profiles
    SET daily_limit = v_new_limit,
        last_generation_date = v_today,
        updated_at = NOW()
    WHERE id = v_user_id;
  ELSE
    -- BYOK users do not consume platform quota
    SELECT daily_limit INTO v_new_limit FROM public.profiles WHERE id = v_user_id;
  END IF;

  -- 2. Insert document in the exact same transaction
  INSERT INTO public.documents (
    user_id,
    company_name,
    job_description,
    generated_content,
    ai_model_used
  )
  VALUES (
    v_user_id,
    COALESCE(p_company_name, ''),
    COALESCE(p_job_description, ''),
    p_generated_content,
    p_ai_model_used
  )
  RETURNING id INTO v_doc_id;

  RETURN jsonb_build_object(
    'success', true,
    'document_id', v_doc_id,
    'remaining_limit', v_new_limit
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
