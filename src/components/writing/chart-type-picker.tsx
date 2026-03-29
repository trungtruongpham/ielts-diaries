'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ArrowLeft, BarChart3, TrendingUp, PieChart, Table2, Workflow, Map, Shuffle } from 'lucide-react'

export interface ChartTypeOption {
  hint: string | null
  label: string
  description: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  accentColor: string
  borderHover: string
  bgHover: string
  iconBg: string
  iconColor: string
}

export const CHART_TYPE_OPTIONS: ChartTypeOption[] = [
  {
    hint: 'bar chart',
    label: 'Bar Chart',
    description: 'Compare values across categories or time periods',
    icon: BarChart3,
    accentColor: 'text-sky-600 dark:text-sky-400',
    borderHover: 'hover:border-sky-400/70',
    bgHover: 'hover:bg-sky-50/50 dark:hover:bg-sky-950/30',
    iconBg: 'bg-sky-100 dark:bg-sky-900/40',
    iconColor: 'text-sky-600 dark:text-sky-400',
  },
  {
    hint: 'line graph',
    label: 'Line Graph',
    description: 'Show trends and changes over time',
    icon: TrendingUp,
    accentColor: 'text-violet-600 dark:text-violet-400',
    borderHover: 'hover:border-violet-400/70',
    bgHover: 'hover:bg-violet-50/50 dark:hover:bg-violet-950/30',
    iconBg: 'bg-violet-100 dark:bg-violet-900/40',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
  {
    hint: 'pie chart',
    label: 'Pie Chart',
    description: 'Show proportional distribution of a whole',
    icon: PieChart,
    accentColor: 'text-orange-600 dark:text-orange-400',
    borderHover: 'hover:border-orange-400/70',
    bgHover: 'hover:bg-orange-50/50 dark:hover:bg-orange-950/30',
    iconBg: 'bg-orange-100 dark:bg-orange-900/40',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
  {
    hint: 'table',
    label: 'Table',
    description: 'Compare data across multiple categories and groups',
    icon: Table2,
    accentColor: 'text-teal-600 dark:text-teal-400',
    borderHover: 'hover:border-teal-400/70',
    bgHover: 'hover:bg-teal-50/50 dark:hover:bg-teal-950/30',
    iconBg: 'bg-teal-100 dark:bg-teal-900/40',
    iconColor: 'text-teal-600 dark:text-teal-400',
  },
  {
    hint: 'process diagram',
    label: 'Process Diagram',
    description: 'Describe the stages of a manufacturing or natural process',
    icon: Workflow,
    accentColor: 'text-amber-600 dark:text-amber-400',
    borderHover: 'hover:border-amber-400/70',
    bgHover: 'hover:bg-amber-50/50 dark:hover:bg-amber-950/30',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    hint: 'map comparison',
    label: 'Map Comparison',
    description: 'Compare two maps or locations before and after changes',
    icon: Map,
    accentColor: 'text-emerald-600 dark:text-emerald-400',
    borderHover: 'hover:border-emerald-400/70',
    bgHover: 'hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    hint: null,
    label: 'Surprise Me',
    description: 'Let the AI choose any chart type at random',
    icon: Shuffle,
    accentColor: 'text-primary',
    borderHover: 'hover:border-primary/70',
    bgHover: 'hover:bg-primary/5',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
]

interface ChartTypePickerProps {
  onSelect: (hint: string | null) => void
  onBack: () => void
  disabled?: boolean
}

export function ChartTypePicker({ onSelect, onBack, disabled }: ChartTypePickerProps) {
  const [hovered, setHovered] = useState<string | null | undefined>(undefined)

  return (
    <div className="w-full max-w-xl space-y-6">

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            disabled={disabled}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-150 disabled:opacity-40"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
          <span className="text-muted-foreground/40">·</span>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Task 1 · Academic
          </span>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Choose your chart type
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Select the visual format you want to practice describing today.
          </p>
        </div>
      </div>

      {/* Grid — 2 cols mobile, 3 cols sm+ */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {CHART_TYPE_OPTIONS.map((opt) => {
          const Icon = opt.icon
          const isHovered = hovered === opt.hint
          const isSurprise = opt.hint === null

          return (
            <button
              key={opt.label}
              onClick={() => onSelect(opt.hint)}
              onMouseEnter={() => setHovered(opt.hint)}
              onMouseLeave={() => setHovered(undefined)}
              disabled={disabled}
              className={cn(
                'group relative flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left',
                'transition-all duration-200',
                'hover:-translate-y-0.5 hover:shadow-md',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                opt.borderHover,
                opt.bgHover,
                isSurprise && 'col-span-2 sm:col-span-1',
                disabled && 'cursor-not-allowed opacity-50 hover:translate-y-0 hover:shadow-none',
              )}
            >
              {/* Icon badge */}
              <div className={cn(
                'flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-200',
                opt.iconBg,
                !disabled && isHovered && 'scale-110',
              )}>
                <Icon className={cn('h-[18px] w-[18px]', opt.iconColor)} />
              </div>

              {/* Label + description */}
              <div className="min-w-0">
                <p className={cn(
                  'text-sm font-semibold leading-tight transition-colors duration-150',
                  !disabled && isHovered ? opt.accentColor : 'text-foreground',
                )}>
                  {opt.label}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                  {opt.description}
                </p>
              </div>

              {/* Arrow indicator on hover */}
              {!disabled && (
                <span className={cn(
                  'absolute right-3.5 top-1/2 -translate-y-1/2 text-xs transition-all duration-200',
                  isHovered ? `opacity-100 translate-x-0 ${opt.accentColor}` : 'opacity-0 -translate-x-1 text-muted-foreground',
                )}>
                  →
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Hint */}
      <p className="text-center text-[11px] text-muted-foreground/70">
        Not sure? Pick <span className="font-medium text-muted-foreground">Surprise Me</span> to get a random chart type.
      </p>
    </div>
  )
}
