'use client'

import { Volume2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SpeakingQuestion } from '@/lib/ai/types'

interface QuestionDisplayProps {
  question: SpeakingQuestion
  questionNumber: number
  part: 1 | 2 | 3
  isExaminerSpeaking: boolean
  onPlayAgain?: () => void
  className?: string
}

export function QuestionDisplay({
  question,
  questionNumber,
  part,
  isExaminerSpeaking,
  onPlayAgain,
  className,
}: QuestionDisplayProps) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card p-6 shadow-sm', className)}>
      {/* Label */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {part === 2 ? 'Long Turn — Topic Card' : `Question ${questionNumber}`}
        </span>

        {/* TTS indicator / replay button */}
        <button
          onClick={onPlayAgain}
          disabled={isExaminerSpeaking}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all',
            isExaminerSpeaking
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300'
              : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}
          title={isExaminerSpeaking ? 'Examiner is speaking...' : 'Play question again'}
        >
          {isExaminerSpeaking ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Speaking...
            </>
          ) : (
            <>
              <Volume2 className="h-3.5 w-3.5" />
              Play again
            </>
          )}
        </button>
      </div>

      {/* Question text */}
      <p className="text-lg font-medium leading-relaxed text-foreground sm:text-xl">
        &ldquo;{question.text}&rdquo;
      </p>
    </div>
  )
}
