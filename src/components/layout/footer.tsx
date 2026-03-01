import Link from 'next/link'
import { BookOpen } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
            <BookOpen className="h-3 w-3 text-primary-foreground" />
          </div>
          <span>
            <span className="font-semibold text-foreground">IELTS Diaries</span> — Track your journey to success
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/calculator" className="hover:text-primary transition-colors">
            Calculator
          </Link>
          <Link href="/login" className="hover:text-primary transition-colors">
            Sign In
          </Link>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  )
}
