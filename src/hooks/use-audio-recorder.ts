'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

/** Max recording duration in seconds (3 min safety cap) */
const MAX_DURATION_S = 180

/** Preferred MIME types in priority order */
const MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
]

function getSupportedMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return ''
  return MIME_TYPES.find(t => MediaRecorder.isTypeSupported(t)) ?? ''
}

export interface UseAudioRecorderReturn {
  isRecording: boolean
  duration: number          // seconds elapsed since startRecording
  audioBlob: Blob | null    // final blob, set when stopRecording is called
  startRecording: () => Promise<void>
  stopRecording: () => void
  resetRecording: () => void
  error: string | null
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timerRef.current && clearInterval(timerRef.current)
      autoStopRef.current && clearTimeout(autoStopRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    timerRef.current && clearInterval(timerRef.current)
    autoStopRef.current && clearTimeout(autoStopRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setIsRecording(false)
  }, [])

  const startRecording = useCallback(async () => {
    setError(null)
    setAudioBlob(null)
    chunksRef.current = []

    // Request mic
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    } catch {
      setError('Microphone access denied. Please allow microphone access in your browser.')
      return
    }
    streamRef.current = stream

    const mimeType = getSupportedMimeType()
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    mediaRecorderRef.current = recorder

    recorder.ondataavailable = (e: BlobEvent) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' })
      setAudioBlob(blob)
    }

    recorder.onerror = () => {
      setError('Recording error occurred.')
      setIsRecording(false)
    }

    recorder.start(250)  // collect in 250ms chunks
    startTimeRef.current = Date.now()
    setIsRecording(true)
    setDuration(0)

    // Tick timer every second
    timerRef.current = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)

    // Auto-stop at max duration
    autoStopRef.current = setTimeout(() => {
      stopRecording()
    }, MAX_DURATION_S * 1000)
  }, [stopRecording])

  const resetRecording = useCallback(() => {
    setAudioBlob(null)
    setDuration(0)
    setError(null)
    chunksRef.current = []
  }, [])

  return { isRecording, duration, audioBlob, startRecording, stopRecording, resetRecording, error }
}
