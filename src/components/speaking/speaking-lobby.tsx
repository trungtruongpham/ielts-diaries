'use client'

import { cn } from '@/lib/utils'
import { checkAudioSupport, unlockAudioContext } from '@/lib/audio-utils'
import { AlertTriangle, Loader2 } from 'lucide-react'
import type { PracticeMode } from '@/hooks/use-speaking-session'

interface SpeakingLobbyProps {
  onStart: (mode: PracticeMode) => void
  isLoading: boolean
  loadingMode: PracticeMode | null   // which card is currently loading
  className?: string
}

// ── Mode definitions ───────────────────────────────────────────────────────────

interface ModeConfig {
  mode: PracticeMode
  emoji: string
  title: string
  subtitle: string
  description: string
  duration: string
  accentClass: string        // ring / border accent on hover
  badgeClass: string         // duration pill colour
  isFull?: boolean           // spans full width on small screens
}

const MODES: ModeConfig[] = [
  {
    mode: 'part1',
    emoji: '🗣️',
    title: 'Part 1',
    subtitle: 'Introduction',
    description: '5 conversational questions on everyday topics',
    duration: '~5 min',
    accentClass: 'hover:border-sky-400/60 hover:ring-sky-400/20',
    badgeClass: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300',
  },
  {
    mode: 'part2',
    emoji: '📝',
    title: 'Part 2',
    subtitle: 'Long Turn',
    description: 'Topic card — speak for up to 2 minutes',
    duration: '~4 min',
    accentClass: 'hover:border-violet-400/60 hover:ring-violet-400/20',
    badgeClass: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300',
  },
  {
    mode: 'part3',
    emoji: '💬',
    title: 'Part 3',
    subtitle: 'Discussion',
    description: '5 abstract questions on society & ideas',
    duration: '~5 min',
    accentClass: 'hover:border-emerald-400/60 hover:ring-emerald-400/20',
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  },
  {
    mode: 'full',
    emoji: '🎯',
    title: 'Full Test',
    subtitle: 'All 3 Parts',
    description: 'Complete IELTS Speaking test — all parts in sequence',
    duration: '~14 min',
    accentClass: 'hover:border-primary/60 hover:ring-primary/20',
    badgeClass: 'bg-primary/10 text-primary dark:bg-primary/20',
    isFull: true,
  },
]

// ── Mode card ─────────────────────────────────────────────────────────────────

function ModeCard({
  config,
  onStart,
  disabled,
  isLoading,
}: {
  config: ModeConfig
  onStart: (mode: PracticeMode) => void
  disabled: boolean
  isLoading: boolean
}) {
  return (
    <button
      id={`mode-card-${config.mode}`}
      onClick={() => {
        // Unlock AudioContext synchronously inside the click handler.
        // This MUST happen before any async calls, otherwise browsers
        // refuse to play audio due to autoplay policy.
        unlockAudioContext()
        onStart(config.mode)
      }}
      disabled={disabled}
      className={cn(
        // Base
        'group relative flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-5 text-left shadow-sm',
        // Transition & hover
        'transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-md',
        'ring-2 ring-transparent',
        config.accentClass,
        // Full-width variant
        config.isFull && 'sm:col-span-2',
        // Disabled / loading
        disabled && 'cursor-not-allowed opacity-50',
        isLoading && 'cursor-not-allowed pointer-events-none',
      )}
    >
      {/* Emoji icon */}
      <div className="flex w-full items-start justify-between gap-2">
        <span
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-2xl',
            'transition-transform duration-200 group-hover:scale-110',
          )}
          aria-hidden
        >
          {config.emoji}
        </span>

        {/* Duration pill */}
        <span className={cn(
          'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold',
          config.badgeClass,
        )}>
          {config.duration}
        </span>
      </div>

      {/* Title + subtitle */}
      <div>
        <p className="text-base font-bold text-foreground leading-tight">
          {config.title}
          <span className="ml-1.5 font-medium text-muted-foreground">
            — {config.subtitle}
          </span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground leading-snug">
          {config.description}
        </p>
      </div>

      {/* Loading spinner or start arrow */}
      <div className={cn(
        'mt-auto flex items-center gap-1.5 text-xs font-semibold',
        'text-muted-foreground transition-colors duration-200 group-hover:text-primary',
      )}>
        {isLoading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Preparing…
          </>
        ) : (
          <>
            <span>Start</span>
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
          </>
        )}
      </div>
    </button>
  )
}

// ── Main lobby ────────────────────────────────────────────────────────────────

export function SpeakingLobby({ onStart, isLoading, loadingMode, className }: SpeakingLobbyProps) {
  const support = checkAudioSupport()
  const canRecord = support.getUserMedia && support.mediaRecorder
  const hasStt = support.speechRecognition

  return (
    <div className={cn('flex flex-col items-center justify-center px-4 py-10', className)}>
      <div className="w-full max-w-lg space-y-6">

        {/* Hero */}
        <div className="text-center">
          <div className="mb-3 text-5xl" aria-hidden>🎤</div>
          <h1 className="mb-1.5 text-3xl font-bold text-foreground">
            IELTS Speaking Practice
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Choose a mode below. Receive instant AI feedback after every answer.
          </p>
        </div>

        {/* Mode grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {MODES.map(cfg => (
            <ModeCard
              key={cfg.mode}
              config={cfg}
              onStart={onStart}
              disabled={!canRecord || isLoading}
              isLoading={isLoading && loadingMode === cfg.mode}
            />
          ))}
        </div>

        {/* Browser warnings */}
        {!hasStt && (
          <div className="flex gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
            <div>
              <p className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                Limited browser support
              </p>
              <p className="mt-0.5 text-xs text-orange-600 dark:text-orange-400">
                Speech-to-text is not available in your browser (Firefox is not supported).
                Audio is still recorded, but live transcription quality may be reduced.
                Use Chrome or Safari for the best experience.
              </p>
            </div>
          </div>
        )}

        {!canRecord && (
          <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <p className="text-sm text-red-700 dark:text-red-300">
              Microphone access is required. Please allow microphone permissions in your browser
              settings and reload this page.
            </p>
          </div>
        )}

        {/* Footer tip */}
        <p className="text-center text-xs text-muted-foreground">
          💡 Tip: Use headphones for a quiet environment and better recognition accuracy.
        </p>
      </div>
    </div>
  )
}
