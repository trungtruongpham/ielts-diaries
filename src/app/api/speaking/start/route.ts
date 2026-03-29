import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generatePartQuestions } from '@/lib/ai/speaking-engine'
import {
  randomPart1Topic,
  randomPart3Topic,
} from '@/lib/ai/prompts/speaking-examiner'
import { createSpeakingSession } from '@/lib/db/speaking-sessions'
import type { PracticeMode } from '@/lib/db/types'

const VALID_MODES = new Set<string>(['part1', 'part2', 'part3', 'full'])

/**
 * POST /api/speaking/start
 * Body (optional): { practiceMode?: 'part1' | 'part2' | 'part3' | 'full' }
 *
 * Creates a new speaking session, determines the starting part from practiceMode,
 * generates questions for that part, and returns them with the session ID.
 *
 * Response: { sessionId, topic, part, questions, practiceMode }
 */
export async function POST(req: Request): Promise<Response> {
  // Auth guard
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse optional body — defaults to 'full' for backward compatibility
  let practiceMode: PracticeMode = 'full'
  try {
    const body = await req.json() as { practiceMode?: unknown }
    if (typeof body.practiceMode === 'string' && VALID_MODES.has(body.practiceMode)) {
      practiceMode = body.practiceMode as PracticeMode
    }
  } catch {
    // No body or invalid JSON → use default 'full'
  }

  // Determine starting part from mode
  const startPart: 1 | 2 | 3 =
    practiceMode === 'part2' ? 2 :
    practiceMode === 'part3' ? 3 :
    1  // 'part1' and 'full' both start at Part 1

  // Pick topic string appropriate for the starting part
  const topic: string | undefined =
    startPart === 1 ? randomPart1Topic() :
    startPart === 3 ? randomPart3Topic() :
    undefined  // Part 2 has no pre-selected topic — the card IS the topic

  // Generate questions for the starting part + create session in parallel
  const [questionsResult, sessionResult] = await Promise.allSettled([
    generatePartQuestions(startPart, {
      topic: startPart === 1 ? topic : undefined,
      part2Topic: startPart === 3 ? topic : undefined,
    }),
    createSpeakingSession(topic, practiceMode),
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
    part: startPart,
    questions,
    practiceMode,
  })
}
