// MiniMax TTS client — Speech-02 via MiniMax Audio API
// Server-side only. Never import from client components.
//
// ⚠️  IMPORTANT — API Key Requirements
// This client calls MiniMax's own API directly. It requires a NATIVE MiniMax API
// key from https://minimax.io/user-center/basic-information/interface-key
// (a "General API Key" that supports all modalities, NOT a Coding Plan key).
//
// An OpenRouter key (sk-or-v1-...) will always fail with error code 1004 because
// OpenRouter does not proxy the MiniMax TTS endpoint.
//
// Required env vars:
//   MINIMAX_API_KEY=<your minimax.io general api key>
//
// The international endpoint is used (works outside of mainland China).

import type { TTSOptions, TTSResult } from './types'

// International endpoint (US West) — works globally outside mainland China
const TTS_URL = 'https://api-uw.minimax.io/v1/t2a_v2'

/** Neutral, clear examiner-quality voice */
const DEFAULT_VOICE_ID = 'Calm_Woman'

function getApiKey(): string {
  const key = process.env.MINIMAX_API_KEY
  if (!key) throw new Error('[MiniMax TTS] MINIMAX_API_KEY is not set')

  // Detect a misconfigured OpenRouter key early and give a clear message
  if (key.startsWith('sk-or-')) {
    throw new Error(
      '[MiniMax TTS] MINIMAX_API_KEY appears to be an OpenRouter key (sk-or-...). ' +
      'This endpoint requires a native MiniMax API key from https://minimax.io/user-center/basic-information/interface-key'
    )
  }

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

  const audioHex = data.data?.audio
  if (!audioHex) {
    throw new Error('[MiniMax TTS] No audio data in response')
  }

  // MiniMax t2a_v2 returns audio as a HEX-encoded string (NOT base64).
  // e.g. "49443304..." where 49=I, 44=D, 33=3 → "ID3" MP3 header.
  if (audioHex.length % 2 !== 0) {
    throw new Error('[MiniMax TTS] Audio hex string has odd length — unexpected format')
  }
  const bytes = new Uint8Array(audioHex.length / 2)
  for (let i = 0; i < audioHex.length; i += 2) {
    bytes[i >> 1] = parseInt(audioHex.substring(i, i + 2), 16)
  }

  return {
    audioBuffer: bytes.buffer,
    contentType: 'audio/mpeg',
  }
}
