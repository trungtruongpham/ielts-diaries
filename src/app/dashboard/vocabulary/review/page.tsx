// Review page — RSC, fetches due cards and renders session or "all caught up"
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { getDueCards, getVocabularySettings } from '@/lib/db/vocabulary'
import { ReviewSession } from '@/components/vocabulary/review-session'

export default async function ReviewPage() {
  const supabase = await createClient()
  const [allDue, settings] = await Promise.all([
    getDueCards(supabase, 100),
    getVocabularySettings(supabase),
  ])

  const dailyLimit = settings?.daily_new_word_limit ?? 10

  // Respect daily new word limit
  let newCount = 0
  const queue = allDue.filter(({ card }) => {
    if (card.state === 'New') {
      if (newCount >= dailyLimit) return false
      newCount++
    }
    return true
  })

  if (queue.length === 0) {
    // Find next due date
    const { data: nextCard } = await supabase
      .from('vocabulary_cards')
      .select('due')
      .order('due', { ascending: true })
      .limit(1)
      .single()

    const nextDue = nextCard?.due ? new Date(nextCard.due) : null
    const nextDueStr = nextDue
      ? nextDue.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : null

    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <Link href="/dashboard/vocabulary">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30">
              <CheckCircle className="h-10 w-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">All caught up!</h2>
              <p className="mt-1 text-muted-foreground">
                You&apos;ve reviewed all your due cards for now.
              </p>
            </div>
            {nextDueStr && (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Next review: {nextDueStr}
              </div>
            )}
            <div className="flex gap-3">
              <Button asChild variant="outline">
                <Link href="/dashboard/vocabulary/add">Add Word</Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard/vocabulary">Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link href="/dashboard/vocabulary">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">Review Session</h1>
          <p className="text-sm text-muted-foreground">{queue.length} cards to review</p>
        </div>
      </div>
      <ReviewSession initialQueue={queue} />
    </div>
  )
}
