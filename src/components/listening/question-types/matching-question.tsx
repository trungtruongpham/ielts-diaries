'use client'

import { cn } from '@/lib/utils'
import type { MatchingData, MatchingKey } from '@/lib/db/types'

interface MatchingQuestionProps {
  questionNumber: number
  data: MatchingData
  value: Record<number, string>
  onChange: (value: Record<number, string>) => void
  showReview?: boolean
  answerKey?: MatchingKey
}

export function MatchingQuestion({
  questionNumber,
  data,
  value,
  onChange,
  showReview,
  answerKey,
}: MatchingQuestionProps) {
  function handleSelect(itemIndex: number, selectedKey: string) {
    if (showReview) return
    onChange({ ...value, [itemIndex]: selectedKey })
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">
        <span className="mr-2 font-bold text-primary">{questionNumber}.</span>
        Match each item with the correct option.
      </p>

      {/* Options reference */}
      <div className="ml-5 rounded-xl border border-border bg-muted/30 p-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Options</p>
        <div className="space-y-1">
          {data.options.map(opt => (
            <div key={opt.key} className="flex gap-2 text-sm">
              <span className="w-5 shrink-0 font-bold text-primary">{opt.key}</span>
              <span className="text-foreground">{opt.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Items with selects */}
      <div className="ml-5 space-y-2">
        {data.items.map((item, idx) => {
          const selected = value[idx]
          const correct = answerKey?.matches[idx]
          const isCorrect = showReview && selected === correct
          const isWrong = showReview && !!selected && selected !== correct
          const isUnanswered = showReview && !selected

          return (
            <div key={idx} className={cn(
              'flex items-center gap-3 rounded-xl border p-2.5',
              showReview
                ? isCorrect
                  ? 'border-green-400 bg-green-50 dark:border-green-700 dark:bg-green-950'
                  : isWrong
                    ? 'border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-950'
                    : isUnanswered
                      ? 'border-amber-400 bg-amber-50 dark:border-amber-700 dark:bg-amber-950'
                      : 'border-border bg-card'
                : 'border-border bg-card'
            )}>
              <span className="min-w-0 flex-1 text-sm text-foreground">{item}</span>

              <select
                value={selected ?? ''}
                onChange={e => handleSelect(idx, e.target.value)}
                disabled={showReview}
                className={cn(
                  'shrink-0 rounded-lg border px-2 py-1 text-sm outline-none transition-colors',
                  'focus:border-primary focus:ring-2 focus:ring-primary/20',
                  showReview ? 'bg-transparent' : 'border-border bg-card'
                )}
              >
                <option value="">— Select —</option>
                {data.options.map(opt => (
                  <option key={opt.key} value={opt.key}>{opt.key}</option>
                ))}
              </select>

              {showReview && !isCorrect && correct && (
                <span className="shrink-0 text-xs text-green-700 dark:text-green-400">
                  ✓ {correct}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
