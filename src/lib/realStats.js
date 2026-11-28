// ============================================================
// Real Stats — every number on Home, Earnings, Taxes and in the
// AI's context comes from here, built ONLY from shifts and trips
// the driver actually logged. No data → zeros + "no data yet".
// ============================================================

import { getShiftHistory, getActiveShift } from './shiftService'

export const IRS_MILEAGE_RATE = 0.725 // 2026 IRS business standard mileage rate ($/mile)
const SE_TAX_RATE   = 0.153           // Social Security + Medicare for self-employed
const SE_TAX_BASE   = 0.9235          // SE tax applies to 92.35% of net profit
const INCOME_SETASIDE = 0.10          // rough federal income-tax set-aside (estimate)

// Every shift, newest first, including the one running now
export function allShifts() {
  const active = getActiveShift()
  const history = getShiftHistory()
  return active ? [active, ...history] : history
}

// Every trip with its shift attached
export function allTrips(shifts = allShifts()) {
  return shifts.flatMap(s => (s.trips || []).map(t => ({ ...t, at: new Date(t.loggedAt || s.startTime) })))
}
export function allExpenses(shifts = allShifts()) {
  return shifts.flatMap(s => (s.expenses || []).map(e => ({ ...e, at: new Date(e.loggedAt || s.startTime) })))
}

// ── Time windows ─────────────────────────────────────────────
export function periodStart(period, now = new Date()) {
  const d = new Date(now); d.setHours(0, 0, 0, 0)
  if (period === 'week')  { const dow = (d.getDay() + 6) % 7; d.setDate(d.getDate() - dow) } // Monday
  if (period === 'month') d.setDate(1)
  if (period === 'year')  { d.setMonth(0, 1) }
  return d
}

function shiftHoursInRange(s, from, to) {
  const start = new Date(s.startTime)
  const end = s.endTime ? new Date(s.endTime) : new Date()
  const a = Math.max(start, from), b = Math.min(end, to)
  return b > a ? (b - a) / 3600000 : 0
}

// ── Totals for a period, optionally one platform ──────────────
export function periodStats(period, platform = 'all', shifts = allShifts()) {
  const from = periodStart(period), to = new Date()
  const trips = allTrips(shifts).filter(t => t.at >= from && (platform === 'all' || t.platform === platform))
  const expenses = platform === 'all' ? allExpenses(shifts).filter(e => e.at >= from) : []
  const hours = shifts.reduce((h, s) => h + shiftHoursInRange(s, from, to), 0)
  const base = trips.reduce((s, t) => s + (t.payout || 0), 0)
  const tips = trips.reduce((s, t) => s + (t.tip || 0), 0)
  const miles = trips.reduce((s, t) => s + (t.miles || 0), 0)
  const gross = base + tips
  return {
    gross: r2(gross), base: r2(base), tips: r2(tips),
    jobs: trips.length, miles: r2(miles), hours: r2(hours),
    expenses: r2(expenses.reduce((s, e) => s + (e.amount || 0), 0)),
    perHour: hours > 0.05 ? r2(gross / hours) : null,
    perMile: miles > 0 ? r2(gross / miles) : null,
    tipRate: trips.length ? Math.round(trips.filter(t => t.tip > 0).length / trips.length * 100) : null,
  }
}

export function platformToday(platforms, shifts = allShifts()) {
  const out = {}
  for (const id of platforms) out[id] = periodStats('today', id, shifts)
  return out
}

// ── Bars: this week (Mon–Sun) or this month (by week) ─────────
export function weekBars(shifts = allShifts()) {
  const start = periodStart('week')
  const labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  const vals = new Array(7).fill(0)
  for (const t of allTrips(shifts)) {
    if (t.at < start) continue
    const i = Math.floor((t.at - start) / 864e5)
    if (i >= 0 && i < 7) vals[i] += (t.payout || 0) + (t.tip || 0)
  }
  return labels.map((label, i) => ({ label, val: r2(vals[i]) }))
}

// ── Insights from ALL history ────────────────────────────────
export function insights(shifts = allShifts()) {
  const trips = allTrips(shifts)
  if (trips.length < 3) return null
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

  // best weekday by average earnings per day driven
  const byDate = {}
  for (const t of trips) {
    const k = t.at.toDateString()
    byDate[k] = (byDate[k] || 0) + t.payout + t.tip
  }
  const dow = {}
  for (const [k, v] of Object.entries(byDate)) {
    const d = new Date(k).getDay(); (dow[d] ||= []).push(v)
  }
  const bestDay = Object.entries(dow).map(([d, arr]) => [d, arr.reduce((a, b) => a + b, 0) / arr.length]).sort((a, b) => b[1] - a[1])[0]

  // best hour by total earnings logged in that hour
  const hrs = {}
  for (const t of trips) { const h = t.at.getHours(); hrs[h] = (hrs[h] || 0) + t.payout + t.tip }
  const bestHour = Object.entries(hrs).sort((a, b) => b[1] - a[1])[0]

  const finished = shifts.filter(s => s.endTime)
  return [
    { label: 'Best day', value: days[bestDay[0]], note: `avg $${Math.round(bestDay[1])}/day` },
    { label: 'Best hour', value: hourLabel(+bestHour[0]), note: `$${Math.round(bestHour[1])} earned in total` },
    { label: 'Shifts logged', value: String(finished.length), note: `${trips.length} jobs total` },
    { label: 'Avg per job', value: `$${(trips.reduce((s, t) => s + t.payout + t.tip, 0) / trips.length).toFixed(2)}`, note: 'incl. tips' },
  ]
}

