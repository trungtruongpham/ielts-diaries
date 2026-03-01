# Phase 3 — Calculator UI (Public)

## Overview
- **Priority**: P1
- **Status**: Pending
- **Effort**: 4h
- **Depends on**: Phase 1, Phase 2

Build the public score calculator page at `/calculator` with 3 tabs: Listening, Reading, Overall. No authentication required. Includes a "Save Result" CTA for authenticated users (connects to Phase 6).

## Requirements

### Functional
- Single `/calculator` page with shadcn Tabs
- **Listening tab**: Input correct answers (0-40) → display band score
- **Reading tab**: Toggle Academic/General Training, input correct answers → display band score
- **Overall tab**: Input 4 module band scores → display overall band
- Instant calculation on input change (no submit button needed)
- "Save this result" CTA button (visible after calculation, triggers auth check in Phase 6)
- SEO: SSR-rendered page shell, client-side interactivity

### Non-Functional
- Responsive: works on mobile
- Accessible: proper labels, ARIA attributes
- Visual: band score displayed prominently with color coding (e.g., green for 7+, yellow for 5-6.5, red for <5)

## Files to Create

```
src/app/calculator/
├── page.tsx                         # Calculator page (server component shell)
└── layout.tsx                       # Calculator layout with SEO metadata

src/components/calculator/
├── calculator-tabs.tsx              # Main tabs container (client component)
├── listening-calculator.tsx         # Listening tab content
├── reading-calculator.tsx           # Reading tab content (with Academic/General toggle)
├── overall-calculator.tsx           # Overall band tab content
├── band-score-display.tsx           # Reusable band score result display
└── score-slider-input.tsx           # Number input (0-40) with slider
```

## Architecture

```
/calculator (page.tsx - Server Component)
└── <CalculatorTabs> (Client Component)
    ├── Tab: Listening
    │   └── <ListeningCalculator>
    │       ├── <ScoreSliderInput> (0-40)
    │       └── <BandScoreDisplay> (result)
    ├── Tab: Reading
    │   └── <ReadingCalculator>
    │       ├── Academic/General Toggle (shadcn Switch or RadioGroup)
    │       ├── <ScoreSliderInput> (0-40)
    │       └── <BandScoreDisplay> (result)
    └── Tab: Overall
        └── <OverallCalculator>
            ├── 4x Band Score Inputs (Listening, Reading, Writing, Speaking)
            └── <BandScoreDisplay> (overall result)
```

## Implementation Steps

### 1. Create calculator page shell
**`src/app/calculator/page.tsx`**:
```tsx
// Server component — SEO metadata
export const metadata = {
  title: 'IELTS Band Score Calculator | IELTS Diaries',
  description: 'Free IELTS band score calculator. Convert your correct answers to band scores for Listening and Reading. Calculate your overall IELTS band.',
}

export default function CalculatorPage() {
  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <h1>IELTS Band Score Calculator</h1>
      <p>Calculate your IELTS band score instantly</p>
      <CalculatorTabs />
    </div>
  )
}
```

### 2. Build `CalculatorTabs` client component
- Use shadcn `<Tabs>` component
- 3 tabs: Listening | Reading | Overall
- Each tab renders its calculator component

### 3. Build `ScoreSliderInput` component
- shadcn `<Slider>` + `<Input>` (number) synced together
- Range: 0-40, step: 1
- Shows current value prominently
- Label: "Number of Correct Answers"

### 4. Build `BandScoreDisplay` component
- Large band score number (e.g., "7.0")
- Color coded: 
  - 7.0-9.0 → green (good)
  - 5.5-6.5 → yellow/amber (moderate)
  - 0-5.0 → red (needs improvement)
- Optional: small text showing band descriptor (e.g., "Good User")
- Card-style container with clean visual

### 5. Build `ListeningCalculator`
- `<ScoreSliderInput>` for correct answers
- Calls `calculateListeningBand()` on change
- Renders `<BandScoreDisplay>` with result

### 6. Build `ReadingCalculator`
- shadcn `<RadioGroup>` or `<ToggleGroup>` for Academic/General
- `<ScoreSliderInput>` for correct answers
- Calls `calculateReadingBand(correct, testType)` on change
- Renders `<BandScoreDisplay>` with result

### 7. Build `OverallCalculator`
- 4 band score inputs (Listening, Reading, Writing, Speaking)
- Each input: number, range 0-9, step 0.5
- Use shadcn `<Select>` with band score options (0, 0.5, 1.0... 9.0)
- Calls `calculateOverallBand()` on change
- Renders `<BandScoreDisplay>` with overall result

### 8. Add "Save this result" CTA
- Button appears after a calculation is performed
- For now, just a button — actual save logic comes in Phase 6
- Button text: "Save to My Results"
- If user not authenticated: redirect to login (Phase 4)
- If authenticated: save result (Phase 6)

## Todo List

- [ ] Create `/calculator` page and layout with SEO metadata
- [ ] Build `CalculatorTabs` with 3 tabs
- [ ] Build `ScoreSliderInput` (slider + number input)
- [ ] Build `BandScoreDisplay` with color coding
- [ ] Build `ListeningCalculator` tab
- [ ] Build `ReadingCalculator` tab with Academic/General toggle
- [ ] Build `OverallCalculator` tab with 4 band inputs
- [ ] Add "Save this result" CTA button (placeholder action)
- [ ] Test responsive layout on mobile
- [ ] Verify SEO metadata renders correctly

## Success Criteria

- Calculator loads at `/calculator` without auth
- Changing slider instantly updates band score display
- Reading tab correctly shows different scores for Academic vs General
- Overall tab calculates and rounds correctly
- "Save this result" button is visible after calculation
- Page is responsive on mobile viewports

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Slider UX on mobile (hard to tap precisely) | Also provide number input as alternative |
| Users confused by Academic vs General | Add brief helper text explaining the difference |

## Next Steps

→ Phase 4: Implement authentication so "Save result" CTA can work
