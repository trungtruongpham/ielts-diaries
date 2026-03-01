import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'Sign In | IELTS Diaries',
  description: 'Sign in to your IELTS Diaries account to track your test results and progress.',
}

export default function LoginPage() {
  return <LoginForm />
}
