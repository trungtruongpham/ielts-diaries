-- ============================================================
-- IELTS Diaries — Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================

-- ─── EXTENSIONS ──────────────────────────────────────────────
-- Already enabled in Supabase by default
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── TABLES ──────────────────────────────────────────────────

-- test_results: stores every IELTS test attempt
CREATE TABLE IF NOT EXISTS public.test_results (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- When and what type
  test_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  test_type       TEXT NOT NULL DEFAULT 'academic'
                  CHECK (test_type IN ('academic', 'general')),

  -- Raw inputs (nullable because user might only know band, not raw score)
  listening_correct  SMALLINT CHECK (listening_correct BETWEEN 0 AND 40),
  reading_correct    SMALLINT CHECK (reading_correct BETWEEN 0 AND 40),

  -- Band scores for each module (0–9 in 0.5 steps)
  listening_band  NUMERIC(3,1) CHECK (listening_band BETWEEN 0 AND 9),
  reading_band    NUMERIC(3,1) CHECK (reading_band BETWEEN 0 AND 9),
  writing_band    NUMERIC(3,1) CHECK (writing_band BETWEEN 0 AND 9),
  speaking_band   NUMERIC(3,1) CHECK (speaking_band BETWEEN 0 AND 9),

  -- Calculated overall (required)
  overall_band    NUMERIC(3,1) NOT NULL CHECK (overall_band BETWEEN 0 AND 9),

  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- user_goals: one active goal per user (upsert pattern)
CREATE TABLE IF NOT EXISTS public.user_goals (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  target_listening NUMERIC(3,1) NOT NULL DEFAULT 6.0 CHECK (target_listening BETWEEN 0 AND 9),
  target_reading   NUMERIC(3,1) NOT NULL DEFAULT 6.0 CHECK (target_reading BETWEEN 0 AND 9),
  target_writing   NUMERIC(3,1) NOT NULL DEFAULT 6.0 CHECK (target_writing BETWEEN 0 AND 9),
  target_speaking  NUMERIC(3,1) NOT NULL DEFAULT 6.0 CHECK (target_speaking BETWEEN 0 AND 9),
  target_overall   NUMERIC(3,1) NOT NULL DEFAULT 6.0 CHECK (target_overall BETWEEN 0 AND 9),

  target_date     DATE,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── INDEXES ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_test_results_user_id ON public.test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_test_results_test_date ON public.test_results(user_id, test_date DESC);

-- ─── UPDATED_AT TRIGGER ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER user_goals_updated_at
  BEFORE UPDATE ON public.user_goals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

-- test_results policies: users can only CRUD their own rows
CREATE POLICY "Users can view own test results"
  ON public.test_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own test results"
  ON public.test_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own test results"
  ON public.test_results FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own test results"
  ON public.test_results FOR DELETE
  USING (auth.uid() = user_id);

-- user_goals policies
CREATE POLICY "Users can view own goal"
  ON public.user_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goal"
  ON public.user_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goal"
  ON public.user_goals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goal"
  ON public.user_goals FOR DELETE
  USING (auth.uid() = user_id);
