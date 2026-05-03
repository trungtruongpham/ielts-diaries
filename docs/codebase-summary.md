# IELTS Diaries — Codebase Summary

**Tech Stack:** Next.js 15 (App Router) | React | TypeScript | Supabase (Auth + PostgreSQL) | Tailwind CSS | shadcn/ui | Recharts | OpenRouter AI

**Status:** MVP + Active Features (as of 2026-05-03)

---

## Project Overview

IELTS Diaries is a comprehensive IELTS practice and score-tracking platform. Core features include a public score calculator, authenticated dashboard with test history, goal tracking, vocabulary spaced-repetition learning, and a full listening practice module with Cambridge IELTS tests.

---

## Core Architecture

### Directory Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── (auth)/                   # Auth flow pages (sign-in, sign-up)
│   ├── calculator/               # Public score calculator
│   ├── dashboard/                # Protected user dashboard
│   │   ├── notes/                # My Notes page (AI insights)
│   │   └── [other dashboard routes]/
│   ├── listening/                # Listening practice module
│   └── layout.tsx                # Root layout with navigation
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── layout/                   # Nav, footer, layout components
│   ├── dashboard/                # Dashboard-specific components
│   ├── listening/                # Listening practice UI components
│   ├── vocabulary/               # Vocabulary module components
│   └── notes/                    # My Notes page components
├── hooks/                        # Custom React hooks
│   ├── use-listening-session.ts  # Listening session state management
│   └── use-vocabulary-session.ts # Vocabulary FSRS scheduling
├── lib/
│   ├── db/                       # Supabase database layer
│   │   ├── types.ts              # Database row interfaces & types
│   │   ├── listening-tests.ts    # Listening test queries
│   │   ├── listening-attempts.ts # Listening attempt CRUD
│   │   ├── vocabulary-words.ts   # Vocabulary word queries
│   │   ├── scores.ts             # User score history queries
│   │   └── notes-insights.ts     # Notes insights queries & helpers
│   ├── ai/
│   │   ├── notes-analyzer.ts     # LLM-based notes analysis (OpenRouter)
│   │   └── [other AI integrations]/
│   ├── supabase/                 # Supabase client setup
│   ├── listening/                # Listening module utilities
│   │   ├── scoring.ts            # IELTS band conversion logic
│   │   └── actions.ts            # Server actions for test submission
│   └── vocabulary/               # Vocabulary module utilities
│       ├── fsrs.ts               # FSRS scheduling helpers
│       └── ai-enrichment.ts      # OpenRouter AI integration
└── types/                        # Shared TypeScript types

supabase/
├── migrations/                   # Database migrations
│   ├── 001_initial_schema.sql
│   ├── 002_auth_profiles.sql
│   ├── 003_scores_and_goals.sql
│   ├── 004_vocabulary_tables.sql
│   ├── 005_fsrs_scheduling.sql
│   ├── 008_listening_practice.sql
│   └── 009_skill_notes_insights.sql
└── seeds/
    ├── listening-cam17-20/       # Listening practice seed data
    │   ├── index.ts              # Seed runner
    │   ├── cam17-test1.ts        # Per-test seed files (16 total)
    │   └── ... (one per test CAM 17–20)
    └── initial-data/             # Initial seed data

docs/
├── design-guidelines.md          # UI/UX design system
├── codebase-summary.md           # This file
└── logo.png                      # Brand logo

