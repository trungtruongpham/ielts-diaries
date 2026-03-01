'use client'

import { useState } from 'react'
import { calculateReadingBand } from '@/lib/ielts'
import type { TestType } from '@/lib/ielts'
import { ScoreInput } from './score-input'
import { BandScoreDisplay } from './band-score-display'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Save } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReadingCalculatorProps {
  onSave?: (data: { correctAnswers: number; band: number; testType: TestType }) => void
  showSaveCTA?: boolean
}

export function ReadingCalculator({ onSave, showSaveCTA = true }: ReadingCalculatorProps) {
  const [correct, setCorrect] = useState(0)
  const [testType, setTestType] = useState<TestType>('academic')
  const band = calculateReadingBand(correct, testType)
  const hasResult = correct > 0

  return (
    <div className="space-y-6">
      {/* Test type selector */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <div className="mb-4">
            <h3 className="font-semibold text-foreground mb-1">Test Type</h3>
            <p className="text-sm text-muted-foreground">
              Academic and General Training use different conversion tables.
            </p>
          </div>
          <RadioGroup
            value={testType}
            onValueChange={(v) => setTestType(v as TestType)}
            className="grid grid-cols-2 gap-3"
          >
            {(['academic', 'general'] as TestType[]).map((type) => (
              <Label
                key={type}
                htmlFor={`type-${type}`}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all',
                  testType === type
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40 hover:bg-muted/30'
                )}
              >
                <RadioGroupItem id={`type-${type}`} value={type} />
                <div>
                  <p className="font-semibold capitalize text-foreground">{type}</p>
                  <p className="text-xs text-muted-foreground">
                    {type === 'academic' ? 'IELTS Academic' : 'General Training'}
                  </p>
                </div>
              </Label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Input section */}
      <Card className="border-border/60">
        <CardContent className="p-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Reading Score</h3>
            <span className="text-xs text-muted-foreground">40 questions total</span>
          </div>
          <p className="mb-6 text-sm text-muted-foreground">
            IELTS Reading has 40 questions. Enter how many you answered correctly.
          </p>
          <ScoreInput
            value={correct}
            onChange={setCorrect}
            max={40}
            label="Correct Answers"
          />
        </CardContent>
      </Card>

      {/* Result */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">
          Your Band Score ({testType === 'academic' ? 'Academic' : 'General Training'})
        </h4>
        <BandScoreDisplay band={band} label="Reading" />
      </div>

      {/* Save CTA */}
      {showSaveCTA && hasResult && (
        <Button
          onClick={() => onSave?.({ correctAnswers: correct, band, testType })}
          className="w-full gap-2 font-semibold"
          size="lg"
        >
          <Save className="h-4 w-4" />
          Save This Result
        </Button>
      )}

      {/* Quick reference */}
      <div className="rounded-xl bg-muted/40 p-4">
        <p className="text-xs text-muted-foreground text-center">
          <span className="font-semibold">Academic quick ref:</span>{' '}
          39–40 → 9.0 · 35–36 → 8.0 · 30–32 → 7.0 · 23–26 → 6.0 · 15–18 → 5.0
        </p>
      </div>
    </div>
  )
}
