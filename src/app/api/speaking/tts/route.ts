import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { textToSpeech } from '@/lib/ai/minimax-tts'

/**
 * POST /api/speaking/tts
 * Body: { text: string; voice_id?: string; speed?: number }
 * Returns: audio/mpeg stream
 *
 * Auth required: rejects unauthenticated requests.
 */
export async function POST(req: Request): Promise<Response> {
  // Auth guard
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse body
  let text: string
  let voice_id: string | undefined
  let speed: number | undefined

  try {
    const body = await req.json() as { text?: unknown; voice_id?: unknown; speed?: unknown }
    if (!body.text || typeof body.text !== 'string') {
      return NextResponse.json({ error: '`text` is required' }, { status: 400 })
    }
    text = body.text.trim()
    if (!text) {
      return NextResponse.json({ error: '`text` must not be empty' }, { status: 400 })
    }
    // Max 1000 chars per TTS call (question text is always short)
    if (text.length > 1000) {
      return NextResponse.json({ error: '`text` exceeds 1000 character limit' }, { status: 400 })
    }
    voice_id = typeof body.voice_id === 'string' ? body.voice_id : undefined
    speed = typeof body.speed === 'number' ? body.speed : undefined
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Generate TTS audio
  try {
    const { audioBuffer, contentType } = await textToSpeech(text, { voice_id, speed })

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(audioBuffer.byteLength),
        // Allow browser to cache TTS audio for identical text
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'TTS generation failed'
    console.error('[POST /api/speaking/tts]', message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
