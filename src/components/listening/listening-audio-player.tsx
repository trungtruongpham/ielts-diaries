'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/lib/audio-utils'
import type { ListeningMode } from '@/lib/db/types'

interface ListeningAudioPlayerProps {
  audioUrl: string
  mode: ListeningMode
  sectionNumber: number
  autoPlay?: boolean
  onEnded?: () => void
  compact?: boolean
  className?: string
}

export function ListeningAudioPlayer({
  audioUrl,
  mode,
  sectionNumber,
  autoPlay = false,
  onEnded,
  compact = false,
  className,
}: ListeningAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)

  const isStrict = mode === 'strict'
  const canReplay = !isStrict
  const replayBlocked = isStrict && hasPlayedOnce

  // ── Reset on section change ────────────────────────────────────────────────
  useEffect(() => {
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setIsLoading(true)
    setHasError(false)
    setHasPlayedOnce(false)
  }, [audioUrl, sectionNumber])

  // ── Audio event wiring ─────────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      setIsLoading(false)
    }
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleAudioEnded = () => {
      setIsPlaying(false)
      setHasPlayedOnce(true)
      onEnded?.()
    }
    const handleError = () => {
      setHasError(true)
      setIsLoading(false)
    }
    const handleCanPlay = () => setIsLoading(false)

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleAudioEnded)
    audio.addEventListener('error', handleError)
    audio.addEventListener('canplay', handleCanPlay)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleAudioEnded)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('canplay', handleCanPlay)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl])

  // ── Auto-play in strict mode ───────────────────────────────────────────────
  useEffect(() => {
    if (!autoPlay || hasPlayedOnce) return
    const audio = audioRef.current
    if (!audio || isLoading) return
    audio.play().then(() => setIsPlaying(true)).catch(() => {
      // Autoplay blocked by browser — user must click play
    })
  }, [autoPlay, hasPlayedOnce, isLoading])

  // ── Controls ───────────────────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    if (replayBlocked) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(console.warn)
    }
  }, [isPlaying, replayBlocked])

  const handleSeek = useCallback((newTime: number) => {
    const audio = audioRef.current
    if (!audio || isStrict) return
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }, [isStrict])

  const handleReplay = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !canReplay) return
    audio.currentTime = 0
    audio.play().then(() => setIsPlaying(true)).catch(console.warn)
  }, [canReplay])

  const handleVolumeToggle = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    const next = !isMuted
    audio.muted = next
    setIsMuted(next)
  }, [isMuted])

  const handleVolumeChange = useCallback((v: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = v
    setVolume(v)
    if (v > 0) setIsMuted(false)
  }, [])

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  // ── Compact mode (mobile top bar) ─────────────────────────────────────────
  if (compact) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <audio ref={audioRef} src={audioUrl} preload="metadata" />
        <button
          onClick={togglePlay}
          disabled={replayBlocked || hasError}
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors',
            replayBlocked || hasError
              ? 'bg-muted text-muted-foreground/40'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
        >
          {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 translate-x-px" />}
        </button>

        <div className="flex flex-1 flex-col gap-0.5">
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{formatDuration(Math.floor(currentTime))}</span>
            <span>{duration > 0 ? formatDuration(Math.floor(duration)) : '--:--'}</span>
          </div>
        </div>

        {isStrict && (
          <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">
            Once only
          </span>
        )}
      </div>
    )
  }

  // ── Full player ────────────────────────────────────────────────────────────
  return (
    <div className={cn('space-y-3', className)}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Status pill */}
      {isStrict && (
        <div className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 dark:border-red-800 dark:bg-red-950">
          <span className="text-xs font-medium text-red-700 dark:text-red-300">
            {replayBlocked
              ? 'Audio has finished playing'
              : hasPlayedOnce
                ? 'Audio plays once — rewinding disabled'
                : 'Audio plays once (strict mode)'}
          </span>
        </div>
      )}

      {hasError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Audio failed to load. Questions are still accessible.
        </div>
      )}

      {/* Main controls */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        {/* Play / Pause button */}
        <div className="mb-3 flex items-center gap-3">
          <button
            onClick={togglePlay}
            disabled={replayBlocked || hasError || isLoading}
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-sm transition-all duration-150',
              replayBlocked || hasError || isLoading
                ? 'bg-muted text-muted-foreground/40'
                : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md active:scale-95'
            )}
          >
            {isLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 translate-x-px" />
            )}
          </button>

          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Part {sectionNumber}</p>
            <p className="text-xs text-muted-foreground">
              {isLoading ? 'Loading audio…' : hasError ? 'Audio unavailable' : formatDuration(Math.floor(currentTime)) + ' / ' + (duration > 0 ? formatDuration(Math.floor(duration)) : '--:--')}
            </p>
          </div>

          {/* Replay (practice only) */}
          {canReplay && (
            <button
              onClick={handleReplay}
              disabled={hasError || isLoading}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
              title="Replay from beginning"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <input
            type="range"
            min={0}
            max={duration || 1}
            value={currentTime}
            onChange={e => handleSeek(Number(e.target.value))}
            disabled={isStrict || hasError || isLoading}
            step={0.5}
            className={cn(
              'h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary',
              (isStrict || hasError) && 'cursor-not-allowed'
            )}
          />
          {/* Custom progress fill overlay (for consistent cross-browser styling) */}
          <div className="relative -mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="pointer-events-none h-full rounded-full bg-primary/50 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>{formatDuration(Math.floor(currentTime))}</span>
            <span>{duration > 0 ? formatDuration(Math.floor(duration)) : '--:--'}</span>
          </div>
        </div>

        {/* Volume (practice mode only) */}
        {canReplay && (
          <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
            <button
              onClick={handleVolumeToggle}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
            >
              {isMuted || volume === 0
                ? <VolumeX className="h-3.5 w-3.5" />
                : <Volume2 className="h-3.5 w-3.5" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={e => handleVolumeChange(Number(e.target.value))}
              className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-primary"
            />
          </div>
        )}
      </div>
    </div>
  )
}
