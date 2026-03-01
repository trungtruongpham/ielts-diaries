-- Migration: add result_name column to test_results
-- Run in Supabase SQL Editor

ALTER TABLE public.test_results
  ADD COLUMN IF NOT EXISTS result_name TEXT;

-- Optional index for search by name
CREATE INDEX IF NOT EXISTS idx_test_results_result_name
  ON public.test_results (user_id, result_name);
