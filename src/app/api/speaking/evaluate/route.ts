import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { evaluateAnswer } from '@/lib/ai/speaking-engine'
import { createSpeakingAnswer, getSpeakingSession } from '@/lib/db/speaking-sessions'
import type { SpeakingFeedback } from '@/lib/db/types'

/**
 * POST /api/speaking/evaluate
 * Body: {
 *   sessionId: string
 *   part: 1 | 2 | 3
 *   questionIndex: number
 *   questionText: string
 *   transcript: string          // may be empty if STT was unavailable
 *   durationSeconds: number
 *   audioUrl?: string           // Supabase Storage URL, if upload succeeded
 * }
 *
 * Evaluates one answer via LLM rubric, persists to DB, returns evaluation.
 * Response: { answerId, evaluation }
 */
export async function POST(req: Request): Promise<Response> {
  // Auth guard
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse + validate body
  let sessionId: string
  let part: 1 | 2 | 3
  let questionIndex: number
  let questionText: string
  let transcript: string
  let durationSeconds: number
  let audioUrl: string | undefined

  try {
    const body = await req.json() as Record<string, unknown>

    if (!body.sessionId || typeof body.sessionId !== 'string') {
      return NextResponse.json({ error: '`sessionId` is required' }, { status: 400 })
    }
    if (body.part !== 1 && body.part !== 2 && body.part !== 3) {
      return NextResponse.json({ error: '`part` must be 1, 2, or 3' }, { status: 400 })
    }
    if (typeof body.questionText !== 'string' || !body.questionText.trim()) {
      return NextResponse.json({ error: '`questionText` is required' }, { status: 400 })
    }

    sessionId = body.sessionId
    part = body.part as 1 | 2 | 3
    questionIndex = typeof body.questionIndex === 'number' ? body.questionIndex : 0
    questionText = (body.questionText as string).trim()
    transcript = typeof body.transcript === 'string' ? body.transcript.trim() : ''
    durationSeconds = typeof body.durationSeconds === 'number' ? Math.round(body.durationSeconds) : 0
    audioUrl = typeof body.audioUrl === 'string' ? body.audioUrl : undefined
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Verify session ownership (RLS-enforced via getSpeakingSession)
  const session = await getSpeakingSession(sessionId)
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // Evaluate via LLM
  let evaluation
  try {
    evaluation = await evaluateAnswer(part, questionText, transcript, durationSeconds)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Evaluation failed'
    console.error('[POST /api/speaking/evaluate]', message)
    return NextResponse.json({ error: message }, { status: 502 })
  }

  // Persist the answer
  const feedback: SpeakingFeedback = {
    fluency_coherence: evaluation.fluency_coherence,
    lexical_resource: evaluation.lexical_resource,
    grammatical_range: evaluation.grammatical_range,
    pronunciation: evaluation.pronunciation,
    feedback: evaluation.feedback,
    strengths: evaluation.strengths,
    improvements: evaluation.improvements,
  }

  const { data: answer, error: dbError } = await createSpeakingAnswer({
    session_id: sessionId,
    part,
    question_index: questionIndex,
    question_text: questionText,
    transcript: transcript || null,
    audio_url: audioUrl ?? null,
    duration_seconds: durationSeconds || null,
    band_score: evaluation.overall,
    feedback,
  })

  if (dbError) {
    console.error('[POST /api/speaking/evaluate] DB error', dbError)
    // Return evaluation even if DB save fails — don't block user
    return NextResponse.json({ answerId: null, evaluation }, { status: 207 })
  }

  return NextResponse.json({ answerId: answer?.id ?? null, evaluation })
}
