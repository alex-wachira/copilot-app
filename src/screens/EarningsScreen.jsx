import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { mockEarnings, mockInsights, mockWeekBars } from '../lib/mockData'
import { Card, SectionLabel } from '../components/UI'

const periods = ['month', 'week', 'today']
const periodLabels = { month: 'Month', week: 'Week', today: 'Today' }

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: '#141414', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#fff' }}>
        <div style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</div>
        <div style={{ fontWeight: 600 }}>${payload[0].value}</div>
      </div>
    )
  }
  return null
}

export default function EarningsScreen() {
  const [period, setPeriod] = useState('month')
  const data = mockEarnings[period]
  const maxBar = Math.max(...mockWeekBars.map(b => b.val))

  return (
    <div className="screen" style={{ padding: '0 16px' }}>
      <div style={{ padding: '20px 0 4px' }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 2 }}>performance</div>
        <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.3px' }}>Earnings</div>
      </div>

      <Card style={{ marginBottom: 10 }}>
        {/* Period toggle */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--gray-50)', borderRadius: 10, padding: 4, marginBottom: 16 }}>
          {periods.map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              flex: 1, padding: '7px', borderRadius: 7, border: 'none', fontSize: 13, fontWeight: 500,
              background: period === p ? '#fff' : 'transparent',
              color: period === p ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: period === p ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s', cursor: 'pointer'
            }}>
              {periodLabels[p]}
            </button>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 42, fontWeight: 600, letterSpacing: '-1px', color: 'var(--text-primary)' }}>
            ${data.total.toLocaleString()}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{data.label}</div>
        </div>

        {/* Bar chart */}
        <div style={{ height: 100 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockWeekBars} barCategoryGap="20%">
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9e9d99' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                {mockWeekBars.map((b, i) => (
                  <Cell key={i} fill={b.val === maxBar ? '#EF9F27' : '#1D9E75'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Insights grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        {mockInsights.map(ins => (
          <div key={ins.label} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', padding: '10px 12px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{ins.label}</div>
            <div style={{ fontSize: 17, fontWeight: 600 }}>{ins.value}</div>
            <div style={{ fontSize: 11, marginTop: 2, color: ins.up ? 'var(--teal)' : 'var(--text-muted)' }}>{ins.note}</div>
          </div>
        ))}
      </div>

      <SectionLabel>Breakdown</SectionLabel>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {[
          { label: 'Base fares', sub: `${data.rides} rides`, val: data.breakdown.base, color: 'var(--text-primary)' },
          { label: 'Surge earnings', sub: `${data.surgeRides} surge rides`, val: data.breakdown.surge, color: 'var(--amber-dark)' },
          { label: 'Tips', sub: `${data.tipRate}% tip rate`, val: data.breakdown.tips, color: 'var(--teal-dark)' },
        ].map((row, i, arr) => (
          <div key={row.label} style={{
            display: 'flex', alignItems: 'center', padding: '11px 14px',
            borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{row.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{row.sub}</div>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: row.color }}>${row.val.toLocaleString()}</div>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', borderTop: '1px solid var(--border)', background: 'var(--gray-50)' }}>
          <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>Total</div>
          <div style={{ fontSize: 17, fontWeight: 600 }}>${data.total.toLocaleString()}</div>
        </div>
      </Card>
    </div>
  )
}
