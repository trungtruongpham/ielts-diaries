import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createWritingSession } from '@/lib/db/writing-sessions'
import type { WritingTaskType } from '@/lib/db/types'

const VALID_TASK_TYPES = new Set<string>(['task1_academic', 'task1_gt', 'task2', 'full'])

/**
 * POST /api/writing/start
 * Body: { task_type: WritingTaskType, test_type?: 'academic' | 'general' }
 * Response: { session_id: string }
 */
export async function POST(req: Request): Promise<Response> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let task_type: WritingTaskType
  let test_type: 'academic' | 'general' = 'academic'

  try {
    const body = await req.json() as Record<string, unknown>
    if (!body.task_type || typeof body.task_type !== 'string' || !VALID_TASK_TYPES.has(body.task_type)) {
      return NextResponse.json({ error: '`task_type` must be one of: task1_academic, task1_gt, task2, full' }, { status: 400 })
    }
    task_type = body.task_type as WritingTaskType
    if (body.test_type === 'general') test_type = 'general'
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { data: session, error } = await createWritingSession({ task_type, test_type })
  if (error || !session) {
    console.error('[POST /api/writing/start]', error)
    return NextResponse.json({ error: error ?? 'Failed to create session' }, { status: 500 })
  }

  return NextResponse.json({ session_id: session.id })
}
