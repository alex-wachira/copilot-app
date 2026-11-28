// ============================================================
// Real notifications — built from the driver's own data.
// Read/unread is remembered per driver on this device.
// ============================================================

import { store } from './userStorage'
import { getActiveShift, computeShiftStats } from './shiftService'
import { periodStats, taxSummary, streakDays, allTrips } from './realStats'

const READ_KEY = 'copilot_notifs_read'

function readIds() {
  try { return new Set(JSON.parse(store.getItem(READ_KEY) || '[]')) } catch { return new Set() }
}
export function markNotifsRead(ids) {
  const set = readIds(); ids.forEach(id => set.add(id))
  try { store.setItem(READ_KEY, JSON.stringify([...set].slice(-200))) } catch {}
}

export function buildNotifications(driver) {
  const out = []
  const now = new Date()
  const weekKey = (() => { const d = new Date(now); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.toISOString().slice(0, 10) })()

  if (!allTrips().length) {
    out.push({ id: 'welcome', type: 'optimizer', color: 'teal', title: 'Start your first tracked shift',
      body: 'Clock in on the Shift tab and log each trip with its payout, tip and miles. Your real earnings, goal progress and tax set-aside build from that.', time: 'Getting started', urgent: false })
  }

  // Weekly goal milestones (50%, 75%, 100%)
  const goal = driver?.weeklyGoal || 1000
  const week = periodStats('week')
  const pct = Math.floor((week.gross / goal) * 100)
  for (const m of [100, 75, 50]) {
    if (pct >= m) {
      out.push({ id: `goal-${weekKey}-${m}`, type: 'goal', color: 'teal',
        title: m === 100 ? 'Weekly goal reached 🎉' : `You're ${m}% to your weekly goal`,
        body: m === 100 ? `$${Math.round(week.gross)} earned against your $${goal} goal.` : `$${Math.round(week.gross)} of $${goal} · $${Math.round(goal - week.gross)} to go.`,
        time: 'This week', urgent: false, actionLabel: 'See home', tab: 'home' })
      break
    }
  }

  // Long shift reminder
  const active = getActiveShift()
  if (active) {
    const s = computeShiftStats(active)
    if (s.hoursElapsed >= 8) out.push({ id: `long-${active.id}`, type: 'mission', color: 'coral',
      title: `You've been on shift ${s.elapsedLabel}`, body: 'Long shifts raise accident risk. Take a break, and end the shift when you go offline so your $/hr stays accurate.',
      time: 'Now', urgent: true, actionLabel: 'Open shift', tab: 'shift' })
  }

  // Streak
  const streak = streakDays()
  if (streak >= 3) out.push({ id: `streak-${now.toDateString()}`, type: 'streak', color: 'amber',
    title: `${streak}-day driving streak`, body: 'Consistent days add up — just remember rest days matter too.', time: 'Today', urgent: false })

  // Federal estimated tax deadline within 21 days
  const tax = taxSummary()
  const days = Math.ceil((tax.nextDue - now) / 864e5)
  if (tax.hasData && days >= 0 && days <= 21) out.push({ id: `tax-${tax.nextQuarter}-${tax.year}`, type: 'event', color: 'purple',
    title: `${tax.nextQuarter} estimated tax due in ${days} day${days === 1 ? '' : 's'}`,
    body: `Due ${tax.nextDue.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}. Your rough year-to-date set-aside is $${Math.round(tax.yearTax)}.`,
    time: 'Upcoming', urgent: days <= 7, actionLabel: 'See taxes', tab: 'taxes' })

  const read = readIds()
  return out.map(n => ({ ...n, read: read.has(n.id) }))
}
