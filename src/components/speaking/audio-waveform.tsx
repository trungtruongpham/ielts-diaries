'use client'

import { cn } from '@/lib/utils'

interface AudioWaveformProps {
  isActive: boolean
  className?: string
}

/** Animated recording pulse / waveform indicator */
export function AudioWaveform({ isActive, className }: AudioWaveformProps) {
  const bars = [3, 5, 8, 5, 7, 4, 6, 8, 5, 3]

  return (
    <div className={cn('flex items-center justify-center gap-0.5', className)}>
      {bars.map((h, i) => (
        <div
          key={i}
          className={cn(
            'w-1 rounded-full bg-red-500 transition-all',
            isActive ? 'animate-waveform opacity-90' : 'opacity-30'
          )}
          style={{
            height: isActive ? `${h * 3}px` : '4px',
            animationDelay: `${i * 0.07}s`,
            animationDuration: `${0.6 + (i % 3) * 0.15}s`,
          }}
        />
      ))}
    </div>
  )
}
