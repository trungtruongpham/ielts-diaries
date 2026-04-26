// Test result query utilities (server-side only)
import { createClient } from '@/lib/supabase/server'
import type { DbTestResult, InsertTestResult } from './types'

/**
 * Fetch all test results for the current user, ordered by test_date DESC
 */
export async function getUserTestResults(limit?: number): Promise<DbTestResult[]> {
  const supabase = await createClient()

  let query = supabase
    .from('test_results')
    .select('*')
    .order('test_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (limit) query = query.limit(limit)

  const { data, error } = await query

  if (error) {
    console.error('[getUserTestResults]', error)
    return []
  }

  return data as DbTestResult[]
}

/**
 * Fetch a single test result by ID (ownership enforced by RLS)
 */
export async function getTestResultById(id: string): Promise<DbTestResult | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('test_results')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('[getTestResultById]', error)
    return null
  }

  return data as DbTestResult
}

/**
 * Insert a new test result
 */
export async function insertTestResult(
  record: InsertTestResult
): Promise<{ data: DbTestResult | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('test_results')
    .insert({ ...record, user_id: user.id })
    .select()
    .single()

  if (error) {
    console.error('[insertTestResult]', error)
    return { data: null, error: error.message }
  }

  return { data: data as DbTestResult, error: null }
}

/**
 * Update an existing test result
 */
export async function updateTestResult(
  id: string,
  updates: Partial<InsertTestResult>
): Promise<{ data: DbTestResult | null; error: string | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('test_results')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[updateTestResult]', error)
    return { data: null, error: error.message }
  }

  return { data: data as DbTestResult, error: null }
}

/**
 * Delete a test result by ID
 */
export async function deleteTestResult(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('test_results')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[deleteTestResult]', error)
    return { error: error.message }
  }

  return { error: null }
}

/**
 * Get latest N test results for dashboard
 */
export async function getRecentTestResults(limit = 5): Promise<DbTestResult[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('test_results')
    .select('*')
    .order('test_date', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[getRecentTestResults]', error)
    return []
  }

  return data as DbTestResult[]
}
