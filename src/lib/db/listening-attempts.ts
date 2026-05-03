// Listening attempt query utilities (server-side only)
import { createClient } from '@/lib/supabase/server'
import type { DbListeningAttempt, CompleteListeningAttempt } from './types'

// ── Attempts ──────────────────────────────────────────────────────────────────

/** Create a new in-progress attempt when the user starts a test */
export async function createListeningAttempt(input: {
  test_id: string
  mode: 'strict' | 'practice'
  user_id: string
  answers: Record<number, string | string[]>
  correct_count: number
  score: number
  band: number
  completed_at: string
  time_taken_seconds: number
}): Promise<{ data: DbListeningAttempt | null; error: string | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('listening_attempts')
    .insert({
      user_id: input.user_id,
      test_id: input.test_id,
      mode: input.mode,
      answers: input.answers,
      correct_count: input.correct_count,
      score: input.score,
      band: input.band,
      completed_at: input.completed_at,
      time_taken_seconds: input.time_taken_seconds,
    })
    .select()
    .single()

  if (error) {
    console.error('[createListeningAttempt]', error)
    return { data: null, error: error.message }
  }

  return { data: data as DbListeningAttempt, error: null }
}

/** Update an in-progress attempt with final score data */
export async function completeListeningAttempt(
  id: string,
  data: CompleteListeningAttempt
): Promise<{ data: DbListeningAttempt | null; error: string | null }> {
  const supabase = await createClient()

  const { data: updated, error } = await supabase
    .from('listening_attempts')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[completeListeningAttempt]', error)
    return { data: null, error: error.message }
  }

  return { data: updated as DbListeningAttempt, error: null }
}

/** Get user's past attempts, newest first */
export async function getUserListeningAttempts(
  limit = 20
): Promise<DbListeningAttempt[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('listening_attempts')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[getUserListeningAttempts]', error)
    return []
  }

  return data as DbListeningAttempt[]
}

/** Get a single attempt by ID — RLS enforces ownership */
export async function getListeningAttempt(
  id: string
): Promise<DbListeningAttempt | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('listening_attempts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('[getListeningAttempt]', error)
    return null
  }

  return data as DbListeningAttempt
}
