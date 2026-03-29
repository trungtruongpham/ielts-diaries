// Writing session query utilities (server-side only)
import { createClient } from '@/lib/supabase/server'
import type {
  DbWritingSession,
  DbWritingAnswer,
  InsertWritingSession,
  InsertWritingAnswer,
  CompleteWritingSession,
} from './types'

// ── Sessions ──────────────────────────────────────────────────────────────────

/** Create a new in-progress writing session for the current user. */
export async function createWritingSession(
  payload: InsertWritingSession
): Promise<{ data: DbWritingSession | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('writing_sessions')
    .insert({ user_id: user.id, status: 'in_progress', ...payload })
    .select()
    .single()

  if (error) {
    console.error('[createWritingSession]', error)
    return { data: null, error: error.message }
  }
  return { data: data as DbWritingSession, error: null }
}

/** Get a single session by ID (RLS enforces ownership). */
export async function getWritingSession(id: string): Promise<DbWritingSession | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('writing_sessions')
    .select('*')
    .eq('id', id)
    .single()
  if (error) { console.error('[getWritingSession]', error); return null }
  return data as DbWritingSession
}

/** Get all completed sessions for current user (newest first). */
export async function getUserWritingSessions(limit = 20): Promise<DbWritingSession[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('writing_sessions')
    .select('*')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) { console.error('[getUserWritingSessions]', error); return [] }
  return data as DbWritingSession[]
}

/** Mark a session as completed with final band scores. */
export async function completeWritingSession(
  id: string,
  scores: CompleteWritingSession
): Promise<{ data: DbWritingSession | null; error: string | null }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('writing_sessions')
    .update({ ...scores, status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) { console.error('[completeWritingSession]', error); return { data: null, error: error.message } }
  return { data: data as DbWritingSession, error: null }
}

// ── Answers ───────────────────────────────────────────────────────────────────

/** Insert a placeholder answer row (prompt generated, not yet written). */
export async function createWritingAnswer(
  answer: InsertWritingAnswer
): Promise<{ data: DbWritingAnswer | null; error: string | null }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('writing_answers')
    .insert(answer)
    .select()
    .single()
  if (error) { console.error('[createWritingAnswer]', error); return { data: null, error: error.message } }
  return { data: data as DbWritingAnswer, error: null }
}

/** Update an existing answer row after evaluation. */
export async function updateWritingAnswer(
  id: string,
  patch: Partial<Pick<DbWritingAnswer, 'user_answer' | 'word_count' | 'time_taken_seconds' | 'band_score' | 'feedback'>>
): Promise<{ data: DbWritingAnswer | null; error: string | null }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('writing_answers')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) { console.error('[updateWritingAnswer]', error); return { data: null, error: error.message } }
  return { data: data as DbWritingAnswer, error: null }
}

/** Fetch a single answer by ID. */
export async function getWritingAnswer(id: string): Promise<DbWritingAnswer | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('writing_answers')
    .select('*')
    .eq('id', id)
    .single()
  if (error) { console.error('[getWritingAnswer]', error); return null }
  return data as DbWritingAnswer
}

/** Fetch all answers for a session ordered by task number. */
export async function getWritingSessionAnswers(sessionId: string): Promise<DbWritingAnswer[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('writing_answers')
    .select('*')
    .eq('session_id', sessionId)
    .order('task', { ascending: true })
  if (error) { console.error('[getWritingSessionAnswers]', error); return [] }
  return data as DbWritingAnswer[]
}

/** Get recent writing sessions with answers for dashboard widget. */
export async function getRecentWritingSessions(limit = 3): Promise<DbWritingSession[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('writing_sessions')
    .select('*')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) { console.error('[getRecentWritingSessions]', error); return [] }
  return data as DbWritingSession[]
}
