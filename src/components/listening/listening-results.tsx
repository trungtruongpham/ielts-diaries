'use client'

import Link from 'next/link'
import { CheckCircle2, XCircle, MinusCircle, Clock, Target, RotateCcw, ListChecks } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/lib/audio-utils'
import { ListeningQuestionGroup } from './listening-question-group'
import type {
  DbListeningTest,
  DbListeningSection,
  DbListeningQuestionWithKey,
  DbListeningAttempt,
} from '@/lib/db/types'

interface ListeningResultsProps {
  attempt: DbListeningAttempt
  test: DbListeningTest
  sections: DbListeningSection[]
  questionsBySection: DbListeningQuestionWithKey[][]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function bandColor(band: number | null): string {
  if (!band) return 'text-muted-foreground'
  if (band >= 7.0) return 'text-green-600 dark:text-green-400'
  if (band >= 5.5) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-500 dark:text-red-400'
}

function bandBg(band: number | null): string {
  if (!band) return 'bg-muted/30'
  if (band >= 7.0) return 'bg-green-50 dark:bg-green-950/40'
  if (band >= 5.5) return 'bg-amber-50 dark:bg-amber-950/40'
  return 'bg-red-50 dark:bg-red-950/40'
}

function bandMessage(band: number | null): string {
  if (!band) return 'Keep practising!'
  if (band >= 8.0) return 'Outstanding! Expert level.'
  if (band >= 7.0) return 'Great result! Good user.'
  if (band >= 6.0) return 'Competent. Keep pushing!'
  if (band >= 5.0) return 'Modest. More practice needed.'
  return 'Keep going. Consistent effort pays off!'
}

// ── Score Cards ───────────────────────────────────────────────────────────────

function ScoreCards({ attempt }: { attempt: DbListeningAttempt }) {
  const band = attempt.band

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className={cn('flex flex-col items-center justify-center rounded-2xl border p-5', bandBg(band))}>
        <span className={cn('text-5xl font-bold', bandColor(band))}>
          {band?.toFixed(1) ?? '—'}
        </span>
        <span className="mt-1.5 text-xs font-semibold text-muted-foreground">Band Score</span>
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl border bg-card p-5">
        <span className="text-4xl font-bold text-foreground">
          {attempt.correct_count ?? 0}
          <span className="text-2xl text-muted-foreground">/40</span>
        </span>
        <span className="mt-1.5 text-xs font-semibold text-muted-foreground">Correct</span>
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl border bg-card p-5">
        <span className="text-3xl font-bold text-foreground">
          {attempt.time_taken_seconds
            ? formatDuration(attempt.time_taken_seconds)
            : '—'}
        </span>
        <span className="mt-1.5 text-xs font-semibold text-muted-foreground">Time Taken</span>
      </div>
    </div>
  )
}

// ── Answer Review Section ──────────────────────────────────────────────────────

function ReviewSection({
  section,
  questions,
  attempt,
}: {
  section: DbListeningSection
  questions: DbListeningQuestionWithKey[]
  attempt: DbListeningAttempt
}) {
  const correct = questions.filter(q => {
    // We rely on ListeningQuestionGroup's review logic to highlight —
    // for the section header count, do a simple comparison here
    const userAns = attempt.answers[q.question_number]
    if (!userAns) return false
    return true // simplified — full check done by question components
  }).length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-bold text-foreground">
          Part {section.section_number}
        </h3>
        <span className="text-xs text-muted-foreground">
          Q{section.question_range_start}–{section.question_range_end}
        </span>
      </div>

      <ListeningQuestionGroup
        questions={questions}
        sectionNumber={section.section_number}
        answers={attempt.answers}
        onAnswer={() => { /* read-only */ }}
        showReview
      />
    </div>
  )
}

// ── Legend ────────────────────────────────────────────────────────────────────

function ReviewLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-muted/30 px-4 py-3 text-xs">
      <span className="flex items-center gap-1.5 text-green-700 dark:text-green-400">
        <CheckCircle2 className="h-3.5 w-3.5" /> Correct
      </span>
      <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
        <XCircle className="h-3.5 w-3.5" /> Incorrect
      </span>
      <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
        <MinusCircle className="h-3.5 w-3.5" /> Unanswered
      </span>
    </div>
  )
}

// ── Main Results ──────────────────────────────────────────────────────────────

export function ListeningResults({
  attempt,
  test,
  sections,
  questionsBySection,
}: ListeningResultsProps) {
  const band = attempt.band

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="space-y-8">

        {/* Header */}
        <div className="text-center">
          <div className="mb-3 flex justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-3xl">
              🎧
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{test.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {attempt.mode === 'strict' ? 'Strict Mode' : 'Practice Mode'}
            {' · '}
            {new Date(attempt.completed_at ?? attempt.started_at).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'long', year: 'numeric'
            })}
          </p>
          <p className={cn('mt-2 text-sm font-medium', bandColor(band))}>
            {bandMessage(band)}
          </p>
        </div>

        {/* Score Cards */}
        <ScoreCards attempt={attempt} />

        {/* Quick stats row */}
        <div className="grid grid-cols-3 gap-3 rounded-2xl border bg-muted/20 px-4 py-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <div>
              <p className="text-[11px] text-muted-foreground">Accuracy</p>
              <p className="text-sm font-bold text-foreground">
                {Math.round(((attempt.correct_count ?? 0) / 40) * 100)}%
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <div>
              <p className="text-[11px] text-muted-foreground">Per question</p>
              <p className="text-sm font-bold text-foreground">
                {attempt.time_taken_seconds
                  ? formatDuration(Math.round(attempt.time_taken_seconds / 40))
                  : '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-primary" />
            <div>
              <p className="text-[11px] text-muted-foreground">Unanswered</p>
              <p className="text-sm font-bold text-foreground">
                {40 - Object.keys(attempt.answers).length}
              </p>
            </div>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/listening"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Try Another Test
          </Link>
          <Link
            href={`/listening/${attempt.test_id}?mode=${attempt.mode}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:-translate-y-0.5"
          >
            <RotateCcw className="h-4 w-4" />
            Retake This Test
          </Link>
        </div>

        {/* Answer Review */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-foreground">Answer Review</h2>
            <ReviewLegend />
          </div>

          <div className="divide-y divide-border">
            {sections.map((section, i) => (
              <div key={section.id} className="py-8">
                <ReviewSection
                  section={section}
                  questions={questionsBySection[i] ?? []}
                  attempt={attempt}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
