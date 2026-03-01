import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getTestResultById } from '@/lib/db/test-results'
import { TestResultForm } from '@/components/results/test-result-form'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit Test Result | IELTS Diaries',
}

export default async function EditResultPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = await params
  const result = await getTestResultById(id)
  if (!result) notFound()

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
        <h1 className="text-2xl font-bold">Edit Test Result</h1>
        <p className="text-sm text-muted-foreground">Update or correct the details of this test attempt.</p>
      </div>
      <TestResultForm existing={result} />
    </div>
  )
}
