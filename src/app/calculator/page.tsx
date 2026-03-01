import { CalculatorTabs } from '@/components/calculator/calculator-tabs'
import { Calculator, Info } from 'lucide-react'

export default function CalculatorPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      {/* Page header */}
      <div className="mb-10 text-center animate-fade-up">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Calculator className="h-7 w-7 text-primary" />
        </div>
        <h1 className="mb-3 text-3xl font-bold">Band Score Calculator</h1>
        <p className="text-muted-foreground">
          Enter your correct answers and get your band score instantly.{' '}
          <span className="font-medium text-foreground">No sign-up required.</span>
        </p>
      </div>

      {/* Calculator tabs */}
      <CalculatorTabs />

      {/* Footer note */}
      <div className="mt-10 flex items-start gap-2 rounded-xl bg-muted/40 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          Band scores are calculated using official conversion tables from British Council / IDP.
          Results are for guidance only.{' '}
          <span className="font-medium text-foreground">Sign up free</span> to save your results
          and track your progress over time.
        </p>
      </div>
    </div>
  )
}
