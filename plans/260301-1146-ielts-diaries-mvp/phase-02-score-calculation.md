# Phase 2 — IELTS Score Calculation Logic

## Overview
- **Priority**: P1
- **Status**: Pending
- **Effort**: 2h
- **Depends on**: Phase 1

Implement pure TypeScript utility functions for IELTS band score conversion. All logic is client-side — no API calls, no database.

## Key Insights

- IELTS Listening: 40 questions → band score (same for Academic and General)
- IELTS Reading Academic: 40 questions → band score (different table than General)
- IELTS Reading General Training: 40 questions → band score (different table than Academic)
- Overall band: average of 4 modules, rounded to nearest 0.5

## Files to Create

```
src/lib/ielts/
├── band-score-tables.ts       # Conversion lookup tables (constants)
├── calculate-band-score.ts    # Listening/Reading band calculation
├── calculate-overall-band.ts  # Overall band from 4 modules
├── types.ts                   # IELTS-specific types
└── index.ts                   # Public API barrel export
```

## Implementation Steps

### 1. Define types (`src/lib/ielts/types.ts`)

```typescript
export type TestType = 'academic' | 'general'

export type ModuleType = 'listening' | 'reading' | 'writing' | 'speaking'

export interface BandScoreResult {
  correctAnswers: number
  bandScore: number
  module: 'listening' | 'reading'
  testType?: TestType
}

export interface OverallBandResult {
  listening: number
  reading: number
  writing: number
  speaking: number
  overall: number
}
```

### 2. Create band score lookup tables (`src/lib/ielts/band-score-tables.ts`)

Define three constant maps: `LISTENING_BAND_TABLE`, `READING_ACADEMIC_BAND_TABLE`, `READING_GENERAL_BAND_TABLE`.

Each maps `correctAnswers (0-40)` → `bandScore (0-9.0)`.

Source: Official British Council / IDP conversion tables.

```typescript
// Format: [minCorrect, maxCorrect, bandScore]
export const LISTENING_BAND_TABLE: [number, number, number][] = [
  [39, 40, 9.0],
  [37, 38, 8.5],
  [35, 36, 8.0],
  [33, 34, 7.5],
  [30, 32, 7.0],
  [27, 29, 6.5],
  [23, 26, 6.0],
  [20, 22, 5.5],
  [16, 19, 5.0],
  [13, 15, 4.5],
  [10, 12, 4.0],
  [6, 9, 3.5],
  [4, 5, 3.0],
  [3, 3, 2.5],
  [2, 2, 2.0],
  [1, 1, 1.0],
  [0, 0, 0.0],
]

// Similar for READING_ACADEMIC_BAND_TABLE and READING_GENERAL_BAND_TABLE
// Note: Reading Academic and General have DIFFERENT conversion thresholds
```

### 3. Implement band score calculation (`src/lib/ielts/calculate-band-score.ts`)

```typescript
export function calculateListeningBand(correctAnswers: number): number {
  // Validate input (0-40), lookup in LISTENING_BAND_TABLE
}

export function calculateReadingBand(
  correctAnswers: number,
  testType: TestType
): number {
  // Validate input (0-40), lookup in appropriate table based on testType
}
```

### 4. Implement overall band calculation (`src/lib/ielts/calculate-overall-band.ts`)

```typescript
export function calculateOverallBand(scores: {
  listening: number
  reading: number
  writing: number
  speaking: number
}): number {
  const avg = (scores.listening + scores.reading + scores.writing + scores.speaking) / 4
  // Round to nearest 0.5
  return Math.round(avg * 2) / 2
}
```

### 5. Create barrel export (`src/lib/ielts/index.ts`)

```typescript
export * from './types'
export * from './calculate-band-score'
export * from './calculate-overall-band'
export * from './band-score-tables'
```

## Todo List

- [ ] Create IELTS types
- [ ] Implement Listening band conversion table
- [ ] Implement Reading Academic band conversion table
- [ ] Implement Reading General Training band conversion table
- [ ] Implement `calculateListeningBand()` 
- [ ] Implement `calculateReadingBand()` with test type parameter
- [ ] Implement `calculateOverallBand()` with rounding logic
- [ ] Verify all band score edge cases (0 correct, 40 correct, boundary values)

## Success Criteria

- `calculateListeningBand(35)` returns `8.0`
- `calculateReadingBand(30, 'academic')` returns correct band
- `calculateOverallBand({ listening: 7.0, reading: 6.5, writing: 6.0, speaking: 7.0 })` returns `6.5`
- All functions handle invalid inputs gracefully (negative, >40, non-integer)

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Conversion table accuracy | Cross-reference multiple official sources (British Council, IDP) |
| Edge case: exactly 0 correct | Handle explicitly, return 0.0 band |

## Next Steps

→ Phase 3: Build calculator UI using these functions
