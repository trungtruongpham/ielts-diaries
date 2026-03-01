# Phase 8 — Dashboard & Charts

## Overview
- **Priority**: P1
- **Status**: Pending
- **Effort**: 4h
- **Depends on**: Phase 5, Phase 6, Phase 7

Build the main dashboard page at `/dashboard`. Assembles: goal progress card, score history line chart, recent results list, and quick action buttons.

## Requirements

### Functional
- Score history line chart (time on X-axis, band scores on Y-axis)
- One line per module (Listening, Reading, Writing, Speaking, Overall)
- Toggle individual module lines on/off
- Goal progress card (from Phase 7)
- Recent results list (from Phase 6)
- Quick action buttons: "Log New Result", "Edit Goal", "Calculate Score"
- Empty dashboard state for new users

### Non-Functional
- Responsive: chart readable on mobile (simplified if needed)
- Performance: handle 50+ data points smoothly
- Accessible: chart has proper ARIA labels

## Files to Create

```
src/app/dashboard/
├── page.tsx                        # Main dashboard page
└── layout.tsx                      # Dashboard layout (sidebar or top nav)

src/components/dashboard/
├── score-history-chart.tsx         # Recharts line chart
├── dashboard-header.tsx            # Welcome message + quick actions
├── dashboard-empty-state.tsx       # Empty state for new users
└── quick-actions.tsx               # Action buttons card
```

## Architecture

```
/dashboard (page.tsx)
├── <DashboardHeader>                 # Welcome + quick actions
├── <GoalProgressCard>                # From Phase 7
├── <ScoreHistoryChart>               # Recharts LineChart
│   ├── X-axis: test dates
│   ├── Y-axis: band scores (0-9)
│   ├── Lines: Listening, Reading, Writing, Speaking, Overall
│   ├── Goal line (dashed horizontal for target overall)
│   └── Legend with toggleable modules
└── <ResultsList>                     # Recent results from Phase 6
```

## Implementation Steps

### 1. Create dashboard layout
**`src/app/dashboard/layout.tsx`**:
- Dashboard-specific navigation (sidebar or top sub-nav)
- Links: Dashboard, New Result, Goal
- Protected by middleware (Phase 4)

### 2. Create dashboard page
**`src/app/dashboard/page.tsx`**:
- Fetch user data on load:
  - `getTestResults()` — all results, ordered by date
  - `getUserGoal()` — current goal (may be null)
- Pass data to child components
- Show `<DashboardEmptyState>` if no results AND no goal

### 3. Build score history chart

**`src/components/dashboard/score-history-chart.tsx`**:

Using Recharts:
```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'

// Data format:
// [{ date: '2026-01-15', listening: 6.5, reading: 7.0, overall: 6.5 }, ...]

<ResponsiveContainer width="100%" height={400}>
  <LineChart data={chartData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date" />
    <YAxis domain={[0, 9]} ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]} />
    <Tooltip />
    <Legend onClick={handleLegendClick} /> {/* Toggle lines */}
    
    <Line type="monotone" dataKey="listening" stroke="#3b82f6" name="Listening" />
    <Line type="monotone" dataKey="reading" stroke="#22c55e" name="Reading" />
    <Line type="monotone" dataKey="writing" stroke="#f59e0b" name="Writing" />
    <Line type="monotone" dataKey="speaking" stroke="#ef4444" name="Speaking" />
    <Line type="monotone" dataKey="overall" stroke="#8b5cf6" strokeWidth={2} name="Overall" />
    
    {/* Goal reference line */}
    {goal && <ReferenceLine y={goal.targetOverall} stroke="#666" strokeDasharray="5 5" label="Goal" />}
  </LineChart>
</ResponsiveContainer>
```

Key features:
- **Toggleable lines**: Click legend items to show/hide module lines
- **Goal reference line**: Dashed horizontal line at target overall band
- **Tooltip**: Shows all scores for a given date on hover
- **Responsive**: `<ResponsiveContainer>` adapts to container width
- **Color scheme**: Distinct, accessible colors per module

### 4. Transform data for chart
```typescript
function transformResultsToChartData(results: TestResult[]) {
  return results.map(r => ({
    date: format(new Date(r.test_date), 'MMM dd'),
    listening: r.listening_band,
    reading: r.reading_band,
    writing: r.writing_band,
    speaking: r.speaking_band,
    overall: r.overall_band,
  }))
}
```

### 5. Build dashboard header
- Welcome message: "Welcome back, {email}"
- Quick actions: "Log New Result" → `/dashboard/results/new`, "Edit Goal" → `/dashboard/goal`, "Calculate Score" → `/calculator`

### 6. Build empty state
- Friendly illustration/icon
- "Start your IELTS journey"
- CTA: "Take your first test" → `/calculator`, "Set a goal" → `/dashboard/goal`

### 7. Mobile optimization
- Chart: reduce height on mobile, use abbreviated date labels
- Stack cards vertically
- Collapsible sections if needed

## Todo List

- [ ] Create dashboard layout with navigation
- [ ] Create dashboard page with data fetching
- [ ] Build score history chart with Recharts
- [ ] Implement line toggling via legend
- [ ] Add goal reference line (dashed)
- [ ] Build chart data transformation utility
- [ ] Build dashboard header with quick actions
- [ ] Build empty state for new users
- [ ] Test with 0, 1, 3, 10+ data points
- [ ] Test responsive layout on mobile
- [ ] Verify chart performance with many data points

## Success Criteria

- Dashboard loads with chart showing all logged test results
- Each module has a distinct colored line
- Goal target line is visible as dashed reference
- Clicking legend toggles individual lines
- Goal progress card shows current vs. target + days remaining
- Recent results list shows latest entries
- Empty state shows for new users with no data
- Responsive and usable on mobile

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Chart looks bad with 1-2 data points | Show dots/markers, fallback message "Log more results to see trends" |
| Recharts bundle size | Tree-shake imports, only import used components |
| Mobile chart readability | Reduce to 3 lines on mobile (Overall + 2 most recent modules), use landscape hint |

## Next Steps

This is the final phase. After completion:
- Manual QA pass on all flows
- Deploy to Vercel
- Share and iterate
