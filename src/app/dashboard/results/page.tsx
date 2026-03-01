import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUserTestResults } from '@/lib/db/test-results'
import { ResultsList } from '@/components/results/results-list'
import { Button } from '@/components/ui/button'
import { Plus, ClipboardList } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Test Results | IELTS Diaries',
}

export default async function ResultsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/dashboard/results')

  const results = await getUserTestResults()

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      {/* Page header */}
      <div className="mb-8 flex items-center justify-between animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Test Results</h1>
            <p className="text-sm text-muted-foreground">
              {results.length === 0 ? 'No results yet' : `${results.length} result${results.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        <Button asChild className="gap-2 font-semibold">
          <Link href="/dashboard/results/new">
            <Plus className="h-4 w-4" />
            Add Result
          </Link>
        </Button>
      </div>

      <ResultsList results={results} />
    </div>
  )
}
