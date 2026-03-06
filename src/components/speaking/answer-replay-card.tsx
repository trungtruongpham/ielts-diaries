'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Play, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/lib/audio-utils'
import type { DbSpeakingAnswer } from '@/lib/db/types'
import type { SpeakingFeedback } from '@/lib/db/types'

interface AnswerReplayCardProps {
  answer: DbSpeakingAnswer
  questionNumber: number
  className?: string
}

function bandColor(b: number | null) {
  if (b === null) return 'text-muted-foreground'
  if (b >= 7.5) return 'text-emerald-600'
  if (b >= 6.0) return 'text-blue-600'
  if (b >= 5.0) return 'text-yellow-600'
  return 'text-red-600'
}

function barColor(b: number | null) {
  if (b === null) return 'bg-muted'
  if (b >= 7.5) return 'bg-emerald-500'
  if (b >= 6.0) return 'bg-blue-500'
  if (b >= 5.0) return 'bg-yellow-500'
  return 'bg-red-500'
}

function AudioPlayer({ src }: { src: string }) {
  const [playing, setPlaying] = useState(false)
  const [audio] = useState(() => {
    if (typeof Audio === 'undefined') return null
    const a = new Audio(src)
    a.onended = () => setPlaying(false)
    return a
  })

  function toggle() {
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play().catch(() => setPlaying(false))
      setPlaying(true)
    }
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-accent"
    >
      {playing
        ? <><Pause className="h-3.5 w-3.5 text-red-500" /> Pause</>
        : <><Play className="h-3.5 w-3.5 text-primary" /> Play Recording</>
      }
    </button>
  )
}

const CRITERIA = [
  { key: 'fluency_coherence' as const, abbr: 'FC', label: 'Fluency & Coherence' },
  { key: 'lexical_resource' as const, abbr: 'LR', label: 'Lexical Resource' },
  { key: 'grammatical_range' as const, abbr: 'GRA', label: 'Grammar & Accuracy' },
  { key: 'pronunciation' as const, abbr: 'P', label: 'Pronunciation' },
]

export function AnswerReplayCard({ answer, questionNumber, className }: AnswerReplayCardProps) {
  const [expanded, setExpanded] = useState(false)
  const feedback = answer.feedback as SpeakingFeedback | null

  return (
    <div className={cn('rounded-xl border border-border bg-card shadow-sm overflow-hidden', className)}>
      {/* Header row */}
      <div className="flex items-start gap-3 p-4">
        {/* Band badge */}
        <div className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 text-sm font-bold tabular-nums',
          answer.band_score != null ? barColor(answer.band_score) + ' border-transparent text-white' : 'border-border text-muted-foreground'
        )}>
          {answer.band_score != null ? answer.band_score.toFixed(1) : '—'}
        </div>

        <div className="flex-1 min-w-0">
          {/* Question */}
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Question {questionNumber}
          </p>
          <p className="text-sm font-medium text-foreground leading-snug">
            &ldquo;{answer.question_text}&rdquo;
          </p>

          {/* Controls row */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {answer.audio_url && <AudioPlayer src={answer.audio_url} />}
            {answer.duration_seconds != null && (
              <span className="text-xs text-muted-foreground font-mono">
                {formatDuration(answer.duration_seconds)}
              </span>
            )}
            <button
              onClick={() => setExpanded(e => !e)}
              className="ml-auto flex items-center gap-1 text-xs text-primary hover:underline"
            >
              {expanded ? (
                <><ChevronUp className="h-3 w-3" />Hide feedback</>
              ) : (
                <><ChevronDown className="h-3 w-3" />View feedback</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable section */}
      {expanded && (
        <div className="border-t border-border p-4 space-y-4">
          {/* Transcript */}
          {answer.transcript && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                📝 Transcript
              </p>
              <p className="text-sm text-foreground leading-relaxed bg-muted/30 rounded-lg p-3">
                {answer.transcript}
              </p>
            </div>
          )}

          {/* Criteria bars */}
          {feedback && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Criteria Scores
              </p>
              <div className="space-y-2">
                {CRITERIA.map(c => {
                  const val = feedback[c.key]
                  return (
                    <div key={c.key} className="flex items-center gap-2">
                      <span className="w-8 text-right text-[11px] font-bold text-muted-foreground uppercase">{c.abbr}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all duration-700', barColor(val))}
                          style={{ width: `${(val / 9) * 100}%` }}
                        />
                      </div>
                      <span className={cn('w-8 text-xs font-bold tabular-nums', bandColor(val))}>
                        {val.toFixed(1)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Feedback text */}
          {feedback?.feedback && (
            <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-3">
              {feedback.feedback}
            </p>
          )}

          {/* Strengths + improvements */}
          {feedback && (feedback.strengths?.length > 0 || feedback.improvements?.length > 0) && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 border-t border-border pt-3">
              {feedback.strengths?.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-emerald-600">✓ Strengths</p>
                  <ul className="space-y-1">
                    {feedback.strengths.map((s, i) => (
                      <li key={i} className="text-xs text-foreground leading-relaxed">{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {feedback.improvements?.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-blue-600">💡 To improve</p>
                  <ul className="space-y-1">
                    {feedback.improvements.map((s, i) => (
                      <li key={i} className="text-xs text-foreground leading-relaxed">{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
