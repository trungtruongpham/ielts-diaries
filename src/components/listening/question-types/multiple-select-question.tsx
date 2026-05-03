'use client'

import { cn } from '@/lib/utils'
import type { MultipleSelectData, MultipleSelectKey } from '@/lib/db/types'

interface MultipleSelectQuestionProps {
  questionNumber: number
  data: MultipleSelectData
  value: string[]
  onChange: (value: string[]) => void
  showReview?: boolean
  answerKey?: MultipleSelectKey
}

export function MultipleSelectQuestion({
  questionNumber,
  data,
  value,
  onChange,
  showReview,
  answerKey,
}: MultipleSelectQuestionProps) {
  const correctAnswers = new Set(answerKey?.answers ?? [])
  const selectedSet = new Set(value)

  function toggle(key: string) {
    if (showReview) return
    if (selectedSet.has(key)) {
      onChange(value.filter(k => k !== key))
    } else if (value.length < data.select_count) {
      onChange([...value, key])
    }
  }

  const limitReached = value.length >= data.select_count

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-foreground">
          <span className="mr-2 font-bold text-primary">{questionNumber}.</span>
          {data.stem}
        </p>
        {!showReview && (
          <p className={cn(
            'mt-1 pl-5 text-xs',
            limitReached ? 'font-semibold text-primary' : 'text-muted-foreground'
          )}>
            Choose {data.select_count} answers
            {limitReached ? ` (${data.select_count} selected)` : ` (${value.length} selected)`}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 pl-5 sm:grid-cols-2">
        {data.options.map(opt => {
          const isSelected = selectedSet.has(opt.key)
          const isCorrect = showReview && correctAnswers.has(opt.key)
          const isWrong = showReview && isSelected && !correctAnswers.has(opt.key)
          const isDisabled = !showReview && !isSelected && limitReached

          return (
            <button
              key={opt.key}
              onClick={() => toggle(opt.key)}
              disabled={isDisabled || showReview}
              className={cn(
                'flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-sm transition-all duration-150',
                showReview
                  ? isCorrect
                    ? 'border-green-400 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-950'
                    : isWrong
                      ? 'border-red-400 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950'
                      : 'border-border bg-card text-muted-foreground'
                  : isSelected
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                    : isDisabled
                      ? 'cursor-not-allowed border-border/50 bg-muted/30 text-muted-foreground/50'
                      : 'border-border bg-card hover:border-primary/40 hover:bg-primary/5'
              )}
            >
              {/* Checkbox-style indicator */}
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs font-bold',
                  showReview
                    ? isCorrect ? 'bg-green-500 text-white' : isWrong ? 'bg-red-500 text-white' : 'border border-border bg-muted'
                    : isSelected ? 'bg-primary text-primary-foreground' : 'border border-border bg-muted'
                )}
              >
                {(showReview ? isCorrect || isWrong : isSelected) ? '✓' : ''}
              </span>
              <span className="font-medium">{opt.key}</span>
              <span className="text-muted-foreground">{opt.text}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
