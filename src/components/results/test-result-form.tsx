'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createTestResult, updateTestResult } from '@/app/dashboard/results/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  calculateListeningBand, calculateReadingBand, calculateOverallBand,
  BAND_SCORE_OPTIONS,
} from '@/lib/ielts'
import type { TestType } from '@/lib/ielts'
import type { DbTestResult } from '@/lib/db/types'
import { getBandColorClass } from '@/lib/ielts'
import { Loader2, Headphones, BookOpen, Pen, Mic, Calculator, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Cambridge practice book presets (quick-fill chips)
const CAM_PRESETS = [
  ...([14, 15, 16, 17, 18, 19, 20].flatMap((book) =>
    ([1, 2, 3, 4] as const).map((test) => `CAM ${book} Test ${test}`)
  )),
]

interface TestResultFormProps {
  /** If provided, form is in edit mode */
  existing?: DbTestResult
}

type InputMode = 'correct' | 'band'

export function TestResultForm({ existing }: TestResultFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isEdit = !!existing

  // Form state
  const [testDate, setTestDate] = useState(
    existing?.test_date ?? new Date().toISOString().slice(0, 10)
  )
  const [testType, setTestType] = useState<TestType>(existing?.test_type ?? 'academic')
  const [resultName, setResultName] = useState(existing?.result_name ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')

  // Listening — prefer correct answers input if available
  const [listeningMode, setListeningMode] = useState<InputMode>(
    existing?.listening_correct != null ? 'correct' : 'band'
  )
  const [listeningCorrect, setListeningCorrect] = useState(existing?.listening_correct ?? 0)
  const [listeningBandManual, setListeningBandManual] = useState(
    existing?.listening_band?.toString() ?? '0'
  )

  // Reading
  const [readingMode, setReadingMode] = useState<InputMode>(
    existing?.reading_correct != null ? 'correct' : 'band'
  )
  const [readingCorrect, setReadingCorrect] = useState(existing?.reading_correct ?? 0)
  const [readingBandManual, setReadingBandManual] = useState(
    existing?.reading_band?.toString() ?? '0'
  )

  // Writing + Speaking (examiner-graded — only band)
  const [writingBand, setWritingBand] = useState(existing?.writing_band?.toString() ?? '0')
  const [speakingBand, setSpeakingBand] = useState(existing?.speaking_band?.toString() ?? '0')

  // Derived live preview
  const listeningPreview =
    listeningMode === 'correct' && listeningCorrect > 0
      ? calculateListeningBand(listeningCorrect)
      : listeningBandManual !== '0' ? parseFloat(listeningBandManual) : null

  const readingPreview =
    readingMode === 'correct' && readingCorrect > 0
      ? calculateReadingBand(readingCorrect, testType)
      : readingBandManual !== '0' ? parseFloat(readingBandManual) : null

  const writingPreview  = writingBand  !== '0' ? parseFloat(writingBand)  : null
  const speakingPreview = speakingBand !== '0' ? parseFloat(speakingBand) : null

  const allFourBands = [listeningPreview, readingPreview, writingPreview, speakingPreview]
  const filledBands = allFourBands.filter((b): b is number => b !== null)
  const overallPreview =
    filledBands.length === 4
      ? calculateOverallBand({
          listening: listeningPreview!,
          reading: readingPreview!,
          writing: writingPreview!,
          speaking: speakingPreview!,
        })
      : filledBands.length > 0
      ? Math.round((filledBands.reduce((a, b) => a + b, 0) / filledBands.length) * 2) / 2
      : null

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = isEdit
        ? await updateTestResult(existing!.id, fd)
        : await createTestResult(fd)

      if (result?.error) {
        toast.error('Error saving result', { description: result.error })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Hidden fields for derived values */}
      {listeningMode === 'correct' && <input type="hidden" name="listening_correct" value={listeningCorrect} />}
      {listeningMode === 'band'    && <input type="hidden" name="listening_band"    value={listeningBandManual} />}
      {readingMode === 'correct'   && <input type="hidden" name="reading_correct"   value={readingCorrect} />}
      {readingMode === 'band'      && <input type="hidden" name="reading_band"      value={readingBandManual} />}
      <input type="hidden" name="writing_band"  value={writingBand} />
      <input type="hidden" name="speaking_band" value={speakingBand} />

      {/* ── Test Details ─────────────────────────── */}
      <Card className="border-border/60">
        <CardContent className="p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Test Details</h3>

          {/* Result Name */}
          <div className="space-y-2">
            <Label htmlFor="result_name" className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Test Name
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="result_name"
              name="result_name"
              value={resultName}
              onChange={(e) => setResultName(e.target.value)}
              placeholder="e.g. CAM 18 Test 2, Mock test…"
              className="h-10"
              maxLength={80}
            />
            {/* CAM Quick-pick chips — show last 3 books × 4 tests = 12 */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {CAM_PRESETS.slice(-12).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setResultName(preset)}
                  className={cn(
                    'rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all',
                    resultName === preset
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-muted/40 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  )}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="test_date">Test Date</Label>
              {/* Hidden input so FormData still carries test_date */}
              <input type="hidden" name="test_date" value={testDate} />
              <DatePicker
                id="test_date"
                value={testDate}
                onChange={(v) => setTestDate(v)}
                placeholder="Pick test date"
                maxDate={new Date()}
                clearable={false}
              />
            </div>
            <div className="space-y-2">
              <Label>Test Type</Label>
              <RadioGroup
                name="test_type"
                value={testType}
                onValueChange={(v) => setTestType(v as TestType)}
                className="flex gap-3"
              >
                {(['academic', 'general'] as TestType[]).map((t) => (
                  <Label
                    key={t}
                    htmlFor={`form-type-${t}`}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all',
                      testType === t ? 'border-primary bg-primary/5 font-semibold text-primary' : 'border-border text-muted-foreground hover:border-primary/30'
                    )}
                  >
                    <RadioGroupItem id={`form-type-${t}`} value={t} />
                    <span className="capitalize">{t}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Module Scores ─────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Listening */}
        <ModuleCard
          icon={<Headphones className="h-4 w-4" />}
          label="Listening"
          color="text-blue-600"
          iconBg="bg-blue-50"
          mode={listeningMode}
          onModeChange={setListeningMode}
          correct={listeningCorrect}
          onCorrectChange={setListeningCorrect}
          bandManual={listeningBandManual}
          onBandChange={setListeningBandManual}
          preview={listeningPreview}
        />

        {/* Reading */}
        <ModuleCard
          icon={<BookOpen className="h-4 w-4" />}
          label="Reading"
          color="text-green-600"
          iconBg="bg-green-50"
          mode={readingMode}
          onModeChange={setReadingMode}
          correct={readingCorrect}
          onCorrectChange={setReadingCorrect}
          bandManual={readingBandManual}
          onBandChange={setReadingBandManual}
          preview={readingPreview}
        />

        {/* Writing */}
        <ModuleCard
          icon={<Pen className="h-4 w-4" />}
          label="Writing"
          color="text-amber-600"
          iconBg="bg-amber-50"
          mode="band"
          onModeChange={() => {}}
          correct={0}
          onCorrectChange={() => {}}
          bandManual={writingBand}
          onBandChange={setWritingBand}
          preview={writingPreview}
          bandOnly
        />

        {/* Speaking */}
        <ModuleCard
          icon={<Mic className="h-4 w-4" />}
          label="Speaking"
          color="text-red-600"
          iconBg="bg-red-50"
          mode="band"
          onModeChange={() => {}}
          correct={0}
          onCorrectChange={() => {}}
          bandManual={speakingBand}
          onBandChange={setSpeakingBand}
          preview={speakingPreview}
          bandOnly
        />
      </div>

      {/* ── Overall Preview ───────────────────────────── */}
      {overallPreview !== null && (
        <Card className={cn('border-2 animate-score-reveal', getBandColorClass(overallPreview).bg, getBandColorClass(overallPreview).border)}>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calculator className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Calculated Overall</p>
                <p className="text-xs text-muted-foreground">
                  {filledBands.length < 4 ? `Based on ${filledBands.length} module(s)` : 'Official IELTS formula'}
                </p>
              </div>
            </div>
            <span className={cn('text-4xl font-bold tabular-nums', getBandColorClass(overallPreview).text)}>
              {overallPreview.toFixed(1)}
            </span>
          </CardContent>
        </Card>
      )}

      {/* ── Notes ────────────────────────────────────── */}
      <Card className="border-border/60">
        <CardContent className="p-5 space-y-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="What went well? What to improve next time?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </CardContent>
      </Card>

      {/* ── Actions ──────────────────────────────────── */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" className="flex-1 font-semibold" disabled={isPending || filledBands.length === 0}>
          {isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isEdit ? 'Saving…' : 'Adding…'}</>
          ) : (
            isEdit ? 'Save Changes' : 'Add Result'
          )}
        </Button>
      </div>
    </form>
  )
}

// ── ModuleCard sub-component ─────────────────────────────────────────────────
interface ModuleCardProps {
  icon: React.ReactNode
  label: string
  color: string
  iconBg: string
  mode: InputMode
  onModeChange: (m: InputMode) => void
  correct: number
  onCorrectChange: (v: number) => void
  bandManual: string
  onBandChange: (v: string) => void
  preview: number | null
  bandOnly?: boolean
}

function ModuleCard({
  icon, label, color, iconBg,
  mode, onModeChange, correct, onCorrectChange,
  bandManual, onBandChange, preview, bandOnly,
}: ModuleCardProps) {
  const colors = preview !== null ? getBandColorClass(preview) : null

  return (
    <Card className="border-border/60">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn('flex h-7 w-7 items-center justify-center rounded-md', iconBg)}>
              <span className={color}>{icon}</span>
            </div>
            <span className={cn('text-sm font-semibold', color)}>{label}</span>
          </div>
          {preview !== null && (
            <Badge variant="outline" className={cn('font-bold tabular-nums text-base px-2', colors?.text, colors?.bg, colors?.border)}>
              {preview.toFixed(1)}
            </Badge>
          )}
        </div>

        {!bandOnly && (
          <>
            <div className="flex rounded-lg bg-muted/50 p-0.5 text-xs">
              {(['correct', 'band'] as InputMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onModeChange(m)}
                  className={cn(
                    'flex-1 rounded-md py-1 font-medium transition-all capitalize',
                    mode === m ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {m === 'correct' ? '# Correct' : 'Band Score'}
                </button>
              ))}
            </div>
            <Separator />
          </>
        )}

        {!bandOnly && mode === 'correct' ? (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Correct Answers (0–40)</Label>
            <Input
              type="number"
              min={0}
              max={40}
              value={correct}
              onChange={(e) => onCorrectChange(Math.max(0, Math.min(40, Number(e.target.value))))}
              className="h-9 text-center font-semibold"
            />
          </div>
        ) : (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Band Score</Label>
            <Select value={bandManual} onValueChange={onBandChange}>
              <SelectTrigger className="h-9 font-medium">
                <SelectValue placeholder="Select band" />
              </SelectTrigger>
              <SelectContent>
                {BAND_SCORE_OPTIONS.map((b) => (
                  <SelectItem key={b} value={b.toString()}>
                    {b.toFixed(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
