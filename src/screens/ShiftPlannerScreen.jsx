import { useState } from 'react'
import { weekShiftPlan, estimateHiddenTip } from '../lib/notifications'
import { Card, SectionLabel } from '../components/UI'

const levelColors = { peak: '#EF9F27', good: '#1D9E75', fair: 'rgba(29,158,117,0.4)' }
const levelBg     = { peak: 'var(--amber-light)', good: 'var(--teal-light)', fair: 'var(--gray-50)' }
const levelText   = { peak: 'var(--amber-dark)',  good: 'var(--teal-dark)',  fair: 'var(--text-muted)' }

const RESTAURANT_TYPES = ['fast_food','pizza','chinese','italian','sushi','fine_dining']
const TYPE_LABELS = { fast_food:'Fast food', pizza:'Pizza', chinese:'Chinese', italian:'Italian', sushi:'Sushi', fine_dining:'Fine dining' }

export default function ShiftPlannerScreen({ driver }) {
  const [selectedDay, setSelectedDay] = useState(0)
  const [showTipCalc, setShowTipCalc] = useState(false)
  const [tipInputs, setTipInputs]     = useState({ orderTotal: 35, distanceMiles: 3, restaurantType: 'italian', hourOfDay: new Date().getHours() })
  const tip = estimateHiddenTip(tipInputs)
  const totalEstWeek = weekShiftPlan.reduce((s,d) => s + parseInt(d.totalEst.replace('$','').replace(',','')), 0)

  return (
    <div className="screen" style={{ padding: '0 16px' }}>
      <div style={{ padding: '20px 0 4px' }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 2 }}>AI-powered</div>
        <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.3px' }}>Shift Planner</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
          Drive the right hours. Est. <strong style={{ color: 'var(--teal)' }}>${totalEstWeek.toLocaleString()}</strong> this week if you follow the plan.
        </div>
      </div>

      {/* Week strip */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '12px 0 4px', scrollbarWidth: 'none' }}>
        {weekShiftPlan.map((day, i) => (
          <button key={day.day} onClick={() => setSelectedDay(i)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            padding: '10px 10px', borderRadius: 12, cursor: 'pointer', flexShrink: 0,
            border: selectedDay === i ? '2px solid #141414' : '1px solid var(--border)',
            background: selectedDay === i ? '#141414' : 'var(--surface)',
            minWidth: 58, transition: 'all 0.15s'
          }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: selectedDay === i ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)' }}>{day.day}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: selectedDay === i ? '#EF9F27' : 'var(--text-primary)' }}>{day.totalEst}</div>
            <div style={{ display: 'flex', gap: 2 }}>
              {day.windows.map((w, j) => (
                <div key={j} style={{ width: 5, height: 5, borderRadius: 1, background: levelColors[w.level] || '#ccc' }} />
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* Day detail */}
      <SectionLabel>{weekShiftPlan[selectedDay].day} {weekShiftPlan[selectedDay].date} — recommended windows</SectionLabel>
      <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 10 }}>
        {weekShiftPlan[selectedDay].windows.map((w, i, arr) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px',
            borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none'
          }}>
            <div style={{ width: 4, height: 36, borderRadius: 2, background: levelColors[w.level], flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{w.start} – {w.end}</span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: levelBg[w.level], color: levelText[w.level] }}>
                  {w.level.charAt(0).toUpperCase() + w.level.slice(1)}
                </span>
                {w.event && <span style={{ fontSize: 11, color: 'var(--purple)', background: 'var(--purple-light)', padding: '2px 7px', borderRadius: 20, fontWeight: 500 }}>🎵 {w.event}</span>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {w.level === 'peak' ? 'Highest demand window — prioritize this' : w.level === 'good' ? 'Strong earning window' : 'Moderate — fill gaps here'}
              </div>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: levelColors[w.level] }}>{w.earn}</div>
          </div>
        ))}
        <div style={{ padding: '11px 14px', background: 'var(--gray-50)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>Day total estimate</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{weekShiftPlan[selectedDay].totalEst}</span>
        </div>
      </Card>

      {/* Weekly summary */}
      <Card style={{ marginBottom: 10, background: '#141414', border: 'none' }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>If you follow the full plan</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>${totalEstWeek.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>estimated</span></div>
        <div style={{ fontSize: 13, color: 'var(--amber)', marginTop: 4 }}>That's ${(totalEstWeek - (driver?.weeklyGoal || 1000)).toLocaleString()} above your ${(driver?.weeklyGoal || 1000).toLocaleString()} goal 🎯</div>
      </Card>

      {/* Hidden tip estimator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '16px 0 8px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>DoorDash tip estimator</div>
        <button onClick={() => setShowTipCalc(p => !p)} style={{ fontSize: 12, color: 'var(--teal)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
          {showTipCalc ? 'Hide' : 'Show'}
        </button>
      </div>

      {showTipCalc && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
            DoorDash hides tips over $8 — showing "$8+" even when it's $20+. Estimate the real tip before you accept.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>Order total ($)</div>
              <input type="number" value={tipInputs.orderTotal} onChange={e => setTipInputs(p => ({ ...p, orderTotal: Number(e.target.value) }))}
                style={{ width: '100%', padding: '9px 11px', borderRadius: 9, border: '1px solid var(--border)', fontSize: 14, fontWeight: 500, outline: 'none', background: 'var(--bg)', fontFamily: 'DM Sans, sans-serif' }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>Distance (miles)</div>
              <input type="number" value={tipInputs.distanceMiles} onChange={e => setTipInputs(p => ({ ...p, distanceMiles: Number(e.target.value) }))}
                style={{ width: '100%', padding: '9px 11px', borderRadius: 9, border: '1px solid var(--border)', fontSize: 14, fontWeight: 500, outline: 'none', background: 'var(--bg)', fontFamily: 'DM Sans, sans-serif' }} />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>Restaurant type</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {RESTAURANT_TYPES.map(t => (
                <button key={t} onClick={() => setTipInputs(p => ({ ...p, restaurantType: t }))} style={{
                  fontSize: 12, padding: '5px 10px', borderRadius: 20, cursor: 'pointer',
                  border: tipInputs.restaurantType === t ? '2px solid #141414' : '1px solid var(--border)',
                  background: tipInputs.restaurantType === t ? '#141414' : 'var(--surface)',
                  color: tipInputs.restaurantType === t ? '#fff' : 'var(--text-secondary)',
                  fontWeight: 500,
                }}>
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: tip.worthColor === 'teal' ? 'var(--teal-light)' : tip.worthColor === 'amber' ? 'var(--amber-light)' : 'var(--coral-light)', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Estimated actual tip</div>
            <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-1px', color: tip.worthColor === 'teal' ? 'var(--teal-dark)' : tip.worthColor === 'amber' ? 'var(--amber-dark)' : 'var(--coral-dark)' }}>${tip.estimated}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 8px' }}>{tip.isHidden ? 'Hidden behind "$8+" label' : 'Shown in full'} · {tip.confidence} confidence</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: tip.worthColor === 'teal' ? 'var(--teal-dark)' : tip.worthColor === 'amber' ? 'var(--amber-dark)' : 'var(--coral-dark)' }}>{tip.worthLabel}</div>
          </div>
        </Card>
      )}
    </div>
  )
}
