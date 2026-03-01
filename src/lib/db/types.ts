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
