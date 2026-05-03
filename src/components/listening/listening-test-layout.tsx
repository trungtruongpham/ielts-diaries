'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Loader2, Timer } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/lib/audio-utils'
import { useListeningSession } from '@/hooks/use-listening-session'
import { ListeningAudioPlayer } from './listening-audio-player'
import { ListeningQuestionGroup } from './listening-question-group'
import { ListeningSectionNav } from './listening-section-nav'
import type {
  DbListeningTest,
  DbListeningSection,
  DbListeningQuestion,
  ListeningMode,
} from '@/lib/db/types'

interface ListeningTestLayoutProps {
  test: DbListeningTest
  sections: DbListeningSection[]
  questionsBySection: DbListeningQuestion[][]
  mode: ListeningMode
}

// ── Timer display ─────────────────────────────────────────────────────────────

function TimerDisplay({ elapsedSeconds, mode }: { elapsedSeconds: number; mode: ListeningMode }) {
  if (mode !== 'strict') return null

  const MAX_SECONDS = 30 * 60
  const remaining = Math.max(0, MAX_SECONDS - elapsedSeconds)
  const isWarning = remaining < 5 * 60

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-mono font-semibold',
        isWarning
          ? 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400'
          : 'bg-muted text-muted-foreground'
      )}
    >
      <Timer className="h-3.5 w-3.5" />
      {formatDuration(remaining)}
    </div>
  )
}

// ── Header ────────────────────────────────────────────────────────────────────

function TestHeader({
  test,
  currentSectionIndex,
  totalSections,
  mode,
  elapsedSeconds,
}: {
  test: DbListeningTest
  currentSectionIndex: number
  totalSections: number
  mode: ListeningMode
  elapsedSeconds: number
}) {
  return (
    <div className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-card/80 px-4 backdrop-blur-sm">
      <div className="flex min-w-0 items-center gap-3">
        <span className="text-xl">🎧</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{test.title}</p>
          <p className="text-xs text-muted-foreground">
            Part {currentSectionIndex + 1} of {totalSections}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <TimerDisplay elapsedSeconds={elapsedSeconds} mode={mode} />
        <span
          className={cn(
            'rounded-full px-2.5 py-1 text-[11px] font-semibold',
            mode === 'strict'
              ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
              : 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
          )}
        >
          {mode === 'strict' ? 'Strict' : 'Practice'}
        </span>
      </div>
    </div>
  )
}

// ── Main Layout ───────────────────────────────────────────────────────────────

export function ListeningTestLayout({
  test,
  sections,
  questionsBySection,
  mode,
}: ListeningTestLayoutProps) {
  const router = useRouter()

  const session = useListeningSession({
    testId: test.id,
    sections,
    questionsBySection,
    mode,
  })

  const {
    currentSectionIndex,
    currentSection,
    currentQuestions,
    answers,
    isSubmitting,
    error,
    elapsedSeconds,
    setAnswer,
    goToSection,
    nextSection,
    prevSection,
    submitTest,
    answeredCount,
    totalQuestions,
  } = session

  // Warn user before leaving mid-test
  const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
    e.preventDefault()
  }, [])

  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [handleBeforeUnload])

  const audioUrl = currentSection?.audio_storage_path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listening-audio/${currentSection.audio_storage_path}`
    : null

  return (
    <div className="flex h-screen flex-col overflow-hidden">

      {/* Header */}
      <TestHeader
        test={test}
        currentSectionIndex={currentSectionIndex}
        totalSections={sections.length}
        mode={mode}
        elapsedSeconds={elapsedSeconds}
      />

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Content: left panel + right panel */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left Panel — Audio + Instructions */}
        <div className="hidden w-72 shrink-0 flex-col gap-4 overflow-y-auto border-r border-border bg-card/50 p-4 lg:flex xl:w-80">
          {audioUrl ? (
            <ListeningAudioPlayer
              audioUrl={audioUrl}
              mode={mode}
              sectionNumber={currentSection?.section_number ?? 1}
              autoPlay={mode === 'strict'}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border p-5 text-center">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              <p className="text-sm font-medium text-foreground">Audio not available</p>
              <p className="text-xs text-muted-foreground">Questions are still accessible for practice.</p>
            </div>
          )}

          {/* Section instructions */}
          {currentSection?.instructions && (
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Instructions
              </p>
              <p className="whitespace-pre-line text-sm text-foreground leading-relaxed">
                {currentSection.instructions}
              </p>
            </div>
          )}

          {/* Question range indicator */}
          {currentSection && (
            <div className="text-center text-xs text-muted-foreground">
              Questions {currentSection.question_range_start}–{currentSection.question_range_end}
            </div>
          )}
        </div>

        {/* Right Panel — Questions (scrollable) */}
        <div className="flex-1 overflow-y-auto">
          {/* Mobile: compact audio bar */}
          {audioUrl && (
            <div className="border-b border-border bg-card/80 px-4 py-3 lg:hidden">
              <ListeningAudioPlayer
                audioUrl={audioUrl}
                mode={mode}
                sectionNumber={currentSection?.section_number ?? 1}
                compact
              />
            </div>
          )}

          {currentQuestions.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading questions…</p>
              </div>
            </div>
          ) : (
            <div className="p-5 lg:p-7">
              <ListeningQuestionGroup
                questions={currentQuestions}
                sectionNumber={currentSection?.section_number ?? 1}
                answers={answers}
                onAnswer={setAnswer}
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer Nav */}
      <ListeningSectionNav
        currentSectionIndex={currentSectionIndex}
        totalSections={sections.length}
        answeredCount={answeredCount}
        totalQuestions={totalQuestions}
        isSubmitting={isSubmitting}
        onPrev={prevSection}
        onNext={nextSection}
        onGoTo={goToSection}
        onSubmit={submitTest}
      />
    </div>
  )
}
