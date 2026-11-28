// ============================================================
// Real shift plan — the next 7 days, real dates.
// Windows come from the same demand rules as the map; dollar
// estimates appear only once the driver has their own $/hr.
// ============================================================

import { demandNow } from './placesService'
import { PLATFORMS } from './platforms'
import { allShifts, allTrips, hourLabel } from './realStats'

// The driver's own average gross $/hr across all logged shifts
export function myHourlyRate() {
  const shifts = allShifts().filter(s => s.endTime)
  const hours = shifts.reduce((h, s) => h + (new Date(s.endTime) - new Date(s.startTime)) / 3600000, 0)
  const gross = allTrips(shifts).reduce((g, t) => g + t.payout + t.tip, 0)
  return hours >= 2 && gross > 0 ? gross / hours : null
}

export function buildWeekPlan(platforms = ['uber']) {
  const ride = platforms.some(id => PLATFORMS[id]?.type === 'rideshare')
  const food = platforms.some(id => PLATFORMS[id]?.type === 'delivery')
  const types = [...(ride ? ['downtown', 'nightlife'] : []), ...(food ? ['food'] : [])]
  const rate = myHourlyRate()
  const today = new Date(); today.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(today); day.setDate(day.getDate() + i)
    // score each hour 6am → 1am
    const hours = []
    for (let h = 6; h <= 25; h++) {
      const at = new Date(day); at.setHours(h % 24, 30, 0, 0); if (h >= 24) at.setDate(at.getDate() + 1)
      if (i === 0 && at < new Date()) { hours.push({ h, level: null }); continue }  // skip hours already gone today
      const lv = types.map(t => demandNow(t, at))
      const highs = lv.filter(l => l === 'high').length
      hours.push({ h, level: highs >= 2 ? 'peak' : highs === 1 ? 'good' : lv.includes('medium') ? 'fair' : null })
    }
    // merge neighbouring hours with the same level into windows
    const windows = []
    for (const x of hours) {
      const last = windows[windows.length - 1]
      if (x.level && last && last.level === x.level && last.endH === x.h) last.endH = x.h + 1
      else if (x.level) windows.push({ level: x.level, startH: x.h, endH: x.h + 1 })
    }
    // Keep the strongest windows (peak first, then longest), up to ~8 hours a day
    const rank = { peak: 0, good: 1, fair: 2 }
    const ranked = [...windows].sort((x, y) => rank[x.level] - rank[y.level] || (y.endH - y.startH) - (x.endH - x.startH))
    let best = [], used = 0
    for (const w of ranked) {
      const len = w.endH - w.startH
      if (used >= 8) break
      if (used + len > 8) { // trim a long window to fit
        const keep = 8 - used
        if (keep >= 2) { best.push({ ...w, endH: w.startH + keep }); used += keep }
        continue
      }
      best.push(w); used += len
    }
    best.sort((x, y) => x.startH - y.startH)
    const out = best.map(w => {
      const len = w.endH - w.startH
      return { level: w.level, start: hourLabel(w.startH % 24), end: hourLabel(w.endH % 24), hours: len,
        earn: rate ? `~$${Math.round(len * rate)}` : `${len}h` }
    })
    const totalHours = out.reduce((s, w) => s + w.hours, 0)
    return {
      day: i === 0 ? 'Today' : day.toLocaleDateString('en-US', { weekday: 'short' }),
      date: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      windows: out,
      totalHours,
      totalEst: rate ? Math.round(totalHours * rate) : null,
    }
  })
}
