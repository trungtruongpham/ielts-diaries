import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { TestResultForm } from '@/components/results/test-result-form'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Add Test Result | IELTS Diaries',
}

export default async function NewResultPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/dashboard/results/new')

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8 animate-fade-up">
        <Link
          href="/dashboard/results"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to results
        </Link>
        <h1 className="text-2xl font-bold">Add Test Result</h1>
        <p className="text-sm text-muted-foreground">
          Log a test you&apos;ve taken. Enter correct answers to auto-calculate band scores.
        </p>
      </div>
      <TestResultForm />
    </div>
  )
}
