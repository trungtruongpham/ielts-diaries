// OpenRouter API client — supports multiple models via OpenRouter
// Server-side only. Never import from client components.

import type { ChatMessage, ChatCompletionOptions, ChatCompletionResult } from './types'
import { modelSupportsJsonMode } from './models'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'minimax/minimax-m2.5'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) throw new Error('[OpenRouter] OPENROUTER_API_KEY is not set')
  return key
}

/**
 * Send a chat completion request to OpenRouter.
 * Uses options.model if provided, otherwise falls back to the default MODEL.
 * Returns the assistant message content as a string.
 */
export async function chatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
): Promise<ChatCompletionResult> {
  const { temperature = 0.7, max_tokens = 2048, json = false, model = MODEL } = options

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature,
    max_tokens,
  }

  if (json && modelSupportsJsonMode(model)) {
    body.response_format = { type: 'json_object' }
  }

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
      // Required by OpenRouter for attribution
      'HTTP-Referer': APP_URL,
      'X-Title': 'IELTS Diaries',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error')
    throw new Error(`[OpenRouter] API error ${res.status}: ${errorText}`)
  }

  const data = await res.json() as {
    choices: Array<{ message: { content: string } }>
    model: string
    usage?: { prompt_tokens: number; completion_tokens: number }
  }

  const content = data.choices[0]?.message?.content
  if (!content) throw new Error('[OpenRouter] Empty response from API')

  return {
    content,
    model: data.model,
    usage: data.usage,
  }
}

/**
 * Parse JSON from LLM response content.
 * Strips markdown code fences if the model wraps output in ```json ... ```.
 */
export function parseJsonResponse<T>(content: string): T {
  // Strip markdown code fences if present
  const stripped = content
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  try {
    return JSON.parse(stripped) as T
  } catch {
    throw new Error(`[OpenRouter] Failed to parse JSON response: ${stripped.slice(0, 200)}`)
  }
}
