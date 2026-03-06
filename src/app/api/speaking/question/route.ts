import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generatePartQuestions } from '@/lib/ai/speaking-engine'
import { getSpeakingSession } from '@/lib/db/speaking-sessions'

/**
 * POST /api/speaking/question
 * Body: {
 *   sessionId: string
 *   part: 2 | 3
 *   part2Topic?: string   // Required for Part 3 — the topic from the Part 2 card
 * }
 *
 * Generates questions for the requested part.
 * Part 2 returns a single question with a topicCard.
 * Part 3 returns 5 discussion questions.
 *
 * Response: { part, questions: SpeakingQuestion[] }
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
  let part: 2 | 3
  let part2Topic: string | undefined

  try {
    const body = await req.json() as {
      sessionId?: unknown
      part?: unknown
      part2Topic?: unknown
    }

    if (!body.sessionId || typeof body.sessionId !== 'string') {
      return NextResponse.json({ error: '`sessionId` is required' }, { status: 400 })
    }
    if (body.part !== 2 && body.part !== 3) {
      return NextResponse.json({ error: '`part` must be 2 or 3' }, { status: 400 })
    }
    sessionId = body.sessionId
    part = body.part
    part2Topic = typeof body.part2Topic === 'string' ? body.part2Topic : undefined

    if (part === 3 && !part2Topic) {
      return NextResponse.json({ error: '`part2Topic` is required for Part 3' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Verify session ownership via RLS
  const session = await getSpeakingSession(sessionId)
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }
  if (session.status !== 'in_progress') {
    return NextResponse.json({ error: 'Session is no longer active' }, { status: 409 })
  }

  // Generate questions
  try {
    const questions = await generatePartQuestions(part, { part2Topic })
    return NextResponse.json({ part, questions })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate questions'
    console.error('[POST /api/speaking/question]', message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
