# Phase 7 — Goal Tracking

## Overview
- **Priority**: P2
- **Status**: Pending
- **Effort**: 2h
- **Depends on**: Phase 5, Phase 6

Build goal setting/editing UI. Users set target band scores per module + overall band + deadline date. Dashboard shows progress toward goal.

## Requirements

### Functional
- `/dashboard/goal` page: set or edit goal
- Goal form: target bands for each module (Listening, Reading, Writing, Speaking), target overall, deadline date
- 1:1 relationship — upsert pattern (create if none, update if exists)
- Goal summary card on main dashboard showing current vs. target + days remaining

### Non-Functional
- Clear empty state when no goal set ("Set a goal to track your progress")
- Validation: band scores 0-9 in 0.5 steps, target date must be in the future

## Files to Create

```
src/app/dashboard/goal/
└── page.tsx                       # Goal set/edit page

src/components/goal/
├── goal-form.tsx                  # Goal set/edit form
└── goal-progress-card.tsx         # Goal summary with progress indicators
```

## Implementation Steps

### 1. Build goal form

**`src/components/goal/goal-form.tsx`**:

Fields:
- Target Listening band (`<Select>`: 0.0 – 9.0, step 0.5)
- Target Reading band (same)
- Target Writing band (same)
- Target Speaking band (same)
- Target Overall band (same, or auto-calculated)
- Target Date (`<Input type="date">`, must be future)

Zod schema:
```typescript
const goalSchema = z.object({
  targetListening: z.number().min(0).max(9).multipleOf(0.5),
  targetReading: z.number().min(0).max(9).multipleOf(0.5),
  targetWriting: z.number().min(0).max(9).multipleOf(0.5),
  targetSpeaking: z.number().min(0).max(9).multipleOf(0.5),
  targetOverall: z.number().min(0).max(9).multipleOf(0.5),
  targetDate: z.date().min(new Date(), { message: "Target date must be in the future" }),
})
```

On submit:
- Call `upsertUserGoal()` with `user_id` from auth session
- Toast: "Goal saved!"
- Redirect to `/dashboard`

### 2. Pre-fill form if goal exists

- On page load, fetch existing goal via `getUserGoal()`
- If exists: pre-fill all fields, button says "Update Goal"
- If not: empty form, button says "Set Goal"

### 3. Build goal progress card

**`src/components/goal/goal-progress-card.tsx`**:

Used on the main dashboard page. Shows:
- Target overall band prominently
- Per-module current vs. target (e.g., "Listening: 6.5 / 7.0")
- Gap indicator (colored bar: green if met, amber if close, red if far)
- Days remaining countdown (calculated from `target_date - today`)
- If goal met: celebration UI (e.g., "🎉 Goal Achieved!")

Current scores derived from the **most recent test result**.

### 4. Handle edge cases

- No goal set: show "Set a goal to start tracking" CTA
- No test results: show "Take a test first" message in progress card
- Goal date passed: show "Deadline passed" warning, suggest updating goal

## Todo List

- [ ] Build goal form with Zod validation
- [ ] Implement upsert logic (create or update)
- [ ] Pre-fill form when editing existing goal
- [ ] Create `/dashboard/goal` page
- [ ] Build goal progress card for dashboard
- [ ] Implement days remaining countdown
- [ ] Handle empty states (no goal, no results)
- [ ] Handle expired goal deadline
- [ ] Add toast notifications

## Success Criteria

- User can set a new goal
- User can edit existing goal (form pre-filled)
- Dashboard shows goal progress card with current vs. target
- Days remaining countdown is accurate
- Empty states are handled gracefully

## Next Steps

→ Phase 8: Build full dashboard with charts
