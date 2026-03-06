import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Google OAuth callback handler
// Supabase redirects here with ?code= after successful OAuth
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  // Prefer explicit URL from env (best for Next.js behind proxies/ngrok)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${appUrl}${next}`)
    }
  }

  // On error, redirect to login with error param
  return NextResponse.redirect(`${appUrl}/login?error=auth_callback_failed`)
}
