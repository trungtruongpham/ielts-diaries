'use server'

import { createClient } from '@/lib/supabase/server'
import { createListeningAttempt } from '@/lib/db/listening-attempts'
import { checkAnswer, correctCountToBand } from './scoring'
import type { ListeningMode, ListeningAnswerKey, ListeningQuestionType } from '@/lib/db/types'

type Answers = Record<number, string | string[]>

interface SubmitInput {
  testId: string
  mode: ListeningMode
  answers: Answers
  timeTakenSeconds: number
}

interface SubmitResult {
  attemptId: string | null
  error: string | null
}

export async function submitListeningAttempt(input: SubmitInput): Promise<SubmitResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { attemptId: null, error: 'Not authenticated' }

  // 1. Fetch sections for the test
  const { data: sections, error: sectionsError } = await supabase
    .from('listening_sections')
    .select('id')
    .eq('test_id', input.testId)

  if (sectionsError || !sections?.length) {
    return { attemptId: null, error: 'Test not found or has no sections' }
  }

  const sectionIds = sections.map(s => s.id)

  // 2. Fetch all questions with answer_key (server-side only — never sent to client)
  const { data: questions, error: questionsError } = await supabase
    .from('listening_questions')
    .select('question_number, question_type, answer_key')
    .in('section_id', sectionIds)

  if (questionsError) {
    return { attemptId: null, error: 'Failed to load answer keys' }
  }

  // 3. Score each answer
  let correctCount = 0
  for (const q of questions ?? []) {
    const userAnswer = input.answers[q.question_number]
    if (
      checkAnswer(
        q.question_type as ListeningQuestionType,
        userAnswer,
        q.answer_key as ListeningAnswerKey
      )
    ) {
      correctCount++
    }
  }

  const band = correctCountToBand(correctCount)

  // 4. Persist attempt
  const { data: attempt, error: attemptError } = await createListeningAttempt({
    user_id: user.id,
    test_id: input.testId,
    mode: input.mode,
    answers: input.answers,
    correct_count: correctCount,
    score: correctCount,
    band,
    completed_at: new Date().toISOString(),
    time_taken_seconds: input.timeTakenSeconds,
  })

  if (attemptError) {
    return { attemptId: null, error: attemptError }
  }

  return { attemptId: attempt?.id ?? null, error: null }
}
