'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signIn(formData: FormData, redirectTo: string = '/dashboard') {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  // Use explicit app URL from env (best for Next.js behind proxies/ngrok)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''

  revalidatePath('/', 'layout')
  redirect(`${appUrl}${redirectTo}`)
}

export async function signUp(formData: FormData, redirectTo: string = '/dashboard') {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signUp({ email, password })

  if (error) {
    return { error: error.message }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''

  revalidatePath('/', 'layout')
  redirect(`${appUrl}${redirectTo}`)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''

  revalidatePath('/', 'layout')
  redirect(`${appUrl}/`)
}

