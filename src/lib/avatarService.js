// ============================================================
// Avatar Service
// Two-layer persistence:
// 1. localStorage — instant, survives navigation & refresh
// 2. Supabase Storage — permanent, syncs across devices
// ============================================================

import { supabase } from './supabase'

const AVATAR_KEY = 'copilot_avatar'
const AVATAR_URL_KEY = 'copilot_avatar_url'

// ── Save avatar locally (instant, no network needed) ─────────
export function saveAvatarLocally(base64Image) {
  try {
    localStorage.setItem(AVATAR_KEY, base64Image)
  } catch (e) {
    // localStorage full — compress or skip
    console.warn('localStorage full, avatar not cached locally')
  }
}

// ── Load avatar from localStorage ────────────────────────────
export function loadLocalAvatar() {
  try {
    return localStorage.getItem(AVATAR_KEY) || null
  } catch {
    return null
  }
}

// ── Load avatar URL (from Supabase) ──────────────────────────
export function loadAvatarUrl() {
  try {
    return localStorage.getItem(AVATAR_URL_KEY) || null
  } catch {
    return null
  }
}

// ── Upload avatar to Supabase Storage ────────────────────────
// Stores permanently in cloud — survives across devices/sessions
export async function uploadAvatarToSupabase(file, userId) {
  if (!userId) return null
  try {
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `avatars/${userId}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('driver-avatars')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('driver-avatars')
      .getPublicUrl(path)

    const publicUrl = data.publicUrl
    localStorage.setItem(AVATAR_URL_KEY, publicUrl)
    return publicUrl
  } catch (err) {
    console.error('Avatar upload failed:', err)
    return null
  }
}

// ── Fetch avatar from Supabase on login ──────────────────────
export async function fetchAvatarFromSupabase(userId) {
  if (!userId) return null
  try {
    // Try common extensions
    for (const ext of ['jpg', 'png', 'webp']) {
      const path = `avatars/${userId}.${ext}`
      const { data } = supabase.storage.from('driver-avatars').getPublicUrl(path)
      if (data?.publicUrl) {
        // Verify it exists with a HEAD request
        const res = await fetch(data.publicUrl, { method: 'HEAD' })
        if (res.ok) {
          localStorage.setItem(AVATAR_URL_KEY, data.publicUrl)
          return data.publicUrl
        }
      }
    }
    return null
  } catch {
    return null
  }
}

// ── Clear avatar (on sign out) ────────────────────────────────
export function clearAvatar() {
  localStorage.removeItem(AVATAR_KEY)
  localStorage.removeItem(AVATAR_URL_KEY)
}
