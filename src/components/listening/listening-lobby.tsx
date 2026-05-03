'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Headphones, Clock, BookOpen, ChevronRight, History } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/lib/audio-utils'
import type { DbListeningTest, DbListeningAttempt, ListeningMode } from '@/lib/db/types'

interface ListeningLobbyProps {
  tests: DbListeningTest[]
  recentAttempts: DbListeningAttempt[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function groupByBook(tests: DbListeningTest[]): Map<number, DbListeningTest[]> {
  const map = new Map<number, DbListeningTest[]>()
  for (const t of tests) {
    const existing = map.get(t.cam_book) ?? []
    existing.push(t)
    map.set(t.cam_book, existing)
  }
  return map
}

function bandColor(band: number | null): string {
  if (!band) return 'text-muted-foreground'
  if (band >= 7.0) return 'text-green-600 dark:text-green-400'
  if (band >= 5.5) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-500 dark:text-red-400'
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// ── Mode Toggle ───────────────────────────────────────────────────────────────

interface ModeToggleProps {
  mode: ListeningMode
  onChange: (m: ListeningMode) => void
}

function ModeToggle({ mode, onChange }: ModeToggleProps) {
  const modes: { value: ListeningMode; label: string; description: string }[] = [
    {
      value: 'practice',
      label: 'Practice',
      description: 'Replay audio, no timer',
    },
    {
      value: 'strict',
      label: 'Strict',
      description: 'Audio once, 30-min timer',
    },
  ]

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Mode
      </p>
      <div className="flex gap-2">
        {modes.map(m => (
          <button
            key={m.value}
            onClick={() => onChange(m.value)}
            className={cn(
              'flex flex-1 flex-col items-start gap-0.5 rounded-xl border px-4 py-3 text-left transition-all duration-150',
              mode === m.value
                ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                : 'border-border hover:border-primary/40 hover:bg-muted/50'
            )}
          >
            <span className={cn('text-sm font-semibold', mode === m.value ? 'text-primary' : 'text-foreground')}>
              {m.label}
            </span>
            <span className="text-xs text-muted-foreground">{m.description}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Test Card ─────────────────────────────────────────────────────────────────

function TestCard({
  test,
  isSelected,
  onClick,
}: {
  test: DbListeningTest
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-md',
        'ring-2',
        isSelected
          ? 'border-primary bg-primary/5 ring-primary/30 shadow-sm'
          : 'border-border bg-card ring-transparent hover:border-primary/40 hover:ring-primary/10'
      )}
    >
      <div className="flex w-full items-center justify-between gap-2">
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold transition-colors',
            isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
          )}
        >
          {test.test_number}
        </span>
        {isSelected && (
          <ChevronRight className="h-4 w-4 shrink-0 text-primary" />
        )}
      </div>

      <div>
        <p className="text-sm font-semibold text-foreground">Test {test.test_number}</p>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>~30 min</span>
          <span>·</span>
          <BookOpen className="h-3 w-3" />
          <span>4 parts</span>
        </div>
      </div>
    </button>
  )
}

// ── Recent Attempt Row ────────────────────────────────────────────────────────

function AttemptRow({
  attempt,
  testTitle,
}: {
  attempt: DbListeningAttempt
  testTitle: string
}) {
  return (
    <a
      href={`/listening/results/${attempt.id}`}
      className="flex items-center justify-between rounded-xl border bg-card p-3 transition-colors hover:bg-muted/50"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{testTitle}</p>
        <p className="text-xs text-muted-foreground">
          {attempt.mode === 'strict' ? 'Strict' : 'Practice'}
          {' · '}
          {formatDate(attempt.completed_at)}
          {attempt.time_taken_seconds
            ? ` · ${formatDuration(attempt.time_taken_seconds)}`
            : ''}
        </p>
      </div>
      <div className="ml-3 shrink-0 text-right">
        <p className={cn('text-lg font-bold', bandColor(attempt.band))}>
          {attempt.band?.toFixed(1) ?? '—'}
        </p>
        <p className="text-xs text-muted-foreground">{attempt.correct_count ?? 0}/40</p>
      </div>
    </a>
  )
}

// ── Main Lobby ────────────────────────────────────────────────────────────────

export function ListeningLobby({ tests, recentAttempts }: ListeningLobbyProps) {
  const router = useRouter()
  const byBook = groupByBook(tests)
  const availableBooks = Array.from(byBook.keys()).sort()

  const defaultBook = availableBooks[availableBooks.length - 1] ?? 17
  const [selectedBook, setSelectedBook] = useState<number>(defaultBook)
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null)
  const [mode, setMode] = useState<ListeningMode>('practice')
  const [isStarting, setIsStarting] = useState(false)

  const booksForTabs = [17, 18, 19, 20]
  const testsForBook = byBook.get(selectedBook) ?? []

  const handleStart = () => {
    if (!selectedTestId) return
    setIsStarting(true)
    router.push(`/listening/${selectedTestId}?mode=${mode}`)
  }

  const handleBookChange = (book: number) => {
    setSelectedBook(book)
    setSelectedTestId(null)
  }

  // Build a testId → title map for history rows
  const testTitleMap = new Map(tests.map(t => [t.id, t.title]))

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="space-y-8">

        {/* Hero */}
        <div className="text-center">
          <div className="mb-3 flex justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-4xl shadow-sm">
              🎧
            </span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">IELTS Listening Practice</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cambridge IELTS 17–20 · Real exam format · Auto-scored
          </p>
        </div>

        {/* CAM Book Tabs */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Cambridge Book
          </p>
          <div className="flex gap-2">
            {booksForTabs.map(book => {
              const hasTests = byBook.has(book)
              return (
                <button
                  key={book}
                  onClick={() => hasTests && handleBookChange(book)}
                  disabled={!hasTests}
                  className={cn(
                    'flex flex-1 items-center justify-center rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all duration-150',
                    selectedBook === book && hasTests
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : hasTests
                        ? 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5'
                        : 'cursor-not-allowed border-border/50 bg-muted/30 text-muted-foreground/50'
                  )}
                >
                  CAM {book}
                  {!hasTests && (
                    <span className="ml-1 text-[10px] font-normal">(soon)</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Test Grid */}
        {testsForBook.length > 0 ? (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Select Test
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {testsForBook.map(test => (
                <TestCard
                  key={test.id}
                  test={test}
                  isSelected={selectedTestId === test.id}
                  onClick={() => setSelectedTestId(selectedTestId === test.id ? null : test.id)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <Headphones className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No tests available for CAM {selectedBook} yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">Check back soon — tests are added progressively.</p>
          </div>
        )}

        {/* Mode Toggle */}
        <ModeToggle mode={mode} onChange={setMode} />

        {/* Start Button */}
        <button
          onClick={handleStart}
          disabled={!selectedTestId || isStarting}
          className={cn(
            'w-full rounded-xl py-3.5 text-sm font-semibold transition-all duration-150',
            selectedTestId && !isStarting
              ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-md'
              : 'cursor-not-allowed bg-muted text-muted-foreground'
          )}
        >
          {isStarting
            ? 'Starting…'
            : selectedTestId
              ? `Start ${tests.find(t => t.id === selectedTestId)?.title ?? ''} →`
              : 'Select a test to begin'}
        </button>

        {/* Recent Attempts */}
        {recentAttempts.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Recent Attempts
              </p>
            </div>
            <div className="space-y-2">
              {recentAttempts.map(attempt => (
                <AttemptRow
                  key={attempt.id}
                  attempt={attempt}
                  testTitle={testTitleMap.get(attempt.test_id) ?? 'Unknown test'}
                />
              ))}
            </div>
          </div>
        )}

        {recentAttempts.length === 0 && (
          <p className="text-center text-xs text-muted-foreground">
            No attempts yet. Start your first test!
          </p>
        )}
      </div>
    </div>
  )
}
