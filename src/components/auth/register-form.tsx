'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { signUp } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { GoogleAuthButton } from '@/components/auth/google-auth-button'
import { CheckCircle2, BookOpen, Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const PERKS = [
  'Save unlimited test results',
  'Set target band scores & deadlines',
  'Track progress with charts',
]

export function RegisterForm() {
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string
    const confirm = formData.get('confirm') as string

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    startTransition(async () => {
      const result = await signUp(formData)
      if (result?.error) {
        setError(result.error)
        toast.error('Registration failed', { description: result.error })
      }
    })
  }

  return (
    <Card className="w-full max-w-md shadow-lg border-border/60">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <BookOpen className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>Start tracking your IELTS journey for free</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Perks */}
        <div className="rounded-xl bg-primary/5 border border-primary/15 px-4 py-3">
          <ul className="space-y-1">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                {perk}
              </li>
            ))}
          </ul>
        </div>

        {/* Google OAuth */}
        <GoogleAuthButton label="Sign up with Google" />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-card px-2 text-muted-foreground">or register with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reg-email">Email</Label>
            <Input
              id="reg-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-password">Password</Label>
            <div className="relative">
              <Input
                id="reg-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                required
                autoComplete="new-password"
                className="h-11 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-confirm">Confirm Password</Label>
            <Input
              id="reg-confirm"
              name="confirm"
              type={showPassword ? 'text' : 'password'}
              placeholder="Repeat password"
              required
              autoComplete="new-password"
              className="h-11"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full h-11 font-semibold" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account…
              </>
            ) : (
              'Create Free Account'
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