plans/
├── 260301-1146-ielts-diaries-mvp/   # MVP implementation plan
├── 260329-vocabulary-spaced-repetition/
├── 260501-listening-practice/       # Listening practice plan
└── 260503-notes-page/               # Notes page (AI insights) plan
```

---

## Features

### 1. Public Score Calculator

**Route:** `/calculator`

Calculate IELTS band scores from Reading, Writing, Listening, and Speaking subscores. No authentication required. Pure client-side computation.

**Files:**
- `src/app/calculator/page.tsx`
- `src/components/calculator/`
- `src/lib/scoring/` — IELTS band conversion logic

**Key Functions:**
```typescript
calculateBand(subscores: Subscores): BandResult
```

---

### 2. Authentication & User Profiles

**Routes:** `/auth/sign-in`, `/auth/sign-up`

Supabase Auth (email/password + OAuth providers). Protected pages redirect to sign-in.

**Database Table:** `auth.users` (Supabase managed)

**Middleware:** Route protection via Supabase session verification

**Files:**
- `src/app/(auth)/`
- `src/lib/supabase/` — Supabase client setup

---

### 3. Dashboard & Test History

**Route:** `/dashboard`

Authenticated users view past IELTS test results, goal progress, and quick-access to all practice modules.

**Database Tables:**
- `test_results` — Historical test submissions (score, date, mode)
- `user_goals` — User-defined target bands

**Components:**
- `src/components/dashboard/test-history.tsx` — Results table with filters
- `src/components/dashboard/goal-tracker.tsx` — Goal progress visualization
- `src/components/dashboard/quick-access.tsx` — Links to practice modules

**Files:**
- `src/app/dashboard/page.tsx`
- `src/lib/db/scores.ts` — Query helpers

---

### 4. Goal Tracking

**Route:** `/dashboard/goals`

Users set target IELTS bands and track progress toward those goals. Goals are visualized on the dashboard with Recharts.

**Database Table:** `user_goals`
- `user_id` (FK → auth.users)
- `target_band` (0–9)
- `created_at`, `updated_at`
- `is_active` (boolean)

**Components:**
- `src/components/dashboard/goal-tracker.tsx` — Goal display + edit modal
- `src/components/ui/chart-components.tsx` — Recharts wrappers

---

### 5. Listening Practice

**Routes:**
- `/listening` — Test lobby (select test, choose mode)
- `/listening/[testId]` — Test player (split-panel UI)
- `/listening/results/[attemptId]` — Results + answer review

Full-featured IELTS Listening practice using Cambridge tests (CAM 17–20). Includes:
- **Two modes:** Strict (timed, no replay) and Practice (unlimited replay)
- **Audio playback:** Custom player with progress bar, replay toggle
- **Question types:** Multiple choice, multiple select, fill-in-blank, matching, map labeling, table completion
- **Auto-scoring:** Server-side scoring with IELTS band conversion
- **Answer review:** Full explanation + user vs. correct answers

#### Database Tables

**`listening_tests`**
- `id`, `cam_book` (17–20), `test_number` (1–4), `title`, `test_type`, `is_published`, `created_at`
- Unique: `(cam_book, test_number)`

**`listening_sections`**
- `id`, `test_id` (FK), `section_number` (1–4), `audio_storage_path`, `duration_seconds`, `instructions`, `question_range_start/end`, `created_at`
- Unique: `(test_id, section_number)`

**`listening_questions`**
- `id`, `section_id` (FK), `question_number`, `question_type` (enum), `group_id`, `group_context` (JSONB), `question_data` (JSONB), `answer_key` (JSONB), `created_at`
- Unique: `(section_id, question_number)`

**`listening_attempts`**
- `id`, `user_id` (FK → auth.users), `test_id` (FK), `mode` (strict|practice), `answers` (JSONB), `correct_count`, `score` (0–40), `band` (0–9), `started_at`, `completed_at`, `time_taken_seconds`

#### Storage

**Bucket:** `listening-audio` (public, CDN-backed)
- Path convention: `cam{17-20}/test{1-4}/section{1-4}.mp3`
- Max file size: 200 MB per file

#### Question Type JSONB Schemas

All question types store metadata in `question_data` (JSONB):

```typescript
// Multiple choice (single answer)
{ type: 'multiple_choice', stem: string, options: [{key, text}][] }

