'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { chatCompletion, parseJsonResponse } from '@/lib/ai/openrouter'
import { buildVocabularyEnrichmentPrompt } from '@/lib/ai/prompts/vocabulary-enricher'
import { Rating } from 'ts-fsrs'
import { getNextCard, cardToDbShape, dbCardToFsrsCard, ratingMap } from '@/lib/vocabulary/fsrs-helpers'
import * as db from '@/lib/db/vocabulary'
import type { DbVocabularyWord, DbVocabularyCard } from '@/lib/db/types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface EnrichResult {
  phonetic: string
  part_of_speech: string
  definition: string
  example_sentence: string
  synonyms: string[]
}

interface AddWordInput {
  word: string
  phonetic?: string
  part_of_speech?: string
  definition: string
  example_sentence?: string
  synonyms: string[]
  skill_tags: string[]
  topic_tags: string[]
}

// ── Enrich word with AI ───────────────────────────────────────────────────────

export async function enrichWordAction(word: string): Promise<{
  data: EnrichResult | null
  error: string | null
}> {
  if (!word.trim()) return { data: null, error: 'Word is required' }

  try {
    const prompt = buildVocabularyEnrichmentPrompt(word.trim())
    const result = await chatCompletion(
      [{ role: 'user', content: prompt }],
      { temperature: 0.3, max_tokens: 512, json: true }
    )
    const data = parseJsonResponse<EnrichResult>(result.content)
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'AI enrichment failed' }
  }
}

// ── Add word + FSRS card ──────────────────────────────────────────────────────

export async function addWordAction(formData: AddWordInput): Promise<{
  wordId: string | null
  error: string | null
}> {
  if (!formData.word?.trim()) return { wordId: null, error: 'Word is required' }
  if (!formData.definition?.trim()) return { wordId: null, error: 'Definition is required' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { wordId: null, error: 'Not authenticated' }

  const result = await db.insertVocabularyWord(supabase, user.id, {
    word: formData.word.trim(),
    phonetic: formData.phonetic?.trim() || null,
    part_of_speech: formData.part_of_speech?.trim() || null,
    definition: formData.definition.trim(),
    example_sentence: formData.example_sentence?.trim() || null,
    synonyms: formData.synonyms,
    skill_tags: formData.skill_tags,
    topic_tags: formData.topic_tags,
  })

  if (result.error) return { wordId: null, error: result.error }

  revalidatePath('/dashboard/vocabulary')
  revalidatePath('/dashboard/vocabulary/list')
  redirect('/dashboard/vocabulary/list')
}

// ── Delete word (cascades to card) ───────────────────────────────────────────

export async function deleteWordAction(wordId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('vocabulary_words')
    .delete()
    .eq('id', wordId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/vocabulary/list')
  return { error: null }
}

// ── Submit review rating — core FSRS scheduling ───────────────────────────────

export async function submitReviewAction(
  cardId: string,
  _wordId: string,
  rating: 'Again' | 'Hard' | 'Good' | 'Easy'
): Promise<{ nextDue: string | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { nextDue: null, error: 'Not authenticated' }

  const { data: cardRow, error: fetchErr } = await supabase
    .from('vocabulary_cards')
    .select('*')
    .eq('id', cardId)
    .single()

  if (fetchErr || !cardRow) return { nextDue: null, error: 'Card not found' }

  const fsrsCard = dbCardToFsrsCard(cardRow as DbVocabularyCard)
  const fsrsRating: Rating = ratingMap[rating] ?? Rating.Good
  const nextCard = getNextCard(fsrsCard, fsrsRating)
  const dbShape = cardToDbShape(nextCard)

  const { error: updateErr } = await db.updateVocabularyCard(supabase, cardId, dbShape)
  if (updateErr) return { nextDue: null, error: updateErr }

  revalidatePath('/dashboard/vocabulary')
  return { nextDue: dbShape.due, error: null }
}

// ── Get review queue ──────────────────────────────────────────────────────────

export async function getReviewQueueAction(): Promise<{
  data: Array<{ card: DbVocabularyCard; word: DbVocabularyWord }> | null
  error: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const settings = await db.getVocabularySettings(supabase)
  const dailyLimit = settings?.daily_new_word_limit ?? 10

  // Fetch all due cards
  const allDue = await db.getDueCards(supabase, 100)

  // Limit 'New' state cards to daily_new_word_limit
  let newCount = 0
  const queue = allDue.filter(({ card }) => {
    if (card.state === 'New') {
      if (newCount >= dailyLimit) return false
      newCount++
    }
    return true
  })

  return { data: queue, error: null }
}

// ── Generate MCQ distractors ──────────────────────────────────────────────────

export async function generateMcqDistractorsAction(
  wordId: string,
  correctWord: string
): Promise<{ data: string[] | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  // Try to find 3 other words from user's own vocabulary as distractors
  const { data: otherWords } = await supabase
    .from('vocabulary_words')
    .select('word')
    .neq('id', wordId)
    .limit(50)

  const pool: string[] = (otherWords ?? [])
    .map((r: { word: string }) => r.word)
    .filter((w: string) => w !== correctWord)

  // Shuffle and pick up to 3
  const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 3)

  if (shuffled.length === 3) {
    const options = [correctWord, ...shuffled].sort(() => Math.random() - 0.5)
    return { data: options, error: null }
  }

  // Fall back to AI generation for remaining distractors needed
  try {
    const needed = 3 - shuffled.length
    const prompt = `Give me exactly ${needed} English words that could be confused with "${correctWord}" in an IELTS context. They should be plausible distractors (similar topic/register, but different meaning). Return ONLY a JSON array of strings, no markdown.`
    const result = await chatCompletion(
      [{ role: 'user', content: prompt }],
      { temperature: 0.5, max_tokens: 100, json: true }
    )
    const aiWords = parseJsonResponse<string[]>(result.content)
    const distractors = [...shuffled, ...aiWords.slice(0, needed)]
    const options = [correctWord, ...distractors].sort(() => Math.random() - 0.5)
    return { data: options, error: null }
  } catch {
    // Last resort: use whatever we have + correct answer
    const options = [correctWord, ...shuffled].sort(() => Math.random() - 0.5)
    return { data: options, error: null }
  }
}

// ── Update vocabulary settings ────────────────────────────────────────────────

export async function updateVocabularySettingsAction(
  dailyLimit: number
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  return db.upsertVocabularySettings(supabase, user.id, dailyLimit)
}
