# IELTS Listening Practice Feature Complete

**Date**: 2026-05-01 18:22 UTC+7
**Severity**: High
**Component**: Listening Practice Module (core exam feature)
**Status**: Completed with minor fixes

## What Happened

Shipped the full IELTS Listening Practice feature across 9 implementation phases. 33 new files created: 4 database tables, 6 question type components, custom audio player, scoring engine, and results page. Feature spans Cambridge CAM 17–20 tests (~64 sections, 256 questions total when fully seeded). All architecture decisions validated during code review; two runtime bugs caught and fixed before merge.

## The Brutal Truth

This was a massive scope to ship in a single day — splitting into 6 question types, building a custom HTML5 audio player, and integrating Supabase storage all while enforcing strict TypeScript JSONB schemas. The real win: architecture held up under scrutiny. The scary part: we're storing answer keys in the database and even considered serializing them to client during exam. Caught that in review. The exhausting part: 16 test shells exist but contain *zero* actual question data. That's 33+ minutes of audio and 256 questions that need manual entry. We own that.

## Technical Details

**Database Schema** (`listening_tests`, `listening_sections`, `listening_questions`, `listening_attempts`):
- JSONB `question_data` per question type (flexible, but enforced by TS union discriminator `type` field)
- `answer_key` stored separately, never sent to client during exam
- Public Supabase Storage bucket for audio — CDN-delivered without signed-URL overhead

**Client State Management**:
- `useReducer` accumulates answers locally (no per-keystroke DB writes)
- Single server action submit with full answer set
- Scoring computed server-side only

**Audio Player Edge Cases**:
- Strict mode: play-once lock per section (no pause-rewind abuse)
- Practice mode: full replay + seek allowed
- HTML5 audio handler naming collision nearly broke state updates

**Answer Validation**:
- IELTS official band table (0–40 correct → 0–9.0 band score)
- Answer key *intentionally* visible in results page (personal practice tool, not high-stakes exam simulator)

## What We Tried

1. Initially considered lazy-loading answer keys during exam → rejected (security surface + latency)
2. Tried localStorage for answer persistence → rejected (lost on tab close, exam should be atomic)
3. Audio player pause/resume logic without strict mode → added lock to prevent rewinding during timed sections

## Root Cause Analysis: Two Runtime Bugs

**Bug #1: onEnded Handler Shadowing (CRITICAL)**
```typescript
// WRONG: local variable named onEnded shadows prop
const onEnded = () => {...}
useEffect(() => {
  element.addEventListener('ended', onEnded) // uses local, not prop
}, [])
```
The component accepted an `onEnded` prop but created a local variable with the same name. useEffect captured the wrong one. Lesson: ESLint didn't warn (prop unused). We need stricter unused-variable rules.

**Bug #2: Timer Display Frozen (HIGH)**
Timer was stored in `useRef` only. useRef doesn't trigger re-renders. Result: DOM showed "0:00" even as milliseconds accumulated. Fixed by splitting: `useRef` for submit action, `useState` for display. Lesson: Ref-driven UIs are a trap. Always ask "do I need a render?"

**Bug #3: Answer Key Serialization (NOTED, Not Fixed)**
During results fetch, answer keys ship in the RSC payload. This is fine for a personal practice tool where you *want* to see answers. But it's a decision, not a bug. Lesson: Document intentional security trade-offs, don't hide them.

## Lessons Learned

1. **JSONB Schema + TypeScript = Fortress**: Discriminated union types caught 0 schema mismatches. This pattern works. Use it for all flexible JSONB.

2. **useReducer Over setAnswer Loop**: Single server action submit beats per-keystroke DB traffic. For exam UX, this was the right call.

3. **Public Storage + CDN >>> Signed URLs**: No auth layer on audio delivery. Audio is copyrighted but routes are auth-gated anyway. This scales.

4. **Code Review Caught the Real Issues**: ESLint didn't flag the onEnded shadowing. Humans did. For hooks + refs + handlers, manual review is non-negotiable.

5. **Answer Keys Never Leave Server During Exam**: Serializing them to results page is fine (intentional reveal). During the exam itself — absolutely not.

## Next Steps

1. **Data Entry Pipeline** (owner: TBD, timeline: ongoing)
   - 16 test shells exist. 0 questions populated.
   - Provide seed structure documentation + example CAM 17 Section 1
   - Establish entry SLA (recommend: 2 tests/week)
   - is_published: false default prevents premature surfacing

2. **Copyright Compliance Audit** (owner: TBD, timeline: before public launch)
   - Verify S3 bucket + auth-gating satisfies CAM licensing
   - Document decision trail

3. **Performance Baseline** (owner: TBD, timeline: before scaling tests)
   - Measure audio player memory on 10+ sections loaded
   - Check Supabase Storage egress under load

4. **ESLint Upgrade** (owner: TBD, timeline: next sprint)
   - Enable `no-shadow` rule globally — caught the onEnded bug
   - Add custom rule for unused hook props

## Risk Register

- **CAM Audio Copyright**: Mitigated by auth-gating routes. Still a legal/licensing risk if tests scale to public.
- **Manual Data Entry Bottleneck**: 256 questions ≈ 8 hours of work. Plan for it.
- **Audio Player Edge Cases**: Mobile seek gesture untested. Desktop only so far.
- **Scoring Logic**: IELTS band table sourced from official data, but not audited by band examiner. Test before high-stakes use.

---

**Shipped by**: Trung Truong Pham
**Branch**: feature/listening-practice (merged to main)
**Files Created**: 33
**Database Tables**: 4 (net new)
**Components**: 6 question types + player + results
**Bugs Found/Fixed**: 2 critical + 1 noted
