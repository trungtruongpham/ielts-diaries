'use client'

import { useReducer, useCallback, useRef, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitListeningAttempt } from '@/lib/listening/actions'
import type { DbListeningSection, DbListeningQuestion, ListeningMode } from '@/lib/db/types'

// ── Types ─────────────────────────────────────────────────────────────────────

export type Answers = Record<number, string | string[]>

interface SessionState {
  currentSectionIndex: number
  answers: Answers
  isSubmitting: boolean
  error: string | null
}

type SessionAction =
  | { type: 'SET_ANSWER'; questionNumber: number; value: string | string[] }
  | { type: 'NEXT_SECTION' }
  | { type: 'PREV_SECTION' }
  | { type: 'GO_TO_SECTION'; index: number }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_ERROR'; error: string }

export interface UseListeningSessionReturn {
  currentSectionIndex: number
  currentSection: DbListeningSection
  currentQuestions: DbListeningQuestion[]
  answers: Answers
  isSubmitting: boolean
  error: string | null
  elapsedSeconds: number
  setAnswer: (questionNumber: number, value: string | string[]) => void
  goToSection: (index: number) => void
  nextSection: () => void
  prevSection: () => void
  submitTest: () => Promise<void>
  answeredCount: number
  totalQuestions: number
}

// ── Reducer ───────────────────────────────────────────────────────────────────

function reducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'SET_ANSWER':
      return {
        ...state,
        answers: { ...state.answers, [action.questionNumber]: action.value },
      }
    case 'NEXT_SECTION':
      return { ...state, currentSectionIndex: Math.min(state.currentSectionIndex + 1, 3) }
    case 'PREV_SECTION':
      return { ...state, currentSectionIndex: Math.max(state.currentSectionIndex - 1, 0) }
    case 'GO_TO_SECTION':
      return { ...state, currentSectionIndex: action.index }
    case 'SUBMIT_START':
      return { ...state, isSubmitting: true, error: null }
    case 'SUBMIT_ERROR':
      return { ...state, isSubmitting: false, error: action.error }
    default:
      return state
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useListeningSession({
  testId,
  sections,
  questionsBySection,
  mode,
}: {
  testId: string
  sections: DbListeningSection[]
  questionsBySection: DbListeningQuestion[][]
  mode: ListeningMode
}): UseListeningSessionReturn {
  const router = useRouter()
  const startedAtRef = useRef(Date.now())
  const elapsedRef = useRef(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  const [state, dispatch] = useReducer(reducer, {
    currentSectionIndex: 0,
    answers: {},
    isSubmitting: false,
    error: null,
  })

  // ── Elapsed timer — useState drives re-renders for the displayed countdown ─
  useEffect(() => {
    const interval = setInterval(() => {
      const secs = Math.floor((Date.now() - startedAtRef.current) / 1000)
      elapsedRef.current = secs
      setElapsedSeconds(secs)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // ── Derived ────────────────────────────────────────────────────────────────
  const currentSection = sections[state.currentSectionIndex]
  const currentQuestions = questionsBySection[state.currentSectionIndex] ?? []
  const totalQuestions = questionsBySection.flat().length

  // Count answered — for matching/map_label, check JSON is not empty {}
  const answeredCount = Object.entries(state.answers).filter(([, v]) => {
    if (!v) return false
    if (Array.isArray(v)) return v.length > 0
    if (typeof v === 'string') {
      // JSON objects (matching/map_label) count as answered if non-empty
      if (v.startsWith('{')) {
        try {
          return Object.keys(JSON.parse(v)).length > 0
        } catch {
          return false
        }
      }
      return v.trim() !== ''
    }
    return false
  }).length

  // ── Actions ────────────────────────────────────────────────────────────────
  const setAnswer = useCallback(
    (questionNumber: number, value: string | string[]) =>
      dispatch({ type: 'SET_ANSWER', questionNumber, value }),
    []
  )

  const goToSection = useCallback(
    (index: number) => dispatch({ type: 'GO_TO_SECTION', index }),
    []
  )

  const nextSection = useCallback(() => dispatch({ type: 'NEXT_SECTION' }), [])
  const prevSection = useCallback(() => dispatch({ type: 'PREV_SECTION' }), [])

  const submitTest = useCallback(async () => {
    dispatch({ type: 'SUBMIT_START' })
    try {
      const result = await submitListeningAttempt({
        testId,
        mode,
        answers: state.answers,
        timeTakenSeconds: elapsedRef.current,
      })

      if (result.error) throw new Error(result.error)
      if (!result.attemptId) throw new Error('No attempt ID returned')

      router.push(`/listening/results/${result.attemptId}`)
    } catch (err) {
      dispatch({
        type: 'SUBMIT_ERROR',
        error: err instanceof Error ? err.message : 'Submit failed. Please try again.',
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId, mode, state.answers, router])

  return {
    currentSectionIndex: state.currentSectionIndex,
    currentSection,
    currentQuestions,
    answers: state.answers,
    isSubmitting: state.isSubmitting,
    error: state.error,
    elapsedSeconds,
    setAnswer,
    goToSection,
    nextSection,
    prevSection,
    submitTest,
    answeredCount,
    totalQuestions,
  }
}
