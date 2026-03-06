'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

// Web Speech API type augmentation
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

export interface UseSpeechRecognitionReturn {
  isListening: boolean
  transcript: string        // accumulated full transcript
  interimText: string       // current partial (in-progress) result
  isSupported: boolean
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
  error: string | null
}

function getRecognitionClass(): typeof SpeechRecognition | null {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
}

export function useSpeechRecognition(lang = 'en-US'): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimText, setInterimText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const shouldListenRef = useRef(false)
  const finalTranscriptRef = useRef('')

  const isSupported = getRecognitionClass() !== null

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldListenRef.current = false
      recognitionRef.current?.stop()
    }
  }, [])

  const startListening = useCallback(() => {
    const Rec = getRecognitionClass()
    if (!Rec) {
      setError('Speech recognition is not supported in this browser. Audio will still be recorded.')
      return
    }

    setError(null)
    shouldListenRef.current = true

    const recognition = new Rec()
    recognition.lang = lang
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognitionRef.current = recognition

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      let finalDelta = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalDelta += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }

      if (finalDelta) {
        finalTranscriptRef.current += finalDelta + ' '
        setTranscript(finalTranscriptRef.current.trim())
      }
      setInterimText(interim)
    }

    // Auto-restart: browser stops recognition after silence
    recognition.onend = () => {
      if (shouldListenRef.current) {
        try {
          recognition.start()
        } catch {
          // Already started — ignore
        }
      } else {
        setIsListening(false)
        setInterimText('')
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // 'aborted' and 'no-speech' are benign — don't show as errors
      if (event.error === 'aborted' || event.error === 'no-speech') return
      setError(`Speech recognition error: ${event.error}`)
    }

    try {
      recognition.start()
      setIsListening(true)
    } catch {
      setError('Failed to start speech recognition.')
    }
  }, [lang])

  const stopListening = useCallback(() => {
    shouldListenRef.current = false
    recognitionRef.current?.stop()
    setIsListening(false)
    setInterimText('')
  }, [])

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = ''
    setTranscript('')
    setInterimText('')
  }, [])

  return {
    isListening,
    transcript,
    interimText,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    error,
  }
}
