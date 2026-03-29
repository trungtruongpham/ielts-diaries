'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserWritingSessions, getRecentWritingSessions } from '@/lib/db/writing-sessions'
import type { DbWritingSession } from '@/lib/db/types'

export async function getWritingSessionsAction(): Promise<DbWritingSession[]> {
  return getUserWritingSessions()
}

export async function getRecentWritingSessionsAction(limit = 3): Promise<DbWritingSession[]> {
  return getRecentWritingSessions(limit)
}

export async function deleteWritingSessionAction(
  sessionId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('writing_sessions')
    .delete()
    .eq('id', sessionId)

  if (error) return { error: error.message }
  return { error: null }
}
