import { Clock, FileText } from 'lucide-react'
import { WritingEvaluationCard } from './writing-evaluation-card'
import { ModelAnswerCard } from './model-answer-card'
import { WritingChart } from './writing-chart'
import type { DbWritingAnswer } from '@/lib/db/types'
import type { WritingEvaluation } from '@/lib/ai/types'

interface WritingReviewTaskProps {
  answer: DbWritingAnswer
  taskLabel: string
}

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return sec > 0 ? `${m}m ${sec}s` : `${m}m`
}

export function WritingReviewTask({ answer, taskLabel }: WritingReviewTaskProps) {
  // WritingFeedback and WritingEvaluation are identical shapes — direct cast
  const feedback = answer.feedback as unknown as WritingEvaluation | null
  const isTask1 = answer.task === 1

  const taskCriterionName = isTask1 ? 'Task Achievement' : 'Task Response'
  const taskCriterionScore = isTask1
    ? (feedback?.task_achievement ?? null)
    : (feedback?.task_response ?? null)

  const getExplanation = (criterion: string) =>
    feedback?.band_breakdown?.find(b =>
      b.criterion.toLowerCase().includes(criterion.toLowerCase())
    )?.explanation

  return (
    <div className="space-y-4">
      {/* Task header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-base font-semibold text-foreground">{taskLabel}</h2>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {answer.word_count > 0 && (
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {answer.word_count} words
            </span>
          )}
          {answer.time_taken_seconds != null && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatSeconds(answer.time_taken_seconds)}
            </span>
          )}
          {answer.band_score != null && (
            <span className="font-bold text-foreground tabular-nums">
              Band {answer.band_score.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* Chart — Task 1 Academic visual only */}
      {answer.chart_data && (
        <WritingChart chartData={answer.chart_data} className="h-[280px]" />
      )}

      {/* Prompt */}
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Prompt
        </p>
        <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
          {answer.prompt_text}
        </p>
      </div>

      {/* User essay — scrollable for long responses */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Your Answer · {answer.word_count} words
        </p>
        <div className="max-h-[400px] overflow-y-auto rounded-lg">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
            {answer.user_answer}
          </pre>
        </div>
      </div>

      {/* AI Feedback */}
      {feedback ? (
        <div className="space-y-4">
          {/* Criteria breakdown */}
          <div className="grid gap-2 sm:grid-cols-2">
            {taskCriterionScore != null && (
              <WritingEvaluationCard
                criterionName={taskCriterionName}
                score={taskCriterionScore}
                explanation={getExplanation(isTask1 ? 'Task Achievement' : 'Task Response')}
              />
            )}
            <WritingEvaluationCard
              criterionName="Coherence & Cohesion"
              score={feedback.coherence_cohesion}
              explanation={getExplanation('Coherence')}
            />
            <WritingEvaluationCard
              criterionName="Lexical Resource"
              score={feedback.lexical_resource}
              explanation={getExplanation('Lexical')}
            />
            <WritingEvaluationCard
              criterionName="Grammatical Range & Accuracy"
              score={feedback.grammatical_range}
              explanation={getExplanation('Grammatical')}
            />
          </div>

          {/* Strengths + improvements */}
          {(feedback.strengths.length > 0 || feedback.improvements.length > 0) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {feedback.strengths.length > 0 && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950 p-4">
                  <h3 className="mb-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    ✅ Strengths
                  </h3>
                  <ul className="space-y-1">
                    {feedback.strengths.map((s, i) => (
                      <li key={i} className="text-xs text-emerald-800 dark:text-emerald-200">• {s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {feedback.improvements.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 p-4">
                  <h3 className="mb-2 text-xs font-bold text-amber-700 dark:text-amber-300">
                    🔧 Improvements
                  </h3>
                  <ul className="space-y-1">
                    {feedback.improvements.map((s, i) => (
                      <li key={i} className="text-xs text-amber-800 dark:text-amber-200">• {s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Overall feedback quote */}
          {feedback.feedback && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                AI Feedback
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground italic">
                &ldquo;{feedback.feedback}&rdquo;
              </p>
            </div>
          )}

          {/* Model answer (collapsible via ModelAnswerCard) */}
          {feedback.model_answer && (
            <ModelAnswerCard modelAnswer={feedback.model_answer} taskLabel={taskLabel} />
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-muted/20 px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">Feedback not available for this task.</p>
        </div>
      )}
    </div>
  )
}
