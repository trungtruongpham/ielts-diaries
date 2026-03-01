import type { Metadata } from 'next'
import { RegisterForm } from '@/components/auth/register-form'

export const metadata: Metadata = {
  title: 'Create Account | IELTS Diaries',
  description: 'Create a free IELTS Diaries account to save test results, set goals, and track your progress.',
}

export default function RegisterPage() {
  return <RegisterForm />
}
