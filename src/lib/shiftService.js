// ============================================================
// Shift Service
// Live shift tracking: clock in/out, trip logging mid-shift,
// real-time earnings per hour. Persists across refreshes.
// ============================================================

const SHIFT_KEY = 'copilot_active_shift'
const HISTORY_KEY = 'copilot_shift_history'

export function startShift(startingMileage = 0) {
  const shift = {
    id: `shift_${Date.now()}`,
    startTime: new Date().toISOString(),
    startingMileage,
    trips: [],
    expenses: [],
  }
  localStorage.setItem(SHIFT_KEY, JSON.stringify(shift))
  return shift
}

export function getActiveShift() {
  try {
    const raw = localStorage.getItem(SHIFT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function logTripToShift(trip) {
  const shift = getActiveShift()
  if (!shift) return null
  shift.trips.push({
    id: `trip_${Date.now()}`,
    platform: trip.platform,
    payout: Number(trip.payout) || 0,
    tip: Number(trip.tip) || 0,
    miles: Number(trip.miles) || 0,
    loggedAt: new Date().toISOString(),
  })
  localStorage.setItem(SHIFT_KEY, JSON.stringify(shift))
  return shift
}

export function logExpenseToShift(expense) {
  const shift = getActiveShift()
  if (!shift) return null
  shift.expenses.push({
    id: `exp_${Date.now()}`,
    category: expense.category,
    amount: Number(expense.amount) || 0,
    loggedAt: new Date().toISOString(),
  })
  localStorage.setItem(SHIFT_KEY, JSON.stringify(shift))
  return shift
}

export function endShift(endingMileage = 0) {
  const shift = getActiveShift()
  if (!shift) return null
  shift.endTime = new Date().toISOString()
  shift.endingMileage = endingMileage
  // Save to history
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    history.unshift(shift)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 30)))
  } catch {}
  localStorage.removeItem(SHIFT_KEY)
  return shift
}

export function getShiftHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
  } catch { return [] }
}

// ── Live shift stats ──────────────────────────────────────────
export function computeShiftStats(shift) {
  if (!shift) return null
  const now = shift.endTime ? new Date(shift.endTime) : new Date()
  const start = new Date(shift.startTime)
  const hoursElapsed = Math.max((now - start) / 3600000, 0.01)

  const grossEarnings = shift.trips.reduce((s, t) => s + t.payout + t.tip, 0)
  const totalTips     = shift.trips.reduce((s, t) => s + t.tip, 0)
  const totalMiles    = shift.trips.reduce((s, t) => s + t.miles, 0)
  const totalExpenses = shift.expenses.reduce((s, e) => s + e.amount, 0)

  // IRS mileage-based vehicle cost estimate ($0.67/mi covers gas + wear)
  const vehicleCost = totalMiles * 0.67
  const netEarnings = grossEarnings - totalExpenses

  return {
    hoursElapsed,
    elapsedLabel: formatElapsed(now - start),
    tripCount: shift.trips.length,
    grossEarnings: round2(grossEarnings),
    totalTips: round2(totalTips),
    totalMiles: round2(totalMiles),
    totalExpenses: round2(totalExpenses),
    grossPerHour: round2(grossEarnings / hoursElapsed),
    // TRUE hourly rate: after expenses AND estimated vehicle cost
    trueHourlyRate: round2((grossEarnings - totalExpenses - vehicleCost) / hoursElapsed),
    vehicleCostEstimate: round2(vehicleCost),
    perMile: totalMiles > 0 ? round2(grossEarnings / totalMiles) : 0,
  }
}

function formatElapsed(ms) {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function round2(n) { return Math.round(n * 100) / 100 }

// ── Achievements ──────────────────────────────────────────────
export const ACHIEVEMENTS = [
  { id: 'first_shift',   emoji: '🚀', label: 'First Shift',      desc: 'Complete your first tracked shift',    check: (h) => h.length >= 1 },
  { id: 'streak_5',      emoji: '🔥', label: '5-Day Streak',     desc: 'Drive 5 days in a row',                check: () => true },
  { id: 'century',       emoji: '💯', label: 'Century Club',     desc: 'Earn $100+ in one shift',              check: (h) => h.some(s => computeShiftStats(s)?.grossEarnings >= 100) },
  { id: 'road_warrior',  emoji: '🛣️', label: 'Road Warrior',     desc: 'Drive 100+ miles in one shift',        check: (h) => h.some(s => computeShiftStats(s)?.totalMiles >= 100) },
  { id: 'rate_master',   emoji: '⚡', label: 'Rate Master',      desc: 'Hit $30+/hr gross in a shift',          check: (h) => h.some(s => computeShiftStats(s)?.grossPerHour >= 30) },
  { id: 'ten_shifts',    emoji: '🏆', label: 'Consistent',       desc: 'Complete 10 tracked shifts',           check: (h) => h.length >= 10 },
  { id: 'tip_magnet',    emoji: '💰', label: 'Tip Magnet',       desc: 'Collect $50+ tips in one shift',       check: (h) => h.some(s => computeShiftStats(s)?.totalTips >= 50) },
  { id: 'marathon',      emoji: '🏃', label: 'Marathon',         desc: 'Work an 8+ hour shift',                check: (h) => h.some(s => computeShiftStats(s)?.hoursElapsed >= 8) },
]

export function getUnlockedAchievements() {
  const history = getShiftHistory()
  return ACHIEVEMENTS.map(a => ({ ...a, unlocked: a.check(history) }))
}
