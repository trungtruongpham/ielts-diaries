# Phase 6 — Test Result Management

## Overview
- **Priority**: P1
- **Status**: Pending
- **Effort**: 3h
- **Depends on**: Phase 3, Phase 4, Phase 5

Build the test result logging flow. Includes: "Save this result" CTA from calculator, dedicated new result form, results list, and delete capability.

## Requirements

### Functional
- Calculator "Save this result" → check auth → save to database
- Dedicated `/dashboard/results/new` page for manual result entry
- Results list on dashboard (sortable by date)
- Delete a result
- Form fields: test date, test type (Academic/General), correct answers or band scores for each module, notes

### Non-Functional
- Toast notifications for success/error
- Form validation with Zod
- Optimistic UI updates where appropriate

## Files to Create

```
src/app/dashboard/results/
├── new/
│   └── page.tsx                    # New test result form page

src/components/results/
├── new-result-form.tsx             # Full test result entry form
├── result-card.tsx                 # Single result display card
└── results-list.tsx                # List of result cards
```

## Files to Modify

```
src/components/calculator/
└── calculator-tabs.tsx             # Wire "Save" CTA to actual save logic
```

## Implementation Steps

### 1. Build new result form

**`src/components/results/new-result-form.tsx`**:

Fields:
- Test Date (`<DatePicker>` or `<Input type="date">`)
- Test Type (`<RadioGroup>`: Academic / General)
- Listening section:
  - Correct answers (0-40) → auto-calculates band score
  - Shows calculated band
- Reading section:
  - Correct answers (0-40) → auto-calculates band score (based on test type)
  - Shows calculated band
- Writing band (optional, manual select 0-9 in 0.5 steps)
- Speaking band (optional, manual select 0-9 in 0.5 steps)
- Overall band (auto-calculated if all 4 provided, or manual input)
- Notes (optional textarea)

Validation (Zod):
```typescript
const testResultSchema = z.object({
  testDate: z.date(),
  testType: z.enum(['academic', 'general']),
  listeningCorrect: z.number().min(0).max(40).optional(),
  listeningBand: z.number().min(0).max(9),
  readingCorrect: z.number().min(0).max(40).optional(),
  readingBand: z.number().min(0).max(9),
  writingBand: z.number().min(0).max(9).optional(),
  speakingBand: z.number().min(0).max(9).optional(),
  overallBand: z.number().min(0).max(9),
  notes: z.string().max(500).optional(),
})
```

### 2. Wire calculator "Save" CTA

In `calculator-tabs.tsx`:
1. After calculation, show "Save to My Results" button
2. On click:
   - Check auth state via `supabase.auth.getUser()`
   - If not authenticated: redirect to `/login?redirect=/calculator` (preserve state)
   - If authenticated: create result via `createTestResult()`, show toast, optionally redirect to dashboard
3. Pass calculated scores from calculator state to the save function

### 3. Build result card component

**`src/components/results/result-card.tsx`**:
- shadcn `<Card>` showing: date, test type, individual bands, overall band
- Color-coded overall band
- Delete button (with confirmation dialog)
- Compact layout for list view

### 4. Build results list

**`src/components/results/results-list.tsx`**:
- Fetches results via `getTestResults()`
- Maps to `<ResultCard>` components
- Empty state: "No results yet. Take a test and save your score!"
- Sorted by test date (newest first by default)

### 5. Create new result page

**`src/app/dashboard/results/new/page.tsx`**:
- Protected route (middleware redirects if not auth)
- Renders `<NewResultForm>`
- On successful save: redirect to `/dashboard` with success toast

## Todo List

- [ ] Build new result form with Zod validation
- [ ] Implement form submission (save to Supabase)
- [ ] Wire calculator "Save" CTA to auth check + save
- [ ] Build result card component
- [ ] Build results list component with data fetching
- [ ] Add delete functionality with confirmation
- [ ] Add toast notifications (success/error)
- [ ] Create `/dashboard/results/new` page
- [ ] Test: save from calculator → appears in dashboard
- [ ] Test: manual entry → appears in dashboard
- [ ] Test: delete result

## Success Criteria

- User can save a result from the calculator and see it in dashboard
- User can manually enter a result from `/dashboard/results/new`
- Results list shows all saved results ordered by date
- Delete works with confirmation
- Unauthenticated "Save" redirects to login, then back to calculator

## Risk Assessment

| Risk | Mitigation |
|---|---|
| State loss when redirecting unauth user to login | Store calculator state in URL params or sessionStorage |
| Complex form with many optional fields | Group fields logically, show/hide writing+speaking with expand section |

## Next Steps

→ Phase 7: Build goal tracking feature
