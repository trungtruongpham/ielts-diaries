import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateWritingOverall } from '@/lib/ai/writing-engine'
import { getWritingSession, getWritingSessionAnswers, completeWritingSession } from '@/lib/db/writing-sessions'

/**
 * POST /api/writing/complete
 * Body: { session_id: string }
 * Response: { task1_band, task2_band, overall_band }
 */
export async function POST(req: Request): Promise<Response> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let session_id: string
  try {
    const body = await req.json() as { session_id?: unknown }
    if (!body.session_id || typeof body.session_id !== 'string') {
      return NextResponse.json({ error: '`session_id` is required' }, { status: 400 })
    }
    session_id = body.session_id
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const session = await getWritingSession(session_id)
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  // Idempotent — return current bands if already completed
  if (session.status === 'completed') {
    return NextResponse.json({
      task1_band: session.task1_band,
      task2_band: session.task2_band,
      overall_band: session.overall_band,
    })
  }

  // Aggregate answer band scores per task
  const answers = await getWritingSessionAnswers(session_id)
  const task1Answer = answers.find(a => a.task === 1)
  const task2Answer = answers.find(a => a.task === 2)

  const task1_band = task1Answer?.band_score ?? null
  const task2_band = task2Answer?.band_score ?? null
  const overall_band = calculateWritingOverall(task1_band, task2_band, session.task_type)

  const { data: completed, error } = await completeWritingSession(session_id, {
    task1_band,
    task2_band,
    overall_band,
  })

  if (error || !completed) {
    console.error('[POST /api/writing/complete]', error)
    return NextResponse.json({ error: error ?? 'Failed to complete session' }, { status: 500 })
  }

  return NextResponse.json({ task1_band, task2_band, overall_band })
}
