import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUserTestResults, getRecentTestResults } from '@/lib/db/test-results'
import { getUserGoal } from '@/lib/db/user-goals'
import { getRecentSpeakingSessions } from '@/app/dashboard/speaking/actions'
import { getBandColorClass, getBandDescriptor } from '@/lib/ielts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScoreHistoryChart } from '@/components/charts/score-history-chart'
import { ModuleRadarChart } from '@/components/charts/module-radar-chart'
import { GoalProgress } from '@/components/goal/goal-progress'
import {
  LayoutDashboard, Plus, ClipboardList, Target as TargetIcon,
  ArrowRight, TrendingUp, Headphones, BookOpen, Mic,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard | IELTS Diaries',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/dashboard')

  const [allResults, goal, recentSpeaking] = await Promise.all([
    getUserTestResults(),      // all — for charts
    getUserGoal(),
    getRecentSpeakingSessions(3),
  ])

  const recentResults = allResults.slice(0, 5)
  const latest = allResults[0] ?? null

  const statCards = [
    {
      label: 'Overall Band',
      value: latest ? latest.overall_band.toFixed(1) : '—',
      band: latest?.overall_band ?? null,
      sub:  latest ? getBandDescriptor(latest.overall_band) : 'No results yet',
      icon: LayoutDashboard,
    },
    {
      label: 'Listening',
      value: latest?.listening_band != null ? latest.listening_band.toFixed(1) : '—',
      band: latest?.listening_band ?? null,
      sub: 'Latest result',
      icon: Headphones,
    },
    {
      label: 'Reading',
      value: latest?.reading_band != null ? latest.reading_band.toFixed(1) : '—',
      band: latest?.reading_band ?? null,
      sub: 'Latest result',
      icon: BookOpen,
    },
    {
      label: 'Target',
      value: goal ? goal.target_overall.toFixed(1) : '—',
      band: goal?.target_overall ?? null,
      sub: goal?.target_date ? `By ${format(new Date(goal.target_date), 'MMM yyyy')}` : 'No deadline',
      icon: TargetIcon,
    },
  ]

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 animate-fade-up flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <LayoutDashboard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <Button asChild className="gap-2 font-semibold w-fit">
          <Link href="/dashboard/results/new">
            <Plus className="h-4 w-4" />
            Add Result
          </Link>
        </Button>
      </div>

      {/* ── Stat cards ──────────────────────────────── */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-up">
        {statCards.map(({ label, value, band, sub, icon: Icon }) => {
          const colors = band !== null ? getBandColorClass(band) : null
          return (
            <Card key={label} className={cn('border-border/60 card-hover', colors?.bg)}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-muted-foreground">{label}</p>
                  <Icon className={cn('h-4 w-4', colors?.text ?? 'text-muted-foreground')} />
                </div>
                <p className={cn('text-3xl font-bold tabular-nums', colors?.text ?? 'text-muted-foreground')}>{value}</p>
                <p className={cn('mt-1 text-xs', colors?.text ? colors.text + '/70' : 'text-muted-foreground')}>{sub}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ── Charts row ──────────────────────────────── */}
      <div className="mb-8 grid gap-6 lg:grid-cols-3 animate-fade-up">
        {/* Score history line chart — 2/3 width */}
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Score History
              </CardTitle>
              <Link href="/dashboard/results" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <ScoreHistoryChart results={allResults} goal={goal} />
          </CardContent>
        </Card>

        {/* Radar chart — 1/3 width */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Module Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <ModuleRadarChart latest={latest} goal={goal} />
          </CardContent>
        </Card>
      </div>

      {/* ── Bottom row: Recent results + Goal progress ── */}
      <div className="grid gap-6 lg:grid-cols-3 animate-fade-up">
        {/* Recent results — 2/3 */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Recent Results</h2>
            <Link href="/dashboard/results" className="flex items-center gap-1 text-sm text-primary hover:underline">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-12 text-center">
              <ClipboardList className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="font-medium">No results yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Start by adding your first test result.</p>
              <Button asChild className="mt-4 gap-2 font-semibold">
                <Link href="/dashboard/results/new"><Plus className="h-4 w-4" />Add First Result</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentResults.map((r) => {
                const colors = getBandColorClass(r.overall_band)
                return (
                  <div key={r.id} className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 card-hover">
                    <div className={cn('flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border-2', colors.bg, colors.border)}>
                      <span className={cn('text-lg font-bold tabular-nums leading-none', colors.text)}>
                        {r.overall_band.toFixed(1)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">
                        {r.result_name ?? format(new Date(r.test_date), 'MMM d, yyyy')}
                      </p>
                      {r.result_name && (
                        <p className="text-[11px] text-muted-foreground">{format(new Date(r.test_date), 'MMM d, yyyy')}</p>
                      )}
                      <div className="flex gap-3 mt-0.5 text-xs">
                        {r.listening_band !== null && <span className="text-blue-500 font-semibold">L {r.listening_band.toFixed(1)}</span>}
                        {r.reading_band   !== null && <span className="text-green-500 font-semibold">R {r.reading_band.toFixed(1)}</span>}
                        {r.writing_band   !== null && <span className="text-amber-500 font-semibold">W {r.writing_band.toFixed(1)}</span>}
                        {r.speaking_band  !== null && <span className="text-red-500 font-semibold">S {r.speaking_band.toFixed(1)}</span>}
                      </div>
                    </div>
                    <Link href={`/dashboard/results/${r.id}/edit`} className="text-xs text-muted-foreground hover:text-primary transition-colors shrink-0">Edit</Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Goal progress — 1/3 */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Goal Progress</h2>
            <Link href="/dashboard/goal" className="text-xs text-primary hover:underline">Edit goal</Link>
          </div>
          {goal ? (
            <GoalProgress goal={goal} latest={latest} />
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-12 text-center">
              <TargetIcon className="mb-3 h-7 w-7 text-muted-foreground" />
              <p className="font-medium text-sm">No goal set</p>
              <p className="mt-1 text-xs text-muted-foreground">Set a target to track your progress.</p>
              <Button asChild variant="outline" className="mt-4 gap-2 text-sm">
                <Link href="/dashboard/goal"><TargetIcon className="h-3.5 w-3.5" />Set Goal</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
      {/* ── Speaking Practice widget ──────────────────── */}
      <div className="mt-8 animate-fade-up">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold text-foreground">
            <Mic className="h-4 w-4 text-primary" />
            Speaking Practice
          </h2>
          <Link href="/dashboard/speaking" className="flex items-center gap-1 text-sm text-primary hover:underline">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentSpeaking.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-10 text-center">
            <Mic className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No speaking sessions yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Practice your speaking skills with an AI examiner.</p>
            <Button asChild className="mt-4 gap-2 font-semibold">
              <Link href="/speaking"><Mic className="h-4 w-4" />Start Practice</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentSpeaking.map((s) => {
              const band = s.overall_band
              const colors = band !== null ? getBandColorClass(band) : null
              return (
                <Link
                  key={s.id}
                  href={`/dashboard/speaking/${s.id}`}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 card-hover"
                >
                  <div className={cn('flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border-2', colors?.bg ?? 'bg-muted', colors?.border ?? 'border-border')}>
                    <Mic className={cn('h-3 w-3 mb-0.5', colors?.text ?? 'text-muted-foreground')} />
                    <span className={cn('text-lg font-bold tabular-nums leading-none', colors?.text ?? 'text-muted-foreground')}>
                      {band != null ? band.toFixed(1) : '—'}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium capitalize text-foreground">{s.topic ?? 'Speaking Practice'}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(s.created_at), 'MMM d, yyyy')}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              )
            })}
            <Link
              href="/speaking"
              className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm font-medium text-primary hover:bg-muted/30"
            >
              <Plus className="h-4 w-4" /> New Practice Session
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
