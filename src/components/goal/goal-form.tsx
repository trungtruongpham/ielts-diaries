'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { saveUserGoal } from '@/app/dashboard/goal/actions'
import { BAND_SCORE_OPTIONS, getBandColorClass, getBandDescriptor } from '@/lib/ielts'
import type { DbUserGoal } from '@/lib/db/types'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Headphones, BookOpen, Pen, Mic, Target, Loader2,
  Zap, Pencil, CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface GoalFormProps {
  existing?: DbUserGoal | null
}

const MODULES = [
  { key: 'target_listening', label: 'Listening', icon: Headphones, color: 'text-blue-600',  iconBg: 'bg-blue-50',   accent: '#3b82f6' },
  { key: 'target_reading',   label: 'Reading',   icon: BookOpen,   color: 'text-green-600', iconBg: 'bg-green-50',  accent: '#10b981' },
  { key: 'target_writing',   label: 'Writing',   icon: Pen,        color: 'text-amber-600', iconBg: 'bg-amber-50',  accent: '#f59e0b' },
  { key: 'target_speaking',  label: 'Speaking',  icon: Mic,        color: 'text-red-600',   iconBg: 'bg-red-50',    accent: '#ef4444' },
] as const

type ModuleKey = typeof MODULES[number]['key']

/** Official IELTS rounding: average → nearest 0.5 (0.25 rounds up) */
function computeOverall(vals: number[]): number {
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length
  return Math.round(avg * 2) / 2
}

