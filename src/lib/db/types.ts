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

/** Which part(s) the user chose to practice */
export type PracticeMode = 'part1' | 'part2' | 'part3' | 'full'

/** Detailed per-criteria AI feedback stored in speaking_answers.feedback (JSONB) */
export interface SpeakingFeedback {
  fluency_coherence: number
  lexical_resource: number
  grammatical_range: number
  pronunciation: number
  feedback: string
  strengths: string[]
  improvements: string[]
  sample_answer?: string   // optional — absent in old rows pre-feature
}

export interface DbSpeakingSession {
  id: string
  user_id: string
  status: 'in_progress' | 'completed' | 'abandoned'
  practice_mode: PracticeMode     // which part(s) were practised
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

export type InsertSpeakingSession = Pick<DbSpeakingSession, 'topic' | 'practice_mode'>
export type CompleteSpeakingSession = Required<
  Pick<DbSpeakingSession, 'fluency_band' | 'lexical_band' | 'grammar_band' | 'pronunciation_band' | 'overall_band'>
>
export type InsertSpeakingAnswer = Omit<DbSpeakingAnswer, 'id' | 'created_at'>

// ── Writing Practice types ────────────────────────────────────────────────────

export type WritingTaskType = 'task1_academic' | 'task1_gt' | 'task2' | 'full'

/** Detailed per-criteria AI feedback stored in writing_answers.feedback (JSONB) */
export interface WritingFeedback {
  // Task 1 criterion (absent for Task 2)
  task_achievement?: number
  // Task 2 criterion (absent for Task 1)
  task_response?: number
  // Shared criteria
  coherence_cohesion: number
  lexical_resource: number
  grammatical_range: number
  // Overall for this task
  overall: number
  feedback: string              // 2–3 sentence overall comment
  strengths: string[]           // 1–2 items
  improvements: string[]        // 1–2 items
  model_answer: string          // Band 7–8 sample essay
  band_breakdown: {
    criterion: string
    score: number
    explanation: string
  }[]
}

export interface DbWritingSession {
  id: string
  user_id: string
  status: 'in_progress' | 'completed' | 'abandoned'
  task_type: WritingTaskType
  test_type: 'academic' | 'general'
  task1_band: number | null
  task2_band: number | null
  overall_band: number | null
  created_at: string
  completed_at: string | null
}

// ── Chart data types (Task 1 Academic visual) ────────────────────────────────

export interface BarSeries {
  name: string
  values: number[]
  color?: string
}
export interface BarChartData {
  type: 'bar'
  title: string
  unit: string
  xLabels: string[]        // e.g. years or categories
  series: BarSeries[]      // 1–4 series
  source?: string
}

export interface LineSeries {
  name: string
  values: (number | null)[] // null = missing data point
  color?: string
}
export interface LineChartData {
  type: 'line'
  title: string
  unit: string
  xLabels: string[]
  series: LineSeries[]
  source?: string
}

export interface PieSegment {
  label: string
  value: number            // percentage 0–100
  color?: string
}
export interface PieChartData {
  type: 'pie'
  title: string
  segments: PieSegment[]
  source?: string
}

export interface TableChartData {
  type: 'table'
  title: string
  headers: string[]
  rows: (string | number)[][]
  source?: string
}

export interface ProcessChartData {
  type: 'process'
  title: string
  steps: { label: string; description: string }[]
}

export type ChartData =
  | BarChartData
  | LineChartData
  | PieChartData
  | TableChartData
  | ProcessChartData

export interface DbWritingAnswer {
  id: string
  session_id: string
  task: 1 | 2
  prompt_text: string
  prompt_type: string
  user_answer: string
  word_count: number
  time_taken_seconds: number | null
  band_score: number | null
  feedback: WritingFeedback | null
  chart_data: ChartData | null
  created_at: string
}

export type InsertWritingSession = Pick<DbWritingSession, 'task_type' | 'test_type'>
export type CompleteWritingSession = {
  task1_band: number | null
  task2_band: number | null
  overall_band: number
}
export type InsertWritingAnswer = Omit<DbWritingAnswer, 'id' | 'created_at'>

