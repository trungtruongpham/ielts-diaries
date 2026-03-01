'use client'

import { useState } from 'react'
import { BAND_SCORE_OPTIONS, calculateOverallBand } from '@/lib/ielts'
import type { OverallBandInput } from '@/lib/ielts'
import { BandScoreDisplay } from './band-score-display'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Save } from 'lucide-react'

const MODULES: { key: keyof OverallBandInput; label: string; color: string }[] = [
  { key: 'listening', label: 'Listening', color: 'text-blue-600' },
  { key: 'reading', label: 'Reading', color: 'text-green-600' },
  { key: 'writing', label: 'Writing', color: 'text-amber-600' },
  { key: 'speaking', label: 'Speaking', color: 'text-red-600' },
]

interface OverallCalculatorProps {
  onSave?: (data: { scores: OverallBandInput; overall: number }) => void
  showSaveCTA?: boolean
  // Pre-fill listening/reading from calculator tabs
  prefill?: Partial<OverallBandInput>
}

export function OverallCalculator({
  onSave,
  showSaveCTA = true,
  prefill,
}: OverallCalculatorProps) {
  const [scores, setScores] = useState<OverallBandInput>({
    listening: prefill?.listening ?? 0,
    reading: prefill?.reading ?? 0,
    writing: prefill?.writing ?? 0,
    speaking: prefill?.speaking ?? 0,
  })

  const allFilled = Object.values(scores).every((v) => v > 0)
  const overall = allFilled ? calculateOverallBand(scores) : null

  const handleChange = (key: keyof OverallBandInput, value: string) => {
    setScores((prev) => ({ ...prev, [key]: parseFloat(value) }))
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardContent className="p-6">
          <h3 className="mb-1 font-semibold text-foreground">Module Band Scores</h3>
          <p className="mb-6 text-sm text-muted-foreground">
            Enter your band score for each module. Writing and Speaking are examiner-graded.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {MODULES.map(({ key, label, color }) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`score-${key}`} className={`text-sm font-semibold ${color}`}>
                  {label}
                </Label>
                <Select
                  value={scores[key].toString()}
                  onValueChange={(v) => handleChange(key, v)}
                >
                  <SelectTrigger
                    id={`score-${key}`}
                    className="w-full font-medium"
                  >
                    <SelectValue placeholder="Select band" />
                  </SelectTrigger>
                  <SelectContent>
                    {BAND_SCORE_OPTIONS.map((band) => (
                      <SelectItem key={band} value={band.toString()}>
                        {band.toFixed(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Per-module mini display */}
      {allFilled && (
        <div className="grid grid-cols-4 gap-2">
          {MODULES.map(({ key, label }) => (
            <BandScoreDisplay
              key={key}
              band={scores[key]}
              label={label}
              size="sm"
              showDescriptor={false}
            />
          ))}
        </div>
      )}

      {/* Overall result */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">
          {allFilled ? 'Overall Band Score' : 'Fill all 4 modules to see overall'}
        </h4>
        <BandScoreDisplay band={overall} label="Overall" size="lg" />
      </div>

      {/* Save CTA */}
      {showSaveCTA && allFilled && overall !== null && (
        <Button
          onClick={() => onSave?.({ scores, overall })}
          className="w-full gap-2 font-semibold"
          size="lg"
        >
          <Save className="h-4 w-4" />
          Save This Result
        </Button>
      )}

      {/* Info */}
      <div className="rounded-xl bg-muted/40 p-4 text-xs text-muted-foreground text-center">
        Overall = average of all 4 modules, rounded to nearest 0.5 per official IELTS rules.
      </div>
    </div>
  )
}
