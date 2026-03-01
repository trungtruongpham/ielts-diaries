import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUserGoal } from '@/lib/db/user-goals'
import { GoalForm } from '@/components/goal/goal-form'
import { ArrowLeft, Target } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Set Goal | IELTS Diaries',
}

export default async function GoalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/dashboard/goal')

  const goal = await getUserGoal()

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8 animate-fade-up">
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to dashboard
        </Link>
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">{goal ? 'Update Your Goal' : 'Set Your Goal'}</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-[52px]">
          {goal
            ? 'Adjust your target band scores and deadline.'
            : 'Define what you want to achieve and by when.'}
        </p>
      </div>
      <GoalForm existing={goal} />
    </div>
  )
}
