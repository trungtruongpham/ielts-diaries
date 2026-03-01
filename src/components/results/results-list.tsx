'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { deleteTestResult } from '@/app/dashboard/results/actions'
import type { DbTestResult } from '@/lib/db/types'
import { getBandColorClass } from '@/lib/ielts'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Pencil, Trash2, Headphones, BookOpen, Pen, Mic, ChevronDown, ChevronUp, BookMarked } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ResultsListProps {
  results: DbTestResult[]
}

export function ResultsList({ results }: ResultsListProps) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 py-20 text-center">
        <div className="mb-4 text-4xl">📋</div>
        <p className="font-semibold text-foreground">No test results yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Add your first result to start tracking your IELTS journey.</p>
        <Button asChild className="mt-6 gap-2 font-semibold">
          <Link href="/dashboard/results/new">Add First Result</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {results.map((result) => (
        <ResultCard key={result.id} result={result} />
      ))}
    </div>
  )
}

function ResultCard({ result }: { result: DbTestResult }) {
  const [expanded, setExpanded] = useState(false)
  const [isPending, startTransition] = useTransition()
  const overall = getBandColorClass(result.overall_band)

  const moduleScores = [
    { icon: Headphones, label: 'L', band: result.listening_band, color: 'text-blue-600' },
    { icon: BookOpen,   label: 'R', band: result.reading_band,   color: 'text-green-600' },
    { icon: Pen,        label: 'W', band: result.writing_band,   color: 'text-amber-600' },
    { icon: Mic,        label: 'S', band: result.speaking_band,  color: 'text-red-600' },
  ]

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteTestResult(result.id)
      if (res?.error) {
        toast.error('Failed to delete', { description: res.error })
      } else {
        toast.success('Result deleted')
      }
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden card-hover">
      {/* Main row */}
      <div className="flex items-center gap-4 px-4 py-4">
        {/* Overall band */}
        <div className={cn('flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border-2 font-bold', overall.bg, overall.border)}>
          <span className={cn('text-xl leading-none tabular-nums', overall.text)}>
            {result.overall_band.toFixed(1)}
          </span>
          <span className={cn('text-[9px] font-medium uppercase tracking-wider', overall.text)}>
            overall
          </span>
        </div>

        {/* Name + Date + type */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {result.result_name ? (
              <>
                <div className="flex items-center gap-1.5">
                  <BookMarked className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="font-bold text-foreground">{result.result_name}</span>
                </div>
                <Badge variant="outline" className="text-[10px] capitalize shrink-0">
                  {result.test_type}
                </Badge>
              </>
            ) : (
              <>
                <span className="font-semibold text-foreground">
                  {format(new Date(result.test_date), 'MMM d, yyyy')}
                </span>
                <Badge variant="outline" className="text-[10px] capitalize shrink-0">
                  {result.test_type}
                </Badge>
              </>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2 flex-wrap">
            {result.result_name && (
              <span className="text-xs text-muted-foreground">
                {format(new Date(result.test_date), 'MMM d, yyyy')}
              </span>
            )}
            {/* Mini module pills */}
            {moduleScores.map(({ label, band, color }) =>
              band !== null ? (
                <span key={label} className={cn('text-xs font-semibold tabular-nums', color)}>
                  {label} {band.toFixed(1)}
                </span>
              ) : null
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            asChild
          >
            <Link href={`/dashboard/results/${result.id}/edit`} aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                disabled={isPending}
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this result?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove{' '}
                  <strong>{result.result_name ?? format(new Date(result.test_date), 'MMMM d, yyyy')}</strong>.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border bg-muted/30 px-4 py-3 animate-fade-up">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {moduleScores.map(({ icon: Icon, label, band, color }) => (
              <div key={label} className="text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <Icon className={cn('h-3.5 w-3.5', color)} />
                  <span className="text-xs text-muted-foreground">
                    {label === 'L' ? 'Listening' : label === 'R' ? 'Reading' : label === 'W' ? 'Writing' : 'Speaking'}
                  </span>
                </div>
                <span className={cn('text-xl font-bold tabular-nums', color)}>
                  {band !== null ? band.toFixed(1) : '—'}
                </span>
              </div>
            ))}
          </div>
          {result.notes && (
            <p className="mt-3 text-xs text-muted-foreground border-t border-border pt-3">
              📝 {result.notes}
            </p>
          )}
          {(result.listening_correct !== null || result.reading_correct !== null) && (
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
              {result.listening_correct !== null && (
                <span>Listening: <strong>{result.listening_correct}/40</strong> correct</span>
              )}
              {result.reading_correct !== null && (
                <span>Reading: <strong>{result.reading_correct}/40</strong> correct</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
