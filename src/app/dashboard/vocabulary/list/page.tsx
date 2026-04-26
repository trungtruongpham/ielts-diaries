// Word list page — RSC, fetches all words+cards and passes to client component
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { getWordsWithCards } from '@/lib/db/vocabulary'
import { WordList } from '@/components/vocabulary/word-list'

export default async function VocabularyListPage() {
  const supabase = await createClient()
  const items = await getWordsWithCards(supabase)

  return (
    <div className="container mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <Link href="/dashboard/vocabulary">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Word Library</h1>
            <p className="text-sm text-muted-foreground">{items.length} words</p>
          </div>
        </div>
        <Button asChild size="sm">
          <Link href="/dashboard/vocabulary/add">
            <Plus className="mr-2 h-4 w-4" />
            Add Word
          </Link>
        </Button>
      </div>

      <WordList items={items} />
    </div>
  )
}
