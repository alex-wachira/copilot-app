// ============================================================
// Driver Profile
// Reads and saves the signed-in driver's row in public.drivers.
// The database only lets drivers change these columns:
// name, city, weekly_goal, target_hourly_rate, minimum_per_mile,
// avatar_url, platforms. plan / rating / streak are read-only.
// ============================================================

import { supabase } from './supabase'

// Database row → the driver object the screens already use
function toDriver(user, row) {
  return {
    id: user.id,
    email: user.email,
    name: row?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'Driver',
    city: row?.city || 'Chicago',
    weeklyGoal: row?.weekly_goal ?? 1000,
    platforms: row?.platforms?.length ? row.platforms : ['uber'],
    plan: row?.plan || 'free',
    rating: row?.rating ?? 5,
    streak: row?.streak ?? 0,
    targetHourlyRate: row?.target_hourly_rate ?? 18,
    minimumPerMile: row?.minimum_per_mile ?? 1.2,
    avatarUrl: row?.avatar_url || null,
    onboarded: !!user.user_metadata?.onboarded,
  }
}

export async function loadDriverProfile(user) {
  const { data, error } = await supabase
    .from('drivers')
    .select('name, city, weekly_goal, platforms, plan, rating, streak, target_hourly_rate, minimum_per_mile, avatar_url')
    .eq('id', user.id)
    .maybeSingle()
  if (error) console.error('Profile load failed:', error.message)
  return toDriver(user, data)
}

// Screen names → database column names (only the editable ones)
const COLUMNS = {
  name: 'name',
  city: 'city',
  weeklyGoal: 'weekly_goal',
  platforms: 'platforms',
  targetHourlyRate: 'target_hourly_rate',
  minimumPerMile: 'minimum_per_mile',
  avatarUrl: 'avatar_url',
}

export async function saveDriverProfile(userId, changes) {
  const row = {}
  for (const [key, col] of Object.entries(COLUMNS)) {
    if (changes[key] !== undefined) row[col] = changes[key]
  }
  if (!userId || Object.keys(row).length === 0) return { ok: true }
  const { error } = await supabase.from('drivers').update(row).eq('id', userId)
  if (error) {
    console.error('Profile save failed:', error.message)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

// Remember that this person finished the "pick apps + goal" setup
export async function markOnboarded() {
  try { await supabase.auth.updateUser({ data: { onboarded: true } }) } catch {}
}