// Multiple select (multiple answers)
{ type: 'multiple_select', stem: string, options: [{key, text}][], select_count: number }

// Fill in blank / sentence / note completion
{ type: 'fill_blank', stem: string, word_limit: number, context?: string }

// Matching
{ type: 'matching', items: string[], options: [{key, text}][] }

// Map/diagram labeling
{ type: 'map_label', image_path: string, labels: [{id, x, y, options}][] }

// Table completion
{ type: 'table_fill', table_context: string, stem: string, word_limit: number }
```

`answer_key` (JSONB) contains correct answers (server-side only, never sent to client):

```typescript
// Multiple choice: { answer: 'A'|'B'|'C'|'D' }
// Multiple select: { answers: ['A', 'B'] }
// Fill blank: { acceptable: ['answer1', 'answer2'] }  (case-insensitive)
// Matching: { matches: {1: 'A', 2: 'B', ...} }
// Map label: { answers: {labelId: 'A', ...} }
```

#### Scoring Logic

IELTS Listening band conversion (official):
```
39-40 → 9.0  |  37-38 → 8.5  |  35-36 → 8.0  |  32-34 → 7.5
30-31 → 7.0  |  26-29 → 6.5  |  23-25 → 6.0  |  18-22 → 5.5
16-17 → 5.0  |  13-15 → 4.5  |  10-12 → 4.0  |  8-9  → 3.5
6-7  → 3.0   |  4-5  → 2.5
```

String answers: case-insensitive, strip whitespace, match any in `acceptable[]` array.

#### Key Components

**`src/components/listening/`**
- `listening-lobby.tsx` — Test grid with CAM book filter tabs
- `listening-test-layout.tsx` — Split-panel container (audio player + questions)
- `listening-audio-player.tsx` — Custom player (progress, replay toggle, duration)
- `listening-section-nav.tsx` — Part tabs + Submit button
- `listening-question-group.tsx` — Question renderer (dispatches by type)
- `listening-results.tsx` — Score display + answer review table
- `listening-history-list.tsx` — Past attempts list
- `question-types/` — Individual question renderers (MCQ, fill-blank, matching, map-label, etc.)

#### Session Management

**`src/hooks/use-listening-session.ts`**

Custom hook managing test state via `useReducer`:
- Tracks current section, user answers, submission status
- Handles answer updates (store locally, no DB writes until submit)
- Server action for final submission (scoring + persistence)

#### Server Actions

**`src/lib/listening/actions.ts`**
- `submitListeningTest(attemptId, answers)` — Validate answers, score, save results

#### Files

- `src/app/listening/page.tsx` — Lobby
- `src/app/listening/[testId]/page.tsx` — Player
- `src/app/listening/results/[attemptId]/page.tsx` — Results
- `src/lib/db/listening-tests.ts` — DB queries
- `src/lib/db/listening-attempts.ts` — Attempt CRUD
- `src/lib/listening/scoring.ts` — Band conversion
- `supabase/migrations/008_listening_practice.sql` — Schema
- `supabase/seeds/listening-cam17-20/` — Seed data (16 tests)

---

### 6. IELTS Notes Page — AI-Powered Learning Insights

**Route:** `/dashboard/notes`

Centralized hub for viewing AI-generated insights from historical test notes. The system analyzes all notes across listening, reading, writing, and speaking to provide actionable feedback on weak areas and improvement strategies.

#### Features

- **Multi-skill Analysis:** LLM analyzes test notes to extract per-skill summaries, weak areas, and action items
- **Hash-based Debounce:** Avoids redundant LLM calls by comparing MD5 hash of notes + listening accuracy
- **Question-Type Analytics:** Breakdown of listening accuracy by question type (e.g., map labeling, fill-in-blank)
- **Tabbed UI:** View insights by skill (Listening, Reading, Writing, Speaking)
- **Manual Refresh:** Button to force regeneration even if data hasn't changed
- **Fire-and-Forget Integration:** Notes insights auto-generate after listening test submission (non-blocking)

#### Database Table

**`skill_notes_insights`**
- `id`, `user_id` (FK → auth.users), `skill` (listening|reading|writing|speaking)
- `summary` — Concise AI-generated summary of patterns/issues
- `weak_areas` — Array of short descriptive labels (e.g., ["map labeling", "inference"])
- `action_items` — 2–4 specific practice recommendations
- `notes_hash` — MD5 hash of all notes + listening accuracy (debounce cache)
- `notes_analyzed_count` — Number of notes included in last generation
- `generated_at` — Timestamp of last LLM call
- Unique constraint: `(user_id, skill)`

#### AI Integration

**`src/lib/ai/notes-analyzer.ts`**
- Model: `minimax/minimax-m2.7` (via OpenRouter)
- Prompt includes test notes (newest first) + listening question-type accuracy breakdown
- Returns structured JSON with per-skill summaries, weak areas, and action items
- Temperature: 0.4 (deterministic), max tokens: 2000
- Fallback: Returns default placeholders if no notes available

#### Server Actions

**`src/app/dashboard/notes/actions.ts`**
- `generateNotesInsights()` — Auto-called after test creation/updates; skips LLM if hash unchanged
- `refreshNotesInsights()` — Force-regenerate (ignores hash); called by manual refresh button

#### Key Components

**`src/components/notes/`**
- `notes-skill-tabs.tsx` — Client tabs component + manual refresh button (loading state)
- `notes-insight-card.tsx` — Per-skill card displaying summary + weak areas + action items
- `notes-raw-list.tsx` — Collapsible list of source test notes (oldest at top for context)

#### Data Flow

1. User takes listening test → `submitListeningTest()` fires `generateNotesInsights()` in background
2. `generateNotesInsights()` fetches all user notes + listening accuracy, computes hash
3. If hash differs from stored values (or force refresh), calls LLM via `analyzeNotes()`
4. Results upserted into `skill_notes_insights` per skill
5. RSC page fetches insights + raw notes, renders tabs
6. User can click refresh button to force immediate regeneration

#### Files

- `supabase/migrations/009_skill_notes_insights.sql` — Schema + RLS
- `src/lib/db/types.ts` — Added `IeltsSkill` type + `DbSkillNoteInsight` interface
- `src/lib/db/notes-insights.ts` — Query helpers + hash computation
- `src/lib/ai/notes-analyzer.ts` — LLM prompt builder + JSON parsing
- `src/app/dashboard/notes/page.tsx` — RSC page
- `src/app/dashboard/notes/actions.ts` — Server actions
- `src/components/notes/` — 3 client components
- `src/app/dashboard/results/actions.ts` — Updated to fire-and-forget `generateNotesInsights()`
- `src/components/layout/header.tsx` — Added "My Notes" nav link (desktop + mobile)

---

### 7. Vocabulary — Spaced Repetition Learning

**Routes:**
- `/dashboard/vocabulary` — Word bank + review history
- `/dashboard/vocabulary/add` — Add new word
- `/dashboard/vocabulary/review` — FSRS review session
- `/dashboard/vocabulary/settings` — User preferences

Learn vocabulary using the FSRS algorithm (Anki v3). Words are AI-enriched on entry and reviewed at optimal intervals based on recall quality.

#### Features

- **AI Enrichment:** Auto-fill definition, phonetic, example, synonyms via OpenRouter
- **Dual Tagging:** IELTS skill tags (Reading/Writing/Speaking/Listening) + user-defined topics
- **FSRS Scheduling:** `ts-fsrs` npm package drives all intervals
- **Mixed Review:** Flashcard for new/learning, MCQ for mature cards
- **In-App Badge:** Live due-count badge on dashboard (RSC fetch, no polling)
- **Daily Cap:** Configurable max new cards per day (default 10)

#### Database Tables

**`vocabulary_words`**
- `id`, `user_id` (FK), `word` (unique per user), `definition`, `phonetic`, `example`, `synonyms`, `skill_tags` (JSONB array), `topic_tags` (JSONB array), `created_at`

**`vocabulary_reviews`**
- `id`, `user_id`, `word_id` (FK), `review_date`, `grade` (0–4, from FSRS), `ease`, `interval`, `due_date`, `reps`, `lapses`
- Tracks FSRS scheduling state for each review

#### FSRS Integration

**`src/lib/vocabulary/fsrs.ts`**
- Helper functions to compute due dates, next review schedule based on grade
- Syncs with `ts-fsrs` package API

#### AI Enrichment

**`src/lib/vocabulary/ai-enrichment.ts`**
- OpenRouter API call to fetch definition, phonetic, example, synonyms
- Fallback if API fails

#### Key Components

**`src/components/vocabulary/`**
- `vocabulary-list.tsx` — Word bank table with filters (skill, topic, due)
- `vocabulary-add-form.tsx` — Form to add word + AI enrichment
- `vocabulary-review-session.tsx` — Flashcard/MCQ review player
- `vocabulary-settings.tsx` — User preferences (daily cap, etc.)

#### Files

- `src/app/dashboard/vocabulary/page.tsx`
- `src/app/dashboard/vocabulary/add/page.tsx`
- `src/app/dashboard/vocabulary/review/page.tsx`
- `src/app/dashboard/vocabulary/settings/page.tsx`
- `src/lib/db/vocabulary-words.ts` — DB queries
- `src/lib/vocabulary/fsrs.ts` — FSRS helpers
- `src/lib/vocabulary/ai-enrichment.ts` — OpenRouter integration
- `supabase/migrations/004_vocabulary_tables.sql` — Schema

---

## Database & Migrations

### Migration Files

| File | Description |
|------|-------------|
| `001_initial_schema.sql` | Core tables: `test_results`, `user_goals` |
| `002_auth_profiles.sql` | User profile extension on `auth.users` |
| `003_scores_and_goals.sql` | Additional scoring tables |
| `004_vocabulary_tables.sql` | Vocabulary words + reviews tables |
| `005_fsrs_scheduling.sql` | FSRS scheduling state |
| `008_listening_practice.sql` | Listening tests, sections, questions, attempts + storage bucket |
| `009_skill_notes_insights.sql` | Notes insights table for AI-generated per-skill summaries |

### Key Tables

**`test_results`** — Historical IELTS submissions
**`user_goals`** — User target bands
**`vocabulary_words`** — User vocabulary bank
**`vocabulary_reviews`** — FSRS review history
**`listening_tests`** — Cambridge tests metadata
**`listening_sections`** — Test audio + instructions
**`listening_questions`** — Questions per section (JSONB-stored)
**`listening_attempts`** — User test attempts + scores
**`skill_notes_insights`** — AI-generated per-skill summaries from notes + listening accuracy

### Row-Level Security (RLS)

All user-owned tables enforce RLS:
- Users can read/write only their own rows
- Service role (admin) can write test data
- Public test data (listening tests) readable by authenticated users

---

## API Layer

### Server Actions

**`src/lib/listening/actions.ts`**
- `submitListeningTest(attemptId, answers)` — Score and persist test results

**`src/lib/vocabulary/actions.ts`**
- `submitVocabularyReview(wordId, grade)` — Update FSRS state
- `enrichWordWithAI(word)` — Fetch definition, phonetic, etc.

### Route Handlers (if any)

Currently minimal route handlers; most API calls use Supabase RLS policies directly or server actions.

---

## UI & Design System

### Component Library

All UI built with **shadcn/ui** (Radix UI + Tailwind CSS):
- Button, Input, Select, Modal, Card, Table, Badge, Progress, Tabs, Accordion, etc.
- Accessible, keyboard-navigable, fully styled

### Design Tokens

**`docs/design-guidelines.md`** defines:
- Color palette (primary, secondary, muted, destructive)
- Typography (font family, sizes, weights)
- Spacing, borders, shadows
- Dark mode support (Tailwind CSS `dark:` prefix)

### Responsive Design

Mobile-first approach:
- `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px)
- Listening test layout: 1 column on small, split-panel on md+
- Vocabulary table: horizontal scroll on mobile, full table on md+

