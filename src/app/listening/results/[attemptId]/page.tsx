import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getListeningAttempt } from '@/lib/db/listening-attempts'
import { getListeningTestWithSections, getSectionQuestionsWithAnswers } from '@/lib/db/listening-tests'
import { ListeningResults } from '@/components/listening/listening-results'

interface Props {
  params: Promise<{ attemptId: string }>
}

export default async function ListeningResultsPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/sign-in')

  const { attemptId } = await params
  const attempt = await getListeningAttempt(attemptId)

  if (!attempt || attempt.user_id !== user.id) notFound()

  const testData = await getListeningTestWithSections(attempt.test_id)
  if (!testData) notFound()

  // Fetch questions WITH answer_key — safe server-side; never exposed to client JS
  const questionsBySection = await Promise.all(
    testData.sections.map(s => getSectionQuestionsWithAnswers(s.id))
  )

  return (
    <ListeningResults
      attempt={attempt}
      test={testData.test}
      sections={testData.sections}
      questionsBySection={questionsBySection}
    />
  )
}
