// ============================================================
// Pro Service — Stripe subscription via Payment Links
// Flow: Upgrade button → Stripe Payment Link (hosted checkout)
// → redirects back with ?upgraded=true → plan saved locally
// + synced to Supabase drivers.plan
// ============================================================

import { store } from './userStorage'
import { supabase } from './supabase'

const PLAN_KEY = 'copilot_plan'

// Set this in Vercel: VITE_STRIPE_PAYMENT_LINK
// Create at: dashboard.stripe.com → Payment Links → New
const PAYMENT_LINK = import.meta.env.VITE_STRIPE_PAYMENT_LINK || ''

export function getPlan() {
  return store.getItem(PLAN_KEY) || 'free'
}

export function isPro() {
  return getPlan() === 'pro'
}

// ── Open Stripe checkout ──────────────────────────────────────
export async function startUpgrade(driverEmail) {
  if (!PAYMENT_LINK) {
    alert('Payments are almost ready! Stripe is being connected — check back soon.')
    return false
  }
  let url = PAYMENT_LINK
  const params = new URLSearchParams()
  // Prefill email so Stripe links the subscription to this driver
  if (driverEmail) params.set('prefilled_email', driverEmail)
  // Attach the Supabase user id for webhook reconciliation later
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.id) params.set('client_reference_id', user.id)
  } catch {}
  const qs = params.toString()
  if (qs) url += (url.includes('?') ? '&' : '?') + qs
  window.location.href = url
  return true
}

// ── Detect return from successful checkout ────────────────────
// Configure your Payment Link's confirmation to redirect to:
//   https://drivercopilot.app/?upgraded=true
export async function checkUpgradeReturn() {
  const params = new URLSearchParams(window.location.search)
  if (params.get('upgraded') === 'true') {
    // Show Pro on this device right away. The real switch in the database
    // is made by the Stripe webhook (Day 4) — drivers can't set it themselves.
    store.setItem(PLAN_KEY, 'pro')
    // Clean the URL
    window.history.replaceState({}, '', window.location.pathname)
    return true
  }
  return false
}

// ── Load plan from Supabase on login (source of truth) ───────
export async function syncPlanFromSupabase() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return getPlan()
    const { data } = await supabase.from('drivers').select('plan').eq('id', user.id).single()
    if (data?.plan) {
      store.setItem(PLAN_KEY, data.plan)
      return data.plan
    }
  } catch {}
  return getPlan()
}

export function clearPlan() {
  store.removeItem(PLAN_KEY)
}
