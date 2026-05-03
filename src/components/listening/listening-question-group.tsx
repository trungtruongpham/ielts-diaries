'use client'

import { cn } from '@/lib/utils'
import { MultipleChoiceQuestion } from './question-types/multiple-choice-question'
import { MultipleSelectQuestion } from './question-types/multiple-select-question'
import { FillInBlankQuestion } from './question-types/fill-in-blank-question'
import { MatchingQuestion } from './question-types/matching-question'
import { MapLabelingQuestion } from './question-types/map-labeling-question'
import { TableFillQuestion } from './question-types/table-fill-question'
import type {
  DbListeningQuestion,
  DbListeningQuestionWithKey,
  MultipleChoiceData,
  MultipleChoiceKey,
  MultipleSelectData,
  MultipleSelectKey,
  FillBlankData,
  FillBlankKey,
  MatchingData,
  MatchingKey,
  MapLabelData,
  MapLabelKey,
  TableFillData,
  TableFillKey,
} from '@/lib/db/types'

export type Answers = Record<number, string | string[]>

interface ListeningQuestionGroupProps {
  questions: DbListeningQuestion[] | DbListeningQuestionWithKey[]
  sectionNumber: number
  answers: Answers
  onAnswer: (questionNumber: number, value: string | string[]) => void
  showReview?: boolean
}

// ── Group questions by group_id ───────────────────────────────────────────────

interface QuestionGroup {
  groupId: string | null
  groupContext: DbListeningQuestion['group_context']
  questions: (DbListeningQuestion | DbListeningQuestionWithKey)[]
}

function groupQuestions(
  questions: (DbListeningQuestion | DbListeningQuestionWithKey)[]
): QuestionGroup[] {
  const groups: QuestionGroup[] = []
  const seen = new Map<string, QuestionGroup>()

  for (const q of questions) {
    if (!q.group_id) {
      groups.push({ groupId: null, groupContext: null, questions: [q] })
      continue
    }
    const existing = seen.get(q.group_id)
    if (existing) {
      existing.questions.push(q)
    } else {
      const group: QuestionGroup = {
        groupId: q.group_id,
        groupContext: q.group_context,
        questions: [q],
      }
      groups.push(group)
      seen.set(q.group_id, group)
    }
  }

  return groups
}

// ── Answer helpers ────────────────────────────────────────────────────────────

function asString(v: string | string[] | undefined): string {
  if (!v) return ''
  return Array.isArray(v) ? v[0] ?? '' : v
}

function asStringArray(v: string | string[] | undefined): string[] {
  if (!v) return []
  return Array.isArray(v) ? v : [v]
}

function asRecord<T>(v: string | string[] | undefined): T {
  if (!v || Array.isArray(v)) return {} as T
  try { return JSON.parse(v) as T } catch { return {} as T }
}

// ── Single question renderer ──────────────────────────────────────────────────

function QuestionRenderer({
  question,
  answers,
  onAnswer,
  showReview,
}: {
  question: DbListeningQuestion | DbListeningQuestionWithKey
  answers: Answers
  onAnswer: (n: number, v: string | string[]) => void
  showReview?: boolean
}) {
  const q = question
  const n = q.question_number
  const answerKey = 'answer_key' in q ? q.answer_key : undefined
  const currentAnswer = answers[n]

  switch (q.question_type) {
    case 'multiple_choice':
      return (
        <MultipleChoiceQuestion
          questionNumber={n}
          data={q.question_data as MultipleChoiceData}
          value={asString(currentAnswer)}
          onChange={v => onAnswer(n, v)}
          showReview={showReview}
          answerKey={answerKey as MultipleChoiceKey | undefined}
        />
      )

    case 'multiple_select':
      return (
        <MultipleSelectQuestion
          questionNumber={n}
          data={q.question_data as MultipleSelectData}
          value={asStringArray(currentAnswer)}
          onChange={v => onAnswer(n, v)}
          showReview={showReview}
          answerKey={answerKey as MultipleSelectKey | undefined}
        />
      )

    case 'fill_blank':
      return (
        <FillInBlankQuestion
          questionNumber={n}
          data={q.question_data as FillBlankData}
          value={asString(currentAnswer)}
          onChange={v => onAnswer(n, v)}
          showReview={showReview}
          answerKey={answerKey as FillBlankKey | undefined}
        />
      )

    case 'matching': {
      const matchVal = asRecord<Record<number, string>>(currentAnswer as string | string[] | undefined)
      return (
        <MatchingQuestion
          questionNumber={n}
          data={q.question_data as MatchingData}
          value={matchVal}
          onChange={v => onAnswer(n, JSON.stringify(v))}
          showReview={showReview}
          answerKey={answerKey as MatchingKey | undefined}
        />
      )
    }

    case 'map_label': {
      const mapVal = asRecord<Record<string, string>>(currentAnswer as string | string[] | undefined)
      return (
        <MapLabelingQuestion
          questionNumber={n}
          data={q.question_data as MapLabelData}
          value={mapVal}
          onChange={v => onAnswer(n, JSON.stringify(v))}
          showReview={showReview}
          answerKey={answerKey as MapLabelKey | undefined}
        />
      )
    }

    case 'table_fill':
      return (
        <TableFillQuestion
          questionNumber={n}
          data={q.question_data as TableFillData}
          value={asString(currentAnswer)}
          onChange={v => onAnswer(n, v)}
          showReview={showReview}
          answerKey={answerKey as TableFillKey | undefined}
        />
      )

    default:
      return (
        <p className="text-sm text-muted-foreground">
          Unknown question type: {q.question_type}
        </p>
      )
  }
}

// ── Main Export ───────────────────────────────────────────────────────────────

export function ListeningQuestionGroup({
  questions,
  sectionNumber,
  answers,
  onAnswer,
  showReview,
}: ListeningQuestionGroupProps) {
  const groups = groupQuestions(questions)

  return (
    <div className="space-y-8">
      <h2 className="text-base font-bold text-foreground">
        Part {sectionNumber}
      </h2>

      {groups.map((group, gi) => (
        <div key={group.groupId ?? `singleton-${gi}`} className="space-y-5">
          {/* Group header (instructions + optional image) */}
          {group.groupContext && (
            <div className={cn(
              'rounded-xl border border-border bg-muted/30 p-4',
              gi > 0 && 'mt-8'
            )}>
              <p className="whitespace-pre-line text-sm text-foreground leading-relaxed">
                {group.groupContext.instructions}
              </p>
            </div>
          )}

          {/* Questions in group */}
          <div className="space-y-6">
            {group.questions.map(q => (
              <QuestionRenderer
                key={q.id}
                question={q}
                answers={answers}
                onAnswer={onAnswer}
                showReview={showReview}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
