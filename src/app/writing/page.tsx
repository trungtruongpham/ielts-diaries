'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useWritingSession } from '@/hooks/use-writing-session'
import { WritingLobby } from '@/components/writing/writing-lobby'
import { WritingTaskBrief } from '@/components/writing/writing-task-brief'
import { WritingEditor } from '@/components/writing/writing-editor'
import { WritingResults } from '@/components/writing/writing-results'
import { AlertTriangle, Loader2, PenLine } from 'lucide-react'

export default function WritingPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [isAuthed, setIsAuthed] = useState(false)
  const session = useWritingSession()

  // Client-side auth guard
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace('/auth/sign-in?next=/writing')
        return
      }
      setIsAuthed(true)
      setAuthChecked(true)
    })
  }, [router])

  if (!authChecked) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthed) return null

  const taskLabel =
    session.taskType === 'task1_gt'   ? 'Task 1 · General Training' :
    session.taskType === 'task1_academic' ? 'Task 1 · Academic' :
    session.taskType === 'task2'      ? 'Task 2 · Essay' :
    session.currentTask === 2         ? 'Task 2 · Essay' :
    'Task 1 · Academic'

  return (
    <main>
      {/* Error banner */}
      {session.error && (
        <div className="container mx-auto max-w-6xl px-4 pt-6">
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <div className="flex-1">
              <p className="text-sm text-red-700 dark:text-red-300">{session.error}</p>
            </div>
            <button onClick={session.clearError} className="text-xs text-red-500 hover:text-red-700">✕</button>
          </div>
        </div>
      )}

      {/* Idle — lobby */}
      {session.status === 'idle' && (
        <WritingLobby
          onStart={(type, chartTypeHint) => session.startSession(type, 'academic', chartTypeHint)}
          isLoading={false}
          loadingMode={null}
        />
      )}

      {/* Loading — prompt generation (full-screen spinner, no lobby flash) */}
      {session.status === 'loading' && (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Generating your prompt…</p>
        </div>
      )}

      {/* Briefing — reading countdown */}
      {session.status === 'briefing' && session.currentPrompt && (
        <WritingTaskBrief
          prompt={session.currentPrompt}
          taskLabel={taskLabel}
          onConfirm={session.confirmBrief}
          onBack={session.reset}
        />
      )}

      {/* Writing editor */}
      {(session.status === 'writing' || session.status === 'evaluating') && (
        <WritingEditor session={session} />
      )}

      {/* Evaluating spinner (shown with editor disabled) — handled inside WritingEditor */}

      {/* Completed — results */}
      {session.status === 'completed' && session.finalBands && (
        <WritingResults
          taskType={session.taskType ?? 'task2'}
          task1Evaluation={session.task1Evaluation}
          task2Evaluation={session.task2Evaluation}
          finalBands={session.finalBands}
          sessionId={session.sessionId}
          onPracticeAgain={() => window.location.reload()}
        />
      )}

      {/* Completed but no bands (edge case) */}
      {session.status === 'completed' && !session.finalBands && (
        <div className="flex flex-col items-center justify-center py-24 text-center px-4">
          <PenLine className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="text-lg font-semibold">Practice complete! 🎉</p>
          <a href="/dashboard/writing" className="mt-4 block text-sm text-primary underline">
            View your writing history
          </a>
        </div>
      )}
    </main>
  )
}
