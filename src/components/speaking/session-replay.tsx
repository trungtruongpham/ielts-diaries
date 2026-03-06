import Link from 'next/link'
import { ArrowLeft, Mic } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { AnswerReplayCard } from '@/components/speaking/answer-replay-card'
import type { DbSpeakingSession, DbSpeakingAnswer } from '@/lib/db/types'

interface SessionReplayProps {
  session: DbSpeakingSession
  answers: DbSpeakingAnswer[]
}

function bandColor(b: number | null) {
  if (b === null) return 'text-muted-foreground'
  if (b >= 7.5) return 'text-emerald-600'
  if (b >= 6.0) return 'text-blue-600'
  if (b >= 5.0) return 'text-yellow-600'
  return 'text-red-600'
}

function barColor(b: number | null) {
  if (b === null) return 'bg-muted'
  if (b >= 7.5) return 'bg-emerald-500'
  if (b >= 6.0) return 'bg-blue-500'
  if (b >= 5.0) return 'bg-yellow-500'
  return 'bg-red-500'
}

const CRITERIA = [
  { key: 'fluency_band' as const, abbr: 'FC', label: 'Fluency & Coherence' },
  { key: 'lexical_band' as const, abbr: 'LR', label: 'Lexical Resource' },
  { key: 'grammar_band' as const, abbr: 'GRA', label: 'Grammar & Accuracy' },
  { key: 'pronunciation_band' as const, abbr: 'P', label: 'Pronunciation' },
]

function PartSection({
  part,
  answers,
}: {
  part: 1 | 2 | 3
  answers: DbSpeakingAnswer[]
}) {
  const partLabels = { 1: 'Part 1 — Introduction', 2: 'Part 2 — Long Turn', 3: 'Part 3 — Discussion' }

  if (answers.length === 0) return null

  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-2">
          {partLabels[part]}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className="space-y-3">
        {answers.map((answer, i) => (
          <AnswerReplayCard
            key={answer.id}
            answer={answer}
            questionNumber={i + 1}
          />
        ))}
      </div>
    </section>
  )
}

export function SessionReplay({ session, answers }: SessionReplayProps) {
  const part1 = answers.filter(a => a.part === 1)
  const part2 = answers.filter(a => a.part === 2)
  const part3 = answers.filter(a => a.part === 3)

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Link
        href="/dashboard/speaking"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" /> Speaking History
      </Link>

      {/* Session header card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Mic className="h-4 w-4 text-primary" />
              <h1 className="text-xl font-bold capitalize">
                {session.topic ?? 'Speaking Practice'}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {format(new Date(session.created_at), 'MMMM d, yyyy · h:mm a')}
            </p>
          </div>

          {/* Overall band hero */}
          {session.overall_band != null && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Overall Band</p>
              <p className={cn('text-4xl font-extrabold tabular-nums', bandColor(session.overall_band))}>
                {session.overall_band.toFixed(1)}
              </p>
            </div>
          )}
        </div>

        {/* Criteria bars */}
        {session.overall_band != null && (
          <div className="mt-5 space-y-2.5 border-t border-border pt-5">
            {CRITERIA.map(c => {
              const val = session[c.key]
              return (
                <div key={c.key} className="flex items-center gap-3">
                  <span className="w-10 text-right text-xs font-bold text-muted-foreground uppercase">{c.abbr}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', barColor(val))}
                      style={{ width: `${((val ?? 0) / 9) * 100}%` }}
                    />
                  </div>
                  <span className={cn('w-8 text-sm font-bold tabular-nums', bandColor(val))}>
                    {val != null ? val.toFixed(1) : '—'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Answers by part */}
      <PartSection part={1} answers={part1} />
      <PartSection part={2} answers={part2} />
      <PartSection part={3} answers={part3} />

      {answers.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No answers recorded in this session.
        </p>
      )}

      {/* Footer actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between border-t border-border pt-6">
        <Link
          href="/speaking"
          className="rounded-lg bg-primary px-5 py-2.5 text-center text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          🎤 Practice Again
        </Link>
        <Link
          href="/dashboard/speaking"
          className="rounded-lg border border-border px-5 py-2.5 text-center text-sm font-semibold text-foreground hover:bg-accent"
        >
          ← Back to History
        </Link>
      </div>
    </div>
  )
}
