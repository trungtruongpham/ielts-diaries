'use server'

import { createClient } from '@/lib/supabase/server'
import {
  getUserSpeakingSessions,
  getSpeakingSession,
  getSessionAnswers,
  deleteSessionAudio,
} from '@/lib/db/speaking-sessions'
import type { DbSpeakingSession, DbSpeakingAnswer } from '@/lib/db/types'

// ── List ─────────────────────────────────────────────────────────────────────


export async function getSpeakingSessionsAction(): Promise<DbSpeakingSession[]> {
  return getUserSpeakingSessions()
}

// ── Detail ────────────────────────────────────────────────────────────────────

export async function getSpeakingSessionDetailAction(
  sessionId: string
): Promise<{ session: DbSpeakingSession | null; answers: DbSpeakingAnswer[] }> {
  const session = await getSpeakingSession(sessionId)
  if (!session) return { session: null, answers: [] }
  const answers = await getSessionAnswers(sessionId)
  return { session, answers }
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteSpeakingSessionAction(
  sessionId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Get session to confirm ownership and get user_id for storage path
  const session = await getSpeakingSession(sessionId)
  if (!session) return { error: 'Session not found' }

  // Delete audio files from Storage first (best-effort)
  try {
    await deleteSessionAudio(user.id, sessionId)
  } catch {
    // Non-fatal — continue with DB deletion
  }

  // Delete DB row (cascades to answers via FK)
  const { error } = await supabase
    .from('speaking_sessions')
    .delete()
    .eq('id', sessionId)

  if (error) return { error: error.message }
  return { error: null }
}

// ── Recent sessions for dashboard widget ─────────────────────────────────────

export async function getRecentSpeakingSessions(
  limit = 3
): Promise<DbSpeakingSession[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('speaking_sessions')
    .select('*')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[getRecentSpeakingSessions]', error)
    return []
  }

  return data as DbSpeakingSession[]
}
