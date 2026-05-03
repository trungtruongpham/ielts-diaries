import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getListeningTestWithSections, getSectionQuestions } from '@/lib/db/listening-tests'
import { ListeningTestLayout } from '@/components/listening/listening-test-layout'
import type { ListeningMode } from '@/lib/db/types'

interface Props {
  params: Promise<{ testId: string }>
  searchParams: Promise<{ mode?: string }>
}

export default async function ListeningTestPage({ params, searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { testId } = await params
  const { mode: modeParam } = await searchParams

  if (!user) redirect(`/auth/sign-in?next=/listening/${testId}`)

  const testData = await getListeningTestWithSections(testId)
  if (!testData) notFound()

  const { test, sections } = testData

  const questionsBySection = await Promise.all(
    sections.map(s => getSectionQuestions(s.id))
  )

  const mode: ListeningMode =
    modeParam === 'strict' ? 'strict' : 'practice'

  return (
    <ListeningTestLayout
      test={test}
      sections={sections}
      questionsBySection={questionsBySection}
      mode={mode}
    />
  )
}
