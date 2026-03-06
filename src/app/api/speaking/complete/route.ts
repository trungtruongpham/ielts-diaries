import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateSpeakingOverall } from '@/lib/ai/speaking-engine'
import {
  getSpeakingSession,
  getSessionAnswers,
  completeSpeakingSession,
} from '@/lib/db/speaking-sessions'
import type { SpeakingEvaluation } from '@/lib/ai/types'
import type { SpeakingFeedback } from '@/lib/db/types'

/**
 * POST /api/speaking/complete
 * Body: { sessionId: string }
 *
 * Marks the session as completed, aggregates all per-answer evaluations
 * into final band scores, and returns the completed session.
 *
 * Response: { session }  (DbSpeakingSession with final scores)
 */
export async function POST(req: Request): Promise<Response> {
  // Auth guard
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse body
  let sessionId: string
  try {
    const body = await req.json() as { sessionId?: unknown }
    if (!body.sessionId || typeof body.sessionId !== 'string') {
      return NextResponse.json({ error: '`sessionId` is required' }, { status: 400 })
    }
    sessionId = body.sessionId
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Verify session
  const session = await getSpeakingSession(sessionId)
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }
  if (session.status === 'completed') {
    // Idempotent — return current session if already completed
    return NextResponse.json({ session })
  }

  // Fetch all answers to aggregate scores
  const answers = await getSessionAnswers(sessionId)

  // Map DB feedback JSONB → SpeakingEvaluation shape for calculateSpeakingOverall
  const evaluations: SpeakingEvaluation[] = answers
    .filter(a => a.feedback !== null)
    .map(a => {
      const f = a.feedback as SpeakingFeedback
      return {
        fluency_coherence: f.fluency_coherence,
        lexical_resource: f.lexical_resource,
        grammatical_range: f.grammatical_range,
        pronunciation: f.pronunciation,
        overall: a.band_score ?? 0,
        feedback: f.feedback,
        strengths: f.strengths,
        improvements: f.improvements,
      }
    })

  // Calculate final session scores
  const scores = calculateSpeakingOverall(evaluations)

  // Persist
  const { data: completed, error } = await completeSpeakingSession(sessionId, scores)
  if (error || !completed) {
    console.error('[POST /api/speaking/complete]', error)
    return NextResponse.json({ error: error ?? 'Failed to complete session' }, { status: 500 })
  }

  return NextResponse.json({ session: completed })
}
