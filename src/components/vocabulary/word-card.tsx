'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Trash2, Volume2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { deleteWordAction } from '@/app/dashboard/vocabulary/actions'
import type { DbVocabularyWord, DbVocabularyCard } from '@/lib/db/types'

interface Props {
  word: DbVocabularyWord
  card: DbVocabularyCard | null
  onDeleted?: (wordId: string) => void
}

const STATE_STYLES: Record<string, { label: string; className: string }> = {
  New: { label: 'New', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  Learning: { label: 'Learning', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
  Review: { label: 'Review', className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  Relearning: { label: 'Relearning', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
}

function formatDue(due: string | undefined): string {
  if (!due) return ''
  const now = new Date()
  const dueDate = new Date(due)
  const diffMs = dueDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffMs < 0) return 'Overdue'
  if (diffDays === 0) return 'Due today'
  if (diffDays === 1) return 'Due tomorrow'
  return `Due in ${diffDays}d`
}

function isDueOverdue(due: string | undefined): boolean {
  if (!due) return false
  return new Date(due) < new Date()
}

export function WordCard({ word, card, onDeleted }: Props) {
  const [deleted, setDeleted] = useState(false)
  const [isDeleting, startDelete] = useTransition()

  const stateKey = card?.state ?? 'New'
  const stateStyle = STATE_STYLES[stateKey] ?? STATE_STYLES.New
  const dueStr = formatDue(card?.due)
  const overdue = isDueOverdue(card?.due)

  function handleDelete() {
    startDelete(async () => {
      const result = await deleteWordAction(word.id)
      if (result.error) {
        toast.error(result.error)
        return
      }
      setDeleted(true)
      onDeleted?.(word.id)
      toast.success(`"${word.word}" deleted`)
    })
  }

  if (deleted) return null

  return (
    <Card className="group relative flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="flex flex-1 flex-col gap-3 pt-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-xl font-bold leading-tight">{word.word}</span>
              {word.phonetic && (
                <span className="text-xs text-muted-foreground font-mono">{word.phonetic}</span>
              )}
            </div>
            {word.part_of_speech && (
              <span className="text-xs italic text-muted-foreground">{word.part_of_speech}</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label="Delete word"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Definition */}
        <p className="line-clamp-2 text-sm text-foreground/90">{word.definition}</p>

        {/* Skill tags */}
        {word.skill_tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {word.skill_tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Footer: FSRS state + due */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${stateStyle.className}`}>
            {stateStyle.label}
          </span>
          {card && (
            <span className={`text-[10px] font-medium ${overdue ? 'text-destructive' : 'text-muted-foreground'}`}>
              {dueStr}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
