import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WritingClientPage } from '@/components/writing/writing-client-page'

export default async function WritingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/writing')
  return <WritingClientPage />
}
