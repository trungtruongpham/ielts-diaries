import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPublishedListeningTests } from '@/lib/db/listening-tests'
import { getUserListeningAttempts } from '@/lib/db/listening-attempts'
import { ListeningLobby } from '@/components/listening/listening-lobby'

export default async function ListeningPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/sign-in?next=/listening')

  const [tests, attempts] = await Promise.all([
    getPublishedListeningTests(),
    getUserListeningAttempts(5),
  ])

  return <ListeningLobby tests={tests} recentAttempts={attempts} />
}
