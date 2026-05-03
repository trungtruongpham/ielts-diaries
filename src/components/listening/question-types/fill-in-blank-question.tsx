'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { FillBlankData, FillBlankKey } from '@/lib/db/types'

interface FillInBlankQuestionProps {
  questionNumber: number
  data: FillBlankData
  value: string | undefined
  onChange: (value: string) => void
  showReview?: boolean
  answerKey?: FillBlankKey
}

const BLANK_PLACEHOLDER = '___'

export function FillInBlankQuestion({
  questionNumber,
  data,
  value,
  onChange,
  showReview,
  answerKey,
}: FillInBlankQuestionProps) {
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

  const hasInlineBlank = data.stem.includes(BLANK_PLACEHOLDER)

  const inputEl = (
    <input
      type="text"
      value={userAnswer}
      onChange={e => !showReview && handleChange(e.target.value)}
      readOnly={showReview}
      placeholder={showReview ? '' : `Answer (max ${data.word_limit} word${data.word_limit > 1 ? 's' : ''})`}
      className={cn(
        'rounded-lg border px-3 py-1.5 text-sm outline-none transition-colors',
        'focus:border-primary focus:ring-2 focus:ring-primary/20',
        showReview
          ? isCorrect
            ? 'border-green-400 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-950'
            : isWrong
              ? 'border-red-400 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950'
              : isUnanswered
                ? 'border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950'
                : 'border-border bg-card'
          : wordWarning
            ? 'border-amber-400 bg-amber-50 dark:border-amber-700 dark:bg-amber-950'
            : 'border-border bg-card'
      )}
    />
  )

  return (
    <div className="space-y-2">
      <div className="text-sm text-foreground">
        <span className="mr-2 font-bold text-primary">{questionNumber}.</span>

        {hasInlineBlank ? (
          // Inline blank — split stem on ___ and insert input in-between
          <span className="inline-flex flex-wrap items-center gap-1">
            {data.stem.split(BLANK_PLACEHOLDER).map((part, i, arr) => (
              <span key={i} className="inline-flex items-center gap-1">
                <span>{part}</span>
                {i < arr.length - 1 && (
                  <span className="inline-block w-36">{inputEl}</span>
                )}
              </span>
            ))}
          </span>
        ) : (
          // Stem above, input below
          <span>{data.stem}</span>
        )}
      </div>

      {!hasInlineBlank && (
        <div className="pl-5">
          {inputEl}
        </div>
      )}

      {/* Word limit warning */}
      {wordWarning && !showReview && (
        <p className="pl-5 text-xs text-amber-600 dark:text-amber-400">
          Max {data.word_limit} word{data.word_limit > 1 ? 's' : ''} allowed
        </p>
      )}

      {/* Review: show correct answer when wrong */}
      {showReview && !isCorrect && acceptableAnswers.length > 0 && (
        <p className="pl-5 text-xs text-muted-foreground">
          Correct: <strong className="text-green-700 dark:text-green-400">{acceptableAnswers[0]}</strong>
          {acceptableAnswers.length > 1 && ` (or: ${acceptableAnswers.slice(1).join(', ')})`}
        </p>
      )}
    </div>
  )
}
