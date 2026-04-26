import { chatCompletion, parseJsonResponse } from '@/lib/ai/openrouter'
import {
  WRITING_EXAMINER_SYSTEM,
  getTask1AcademicPrompt,
  getTask1GTPrompt,
  getTask2Prompt,
} from '@/lib/ai/prompts/writing-examiner'
import {
  getTask1EvaluationPrompt,
  getTask2EvaluationPrompt,
} from '@/lib/ai/prompts/writing-evaluator'
import type { WritingEvaluation } from '@/lib/ai/types'
import type { WritingTaskType, ChartData } from '@/lib/db/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Round a number to the nearest 0.5 (IELTS band convention) */
function roundToHalf(n: number): number {
  return Math.round(n * 2) / 2
}

/** Clamp value to [0, 9] */
function clamp(n: number): number {
  return Math.max(0, Math.min(9, n))
}

/** Safely parse a score from LLM output */
function parseScore(raw: unknown): number {
  const n = typeof raw === 'string' ? parseFloat(raw) : Number(raw)
  return roundToHalf(clamp(isNaN(n) ? 5.0 : n))
}

// ── Prompt Generation ─────────────────────────────────────────────────────────

/**
 * Generate an AI writing prompt for a given task type.
 * Returns { promptText, promptType, chartData? }.
 * chartData is only present for task1_academic prompts.
 */
export async function generateWritingPrompt(
  taskType: 'task1_academic' | 'task1_gt' | 'task2',
  options: { promptTypeHint?: string; model?: string } = {}
): Promise<{ promptText: string; promptType: string; chartData: ChartData | null }> {
  let userPrompt: string
  if (taskType === 'task1_academic') {
    userPrompt = getTask1AcademicPrompt(options.promptTypeHint)
  } else if (taskType === 'task1_gt') {
    userPrompt = getTask1GTPrompt(options.promptTypeHint)
  } else {
    userPrompt = getTask2Prompt(options.promptTypeHint)
  }

  const { content } = await chatCompletion(
    [
      { role: 'system', content: WRITING_EXAMINER_SYSTEM },
      { role: 'user', content: userPrompt },
    ],
    { json: true, temperature: 0.85, max_tokens: 1200, ...(options.model ? { model: options.model } : {}) }
  )

  const raw = parseJsonResponse<{ prompt_type: string; prompt_text: string; chart_data?: ChartData }>(content)

  // Validate chart_data type field if present
  const chartData: ChartData | null = raw.chart_data?.type
    ? raw.chart_data
    : null

  return {
    promptText: raw.prompt_text?.trim() ?? '',
    promptType: raw.prompt_type?.trim() ?? taskType,
    chartData,
  }
}

// ── Evaluation ────────────────────────────────────────────────────────────────

/**
 * Evaluate a written answer against IELTS Writing criteria.
 * Returns a fully typed WritingEvaluation.
 */
export async function evaluateWriting(
  task: 1 | 2,
  testType: 'academic' | 'general',
  promptText: string,
  promptType: string,
  userAnswer: string,
  wordCount: number,
  model?: string
): Promise<WritingEvaluation> {
  const { system, user } =
    task === 1
      ? getTask1EvaluationPrompt(promptType, promptText, userAnswer, wordCount, testType)
      : getTask2EvaluationPrompt(promptType, promptText, userAnswer, wordCount)

  const { content } = await chatCompletion(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    { json: true, temperature: 0.2, max_tokens: 4000, ...(model ? { model } : {}) }
  )

  const raw = parseJsonResponse<Record<string, unknown>>(content)

  const cc  = parseScore(raw.coherence_cohesion)
  const lr  = parseScore(raw.lexical_resource)
  const gr  = parseScore(raw.grammatical_range)

  // Task 1: task_achievement; Task 2: task_response
  let taskCriterion: number
  let taskKey: 'task_achievement' | 'task_response'
  if (task === 1) {
    taskCriterion = parseScore(raw.task_achievement)
    taskKey = 'task_achievement'
  } else {
    taskCriterion = parseScore(raw.task_response)
    taskKey = 'task_response'
  }

  const overall = roundToHalf((taskCriterion + cc + lr + gr) / 4)

  const strengths = Array.isArray(raw.strengths)
    ? (raw.strengths as unknown[]).filter((s): s is string => typeof s === 'string').slice(0, 2)
    : ['Good effort']

  const improvements = Array.isArray(raw.improvements)
    ? (raw.improvements as unknown[]).filter((s): s is string => typeof s === 'string').slice(0, 2)
    : ['Keep practising']

  const feedback = typeof raw.feedback === 'string' ? raw.feedback : 'Answer evaluated.'

  const model_answer = typeof raw.model_answer === 'string' ? raw.model_answer.trim() : ''

  const band_breakdown = Array.isArray(raw.band_breakdown)
    ? (raw.band_breakdown as Record<string, unknown>[]).map(b => ({
        criterion: typeof b.criterion === 'string' ? b.criterion : '',
        score: parseScore(b.score),
        explanation: typeof b.explanation === 'string' ? b.explanation : '',
      }))
    : []

  return {
    [taskKey]: taskCriterion,
    coherence_cohesion: cc,
    lexical_resource: lr,
    grammatical_range: gr,
    overall,
    feedback,
    strengths,
    improvements,
    model_answer,
    band_breakdown,
  } as WritingEvaluation
}

// ── Overall Band Calculation ──────────────────────────────────────────────────

/**
 * Calculate the overall writing band from task bands.
 * Full test: Task 2 weighted ×2.
 */
export function calculateWritingOverall(
  task1Band: number | null,
  task2Band: number | null,
  taskType: WritingTaskType
): number {
  if (taskType === 'full' && task1Band !== null && task2Band !== null) {
    return roundToHalf((task1Band + task2Band * 2) / 3)
  }
  return roundToHalf(task1Band ?? task2Band ?? 0)
}
