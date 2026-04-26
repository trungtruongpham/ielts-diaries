'use client'

import dynamic from 'next/dynamic'

export const ScoreHistoryChart = dynamic(
  () => import('@/components/charts/score-history-chart').then(m => m.ScoreHistoryChart),
  {
    loading: () => <div className="h-[300px] animate-pulse rounded-xl bg-muted" />,
    ssr: false,
  }
)

export const ModuleRadarChart = dynamic(
  () => import('@/components/charts/module-radar-chart').then(m => m.ModuleRadarChart),
  {
    loading: () => <div className="h-[300px] animate-pulse rounded-xl bg-muted" />,
    ssr: false,
  }
)

export const GoalProgress = dynamic(
  () => import('@/components/goal/goal-progress').then(m => m.GoalProgress),
  {
    loading: () => <div className="h-[200px] animate-pulse rounded-xl bg-muted" />,
    ssr: false,
  }
)
