// ============================================================
// Co-Pilot Automation Engine
// Evaluates incoming gig offers in milliseconds.
// Decides accept/decline based on driver's custom thresholds.
// Logs all decisions for analytics.
// ============================================================

import { supabase } from './supabase'

// ── Default thresholds (overridden by driver settings) ────────
const DEFAULT_THRESHOLDS = {
  minimumPerMile:    1.20,   // $1.20/mile minimum
  targetHourlyRate:  18.00,  // $18/hr target
  maxWaitMins:       12,     // skip if restaurant avg wait > 12 min
  maxDeadMiles:      3.0,    // don't accept if pickup > 3mi away
  minPayout:         4.50,   // never accept under $4.50
}

// ── Offer evaluation ──────────────────────────────────────────
export function evaluateOffer(offer, driverSettings = {}, context = {}) {
  const thresholds = { ...DEFAULT_THRESHOLDS, ...driverSettings }

  const {
    platform,
    offeredPayout,
    offeredMiles,
    pickupLocation,
    restaurantName,
    estimatedPickupMins = 5,
  } = offer

  const {
    blacklistedRestaurants = [],
    activeSurgeZones = [],
    currentLocation = null,
  } = context

  const reasons = []
  let score = 100  // start perfect, deduct for negatives

  // ── Hard stops ────────────────────────────────────────────
  // 1. Below minimum payout
  if (offeredPayout < thresholds.minPayout) {
    return buildDecision('declined', offer, 'below_minimum_payout', score - 60,
      `Payout $${offeredPayout} below minimum $${thresholds.minPayout}`)
  }

  // 2. Blacklisted restaurant
  if (restaurantName) {
    const blacklisted = blacklistedRestaurants.find(r =>
      r.restaurant_name.toLowerCase() === restaurantName.toLowerCase()
    )
    if (blacklisted) {
      return buildDecision('declined', offer, 'blacklisted_restaurant', 0,
        `${restaurantName} is blacklisted (avg ${blacklisted.avg_wait_mins}min wait)`)
    }
  }

  // ── Rate calculations ─────────────────────────────────────
  const payoutPerMile = offeredMiles > 0 ? offeredPayout / offeredMiles : 0
  const estimatedMinutes = (offeredMiles / 15) * 60 + estimatedPickupMins  // avg 15mph
  const impliedHourlyRate = (offeredPayout / estimatedMinutes) * 60

  // 3. Below minimum per mile
  if (payoutPerMile < thresholds.minimumPerMile) {
    score -= 40
    reasons.push(`$${payoutPerMile.toFixed(2)}/mi below $${thresholds.minimumPerMile} threshold`)
  }

  // 4. Below target hourly rate
  if (impliedHourlyRate < thresholds.targetHourlyRate) {
    score -= 25
    reasons.push(`Implies $${impliedHourlyRate.toFixed(0)}/hr vs $${thresholds.targetHourlyRate} target`)
  }

  // ── Positive signals ──────────────────────────────────────
  // 5. Surge zone bonus
  const inSurge = activeSurgeZones.find(z =>
    pickupLocation?.toLowerCase().includes(z.neighborhood?.toLowerCase() || '')
  )
  if (inSurge) {
    score += 20
    reasons.push(`In ${inSurge.neighborhood} surge zone (${inSurge.multiplier}x)`)
  }

  // 6. High payout per mile bonus
  if (payoutPerMile > thresholds.minimumPerMile * 1.5) {
    score += 15
    reasons.push(`Strong rate: $${payoutPerMile.toFixed(2)}/mi`)
  }

  // ── Final decision ────────────────────────────────────────
  const decision = score >= 60 ? 'accepted' : 'declined'
  const declineReason = score < 60 ? 'below_rate' : null

  return buildDecision(decision, offer, declineReason, score, reasons.join(' · '), {
    payoutPerMile: Math.round(payoutPerMile * 100) / 100,
    impliedHourlyRate: Math.round(impliedHourlyRate * 100) / 100,
    estimatedMinutes: Math.round(estimatedMinutes),
    inSurge: !!inSurge,
  })
}

