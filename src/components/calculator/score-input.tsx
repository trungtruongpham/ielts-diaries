'use client'

import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface ScoreInputProps {
  value: number
  onChange: (value: number) => void
  max?: number
  label?: string
  className?: string
}

export function ScoreInput({
  value,
  onChange,
  max = 40,
  label = 'Number of Correct Answers',
  className,
}: ScoreInputProps) {
  const handleSliderChange = (vals: number[]) => onChange(vals[0])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseInt(e.target.value, 10)
    if (isNaN(raw)) return onChange(0)
    onChange(Math.max(0, Math.min(max, raw)))
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
        <Input
          type="number"
          min={0}
          max={max}
          value={value}
          onChange={handleInputChange}
          className="w-20 text-center font-semibold text-lg h-10 border-primary/30 focus-visible:ring-primary"
        />
      </div>
      <Slider
        min={0}
        max={max}
        step={1}
        value={[value]}
        onValueChange={handleSliderChange}
        className="cursor-pointer"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0</span>
        <span className="font-medium text-foreground">{value} / {max}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}