---

## Performance & Optimization

### Image Optimization

- Next.js `Image` component (lazy loading, WebP format)
- Logo: Pre-optimized PNG in `docs/`

### Code Splitting

- Listening player: Lazy-loaded question type components
- Vocabulary review: Dynamic import for AI enrichment

### Caching

- Supabase Storage: Public `listening-audio` bucket uses CDN + caching headers
- Server-side queries: Cached per request (no external caching layer in v1)

---

## Security

### Authentication

- Supabase Auth (managed passwords, session tokens)
- Protected routes via middleware JWT verification
- No sensitive keys in client bundles

### Data Protection

- RLS policies enforce user ownership
- `answer_key` in listening questions never sent to client (server-side only)
- Audio bucket public (auth-gated at page layer, not bucket layer)

### Secrets Management

- `.env.local` for Supabase URL, API keys, OpenRouter API key
- Environment variables validated at startup

---

## Development Workflow

### Running Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in browser.

### Database Setup

```bash
supabase start       # Local Supabase stack
supabase db push     # Apply migrations
npm run seed         # Run seed scripts (if any)
```

### Deployment

- **Hosting:** Vercel (recommended for Next.js)
- **Database:** Supabase PostgreSQL (production)
- **Storage:** Supabase Storage (listening audio)

---

