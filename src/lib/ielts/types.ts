// IELTS Band Score Types

export type TestType = 'academic' | 'general'

export interface BandScoreResult {
  correctAnswers: number
  bandScore: number
}

export interface OverallBandInput {
  listening: number
  reading: number
  writing: number
  speaking: number
}
