import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSpeakingSessionDetailAction } from '../actions'
import { SessionReplay } from '@/components/speaking/session-replay'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return {
    title: `Speaking Session | IELTS Diaries`,
    description: `Review your recorded answers and AI feedback for speaking practice session ${id}.`,
  }
}

export default async function SpeakingSessionDetailPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirectTo=/dashboard/speaking/${(await params).id}`)

  const { id } = await params
  const { session, answers } = await getSpeakingSessionDetailAction(id)

  if (!session) notFound()

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <SessionReplay session={session} answers={answers} />
    </div>
  )
}
