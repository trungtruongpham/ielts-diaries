import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getInsightsForUser, getUserNotesWithScores } from '@/lib/db/notes-insights'
import { NotesSkillTabs } from '@/components/notes/notes-skill-tabs'
import { StickyNote } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Notes | IELTS Diaries',
}

export default async function NotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/dashboard/notes')

  const [insights, notes] = await Promise.all([
    getInsightsForUser(),
    getUserNotesWithScores(),
  ])

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <StickyNote className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Learning Notes</h1>
            <p className="text-sm text-muted-foreground">
              AI-generated insights from your test notes, organized by skill
            </p>
          </div>
        </div>
      </div>

      <NotesSkillTabs insights={insights} notes={notes} />
    </div>
  )
}
