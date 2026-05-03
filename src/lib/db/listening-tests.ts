// Listening test query utilities (server-side only)
import { createClient } from '@/lib/supabase/server'
import type {
  DbListeningTest,
  DbListeningSection,
  DbListeningQuestion,
  DbListeningQuestionWithKey,
} from './types'

// ── Tests ─────────────────────────────────────────────────────────────────────

/** Fetch all published tests ordered by CAM book + test number */
export async function getPublishedListeningTests(): Promise<DbListeningTest[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('listening_tests')
    .select('*')
    .eq('is_published', true)
    .order('cam_book', { ascending: true })
    .order('test_number', { ascending: true })

  if (error) {
    console.error('[getPublishedListeningTests]', error)
    return []
  }

  return data as DbListeningTest[]
}

/** Fetch one test with its 4 sections */
export async function getListeningTestWithSections(
  testId: string
): Promise<{ test: DbListeningTest; sections: DbListeningSection[] } | null> {
  const supabase = await createClient()

  const { data: test, error: testError } = await supabase
    .from('listening_tests')
    .select('*')
    .eq('id', testId)
    .eq('is_published', true)
    .single()

  if (testError || !test) {
    console.error('[getListeningTestWithSections] test fetch:', testError)
    return null
  }

  const { data: sections, error: sectionsError } = await supabase
    .from('listening_sections')
    .select('*')
    .eq('test_id', testId)
    .order('section_number', { ascending: true })

  if (sectionsError) {
    console.error('[getListeningTestWithSections] sections fetch:', sectionsError)
    return null
  }

  return {
    test: test as DbListeningTest,
    sections: (sections ?? []) as DbListeningSection[],
  }
}

// ── Questions ─────────────────────────────────────────────────────────────────

/**
 * Fetch all questions for a section — answer_key EXCLUDED (never sent to client).
 */
export async function getSectionQuestions(
  sectionId: string
): Promise<DbListeningQuestion[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('listening_questions')
    .select('id, section_id, question_number, question_type, group_id, group_context, question_data, created_at')
    .eq('section_id', sectionId)
    .order('question_number', { ascending: true })

  if (error) {
    console.error('[getSectionQuestions]', error)
    return []
  }

  return data as DbListeningQuestion[]
}

/**
 * Fetch questions WITH answer_key — for server-side scoring and results review only.
 * NEVER pass this data to the client component directly.
 */
export async function getSectionQuestionsWithAnswers(
  sectionId: string
): Promise<DbListeningQuestionWithKey[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('listening_questions')
    .select('*')
    .eq('section_id', sectionId)
    .order('question_number', { ascending: true })

  if (error) {
    console.error('[getSectionQuestionsWithAnswers]', error)
    return []
  }

  return data as DbListeningQuestionWithKey[]
}

/**
 * Fetch answer keys for a section (question_number → answer_key map).
 * Server-side only — used in scoring server action.
 */
export async function getSectionAnswerKeys(
  sectionId: string
): Promise<Record<number, unknown>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('listening_questions')
    .select('question_number, answer_key')
    .eq('section_id', sectionId)

  if (error) {
    console.error('[getSectionAnswerKeys]', error)
    return {}
  }

  return Object.fromEntries(
    (data ?? []).map(q => [q.question_number, q.answer_key])
  )
}

/** Get all section IDs for a test (helper for scoring) */
export async function getTestSectionIds(testId: string): Promise<string[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('listening_sections')
    .select('id')
    .eq('test_id', testId)

  if (error) {
    console.error('[getTestSectionIds]', error)
    return []
  }

  return (data ?? []).map(s => s.id)
}