function buildDecision(decision, offer, declineReason, score, reasoning, metrics = {}) {
  return {
    decision,
    declineReason,
    score: Math.max(0, Math.min(100, score)),
    reasoning,
    offer,
    metrics,
    decidedAt: new Date().toISOString(),
    // Human readable summary
    summary: decision === 'accepted'
      ? `✓ Accept — ${reasoning || 'Meets your thresholds'}`
      : `✗ Decline — ${reasoning || 'Below your thresholds'}`,
  }
}

// ── Log decision to Supabase ──────────────────────────────────
export async function logOfferDecision(userId, evaluation) {
  if (!userId) return
  try {
    await supabase.from('offer_evaluations').insert({
      user_id:          userId,
      platform:         evaluation.offer.platform,
      offered_payout:   evaluation.offer.offeredPayout,
      offered_miles:    evaluation.offer.offeredMiles,
      pickup_location:  evaluation.offer.pickupLocation,
      restaurant_name:  evaluation.offer.restaurantName,
      decision:         evaluation.decision,
      decline_reason:   evaluation.declineReason,
      surge_zone:       evaluation.metrics.inSurge ? 'active' : null,
    })
  } catch (err) {
    console.error('Failed to log offer decision:', err)
  }
}

// ── Log a completed trip ──────────────────────────────────────
export async function logTrip(userId, tripData) {
  if (!userId) return null
  try {
    const { data, error } = await supabase.from('trips').insert({
      user_id:          userId,
      platform:         tripData.platform,
      gross_payout:     tripData.grossPayout,
      base_fare:        tripData.baseFare || 0,
      tip_amount:       tripData.tip || 0,
      surge_amount:     tripData.surgeAmount || 0,
      active_miles:     tripData.miles || 0,
      pickup_location:  tripData.pickup,
      dropoff_location: tripData.dropoff,
      restaurant_name:  tripData.restaurant,
      wait_time_mins:   tripData.waitMins || 0,
      status:           'completed',
      started_at:       tripData.startedAt || new Date().toISOString(),
      completed_at:     tripData.completedAt || new Date().toISOString(),
    }).select().single()
    if (error) throw error
    return data
  } catch (err) {
    console.error('Failed to log trip:', err)
    return null
  }
}

// ── Blacklist a restaurant ────────────────────────────────────
export async function blacklistRestaurant(userId, { name, location, reason, avgWaitMins }) {
  if (!userId) return
  try {
    await supabase.from('blacklisted_restaurants').upsert({
      user_id:          userId,
      restaurant_name:  name,
      location,
      reason,
      avg_wait_mins:    avgWaitMins,
    }, { onConflict: 'user_id,restaurant_name' })
  } catch (err) {
    console.error('Failed to blacklist restaurant:', err)
  }
}

// ── Fetch driver's blacklist ──────────────────────────────────
export async function fetchBlacklist(userId) {
  if (!userId) return []
  const { data } = await supabase
    .from('blacklisted_restaurants')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return data || []
}

// ── Fetch offer analytics ─────────────────────────────────────
export async function fetchOfferAnalytics(userId, days = 7) {
  if (!userId) return null
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const { data } = await supabase
    .from('offer_evaluations')
    .select('*')
    .eq('user_id', userId)
    .gte('evaluated_at', since)

  if (!data) return null
  const accepted = data.filter(o => o.decision === 'accepted')
  const declined = data.filter(o => o.decision === 'declined')
  const acceptanceRate = data.length > 0 ? Math.round((accepted.length / data.length) * 100) : 0

  const declineReasons = declined.reduce((acc, o) => {
    acc[o.decline_reason] = (acc[o.decline_reason] || 0) + 1
    return acc
  }, {})

  return {
    total: data.length,
    accepted: accepted.length,
    declined: declined.length,
    acceptanceRate,
    avgAcceptedPayout: accepted.length > 0
      ? Math.round(accepted.reduce((s, o) => s + o.offered_payout, 0) / accepted.length * 100) / 100
      : 0,
    avgDeclinedPayout: declined.length > 0
      ? Math.round(declined.reduce((s, o) => s + o.offered_payout, 0) / declined.length * 100) / 100
      : 0,
    declineReasons,
    topDeclineReason: Object.entries(declineReasons).sort((a,b) => b[1]-a[1])[0]?.[0] || null,
  }
}
