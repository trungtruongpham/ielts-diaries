'use client'

import { useState, useCallback, useRef } from 'react'
import type { WritingTaskType, ChartData } from '@/lib/db/types'
import type { WritingEvaluation } from '@/lib/ai/types'

// Re-export so consumers only need one import
export type { WritingTaskType }

export type WritingSessionStatus =
  | 'idle'        // lobby shown
  | 'loading'     // fetching AI prompt
  | 'briefing'    // prompt shown, reading countdown
  | 'writing'     // user is writing
  | 'evaluating'  // submitted, waiting for LLM
  | 'completed'   // results ready
  | 'error'

export interface UseWritingSessionReturn {
  // State
  status: WritingSessionStatus
  sessionId: string | null
  taskType: WritingTaskType | null
  testType: 'academic' | 'general'
  currentTask: 1 | 2
  currentAnswerId: string | null
  currentPrompt: { text: string; type: string } | null
  currentChartData: ChartData | null
  task1Evaluation: WritingEvaluation | null
  task2Evaluation: WritingEvaluation | null
  finalBands: { task1: number | null; task2: number | null; overall: number } | null
  error: string | null

  // Actions
  startSession: (taskType: WritingTaskType, testType?: 'academic' | 'general', chartTypeHint?: string) => Promise<void>
  confirmBrief: () => void
  submitAnswer: (answer: string, wordCount: number, timeTakenSeconds: number) => Promise<void>
  clearError: () => void
  reset: () => void
}

// ── API response types ─────────────────────────────────────────────────────────

