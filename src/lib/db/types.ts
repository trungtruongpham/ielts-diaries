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

// ── Vocabulary Spaced Repetition types ───────────────────────────────────────

export interface DbVocabularyWord {
  id: string
  user_id: string
  word: string
  phonetic: string | null
  part_of_speech: string | null
  definition: string
  example_sentence: string | null
  synonyms: string[]
  skill_tags: string[]
  topic_tags: string[]
  created_at: string
}

export interface DbVocabularyCard {
  id: string
  user_id: string
  word_id: string
  due: string
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  reps: number
  lapses: number
  state: 'New' | 'Learning' | 'Review' | 'Relearning'
  last_review: string | null
}

export interface DbVocabularySettings {
  user_id: string
  daily_new_word_limit: number
}

export type InsertVocabularyWord = Omit<DbVocabularyWord, 'id' | 'created_at' | 'user_id'>
export type InsertVocabularyCard = Omit<DbVocabularyCard, 'id' | 'user_id'>

// ── Listening Practice types ──────────────────────────────────────────────────

export type ListeningMode = 'strict' | 'practice'

export type ListeningQuestionType =
  | 'multiple_choice'
  | 'multiple_select'
  | 'fill_blank'
  | 'matching'
  | 'map_label'
  | 'table_fill'

// ── question_data shapes (discriminated union by question_type) ──

export interface MultipleChoiceData {
  type: 'multiple_choice'
  stem: string
  options: { key: string; text: string }[]
}

export interface MultipleSelectData {
  type: 'multiple_select'
  stem: string
  options: { key: string; text: string }[]
  select_count: number
}

export interface FillBlankData {
  type: 'fill_blank'
  stem: string
  word_limit: number
  context?: string
}

export interface MatchingData {
  type: 'matching'
  items: string[]
  options: { key: string; text: string }[]
}

export interface MapLabelData {
  type: 'map_label'
  image_path: string
  labels: { id: string; x: number; y: number; options: string[] }[]
}

export interface TableFillData {
  type: 'table_fill'
  table_context: string
  stem: string
  word_limit: number
}

export type ListeningQuestionData =
  | MultipleChoiceData
  | MultipleSelectData
  | FillBlankData
  | MatchingData
  | MapLabelData
  | TableFillData

// ── answer_key shapes ──

export interface MultipleChoiceKey  { answer: string }
export interface MultipleSelectKey  { answers: string[] }
export interface FillBlankKey       { acceptable: string[] }
export interface MatchingKey        { matches: Record<number, string> }
export interface MapLabelKey        { answers: Record<string, string> }
export interface TableFillKey       { acceptable: string[] }

export type ListeningAnswerKey =
  | MultipleChoiceKey
  | MultipleSelectKey
  | FillBlankKey
  | MatchingKey
  | MapLabelKey
  | TableFillKey

// ── DB row interfaces ──

export interface DbListeningTest {
  id: string
  cam_book: 17 | 18 | 19 | 20
  test_number: 1 | 2 | 3 | 4
  title: string
  test_type: 'academic' | 'general'
  is_published: boolean
  created_at: string
}

export interface DbListeningSection {
  id: string
  test_id: string
  section_number: 1 | 2 | 3 | 4
  audio_storage_path: string | null
  duration_seconds: number | null
  instructions: string | null
  question_range_start: number
  question_range_end: number
  created_at: string
}

export interface DbListeningQuestion {
  id: string
  section_id: string
  question_number: number
  question_type: ListeningQuestionType
  group_id: string | null
  group_context: { instructions: string; image_path?: string } | null
  question_data: ListeningQuestionData
  // answer_key intentionally omitted — fetched server-side only
  created_at: string
}

export interface DbListeningQuestionWithKey extends DbListeningQuestion {
  answer_key: ListeningAnswerKey
}

export interface DbListeningAttempt {
  id: string
  user_id: string
  test_id: string
  mode: ListeningMode
  answers: Record<number, string | string[]>
  correct_count: number | null
  score: number | null
  band: number | null
  started_at: string
  completed_at: string | null
  time_taken_seconds: number | null
}

export type InsertListeningAttempt = Pick<DbListeningAttempt, 'test_id' | 'mode'>
export type CompleteListeningAttempt = Pick<
  DbListeningAttempt,
  'answers' | 'correct_count' | 'score' | 'band' | 'completed_at' | 'time_taken_seconds'
>

// ── Notes Insights types ──────────────────────────────────────────────────────

export type IeltsSkill = 'listening' | 'reading' | 'writing' | 'speaking'

export interface DbSkillNoteInsight {
  id: string
  user_id: string
  skill: IeltsSkill
  summary: string
  weak_areas: string[]
  action_items: string[]
  generated_at: string
  notes_hash: string
  notes_analyzed_count: number
}

