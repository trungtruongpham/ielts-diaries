'use client'

import * as React from 'react'
import { format, parseISO, isValid } from 'date-fns'
import { CalendarIcon, X } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  /** Controlled value as 'YYYY-MM-DD' string (or empty string) */
  value?: string
  onChange?: (value: string) => void
  /** Placeholder text shown when no date is selected */
  placeholder?: string
  /** Disable dates before this date */
  minDate?: Date
  /** Disable dates after this date */
  maxDate?: Date
  /** Allow clearing the date */
  clearable?: boolean
  className?: string
  /** ID forwarded to the trigger button for label association */
  id?: string
  disabled?: boolean
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  minDate,
  maxDate,
  clearable = true,
  className,
  id,
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Parse the controlled string value into a Date object
  const selected = React.useMemo(() => {
    if (!value) return undefined
    const d = parseISO(value)
    return isValid(d) ? d : undefined
  }, [value])

  const handleSelect = (date: Date | undefined) => {
    onChange?.(date ? format(date, 'yyyy-MM-dd') : '')
    if (date) setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={selected ? format(selected, 'PPP') : placeholder}
          className={cn(
            'h-10 w-full justify-start gap-2 font-normal',
            !selected && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0 opacity-60" />
          <span className="flex-1 truncate text-left">
            {selected ? format(selected, 'MMM d, yyyy') : placeholder}
          </span>
          {clearable && selected && (
            <X
              className="h-3.5 w-3.5 shrink-0 opacity-50 hover:opacity-100 transition-opacity"
              onClick={handleClear}
              role="button"
              aria-label="Clear date"
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          defaultMonth={selected}
          disabled={(date) => {
            if (minDate && date < minDate) return true
            if (maxDate && date > maxDate) return true
            return false
          }}
          initialFocus
          className="rounded-xl"
        />
      </PopoverContent>
    </Popover>
  )
}
