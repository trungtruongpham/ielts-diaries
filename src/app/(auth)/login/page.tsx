import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'Sign In | IELTS Diaries',
  description: 'Sign in to your IELTS Diaries account to track your test results and progress.',
}

import { Suspense } from 'react'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-[400px] w-full animate-pulse rounded-xl bg-muted/40" />}>
      <LoginForm />
    </Suspense>
  )
}
