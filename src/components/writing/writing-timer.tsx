'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { AlertTriangle, Clock } from 'lucide-react'

interface WritingTimerProps {
  durationSeconds: number   // 1200 for T1 (20 min), 2400 for T2 (40 min)
  onTimeUp: () => void
  onTick?: (remaining: number) => void
  className?: string
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const secs = s % 60
  return `${m}:${secs.toString().padStart(2, '0')}`
}

export function WritingTimer({ durationSeconds, onTimeUp, onTick, className }: WritingTimerProps) {
  const [remaining, setRemaining] = useState(durationSeconds)
  const startTimeRef = useRef<number>(Date.now())
  const pausedAtRef = useRef<number | null>(null)
  const pausedRemainingRef = useRef<number>(durationSeconds)

  useEffect(() => {
    startTimeRef.current = Date.now()

    // Handle tab hidden — pause timer
    const handleVisibility = () => {
      if (document.hidden) {
        pausedAtRef.current = Date.now()
        pausedRemainingRef.current = remaining
      } else if (pausedAtRef.current !== null) {
        // Rebase start time so elapsed calc is correct after resume
        const pausedDuration = Date.now() - pausedAtRef.current
        startTimeRef.current += pausedDuration
        pausedAtRef.current = null
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    const interval = setInterval(() => {
      if (document.hidden || pausedAtRef.current !== null) return

      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
      const rem = Math.max(0, durationSeconds - elapsed)
      setRemaining(rem)
      onTick?.(rem)

      if (rem <= 0) {
        clearInterval(interval)
        onTimeUp()
      }
    }, 500)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationSeconds])

  const isCritical = remaining <= 60
  const isWarning = remaining <= 300 && !isCritical

  return (
    <div className={cn(
      'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors duration-300',
      isCritical
        ? 'animate-pulse bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
        : isWarning
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
        : 'bg-muted text-muted-foreground',
      className,
    )}>
      {isCritical ? (
        <AlertTriangle className="h-4 w-4 shrink-0" />
      ) : (
        <Clock className="h-4 w-4 shrink-0" />
      )}
      <span className="tabular-nums">{formatTime(remaining)}</span>
    </div>
  )
}
