'use client'

import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Loader2, SendHorizonal } from 'lucide-react'

interface ListeningSectionNavProps {
  currentSectionIndex: number
  totalSections: number
  answeredCount: number
  totalQuestions: number
  isSubmitting: boolean
  onPrev: () => void
  onNext: () => void
  onGoTo: (index: number) => void
  onSubmit: () => void
}

export function ListeningSectionNav({
  currentSectionIndex,
  totalSections,
  answeredCount,
  totalQuestions,
  isSubmitting,
  onPrev,
  onNext,
  onGoTo,
  onSubmit,
}: ListeningSectionNavProps) {
  const isLastSection = currentSectionIndex === totalSections - 1

  return (
    <div className="flex items-center justify-between gap-3 border-t border-border bg-card/80 px-4 py-3 backdrop-blur-sm">

      {/* Prev */}
      <button
        onClick={onPrev}
        disabled={currentSectionIndex === 0}
        className={cn(
          'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          currentSectionIndex === 0
            ? 'cursor-not-allowed text-muted-foreground/40'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        )}
      >
        <ChevronLeft className="h-4 w-4" />
        Prev
      </button>

      {/* Section pills */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalSections }, (_, i) => (
          <button
            key={i}
            onClick={() => onGoTo(i)}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-150',
              i === currentSectionIndex
                ? 'bg-primary text-primary-foreground shadow-sm scale-110'
                : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
            )}
            aria-label={`Go to Part ${i + 1}`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Right side: answer count + Next/Submit */}
      <div className="flex items-center gap-2">
        <span className="hidden text-xs text-muted-foreground sm:block">
          {answeredCount}/{totalQuestions} answered
        </span>

        {isLastSection ? (
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150',
              isSubmitting
                ? 'cursor-not-allowed bg-muted text-muted-foreground'
                : 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-md'
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <SendHorizonal className="h-4 w-4" />
                Submit Test
              </>
            )}
          </button>
        ) : (
          <button
            onClick={onNext}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
