'use client'

import {
  ResponsiveContainer,
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { cn } from '@/lib/utils'
import type {
  ChartData,
  BarChartData, LineChartData, PieChartData,
  TableChartData, ProcessChartData,
} from '@/lib/db/types'

// ── Palette ───────────────────────────────────────────────────────────────────

const SERIES_COLORS = [
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#10b981', // emerald
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
]

const TOOLTIP_STYLE = {
  fontSize: 11,
  borderRadius: 8,
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--card))',
  color: 'hsl(var(--foreground))',
}

const LEGEND_STYLE = { fontSize: 11, paddingTop: 4 }
const TICK_STYLE = { fontSize: 11, fill: 'hsl(var(--muted-foreground))' }

// ── Bar Chart ─────────────────────────────────────────────────────────────────

function IeltsBarChart({ data }: { data: BarChartData }) {
  const chartData = data.xLabels.map((label, i) => {
    const entry: Record<string, string | number> = { label }
    data.series.forEach(s => { entry[s.name] = s.values[i] ?? 0 })
    return entry
  })

  const maxVal = Math.max(...data.series.flatMap(s => s.values))
  const yWidth = maxVal >= 1_000_000 ? 72 : maxVal >= 100_000 ? 60 : maxVal >= 1_000 ? 48 : 36
  const hasLongLabels = data.xLabels.some(l => l.length > 6)

  return (
    <div className="flex flex-col h-full gap-1">
      <p className="shrink-0 text-xs font-semibold text-center text-muted-foreground">{data.title}</p>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: hasLongLabels ? 48 : 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="label"
              tick={TICK_STYLE}
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={hasLongLabels ? -35 : 0}
              textAnchor={hasLongLabels ? 'end' : 'middle'}
              height={hasLongLabels ? 60 : 28}
            />
            <YAxis
              tick={TICK_STYLE}
              axisLine={false}
              tickLine={false}
              width={yWidth}
              tickFormatter={v => data.unit.startsWith('%') ? `${v}%` : String(v)}
            />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(v: any) => [`${v ?? 0} ${data.unit}`]}
              contentStyle={TOOLTIP_STYLE}
            />
            {data.series.length > 1 && (
              <Legend iconType="circle" iconSize={8} wrapperStyle={LEGEND_STYLE} />
            )}
            {data.series.map((s, i) => (
              <Bar
                key={s.name}
                dataKey={s.name}
                fill={s.color ?? SERIES_COLORS[i % SERIES_COLORS.length]}
                radius={[3, 3, 0, 0]}
                maxBarSize={36}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      {data.source && (
        <p className="shrink-0 text-[10px] text-center text-muted-foreground italic">{data.source}</p>
      )}
    </div>
  )
}

// ── Line Graph ────────────────────────────────────────────────────────────────

function IeltsLineChart({ data }: { data: LineChartData }) {
  const chartData = data.xLabels.map((label, i) => {
    const entry: Record<string, string | number | null> = { label }
    data.series.forEach(s => { entry[s.name] = s.values[i] ?? null })
    return entry
  })

  const allVals = data.series.flatMap(s => s.values.filter((v): v is number => v !== null))
  const maxVal = allVals.length ? Math.max(...allVals) : 0
  const yWidth = maxVal >= 1_000_000 ? 72 : maxVal >= 100_000 ? 60 : maxVal >= 1_000 ? 48 : 36
  const hasLongLabels = data.xLabels.some(l => l.length > 6)

  return (
    <div className="flex flex-col h-full gap-1">
      <p className="shrink-0 text-xs font-semibold text-center text-muted-foreground">{data.title}</p>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 24, left: 0, bottom: hasLongLabels ? 48 : 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="label"
              tick={TICK_STYLE}
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={hasLongLabels ? -35 : 0}
              textAnchor={hasLongLabels ? 'end' : 'middle'}
              height={hasLongLabels ? 60 : 28}
            />
            <YAxis
              tick={TICK_STYLE}
              axisLine={false}
              tickLine={false}
              width={yWidth}
              tickFormatter={v => data.unit.startsWith('%') ? `${v}%` : String(v)}
            />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(v: any) => [`${v ?? 0} ${data.unit}`]}
              contentStyle={TOOLTIP_STYLE}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={LEGEND_STYLE} />
            {data.series.map((s, i) => (
              <Line
                key={s.name}
                type="monotone"
                dataKey={s.name}
                stroke={s.color ?? SERIES_COLORS[i % SERIES_COLORS.length]}
                strokeWidth={2.5}
                dot={{ r: 3, strokeWidth: 0, fill: s.color ?? SERIES_COLORS[i % SERIES_COLORS.length] }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {data.source && (
        <p className="shrink-0 text-[10px] text-center text-muted-foreground italic">{data.source}</p>
      )}
    </div>
  )
}

// ── Pie Chart ─────────────────────────────────────────────────────────────────
// Use Legend (not custom SVG labels) — SVG labels at radius*1.5 overflow the
// viewBox and get hard-clipped by the fixed-height container.

function IeltsPieChart({ data }: { data: PieChartData }) {
  const chartData = data.segments.map(s => ({ name: s.label, value: s.value }))

  return (
    <div className="flex flex-col h-full gap-1">
      <p className="shrink-0 text-xs font-semibold text-center text-muted-foreground">{data.title}</p>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <Pie
              data={chartData}
              cx="50%"
              cy="42%"
              outerRadius="38%"
              innerRadius="15%"
              paddingAngle={2}
              dataKey="value"
              label={({ percent }: { percent?: number }) =>
                (percent ?? 0) >= 0.07 ? `${((percent ?? 0) * 100).toFixed(0)}%` : ''
              }
              labelLine={false}
            >
              {chartData.map((entry, i) => (
                <Cell
                  key={entry.name}
                  fill={data.segments[i].color ?? SERIES_COLORS[i % SERIES_COLORS.length]}
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number | undefined, name: string | undefined) => [`${v ?? 0}%`, name ?? '']}
              contentStyle={TOOLTIP_STYLE}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ ...LEGEND_STYLE, paddingTop: 12 }}
              formatter={value => (
                <span style={{ fontSize: 11, color: 'hsl(var(--foreground))' }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {data.source && (
        <p className="shrink-0 text-[10px] text-center text-muted-foreground italic">{data.source}</p>
      )}
    </div>
  )
}

// ── Table ─────────────────────────────────────────────────────────────────────

function IeltsTable({ data }: { data: TableChartData }) {
  return (
    <div className="flex flex-col h-full gap-2">
      <p className="shrink-0 text-xs font-semibold text-center text-muted-foreground">{data.title}</p>
      {/* overflow-auto allows the table to scroll only if truly needed (many rows),
          but column headers wrap instead of clipping horizontally */}
      <div className="flex-1 min-h-0 overflow-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10">
            <tr className="bg-muted/60">
              {data.headers.map((h, i) => (
                <th
                  key={i}
                  className="px-3 py-2.5 text-left font-semibold text-foreground"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, ri) => (
              <tr
                key={ri}
                className={cn(
                  'border-t border-border transition-colors',
                  ri % 2 === 0 ? 'bg-card' : 'bg-muted/20',
                )}
              >
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className={cn(
                      'px-3 py-2',
                      ci === 0
                        ? 'font-medium text-foreground'
                        : 'text-muted-foreground',
                    )}
                  >
                    {String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.source && (
        <p className="shrink-0 text-[10px] text-center text-muted-foreground italic">{data.source}</p>
      )}
    </div>
  )
}

// ── Process Diagram ───────────────────────────────────────────────────────────

function IeltsProcess({ data }: { data: ProcessChartData }) {
  return (
    <div className="flex flex-col h-full gap-1">
      <p className="shrink-0 text-xs font-semibold text-center text-muted-foreground mb-2">{data.title}</p>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="flex flex-col">
          {data.steps.map((step, i) => (
            <div key={i} className="relative flex items-start gap-3 pb-4 last:pb-0">
              {i < data.steps.length - 1 && (
                <div className="absolute left-[13px] top-7 bottom-0 w-px bg-border" />
              )}
              <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow">
                {i + 1}
              </div>
              <div className="pt-0.5 min-w-0">
                <p className="text-xs font-semibold text-foreground leading-tight">{step.label}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

interface WritingChartProps {
  chartData: ChartData
  className?: string
}

export function WritingChart({ chartData, className }: WritingChartProps) {
  return (
    <div className={cn('flex flex-col rounded-xl border border-border bg-card p-4 shadow-sm overflow-hidden', className)}>
      {/* Header badge */}
      <div className="mb-3 shrink-0 flex items-center gap-1.5">
        <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
          IELTS
        </span>
        <span className="text-[10px] text-muted-foreground">Academic · Task 1 Visual</span>
      </div>

      {/* Chart fills remaining height */}
      <div className="flex-1 min-h-0">
        {chartData.type === 'bar'     && <IeltsBarChart     data={chartData} />}
        {chartData.type === 'line'    && <IeltsLineChart    data={chartData} />}
        {chartData.type === 'pie'     && <IeltsPieChart     data={chartData} />}
        {chartData.type === 'table'   && <IeltsTable        data={chartData} />}
        {chartData.type === 'process' && <IeltsProcess      data={chartData} />}
      </div>
    </div>
  )
}
