'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Headphones, BookOpen, BarChart3 } from 'lucide-react'
import { ListeningCalculator } from './listening-calculator'
import { ReadingCalculator } from './reading-calculator'
import { OverallCalculator } from './overall-calculator'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { TestType } from '@/lib/ielts'
import type { OverallBandInput } from '@/lib/ielts'

export function CalculatorTabs() {
  const router = useRouter()
  const supabase = createClient()

  // Shared state to carry listening/reading into Overall tab
  const [listeningBand, setListeningBand] = useState<number>(0)
  const [readingBand, setReadingBand] = useState<number>(0)

  const isSupabaseConfigured = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    return url && key && !url.includes('placeholder') && !key.includes('placeholder')
  }

  // Check auth before saving — redirect to login if not authenticated
  const checkAuthAndSave = async (saveAction: () => Promise<void>) => {
    if (!isSupabaseConfigured()) {
      toast.info('Sign in to save your results', {
        action: { label: 'Sign In', onClick: () => router.push('/login') },
      })
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.info('Sign in to save your results', {
        description: 'Create a free account to track your progress.',
        action: { label: 'Sign In', onClick: () => router.push('/login?redirectTo=/calculator') },
      })
      return
    }
    await saveAction()
  }

  const handleListeningSave = async (data: { correctAnswers: number; band: number }) => {
    setListeningBand(data.band)
    await checkAuthAndSave(async () => {
      // Will be wired to actual save in Phase 6 — for now show confirmation
      toast.success('Ready to save!', {
        description: `Listening: ${data.band.toFixed(1)} — go to Dashboard to log full result.`,
        action: { label: 'Dashboard', onClick: () => router.push('/dashboard/results/new') },
      })
    })
  }

  const handleReadingSave = async (data: { correctAnswers: number; band: number; testType: TestType }) => {
    setReadingBand(data.band)
    await checkAuthAndSave(async () => {
      toast.success('Ready to save!', {
        description: `Reading: ${data.band.toFixed(1)} — go to Dashboard to log full result.`,
        action: { label: 'Dashboard', onClick: () => router.push('/dashboard/results/new') },
      })
    })
  }

  const handleOverallSave = async (data: { scores: OverallBandInput; overall: number }) => {
    await checkAuthAndSave(async () => {
      toast.success('Ready to save!', {
        description: `Overall: ${data.overall.toFixed(1)} — go to Dashboard to log full result.`,
        action: { label: 'Dashboard', onClick: () => router.push('/dashboard/results/new') },
      })
    })
  }

  return (
    <Tabs defaultValue="listening" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-8 h-12 rounded-xl bg-muted/60 p-1">
        <TabsTrigger
          value="listening"
          className="rounded-lg gap-2 font-semibold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
        >
          <Headphones className="h-4 w-4" />
          <span className="hidden sm:inline">Listening</span>
          <span className="sm:hidden">Listen</span>
        </TabsTrigger>
        <TabsTrigger
          value="reading"
          className="rounded-lg gap-2 font-semibold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
        >
          <BookOpen className="h-4 w-4" />
          <span className="hidden sm:inline">Reading</span>
          <span className="sm:hidden">Read</span>
        </TabsTrigger>
        <TabsTrigger
          value="overall"
          className="rounded-lg gap-2 font-semibold data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
        >
          <BarChart3 className="h-4 w-4" />
          Overall
        </TabsTrigger>
      </TabsList>

      <TabsContent value="listening" className="animate-fade-up">
        <ListeningCalculator onSave={handleListeningSave} />
      </TabsContent>

      <TabsContent value="reading" className="animate-fade-up">
        <ReadingCalculator onSave={handleReadingSave} />
      </TabsContent>

      <TabsContent value="overall" className="animate-fade-up">
        <OverallCalculator
          onSave={handleOverallSave}
          prefill={{
            listening: listeningBand || undefined,
            reading: readingBand || undefined,
          }}
        />
      </TabsContent>
    </Tabs>
  )
}
