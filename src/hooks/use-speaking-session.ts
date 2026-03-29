'use client'

import { useState, useCallback, useRef } from 'react'
import { useAudioRecorder } from './use-audio-recorder'
import { useSpeechRecognition } from './use-speech-recognition'
import { uploadAudioBlob, playTTS } from '@/lib/audio-utils'
import type { SpeakingQuestion, SpeakingEvaluation } from '@/lib/ai/types'
import type { PracticeMode } from '@/lib/db/types'

// Re-export PracticeMode so consumers only need one import
export type { PracticeMode }

export type SessionStatus =
  | 'idle'
  | 'loading'
  | 'question'
  | 'recording'
  | 'evaluating'
  | 'feedback'
  | 'between-parts'
  | 'completed'

export interface SessionScores {
  fluency_band: number
  lexical_band: number
  grammar_band: number
  pronunciation_band: number
  overall_band: number
}

// ── API response shapes ────────────────────────────────────────────────────────

interface StartResponse {
  sessionId: string
  topic: string | undefined
  part: 1 | 2 | 3           // dynamic — set by the server based on practiceMode
  questions: SpeakingQuestion[]
  practiceMode: PracticeMode // echoed back by the server
}

interface QuestionResponse {
  part: 2 | 3
  questions: SpeakingQuestion[]
}

interface EvaluateResponse {
  answerId: string | null
  evaluation: SpeakingEvaluation
}

interface CompleteResponse {
  session: {
    fluency_band: number
    lexical_band: number
    grammar_band: number
    pronunciation_band: number
    overall_band: number
  }
}

// ── Public interface ───────────────────────────────────────────────────────────

export interface UseSpeakingSessionReturn {
  // Session state
  sessionId: string | null
  topic: string
  currentPart: 1 | 2 | 3
  currentQuestion: number
  questions: SpeakingQuestion[]
  status: SessionStatus
  totalAnswered: number
  practiceMode: PracticeMode

  // Actions
  startSession: (mode?: PracticeMode) => Promise<void>
  startRecording: () => void
  stopRecording: () => Promise<void>
  nextQuestion: () => void
  completeSession: () => Promise<void>

  // Audio state
  isRecording: boolean
  duration: number
  transcript: string
  interimText: string
  isSpeechSupported: boolean

  // TTS
  isExaminerSpeaking: boolean
  playQuestion: (text: string) => Promise<void>

  // Evaluation
  currentFeedback: SpeakingEvaluation | null
  finalScores: SessionScores | null

  // Errors
  error: string | null
  clearError: () => void
}

// ── Constants ──────────────────────────────────────────────────────────────────

const PART_QUESTION_COUNTS = { 1: 5, 2: 1, 3: 5 } as const

/**
 * Returns true when the full-test flow should automatically fetch the next part.
 * Single-part modes always return false — the session ends after the current part.
 */
