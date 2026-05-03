'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { TableFillData, TableFillKey } from '@/lib/db/types'

interface TableFillQuestionProps {
  questionNumber: number
  data: TableFillData
  value: string | undefined
  onChange: (value: string) => void
  showReview?: boolean
  answerKey?: TableFillKey
}

export function TableFillQuestion({
  questionNumber,
  data,
  value,
  onChange,
  showReview,
  answerKey,
}: TableFillQuestionProps) {
  const [wordWarning, setWordWarning] = useState(false)

  const acceptableAnswers = answerKey?.acceptable ?? []
  const userAnswer = value ?? ''
  const isCorrect =
    showReview &&
    acceptableAnswers.some(a => a.toLowerCase() === userAnswer.trim().toLowerCase())
  const isWrong = showReview && !!userAnswer && !isCorrect
  const isUnanswered = showReview && !userAnswer

  function handleChange(raw: string) {
    const wordCount = raw.trim().split(/\s+/).filter(Boolean).length
    setWordWarning(wordCount > data.word_limit)
    onChange(raw)
  }

  return (
    <div className="space-y-2">
      {/* Table context */}
      <div className="rounded-xl border border-border bg-muted/30 p-3">
        <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">{data.table_context}</pre>
      </div>

      {/* Question stem + input */}
      <div className="flex flex-wrap items-center gap-2 pl-1 text-sm">
        <span className="font-bold text-primary">{questionNumber}.</span>
        <span className="text-foreground">{data.stem}</span>
        <input
          type="text"
          value={userAnswer}
          onChange={e => !showReview && handleChange(e.target.value)}
          readOnly={showReview}
          placeholder={`max ${data.word_limit} word${data.word_limit > 1 ? 's' : ''}`}
          className={cn(
            'rounded-lg border px-3 py-1.5 text-sm outline-none transition-colors',
            'focus:border-primary focus:ring-2 focus:ring-primary/20',
            showReview
              ? isCorrect
                ? 'border-green-400 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-950'
                : isWrong
                  ? 'border-red-400 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950'
                  : isUnanswered
                    ? 'border-amber-400 bg-amber-50 dark:border-amber-700 dark:bg-amber-950'
                    : 'border-border bg-card'
              : wordWarning
                ? 'border-amber-400 bg-amber-50 dark:border-amber-700 dark:bg-amber-950'
                : 'border-border bg-card'
          )}
        />
      </div>

      {wordWarning && !showReview && (
        <p className="pl-5 text-xs text-amber-600 dark:text-amber-400">
          Max {data.word_limit} word{data.word_limit > 1 ? 's' : ''} allowed
        </p>
      )}

      {showReview && !isCorrect && acceptableAnswers.length > 0 && (
        <p className="pl-5 text-xs text-muted-foreground">
          Correct: <strong className="text-green-700 dark:text-green-400">{acceptableAnswers[0]}</strong>
          {acceptableAnswers.length > 1 && ` (or: ${acceptableAnswers.slice(1).join(', ')})`}
        </p>
      )}
    </div>
  )
}
