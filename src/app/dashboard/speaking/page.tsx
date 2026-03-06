import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Mic, Plus } from 'lucide-react'
import { getSpeakingSessionsAction } from './actions'
import { SessionHistoryList } from '@/components/speaking/session-history-list'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Speaking History | IELTS Diaries',
  description: 'Review your IELTS Speaking practice sessions and track your progress.',
}

export default async function SpeakingHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/dashboard/speaking')

  const sessions = await getSpeakingSessionsAction()

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Mic className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Speaking History</h1>
            <p className="text-sm text-muted-foreground">
              {sessions.length} practice session{sessions.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <Link
          href="/speaking"
          className="flex w-fit items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Practice
        </Link>
      </div>

      {/* List */}
      <SessionHistoryList sessions={sessions} />
    </div>
  )
}
