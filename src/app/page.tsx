import Link from 'next/link'
import { ArrowRight, BarChart3, Calculator, Target, TrendingUp, BookOpen, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 sm:py-32">
        {/* Background decorative blobs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 right-0 h-[500px] w-[500px] rounded-full opacity-20"
          style={{
            background:
              'radial-gradient(circle, oklch(0.623 0.214 259.8) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 left-0 h-[300px] w-[300px] rounded-full opacity-10"
          style={{
            background:
              'radial-gradient(circle, oklch(0.6 0.22 293) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />

        <div className="container relative mx-auto max-w-4xl text-center">
          <Badge className="mb-6 bg-primary/10 text-primary hover:bg-primary/15 border-0">
            🎯 Free IELTS Score Tracker
          </Badge>

          <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Track Your IELTS Journey.{' '}
            <span className="text-primary">Reach Your Goal.</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Calculate your band scores instantly, log every test result, set your target, and
            watch your progress grow — all in one place.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" asChild className="gap-2 px-8 text-base font-semibold">
              <Link href="/calculator">
                <Calculator className="h-5 w-5" />
                Calculate My Score
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="gap-2 px-8 text-base font-semibold">
              <Link href="/register">
                Start Tracking Free
              </Link>
            </Button>
          </div>

          {/* Social proof pills */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
            {['No sign-up for calculator', 'Listening & Reading bands', 'Overall band calculator', 'Progress dashboard'].map(
              (item) => (
                <div key={item} className="flex items-center gap-1.5 rounded-full bg-card border border-border px-3 py-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  {item}
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-20 bg-card">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <h2 className="mb-3 text-3xl font-bold">Everything you need to succeed</h2>
            <p className="text-muted-foreground text-lg">
              Simple, focused tools built for IELTS test-takers.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="card-hover border-border/60 animate-fade-up"
              >
                <CardContent className="p-6">
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.iconBg}`}>
                    <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                  {feature.href && (
                    <Link
                      href={feature.href}
                      className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:gap-2 transition-all"
                    >
                      Try it free <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20">
        <div className="container mx-auto max-w-2xl text-center">
          <div className="rounded-2xl bg-primary/5 border border-primary/20 p-10">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h2 className="mb-3 text-3xl font-bold">Ready to start your IELTS journey?</h2>
            <p className="mb-8 text-muted-foreground">
              Create a free account to save your results, set goals, and track your progress.
            </p>
            <Button size="lg" asChild className="gap-2 px-10 text-base font-semibold">
              <Link href="/register">
                Get Started — It&apos;s Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

const features = [
  {
    icon: Calculator,
    title: 'Instant Band Score Calculator',
    description:
      'Enter your correct answers and instantly get your Listening or Reading band score. Supports both Academic and General Training.',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    href: '/calculator',
  },
  {
    icon: Target,
    title: 'Goal Setting',
    description:
      'Set target band scores for each module and a deadline. Track exactly how far you are from your dream score.',
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-500',
    href: '/register',
  },
  {
    icon: TrendingUp,
    title: 'Score History',
    description:
      'Log every test attempt and watch your progress on a beautiful line chart. Spot trends and identify areas to improve.',
    iconBg: 'bg-green-50',
    iconColor: 'text-green-500',
    href: '/register',
  },
  {
    icon: BarChart3,
    title: 'Progress Dashboard',
    description:
      'Your personal analytics hub. See all modules at a glance, compare against your target, and celebrate every gain.',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    href: '/register',
  },
  {
    icon: BookOpen,
    title: 'Academic & General',
    description:
      'Supports both IELTS Academic and General Training Reading band conversion — because they use different score tables.',
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-500',
    href: '/calculator',
  },
  {
    icon: CheckCircle2,
    title: 'Free to Use',
    description:
      'The calculator is always free — no account needed. Sign up to unlock result tracking, goals, and your dashboard.',
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-500',
    href: null,
  },
]
