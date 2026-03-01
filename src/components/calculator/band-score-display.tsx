'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { getBandColorClass, getBandDescriptor } from '@/lib/ielts'

interface BandScoreDisplayProps {
  band: number | null
  label?: string
  size?: 'sm' | 'md' | 'lg'
  showDescriptor?: boolean
}

export function BandScoreDisplay({
  band,
  label,
  size = 'lg',
  showDescriptor = true,
}: BandScoreDisplayProps) {
  const prevBand = useRef<number | null>(null)
  const isNew = band !== null && band !== prevBand.current

  useEffect(() => {
    prevBand.current = band
  })

  if (band === null) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border',
          size === 'lg' && 'py-10',
          size === 'md' && 'py-6',
          size === 'sm' && 'py-4'
        )}
      >
        <span className="text-muted-foreground text-sm">
          {label || 'Enter answers above'}
        </span>
      </div>
    )
  }

  const colors = getBandColorClass(band)
  const descriptor = getBandDescriptor(band)

  const sizeClasses = {
    lg: 'text-7xl py-8 px-6',
    md: 'text-5xl py-6 px-4',
    sm: 'text-3xl py-4 px-3',
  }

  return (
    <div
      key={band} // re-trigger animation when band changes
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border-2 animate-score-reveal',
        colors.bg,
        colors.border,
        size === 'lg' && 'py-8 px-6',
        size === 'md' && 'py-6 px-4',
        size === 'sm' && 'py-4 px-3'
      )}
    >
      <span
        className={cn(
          'font-bold tabular-nums leading-none',
          colors.text,
          size === 'lg' && 'text-7xl',
          size === 'md' && 'text-5xl',
          size === 'sm' && 'text-3xl'
        )}
      >
        {band.toFixed(1)}
      </span>
      {showDescriptor && (
        <span className={cn('mt-2 text-sm font-semibold', colors.text)}>
          {descriptor}
        </span>
      )}
      {label && (
        <span className="mt-1 text-xs text-muted-foreground">{label}</span>
      )}
    </div>
  )
}
