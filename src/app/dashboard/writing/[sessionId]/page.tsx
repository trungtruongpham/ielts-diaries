import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getWritingSession, getWritingSessionAnswers } from '@/lib/db/writing-sessions'
import { WritingReviewTask } from '@/components/writing/writing-review-task'
import { WritingReviewTabs } from '@/components/writing/writing-review-tabs'
import { format } from 'date-fns'
import { ArrowLeft, PenLine } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'
import type { WritingTaskType } from '@/lib/db/types'

function bandColor(b: number | null): string {
  if (b === null) return 'text-muted-foreground'
  if (b >= 7.5) return 'text-emerald-600 dark:text-emerald-400'
  if (b >= 6.0) return 'text-blue-600 dark:text-blue-400'
  if (b >= 5.0) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

function bandBgBorder(b: number | null): string {
  if (b === null) return 'bg-muted border-border'
  if (b >= 7.5) return 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950 dark:border-emerald-700'
  if (b >= 6.0) return 'bg-blue-50 border-blue-300 dark:bg-blue-950 dark:border-blue-700'
  if (b >= 5.0) return 'bg-amber-50 border-amber-300 dark:bg-amber-950 dark:border-amber-700'
  return 'bg-red-50 border-red-300 dark:bg-red-950 dark:border-red-700'
}

const TASK_BADGES: Record<WritingTaskType, { emoji: string; label: string }> = {
  task1_academic: { emoji: '📊', label: 'Task 1 · Academic' },
  task1_gt:       { emoji: '✉️', label: 'Task 1 · General Training' },
  task2:          { emoji: '📝', label: 'Task 2 · Essay' },
  full:           { emoji: '🎯', label: 'Full Test' },
}

export const metadata: Metadata = {
  title: 'Writing Review | IELTS Diaries',
  description: 'Review your writing session prompt, answer, and AI feedback.',
}

interface Props {
  params: Promise<{ sessionId: string }>
}

export default async function WritingReviewPage({ params }: Props) {
  const { sessionId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirectTo=/dashboard/writing/${sessionId}`)

  const session = await getWritingSession(sessionId)
  if (!session) notFound()
  if (session.status === 'in_progress') redirect('/writing')

  const answers = await getWritingSessionAnswers(sessionId)
  const task1Answer = answers.find(a => a.task === 1) ?? null
  const task2Answer = answers.find(a => a.task === 2) ?? null

  const isFullTest = session.task_type === 'full'
  const isAbandoned = session.status === 'abandoned'
  const badge = TASK_BADGES[session.task_type]

  const task1Label = session.task_type === 'task1_gt'
    ? 'Task 1 · General Training'
    : 'Task 1 · Academic'
  const task2Label = 'Task 2 · Essay'

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10 space-y-6">
      {/* Back + header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/dashboard/writing"
          className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to History
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border-2',
              bandBgBorder(session.overall_band),
            )}>
              <PenLine className={cn('h-3 w-3 mb-0.5', bandColor(session.overall_band))} />
              <span className={cn('text-lg font-bold tabular-nums leading-none', bandColor(session.overall_band))}>
                {session.overall_band != null ? session.overall_band.toFixed(1) : '—'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-foreground">
                  {badge.emoji} {badge.label}
                </h1>
                {isAbandoned && (
                  <span className="rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 px-2 py-0.5 text-[10px] font-semibold uppercase">
                    Abandoned
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {format(new Date(session.created_at), 'MMM d, yyyy · h:mm a')}
              </p>
              {isFullTest && (session.task1_band != null || session.task2_band != null) && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {session.task1_band != null && (
                    <>Task 1: <span className={cn('font-semibold', bandColor(session.task1_band))}>{session.task1_band.toFixed(1)}</span></>
                  )}
                  {session.task1_band != null && session.task2_band != null && ' · '}
                  {session.task2_band != null && (
                    <>Task 2: <span className={cn('font-semibold', bandColor(session.task2_band))}>{session.task2_band.toFixed(1)}</span></>
                  )}
                </p>
              )}
            </div>
          </div>

          <Link
            href="/writing"
            className="flex w-fit items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
          >
            ✍️ Practice Again
          </Link>
        </div>
      </div>

      {/* Abandoned banner */}
      {isAbandoned && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-300">
          ⚠️ No AI feedback — this session was abandoned before completion.
        </div>
      )}

      {/* Task content */}
      {isFullTest ? (
        <WritingReviewTabs
          task1Content={
            task1Answer
              ? <WritingReviewTask answer={task1Answer} taskLabel={task1Label} />
              : <p className="text-sm text-muted-foreground py-4">Task 1 data not available.</p>
          }
          task2Content={
            task2Answer
              ? <WritingReviewTask answer={task2Answer} taskLabel={task2Label} />
              : <p className="text-sm text-muted-foreground py-4">Task 2 data not available.</p>
          }
        />
      ) : (
        <div className="space-y-6">
          {task1Answer && <WritingReviewTask answer={task1Answer} taskLabel={task1Label} />}
          {task2Answer && <WritingReviewTask answer={task2Answer} taskLabel={task2Label} />}
        </div>
      )}
    </div>
  )
}
