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

/**
 * Play TTS audio from the /api/speaking/tts route.
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

  const arrayBuffer = await res.arrayBuffer()
  const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' })
  const url = URL.createObjectURL(audioBlob)

  return new Promise((resolve, reject) => {
    const audio = new Audio(url)
    audio.onended = () => {
      URL.revokeObjectURL(url)
      resolve()
    }
    audio.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Audio playback failed'))
    }
    audio.play().catch(reject)
  })
}
