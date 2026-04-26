// Vocabulary DB query helpers — all queries are RLS-scoped via Supabase policies
import { createEmptyCard } from 'ts-fsrs'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { DbVocabularyWord, DbVocabularyCard, DbVocabularySettings, InsertVocabularyWord } from './types'

type Supabase = SupabaseClient

/** Convert FSRS numeric state to text label for DB storage */
function stateToText(state: number): string {
  const map: Record<number, string> = { 0: 'New', 1: 'Learning', 2: 'Review', 3: 'Relearning' }
  return map[state] ?? 'New'
}

/** All vocabulary words for the authenticated user (RLS scoped) */
export async function getVocabularyWords(supabase: Supabase): Promise<DbVocabularyWord[]> {
  const { data, error } = await supabase
    .from('vocabulary_words')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as DbVocabularyWord[]
}

/** Single word by id */
export async function getVocabularyWord(
  supabase: Supabase,
  wordId: string
): Promise<{ word: DbVocabularyWord; card: DbVocabularyCard } | null> {
  const { data: word, error: wordErr } = await supabase
    .from('vocabulary_words')
    .select('*')
    .eq('id', wordId)
    .single()
  if (wordErr || !word) return null

  const { data: card } = await supabase
    .from('vocabulary_cards')
    .select('*')
    .eq('word_id', wordId)
    .single()

  return { word: word as DbVocabularyWord, card: card as DbVocabularyCard }
}

/** Insert a new word and create its initial empty FSRS card */
export async function insertVocabularyWord(
  supabase: Supabase,
  userId: string,
  data: InsertVocabularyWord
): Promise<{ wordId: string | null; error: string | null }> {
  const { data: inserted, error: wordErr } = await supabase
    .from('vocabulary_words')
    .insert({ ...data, user_id: userId })
    .select('id')
    .single()

  if (wordErr || !inserted) return { wordId: null, error: wordErr?.message ?? 'Failed to insert word' }

  const emptyCard = createEmptyCard()
  const { error: cardErr } = await supabase.from('vocabulary_cards').insert({
    user_id: userId,
    word_id: inserted.id,
    due: emptyCard.due.toISOString(),
    stability: emptyCard.stability,
    difficulty: emptyCard.difficulty,
    elapsed_days: emptyCard.elapsed_days,
    scheduled_days: emptyCard.scheduled_days,
    reps: emptyCard.reps,
    lapses: emptyCard.lapses,
    state: stateToText(emptyCard.state as number),
    last_review: null,
  })

  if (cardErr) return { wordId: null, error: cardErr.message }
  return { wordId: inserted.id, error: null }
}

/** Update FSRS card fields after a review rating */
export async function updateVocabularyCard(
  supabase: Supabase,
  cardId: string,
  fsrsData: {
    due: string
    stability: number
    difficulty: number
    elapsed_days: number
    scheduled_days: number
    reps: number
    lapses: number
    state: string
    last_review: string | null
  }
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('vocabulary_cards')
    .update(fsrsData)
    .eq('id', cardId)
  return { error: error?.message ?? null }
}

/** Count due cards (due <= now()) */
export async function getDueCount(supabase: Supabase): Promise<number> {
  const { count, error } = await supabase
    .from('vocabulary_cards')
    .select('id', { count: 'exact', head: true })
    .lte('due', new Date().toISOString())
  if (error) return 0
  return count ?? 0
}

/** Fetch due cards joined with their words, sorted oldest-due first */
export async function getDueCards(
  supabase: Supabase,
  limit = 20
): Promise<Array<{ card: DbVocabularyCard; word: DbVocabularyWord }>> {
  const { data, error } = await supabase
    .from('vocabulary_cards')
    .select('*, vocabulary_words(*)')
    .lte('due', new Date().toISOString())
    .order('due', { ascending: true })
    .limit(limit)

  if (error || !data) return []

  return data.map((row) => ({
    card: {
      id: row.id,
      user_id: row.user_id,
      word_id: row.word_id,
      due: row.due,
      stability: row.stability,
      difficulty: row.difficulty,
      elapsed_days: row.elapsed_days,
      scheduled_days: row.scheduled_days,
      reps: row.reps,
      lapses: row.lapses,
      state: row.state,
      last_review: row.last_review,
    } as DbVocabularyCard,
    word: row.vocabulary_words as DbVocabularyWord,
  }))
}

/** All words with their cards joined — for the word list page */
export async function getWordsWithCards(
  supabase: Supabase
): Promise<Array<{ word: DbVocabularyWord; card: DbVocabularyCard | null }>> {
  const { data, error } = await supabase
    .from('vocabulary_words')
    .select('*, vocabulary_cards(*)')
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map((row) => ({
    word: {
      id: row.id,
      user_id: row.user_id,
      word: row.word,
      phonetic: row.phonetic,
      part_of_speech: row.part_of_speech,
      definition: row.definition,
      example_sentence: row.example_sentence,
      synonyms: row.synonyms,
      skill_tags: row.skill_tags,
      topic_tags: row.topic_tags,
      created_at: row.created_at,
    } as DbVocabularyWord,
    card: row.vocabulary_cards?.[0] as DbVocabularyCard | null ?? null,
  }))
}

/** Distinct topic tags across user's words (for autocomplete) */
export async function getUserTopicTags(supabase: Supabase): Promise<string[]> {
  const { data, error } = await supabase
    .from('vocabulary_words')
    .select('topic_tags')
  if (error || !data) return []
  const all = data.flatMap((row) => (row.topic_tags ?? []) as string[])
  return [...new Set(all)].sort()
}

/** Get daily limit setting for the current user */
export async function getVocabularySettings(supabase: Supabase): Promise<DbVocabularySettings | null> {
  const { data, error } = await supabase
    .from('user_vocabulary_settings')
    .select('*')
    .single()
  if (error || !data) return null
  return data as DbVocabularySettings
}

/** Upsert daily limit setting */
export async function upsertVocabularySettings(
  supabase: Supabase,
  userId: string,
  limit: number
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('user_vocabulary_settings')
    .upsert({ user_id: userId, daily_new_word_limit: limit }, { onConflict: 'user_id' })
  return { error: error?.message ?? null }
}
