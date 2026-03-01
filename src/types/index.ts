// Shared TypeScript types for IELTS Diaries

export type TestType = 'academic' | 'general'

export type ModuleType = 'listening' | 'reading' | 'writing' | 'speaking'

export interface TestResult {
  id: string
  user_id: string
  test_date: string
  test_type: TestType
  listening_correct: number | null
  listening_band: number | null
  reading_correct: number | null
  reading_band: number | null
  writing_band: number | null
  speaking_band: number | null
  overall_band: number
  notes: string | null
  created_at: string
}

export interface UserGoal {
  id: string
  user_id: string
  target_listening: number
  target_reading: number
  target_writing: number
  target_speaking: number
  target_overall: number
  target_date: string | null
  created_at: string
  updated_at: string
}

export type InsertTestResult = Omit<TestResult, 'id' | 'created_at' | 'user_id'>
export type UpsertUserGoal = Omit<UserGoal, 'id' | 'created_at' | 'updated_at' | 'user_id'>

// Band score color utility
export function getBandColor(band: number): string {
  if (band >= 7.0) return 'text-green-500'
  if (band >= 5.5) return 'text-amber-500'
  return 'text-red-500'
}

export function getBandBgColor(band: number): string {
  if (band >= 7.0) return 'bg-green-50 border-green-200'
  if (band >= 5.5) return 'bg-amber-50 border-amber-200'
  return 'bg-red-50 border-red-200'
}

export function getBandLabel(band: number): string {
  if (band >= 8.5) return 'Expert'
  if (band >= 7.5) return 'Very Good'
  if (band >= 6.5) return 'Competent'
  if (band >= 5.5) return 'Modest'
  if (band >= 4.5) return 'Limited'
  return 'Beginner'
}