interface StartResponse { session_id: string }
interface PromptResponse { answer_id: string; prompt_text: string; prompt_type: string; chart_data: ChartData | null }
interface EvaluateResponse { evaluation: WritingEvaluation }
interface CompleteResponse { task1_band: number | null; task2_band: number | null; overall_band: number }

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useWritingSession(): UseWritingSessionReturn {
  const [status, setStatus] = useState<WritingSessionStatus>('idle')
  const [sessionId, setSessionId] = useState<string | null>(null)
  // Stores the chart type hint so fetchPrompt can forward it for task 1
  const chartTypeHintRef = useRef<string | undefined>(undefined)
  const [taskType, setTaskType] = useState<WritingTaskType | null>(null)
  const [testType, setTestType] = useState<'academic' | 'general'>('academic')
  const [currentTask, setCurrentTask] = useState<1 | 2>(1)
  const [currentAnswerId, setCurrentAnswerId] = useState<string | null>(null)
  const [currentPrompt, setCurrentPrompt] = useState<{ text: string; type: string } | null>(null)
  const [currentChartData, setCurrentChartData] = useState<ChartData | null>(null)
  const [task1Evaluation, setTask1Evaluation] = useState<WritingEvaluation | null>(null)
  const [task2Evaluation, setTask2Evaluation] = useState<WritingEvaluation | null>(null)
  const [finalBands, setFinalBands] = useState<{ task1: number | null; task2: number | null; overall: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => setError(null), [])

  const reset = useCallback(() => {
    chartTypeHintRef.current = undefined
    setStatus('idle')
    setSessionId(null)
    setTaskType(null)
    setTestType('academic')
    setCurrentTask(1)
    setCurrentAnswerId(null)
    setCurrentPrompt(null)
    setCurrentChartData(null)
    setTask1Evaluation(null)
    setTask2Evaluation(null)
    setFinalBands(null)
    setError(null)
  }, [])

  // ── Internal: fetch a prompt for a given task ──────────────────────────────

  const fetchPrompt = useCallback(async (sid: string, task: 1 | 2): Promise<void> => {
    const hint = task === 1 ? chartTypeHintRef.current : undefined
    const res = await fetch('/api/writing/generate-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sid,
        task,
        ...(hint ? { prompt_type_hint: hint } : {}),
      }),
    })
    if (!res.ok) {
      const { error: msg } = await res.json() as { error: string }
      throw new Error(msg ?? 'Failed to generate prompt')
    }
    const data = await res.json() as PromptResponse
    setCurrentAnswerId(data.answer_id)
    setCurrentPrompt({ text: data.prompt_text, type: data.prompt_type })
    setCurrentChartData(data.chart_data ?? null)
  }, [])

  // ── Internal: complete session ─────────────────────────────────────────────

  const completeSession = useCallback(async (sid: string): Promise<void> => {
    try {
      const res = await fetch('/api/writing/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sid }),
      })
      const data = await res.json() as CompleteResponse
      setFinalBands({
        task1: data.task1_band,
        task2: data.task2_band,
        overall: data.overall_band,
      })
    } catch {
      // Non-fatal — show results with whatever we have
    }
    setStatus('completed')
  }, [])

  // ── startSession ───────────────────────────────────────────────────────────

  const startSession = useCallback(async (
    type: WritingTaskType,
    tt: 'academic' | 'general' = 'academic',
    chartTypeHint?: string,
  ): Promise<void> => {
    chartTypeHintRef.current = chartTypeHint
    setTaskType(type)
    setTestType(tt)
    setStatus('loading')
    setError(null)
    // task2-only starts on task slot 2; everything else starts on 1
    setCurrentTask(type === 'task2' ? 2 : 1)
    setTask1Evaluation(null)
    setTask2Evaluation(null)
    setFinalBands(null)

    try {
      // 1. Create session
      const startRes = await fetch('/api/writing/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_type: type, test_type: tt }),
      })
      if (!startRes.ok) {
        const { error: msg } = await startRes.json() as { error: string }
        throw new Error(msg ?? 'Failed to start session')
      }
      const { session_id } = await startRes.json() as StartResponse
      setSessionId(session_id)

      // 2. Generate prompt for the first task
      // task2-only → send task:2 so API picks the essay generator
      // full test / task1_* → send task:1 for the Task 1 prompt
      const firstTask: 1 | 2 = type === 'task2' ? 2 : 1
      await fetchPrompt(session_id, firstTask)

      setStatus('briefing')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start'
      setError(msg)
      setStatus('idle')
    }
  }, [fetchPrompt])

  // ── confirmBrief ───────────────────────────────────────────────────────────

  const confirmBrief = useCallback(() => {
    setStatus('writing')
  }, [])

  // ── submitAnswer ───────────────────────────────────────────────────────────

  const submitAnswer = useCallback(async (
    answer: string,
    wordCount: number,
    timeTakenSeconds: number
  ): Promise<void> => {
    if (!sessionId || !currentAnswerId) return

    setStatus('evaluating')

    try {
      // Evaluate current answer
      const evalRes = await fetch('/api/writing/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer_id: currentAnswerId,
          user_answer: answer,
          word_count: wordCount,
          time_taken_seconds: timeTakenSeconds,
        }),
      })
      if (!evalRes.ok) {
        const { error: msg } = await evalRes.json() as { error: string }
        throw new Error(msg ?? 'Evaluation failed')
      }
      const { evaluation } = await evalRes.json() as EvaluateResponse

      // Store evaluation for the current task
      if (currentTask === 1) {
        setTask1Evaluation(evaluation)
      } else {
        setTask2Evaluation(evaluation)
      }

      // Determine if we need task 2 (full test mode, currently on task 1)
      if (taskType === 'full' && currentTask === 1) {
        // Fetch task 2 prompt
        setCurrentTask(2)
        setStatus('loading')
        await fetchPrompt(sessionId, 2)
        setStatus('briefing')
      } else {
        // Session done — complete it
        await completeSession(sessionId)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Submission failed'
      setError(msg)
      setStatus('writing')
    }
  }, [sessionId, currentAnswerId, currentTask, taskType, fetchPrompt, completeSession])

  return {
    status,
    sessionId,
    taskType,
    testType,
    currentTask,
    currentAnswerId,
    currentPrompt,
    currentChartData,
    task1Evaluation,
    task2Evaluation,
    finalBands,
    error,
    startSession,
    confirmBrief,
    submitAnswer,
    clearError,
    reset,
  }
}
