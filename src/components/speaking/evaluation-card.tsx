'use client'

import { cn } from '@/lib/utils'
import type { SpeakingEvaluation } from '@/lib/ai/types'

interface EvaluationCardProps {
  evaluation: SpeakingEvaluation
  questionNumber: number
  onNext: () => void
  nextLabel?: string
  className?: string
}

const CRITERIA = [
  { key: 'fluency_coherence' as const, label: 'Fluency & Coherence', abbr: 'FC' },
  { key: 'lexical_resource' as const, label: 'Lexical Resource', abbr: 'LR' },
  { key: 'grammatical_range' as const, label: 'Grammar & Accuracy', abbr: 'GRA' },
  { key: 'pronunciation' as const, label: 'Pronunciation', abbr: 'P' },
]

function getBandColor(band: number): string {
  if (band >= 7.5) return 'bg-emerald-500'
  if (band >= 6.0) return 'bg-blue-500'
  if (band >= 5.0) return 'bg-yellow-500'
  return 'bg-red-500'
}

function ScoreBar({ score, label, abbr }: { score: number; label: string; abbr: string }) {
  const pct = (score / 9) * 100

  return (
    <div className="flex items-center gap-3">
      <span
        className="w-10 text-right text-xs font-bold uppercase text-muted-foreground"
        title={label}
      >
        {abbr}
      </span>
      <div className="relative flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', getBandColor(score))}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-left text-sm font-bold tabular-nums">{score.toFixed(1)}</span>
    </div>
  )
}

export function EvaluationCard({
  evaluation,
  questionNumber,
  onNext,
  nextLabel = 'Next Question',
  className,
}: EvaluationCardProps) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card shadow-sm overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between bg-muted/40 px-6 py-4">
        <span className="text-sm font-semibold text-muted-foreground">
          Question {questionNumber} — Result
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Score</span>
          <span
            className={cn(
              'rounded-full px-3 py-1 text-sm font-bold text-white',
              getBandColor(evaluation.overall)
            )}
          >
            {evaluation.overall.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Score bars */}
        <div className="space-y-3">
          {CRITERIA.map(c => (
            <ScoreBar
              key={c.key}
              score={evaluation[c.key]}
              label={c.label}
              abbr={c.abbr}
            />
          ))}
        </div>

        {/* Feedback */}
        {evaluation.feedback && (
          <p className="text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
            {evaluation.feedback}
          </p>
        )}

        {/* Strengths + improvements */}
        {(evaluation.strengths.length > 0 || evaluation.improvements.length > 0) && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 border-t border-border pt-4">
            {evaluation.strengths.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                  ✓ Strengths
                </p>
                <ul className="space-y-1.5">
                  {evaluation.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-foreground leading-relaxed">{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {evaluation.improvements.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-600">
                  💡 To improve
                </p>
                <ul className="space-y-1.5">
                  {evaluation.improvements.map((s, i) => (
                    <li key={i} className="text-xs text-foreground leading-relaxed">{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="flex justify-end border-t border-border px-6 py-4">
        <button
          onClick={onNext}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow transition-all hover:bg-primary/90 active:scale-95"
        >
          {nextLabel} →
        </button>
      </div>
    </div>
  )
}
