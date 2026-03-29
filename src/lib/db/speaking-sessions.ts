// Speaking session query utilities (server-side only)
import { createClient } from '@/lib/supabase/server'
import type {
  DbSpeakingSession,
  DbSpeakingAnswer,
  InsertSpeakingAnswer,
  CompleteSpeakingSession,
  PracticeMode,
} from './types'

// ── Sessions ──────────────────────────────────────────────────────────────────

/**
 * Create a new in-progress speaking session for the current user.
 *
 * @param topic        Random topic string (Part 1 topic or Part 3 discussion theme)
 * @param practiceMode Which part(s) the user chose to practice. Defaults to 'full'.
 */
export async function createSpeakingSession(
  topic?: string,
  practiceMode: PracticeMode = 'full'
): Promise<{ data: DbSpeakingSession | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('speaking_sessions')
    .insert({
      user_id: user.id,
      topic: topic ?? null,
      status: 'in_progress',
      practice_mode: practiceMode,
    })
    .select()
    .single()

  if (error) {
    console.error('[createSpeakingSession]', error)
    return { data: null, error: error.message }
  }

  return { data: data as DbSpeakingSession, error: null }
}

/**
 * Get a single session by ID (RLS enforces ownership).
 */
export async function getSpeakingSession(
  id: string
): Promise<DbSpeakingSession | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('speaking_sessions')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('[getSpeakingSession]', error)
    return null
  }

  return data as DbSpeakingSession
}

/**
 * Get all sessions for current user, newest first.
 */
export async function getUserSpeakingSessions(): Promise<DbSpeakingSession[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('speaking_sessions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getUserSpeakingSessions]', error)
    return []
  }

  return data as DbSpeakingSession[]
}

/**
 * Mark a session as completed and set the final band scores.
 */
export async function completeSpeakingSession(
  id: string,
  scores: CompleteSpeakingSession
): Promise<{ data: DbSpeakingSession | null; error: string | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('speaking_sessions')
    .update({
      ...scores,
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[completeSpeakingSession]', error)
    return { data: null, error: error.message }
  }

  return { data: data as DbSpeakingSession, error: null }
}

/**
 * Mark a session as abandoned (user quit early).
 */
export async function abandonSpeakingSession(
  id: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('speaking_sessions')
    .update({ status: 'abandoned' })
    .eq('id', id)

  if (error) {
    console.error('[abandonSpeakingSession]', error)
    return { error: error.message }
  }

  return { error: null }
}

/**
 * Delete a session (cascades to answers; audio files must be deleted separately).
 */
export async function deleteSpeakingSession(
  id: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('speaking_sessions')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[deleteSpeakingSession]', error)
    return { error: error.message }
  }

  return { error: null }
}

// ── Answers ───────────────────────────────────────────────────────────────────

/**
 * Persist one speaking answer (question + transcript + audio_url + evaluation).
 */
export async function createSpeakingAnswer(
  answer: InsertSpeakingAnswer
): Promise<{ data: DbSpeakingAnswer | null; error: string | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('speaking_answers')
    .insert(answer)
    .select()
    .single()

  if (error) {
    console.error('[createSpeakingAnswer]', error)
    return { data: null, error: error.message }
  }

  return { data: data as DbSpeakingAnswer, error: null }
}

/**
 * Fetch all answers for a session, ordered by part + question_index.
 */
export async function getSessionAnswers(
  sessionId: string
): Promise<DbSpeakingAnswer[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('speaking_answers')
    .select('*')
    .eq('session_id', sessionId)
    .order('part', { ascending: true })
    .order('question_index', { ascending: true })

  if (error) {
    console.error('[getSessionAnswers]', error)
    return []
  }

  return data as DbSpeakingAnswer[]
}

// ── Audio Storage ─────────────────────────────────────────────────────────────

/**
 * Upload an audio blob to Supabase Storage.
 * Path pattern: {userId}/{sessionId}/{part}-{questionIndex}.webm
 * Returns the signed URL (valid 24h) or throws on error.
 */
export async function uploadSpeakingAudio(
  userId: string,
  sessionId: string,
  part: number,
  questionIndex: number,
  blob: Blob
): Promise<string> {
  const supabase = await createClient()
  const ext = blob.type.includes('ogg') ? 'ogg' : 'webm'
  const path = `${userId}/${sessionId}/${part}-${questionIndex}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('speaking-recordings')
    .upload(path, blob, {
      contentType: blob.type || 'audio/webm',
      upsert: true,
    })

  if (uploadError) {
    console.error('[uploadSpeakingAudio]', uploadError)
    throw new Error(`Audio upload failed: ${uploadError.message}`)
  }

  // Create a signed URL valid for 24 hours
  const { data: signed, error: signError } = await supabase.storage
    .from('speaking-recordings')
    .createSignedUrl(path, 86400)

  if (signError || !signed?.signedUrl) {
    throw new Error(`Failed to get signed URL: ${signError?.message}`)
  }

  return signed.signedUrl
}

/**
 * Delete all audio files in a session folder.
 */
export async function deleteSessionAudio(
  userId: string,
  sessionId: string
): Promise<void> {
  const supabase = await createClient()

  // List all files in the session folder
  const { data: files } = await supabase.storage
    .from('speaking-recordings')
    .list(`${userId}/${sessionId}`)

  if (!files?.length) return

  const paths = files.map(f => `${userId}/${sessionId}/${f.name}`)
  await supabase.storage.from('speaking-recordings').remove(paths)
}
