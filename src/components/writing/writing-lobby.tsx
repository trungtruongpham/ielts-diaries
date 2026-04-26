'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import type { WritingTaskType } from '@/hooks/use-writing-session'
import { ChartTypePicker } from './chart-type-picker'
import { ModelSelector } from './model-selector'

interface WritingLobbyProps {
  onStart: (taskType: WritingTaskType, chartTypeHint?: string) => void
  isLoading: boolean
  loadingMode: WritingTaskType | null
  selectedModelId: string
  onModelChange: (modelId: string) => void
  className?: string
}

interface TaskConfig {
  taskType: WritingTaskType
  emoji: string
  title: string
  subtitle: string
  description: string
  duration: string
  wordMin: string
  accentClass: string
  badgeClass: string
  isFull?: boolean
}

const TASKS: TaskConfig[] = [
  {
    taskType: 'task1_academic',
    emoji: '📊',
    title: 'Task 1',
    subtitle: 'Academic',
    description: 'Describe a chart, table, graph, or diagram',
    duration: '~20 min',
    wordMin: '150+ words',
    accentClass: 'hover:border-sky-400/60 hover:ring-sky-400/20',
    badgeClass: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300',
  },
  {
    taskType: 'task1_gt',
    emoji: '✉️',
    title: 'Task 1',
    subtitle: 'General Training',
    description: 'Write a letter (complaint, request, invitation…)',
    duration: '~20 min',
    wordMin: '150+ words',
    accentClass: 'hover:border-violet-400/60 hover:ring-violet-400/20',
    badgeClass: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300',
  },
  {
    taskType: 'task2',
    emoji: '📝',
    title: 'Task 2',
    subtitle: 'Essay',
    description: 'Write an essay on a contemporary societal topic',
    duration: '~40 min',
    wordMin: '250+ words',
    accentClass: 'hover:border-emerald-400/60 hover:ring-emerald-400/20',
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  },
  {
    taskType: 'full',
    emoji: '🎯',
    title: 'Full Test',
    subtitle: 'Task 1 + Task 2',
    description: 'Official 60-minute full writing test (both tasks)',
    duration: '~60 min',
    wordMin: '400+ words',
    accentClass: 'hover:border-primary/60 hover:ring-primary/20',
    badgeClass: 'bg-primary/10 text-primary dark:bg-primary/20',
    isFull: true,
  },
]

function TaskCard({
  config,
  onStart,
  disabled,
  isLoading,
}: {
  config: TaskConfig
  onStart: (taskType: WritingTaskType) => void
  disabled: boolean
  isLoading: boolean
}) {
  return (
    <button
      id={`task-card-${config.taskType}`}
      onClick={() => onStart(config.taskType)}
      disabled={disabled}
      className={cn(
        'group relative flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-5 text-left shadow-sm',
        'transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-md',
        'ring-2 ring-transparent',
        config.accentClass,
        config.isFull && 'sm:col-span-2',
        disabled && 'cursor-not-allowed opacity-50',
        isLoading && 'cursor-not-allowed pointer-events-none',
      )}
    >
      {/* Icon + duration badge */}
      <div className="flex w-full items-start justify-between gap-2">
        <span
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-2xl',
            'transition-transform duration-200 group-hover:scale-110',
          )}
          aria-hidden
        >
          {config.emoji}
        </span>
        <div className="flex flex-col items-end gap-1">
          <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold', config.badgeClass)}>
            {config.duration}
          </span>
          <span className="text-[10px] text-muted-foreground">{config.wordMin}</span>
        </div>
      </div>

      {/* Title + description */}
      <div>
        <p className="text-base font-bold text-foreground leading-tight">
          {config.title}
          <span className="ml-1.5 font-medium text-muted-foreground">— {config.subtitle}</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground leading-snug">{config.description}</p>
      </div>

      {/* CTA */}
      <div className={cn(
        'mt-auto flex items-center gap-1.5 text-xs font-semibold',
        'text-muted-foreground transition-colors duration-200 group-hover:text-primary',
      )}>
        {isLoading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Preparing your prompt…
          </>
        ) : (
          <>
            <span>Start Practice</span>
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
          </>
        )}
      </div>
    </button>
  )
}

export function WritingLobby({ onStart, isLoading, loadingMode, selectedModelId, onModelChange, className }: WritingLobbyProps) {
  const [lobbyState, setLobbyState] = useState<'menu' | 'chart-picker'>('menu')

  function handleTaskCardClick(taskType: WritingTaskType) {
    if (taskType === 'task1_academic' && !isLoading) {
      setLobbyState('chart-picker')
    } else {
      onStart(taskType)
    }
  }

  if (lobbyState === 'chart-picker') {
    return (
      <div className={cn('flex flex-col items-center justify-center px-4 py-10', className)}>
        <ChartTypePicker
          onSelect={(hint) => {
            onStart('task1_academic', hint ?? undefined)
          }}
          onBack={() => setLobbyState('menu')}
          disabled={isLoading}
        />
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center justify-center px-4 py-10', className)}>
      <div className="w-full max-w-lg space-y-6">

        {/* Hero */}
        <div className="text-center">
          <div className="mb-3 text-5xl" aria-hidden>✍️</div>
          <h1 className="mb-1.5 text-3xl font-bold text-foreground">
            IELTS Writing Practice
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Choose what you&apos;d like to practice today. Get AI feedback on all 4 IELTS Writing criteria.
          </p>
        </div>

        {/* Model selector */}
        <ModelSelector
          value={selectedModelId}
          onChange={onModelChange}
          disabled={isLoading}
        />

        {/* Task grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TASKS.map(cfg => (
            <TaskCard
              key={cfg.taskType}
              config={cfg}
              onStart={handleTaskCardClick}
              disabled={isLoading}
              isLoading={isLoading && loadingMode === cfg.taskType}
            />
          ))}
        </div>

        {/* Footer tip */}
        <p className="text-center text-xs text-muted-foreground">
          💡 Tip: Use the full test for the most realistic practice experience.
        </p>
      </div>
    </div>
  )
}
