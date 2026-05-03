import type { ListeningQuestionType, ListeningAnswerKey } from '@/lib/db/types'

// ── IELTS official band conversion table ─────────────────────────────────────
// Source: Cambridge IELTS official score conversion

const BAND_TABLE: [number, number, number][] = [
  [39, 40, 9.0],
  [37, 38, 8.5],
  [35, 36, 8.0],
  [32, 34, 7.5],
  [30, 31, 7.0],
  [26, 29, 6.5],
  [23, 25, 6.0],
  [18, 22, 5.5],
  [16, 17, 5.0],
  [13, 15, 4.5],
  [10, 12, 4.0],
  [8,   9, 3.5],
  [6,   7, 3.0],
  [4,   5, 2.5],
  [0,   3, 2.0],
]

export function correctCountToBand(correct: number): number {
  for (const [min, max, band] of BAND_TABLE) {
    if (correct >= min && correct <= max) return band
  }
  return 0
}

// ── Answer checking ───────────────────────────────────────────────────────────

function normalise(s: string): string {
  return s.trim().toLowerCase()
}

export function checkAnswer(
  questionType: ListeningQuestionType,
  userAnswer: string | string[] | undefined,
  answerKey: ListeningAnswerKey
): boolean {
  if (userAnswer === undefined || userAnswer === null) return false

  switch (questionType) {
    case 'multiple_choice': {
      if (typeof userAnswer !== 'string' || !userAnswer) return false
      const key = answerKey as { answer: string }
      return normalise(userAnswer) === normalise(key.answer)
    }

    case 'multiple_select': {
      const user = Array.isArray(userAnswer) ? userAnswer : [userAnswer]
      const key = answerKey as { answers: string[] }
      if (user.length !== key.answers.length) return false
      const userSet = new Set(user.map(normalise))
      return key.answers.every(a => userSet.has(normalise(a)))
    }

    case 'fill_blank':
    case 'table_fill': {
      if (typeof userAnswer !== 'string' || !userAnswer.trim()) return false
      const key = answerKey as { acceptable: string[] }
      return key.acceptable.some(a => normalise(a) === normalise(userAnswer))
    }

    case 'matching': {
      // userAnswer is a JSON-stringified Record<number, string>
      const raw = typeof userAnswer === 'string' ? userAnswer : ''
      let userMatches: Record<number, string>
      try { userMatches = JSON.parse(raw) } catch { return false }

      const key = answerKey as { matches: Record<number, string> }
      return Object.entries(key.matches).every(([idx, correct]) => {
        const user = userMatches[Number(idx)]
        return user && normalise(user) === normalise(correct)
      })
    }

    case 'map_label': {
      const raw = typeof userAnswer === 'string' ? userAnswer : ''
      let userLabels: Record<string, string>
      try { userLabels = JSON.parse(raw) } catch { return false }

      const key = answerKey as { answers: Record<string, string> }
      return Object.entries(key.answers).every(([id, correct]) => {
        const user = userLabels[id]
        return user && normalise(user) === normalise(correct)
      })
    }

    default:
      return false
  }
}
