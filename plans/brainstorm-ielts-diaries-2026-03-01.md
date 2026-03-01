---
title: IELTS Diaries App — Brainstorm Summary
date: 2026-03-01
status: agreed
---

# IELTS Diaries App — Brainstorm Summary

## Problem Statement

IELTS test-takers need a simple, fast way to:
1. Calculate their Listening/Reading band scores from raw correct answers
2. Calculate overall band score from all 4 module scores
3. Track test results over time and visualize score trends
4. Set target goals and monitor progress toward them

The app should serve **two user types**: anonymous users (free calculator tool) and authenticated users (goal tracking + dashboard).

## Requirements

### Functional
- **Score Calculator** (public, no auth): Listening band, Reading band (Academic + General Training), Overall band — single page with tabs
- **Auth**: Email/password + Google OAuth via Supabase Auth
- **Test Result Logging**: Authenticated users save results; calculator has "Save this result" CTA that flows into dashboard
- **Goal Setting**: Per-module target bands + target overall + deadline date; 1:1 per user
- **Dashboard**: Score history line chart, progress toward goal with gap visualization, days remaining countdown

### Non-Functional
- Mobile responsive
- Fast page loads (SSR for public pages)
- SEO-friendly landing + calculator pages

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 15 (App Router) | SSR for public pages, client for dashboard |
| UI | shadcn/ui + Tailwind CSS | Rapid, consistent, accessible components |
| Charts | Recharts | Lightweight, React-native, good for line charts |
| Auth | Supabase Auth | Built-in email + Google OAuth |
| Database | Supabase PostgreSQL + RLS | Free tier, row-level security, no custom backend |
| Supabase Client | `@supabase/ssr` | Cookie-based sessions for Next.js |
| Validation | Zod | Type-safe form validation, pairs with shadcn forms |
| State | React hooks + Supabase queries | No global state manager needed — YAGNI |

## Architecture

### Pattern: Next.js App Router + Supabase Direct

- Server components for public pages (landing, calculator) — SSR/SEO
- Client components for dashboard — interactive charts, forms
- Supabase RLS handles authorization at DB level — no API routes needed for CRUD
- Pure client-side score calculation logic — no server roundtrip for calculator

### Why This Over Alternatives
- **vs. API Routes layer**: More boilerplate, slower to ship, YAGNI for MVP
- **vs. External auth (NextAuth)**: Supabase Auth is simpler when already using Supabase DB
- **vs. Firebase**: PostgreSQL + RLS is more flexible than Firestore for relational data

## Data Model

### `user_goals` (1:1 with auth.users)

| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK → auth.users) | Unique constraint |
| target_listening | decimal | Target band score |
| target_reading | decimal | Target band score |
| target_writing | decimal | Target band score |
| target_speaking | decimal | Target band score |
| target_overall | decimal | Target overall band |
| target_date | date | Goal deadline |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `test_results` (1:N with auth.users)

| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK → auth.users) | |
| test_date | date | When test was taken |
| test_type | enum ('academic', 'general') | Affects Reading conversion |
| listening_correct | int (nullable) | Raw correct count (0-40) |
| listening_band | decimal | Calculated band |
| reading_correct | int (nullable) | Raw correct count (0-40) |
| reading_band | decimal | Calculated band |
| writing_band | decimal (nullable) | Manual input, MVP optional |
| speaking_band | decimal (nullable) | Manual input, MVP optional |
| overall_band | decimal | Calculated from 4 modules |
| notes | text (nullable) | User notes about this test |
| created_at | timestamptz | |

### RLS Policies
- `user_goals`: Users can only CRUD their own row (`auth.uid() = user_id`)
- `test_results`: Users can only CRUD their own rows (`auth.uid() = user_id`)

### Design Decisions
- Store both raw correct count AND calculated band — dashboard doesn't recalculate, historical data stays accurate even if conversion tables are updated
- Writing/Speaking bands nullable — MVP focuses on Listening/Reading but schema is future-proof
- `test_type` required — Academic and General Training have different Reading conversion tables

## IELTS Score Calculation Logic

### Band Score Conversion (client-side lookup)
Listening and Reading scores derived from official British Council conversion tables. Pure function, no API call.

### Overall Band Calculation
Average of 4 module bands, rounded to nearest 0.5:
- If decimal part < 0.25 → round down
- If decimal part ≥ 0.25 and < 0.75 → round to 0.5
- If decimal part ≥ 0.75 → round up

Example: (7.0 + 6.5 + 6.0 + 7.0) / 4 = 6.625 → **6.5**

## Page Structure

```
/                    → Landing page (public, SSR)
/calculator          → Score calculator with tabs: Listening | Reading | Overall (public)
/login               → Login page
/register            → Register page
/dashboard           → Score history chart + goal progress (auth required)
/dashboard/results/new → Log new test result (auth required)
/dashboard/goal      → Set/edit goal (auth required)
```

### Key UX Flows
1. **Free user**: Landing → Calculator → Instant result
2. **Calculator → Save**: After calculating, CTA "Save this result" → prompts login if anonymous → saves to dashboard
3. **Goal tracking**: Dashboard shows current latest scores vs target goal with visual gap + days remaining countdown
4. **Score history**: Line chart with time on X-axis, band scores on Y-axis, one line per module

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| IELTS conversion tables vary by source | Use official British Council tables, cite source in UI |
| Supabase free tier limits | Monitor usage, upgrade only if needed |
| Scope creep | Stick to MVP features, ship first, iterate later |
| Mobile chart readability | Test Recharts responsive mode early, use simplified mobile view if needed |

## Success Metrics (MVP)

1. Free user calculates band score in < 10 seconds
2. Auth user logs result and sees it on dashboard
3. Goal tracking shows clear gap visualization + deadline countdown
4. Score history renders clean line chart for 3+ data points
5. Fully responsive on mobile

## Out of Scope (Post-MVP)

- Writing/Speaking practice or AI feedback
- Test reminders/notifications
- Social features / leaderboards
- PDF report export
- Practice test content
- Admin panel

## Next Steps

1. Create detailed implementation plan with phases
2. Initialize Next.js project with shadcn/ui + Tailwind
3. Set up Supabase project (auth, DB schema, RLS)
4. Build calculator (public, no auth)
5. Build auth flow
6. Build dashboard + goal tracking
