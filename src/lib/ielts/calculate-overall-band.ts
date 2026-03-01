import type { OverallBandInput } from './types'

/**
 * Calculate IELTS Overall Band Score from 4 module scores.
 * Algorithm: average of all 4 bands, rounded to nearest 0.5.
 *
 * Rounding rules (official IELTS):
 *  - Decimal < 0.25  → round down to nearest whole
 *  - Decimal 0.25–0.74 → round to .5
 *  - Decimal >= 0.75 → round up to nearest whole
 *
 * @param scores - Object with listening, reading, writing, speaking band scores
 * @returns Overall band score
 */
export function calculateOverallBand(scores: OverallBandInput): number {
  const { listening, reading, writing, speaking } = scores
  const average = (listening + reading + writing + speaking) / 4
  // Round to nearest 0.5 using Math.round(x * 2) / 2
  return Math.round(average * 2) / 2
}

/**
 * Calculate overall band when only some modules are provided.
 * Useful for partial calculations.
 */
export function calculatePartialOverall(
  scores: Partial<OverallBandInput>
): number | null {
  const values = Object.values(scores).filter(
    (v): v is number => v !== undefined && v !== null
  )
  if (values.length === 0) return null
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  return Math.round(avg * 2) / 2
}

/**
 * Get band descriptor label for display
 */
export function getBandDescriptor(band: number): string {
  if (band >= 8.5) return 'Expert'
  if (band >= 7.5) return 'Very Good'
  if (band >= 6.5) return 'Competent'
  if (band >= 5.5) return 'Modest'
  if (band >= 4.5) return 'Limited'
  if (band >= 3.5) return 'Extremely Limited'
  if (band >= 1.0) return 'Intermittent'
  return 'Did Not Attempt'
}

/**
 * Get Tailwind color class based on band score
 */
export function getBandColorClass(band: number): {
  text: string
  bg: string
  border: string
} {
  if (band >= 7.0) {
    return { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' }
  }
  if (band >= 5.5) {
    return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' }
  }
  return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' }
}
