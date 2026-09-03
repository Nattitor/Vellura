-- ==============================================================================
-- ✦ Vellura | Migration: backfill `updated_at` + RPC (run once in prod)
-- ==============================================================================
-- Why: production `profiles` predates schema.sql §2 (no `updated_at` column)
-- and §7 (no `consume_limit_and_save_document` RPC). Without them every
-- generation logs:
--   "RPC consume_limit_and_save_document not available ... column
--    updated_at of relation profiles does not exist"
-- and quota is decremented via the non-atomic fallback instead of the
-- race-condition-free RPC.
--
-- Run this whole file once in Supabase Dashboard > SQL Editor > New query.
-- Safe to re-run (IF NOT EXISTS / CREATE OR REPLACE).
-- ==============================================================================

-- 1. Backfill the missing column (no-op if it already exists)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 2. (Re)create the atomic RPC — identical to schema.sql §7
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

-- 3. Verify (should return one row each)
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'profiles' AND column_name = 'updated_at';
-- SELECT proname FROM pg_proc WHERE proname = 'consume_limit_and_save_document';
