// ── AI types shared across speaking practice feature ──────────────────────────

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionOptions {
  temperature?: number
  max_tokens?: number
  /** Force JSON output */
  json?: boolean
}

export interface ChatCompletionResult {
  content: string
  model: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
  }
}

export interface TTSOptions {
  /** MiniMax voice ID. Default: 'Calm_Woman' (neutral examiner-like tone) */
  voice_id?: string
  /** 0.5–2.0. Default: 1.0 */
  speed?: number
  /** 0–10. Default: 5 */
  volume?: number
}

export interface TTSResult {
  audioBuffer: ArrayBuffer
  contentType: 'audio/mpeg'
}

// ── IELTS Speaking types ───────────────────────────────────────────────────────

export interface SpeakingQuestion {
  text: string
  type: 'part1' | 'part2-topic' | 'part3'
  /** Only for Part 2 */
  topicCard?: Part2TopicCard
}

export interface Part2TopicCard {
  topic: string
  prompt: string          // e.g. "Describe a place you visited"
  bullets: string[]       // 3-4 "You should say:" bullet points
  followUp: string        // extra "and explain..." bullet
}

export interface SpeakingEvaluation {
  fluency_coherence: number      // 0–9 in 0.5 steps
  lexical_resource: number
  grammatical_range: number
  pronunciation: number
  overall: number                // avg of above, rounded to nearest 0.5
  feedback: string               // 2-3 sentence overall comment
  strengths: string[]            // 1-2 items
  improvements: string[]         // 1-2 items
  sample_answer: string          // Band 7-8 model answer for this question
}

export interface SpeakingSessionScores {
  fluency_band: number
  lexical_band: number
  grammar_band: number
  pronunciation_band: number
  overall_band: number
}

// ── IELTS Writing types ────────────────────────────────────────────────────

export interface WritingEvaluation {
  task_achievement?: number     // Task 1 only (0–9, 0.5 steps)
  task_response?: number        // Task 2 only (0–9, 0.5 steps)
  coherence_cohesion: number
  lexical_resource: number
  grammatical_range: number
  overall: number               // avg of 4 criteria, nearest 0.5
  feedback: string
  strengths: string[]
  improvements: string[]
  model_answer: string
  band_breakdown: {
    criterion: string
    score: number
    explanation: string
  }[]
}
