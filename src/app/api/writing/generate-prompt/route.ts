import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateWritingPrompt } from '@/lib/ai/writing-engine'
import { getWritingSession, createWritingAnswer } from '@/lib/db/writing-sessions'

/**
 * POST /api/writing/generate-prompt
 * Body: { session_id: string, task: 1 | 2, prompt_type_hint?: string }
 * Response: { answer_id: string, prompt_text: string, prompt_type: string }
 */
export async function POST(req: Request): Promise<Response> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let session_id: string
  let task: 1 | 2
  let prompt_type_hint: string | undefined

  try {
    const body = await req.json() as Record<string, unknown>
    if (!body.session_id || typeof body.session_id !== 'string') {
      return NextResponse.json({ error: '`session_id` is required' }, { status: 400 })
    }
    if (body.task !== 1 && body.task !== 2) {
      return NextResponse.json({ error: '`task` must be 1 or 2' }, { status: 400 })
    }
    session_id = body.session_id
    task = body.task as 1 | 2
    prompt_type_hint = typeof body.prompt_type_hint === 'string' ? body.prompt_type_hint : undefined
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Verify session ownership (RLS-enforced)
  const session = await getWritingSession(session_id)
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  // Determine task type for prompt generation
  let promptTaskType: 'task1_academic' | 'task1_gt' | 'task2'
  if (task === 2) {
    promptTaskType = 'task2'
  } else if (session.task_type === 'task1_gt') {
    promptTaskType = 'task1_gt'
  } else {
    promptTaskType = 'task1_academic'
  }

  // Generate prompt via LLM
  let promptText: string
  let promptType: string
  let chartData = null
  try {
    const result = await generateWritingPrompt(promptTaskType, { promptTypeHint: prompt_type_hint })
    promptText = result.promptText
    promptType = result.promptType
    chartData = result.chartData
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to generate prompt'
    console.error('[POST /api/writing/generate-prompt]', msg)
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  // Insert placeholder answer row
  const { data: answer, error: dbError } = await createWritingAnswer({
    session_id,
    task,
    prompt_text: promptText,
    prompt_type: promptType,
    user_answer: '',
    word_count: 0,
    time_taken_seconds: null,
    band_score: null,
    feedback: null,
    chart_data: chartData,
  })

  if (dbError || !answer) {
    console.error('[POST /api/writing/generate-prompt] DB error', dbError)
    return NextResponse.json({ error: dbError ?? 'Failed to save prompt' }, { status: 500 })
  }

  return NextResponse.json({ answer_id: answer.id, prompt_text: promptText, prompt_type: promptType, chart_data: chartData })
}
