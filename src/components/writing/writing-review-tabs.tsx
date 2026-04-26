'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface WritingReviewTabsProps {
  task1Content: ReactNode
  task2Content: ReactNode
}

export function WritingReviewTabs({ task1Content, task2Content }: WritingReviewTabsProps) {
  const [activeTab, setActiveTab] = useState<1 | 2>(1)

  return (
    <div>
      {/* Sticky tab switcher */}
      <div className="sticky top-0 z-10 -mx-4 px-4 pb-3 pt-1 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b border-border mb-6">
        <div className="flex gap-1 rounded-xl bg-muted p-1">
          <button
            onClick={() => setActiveTab(1)}
            className={cn(
              'flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
              activeTab === 1
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            📊 Task 1
          </button>
          <button
            onClick={() => setActiveTab(2)}
            className={cn(
              'flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
              activeTab === 2
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            📝 Task 2
          </button>
        </div>
      </div>

      <div>{activeTab === 1 ? task1Content : task2Content}</div>
    </div>
  )
}
