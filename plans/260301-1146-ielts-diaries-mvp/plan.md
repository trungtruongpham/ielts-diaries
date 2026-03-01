---
title: "IELTS Diaries MVP"
description: "Full-stack IELTS score calculator, goal tracker, and results dashboard with Next.js + Supabase"
status: pending
priority: P1
effort: 24h
tags: [feature, frontend, backend, auth, database]
created: 2026-03-01
---

# IELTS Diaries MVP — Implementation Plan

## Overview

Build a responsive web app that lets users calculate IELTS band scores (free), and track test results + goals (authenticated). Stack: Next.js 15 App Router, shadcn/ui, Tailwind CSS, Supabase (Auth + PostgreSQL), Recharts.

## Brainstorm Reference

[brainstorm-ielts-diaries-2026-03-01.md](../brainstorm-ielts-diaries-2026-03-01.md)

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | Project Setup & Foundation | Pending | 3h | [phase-01](./phase-01-project-setup.md) |
| 2 | IELTS Score Calculation Logic | Pending | 2h | [phase-02](./phase-02-score-calculation.md) |
| 3 | Calculator UI (Public) | Pending | 4h | [phase-03](./phase-03-calculator-ui.md) |
| 4 | Supabase Auth Integration | Pending | 3h | [phase-04](./phase-04-auth.md) |
| 5 | Database Schema & Data Layer | Pending | 3h | [phase-05](./phase-05-database.md) |
| 6 | Test Result Management | Pending | 3h | [phase-06](./phase-06-test-results.md) |
| 7 | Goal Tracking | Pending | 2h | [phase-07](./phase-07-goal-tracking.md) |
| 8 | Dashboard & Charts | Pending | 4h | [phase-08](./phase-08-dashboard.md) |

## Dependencies

```
Phase 1 → Phase 2 → Phase 3
Phase 1 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8
Phase 3 → Phase 6 (calculator "Save" CTA needs auth + DB)
```

## Architecture Summary

- **Public pages** (landing, calculator): Server Components, SSR
- **Auth pages** (login, register): Client Components, Supabase Auth
- **Dashboard pages**: Client Components, protected by middleware, Supabase RLS
- **Score calculation**: Pure client-side utility functions (no API call)
- **Data access**: Direct Supabase client queries, RLS-enforced authorization
