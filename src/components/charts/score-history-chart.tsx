'use client'

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine, Area, AreaChart,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import type { DbTestResult } from '@/lib/db/types'
import type { DbUserGoal } from '@/lib/db/types'
import { cn } from '@/lib/utils'

interface ScoreHistoryChartProps {
  results: DbTestResult[]
  goal?: DbUserGoal | null
  className?: string
}

const MODULE_LINES = [
  { key: 'overall_band',  label: 'Overall',   color: '#3b82f6', width: 2.5 },
  { key: 'listening_band', label: 'Listening', color: '#6366f1', width: 1.5 },
  { key: 'reading_band',  label: 'Reading',   color: '#10b981', width: 1.5 },
  { key: 'writing_band',  label: 'Writing',   color: '#f59e0b', width: 1.5 },
  { key: 'speaking_band', label: 'Speaking',  color: '#ef4444', width: 1.5 },
] as const

type ModuleKey = typeof MODULE_LINES[number]['key']

interface ChartDatum {
  date: string
  dateLabel: string
  overall_band:   number
  listening_band: number | null
  reading_band:   number | null
  writing_band:   number | null
  speaking_band:  number | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-lg text-sm">
      <p className="mb-2 font-semibold text-foreground">{label}</p>
      {payload.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (entry: any) =>
          entry.value != null && (
            <div key={entry.dataKey} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
                <span className="text-muted-foreground">{entry.name}</span>
              </div>
              <span className="font-bold tabular-nums" style={{ color: entry.color }}>
                {(entry.value as number).toFixed(1)}
              </span>
            </div>
          )
      )}
    </div>
  )
}

export function ScoreHistoryChart({ results, goal, className }: ScoreHistoryChartProps) {
  // Sort oldest → newest for the chart
  const sorted = [...results].sort(
    (a, b) => new Date(a.test_date).getTime() - new Date(b.test_date).getTime()
  )

  const data: ChartDatum[] = sorted.map((r) => ({
    date: r.test_date,
    dateLabel: format(parseISO(r.test_date), 'MMM d'),
    overall_band:   r.overall_band,
    listening_band: r.listening_band,
    reading_band:   r.reading_band,
    writing_band:   r.writing_band,
    speaking_band:  r.speaking_band,
  }))

  if (data.length === 0) {
    return (
      <div className={cn('flex h-64 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20', className)}>
        <p className="text-sm text-muted-foreground">Add test results to see your progress chart.</p>
      </div>
    )
  }

  // Single point — use AreaChart so it still renders nicely
  const ChartComponent = data.length === 1 ? AreaChart : LineChart

  return (
    <div className={cn('', className)}>
      <ResponsiveContainer width="100%" height={300}>
        <ChartComponent data={data} margin={{ top: 10, right: 16, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="overallGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 9]}
            ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12 }}
          />

          {/* Goal reference line */}
          {goal && (
            <ReferenceLine
              y={goal.target_overall}
              stroke="#3b82f6"
              strokeDasharray="5 4"
              strokeWidth={1.5}
              label={{
                value: `Goal ${goal.target_overall.toFixed(1)}`,
                position: 'right',
                fontSize: 11,
                fill: '#3b82f6',
              }}
            />
          )}

          {/* Overall with area fill */}
          {data.length === 1 ? (
            <Area
              type="monotone"
              dataKey="overall_band"
              name="Overall"
              stroke="#3b82f6"
              strokeWidth={2.5}
              fill="url(#overallGrad)"
              dot={{ fill: '#3b82f6', r: 4 }}
            />
          ) : (
            <Line
              type="monotone"
              dataKey="overall_band"
              name="Overall"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={{ fill: '#3b82f6', r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          )}

          {/* Module lines */}
          {MODULE_LINES.filter((m) => m.key !== 'overall_band').map((m) => (
            <Line
              key={m.key}
              type="monotone"
              dataKey={m.key as string}
              name={m.label}
              stroke={m.color}
              strokeWidth={m.width}
              strokeDasharray="4 3"
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls
            />
          ))}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  )
}
