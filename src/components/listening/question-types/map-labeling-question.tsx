'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { MapLabelData, MapLabelKey } from '@/lib/db/types'

interface MapLabelingQuestionProps {
  questionNumber: number
  data: MapLabelData
  value: Record<string, string>
  onChange: (value: Record<string, string>) => void
  showReview?: boolean
  answerKey?: MapLabelKey
}

export function MapLabelingQuestion({
  questionNumber,
  data,
  value,
  onChange,
  showReview,
  answerKey,
}: MapLabelingQuestionProps) {
  const imageUrl = data.image_path.startsWith('http')
    ? data.image_path
    : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listening-audio/${data.image_path}`

  function handleSelect(labelId: string, selected: string) {
    if (showReview) return
    onChange({ ...value, [labelId]: selected })
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">
        <span className="mr-2 font-bold text-primary">{questionNumber}.</span>
        Label the diagram. Choose answers from the box.
      </p>

      {/* Desktop: image with positioned dropdowns */}
      <div className="relative hidden overflow-hidden rounded-xl border border-border sm:block">
        <div className="relative w-full">
          <Image
            src={imageUrl}
            alt="Map/diagram for labeling"
            width={600}
            height={400}
            className="w-full"
            unoptimized
          />

          {data.labels.map(label => {
            const selected = value[label.id]
            const correct = answerKey?.answers[label.id]
            const isCorrect = showReview && selected === correct
            const isWrong = showReview && !!selected && selected !== correct

            return (
              <div
                key={label.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${label.x}%`, top: `${label.y}%` }}
              >
                <select
                  value={selected ?? ''}
                  onChange={e => handleSelect(label.id, e.target.value)}
                  disabled={showReview}
                  className={cn(
                    'min-w-[100px] rounded-lg border px-2 py-1 text-xs font-medium shadow-sm outline-none transition-all',
                    showReview
                      ? isCorrect
                        ? 'border-green-500 bg-green-50 text-green-800'
                        : isWrong
                          ? 'border-red-500 bg-red-50 text-red-800'
                          : 'border-border bg-white'
                      : 'border-primary/60 bg-white text-foreground focus:ring-2 focus:ring-primary/30'
                  )}
                >
                  <option value="">Q{label.id}</option>
                  {label.options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {showReview && !isCorrect && correct && (
                  <div className="absolute left-full ml-1 top-0 whitespace-nowrap rounded bg-green-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
                    ✓ {correct}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile fallback: list inputs */}
      <div className="space-y-2 sm:hidden">
        <p className="text-xs text-muted-foreground">
          (View on larger screen for the map. Answer below:)
        </p>
        {data.labels.map(label => {
          const selected = value[label.id]
          const correct = answerKey?.answers[label.id]
          const isCorrect = showReview && selected === correct
          const isWrong = showReview && !!selected && selected !== correct

          return (
            <div key={label.id} className={cn(
              'flex items-center gap-3 rounded-xl border p-2.5',
              showReview && isCorrect ? 'border-green-400 bg-green-50' :
              showReview && isWrong ? 'border-red-400 bg-red-50' : 'border-border bg-card'
            )}>
              <span className="text-sm font-bold text-primary">Q{label.id}</span>
              <select
                value={selected ?? ''}
                onChange={e => handleSelect(label.id, e.target.value)}
                disabled={showReview}
                className="flex-1 rounded-lg border border-border bg-card px-2 py-1 text-sm outline-none"
              >
                <option value="">— Select —</option>
                {label.options.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              {showReview && !isCorrect && correct && (
                <span className="shrink-0 text-xs text-green-700">✓ {correct}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