function shouldAdvanceToNextPart(mode: PracticeMode, currentPart: 1 | 2 | 3): boolean {
  return mode === 'full' && currentPart < 3
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useSpeakingSession(): UseSpeakingSessionReturn {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [topic, setTopic] = useState('')
  const [currentPart, setCurrentPart] = useState<1 | 2 | 3>(1)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [questions, setQuestions] = useState<SpeakingQuestion[]>([])
  const [status, setStatus] = useState<SessionStatus>('idle')
  const [currentFeedback, setCurrentFeedback] = useState<SpeakingEvaluation | null>(null)
  const [finalScores, setFinalScores] = useState<SessionScores | null>(null)
  const [isExaminerSpeaking, setIsExaminerSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalAnswered, setTotalAnswered] = useState(0)
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('full')

  // Track part2 topic for Part 3 context (full-test flow only)
  const part2TopicRef = useRef<string>('')
  const userIdRef = useRef<string>('')

  const recorder = useAudioRecorder()
  const stt = useSpeechRecognition('en-US')

  const clearError = useCallback(() => setError(null), [])

  // ── TTS ───────────────────────────────────────────────────────────────────

  const playQuestion = useCallback(async (text: string) => {
    setIsExaminerSpeaking(true)

    // Stop speech recognition while TTS plays — otherwise the browser's STT
    // picks up the examiner's voice and adds it to the user's transcript.
    const wasListening = stt.isListening
    if (wasListening) stt.stopListening()

    try {
      await playTTS(text)
    } catch (err) {
      // TTS failure is non-fatal — user can still read the question
      console.warn('[useSpeakingSession] TTS failed:', err)
    } finally {
      setIsExaminerSpeaking(false)
      // Restore STT if it was active before TTS started (defensive — normally
      // STT is only active while the user is recording, not during TTS)
      if (wasListening) stt.startListening()
    }
  }, [stt])


  // ── Session start ──────────────────────────────────────────────────────────

  const startSession = useCallback(async (mode: PracticeMode = 'full') => {
    setPracticeMode(mode)
    setStatus('loading')
    setError(null)
    setCurrentQuestion(0)
    setTotalAnswered(0)
    setFinalScores(null)
    setCurrentFeedback(null)
    part2TopicRef.current = ''

    // Optimistically set the starting part so the UI renders correctly
    // while the network request is in-flight
    const expectedStartPart: 1 | 2 | 3 =
      mode === 'part2' ? 2 :
      mode === 'part3' ? 3 :
      1
    setCurrentPart(expectedStartPart)

    try {
      const res = await fetch('/api/speaking/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ practiceMode: mode }),
      })
      if (!res.ok) {
        const { error: msg } = await res.json() as { error: string }
        throw new Error(msg ?? 'Failed to start session')
      }

      const data = await res.json() as StartResponse
      setSessionId(data.sessionId)
      setTopic(data.topic ?? '')
      setCurrentPart(data.part)            // authoritative part from server
      setQuestions(data.questions)
      setStatus('question')

      // Auto-play the first question
      if (data.questions[0]) {
        playQuestion(data.questions[0].text)
      }

      // Get user ID from Supabase client for audio upload paths
      const { createClient } = await import('@/lib/supabase/client')
      const { data: { user } } = await createClient().auth.getUser()
      userIdRef.current = user?.id ?? ''
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start session'
      setError(msg)
      setStatus('idle')
    }
  }, [playQuestion])

  // ── Recording ─────────────────────────────────────────────────────────────

  const startRecording = useCallback(() => {
    stt.resetTranscript()
    recorder.startRecording()
    stt.startListening()
    setStatus('recording')
    setCurrentFeedback(null)
  }, [recorder, stt])

  const stopRecording = useCallback(async () => {
    recorder.stopRecording()
    stt.stopListening()
    setStatus('evaluating')

    const question = questions[currentQuestion]
    if (!question || !sessionId) {
      setStatus('question')
      return
    }

    // Upload audio blob (non-fatal if it fails)
    let audioUrl: string | undefined
    if (recorder.audioBlob) {
      try {
        const url = await uploadAudioBlob({
          userId: userIdRef.current,
          sessionId,
          part: currentPart,
          questionIndex: currentQuestion,
          blob: recorder.audioBlob,
        })
        audioUrl = url ?? undefined
      } catch {
        // Upload failure — continue without audio URL
      }
    }

    // Evaluate
    try {
      const res = await fetch('/api/speaking/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          part: currentPart,
          questionIndex: currentQuestion,
          questionText: question.text,
          transcript: stt.transcript,
          durationSeconds: recorder.duration,
          audioUrl,
        }),
      })

      if (!res.ok) {
        const { error: msg } = await res.json() as { error: string }
        throw new Error(msg ?? 'Evaluation failed')
      }

      const { evaluation } = await res.json() as EvaluateResponse
      setCurrentFeedback(evaluation)
      setTotalAnswered(prev => prev + 1)
      setStatus('feedback')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Evaluation failed'
      setError(msg)
      setStatus('question')
    }
  }, [recorder, stt, questions, currentQuestion, sessionId, currentPart])

  // ── Next question / part ────────────────────────────────────────────────────

  const nextQuestion = useCallback(async () => {
    const nextIdx = currentQuestion + 1
    const partTotal = PART_QUESTION_COUNTS[currentPart]

    if (nextIdx < partTotal && nextIdx < questions.length) {
      // ── Stay in current part ──────────────────────────────────────────────
      setCurrentQuestion(nextIdx)
      setCurrentFeedback(null)
      setStatus('question')
      recorder.resetRecording()
      stt.resetTranscript()
      const next = questions[nextIdx]
      if (next) playQuestion(next.text)

    } else if (shouldAdvanceToNextPart(practiceMode, currentPart)) {
      // ── Advance to next part (full-test mode only) ────────────────────────
      const nextPart = (currentPart + 1) as 2 | 3
      setStatus('loading')
      setCurrentFeedback(null)
      recorder.resetRecording()
      stt.resetTranscript()

      try {
        const body: Record<string, unknown> = { sessionId, part: nextPart }
        if (nextPart === 3) body.part2Topic = part2TopicRef.current

        const res = await fetch('/api/speaking/question', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        if (!res.ok) {
          const { error: msg } = await res.json() as { error: string }
          throw new Error(msg ?? 'Failed to get next questions')
        }

        const { questions: nextQuestions } = await res.json() as QuestionResponse

        // Capture Part 2 topic for Part 3 context
        if (nextPart === 2 && nextQuestions[0]?.topicCard) {
          part2TopicRef.current = nextQuestions[0].topicCard.topic
        }

        setCurrentPart(nextPart)
        setCurrentQuestion(0)
        setQuestions(nextQuestions)
        setStatus('question')

        if (nextQuestions[0]) playQuestion(nextQuestions[0].text)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load next part'
        setError(msg)
        setStatus('feedback')
      }

    } else {
      // ── End of practice — complete session ────────────────────────────────
      // Triggered when:
      //   • Single-part mode: last question in the chosen part answered
      //   • Full-test mode:   last question in Part 3 answered
      setStatus('loading')
      await completeSession()
    }
  // completeSession is accessed via closure (stable ref via useCallback below)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion, currentPart, questions, sessionId, practiceMode, recorder, stt, playQuestion])

  const completeSession = useCallback(async () => {
    if (!sessionId) { setStatus('completed'); return }
    try {
      const res = await fetch('/api/speaking/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      const { session } = await res.json() as CompleteResponse
      setFinalScores(session)
      setStatus('completed')
    } catch {
      setStatus('completed')  // Show results even if complete call fails
    }
  }, [sessionId])

  return {
    sessionId,
    topic,
    currentPart,
    currentQuestion,
    questions,
    status,
    totalAnswered,
    practiceMode,
    startSession,
    startRecording,
    stopRecording,
    nextQuestion,
    completeSession,
    isRecording: recorder.isRecording,
    duration: recorder.duration,
    transcript: stt.transcript,
    interimText: stt.interimText,
    isSpeechSupported: stt.isSupported,
    isExaminerSpeaking,
    playQuestion,
    currentFeedback,
    finalScores,
    error,
    clearError,
  }
}
