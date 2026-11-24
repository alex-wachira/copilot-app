// ============================================================
// User Storage
// Every driver gets their own private "drawer" on this device.
// Keys are saved as  copilot_xxx:<user id>  so two people who
// share a phone never see each other's shifts, plan or photo.
// ============================================================

let currentUserId = null

export function setStorageUser(id) {
  currentUserId = id || null
}

const scoped = (key) => (currentUserId ? `${key}:${currentUserId}` : null)

// Same shape as localStorage, so services just swap the word.
// When nobody is signed in, reads return null and writes are skipped.
export const store = {
  getItem(key) {
    const k = scoped(key)
    if (!k) return null
    try { return localStorage.getItem(k) } catch { return null }
  },
  setItem(key, value) {
    const k = scoped(key)
    if (!k) return
    localStorage.setItem(k, value) // may throw if storage is full — callers already handle that
  },
  removeItem(key) {
    const k = scoped(key)
    if (!k) return
    try { localStorage.removeItem(k) } catch {}
  },
}

// Old builds saved data under shared keys with no user id.
// Delete them once so they can't leak into anyone's account.
const LEGACY_KEYS = [
  'copilot_active_shift', 'copilot_shift_history', 'copilot_avatar', 'copilot_avatar_url',
  'copilot_plan', 'copilot_city', 'copilot_vehicle', 'copilot_maintenance',
]
export function removeLegacyKeys() {
  try { LEGACY_KEYS.forEach(k => localStorage.removeItem(k)) } catch {}
}
