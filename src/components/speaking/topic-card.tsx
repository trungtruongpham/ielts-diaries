'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type { Part2TopicCard } from '@/lib/ai/types'

interface TopicCardProps {
  topicCard: Part2TopicCard
  onStartSpeaking: () => void
  isExaminerSpeaking: boolean
  className?: string
}

const PREP_TIME_SECONDS = 60

/** Format seconds as M:SS */
function fmt(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function TopicCard({
  topicCard,
  onStartSpeaking,
  isExaminerSpeaking,
  className,
}: TopicCardProps) {
  const [prepRemaining, setPrepRemaining] = useState(PREP_TIME_SECONDS)
  const [prepDone, setPrepDone] = useState(false)

  // Countdown timer
  useEffect(() => {
    if (prepDone) return
    const id = setInterval(() => {
      setPrepRemaining(prev => {
        if (prev <= 1) {
          clearInterval(id)
          setPrepDone(true)
          onStartSpeaking()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [prepDone, onStartSpeaking])

  const isExpired = prepRemaining === 0

  return (
    <div className={cn('rounded-2xl border border-border bg-card shadow-sm', className)}>
      {/* Header */}
      <div className="rounded-t-2xl bg-primary/10 px-6 py-4">
        <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">
          Part 2 — Long Turn
        </div>
        <h3 className="text-lg font-bold text-foreground">{topicCard.topic}</h3>
      </div>

      {/* Body */}
      <div className="p-6">
        <p className="mb-4 text-base font-medium text-foreground">{topicCard.prompt}</p>

        <p className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          You should say:
        </p>
        <ul className="mb-2 space-y-2">
          {topicCard.bullets.map((bullet, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {bullet}
            </li>
          ))}
          <li className="flex items-start gap-2 text-sm text-foreground">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
            {topicCard.followUp}
          </li>
        </ul>
      </div>

      {/* Footer — timer + start button */}
      <div className="flex items-center justify-between rounded-b-2xl border-t border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
              isExpired
                ? 'bg-red-100 text-red-600'
                : prepRemaining <= 10
                ? 'animate-pulse bg-orange-100 text-orange-600'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {isExpired ? '!' : fmt(prepRemaining)}
          </div>
          <span className="text-sm text-muted-foreground">
            {isExpired ? 'Time to speak!' : 'Preparation time'}
          </span>
        </div>

        <button
          onClick={() => { setPrepDone(true); onStartSpeaking() }}
          disabled={isExaminerSpeaking}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow transition-all hover:bg-primary/90 disabled:opacity-50"
        >
          🎙️ Start Speaking
        </button>
      </div>
    </div>
  )
}
