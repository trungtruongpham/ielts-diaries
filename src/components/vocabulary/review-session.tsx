'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, Repeat } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FlashCard } from './flash-card'
import { McqCard } from './mcq-card'
import type { DbVocabularyWord, DbVocabularyCard } from '@/lib/db/types'

interface QueueItem {
  card: DbVocabularyCard
  word: DbVocabularyWord
}

interface Props {
  initialQueue: QueueItem[]
}

const STATE_STYLES: Record<string, string> = {
  New: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Learning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  Review: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  Relearning: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
}

export function ReviewSession({ initialQueue }: Props) {
  const [queue, setQueue] = useState(initialQueue)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [reviewed, setReviewed] = useState(0)
  const [sessionDone, setSessionDone] = useState(false)

  const total = queue.length
  const current = queue[currentIndex]
  const progress = total > 0 ? Math.round((reviewed / total) * 100) : 0

  // Use MCQ when reps >= 3 (word has been seen enough to test recall)
  const usesMcq = (current?.card.reps ?? 0) >= 3

  function handleRated(_nextDue: string | null) {
    setReviewed((r) => r + 1)
    const nextIndex = currentIndex + 1
    if (nextIndex >= total) {
      setSessionDone(true)
    } else {
      setCurrentIndex(nextIndex)
    }
  }

  if (sessionDone || !current) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-6 py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30">
            <CheckCircle className="h-10 w-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Session Complete!</h2>
            <p className="mt-1 text-muted-foreground">
              You reviewed {reviewed} card{reviewed !== 1 ? 's' : ''} in this session.
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/dashboard/vocabulary/review">
                <Repeat className="mr-2 h-4 w-4" />
                Review Again
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/vocabulary">Back to Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{reviewed} / {total} reviewed</span>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATE_STYLES[current.card.state] ?? STATE_STYLES.New}`}>
              {current.card.state}
            </span>
            <Badge variant="outline" className="text-[10px]">
              {usesMcq ? 'Multiple Choice' : 'Flashcard'}
            </Badge>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Card */}
      {usesMcq ? (
        <McqCard
          key={`mcq-${current.card.id}`}
          word={current.word}
          card={current.card}
          onRated={handleRated}
        />
      ) : (
        <FlashCard
          key={`flash-${current.card.id}`}
          word={current.word}
          card={current.card}
          onRated={handleRated}
        />
      )}

      {/* Remaining hint */}
      <p className="text-center text-xs text-muted-foreground">
        {total - reviewed - 1 > 0 ? `${total - reviewed - 1} card${total - reviewed - 1 !== 1 ? 's' : ''} remaining` : 'Last card!'}
      </p>
    </div>
  )
}
