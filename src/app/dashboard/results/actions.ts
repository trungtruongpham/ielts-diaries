'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { calculateListeningBand, calculateReadingBand, calculateOverallBand } from '@/lib/ielts'
import { generateNotesInsights } from '@/app/dashboard/notes/actions'
import type { TestType } from '@/lib/ielts'

// ── Insert a new test result ──────────────────────────────────────────────────
export async function createTestResult(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const testType = formData.get('test_type') as TestType
  const testDate = formData.get('test_date') as string
  const resultName = (formData.get('result_name') as string) || null
  const notes    = (formData.get('notes') as string) || null

  // Raw correct answers (nullable — user may only know band)
  const listeningCorrect = formData.get('listening_correct')
    ? Number(formData.get('listening_correct')) : null
  const readingCorrect = formData.get('reading_correct')
    ? Number(formData.get('reading_correct')) : null

  // Band scores
  const listeningBand = listeningCorrect !== null
    ? calculateListeningBand(listeningCorrect)
    : formData.get('listening_band') ? Number(formData.get('listening_band')) : null

  const readingBand = readingCorrect !== null
    ? calculateReadingBand(readingCorrect, testType)
    : formData.get('reading_band') ? Number(formData.get('reading_band')) : null

  const writingBand  = formData.get('writing_band')  ? Number(formData.get('writing_band'))  : null
  const speakingBand = formData.get('speaking_band') ? Number(formData.get('speaking_band')) : null

  // Overall — calculate from available bands
  const availableBands = [listeningBand, readingBand, writingBand, speakingBand].filter(
    (b): b is number => b !== null
  )
  if (availableBands.length === 0) {
    return { error: 'Enter at least one band score' }
  }

  // If all 4 are present use official formula, otherwise average available
  let overallBand: number
  if (listeningBand !== null && readingBand !== null && writingBand !== null && speakingBand !== null) {
    overallBand = calculateOverallBand({ listening: listeningBand, reading: readingBand, writing: writingBand, speaking: speakingBand })
  } else {
    const avg = availableBands.reduce((a, b) => a + b, 0) / availableBands.length
    overallBand = Math.round(avg * 2) / 2
  }

  const { error } = await supabase.from('test_results').insert({
    user_id: user.id,
    test_date: testDate,
    test_type: testType,
    result_name: resultName,
    listening_correct: listeningCorrect,
    reading_correct: readingCorrect,
    listening_band: listeningBand,
    reading_band: readingBand,
    writing_band: writingBand,
    speaking_band: speakingBand,
    overall_band: overallBand,
    notes,
  })

  if (error) return { error: error.message }

  // Regenerate notes insights in the background (fire-and-forget)
  generateNotesInsights().catch(console.error)

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/results')
  redirect('/dashboard/results')
}

// ── Update an existing test result ───────────────────────────────────────────
export async function updateTestResult(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const testType = formData.get('test_type') as TestType
  const testDate = formData.get('test_date') as string
  const resultName = (formData.get('result_name') as string) || null
  const notes    = (formData.get('notes') as string) || null

  const listeningCorrect = formData.get('listening_correct') ? Number(formData.get('listening_correct')) : null
  const readingCorrect   = formData.get('reading_correct')   ? Number(formData.get('reading_correct'))   : null

  const listeningBand = listeningCorrect !== null
    ? calculateListeningBand(listeningCorrect)
    : formData.get('listening_band') ? Number(formData.get('listening_band')) : null
  const readingBand = readingCorrect !== null
    ? calculateReadingBand(readingCorrect, testType)
    : formData.get('reading_band') ? Number(formData.get('reading_band')) : null
  const writingBand  = formData.get('writing_band')  ? Number(formData.get('writing_band'))  : null
  const speakingBand = formData.get('speaking_band') ? Number(formData.get('speaking_band')) : null

  const availableBands = [listeningBand, readingBand, writingBand, speakingBand].filter((b): b is number => b !== null)
  if (availableBands.length === 0) return { error: 'Enter at least one band score' }

  let overallBand: number
  if (listeningBand !== null && readingBand !== null && writingBand !== null && speakingBand !== null) {
    overallBand = calculateOverallBand({ listening: listeningBand, reading: readingBand, writing: writingBand, speaking: speakingBand })
  } else {
    overallBand = Math.round((availableBands.reduce((a, b) => a + b, 0) / availableBands.length) * 2) / 2
  }

  const { error } = await supabase.from('test_results')
    .update({ test_date: testDate, test_type: testType, result_name: resultName, listening_correct: listeningCorrect, reading_correct: readingCorrect, listening_band: listeningBand, reading_band: readingBand, writing_band: writingBand, speaking_band: speakingBand, overall_band: overallBand, notes })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  // Regenerate notes insights in the background (fire-and-forget)
  generateNotesInsights().catch(console.error)

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/results')
  redirect('/dashboard/results')
}

// ── Delete a test result ──────────────────────────────────────────────────────
export async function deleteTestResult(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('test_results').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/results')
  return { error: null }
}
