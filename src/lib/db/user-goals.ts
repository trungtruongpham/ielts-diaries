// User goal query utilities (server-side only)
import { createClient } from '@/lib/supabase/server'
import type { DbUserGoal, UpsertUserGoal } from './types'

/**
 * Get the current user's goal (returns null if not set)
 */
export async function getUserGoal(): Promise<DbUserGoal | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_goals')
    .select('*')
    .single()

  if (error) {
    // PGRST116 = no row found (not an actual error)
    if (error.code === 'PGRST116') return null
    console.error('[getUserGoal]', error)
    return null
  }

  return data as DbUserGoal
}

/**
 * Upsert user goal — creates or replaces (one goal per user due to UNIQUE constraint)
 */
export async function upsertUserGoal(
  goal: UpsertUserGoal
): Promise<{ data: DbUserGoal | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('user_goals')
    .upsert(
      { ...goal, user_id: user.id },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) {
    console.error('[upsertUserGoal]', error)
    return { data: null, error: error.message }
  }

  return { data: data as DbUserGoal, error: null }
}

/**
 * Delete the user's goal
 */
export async function deleteUserGoal(): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('user_goals')
    .delete()
    .neq('id', '') // triggers RLS — deletes only the user's row

  if (error) {
    console.error('[deleteUserGoal]', error)
    return { error: error.message }
  }

  return { error: null }
}
