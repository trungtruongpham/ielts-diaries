'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Send, Loader2 } from 'lucide-react'
import { WordCounter } from './word-counter'
import { WritingTimer } from './writing-timer'
import { WritingChart } from './writing-chart'
import type { UseWritingSessionReturn } from '@/hooks/use-writing-session'

interface WritingEditorProps {
  session: UseWritingSessionReturn
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length
}

const TASK_DURATION: Record<1 | 2, number> = {
  1: 1200,  // 20 min
  2: 2400,  // 40 min
}

const TASK_MINIMUM: Record<1 | 2, number> = {
  1: 150,
  2: 250,
}

export function WritingEditor({ session }: WritingEditorProps) {
  const { currentPrompt, currentTask, taskType, sessionId, submitAnswer, status } = session
  const [answer, setAnswer] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [startTime] = useState(() => Date.now())
  const [showConfirm, setShowConfirm] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const minimum = TASK_MINIMUM[currentTask]
  const duration = taskType === 'task2' ? TASK_DURATION[2] : TASK_DURATION[currentTask]
  const isBelow80 = wordCount < Math.floor(minimum * 0.8)
  const isEvaluating = status === 'evaluating'

  const DRAFT_KEY = `writing-draft-${sessionId}-task${currentTask}`

  // Restore draft on mount
  useEffect(() => {
    const draft = typeof window !== 'undefined' ? localStorage.getItem(DRAFT_KEY) : null
    if (draft) {
      setAnswer(draft)
      setWordCount(countWords(draft))
    }
    textareaRef.current?.focus()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-save to localStorage every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      if (answer) localStorage.setItem(DRAFT_KEY, answer)
    }, 30_000)
    return () => clearInterval(interval)
  }, [answer, DRAFT_KEY])

  // Debounced word count
  useEffect(() => {
    const t = setTimeout(() => setWordCount(countWords(answer)), 100)
    return () => clearTimeout(t)
  }, [answer])

  const handleSubmit = useCallback(async () => {
    if (isEvaluating) return
    localStorage.removeItem(DRAFT_KEY)
    const elapsed = Math.round((Date.now() - startTime) / 1000)
    await submitAnswer(answer, wordCount, elapsed)
    setShowConfirm(false)
  }, [isEvaluating, DRAFT_KEY, startTime, submitAnswer, answer, wordCount])

  const onSubmitClick = () => {
    if (wordCount < minimum) {
      setShowConfirm(true)
    } else {
      handleSubmit()
    }
  }

  const onTimeUp = useCallback(() => {
    handleSubmit()
  }, [handleSubmit])

  const taskLabel = currentTask === 1
    ? `Task 1 · ${session.taskType === 'task1_gt' ? 'General Training' : 'Academic'}`
    : 'Task 2 · Essay'

  const promptTypeLabel = currentPrompt?.type
    ? currentPrompt.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : ''

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col overflow-hidden">
      {/* Sticky sub-header bar */}
      <div className="z-20 shrink-0 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="container mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">{taskLabel}</p>
            {promptTypeLabel && (
              <p className="text-xs text-muted-foreground">{promptTypeLabel}</p>
            )}
          </div>

          <WritingTimer durationSeconds={duration} onTimeUp={onTimeUp} />

          <button
            onClick={onSubmitClick}
            disabled={isBelow80 || isEvaluating}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
              isBelow80 || isEvaluating
                ? 'cursor-not-allowed bg-muted text-muted-foreground'
                : 'bg-primary text-primary-foreground hover:bg-primary/90',
            )}
          >
            {isEvaluating ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Evaluating…</>
            ) : (
              <><Send className="h-4 w-4" /> Submit</>
            )}
          </button>
        </div>
      </div>

      {/* Two-pane body — fills remaining viewport height, no page scroll */}
      <div className="container mx-auto flex max-w-6xl flex-1 overflow-hidden px-4">

        {/* ── Left: Chart panel — fills full height, no scroll ── */}
        {session.currentChartData && (
          <div className="hidden lg:flex w-[520px] shrink-0 flex-col border-r border-border py-6 pr-6 overflow-hidden">
            <WritingChart chartData={session.currentChartData} className="flex-1 min-h-0" />
          </div>
        )}

        {/* ── Right: Writing column — scrolls independently ── */}
        <div className={cn(
          'flex-1 min-w-0 overflow-y-auto py-6',
          session.currentChartData ? 'lg:pl-6' : '',
        )}>
          <div className="space-y-4">
            {/* Mobile chart (shown below sm, hidden on lg) */}
            {session.currentChartData && (
              <div className="lg:hidden">
                <WritingChart chartData={session.currentChartData} />
              </div>
            )}

            {/* Task prompt (compact) */}
            {currentPrompt && (
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Task
                </p>
                <div className="whitespace-pre-line text-sm leading-relaxed text-foreground border-l-4 border-primary/30 pl-4">
                  {currentPrompt.text}
                </div>
              </div>
            )}

            {/* Textarea — grows to fill available space */}
            <div className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Your Answer
              </p>
              <textarea
                ref={textareaRef}
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                disabled={isEvaluating}
                placeholder="Start writing your answer here…"
                className={cn(
                  'w-full min-h-[320px] resize-vertical rounded-2xl border border-border bg-[#fafafa] dark:bg-[#111]',
                  'p-4 text-base leading-[1.75] text-foreground',
                  'outline-none transition-shadow duration-200',
                  'focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]',
                  'placeholder:text-muted-foreground/50',
                  isEvaluating && 'opacity-60 cursor-not-allowed',
                )}
              />
              <WordCounter wordCount={wordCount} minimum={minimum} />
            </div>

            {/* Under-minimum confirm */}
            {showConfirm && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 p-5">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                  Your answer is under the {minimum}-word minimum ({wordCount} words written).
                </p>
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                  Submitting below the minimum will significantly lower your Task Achievement / Task Response score.
                </p>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={handleSubmit}
                    className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
                  >
                    Submit Anyway
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
                  >
                    Keep Writing
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
