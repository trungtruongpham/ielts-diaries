'use client'

import { useCallback } from 'react'
import { Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PartIndicator } from './part-indicator'
import { QuestionDisplay } from './question-display'
import { TopicCard } from './topic-card'
import { RecordingControls } from './recording-controls'
import { EvaluationCard } from './evaluation-card'
import type { UseSpeakingSessionReturn } from '@/hooks/use-speaking-session'

interface SpeakingPracticeProps {
  session: UseSpeakingSessionReturn
  onExit: () => void
  className?: string
}

const MAX_DURATIONS: Record<1 | 2 | 3, number> = { 1: 60, 2: 120, 3: 90 }

const PART_TOTAL_QUESTIONS: Record<1 | 2 | 3, number> = { 1: 5, 2: 1, 3: 5 }

export function SpeakingPractice({ session, onExit, className }: SpeakingPracticeProps) {
  const {
    currentPart,
    currentQuestion,
    questions,
    status,
    isRecording,
    isExaminerSpeaking,
    duration,
    transcript,
    interimText,
    currentFeedback,
    startRecording,
    stopRecording,
    nextQuestion,
    playQuestion,
    totalAnswered,
  } = session

  const currentQ = questions[currentQuestion]
  const isPart2 = currentPart === 2

  const isLastQuestion =
    currentQuestion >= PART_TOTAL_QUESTIONS[currentPart] - 1 && currentPart === 3

  const nextLabel = isLastQuestion
    ? 'Complete Test'
    : currentQuestion >= PART_TOTAL_QUESTIONS[currentPart] - 1
    ? `Start Part ${currentPart + 1} →`
    : 'Next Question'

  const handlePlayAgain = useCallback(() => {
    if (currentQ) playQuestion(currentQ.text)
  }, [currentQ, playQuestion])

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Top bar — part indicator + exit */}
      <div className="flex items-start gap-4">
        <PartIndicator
          currentPart={currentPart}
          currentQuestion={currentQuestion}
          questionsInPart={PART_TOTAL_QUESTIONS[currentPart]}
          className="flex-1"
        />
        <button
          onClick={onExit}
          className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-all hover:bg-destructive hover:text-destructive-foreground"
          title="Exit practice"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── LOADING ─────────────────────────────────────────────── */}
      {status === 'loading' && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Preparing your next question...
          </p>
        </div>
      )}

      {/* ── QUESTION / RECORDING / EVALUATING / FEEDBACK ─────────── */}
      {status !== 'loading' && currentQ && (
        <div className="flex flex-col gap-4">
          {/* Question display */}
          {isPart2 && currentQ.topicCard ? (
            // Part 2 — show topic card (has its own countdown + start button)
            status === 'question' ? (
              <TopicCard
                topicCard={currentQ.topicCard}
                onStartSpeaking={startRecording}
                isExaminerSpeaking={isExaminerSpeaking}
              />
            ) : null
          ) : (
            // Part 1 & 3 — show question text
            <QuestionDisplay
              question={currentQ}
              questionNumber={currentQuestion + 1}
              part={currentPart}
              isExaminerSpeaking={isExaminerSpeaking}
              onPlayAgain={handlePlayAgain}
            />
          )}

          {/* Live transcript area */}
          {(status === 'recording' || status === 'evaluating') && (
            <div className="min-h-[80px] rounded-xl border border-border bg-muted/30 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Live Transcript
              </p>
              <p className="text-sm leading-relaxed text-foreground">
                {transcript}
                {interimText && (
                  <span className="text-muted-foreground"> {interimText}</span>
                )}
                {!transcript && !interimText && (
                  <span className="italic text-muted-foreground">
                    Start speaking — your words will appear here...
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Recording controls (not shown for Part 2 question state — TopicCard handles start) */}
          {status !== 'feedback' && !(isPart2 && status === 'question') && (
            <RecordingControls
              isRecording={isRecording}
              isEvaluating={status === 'evaluating'}
              isExaminerSpeaking={isExaminerSpeaking}
              duration={duration}
              maxDuration={MAX_DURATIONS[currentPart]}
              onStart={startRecording}
              onStop={stopRecording}
            />
          )}

          {/* Evaluation feedback */}
          {status === 'feedback' && currentFeedback && (
            <EvaluationCard
              evaluation={currentFeedback}
              questionNumber={currentQuestion + 1}
              onNext={nextQuestion}
              nextLabel={nextLabel}
            />
          )}

          {/* Evaluating spinner overlay */}
          {status === 'evaluating' && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card/80 py-6 backdrop-blur">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">
                AI examiner is reviewing your answer...
              </span>
            </div>
          )}
        </div>
      )}

      {/* Footer stats */}
      <div className="mt-2 flex justify-center">
        <span className="text-xs text-muted-foreground">
          {totalAnswered} answer{totalAnswered !== 1 ? 's' : ''} completed
        </span>
      </div>
    </div>
  )
}