export function GoalForm({ existing }: GoalFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const prevDerivedRef = useRef<number | null>(null)
  const [autoSynced, setAutoSynced] = useState(false)

  const [targets, setTargets] = useState<Record<ModuleKey, string>>({
    target_listening: existing?.target_listening?.toString() ?? '6',
    target_reading:   existing?.target_reading?.toString()   ?? '6',
    target_writing:   existing?.target_writing?.toString()   ?? '6',
    target_speaking:  existing?.target_speaking?.toString()  ?? '6',
  })
  const [targetOverall, setTargetOverall] = useState(existing?.target_overall?.toString() ?? '6')
  const [overrideOverall, setOverrideOverall] = useState(false)
  const [targetDate, setTargetDate] = useState(existing?.target_date ?? '')

  // Derived overall from all 4 modules
  const derivedOverall = (() => {
    const vals = Object.values(targets).map(parseFloat).filter((v) => !isNaN(v))
    if (vals.length !== 4) return null
    return computeOverall(vals)
  })()

  // Auto-sync overall whenever derivedOverall changes (unless user overrode it)
  useEffect(() => {
    if (derivedOverall === null || overrideOverall) return
    if (derivedOverall !== prevDerivedRef.current) {
      prevDerivedRef.current = derivedOverall
      setTargetOverall(derivedOverall.toString())
      setAutoSynced(true)
      // Flash the "auto-synced" badge briefly
      const t = setTimeout(() => setAutoSynced(false), 2000)
      return () => clearTimeout(t)
    }
  }, [derivedOverall, overrideOverall])

  const handleModuleChange = (key: ModuleKey, value: string) => {
    setTargets((prev) => ({ ...prev, [key]: value }))
    // If user changes a module after overriding, re-enable auto-sync
    if (overrideOverall) setOverrideOverall(false)
  }

  const handleOverallOverride = (value: string) => {
    setOverrideOverall(true)
    setTargetOverall(value)
  }

  const resetToAuto = () => {
    setOverrideOverall(false)
    if (derivedOverall !== null) {
      setTargetOverall(derivedOverall.toString())
    }
  }

  const overallNum = parseFloat(targetOverall)
  const overallColors = getBandColorClass(overallNum)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await saveUserGoal(fd)
      if (result?.error) {
        toast.error('Failed to save goal', { description: result.error })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* ── Module targets ──────────────────────────── */}
      <Card className="border-border/60 overflow-hidden">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">Module Target Scores</h3>
            <span className="text-xs text-muted-foreground">— sets overall automatically</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {MODULES.map(({ key, label, icon: Icon, color, iconBg }) => {
              const val = parseFloat(targets[key])
              const moduleColors = !isNaN(val) && val > 0 ? getBandColorClass(val) : null
              return (
                <div key={key} className="space-y-1.5">
                  <Label
                    htmlFor={key}
                    className={cn('flex items-center gap-1.5 text-sm font-semibold', color)}
                  >
                    <span className={cn('flex h-5 w-5 items-center justify-center rounded', iconBg)}>
                      <Icon className="h-3 w-3" />
                    </span>
                    {label}
                  </Label>
                  <Select
                    name={key}
                    value={targets[key]}
                    onValueChange={(v) => handleModuleChange(key, v)}
                  >
                    <SelectTrigger
                      id={key}
                      className={cn(
                        'font-bold transition-all duration-200',
                        moduleColors
                          ? cn(moduleColors.bg, moduleColors.text, moduleColors.border, 'border')
                          : ''
                      )}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BAND_SCORE_OPTIONS.filter((b) => b > 0).map((b) => (
                        <SelectItem key={b} value={b.toString()}>
                          {b.toFixed(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Overall band — auto-calculated hero ─────── */}
      <Card
        className={cn(
          'border-2 transition-all duration-500',
          overallColors.border,
          overallColors.bg
        )}
      >
        <CardContent className="p-5">
          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className={cn('h-4 w-4', overallColors.text)} />
              <span className={cn('text-sm font-semibold', overallColors.text)}>Overall Target</span>
              {/* Auto-synced flash badge */}
              {autoSynced && !overrideOverall && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary animate-score-reveal">
                  <Zap className="h-2.5 w-2.5" />
                  Auto-calculated
                </span>
              )}
              {/* Locked to auto badge */}
              {!overrideOverall && !autoSynced && derivedOverall !== null && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  Auto
                </span>
              )}
            </div>
            {/* Override toggle */}
            {overrideOverall ? (
              <button
                type="button"
                onClick={resetToAuto}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Zap className="h-3 w-3" />
                Reset to auto
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setOverrideOverall(true)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Pencil className="h-3 w-3" />
                Override
              </button>
            )}
          </div>

          {/* Big score display — always visible */}
          <div className="flex items-end gap-4">
            <div
              key={targetOverall}
              className={cn('text-7xl font-bold tabular-nums leading-none animate-score-reveal', overallColors.text)}
            >
              {overallNum.toFixed(1)}
            </div>
            <div className="pb-1 space-y-0.5">
              <p className={cn('text-sm font-semibold', overallColors.text)}>
                {getBandDescriptor(overallNum)}
              </p>
              {derivedOverall !== null && !overrideOverall && (
                <p className="text-xs text-muted-foreground">
                  Avg of ({MODULES.map((m) => parseFloat(targets[m.key]).toFixed(1)).join(' + ')}) ÷ 4
                </p>
              )}
              {overrideOverall && (
                <p className="text-xs text-amber-600 font-medium">⚠ Manually overridden</p>
              )}
            </div>
          </div>

          {/* Override select — only shown when overrideOverall */}
          {overrideOverall && (
            <div className="mt-4 animate-fade-up">
              <p className="text-xs text-muted-foreground mb-2">Choose your custom overall target:</p>
              <Select
                name="target_overall"
                value={targetOverall}
                onValueChange={handleOverallOverride}
              >
                <SelectTrigger className="font-bold h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BAND_SCORE_OPTIONS.filter((b) => b > 0).map((b) => (
                    <SelectItem key={b} value={b.toString()}>{b.toFixed(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Hidden field always written to FormData */}
          <input type="hidden" name="target_overall" value={targetOverall} />

          {/* Mini module breakdown */}
          <div className="mt-4 grid grid-cols-4 gap-2 border-t border-black/10 pt-4">
            {MODULES.map(({ key, label, icon: Icon, color }) => (
              <div key={key} className="text-center">
                <Icon className={cn('mx-auto h-3 w-3 mb-0.5', color)} />
                <p className="text-[10px] text-muted-foreground">{label.slice(0, 2)}</p>
                <p className={cn('text-sm font-bold tabular-nums', color)}>
                  {parseFloat(targets[key]).toFixed(1)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Target date ──────────────────────────────── */}
      <Card className="border-border/60">
        <CardContent className="p-5 space-y-2">
          <Label htmlFor="target_date" className="font-semibold">
            Target Date <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <p className="text-xs text-muted-foreground">Set a deadline to stay motivated.</p>
          <input type="hidden" name="target_date" value={targetDate} />
          <DatePicker
            id="target_date"
            value={targetDate}
            onChange={setTargetDate}
            placeholder="Pick a deadline"
            minDate={new Date()}
            clearable
          />
        </CardContent>
      </Card>

      {/* ── Submit ───────────────────────────────────── */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" className="flex-1 font-semibold" disabled={isPending}>
          {isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
          ) : (
            existing ? 'Update Goal' : 'Set Goal'
          )}
        </Button>
      </div>
    </form>
  )
}
