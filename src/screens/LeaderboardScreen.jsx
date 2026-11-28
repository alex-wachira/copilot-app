// ============================================================
// Leaderboard — personal bests from the driver's own shifts.
// A city leaderboard needs real drivers; until a city has enough
// opted-in drivers we show an honest "coming soon" instead of
// made-up rankings.
// ============================================================

import { Card, SectionLabel } from '../components/UI'
import { loadCity } from '../lib/cityService'
import { computeShiftStats } from '../lib/shiftService'
import { allShifts, allTrips, streakDays } from '../lib/realStats'
import { getUnlockedAchievements } from '../lib/shiftService'

function personalBests() {
  const shifts = allShifts().filter(s => s.endTime)
  const trips = allTrips(allShifts())
  if (!trips.length) return null

  const byDay = {}, byWeek = {}
  for (const t of trips) {
    const v = t.payout + t.tip
    const d = t.at.toDateString(); byDay[d] = (byDay[d] || 0) + v
    const w = new Date(t.at); w.setHours(0,0,0,0); w.setDate(w.getDate() - ((w.getDay() + 6) % 7))
    const wk = w.toDateString(); byWeek[wk] = (byWeek[wk] || 0) + v
  }
  const top = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1])[0]
  const bestDay = top(byDay), bestWeek = top(byWeek)
  const stats = shifts.map(s => computeShiftStats(s)).filter(Boolean)
  const bestRate = stats.filter(s => s.hoursElapsed >= 1).sort((a, b) => b.grossPerHour - a.grossPerHour)[0]
  const bestShift = stats.sort((a, b) => b.grossEarnings - a.grossEarnings)[0]
  const fmt = (k) => new Date(k).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return [
    { label: 'Best day', value: `$${Math.round(bestDay[1])}`, note: fmt(bestDay[0]) },
    { label: 'Best week', value: `$${Math.round(bestWeek[1])}`, note: `week of ${fmt(bestWeek[0])}` },
    { label: 'Best shift', value: bestShift ? `$${Math.round(bestShift.grossEarnings)}` : '—', note: bestShift ? `${bestShift.tripCount} trips · ${bestShift.elapsedLabel}` : 'finish a shift' },
    { label: 'Best $/hr', value: bestRate ? `$${bestRate.grossPerHour.toFixed(2)}` : '—', note: bestRate ? 'shifts of 1h+' : 'needs a 1h+ shift' },
    { label: 'Jobs logged', value: String(trips.length), note: `${Math.round(trips.reduce((s, t) => s + (t.miles || 0), 0))} mi total` },
    { label: 'Current streak', value: `${streakDays()} day${streakDays() === 1 ? '' : 's'}`, note: 'days in a row driven' },
  ]
}

export default function LeaderboardScreen({ driver }) {
  const city = loadCity()?.label || driver?.city || 'your city'
  const bests = personalBests()
  const achievements = getUnlockedAchievements().map(a => a.id === 'streak_5' ? { ...a, unlocked: streakDays() >= 5 } : a)

  return (
    <div className="screen" style={{ padding: '0 16px' }}>
      <div style={{ padding: '20px 0 4px' }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 2 }}>your progress</div>
        <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.3px' }}>Personal bests</div>
      </div>

      {bests ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '12px 0 10px' }}>
          {bests.map(b => (
            <div key={b.label} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', padding: '10px 12px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{b.label}</div>
              <div style={{ fontSize: 19, fontWeight: 600 }}>{b.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{b.note}</div>
            </div>
          ))}
        </div>
      ) : (
        <Card style={{ margin: '12px 0 10px', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
          Your best day, best week and best $/hr show up here once you log trips on the <strong>Shift</strong> tab.
        </Card>
      )}

      <SectionLabel>Achievements</SectionLabel>
      <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 10 }}>
        {achievements.map((a, i, arr) => (
          <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', opacity: a.unlocked ? 1 : 0.45 }}>
            <span style={{ fontSize: 20 }}>{a.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{a.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.desc}</div>
            </div>
            {a.unlocked && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--teal)' }}>Unlocked</span>}
          </div>
        ))}
      </Card>

      <SectionLabel>{city.split(',')[0]} leaderboard</SectionLabel>
      <Card style={{ marginBottom: 16, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
        🏁 <strong>Coming soon.</strong> Anonymous city rankings open once enough drivers in {city.split(',')[0]} use Co-Pilot. Only initials will ever be shown, and you'll be able to opt out.
      </Card>
    </div>
  )
}
