// Core speaking engine — question generation + evaluation
// Server-side only. Used by API routes.

import { chatCompletion, parseJsonResponse } from '@/lib/ai/openrouter'
import {
  SPEAKING_EXAMINER_SYSTEM,
  getPartOnePrompt,
  getPartTwoPrompt,
  getPartThreePrompt,
  randomPart1Topic,
} from '@/lib/ai/prompts/speaking-examiner'
import { getEvaluationPrompt } from '@/lib/ai/prompts/speaking-evaluator'
import type {
  SpeakingQuestion,
  Part2TopicCard,
  SpeakingEvaluation,
  SpeakingSessionScores,
} from '@/lib/ai/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Round a number to the nearest 0.5 (IELTS band convention) */
function roundToHalf(n: number): number {
  return Math.round(n * 2) / 2
}

/** Clamp value to [0, 9] */
function clamp(n: number): number {
  return Math.max(0, Math.min(9, n))
}

/** Safely parse a score from LLM output (number or string) */
function parseScore(raw: unknown): number {
  const n = typeof raw === 'string' ? parseFloat(raw) : Number(raw)
  return roundToHalf(clamp(isNaN(n) ? 5.0 : n))
}

// ── Question Generation ───────────────────────────────────────────────────────

/**
 * Generate questions for a given IELTS Speaking part.
 *
 * @param part    1 | 2 | 3
 * @param context Optional: { topic } for Part 1, { part2Topic } for Part 3
 * @returns       Array of SpeakingQuestion (Part 2 returns a single item with topicCard)
 */
export async function generatePartQuestions(
  part: 1 | 2 | 3,
  context: { topic?: string; part2Topic?: string } = {}
): Promise<SpeakingQuestion[]> {
  const topic = context.topic ?? randomPart1Topic()

  if (part === 1) {
    const userPrompt = getPartOnePrompt(topic)
    const { content } = await chatCompletion(
      [
        { role: 'system', content: SPEAKING_EXAMINER_SYSTEM },
        { role: 'user', content: userPrompt },
      ],
      { json: true, temperature: 0.8 }
    )

    // Parse: expect string[] or { questions: string[] }
    const raw = parseJsonResponse<string[] | { questions: string[] }>(content)
    const questions: string[] = Array.isArray(raw) ? raw : (raw as { questions: string[] }).questions

    return questions.slice(0, 5).map(text => ({
      text,
      type: 'part1' as const,
    }))
  }

  if (part === 2) {
    const userPrompt = getPartTwoPrompt()
    const { content } = await chatCompletion(
      [
        { role: 'system', content: SPEAKING_EXAMINER_SYSTEM },
        { role: 'user', content: userPrompt },
      ],
      { json: true, temperature: 0.9 }
    )

    const card = parseJsonResponse<Part2TopicCard>(content)

    return [
      {
        text: card.prompt,
        type: 'part2-topic' as const,
        topicCard: card,
      },
    ]
  }

  // Part 3
  const part2Topic = context.part2Topic ?? 'a memorable experience'
  const userPrompt = getPartThreePrompt(part2Topic)
  const { content } = await chatCompletion(
    [
      { role: 'system', content: SPEAKING_EXAMINER_SYSTEM },
      { role: 'user', content: userPrompt },
    ],
    { json: true, temperature: 0.8 }
  )

  const raw = parseJsonResponse<string[] | { questions: string[] }>(content)
  const questions: string[] = Array.isArray(raw) ? raw : (raw as { questions: string[] }).questions

  return questions.slice(0, 5).map(text => ({
    text,
    type: 'part3' as const,
  }))
}

// ── Evaluation ────────────────────────────────────────────────────────────────

/**
 * Evaluate a single spoken answer against IELTS rubric criteria.
 * Returns structured scoring + feedback.
 */
export async function evaluateAnswer(
  part: 1 | 2 | 3,
  question: string,
  transcript: string,
  durationSeconds: number
): Promise<SpeakingEvaluation> {
  const { system, user } = getEvaluationPrompt(part, question, transcript, durationSeconds)

  const { content } = await chatCompletion(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    { json: true, temperature: 0.3 }  // Low temp for consistent scoring
  )

  const raw = parseJsonResponse<Record<string, unknown>>(content)

  const fc = parseScore(raw.fluency_coherence)
  const lr = parseScore(raw.lexical_resource)
  const gr = parseScore(raw.grammatical_range)
  const p  = parseScore(raw.pronunciation)
  const overall = roundToHalf((fc + lr + gr + p) / 4)

  const strengths = Array.isArray(raw.strengths)
    ? (raw.strengths as unknown[]).filter((s): s is string => typeof s === 'string').slice(0, 2)
    : ['Good effort']

  const improvements = Array.isArray(raw.improvements)
    ? (raw.improvements as unknown[]).filter((s): s is string => typeof s === 'string').slice(0, 2)
    : ['Keep practising']

  const feedback = typeof raw.feedback === 'string'
    ? raw.feedback
    : 'Response evaluated.'

  return {
    fluency_coherence: fc,
    lexical_resource: lr,
    grammatical_range: gr,
    pronunciation: p,
    overall,
    feedback,
    strengths,
    improvements,
  }
}

// ── Session Score Aggregation ─────────────────────────────────────────────────

/**
 * Calculate final session band scores from all per-answer evaluations.
 * Averages each criterion across all answers, rounds to nearest 0.5.
 */
export function calculateSpeakingOverall(
  evaluations: SpeakingEvaluation[]
): SpeakingSessionScores {
  if (evaluations.length === 0) {
    return {
      fluency_band: 0,
      lexical_band: 0,
      grammar_band: 0,
      pronunciation_band: 0,
      overall_band: 0,
    }
  }

  const avg = (getter: (e: SpeakingEvaluation) => number): number => {
    const sum = evaluations.reduce((acc, e) => acc + getter(e), 0)
    return roundToHalf(sum / evaluations.length)
  }

  const fluency_band    = avg(e => e.fluency_coherence)
  const lexical_band    = avg(e => e.lexical_resource)
  const grammar_band    = avg(e => e.grammatical_range)
  const pronunciation_band = avg(e => e.pronunciation)
  const overall_band    = roundToHalf(
    (fluency_band + lexical_band + grammar_band + pronunciation_band) / 4
  )

  return { fluency_band, lexical_band, grammar_band, pronunciation_band, overall_band }
}
