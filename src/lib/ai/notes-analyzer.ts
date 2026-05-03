// AI notes analysis — builds prompts from user notes and calls OpenRouter
// Server-side only. Never import from client components.

import { createHash } from 'crypto'
import { chatCompletion, parseJsonResponse } from './openrouter'
import type { ChatMessage } from './types'
import type { NoteWithScores, QuestionTypeAccuracy } from '@/lib/db/notes-insights'
import type { IeltsSkill } from '@/lib/db/types'

// ── Public types ──────────────────────────────────────────────────────────────

export interface SkillInsight {
  summary: string
  weak_areas: string[]
  action_items: string[]
}

export interface NotesAnalysis {
  listening: SkillInsight
  reading: SkillInsight
  writing: SkillInsight
  speaking: SkillInsight
}

const NOTES_ANALYSIS_MODEL = 'minimax/minimax-m2.7'

const NO_NOTES_INSIGHT: SkillInsight = {
  summary: 'No notes available for this skill yet.',
  weak_areas: [],
  action_items: [],
}

const DEFAULT_ANALYSIS: NotesAnalysis = {
  listening: { ...NO_NOTES_INSIGHT },
  reading: { ...NO_NOTES_INSIGHT },
  writing: { ...NO_NOTES_INSIGHT },
  speaking: { ...NO_NOTES_INSIGHT },
}

// ── Hash helpers ──────────────────────────────────────────────────────────────

/**
 * Compute a deterministic MD5 hash of the notes + accuracy data.
 * Used to detect whether the source data has changed since last generation.
 */
export function computeNotesHash(
  notes: NoteWithScores[],
  accuracy: QuestionTypeAccuracy[]
): string {
  const notesStr = notes.map((n) => `${n.test_date}|${n.notes}`).join('\n')
  const accuracyStr = accuracy
    .map((a) => `${a.question_type}:${a.correct}/${a.total}`)
    .sort()
    .join(',')
  const raw = notesStr + '||' + accuracyStr
  return createHash('md5').update(raw).digest('hex')
}

// ── Prompt builder ────────────────────────────────────────────────────────────

function formatBands(row: NoteWithScores): string {
  const parts: string[] = []
  if (row.listening_band !== null) parts.push(`L:${row.listening_band}`)
  if (row.reading_band !== null) parts.push(`R:${row.reading_band}`)
  if (row.writing_band !== null) parts.push(`W:${row.writing_band}`)
  if (row.speaking_band !== null) parts.push(`S:${row.speaking_band}`)
  return parts.length ? ` (${parts.join(' ')})` : ''
}

function buildNotesAnalysisPrompt(
  notes: NoteWithScores[],
  accuracy: QuestionTypeAccuracy[]
): ChatMessage[] {
  const systemPrompt = `You are an expert IELTS study advisor. Analyze a student's test notes and scores.

For EACH skill (listening, reading, writing, speaking):
- Summarize key patterns and recurring issues visible in the notes
- Identify up to 5 weak areas as short descriptive labels (e.g. "map labeling", "complex inference")
- Suggest 2–4 specific, actionable practice items

If a skill has no relevant notes at all, return summary "No notes available for this skill yet." with empty arrays.

Notes in test_results cover all skills together. Infer skill relevance from which bands are recorded and what the student wrote.
Additional listening data: question-type accuracy breakdown is provided if available.

Return ONLY valid JSON in this exact shape (no extra keys, no markdown):
{
  "listening": { "summary": "...", "weak_areas": ["..."], "action_items": ["..."] },
  "reading":   { "summary": "...", "weak_areas": ["..."], "action_items": ["..."] },
  "writing":   { "summary": "...", "weak_areas": ["..."], "action_items": ["..."] },
  "speaking":  { "summary": "...", "weak_areas": ["..."], "action_items": ["..."] }
}`

  const noteLines = notes
    .map((n, i) => {
      const label = n.result_name ? ` ${n.result_name}` : ''
      return `${i + 1}. [${n.test_date}]${label}${formatBands(n)} — "${n.notes}"`
    })
    .join('\n')

  let userContent = `## Test Notes (newest first):\n${noteLines}`

  if (accuracy.length > 0) {
    const accuracyLines = accuracy
      .map((a) => `- ${a.question_type}: ${a.correct}/${a.total} (${Math.round((a.correct / a.total) * 100)}%)`)
      .join('\n')
    userContent += `\n\n## Listening Question-Type Accuracy:\n${accuracyLines}`
  }

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent },
  ]
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Analyze the user's notes and return structured insights per IELTS skill.
 * Returns default placeholders without calling the LLM if notes are empty.
 */
export async function analyzeNotes(
  notes: NoteWithScores[],
  listeningAccuracy: QuestionTypeAccuracy[]
): Promise<NotesAnalysis> {
  if (notes.length === 0) return DEFAULT_ANALYSIS

  const messages = buildNotesAnalysisPrompt(notes, listeningAccuracy)

  const result = await chatCompletion(messages, {
    model: NOTES_ANALYSIS_MODEL,
    json: true,
    temperature: 0.4,
    max_tokens: 2000,
  })

  const parsed = parseJsonResponse<Partial<Record<IeltsSkill, Partial<SkillInsight>>>>(result.content)

  // Merge parsed result with defaults so missing skills never throw
  const skills: IeltsSkill[] = ['listening', 'reading', 'writing', 'speaking']
  const analysis = { ...DEFAULT_ANALYSIS }

  for (const skill of skills) {
    const raw = parsed[skill]
    if (raw) {
      analysis[skill] = {
        summary: typeof raw.summary === 'string' && raw.summary.trim()
          ? raw.summary.trim()
          : NO_NOTES_INSIGHT.summary,
        weak_areas: Array.isArray(raw.weak_areas) ? raw.weak_areas.filter(Boolean) : [],
        action_items: Array.isArray(raw.action_items) ? raw.action_items.filter(Boolean) : [],
      }
    }
  }

  return analysis
}
