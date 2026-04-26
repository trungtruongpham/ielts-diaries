// FSRS scheduling helpers — wraps ts-fsrs for vocabulary spaced repetition
import { FSRS, createEmptyCard, Rating, State, type Card } from 'ts-fsrs'
import type { DbVocabularyCard } from '@/lib/db/types'

export { createEmptyCard, Rating, State }

export const fsrs = new FSRS({})

/** Map text rating labels to FSRS Rating enum values */
export const ratingMap: Record<string, Rating> = {
  Again: Rating.Again,
  Hard: Rating.Hard,
  Good: Rating.Good,
  Easy: Rating.Easy,
}

/** Map numeric FSRS State to text label stored in DB */
export const stateTextMap: Record<number, string> = {
  [State.New]: 'New',
  [State.Learning]: 'Learning',
  [State.Review]: 'Review',
  [State.Relearning]: 'Relearning',
}

/** Map text state from DB back to FSRS State enum */
export const stateFromText: Record<string, State> = {
  New: State.New,
  Learning: State.Learning,
  Review: State.Review,
  Relearning: State.Relearning,
}

/** Apply a rating to a card and return the next scheduled card */
export function getNextCard(card: Card, rating: Rating): Card {
  const now = new Date()
  // fsrs.repeat returns an IPreview object indexed by numeric rating — use unknown cast
  const scheduling = fsrs.repeat(card, now) as unknown as Record<number, { card: Card }>
  return scheduling[rating as number].card
}

/** Convert an FSRS Card to the flat shape stored in vocabulary_cards */
export function cardToDbShape(card: Card) {
  return {
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: stateTextMap[card.state as number] ?? 'New',
    last_review: card.last_review ? new Date(card.last_review).toISOString() : null,
  }
}

/** Convert a DB card row back to an FSRS Card object */
export function dbCardToFsrsCard(card: DbVocabularyCard): Card {
  return {
    due: new Date(card.due),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    // ts-fsrs v5 stores learning_steps internally — default to 0
    learning_steps: 0,
    state: stateFromText[card.state] ?? State.New,
    last_review: card.last_review ? new Date(card.last_review) : undefined,
  } as Card
}
