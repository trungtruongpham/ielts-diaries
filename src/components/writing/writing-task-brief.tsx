'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react'
import { WritingChart } from './writing-chart'
import type { ChartData } from '@/lib/db/types'

interface WritingTaskBriefProps {
  prompt: { text: string; type: string }
  chartData?: ChartData | null
  taskLabel: string        // e.g. "Task 1 · Academic"
  onConfirm: () => void
  onBack?: () => void
}

const READING_SECONDS = 60

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const secs = s % 60
  return `${m}:${secs.toString().padStart(2, '0')}`
}

export function WritingTaskBrief({ prompt, chartData, taskLabel, onConfirm, onBack }: WritingTaskBriefProps) {
  const [remaining, setRemaining] = useState(READING_SECONDS)
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    if (expired) return

    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          setExpired(true)
          onConfirm()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [expired, onConfirm])

  const isWarning = remaining <= 15
  const pct = (remaining / READING_SECONDS) * 100

  return (
    <div className="flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-6xl space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Writing Practice
            </p>
            <h1 className="mt-0.5 text-2xl font-bold text-foreground">{taskLabel}</h1>
          </div>

          {/* Countdown badge */}
          <div className={cn(
            'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors duration-300',
            isWarning
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
              : 'bg-muted text-muted-foreground',
          )}>
            <Clock className={cn('h-4 w-4', isWarning && 'animate-pulse')} />
            {formatTime(remaining)}
          </div>
        </div>

        {/* Countdown progress */}
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-1000',
              isWarning ? 'bg-amber-400' : 'bg-primary/50',
            )}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Reading hint */}
        <p className="text-sm text-muted-foreground">
          <Clock className="mr-1.5 inline h-3.5 w-3.5" />
          You have <span className="font-semibold">{READING_SECONDS} seconds</span> to read this prompt before writing begins.
        </p>

        {/* Prompt card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Your Task
          </h2>
          <blockquote className="whitespace-pre-line text-base leading-relaxed text-foreground border-l-4 border-primary/30 pl-4">
            {prompt.text}
          </blockquote>

          {/* Chart rendered below the prompt instruction */}
          {chartData && (
            <div className="mt-5">
              <WritingChart chartData={chartData} />
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Lobby
            </button>
          )}
          <button
            onClick={onConfirm}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Start Writing
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
