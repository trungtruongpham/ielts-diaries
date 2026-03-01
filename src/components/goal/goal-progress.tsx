'use client'

import { differenceInDays, format, parseISO } from 'date-fns'
import type { DbTestResult, DbUserGoal } from '@/lib/db/types'
import { getBandColorClass } from '@/lib/ielts'
import { Card, CardContent } from '@/components/ui/card'
import { Headphones, BookOpen, Pen, Mic, Target, CalendarClock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GoalProgressProps {
  goal:    DbUserGoal
  latest?: DbTestResult | null
}

const MODULES = [
  { label: 'Listening', icon: Headphones, current: 'listening_band', target: 'target_listening', color: 'bg-blue-500' },
  { label: 'Reading',   icon: BookOpen,   current: 'reading_band',   target: 'target_reading',   color: 'bg-green-500' },
  { label: 'Writing',   icon: Pen,        current: 'writing_band',   target: 'target_writing',   color: 'bg-amber-500' },
  { label: 'Speaking',  icon: Mic,        current: 'speaking_band',  target: 'target_speaking',  color: 'bg-red-500' },
] as const

export function GoalProgress({ goal, latest }: GoalProgressProps) {
  const overallColors = getBandColorClass(goal.target_overall)
  const daysLeft = goal.target_date
    ? differenceInDays(parseISO(goal.target_date), new Date())
    : null
  const currentOverall = latest?.overall_band ?? null
  const gap = currentOverall !== null ? goal.target_overall - currentOverall : null

  return (
    <div className="space-y-5">
      {/* Overall goal hero */}
      <Card className={cn('border-2', overallColors.border, overallColors.bg)}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className={cn('h-4 w-4', overallColors.text)} />
                <span className={cn('text-sm font-semibold', overallColors.text)}>Overall Goal</span>
              </div>
              <div className={cn('text-5xl font-bold tabular-nums', overallColors.text)}>
                {goal.target_overall.toFixed(1)}
              </div>
            </div>
            <div className="text-right space-y-2">
              {currentOverall !== null && (
                <div>
                  <p className="text-xs text-muted-foreground">Current</p>
                  <p className="text-2xl font-bold tabular-nums text-foreground">
                    {currentOverall.toFixed(1)}
                  </p>
                </div>
              )}
              {gap !== null && (
                <div className={cn('text-sm font-semibold', gap > 0 ? 'text-amber-600' : 'text-green-600')}>
                  {gap > 0 ? `+${gap.toFixed(1)} to go` : '🎉 Reached!'}
                </div>
              )}
            </div>
          </div>

          {/* Progress bar — current/target */}
          {currentOverall !== null && (
            <div className="mt-4">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/10">
                <div
                  className={cn('h-full rounded-full transition-all duration-700', overallColors.text.replace('text-', 'bg-'))}
                  style={{ width: `${Math.min((currentOverall / goal.target_overall) * 100, 100)}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                <span>{currentOverall.toFixed(1)} current</span>
                <span>{goal.target_overall.toFixed(1)} target</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deadline */}
      {goal.target_date && (
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <CalendarClock className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {format(parseISO(goal.target_date), 'MMMM d, yyyy')}
              </p>
              <p className="text-xs text-muted-foreground">
                {daysLeft !== null && daysLeft >= 0
                  ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`
                  : 'Deadline passed'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per-module progress */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Module Targets</h3>
        {MODULES.map(({ label, icon: Icon, current, target, color }) => {
          const curr = latest?.[current] ?? null
          const tgt  = goal[target]
          const pct  = curr !== null ? Math.min((curr / tgt) * 100, 100) : 0
          const gap2 = curr !== null ? tgt - curr : null

          return (
            <div key={label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium text-foreground">{label}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground tabular-nums">
                    {curr !== null ? curr.toFixed(1) : '—'}
                  </span>
                  <span className="text-muted-foreground">/</span>
                  <span className="font-semibold text-foreground tabular-nums">{tgt.toFixed(1)}</span>
                  {gap2 !== null && (
                    <span className={cn('text-xs ml-1 font-medium', gap2 > 0 ? 'text-amber-500' : 'text-green-500')}>
                      {gap2 > 0 ? `+${gap2.toFixed(1)}` : '✓'}
                    </span>
                  )}
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn('h-full rounded-full transition-all duration-700', color)}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
