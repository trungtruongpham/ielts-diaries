// MiniMax TTS client — Speech-02 via MiniMax Audio API
// Server-side only. Never import from client components.

import type { TTSOptions, TTSResult } from './types'

const TTS_URL = 'https://api.minimax.io/v1/t2a_v2'

/** Neutral, clear examiner-quality voice */
const DEFAULT_VOICE_ID = 'Calm_Woman'

function getApiKey(): string {
  const key = process.env.MINIMAX_API_KEY
  if (!key) throw new Error('[MiniMax TTS] MINIMAX_API_KEY is not set')
  return key
}

/**
 * Convert text to speech using MiniMax Speech-02.
 * Returns an ArrayBuffer of audio/mpeg (mp3) data.
 */
export async function textToSpeech(
  text: string,
  options: TTSOptions = {}
): Promise<TTSResult> {
  const {
    voice_id = DEFAULT_VOICE_ID,
    speed = 1.0,
    volume = 5,
  } = options

  const res = await fetch(TTS_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'speech-02-hd',
      text,
      voice_setting: {
        voice_id,
        speed,
        vol: volume,
        pitch: 0,
      },
      audio_setting: {
        sample_rate: 32000,
        bitrate: 128000,
        format: 'mp3',
        channel: 1,
      },
    }),
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error')
    throw new Error(`[MiniMax TTS] API error ${res.status}: ${errorText}`)
  }

  // MiniMax TTS returns JSON containing a base64-encoded audio file
  const data = await res.json() as {
    data?: { audio?: string }
    base_resp?: { status_code: number; status_msg: string }
  }

  // Check for API-level errors (HTTP 200 but error in body)
  if (data.base_resp && data.base_resp.status_code !== 0) {
    throw new Error(
      `[MiniMax TTS] API error: ${data.base_resp.status_msg} (code ${data.base_resp.status_code})`
    )
  }

  const audioBase64 = data.data?.audio
  if (!audioBase64) {
    throw new Error('[MiniMax TTS] No audio data in response')
  }

  // Decode base64 → ArrayBuffer
  const binaryString = atob(audioBase64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  return {
    audioBuffer: bytes.buffer,
    contentType: 'audio/mpeg',
  }
}
