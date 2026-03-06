'use client'

import { cn } from '@/lib/utils'
import { checkAudioSupport } from '@/lib/audio-utils'
import { AlertTriangle, Mic, Clock, BookOpen, Volume2 } from 'lucide-react'

interface SpeakingLobbyProps {
  onStart: () => void
  isLoading: boolean
  className?: string
}

export function SpeakingLobby({ onStart, isLoading, className }: SpeakingLobbyProps) {
  const support = checkAudioSupport()
  const canRecord = support.getUserMedia && support.mediaRecorder
  const hasStt = support.speechRecognition

  return (
    <div className={cn('flex flex-col items-center justify-center px-4 py-12', className)}>
      <div className="w-full max-w-md space-y-6">
        {/* Hero */}
        <div className="text-center">
          <div className="mb-4 text-6xl">🎤</div>
          <h1 className="mb-2 text-3xl font-bold text-foreground">IELTS Speaking Practice</h1>
          <p className="text-muted-foreground">
            Practice with an AI examiner in a full 3-part speaking test. Receive instant,
            rubric-grounded feedback after every answer.
          </p>
        </div>

        {/* Feature highlights */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            What to expect
          </h2>
          <ul className="space-y-2.5">
            {[
              { icon: Clock, text: '~11–14 minutes — full 3-part test' },
              { icon: BookOpen, text: 'All 3 parts: Introduction, Long Turn, Discussion' },
              { icon: Volume2, text: 'AI examiner reads questions aloud' },
              { icon: Mic, text: 'Your answers recorded and transcribed live' },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-foreground">
                <Icon className="h-4 w-4 shrink-0 text-primary" />
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* STT warning */}
        {!hasStt && (
          <div className="flex gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
            <div>
              <p className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                Limited browser support
              </p>
              <p className="mt-0.5 text-xs text-orange-600 dark:text-orange-400">
                Speech-to-text transcription is not available in your browser (Firefox is not
                supported). Your audio will still be recorded, but live transcription and AI
                evaluation quality may be reduced. For the best experience, use Chrome or Safari.
              </p>
            </div>
          </div>
        )}

        {/* No mic warning */}
        {!canRecord && (
          <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <p className="text-sm text-red-700 dark:text-red-300">
              Microphone access is required. Please allow microphone permissions in your browser
              settings and reload this page.
            </p>
          </div>
        )}

        {/* Start button */}
        <button
          onClick={onStart}
          disabled={isLoading || !canRecord}
          className="w-full rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? 'Preparing your test...' : '🎯 Start Practice Test'}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          Tip: Use headphones for a quiet environment and better recognition accuracy.
        </p>
      </div>
    </div>
  )
}
