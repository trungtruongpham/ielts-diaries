// Audio utilities — client-side helpers for the speaking practice feature

/** Check what audio features the current browser supports */
export function checkAudioSupport(): {
  mediaRecorder: boolean
  speechRecognition: boolean
  getUserMedia: boolean
} {
  if (typeof window === 'undefined') {
    return { mediaRecorder: false, speechRecognition: false, getUserMedia: false }
  }
  return {
    mediaRecorder: typeof MediaRecorder !== 'undefined',
    speechRecognition:
      typeof window.SpeechRecognition !== 'undefined' ||
      typeof window.webkitSpeechRecognition !== 'undefined',
    getUserMedia:
      typeof navigator.mediaDevices !== 'undefined' &&
      typeof navigator.mediaDevices.getUserMedia === 'function',
  }
}

/** Create an object URL for immediate playback. Remember to revoke when done. */
export function createAudioUrl(blob: Blob): string {
  return URL.createObjectURL(blob)
}

/** Format seconds into MM:SS string */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * Upload an audio blob to Supabase Storage via a client-side Supabase client.
 * Path: {userId}/{sessionId}/{part}-{questionIndex}.webm
 * Returns a signed URL (valid 24h) for storage and playback.
 */
export async function uploadAudioBlob(params: {
  userId: string
  sessionId: string
  part: number
  questionIndex: number
  blob: Blob
}): Promise<string | null> {
  const { userId, sessionId, part, questionIndex, blob } = params

  // Dynamically import to keep this tree-shakable and SSR-safe
  const { createClient } = await import('@/lib/supabase/client')
  const supabase = createClient()

  const ext = blob.type.includes('ogg') ? 'ogg' : 'webm'
  const path = `${userId}/${sessionId}/${part}-${questionIndex}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('speaking-recordings')
    .upload(path, blob, {
      contentType: blob.type || 'audio/webm',
      upsert: true,
    })

  if (uploadError) {
    console.error('[uploadAudioBlob]', uploadError.message)
    return null
  }

  const { data } = await supabase.storage
    .from('speaking-recordings')
    .createSignedUrl(path, 86400)  // 24h

  return data?.signedUrl ?? null
}

// ── AudioContext unlock ────────────────────────────────────────────────────────
// Browsers require a user gesture before AudioContext can play audio.
// We keep a single lazily-created context and resume it on first interaction.

let _audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  }
  return _audioCtx
}

/**
 * Must be called directly inside a click/touch handler (synchronously) to
 * unlock the AudioContext on browsers that require a user gesture.
 * Safe to call multiple times.
 */
export function unlockAudioContext(): void {
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => { /* best-effort */ })
    }
  } catch {
    // No AudioContext support — silent fallback
  }
}

/**
 * Play TTS audio from the /api/speaking/tts route.
 *
 * Primary path: AudioContext + AudioBufferSourceNode (bypasses autoplay policy
 * once the context is unlocked via a user gesture with unlockAudioContext()).
 * Fallback path: HTMLAudioElement (ObjectURL), used if AudioContext decode fails.
 *
 * Returns when audio finishes playing, or rejects on error.
 */
export async function playTTS(text: string): Promise<void> {
  const res = await fetch('/api/speaking/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })

  if (!res.ok) {
    throw new Error(`TTS request failed: ${res.status}`)
  }

  // Keep the original buffer available for the HTML fallback —
  // decodeAudioData DETACHES the ArrayBuffer it receives, so we pass a copy.
  const arrayBuffer = await res.arrayBuffer()

  // ── Primary: AudioContext ─────────────────────────────────────────────────
  try {
    const ctx = getAudioContext()

    if (ctx.state === 'suspended') {
      await ctx.resume()
    }

    const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0))

    return new Promise((resolve, reject) => {
      const source = ctx.createBufferSource()
      source.buffer = audioBuffer
      source.connect(ctx.destination)
      source.addEventListener('ended', () => resolve())
      try {
        source.start(0)
      } catch (err) {
        reject(err)
      }
    })
  } catch (ctxErr) {
    // ── Fallback: HTMLAudioElement ──────────────────────────────────────────
    console.warn('[playTTS] AudioContext failed, falling back to HTMLAudioElement:', ctxErr)

    const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' })
    const url = URL.createObjectURL(blob)

    return new Promise((resolve, reject) => {
      const audio = new Audio(url)
      audio.oncanplaythrough = () => {
        audio.play().catch(err => {
          URL.revokeObjectURL(url)
          reject(err)
        })
      }
      audio.onended = () => { URL.revokeObjectURL(url); resolve() }
      audio.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Audio playback failed'))
      }
      audio.load()
    })
  }
}

