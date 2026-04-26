'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { submitReviewAction } from '@/app/dashboard/vocabulary/actions'
import type { DbVocabularyWord, DbVocabularyCard } from '@/lib/db/types'

type Rating = 'Again' | 'Hard' | 'Good' | 'Easy'

interface Props {
  word: DbVocabularyWord
  card: DbVocabularyCard
  onRated: (nextDue: string | null) => void
}

const RATING_BUTTONS: Array<{ rating: Rating; label: string; className: string }> = [
  { rating: 'Again', label: 'Again', className: 'border-red-400 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' },
  { rating: 'Hard', label: 'Hard', className: 'border-orange-400 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20' },
  { rating: 'Good', label: 'Good', className: 'border-blue-400 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20' },
  { rating: 'Easy', label: 'Easy', className: 'border-green-400 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' },
]

export function FlashCard({ word, card, onRated }: Props) {
  const [flipped, setFlipped] = useState(false)
  const [rated, setRated] = useState(false)
  const [isRating, startRating] = useTransition()

  function handleFlip() {
    if (!flipped) setFlipped(true)
  }

  function handleRate(rating: Rating) {
    if (rated) return
    startRating(async () => {
      const result = await submitReviewAction(card.id, word.id, rating)
      setRated(true)
      onRated(result.nextDue)
    })
  }

  return (
    <div className="w-full space-y-4">
      {/* Card flip container */}
      <div
        className="relative w-full cursor-pointer select-none"
        style={{ perspective: '1000px' }}
        onClick={handleFlip}
        aria-label="Click to reveal answer"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleFlip()}
      >
        <div
          className="relative w-full transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: '280px',
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-8 text-center shadow-sm"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <span className="text-4xl font-bold tracking-tight">{word.word}</span>
            {word.phonetic && (
              <span className="font-mono text-base text-muted-foreground">{word.phonetic}</span>
            )}
            {word.part_of_speech && (
              <Badge variant="secondary" className="text-xs italic">{word.part_of_speech}</Badge>
            )}
            <p className="mt-4 text-sm text-muted-foreground animate-pulse">Tap to reveal →</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 flex flex-col justify-start gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm overflow-y-auto"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Definition</span>
              <p className="mt-1 text-base leading-relaxed">{word.definition}</p>
            </div>
            {word.example_sentence && (
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Example</span>
                <p className="mt-1 text-sm italic text-foreground/80">&ldquo;{word.example_sentence}&rdquo;</p>
              </div>
            )}
            {word.synonyms.length > 0 && (
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Synonyms</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {word.synonyms.map((s) => (
                    <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rating buttons — shown after flip */}
      {flipped && (
        <div className="space-y-2">
          <p className="text-center text-xs font-medium text-muted-foreground">How well did you know this?</p>
          <div className="grid grid-cols-4 gap-2">
            {RATING_BUTTONS.map(({ rating, label, className }) => (
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
          <div className="flex justify-between px-1 text-[10px] text-muted-foreground">
            <span>Forgot</span>
            <span>Difficult</span>
            <span>Correct</span>
            <span>Perfect</span>
          </div>
        </div>
      )}
    </div>
  )
}
