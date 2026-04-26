'use client'

import { useState, useEffect, useTransition } from 'react'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { generateMcqDistractorsAction, submitReviewAction } from '@/app/dashboard/vocabulary/actions'
import type { DbVocabularyWord, DbVocabularyCard } from '@/lib/db/types'

type Rating = 'Again' | 'Hard' | 'Good' | 'Easy'

interface Props {
  word: DbVocabularyWord
  card: DbVocabularyCard
  onRated: (nextDue: string | null) => void
}

type SelectState = { selected: string; correct: boolean } | null

const CORRECT_RATINGS: Array<{ rating: Rating; label: string; className: string }> = [
  { rating: 'Good', label: 'Good', className: 'border-blue-400 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20' },
  { rating: 'Easy', label: 'Easy', className: 'border-green-400 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' },
]
const WRONG_RATINGS: Array<{ rating: Rating; label: string; className: string }> = [
  { rating: 'Again', label: 'Again', className: 'border-red-400 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' },
  { rating: 'Hard', label: 'Hard', className: 'border-orange-400 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20' },
]

export function McqCard({ word, card, onRated }: Props) {
  const [options, setOptions] = useState<string[]>([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [selectState, setSelectState] = useState<SelectState>(null)
  const [isRating, startRating] = useTransition()
  const [rated, setRated] = useState(false)

  useEffect(() => {
    let cancelled = false
    setIsLoadingOptions(true)
    generateMcqDistractorsAction(word.id, word.word).then((result) => {
      if (cancelled) return
      setOptions(result.data ?? [word.word])
      setIsLoadingOptions(false)
    })
    return () => { cancelled = true }
  }, [word.id, word.word])

  function handleSelect(option: string) {
    if (selectState) return
    setSelectState({ selected: option, correct: option === word.word })
  }

  function handleRate(rating: Rating) {
    if (rated) return
    startRating(async () => {
      const result = await submitReviewAction(card.id, word.id, rating)
      setRated(true)
      onRated(result.nextDue)
    })
  }

  const answeredCorrectly = selectState?.correct
  const ratingsToShow = answeredCorrectly ? CORRECT_RATINGS : WRONG_RATINGS

  return (
    <div className="w-full space-y-6">
      {/* Question panel */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Which word matches this definition?
          </span>
          <p className="text-base leading-relaxed font-medium">{word.definition}</p>
        </div>
        {word.example_sentence && (
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
            <p className="text-sm italic text-foreground/80">&ldquo;{word.example_sentence}&rdquo;</p>
          </div>
        )}
      </div>

      {/* Options */}
      {isLoadingOptions ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {options.map((option) => {
            const isSelected = selectState?.selected === option
            const isCorrect = option === word.word
            const revealed = !!selectState

            let optionClass = 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-muted/50'
            if (revealed) {
              if (isCorrect) optionClass = 'border-green-400 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
              else if (isSelected && !isCorrect) optionClass = 'border-red-400 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
              else optionClass = 'border-border bg-background text-muted-foreground opacity-60'
            }

            return (
              <button
                key={option}
                onClick={() => handleSelect(option)}
                disabled={!!selectState}
                className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors ${optionClass}`}
              >
                {option}
                {revealed && isCorrect && <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />}
                {revealed && isSelected && !isCorrect && <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
              </button>
            )
          })}
        </div>
      )}

      {/* Rating after selection */}
      {selectState && (
        <div className="space-y-2">
          <p className="text-center text-sm font-medium">
            {answeredCorrectly ? (
              <span className="text-green-600 dark:text-green-400">Correct! How confident were you?</span>
            ) : (
              <span className="text-red-600 dark:text-red-400">The correct answer was &ldquo;{word.word}&rdquo;</span>
            )}
          </p>
          <div className={`grid gap-2 ${ratingsToShow.length === 2 ? 'grid-cols-2' : 'grid-cols-4'}`}>
            {ratingsToShow.map(({ rating, label, className }) => (
              <Button
                key={rating}
                variant="outline"
                size="sm"
                className={`h-10 font-semibold ${className}`}
                onClick={() => handleRate(rating)}
                disabled={isRating || rated}
              >
                {isRating && !rated ? <Loader2 className="h-4 w-4 animate-spin" /> : label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
