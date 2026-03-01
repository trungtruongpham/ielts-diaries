import {
  LISTENING_BAND_TABLE,
  READING_ACADEMIC_BAND_TABLE,
  READING_GENERAL_BAND_TABLE,
} from './band-score-tables'
import type { TestType } from './types'

// Lookup correct answers against a band table
function lookupBand(
  correctAnswers: number,
  table: [number, number, number][]
): number {
  for (const [min, max, band] of table) {
    if (correctAnswers >= min && correctAnswers <= max) {
      return band
    }
  }
  return 0
}

/**
 * Calculate IELTS Listening band score from number of correct answers.
 * @param correctAnswers - Integer 0–40
 * @returns Band score (0–9, increments of 0.5)
 */
export function calculateListeningBand(correctAnswers: number): number {
  const clamped = Math.max(0, Math.min(40, Math.round(correctAnswers)))
  return lookupBand(clamped, LISTENING_BAND_TABLE)
}

/**
 * Calculate IELTS Reading band score from number of correct answers.
 * @param correctAnswers - Integer 0–40
 * @param testType - 'academic' or 'general'
 * @returns Band score (0–9, increments of 0.5)
 */
export function calculateReadingBand(
  correctAnswers: number,
  testType: TestType
): number {
  const clamped = Math.max(0, Math.min(40, Math.round(correctAnswers)))
  const table =
    testType === 'academic'
      ? READING_ACADEMIC_BAND_TABLE
      : READING_GENERAL_BAND_TABLE
  return lookupBand(clamped, table)
}
