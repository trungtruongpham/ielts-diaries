'use client'

import { useState } from 'react'
import { calculateListeningBand } from '@/lib/ielts'
import { ScoreInput } from './score-input'
import { BandScoreDisplay } from './band-score-display'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Save } from 'lucide-react'

interface ListeningCalculatorProps {
  onSave?: (data: { correctAnswers: number; band: number }) => void
  showSaveCTA?: boolean
}

export function ListeningCalculator({ onSave, showSaveCTA = true }: ListeningCalculatorProps) {
  const [correct, setCorrect] = useState(0)
  const band = calculateListeningBand(correct)
  const hasResult = correct > 0

  return (
    <div className="space-y-6">
      {/* Input section */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Listening Score</h3>
            <span className="text-xs text-muted-foreground">40 questions total</span>
          </div>
          <p className="mb-6 text-sm text-muted-foreground">
            IELTS Listening has 40 questions. Enter how many you answered correctly.
          </p>
          <ScoreInput
            value={correct}
            onChange={setCorrect}
            max={40}
            label="Correct Answers"
          />
        </CardContent>
      </Card>

      {/* Result section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">Your Band Score</h4>
        <BandScoreDisplay band={band} label="Listening" />
      </div>

      {/* Save CTA */}
      {showSaveCTA && hasResult && (
        <Button
          onClick={() => onSave?.({ correctAnswers: correct, band })}
          className="w-full gap-2 font-semibold"
          size="lg"
        >
          <Save className="h-4 w-4" />
          Save This Result
        </Button>
      )}

      {/* Score reference table — collapsed hint */}
      <div className="rounded-xl bg-muted/40 p-4">
        <p className="text-xs text-muted-foreground text-center">
          <span className="font-semibold">Quick reference:</span>{' '}
          39–40 → 9.0 · 35–36 → 8.0 · 30–32 → 7.0 · 23–26 → 6.0 · 16–19 → 5.0
        </p>
      </div>
    </div>
  )
}
