import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generatePartQuestions } from '@/lib/ai/speaking-engine'
import { randomPart1Topic } from '@/lib/ai/prompts/speaking-examiner'
import { createSpeakingSession } from '@/lib/db/speaking-sessions'

/**
 * POST /api/speaking/start
 * No body required.
 *
 * Creates a new speaking session, picks a random Part 1 topic,
 * generates 5 Part 1 questions, and returns them with the session ID.
 *
 * Response: { sessionId, topic, part: 1, questions: SpeakingQuestion[] }
 */
export async function POST(): Promise<Response> {
  // Auth guard
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Pick topic + generate questions in parallel with session creation
  const topic = randomPart1Topic()

  const [questionsResult, sessionResult] = await Promise.allSettled([
    generatePartQuestions(1, { topic }),
    createSpeakingSession(topic),
  ])

  // Handle session creation failure
  if (sessionResult.status === 'rejected') {
    console.error('[POST /api/speaking/start] session create failed', sessionResult.reason)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
  const { data: session, error: sessionError } = sessionResult.value
  if (sessionError || !session) {
    return NextResponse.json({ error: sessionError ?? 'Failed to create session' }, { status: 500 })
  }

  // Handle question generation failure
  if (questionsResult.status === 'rejected') {
    const msg = questionsResult.reason instanceof Error
      ? questionsResult.reason.message
      : 'Failed to generate questions'
    console.error('[POST /api/speaking/start] question generation failed', msg)
    return NextResponse.json({ error: msg }, { status: 502 })
  }
  const questions = questionsResult.value

  return NextResponse.json({
    sessionId: session.id,
    topic,
    part: 1,
    questions,
  })
}