// ── Streak: consecutive days with a shift, ending today/yesterday
export function streakDays(shifts = allShifts()) {
  const dates = new Set(shifts.map(s => new Date(s.startTime).toDateString()))
  let n = 0
  const d = new Date()
  if (!dates.has(d.toDateString())) d.setDate(d.getDate() - 1)
  while (dates.has(d.toDateString())) { n++; d.setDate(d.getDate() - 1) }
  return n
}

export function hoursOnlineToday(shifts = allShifts()) {
  const from = periodStart('today')
  return shifts.reduce((h, s) => h + shiftHoursInRange(s, from, new Date()), 0)
}

// ── Taxes (calendar year to date) ─────────────────────────────
export function taxSummary(shifts = allShifts(), now = new Date()) {
  const y = periodStats('year', 'all', shifts)
  const expenses = allExpenses(shifts).filter(e => e.at >= periodStart('year'))
  // With the standard mileage rate, gas/repairs are already covered by the per-mile amount.
  // Tolls and parking for work trips can be deducted on top.
  const tollsParking = expenses.filter(e => e.category === 'tolls' || e.category === 'parking').reduce((s, e) => s + e.amount, 0)
  const mileage = y.miles * IRS_MILEAGE_RATE
  const deductions = mileage + tollsParking
  const net = Math.max(0, y.gross - deductions)
  const seTax = net * SE_TAX_BASE * SE_TAX_RATE
  const incomeSetAside = net * INCOME_SETASIDE
  const yearTax = seTax + incomeSetAside

  // Federal estimated-tax deadlines for this tax year
  const yr = now.getFullYear()
  const deadlines = [
    { q: 'Q1', due: new Date(yr, 3, 15) }, { q: 'Q2', due: new Date(yr, 5, 15) },
    { q: 'Q3', due: new Date(yr, 8, 15) }, { q: 'Q4', due: new Date(yr + 1, 0, 15) },
  ]
  const next = deadlines.find(d => d.due >= new Date(now.toDateString())) || deadlines[3]

  // daily mileage log, last 7 days driven
  const byDay = {}
  for (const t of allTrips(shifts)) {
    if (t.at < periodStart('year')) continue
    const k = t.at.toDateString(); byDay[k] = (byDay[k] || 0) + (t.miles || 0)
  }
  const mileLog = Object.entries(byDay)
    .sort((a, b) => new Date(b[0]) - new Date(a[0])).slice(0, 7)
    .map(([k, mi]) => ({ date: shortDate(new Date(k)), miles: r2(mi), deduct: r2(mi * IRS_MILEAGE_RATE) }))

  return {
    year: yr, gross: y.gross, miles: y.miles,
    mileage: r2(mileage), tollsParking: r2(tollsParking), deductions: r2(deductions),
    net: r2(net), seTax: r2(seTax), incomeSetAside: r2(incomeSetAside), yearTax: r2(yearTax),
    nextQuarter: next.q, nextDue: next.due,
    mileLog, hasData: y.jobs > 0,
  }
}

// ── Short text summary for the AI assistant ───────────────────
export function aiSummary(driver) {
  const shifts = allShifts()
  const today = periodStats('today', 'all', shifts)
  const week = periodStats('week', 'all', shifts)
  const tax = taxSummary(shifts)
  const goal = driver?.weeklyGoal || 1000
  const dow = (new Date().getDay() + 6) % 7 // Mon=0
  const daysLeft = 7 - dow
  if (!allTrips(shifts).length) {
    return `NO LOGGED DATA YET — the driver hasn't tracked any trips in Co-Pilot. Don't invent their earnings; give general advice and encourage them to start a shift and log trips.\nWEEKLY GOAL: $${goal} · ${daysLeft} day(s) left this week (Mon–Sun)`
  }
  const plats = (driver?.platforms || []).map(id => {
    const p = periodStats('week', id, shifts)
    return p.jobs ? `- ${id}: $${p.gross} this week, ${p.jobs} jobs` : null
  }).filter(Boolean).join('\n')
  return `LOGGED EARNINGS (from the driver's own tracked shifts):
TODAY: $${today.gross} · ${today.jobs} jobs · ${today.hours}h online${today.perHour ? ` · $${today.perHour}/hr` : ''}
THIS WEEK: $${week.gross} of $${goal} goal · ${week.jobs} jobs · ${week.miles} mi${week.perHour ? ` · $${week.perHour}/hr` : ''} · $${r2(Math.max(0, goal - week.gross))} to go · ${daysLeft} day(s) left
BY APP THIS WEEK:
${plats || '- none logged'}
TAX ${tax.year} (estimate): $${tax.gross} gross · ${tax.miles} mi → $${tax.mileage} mileage deduction at $${IRS_MILEAGE_RATE}/mi · ~$${tax.yearTax} set-aside suggested · next federal estimate ${tax.nextQuarter} due ${shortDate(tax.nextDue)}`
}

export function hourLabel(h) {
  if (h === 0) return '12am'
  if (h === 12) return '12pm'
  return h < 12 ? `${h}am` : `${h - 12}pm`
}
function shortDate(d) { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }
function r2(n) { return Math.round(n * 100) / 100 }
