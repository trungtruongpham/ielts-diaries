'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { Mic, Calendar, Trash2, ChevronRight, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { deleteSpeakingSessionAction } from '@/app/dashboard/speaking/actions'
import type { DbSpeakingSession, PracticeMode } from '@/lib/db/types'

interface SessionHistoryListProps {
  sessions: DbSpeakingSession[]
}

function bandColor(b: number | null) {
  if (b === null) return 'text-muted-foreground'
  if (b >= 7.5) return 'text-emerald-600'
  if (b >= 6.0) return 'text-blue-600'
  if (b >= 5.0) return 'text-yellow-600'
  return 'text-red-600'
}

function bandBg(b: number | null) {
  if (b === null) return 'bg-muted border-border'
  if (b >= 7.5) return 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800'
  if (b >= 6.0) return 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
  if (b >= 5.0) return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800'
  return 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
}

function statusBadge(status: DbSpeakingSession['status']) {
  if (status === 'completed') return null // Don't show for the normal case
  return (
    <span className={cn(
      'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
      status === 'in_progress'
        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
        : 'bg-muted text-muted-foreground'
    )}>
      {status === 'in_progress' ? 'In Progress' : 'Abandoned'}
    </span>
  )
}

const MODE_BADGES: Partial<Record<PracticeMode, { emoji: string; label: string; cls: string }>> = {
  part1: { emoji: '🗣️', label: 'Part 1', cls: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300' },
  part2: { emoji: '📝', label: 'Part 2', cls: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300' },
  part3: { emoji: '💬', label: 'Part 3', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' },
}

function modeBadge(mode: PracticeMode) {
  const info = MODE_BADGES[mode]
  if (!info) return null  // 'full' — no badge needed
  return (
    <span className={cn(
      'rounded-full px-2 py-0.5 text-[10px] font-semibold',
      info.cls,
    )}>
      {info.emoji} {info.label}
    </span>
  )
}

function SessionCard({
  session,
  onDeleted,
}: {
  session: DbSpeakingSession
  onDeleted: (id: string) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)

  function handleDelete() {
    startTransition(async () => {
      await deleteSpeakingSessionAction(session.id)
      onDeleted(session.id)
    })
  }

  return (
    <div className="group flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
      {/* Band badge */}
      <div className={cn(
        'flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border-2',
        bandBg(session.overall_band)
      )}>
        <Mic className={cn('h-3 w-3 mb-0.5', bandColor(session.overall_band))} />
        <span className={cn('text-lg font-bold tabular-nums leading-none', bandColor(session.overall_band))}>
          {session.overall_band != null ? session.overall_band.toFixed(1) : '—'}
        </span>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-foreground capitalize">
            {session.topic ?? 'Speaking Practice'}
          </p>
          {modeBadge(session.practice_mode)}
          {statusBadge(session.status)}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {format(new Date(session.created_at), 'MMM d, yyyy · h:mm a')}
        </div>
        {/* Criteria mini-scores */}
        {session.overall_band != null && (
          <div className="mt-1 flex gap-3 text-xs">
            <span className="text-muted-foreground">FC <span className="font-semibold text-foreground">{session.fluency_band?.toFixed(1) ?? '—'}</span></span>
            <span className="text-muted-foreground">LR <span className="font-semibold text-foreground">{session.lexical_band?.toFixed(1) ?? '—'}</span></span>
            <span className="text-muted-foreground">GRA <span className="font-semibold text-foreground">{session.grammar_band?.toFixed(1) ?? '—'}</span></span>
            <span className="text-muted-foreground">P <span className="font-semibold text-foreground">{session.pronunciation_band?.toFixed(1) ?? '—'}</span></span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Delete'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => setConfirmDelete(true)}
              className="hidden rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 sm:block"
              title="Delete session"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            {session.status === 'completed' && (
              <Link
                href={`/dashboard/speaking/${session.id}`}
                className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
              >
                Review <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export function SessionHistoryList({ sessions: initialSessions }: SessionHistoryListProps) {
  const [sessions, setSessions] = useState(initialSessions)

  function handleDeleted(id: string) {
    setSessions(prev => prev.filter(s => s.id !== id))
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-16 text-center">
        <Mic className="mb-3 h-9 w-9 text-muted-foreground" />
        <p className="font-semibold text-foreground">No practice sessions yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Start a speaking practice to begin.</p>
        <Link
          href="/speaking"
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          🎤 Start Practice
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {sessions.map(session => (
        <SessionCard key={session.id} session={session} onDeleted={handleDeleted} />
      ))}
    </div>
  )
}
