import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronDown, FileText } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import type { NoteWithScores } from '@/lib/db/notes-insights'

interface NotesRawListProps {
  notes: NoteWithScores[]
}

export function NotesRawList({ notes }: NotesRawListProps) {
  if (notes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-6 text-center text-muted-foreground">
          <FileText className="h-8 w-8 opacity-40" />
          <p className="text-sm">No notes recorded yet.</p>
          <p className="text-xs">Add notes when saving test results to track your observations.</p>
        </CardContent>
      </Card>
    )
  }

  const displayed = notes.slice(0, 20)
  const remaining = notes.length - displayed.length

  return (
    <Collapsible>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer select-none pb-3 hover:bg-muted/30 transition-colors rounded-t-lg">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Raw Notes
                <span className="text-xs font-normal text-muted-foreground">({notes.length})</span>
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="divide-y divide-border">
              {displayed.map((note, idx) => (
                <div key={idx} className="py-3 first:pt-0">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {format(parseISO(note.test_date), 'MMM d, yyyy')}
                    </span>
                    {note.result_name && (
                      <span className="truncate text-xs text-muted-foreground">
                        {note.result_name}
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-3 text-sm text-foreground/80">{note.notes}</p>
                </div>
              ))}
              {remaining > 0 && (
                <p className="pt-3 text-center text-xs text-muted-foreground">
                  +{remaining} more notes not shown
                </p>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
