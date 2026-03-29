'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSpeakingSession } from '@/hooks/use-speaking-session'
import { SpeakingLobby } from '@/components/speaking/speaking-lobby'
import { SpeakingPractice } from '@/components/speaking/speaking-practice'
import { SessionResults } from '@/components/speaking/session-results'
import { AlertTriangle, Loader2 } from 'lucide-react'

export default function SpeakingPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [isAuthed, setIsAuthed] = useState(false)
  const session = useSpeakingSession()

  // Client-side auth guard
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace('/auth/sign-in?next=/speaking')
        return
      }
      setIsAuthed(true)
      setAuthChecked(true)
    })
  }, [router])

  // Show spinner while checking auth (avoids blank flash)
  if (!authChecked) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthed) {
    return null
  }

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      {/* Error banner */}
      {session.error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <div className="flex-1">
            <p className="text-sm text-red-700 dark:text-red-300">{session.error}</p>
          </div>
          <button
            onClick={session.clearError}
            className="text-xs text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* Lobby — idle */}
      {session.status === 'idle' && (
        <SpeakingLobby
          onStart={(mode) => session.startSession(mode)}
          isLoading={false}
          loadingMode={null}
        />
      )}

      {/* Initial loading — session starting */}
      {session.status === 'loading' && session.sessionId === null && (
        <SpeakingLobby
          onStart={(mode) => session.startSession(mode)}
          isLoading={true}
          loadingMode={session.practiceMode}
        />
      )}

      {/* Active practice */}
      {session.status !== 'idle' &&
        session.status !== 'completed' &&
        !(session.status === 'loading' && session.sessionId === null) && (
          <SpeakingPractice
            session={session}
            onExit={() => window.location.reload()}
          />
        )}

      {/* Results — completed with scores */}
      {session.status === 'completed' && session.finalScores && (
        <SessionResults
          scores={session.finalScores}
          sessionId={session.sessionId}
          practiceMode={session.practiceMode}
          onPracticeAgain={() => window.location.reload()}
        />
      )}

      {/* Results — completed but no scores (edge case) */}
      {session.status === 'completed' && !session.finalScores && (
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-lg font-medium">Practice complete! 🎉</p>
          <a href="/dashboard/speaking" className="mt-4 block text-sm text-primary underline">
            View your session history
          </a>
        </div>
      )}
    </main>
  )
}
