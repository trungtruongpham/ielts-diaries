'use client'

import { useTransition } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { NotesInsightCard } from './notes-insight-card'
import { NotesRawList } from './notes-raw-list'
import { refreshNotesInsights } from '@/app/dashboard/notes/actions'
import type { DbSkillNoteInsight, IeltsSkill } from '@/lib/db/types'
import type { NoteWithScores } from '@/lib/db/notes-insights'

interface NotesSkillTabsProps {
  insights: DbSkillNoteInsight[]
  notes: NoteWithScores[]
}

const SKILLS: IeltsSkill[] = ['listening', 'reading', 'writing', 'speaking']

const SKILL_LABELS: Record<IeltsSkill, string> = {
  listening: 'Listening',
  reading:   'Reading',
  writing:   'Writing',
  speaking:  'Speaking',
}

export function NotesSkillTabs({ insights, notes }: NotesSkillTabsProps) {
  const [isPending, startTransition] = useTransition()

  const insightMap = Object.fromEntries(insights.map((i) => [i.skill, i])) as Record<IeltsSkill, DbSkillNoteInsight | undefined>

  function handleRefresh() {
    startTransition(async () => {
      const { error } = await refreshNotesInsights()
      if (error) {
        toast.error('Failed to refresh insights', { description: error })
      } else {
        toast.success('Insights refreshed successfully')
      }
    })
  }

  function SkillContent({ skill }: { skill: IeltsSkill }) {
    const skillNotes = notes.slice()  // all notes — LLM infers skill relevance
    return (
      <div className="space-y-4">
        <NotesInsightCard skill={skill} insight={insightMap[skill] ?? null} />
        <NotesRawList notes={skillNotes} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {notes.length > 0
            ? `${notes.length} test result${notes.length !== 1 ? 's' : ''} with notes`
            : 'No notes recorded yet'}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isPending || notes.length === 0}
          className="gap-2"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
          {isPending ? 'Refreshing…' : 'Refresh Insights'}
        </Button>
      </div>

      <Tabs defaultValue="listening">
        <TabsList className="grid w-full grid-cols-4">
          {SKILLS.map((skill) => (
            <TabsTrigger key={skill} value={skill} className="text-xs sm:text-sm">
              {SKILL_LABELS[skill]}
            </TabsTrigger>
          ))}
        </TabsList>

        {SKILLS.map((skill) => (
          <TabsContent key={skill} value={skill} className="mt-4">
            <SkillContent skill={skill} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
