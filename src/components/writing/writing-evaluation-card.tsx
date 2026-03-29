'use client'

import { cn } from '@/lib/utils'

interface WritingEvaluationCardProps {
  criterionName: string
  score: number
  explanation?: string
  maxScore?: number
}

function bandColor(b: number): string {
  if (b >= 7.0) return 'text-emerald-600 dark:text-emerald-400'
  if (b >= 5.5) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

function bandBg(b: number): string {
  if (b >= 7.0) return 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800'
  if (b >= 5.5) return 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800'
  return 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
}

function bandBar(b: number): string {
  if (b >= 7.0) return 'bg-emerald-500'
  if (b >= 5.5) return 'bg-amber-400'
  return 'bg-red-400'
}

export function WritingEvaluationCard({
  criterionName,
  score,
  explanation,
  maxScore = 9,
}: WritingEvaluationCardProps) {
  const pct = (score / maxScore) * 100

  return (
    <div className={cn('rounded-xl border p-4 shadow-sm', bandBg(score))}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-sm font-semibold text-foreground">{criterionName}</p>
        <span className={cn('text-xl font-extrabold tabular-nums', bandColor(score))}>
          {score.toFixed(1)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden mb-2">
        <div
          className={cn('h-full rounded-full transition-all duration-700', bandBar(score))}
          style={{ width: `${pct}%` }}
        />
      </div>

      {explanation && (
        <p className="text-xs text-muted-foreground leading-snug">{explanation}</p>
      )}
    </div>
  )
}