## Testing

Currently minimal (TODO: expand as codebase grows):
- Manual E2E testing via browser
- TODO: Vitest unit tests for scoring logic
- TODO: Playwright E2E tests for key workflows

---

## Known Limitations & TODOs

### Listening Practice (v1)

- [ ] Manual question entry for 16 tests (seed script structure ready)
- [ ] Admin UI for test management (not in scope for v1)
- [ ] No resume of in-progress tests (stored as complete only)
- [ ] Map labeling fallback on mobile (renders as fill-blank)

### Vocabulary (v1)

- [ ] No browser push/email notifications
- [ ] No CSV/Anki deck import
- [ ] Audio pronunciation playback (phonetic text only)
- [ ] No community word packs

### General

- [ ] Reading practice module (planned)
- [ ] Writing practice module (planned)
- [ ] Speaking practice module (planned)

---

## Dependencies

**Core:**
- `next@15`
- `react@19`
- `typescript@5`
- `supabase` (client + auth)
- `@supabase/ssr` (server-side auth)

**UI:**
- `shadcn/ui`
- `@radix-ui/*` (accessibility primitives)
- `tailwindcss@4`
- `lucide-react` (icons)

**Data/State:**
- `recharts` (charts for goal tracking)
- `ts-fsrs` (FSRS scheduling for vocabulary)
- `zustand` or `useReducer` (state management)

**AI & External APIs:**
- OpenRouter API (notes analysis via MiniMax m2.7 model)
- OpenRouter API (vocabulary enrichment)

**Development:**
- `eslint`, `prettier`
- `tailwindcss` (styling)

---

## Contact & Contribution

For feature requests or bug reports, create an issue in the repository.

Last updated: **2026-05-03**

---

## Recent Updates (2026-05-03)

**New Feature:** IELTS Notes Page — AI-powered learning insights aggregated from test notes.
- Analyzes all historical notes via LLM (MiniMax m2.7 via OpenRouter)
- Per-skill summaries + weak areas + action items
- Hash-based debounce to avoid redundant LLM calls
- Question-type accuracy analytics for listening
- Integrated into dashboard navigation
