'use client'

import { cn } from '@/lib/utils'

interface PartIndicatorProps {
  currentPart: 1 | 2 | 3
  currentQuestion: number        // 0-indexed within the part
  questionsInPart: number        // total in current part (5, 1, 5)
  className?: string
}

const PART_LABELS = ['Part 1', 'Part 2', 'Part 3']
const PART_DESCRIPTIONS = ['Introduction', 'Long Turn', 'Discussion']

export function PartIndicator({
  currentPart,
  currentQuestion,
  questionsInPart,
  className,
}: PartIndicatorProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Part tabs */}
      <div className="flex gap-2">
        {([1, 2, 3] as const).map(p => (
          <div
            key={p}
            className={cn(
              'flex flex-1 flex-col items-center rounded-lg px-3 py-2 text-xs font-medium transition-all',
              p < currentPart && 'bg-primary/15 text-primary',
              p === currentPart && 'bg-primary text-primary-foreground shadow-md',
              p > currentPart && 'bg-muted text-muted-foreground'
            )}
          >
            <span className="font-semibold">{PART_LABELS[p - 1]}</span>
            <span className="mt-0.5 opacity-70">{PART_DESCRIPTIONS[p - 1]}</span>
          </div>
        ))}
      </div>

      {/* Question dots for current part */}
      {questionsInPart > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          {Array.from({ length: questionsInPart }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-2 w-2 rounded-full transition-all duration-300',
                i < currentQuestion && 'bg-primary/60',
                i === currentQuestion && 'h-2.5 w-2.5 bg-primary',
                i > currentQuestion && 'bg-muted-foreground/30'
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
