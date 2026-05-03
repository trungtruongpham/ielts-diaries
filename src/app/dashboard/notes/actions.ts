'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUserNotesWithScores, getListeningQuestionTypeAccuracy, upsertInsight, getInsightsForUser } from '@/lib/db/notes-insights'
import { analyzeNotes, computeNotesHash } from '@/lib/ai/notes-analyzer'
import type { IeltsSkill } from '@/lib/db/types'

const SKILLS: IeltsSkill[] = ['listening', 'reading', 'writing', 'speaking']

/**
 * Generate (or skip if hash unchanged) notes insights for all 4 IELTS skills.
 * Fire-and-forget safe — all errors are caught and logged.
 */
export async function generateNotesInsights(): Promise<{ error: string | null }> {
  return _generateInsights({ forceRefresh: false })
}

/**
 * Regenerate notes insights unconditionally — always calls the LLM.
 * Called by the manual refresh button on the notes page.
 */
export async function refreshNotesInsights(): Promise<{ error: string | null }> {
  return _generateInsights({ forceRefresh: true })
}

// ── Internal ──────────────────────────────────────────────────────────────────

async function _generateInsights({ forceRefresh }: { forceRefresh: boolean }): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const [notes, accuracy] = await Promise.all([
      getUserNotesWithScores(),
      getListeningQuestionTypeAccuracy(user.id),
    ])

    const newHash = computeNotesHash(notes, accuracy)

    // Hash debounce — skip LLM if source data hasn't changed (unless force refresh)
    if (!forceRefresh) {
      const existingInsights = await getInsightsForUser()
      const allHashesMatch = SKILLS.every((skill) => {
        const existing = existingInsights.find((i) => i.skill === skill)
        return existing?.notes_hash === newHash
      })
      if (allHashesMatch && existingInsights.length === SKILLS.length) {
        return { error: null }
      }
    }

    const analysis = await analyzeNotes(notes, accuracy)

    await Promise.all(
      SKILLS.map((skill) =>
        upsertInsight(user.id, skill, {
          summary: analysis[skill].summary,
          weak_areas: analysis[skill].weak_areas,
          action_items: analysis[skill].action_items,
          notes_hash: newHash,
          notes_analyzed_count: notes.length,
        })
      )
    )

    revalidatePath('/dashboard/notes')
    return { error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[generateNotesInsights]', message)
    return { error: message }
  }
}
