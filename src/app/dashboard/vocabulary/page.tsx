// Vocabulary lobby — RSC, shows stats and navigation
import Link from 'next/link'
import { BookOpen, Plus, List, Brain, Flame, Star, BookMarked } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import { getDueCount, getVocabularyWords, getVocabularySettings } from '@/lib/db/vocabulary'
import type { DbVocabularyWord } from '@/lib/db/types'

async function getStats() {
  const supabase = await createClient()
  const [words, dueCount, settings] = await Promise.all([
    getVocabularyWords(supabase),
    getDueCount(supabase),
    getVocabularySettings(supabase),
  ])

  // Fetch cards to compute state breakdown
  const { data: cards } = await supabase.from('vocabulary_cards').select('state')
  const cardRows = (cards ?? []) as Array<{ state: string }>
  const stateCounts = cardRows.reduce<Record<string, number>>((acc, c) => {
    acc[c.state] = (acc[c.state] ?? 0) + 1
    return acc
  }, {})

  return {
    total: words.length,
    dueCount,
    newCount: stateCounts['New'] ?? 0,
    learningCount: stateCounts['Learning'] ?? 0,
    reviewCount: stateCounts['Review'] ?? 0,
    relearningCount: stateCounts['Relearning'] ?? 0,
    dailyLimit: settings?.daily_new_word_limit ?? 10,
  }
}

export default async function VocabularyPage() {
  const stats = await getStats()

  return (
    <div className="container mx-auto max-w-4xl space-y-8 px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vocabulary</h1>
          <p className="text-muted-foreground">
            Spaced repetition — review words at the right time, every time
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/vocabulary/list">
              <List className="mr-2 h-4 w-4" />
              Browse
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard/vocabulary/add">
              <Plus className="mr-2 h-4 w-4" />
              Add Word
            </Link>
          </Button>
        </div>
      </div>

      {/* Due count hero */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
        <CardContent className="flex flex-col items-center gap-6 py-10 sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center gap-3 sm:justify-start">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Flame className="h-8 w-8" />
              </div>
              <div>
                <div className="text-5xl font-bold tabular-nums text-primary">{stats.dueCount}</div>
                <div className="text-sm font-medium text-muted-foreground">cards due today</div>
              </div>
            </div>
            {stats.dueCount === 0 && (
              <p className="mt-3 text-sm text-muted-foreground">
                You&apos;re all caught up! Come back later for your next review.
              </p>
            )}
          </div>
          <Button
            asChild
            size="lg"
            className="min-w-[160px] text-base"
            disabled={stats.dueCount === 0}
          >
            <Link href="/dashboard/vocabulary/review">
              <Brain className="mr-2 h-5 w-5" />
              {stats.dueCount > 0 ? 'Start Review' : 'No cards due'}
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={<BookOpen className="h-5 w-5" />}
          label="Total Words"
          value={stats.total}
          color="text-foreground"
        />
        <StatCard
          icon={<BookMarked className="h-5 w-5" />}
          label="New"
          value={stats.newCount}
          color="text-blue-500"
          badge="New"
          badgeVariant="secondary"
        />
        <StatCard
          icon={<Brain className="h-5 w-5" />}
          label="Learning"
          value={stats.learningCount + stats.relearningCount}
          color="text-yellow-500"
          badge="Learning"
          badgeVariant="outline"
        />
        <StatCard
          icon={<Star className="h-5 w-5" />}
          label="Mature"
          value={stats.reviewCount}
          color="text-green-500"
          badge="Review"
          badgeVariant="outline"
        />
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="h-4 w-4 text-primary" />
              Add New Word
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Add a word and let AI enrich it with definition, IPA phonetic, example sentence, and synonyms.
            </p>
            <Button asChild className="w-full">
              <Link href="/dashboard/vocabulary/add">Add Word</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <List className="h-4 w-4 text-primary" />
              Browse Library
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              View all {stats.total} words, filter by skill tag or state, and manage your vocabulary library.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/vocabulary/list">Browse Words</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Daily limit note */}
      <p className="text-center text-xs text-muted-foreground">
        Daily new word limit: {stats.dailyLimit} cards · Powered by FSRS spaced repetition
      </p>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
  badge,
  badgeVariant,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
  badge?: string
  badgeVariant?: 'default' | 'secondary' | 'outline' | 'destructive'
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 pt-5">
        <div className={`${color}`}>{icon}</div>
        <div className="text-3xl font-bold tabular-nums">{value}</div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{label}</span>
          {badge && <Badge variant={badgeVariant ?? 'secondary'} className="text-[10px]">{badge}</Badge>}
        </div>
      </CardContent>
    </Card>
  )
}
