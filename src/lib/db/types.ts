// Database TypeScript types — mirrors the Supabase schema
// These are kept separate from src/types/index.ts for clarity

export interface DbTestResult {
  id: string
  user_id: string
  test_date: string           // ISO date string 'YYYY-MM-DD'
  test_type: 'academic' | 'general'
  listening_correct: number | null
  reading_correct: number | null
  listening_band: number | null
  reading_band: number | null
  writing_band: number | null
  speaking_band: number | null
  overall_band: number
  result_name: string | null  // e.g. "CAM 18 Test 2"
  notes: string | null
  created_at: string          // ISO timestamp
}

export interface DbUserGoal {
  id: string
  user_id: string
  target_listening: number
  target_reading: number
  target_writing: number
  target_speaking: number
  target_overall: number
  target_date: string | null  // ISO date string or null
  created_at: string
  updated_at: string
}

// Insert/update shapes (omit server-generated fields)
export type InsertTestResult = Omit<DbTestResult, 'id' | 'created_at' | 'user_id'>
export type UpsertUserGoal = Omit<DbUserGoal, 'id' | 'created_at' | 'updated_at' | 'user_id'>

// ── Speaking Practice types ───────────────────────────────────────────────────

/** Detailed per-criteria AI feedback stored in speaking_answers.feedback (JSONB) */
export interface SpeakingFeedback {
  fluency_coherence: number
  lexical_resource: number
  grammatical_range: number
  pronunciation: number
  feedback: string
  strengths: string[]
  improvements: string[]
}

export interface DbSpeakingSession {
  id: string
  user_id: string
  status: 'in_progress' | 'completed' | 'abandoned'
  fluency_band: number | null
  lexical_band: number | null
  grammar_band: number | null
  pronunciation_band: number | null
  overall_band: number | null
  topic: string | null
  created_at: string
  completed_at: string | null
}

export interface DbSpeakingAnswer {
  id: string
  session_id: string
  part: 1 | 2 | 3
  question_index: number
  question_text: string
  transcript: string | null
  audio_url: string | null
  duration_seconds: number | null
  band_score: number | null
  feedback: SpeakingFeedback | null
  created_at: string
}

export type InsertSpeakingSession = Pick<DbSpeakingSession, 'topic'>
export type CompleteSpeakingSession = Required<
  Pick<DbSpeakingSession, 'fluency_band' | 'lexical_band' | 'grammar_band' | 'pronunciation_band' | 'overall_band'>
>
export type InsertSpeakingAnswer = Omit<DbSpeakingAnswer, 'id' | 'created_at'>

