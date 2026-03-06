'use client'

import { cn } from '@/lib/utils'
import { AudioWaveform } from './audio-waveform'
import { formatDuration } from '@/lib/audio-utils'

interface RecordingControlsProps {
  isRecording: boolean
  isEvaluating: boolean
  isExaminerSpeaking: boolean
  duration: number
  maxDuration?: number            // seconds, shows warning when near limit
  onStart: () => void
  onStop: () => void
  className?: string
}

export function RecordingControls({
  isRecording,
  isEvaluating,
  isExaminerSpeaking,
  duration,
  maxDuration = 120,
  onStart,
  onStop,
  className,
}: RecordingControlsProps) {
  const nearLimit = duration > maxDuration * 0.8
  const atLimit = duration >= maxDuration

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* Timer */}
      <div
        className={cn(
          'font-mono text-3xl font-bold tabular-nums transition-colors',
          isRecording && nearLimit ? 'text-orange-500' : 'text-foreground',
          isRecording && atLimit ? 'text-red-500' : ''
        )}
      >
        {formatDuration(duration)}
      </div>

      {/* Waveform — only visible when recording */}
      <AudioWaveform isActive={isRecording} className="h-8" />

      {/* Big record / stop button */}
      <button
        onClick={isRecording ? onStop : onStart}
        disabled={isEvaluating || isExaminerSpeaking}
        className={cn(
          'relative flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg transition-all duration-200 focus:outline-none focus:ring-4',
          isRecording
            ? 'bg-red-500 hover:bg-red-600 focus:ring-red-300 active:scale-95'
            : 'bg-primary hover:bg-primary/90 focus:ring-primary/30 active:scale-95',
          (isEvaluating || isExaminerSpeaking) && 'cursor-not-allowed opacity-50',
          isRecording && 'animate-pulse-slow'
        )}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      >
        {isRecording ? (
          // Stop square
          <div className="h-6 w-6 rounded-sm bg-white" />
        ) : (
          // Microphone SVG (inline, no import needed)
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-8 w-8"
          >
            <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm-6 10a6 6 0 0 0 12 0h2a8 8 0 0 1-7 7.938V21h3v2H8v-2h3v-2.062A8 8 0 0 1 4 11H6z" />
          </svg>
        )}

        {/* Recording ring pulse */}
        {isRecording && (
          <span className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-30" />
        )}
      </button>

      {/* Status label */}
      <p className={cn('text-sm font-medium', isRecording ? 'text-red-500' : 'text-muted-foreground')}>
        {isEvaluating
          ? 'AI is evaluating your answer...'
          : isExaminerSpeaking
          ? 'Wait for the question...'
          : isRecording
          ? '● Recording — press to stop'
          : 'Press the button to start recording'}
      </p>

      {nearLimit && isRecording && (
        <p className="text-xs text-orange-500">
          Auto-stop in {maxDuration - duration}s
        </p>
      )}
    </div>
  )
}
