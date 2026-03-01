'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function saveUserGoal(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const targetListening = parseFloat(formData.get('target_listening') as string)
  const targetReading   = parseFloat(formData.get('target_reading')   as string)
  const targetWriting   = parseFloat(formData.get('target_writing')   as string)
  const targetSpeaking  = parseFloat(formData.get('target_speaking')  as string)
  const targetOverall   = parseFloat(formData.get('target_overall')   as string)
  const targetDate      = (formData.get('target_date') as string) || null

  const { error } = await supabase.from('user_goals').upsert(
    {
      user_id:          user.id,
      target_listening: targetListening,
      target_reading:   targetReading,
      target_writing:   targetWriting,
      target_speaking:  targetSpeaking,
      target_overall:   targetOverall,
      target_date:      targetDate,
    },
    { onConflict: 'user_id' }
  )

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/goal')
  redirect('/dashboard')
}
