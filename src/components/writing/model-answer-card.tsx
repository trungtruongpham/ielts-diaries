'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ModelAnswerCardProps {
  modelAnswer: string
  taskLabel: string
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function ModelAnswerCard({ modelAnswer, taskLabel }: ModelAnswerCardProps) {
  const [open, setOpen] = useState(false)
  const wc = countWords(modelAnswer)

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-accent transition-colors"
      >
        <div>
          <p className="text-sm font-semibold text-foreground">
            {open ? '▲' : '▼'} Band 7–8 Model Answer · {taskLabel}
          </p>
          {!open && (
            <p className="text-xs text-muted-foreground mt-0.5">~{wc} words — click to reveal</p>
          )}
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="border-t border-border px-5 py-4 space-y-2">
          <p className="text-xs text-muted-foreground">~{wc} words</p>
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
            {modelAnswer}
          </pre>
        </div>
      )}
    </div>
  )
}
