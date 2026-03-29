'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { WritingEvaluationCard } from './writing-evaluation-card'
import { ModelAnswerCard } from './model-answer-card'
import type { WritingEvaluation } from '@/lib/ai/types'
import type { WritingTaskType } from '@/lib/db/types'

interface WritingResultsProps {
  taskType: WritingTaskType
  task1Evaluation: WritingEvaluation | null
  task2Evaluation: WritingEvaluation | null
  finalBands: { task1: number | null; task2: number | null; overall: number }
  sessionId: string | null
  onPracticeAgain: () => void
}

function bandColor(b: number): string {
  if (b >= 7.5) return 'text-emerald-600 dark:text-emerald-400'
  if (b >= 6.0) return 'text-blue-600 dark:text-blue-400'
  if (b >= 5.0) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

function bandBgBorder(b: number): string {
  if (b >= 7.5) return 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950 dark:border-emerald-700'
  if (b >= 6.0) return 'bg-blue-50 border-blue-300 dark:bg-blue-950 dark:border-blue-700'
  if (b >= 5.0) return 'bg-amber-50 border-amber-300 dark:bg-amber-950 dark:border-amber-700'
  return 'bg-red-50 border-red-300 dark:bg-red-950 dark:border-red-700'
}

function TaskBreakdown({
  evaluation,
  task,
  taskLabel,
}: {
  evaluation: WritingEvaluation
  task: 1 | 2
  taskLabel: string
}) {
  const taskCriterion = task === 1
    ? { name: 'Task Achievement', score: evaluation.task_achievement ?? 0 }
    : { name: 'Task Response', score: evaluation.task_response ?? 0 }

  // Find explanations from band_breakdown
  const getExplanation = (criterion: string) =>
    evaluation.band_breakdown.find(b =>
      b.criterion.toLowerCase().includes(criterion.toLowerCase())
    )?.explanation

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-foreground">{taskLabel}</h3>

      <div className="grid gap-2 sm:grid-cols-2">
        <WritingEvaluationCard
          criterionName={taskCriterion.name}
          score={taskCriterion.score}
          explanation={getExplanation(task === 1 ? 'Task Achievement' : 'Task Response')}
        />
        <WritingEvaluationCard
          criterionName="Coherence & Cohesion"
          score={evaluation.coherence_cohesion}
          explanation={getExplanation('Coherence')}
        />
        <WritingEvaluationCard
          criterionName="Lexical Resource"
          score={evaluation.lexical_resource}
          explanation={getExplanation('Lexical')}
        />
        <WritingEvaluationCard
          criterionName="Grammatical Range & Accuracy"
          score={evaluation.grammatical_range}
          explanation={getExplanation('Grammatical')}
        />
      </div>
    </div>
  )
}

