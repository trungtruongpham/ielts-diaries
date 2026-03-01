'use client'

import {
  ResponsiveContainer, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, Legend,
} from 'recharts'
import type { DbTestResult } from '@/lib/db/types'
import type { DbUserGoal } from '@/lib/db/types'
import { cn } from '@/lib/utils'

interface ModuleRadarChartProps {
  latest:   DbTestResult | null
  goal?:    DbUserGoal | null
  className?: string
}

const MODULES = [
  { key: 'listening_band', label: 'Listening' },
  { key: 'reading_band',   label: 'Reading'   },
  { key: 'writing_band',   label: 'Writing'   },
  { key: 'speaking_band',  label: 'Speaking'  },
] as const

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-foreground mb-1">{payload[0]?.payload?.module}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-muted-foreground">{entry.name}</span>
          </div>
          <span className="font-bold tabular-nums" style={{ color: entry.color }}>
            {entry.value?.toFixed(1) ?? '—'}
          </span>
        </div>
      ))}
    </div>
  )
}

export function ModuleRadarChart({ latest, goal, className }: ModuleRadarChartProps) {
  if (!latest) {
    return (
      <div className={cn('flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20', className)}>
        <p className="text-sm text-muted-foreground">No data yet.</p>
      </div>
    )
  }

  const data = MODULES.map(({ key, label }) => {
    const current = latest[key] ?? null
    const target  = goal
      ? key === 'listening_band' ? goal.target_listening
      : key === 'reading_band'  ? goal.target_reading
      : key === 'writing_band'  ? goal.target_writing
      : goal.target_speaking
      : null
    return { module: label, current, target }
  })

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid gridType="polygon" stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="module"
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
          />
          <PolarRadiusAxis
            domain={[0, 9]}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
          <Radar
            name="Current"
            dataKey="current"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.25}
            strokeWidth={2}
          />
          {goal && (
            <Radar
              name="Target"
              dataKey="target"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.1}
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
          )}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
