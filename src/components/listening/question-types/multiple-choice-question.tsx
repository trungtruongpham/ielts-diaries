'use client'

import { cn } from '@/lib/utils'
import type { MultipleChoiceData, MultipleChoiceKey } from '@/lib/db/types'

interface MultipleChoiceQuestionProps {
  questionNumber: number
  data: MultipleChoiceData
  value: string | undefined
  onChange: (value: string) => void
  showReview?: boolean
  answerKey?: MultipleChoiceKey
}

export function MultipleChoiceQuestion({
  questionNumber,
  data,
  value,
  onChange,
  showReview,
  answerKey,
}: MultipleChoiceQuestionProps) {
  const correctAnswer = answerKey?.answer

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">
        <span className="mr-2 font-bold text-primary">{questionNumber}.</span>
        {data.stem}
      </p>

      <div className="space-y-2 pl-5">
        {data.options.map(opt => {
          const isSelected = value === opt.key
          const isCorrect = showReview && opt.key === correctAnswer
          const isWrong = showReview && isSelected && opt.key !== correctAnswer

          return (
            <button
              key={opt.key}
              onClick={() => !showReview && onChange(opt.key)}
              disabled={showReview}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-sm transition-all duration-150',
                showReview
                  ? isCorrect
                    ? 'border-green-400 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-200'
                    : isWrong
                      ? 'border-red-400 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-200'
                      : 'border-border bg-card text-muted-foreground'
                  : isSelected
                    ? 'border-primary bg-primary/10 text-foreground ring-2 ring-primary/20'
                    : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5'
              )}
            >
              {/* Key circle */}
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                  showReview
                    ? isCorrect
                      ? 'bg-green-500 text-white'
                      : isWrong
                        ? 'bg-red-500 text-white'
                        : 'bg-muted text-muted-foreground'
                    : isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                )}
              >
                {opt.key}
              </span>
              <span>{opt.text}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
