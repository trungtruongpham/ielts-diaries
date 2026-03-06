'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { SessionScores } from '@/hooks/use-speaking-session'

interface SessionResultsProps {
  scores: SessionScores
  sessionId: string | null
  onPracticeAgain: () => void
  className?: string
}

const CRITERIA = [
  { key: 'fluency_band' as const, label: 'Fluency & Coherence', abbr: 'FC' },
  { key: 'lexical_band' as const, label: 'Lexical Resource', abbr: 'LR' },
  { key: 'grammar_band' as const, label: 'Grammar & Accuracy', abbr: 'GRA' },
  { key: 'pronunciation_band' as const, label: 'Pronunciation', abbr: 'P' },
]

function bandColor(b: number) {
  if (b >= 7.5) return 'text-emerald-600'
  if (b >= 6.0) return 'text-blue-600'
  if (b >= 5.0) return 'text-yellow-600'
  return 'text-red-600'
}

function barColor(b: number) {
  if (b >= 7.5) return 'bg-emerald-500'
  if (b >= 6.0) return 'bg-blue-500'
  if (b >= 5.0) return 'bg-yellow-500'
  return 'bg-red-500'
}

function bandLabel(b: number) {
  if (b >= 8.5) return 'Expert'
  if (b >= 7.5) return 'Very Good'
  if (b >= 6.5) return 'Competent'
  if (b >= 5.5) return 'Modest'
  if (b >= 4.5) return 'Limited'
  return 'Developing'
}

export function SessionResults({
  scores,
  sessionId,
  onPracticeAgain,
  className,
}: SessionResultsProps) {
  return (
    <div className={cn('flex flex-col items-center gap-6', className)}>
      {/* Overall score hero */}
      <div className="w-full rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mb-2 text-4xl">🎉</div>
        <h2 className="mb-1 text-2xl font-bold text-foreground">Practice Complete!</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          You completed all 3 parts of the IELTS Speaking test.
        </p>

        {/* Big overall band */}
        <div className="mb-2 flex items-baseline justify-center gap-3">
          <span
            className={cn('text-6xl font-extrabold tabular-nums', bandColor(scores.overall_band))}
          >
            {scores.overall_band.toFixed(1)}
          </span>
          <span className="text-lg font-semibold text-muted-foreground">Overall Band</span>
        </div>
        <span
          className={cn(
            'inline-block rounded-full px-3 py-1 text-xs font-semibold text-white',
            barColor(scores.overall_band)
          )}
        >
          {bandLabel(scores.overall_band)}
        </span>
      </div>

      {/* Criteria breakdown */}
      <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Criteria Breakdown
        </h3>
        <div className="space-y-4">
          {CRITERIA.map(c => {
            const val = scores[c.key]
            const pct = (val / 9) * 100
            return (
              <div key={c.key} className="flex items-center gap-3">
                <span className="w-10 text-right text-xs font-bold text-muted-foreground uppercase">
                  {c.abbr}
                </span>
                <div className="relative flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-700', barColor(val))}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className={cn('w-10 text-left text-sm font-bold tabular-nums', bandColor(val))}>
                  {val.toFixed(1)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <button
          onClick={onPracticeAgain}
          className="flex-1 rounded-lg border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-accent active:scale-95"
        >
          🔄 Practice Again
        </button>

        {sessionId && (
          <Link
            href={`/dashboard/speaking/${sessionId}`}
            className="flex-1 rounded-lg border border-border bg-card px-5 py-3 text-center text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-accent active:scale-95"
          >
            📋 View Detailed Feedback
          </Link>
        )}

        <Link
          href="/dashboard"
          className="flex-1 rounded-lg bg-primary px-5 py-3 text-center text-sm font-semibold text-primary-foreground shadow transition-all hover:bg-primary/90 active:scale-95"
        >
          📊 Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
