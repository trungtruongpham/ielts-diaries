import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import type { DbSkillNoteInsight, IeltsSkill } from '@/lib/db/types'

interface NotesInsightCardProps {
  skill: IeltsSkill
  insight: DbSkillNoteInsight | null
}

const SKILL_CONFIG: Record<IeltsSkill, { label: string; colorClass: string }> = {
  listening: { label: 'Listening', colorClass: 'text-blue-500' },
  reading:   { label: 'Reading',   colorClass: 'text-green-500' },
  writing:   { label: 'Writing',   colorClass: 'text-amber-500' },
  speaking:  { label: 'Speaking',  colorClass: 'text-red-500' },
}

export function NotesInsightCard({ skill, insight }: NotesInsightCardProps) {
  const { label } = SKILL_CONFIG[skill]
  const hasData = insight && insight.summary && insight.summary !== 'No notes available for this skill yet.'

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span>AI Insights</span>
          {insight?.generated_at && (
            <span className="text-xs font-normal text-muted-foreground">
              Updated {format(parseISO(insight.generated_at), 'MMM d, yyyy')}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasData ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 opacity-40" />
            <p className="text-sm">No insights yet for {label}.</p>
            <p className="text-xs">Add notes when saving test results to generate insights.</p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <p className="text-sm leading-relaxed text-foreground/90">{insight.summary}</p>

            {/* Weak areas */}
            {insight.weak_areas.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Weak Areas
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {insight.weak_areas.map((area) => (
                    <Badge key={area} variant="secondary" className="text-xs">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Action items */}
            {insight.action_items.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Action Items
                </p>
                <ol className="space-y-1.5">
                  {insight.action_items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2
                        className={cn('mt-0.5 h-4 w-4 shrink-0', SKILL_CONFIG[skill].colorClass)}
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {insight.notes_analyzed_count > 0 && (
              <p className="text-xs text-muted-foreground">
                Based on {insight.notes_analyzed_count} test result{insight.notes_analyzed_count !== 1 ? 's' : ''} with notes
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
