import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PenLine, Plus } from 'lucide-react'
import { getWritingSessionsAction } from './actions'
import { WritingSessionHistoryList } from '@/components/writing/writing-session-history-list'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Writing History | IELTS Diaries',
  description: 'Review your IELTS Writing practice sessions and track your band score progress.',
}

export default async function WritingHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/dashboard/writing')

  const sessions = await getWritingSessionsAction()

  // Aggregate stats
  const total = sessions.length
  const thisMonth = sessions.filter(s => {
    const d = new Date(s.created_at)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
  const bestTask2 = sessions
    .filter(s => s.task2_band != null)
    .reduce((max, s) => Math.max(max, s.task2_band ?? 0), 0)
  const avgOverall = total > 0
    ? sessions.filter(s => s.overall_band != null)
        .reduce((sum, s) => sum + (s.overall_band ?? 0), 0) /
      sessions.filter(s => s.overall_band != null).length
    : null

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <PenLine className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Writing History</h1>
            <p className="text-sm text-muted-foreground">
              {total} practice session{total !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <Link
          href="/writing"
          className="flex w-fit items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Practice
        </Link>
      </div>

      {/* Stats row */}
      {total > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-foreground tabular-nums">{thisMonth}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Sessions this month</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {bestTask2 > 0 ? bestTask2.toFixed(1) : '—'}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Best Task 2 band</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {avgOverall != null ? avgOverall.toFixed(1) : '—'}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Average overall</p>
          </div>
        </div>
      )}

      {/* List */}
      <WritingSessionHistoryList sessions={sessions} />
    </div>
  )
}