export function WritingResults({
  taskType,
  task1Evaluation,
  task2Evaluation,
  finalBands,
  sessionId,
  onPracticeAgain,
}: WritingResultsProps) {
  const isFullTest = taskType === 'full'
  const overall = finalBands.overall

  // Determine which evaluations to show
  const showTask1 = task1Evaluation && (taskType === 'task1_academic' || taskType === 'task1_gt' || taskType === 'full')
  const showTask2 = task2Evaluation && (taskType === 'task2' || taskType === 'full')

  const task1Label = taskType === 'task1_gt' ? 'Task 1 · General Training' : 'Task 1 · Academic'
  const task2Label = 'Task 2 · Essay'

  // Combine strengths + improvements from both tasks
  const allStrengths = [
    ...(task1Evaluation?.strengths ?? []).map(s => (isFullTest ? `Task 1: ${s}` : s)),
    ...(task2Evaluation?.strengths ?? []).map(s => (isFullTest ? `Task 2: ${s}` : s)),
  ].slice(0, 4)

  const allImprovements = [
    ...(task1Evaluation?.improvements ?? []).map(s => (isFullTest ? `Task 1: ${s}` : s)),
    ...(task2Evaluation?.improvements ?? []).map(s => (isFullTest ? `Task 2: ${s}` : s)),
  ].slice(0, 4)

  const feedback = task2Evaluation?.feedback ?? task1Evaluation?.feedback ?? ''

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10 space-y-6">
      {/* Overall band hero */}
      <div className={cn(
        'rounded-2xl border-2 p-8 text-center shadow-sm',
        bandBgBorder(overall),
      )}>
        <div className="mb-2 text-4xl">🎉</div>
        <h1 className="mb-4 text-2xl font-bold text-foreground">Writing Practice Complete!</h1>

        <div className="flex items-baseline justify-center gap-3">
          <span className={cn('text-6xl font-extrabold tabular-nums', bandColor(overall))}>
            {overall.toFixed(1)}
          </span>
          <span className="text-lg font-semibold text-muted-foreground">Overall Band</span>
        </div>

        {/* Full test: show individual task bands */}
        {isFullTest && (finalBands.task1 !== null || finalBands.task2 !== null) && (
          <div className="mt-3 flex items-center justify-center gap-4 text-sm text-muted-foreground">
            {finalBands.task1 !== null && (
              <span>Task 1: <span className={cn('font-bold', bandColor(finalBands.task1))}>{finalBands.task1.toFixed(1)}</span></span>
            )}
            {finalBands.task2 !== null && (
              <span>Task 2: <span className={cn('font-bold', bandColor(finalBands.task2))}>{finalBands.task2.toFixed(1)}</span></span>
            )}
          </div>
        )}
      </div>

      {/* Task breakdowns */}
      {showTask1 && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <TaskBreakdown evaluation={task1Evaluation} task={1} taskLabel={task1Label} />
        </div>
      )}
      {showTask2 && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <TaskBreakdown evaluation={task2Evaluation} task={2} taskLabel={task2Label} />
        </div>
      )}

      {/* Strengths + improvements */}
      {(allStrengths.length > 0 || allImprovements.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {allStrengths.length > 0 && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950 p-5">
              <h3 className="mb-3 text-sm font-bold text-emerald-700 dark:text-emerald-300">✅ Strengths</h3>
              <ul className="space-y-1.5">
                {allStrengths.map((s, i) => (
                  <li key={i} className="text-sm text-emerald-800 dark:text-emerald-200">• {s}</li>
                ))}
              </ul>
            </div>
          )}
          {allImprovements.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 p-5">
              <h3 className="mb-3 text-sm font-bold text-amber-700 dark:text-amber-300">🔧 Improvements</h3>
              <ul className="space-y-1.5">
                {allImprovements.map((s, i) => (
                  <li key={i} className="text-sm text-amber-800 dark:text-amber-200">• {s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Overall feedback */}
      {feedback && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-2 text-sm font-bold text-foreground">Overall Feedback</h3>
          <p className="text-sm leading-relaxed text-muted-foreground italic">&ldquo;{feedback}&rdquo;</p>
        </div>
      )}

      {/* Model answers */}
      {showTask1 && task1Evaluation.model_answer && (
        <ModelAnswerCard modelAnswer={task1Evaluation.model_answer} taskLabel={task1Label} />
      )}
      {showTask2 && task2Evaluation.model_answer && (
        <ModelAnswerCard modelAnswer={task2Evaluation.model_answer} taskLabel={task2Label} />
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={onPracticeAgain}
          className="flex-1 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-accent active:scale-95"
        >
          🔄 Practice Again
        </button>
        <Link
          href="/dashboard/writing"
          className="flex-1 rounded-xl border border-border bg-card px-5 py-3 text-center text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-accent active:scale-95"
        >
          📋 View History
        </Link>
        <Link
          href="/dashboard"
          className="flex-1 rounded-xl bg-primary px-5 py-3 text-center text-sm font-semibold text-primary-foreground shadow transition-all hover:bg-primary/90 active:scale-95"
        >
          📊 Dashboard
        </Link>
      </div>
    </div>
  )
}
