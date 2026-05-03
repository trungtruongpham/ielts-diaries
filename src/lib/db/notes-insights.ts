// Notes insights query utilities (server-side only)
import { createClient } from '@/lib/supabase/server'
import type { DbSkillNoteInsight, IeltsSkill } from './types'

// ── Shape returned for LLM prompt building ────────────────────────────────────

export interface NoteWithScores {
  notes: string
  test_date: string
  result_name: string | null
  listening_band: number | null
  reading_band: number | null
  writing_band: number | null
  speaking_band: number | null
}

export interface QuestionTypeAccuracy {
  question_type: string
  total: number
  correct: number
}

// ── Read helpers ──────────────────────────────────────────────────────────────

/**
 * Fetch all skill insights for the current user, ordered by skill name
 */
export async function getInsightsForUser(): Promise<DbSkillNoteInsight[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('skill_notes_insights')
    .select('*')
    .order('skill', { ascending: true })

  if (error) {
    console.error('[getInsightsForUser]', error)
    return []
  }

  return data as DbSkillNoteInsight[]
}

/**
 * Fetch all test results that have notes, ordered newest first.
 * Capped at 50 results; each note truncated to 2000 chars.
 */
export async function getUserNotesWithScores(): Promise<NoteWithScores[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('test_results')
    .select('notes, test_date, result_name, listening_band, reading_band, writing_band, speaking_band')
    .not('notes', 'is', null)
    .neq('notes', '')
    .order('test_date', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[getUserNotesWithScores]', error)
    return []
  }

  return (data as NoteWithScores[]).map((row) => ({
    ...row,
    notes: row.notes.slice(0, 2000),
  }))
}

/**
 * Compute per-question-type accuracy from the user's listening attempts.
 * Joins attempts → sections → questions and checks submitted answers vs answer_key.
 */
export async function getListeningQuestionTypeAccuracy(
  userId: string
): Promise<QuestionTypeAccuracy[]> {
  const supabase = await createClient()

  // Fetch completed attempts for this user
  const { data: attempts, error: attemptsError } = await supabase
    .from('listening_attempts')
    .select('id, test_id, answers')
    .eq('user_id', userId)
    .not('completed_at', 'is', null)

  if (attemptsError || !attempts?.length) {
    console.error('[getListeningQuestionTypeAccuracy] attempts error', attemptsError)
    return []
  }

  const testIds = [...new Set(attempts.map((a) => a.test_id))]

  // Fetch all questions for those tests (with answer_key via server client which has full access)
  const { data: sections, error: sectionsError } = await supabase
    .from('listening_sections')
    .select('id, test_id')
    .in('test_id', testIds)

  if (sectionsError || !sections?.length) return []

  const sectionIds = sections.map((s) => s.id)
  const sectionTestMap = Object.fromEntries(sections.map((s) => [s.id, s.test_id]))

  const { data: questions, error: questionsError } = await supabase
    .from('listening_questions')
    .select('id, section_id, question_number, question_type, answer_key')
    .in('section_id', sectionIds)

  if (questionsError || !questions?.length) return []

  // Build a map: testId → question_number → { question_type, answer_key }
  const testQuestionMap: Record<string, Record<number, { question_type: string; answer_key: unknown }>> = {}
  for (const q of questions) {
    const testId = sectionTestMap[q.section_id]
    if (!testId) continue
    if (!testQuestionMap[testId]) testQuestionMap[testId] = {}
    testQuestionMap[testId][q.question_number] = {
      question_type: q.question_type,
      answer_key: q.answer_key,
    }
  }

  // Tally correct/total per question type across all attempts
  const stats: Record<string, { total: number; correct: number }> = {}

  for (const attempt of attempts) {
    const questionsForTest = testQuestionMap[attempt.test_id]
    if (!questionsForTest) continue

    const answers = attempt.answers as Record<string, string | string[]>

    for (const [qNumStr, submitted] of Object.entries(answers)) {
      const qNum = Number(qNumStr)
      const qData = questionsForTest[qNum]
      if (!qData) continue

      const { question_type, answer_key } = qData
      if (!stats[question_type]) stats[question_type] = { total: 0, correct: 0 }
      stats[question_type].total += 1

      if (isAnswerCorrect(question_type, submitted, answer_key)) {
        stats[question_type].correct += 1
      }
    }
  }

  return Object.entries(stats).map(([question_type, { total, correct }]) => ({
    question_type,
    total,
    correct,
  }))
}

// ── Write helpers ─────────────────────────────────────────────────────────────

/**
 * Upsert a single skill insight row.
 * On conflict (user_id, skill) the row is updated in place.
 */
export async function upsertInsight(
  userId: string,
  skill: IeltsSkill,
  insight: {
    summary: string
    weak_areas: string[]
    action_items: string[]
    notes_hash: string
    notes_analyzed_count: number
  }
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('skill_notes_insights')
    .upsert(
      {
        user_id: userId,
        skill,
        summary: insight.summary,
        weak_areas: insight.weak_areas,
        action_items: insight.action_items,
        notes_hash: insight.notes_hash,
        notes_analyzed_count: insight.notes_analyzed_count,
        generated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,skill' }
    )

  if (error) {
    console.error('[upsertInsight]', skill, error)
    return { error: error.message }
  }

  return { error: null }
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function isAnswerCorrect(questionType: string, submitted: string | string[], answerKey: unknown): boolean {
  if (!submitted) return false

  try {
    switch (questionType) {
      case 'multiple_choice': {
        const key = answerKey as { answer: string }
        return typeof submitted === 'string' &&
          submitted.trim().toLowerCase() === key.answer.trim().toLowerCase()
      }
      case 'multiple_select': {
        const key = answerKey as { answers: string[] }
        if (!Array.isArray(submitted)) return false
        const norm = (v: string) => v.trim().toLowerCase()
        return submitted.length === key.answers.length &&
          submitted.every((s) => key.answers.some((a) => norm(a) === norm(s)))
      }
      case 'fill_blank':
      case 'table_fill': {
        const key = answerKey as { acceptable: string[] }
        return typeof submitted === 'string' &&
          key.acceptable.some((a) => a.trim().toLowerCase() === submitted.trim().toLowerCase())
      }
      case 'matching': {
        const key = answerKey as { matches: Record<number, string> }
        return typeof submitted === 'string' &&
          Object.values(key.matches).some((v) => v.trim().toLowerCase() === submitted.trim().toLowerCase())
      }
      case 'map_label': {
        const key = answerKey as { answers: Record<string, string> }
        return typeof submitted === 'string' &&
          Object.values(key.answers).some((v) => v.trim().toLowerCase() === submitted.trim().toLowerCase())
      }
      default:
        return false
    }
  } catch {
    return false
  }
}
