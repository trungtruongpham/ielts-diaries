'use client'

import { cn } from '@/lib/utils'
import { CheckCircle2 } from 'lucide-react'
import type { PracticeMode } from '@/hooks/use-speaking-session'

interface PartIndicatorProps {
  currentPart: 1 | 2 | 3
  currentQuestion: number        // 0-indexed within the part
  questionsInPart: number        // total in current part (5, 1, 5)
  practiceMode: PracticeMode     // controls how many tabs to show
  className?: string
}

const PART_LABELS       = ['Part 1', 'Part 2', 'Part 3'] as const
const PART_DESCRIPTIONS = ['Introduction', 'Long Turn', 'Discussion'] as const

export function PartIndicator({
  currentPart,
  currentQuestion,
  questionsInPart,
  practiceMode,
  className,
}: PartIndicatorProps) {
  // Full-test mode: show all 3 tabs so the user sees their position in the journey.
  // Single-part modes: show a simpler single-part header — no tabs to distract.
  const isFullTest = practiceMode === 'full'

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {isFullTest ? (
        /* ── Full test: 3-tab progress strip ──────────────────────────── */
        <div className="flex gap-2">
          {([1, 2, 3] as const).map(p => (
            <div
              key={p}
              className={cn(
                'flex flex-1 flex-col items-center rounded-lg px-3 py-2 text-xs font-medium transition-all',
                p < currentPart  && 'bg-primary/15 text-primary',
                p === currentPart && 'bg-primary text-primary-foreground shadow-md',
                p > currentPart  && 'bg-muted text-muted-foreground',
              )}
            >
              {/* Completed tick */}
              {p < currentPart ? (
                <CheckCircle2 className="mb-0.5 h-3.5 w-3.5" aria-hidden />
              ) : (
                <span className="font-semibold">{PART_LABELS[p - 1]}</span>
              )}
              <span className="mt-0.5 opacity-70">{PART_DESCRIPTIONS[p - 1]}</span>
            </div>
          ))}
        </div>
      ) : (
        /* ── Single-part mode: compact header ─────────────────────────── */
        <div className="flex items-center gap-2.5 rounded-lg bg-primary px-4 py-2.5 text-primary-foreground shadow-md">
          <span className="text-sm font-bold">{PART_LABELS[currentPart - 1]}</span>
          <span className="h-3.5 w-px bg-primary-foreground/30" aria-hidden />
          <span className="text-xs opacity-80">{PART_DESCRIPTIONS[currentPart - 1]}</span>
          {questionsInPart > 1 && (
            <>
              <span className="h-3.5 w-px bg-primary-foreground/30 ml-auto" aria-hidden />
              <span className="text-xs tabular-nums opacity-80">
                {currentQuestion + 1} / {questionsInPart}
              </span>
            </>
          )}
        </div>
      )}

      {/* Question progress dots — shown in both modes when part has multiple questions */}
      {questionsInPart > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          {Array.from({ length: questionsInPart }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-2 w-2 rounded-full transition-all duration-300',
                i < currentQuestion  && 'bg-primary/60',
                i === currentQuestion && 'h-2.5 w-2.5 bg-primary',
                i > currentQuestion  && 'bg-muted-foreground/30',
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
