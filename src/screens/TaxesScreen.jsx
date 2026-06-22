import { mockTax } from '../lib/mockData'
import { Card, SectionLabel, IconBox, ProgressBar } from '../components/UI'

const iconPaths = {
  car: <><path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a2 2 0 00-1.8 1.1L2 11v5h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></>,
  fuel: <><path d="M3 22V8l9-4 4 2v16"/><path d="M11 22V12h4v10"/><path d="M19 7l2 2v8l-2-2"/><path d="M15 7h2"/></>,
  wrench: <><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></>,
  smartphone: <><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></>,
}

function DeductIcon({ name, color }) {
  return (
    <IconBox color={color}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {iconPaths[name]}
      </svg>
    </IconBox>
  )
}

export default function TaxesScreen() {
  const totalDeductions = mockTax.deductions.reduce((s, d) => s + d.amount, 0)
  const savedPct = (mockTax.saved / mockTax.estimate) * 100

  return (
    <div className="screen" style={{ padding: '0 16px' }}>
      <div style={{ padding: '20px 0 4px' }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 2 }}>{mockTax.quarter}</div>
        <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.3px' }}>Taxes</div>
      </div>

      {/* Tax estimate hero */}
      <Card style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{mockTax.quarter} estimated tax</div>
        <div style={{ fontSize: 34, fontWeight: 600, color: 'var(--coral)', letterSpacing: '-1px' }}>
          ${mockTax.estimate.toLocaleString()}
          <span style={{ fontSize: 15, fontWeight: 400, color: 'var(--text-muted)' }}> due</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
          Due {mockTax.due} · based on ${mockTax.netIncome.toLocaleString()} net income YTD
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
            <span style={{ color: 'var(--text-muted)' }}>Saved so far</span>
            <span style={{ color: 'var(--teal)', fontWeight: 600 }}>${mockTax.saved} / ${mockTax.estimate.toLocaleString()}</span>
          </div>
          <ProgressBar pct={savedPct} color="var(--teal)" />
        </div>
      </Card>

      <SectionLabel>Deductions found</SectionLabel>
      <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 10 }}>
        {mockTax.deductions.map((d, i) => (
          <div key={d.label} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
            borderBottom: '1px solid var(--border)'
          }}>
            <DeductIcon name={d.icon} color={d.color} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{d.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{d.sub}</div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--teal)' }}>${d.amount.toLocaleString()}</div>
          </div>
        ))}
        <div style={{
          display: 'flex', alignItems: 'center', padding: '12px 14px',
          background: 'var(--gray-50)'
        }}>
          <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>Total deductions</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--teal)' }}>${totalDeductions.toLocaleString()}</div>
        </div>
      </Card>

      <SectionLabel>Mileage log</SectionLabel>
      <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 10 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '11px 14px', borderBottom: '1px solid var(--border)'
        }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Auto-tracked trips</div>
          <button style={{
            fontSize: 12, color: 'var(--teal)', background: 'none', border: 'none',
            cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export CSV
          </button>
        </div>
        {mockTax.mileLog.map((m, i) => (
          <div key={m.date} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
            borderBottom: i < mockTax.mileLog.length - 1 ? '1px solid var(--border)' : 'none',
            fontSize: 13
          }}>
            <div style={{ color: 'var(--text-muted)', width: 40, flexShrink: 0 }}>{m.date}</div>
            <div style={{ flex: 1, color: 'var(--text-primary)' }}>{m.miles} mi driven</div>
            <div style={{ fontWeight: 600, color: 'var(--teal)' }}>+${m.deduct.toFixed(2)}</div>
          </div>
        ))}
      </Card>

      <button style={{
        width: '100%', background: '#141414', color: '#fff',
        border: 'none', borderRadius: 12, padding: '13px',
        fontSize: 14, fontWeight: 600, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        marginBottom: 10
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
        </svg>
        Generate tax report (PDF)
      </button>
    </div>
  )
}
