import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { evaluateWriting } from '@/lib/ai/writing-engine'
import { getWritingAnswer, getWritingSession, updateWritingAnswer } from '@/lib/db/writing-sessions'
import type { WritingFeedback } from '@/lib/db/types'

/**
 * POST /api/writing/evaluate
 * Body: { answer_id: string, user_answer: string, word_count: number, time_taken_seconds?: number }
 * Response: { evaluation: WritingEvaluation }
 */
export async function POST(req: Request): Promise<Response> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let answer_id: string
  let user_answer: string
  let word_count: number
  let time_taken_seconds: number | null = null
  let model: string | undefined

  try {
    const body = await req.json() as Record<string, unknown>
    if (!body.answer_id || typeof body.answer_id !== 'string') {
      return NextResponse.json({ error: '`answer_id` is required' }, { status: 400 })
    }
    if (typeof body.user_answer !== 'string') {
      return NextResponse.json({ error: '`user_answer` is required' }, { status: 400 })
    }
    if (typeof body.word_count !== 'number') {
      return NextResponse.json({ error: '`word_count` is required' }, { status: 400 })
    }
    answer_id = body.answer_id
    user_answer = (body.user_answer as string).trim()
    word_count = Math.max(0, Math.round(body.word_count as number))
    if (typeof body.time_taken_seconds === 'number') {
      time_taken_seconds = Math.round(body.time_taken_seconds)
    }
    model = typeof body.model === 'string' ? body.model : undefined
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Verify answer + session ownership
  const answer = await getWritingAnswer(answer_id)
  if (!answer) return NextResponse.json({ error: 'Answer not found' }, { status: 404 })

  const session = await getWritingSession(answer.session_id)
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  // Evaluate via LLM
  let evaluation
  try {
    evaluation = await evaluateWriting(
      answer.task,
      session.test_type,
      answer.prompt_text,
      answer.prompt_type,
      user_answer,
      word_count,
      model
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Evaluation failed'
    console.error('[POST /api/writing/evaluate]', message)
    return NextResponse.json({ error: message }, { status: 502 })
  }

  // Persist the evaluated answer
  const feedback: WritingFeedback = {
    ...(evaluation.task_achievement !== undefined ? { task_achievement: evaluation.task_achievement } : {}),
    ...(evaluation.task_response !== undefined ? { task_response: evaluation.task_response } : {}),
    coherence_cohesion: evaluation.coherence_cohesion,
    lexical_resource: evaluation.lexical_resource,
    grammatical_range: evaluation.grammatical_range,
    overall: evaluation.overall,
    feedback: evaluation.feedback,
    strengths: evaluation.strengths,
    improvements: evaluation.improvements,
    model_answer: evaluation.model_answer,
    band_breakdown: evaluation.band_breakdown,
  }

  const { error: dbError } = await updateWritingAnswer(answer_id, {
    user_answer,
    word_count,
    time_taken_seconds,
    band_score: evaluation.overall,
    feedback,
  })

  if (dbError) {
    console.error('[POST /api/writing/evaluate] DB error', dbError)
    // Return evaluation even if DB save fails — don't block user
    return NextResponse.json({ evaluation }, { status: 207 })
  }

  return NextResponse.json({ evaluation })
}
