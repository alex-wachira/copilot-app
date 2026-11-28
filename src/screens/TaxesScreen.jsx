import { taxSummary, IRS_MILEAGE_RATE } from '../lib/realStats'
import { exportTaxCSV } from '../lib/vehicleService'
import { Card, SectionLabel, IconBox } from '../components/UI'

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
  const t = taxSummary()
  const due = t.nextDue.toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })
  const money = (n) => `$${Math.round(n).toLocaleString()}`

  const deductions = [
    { icon:'car', color:'teal', label:'Mileage', sub:`${t.miles.toLocaleString()} mi · $${IRS_MILEAGE_RATE}/mi (2026 IRS rate)`, amount:t.mileage },
    { icon:'wrench', color:'purple', label:'Tolls & parking', sub:'Logged on your shifts', amount:t.tollsParking },
  ]

  return (
    <div className="screen" style={{ padding: '0 16px' }}>
      <div style={{ padding: '20px 0 4px' }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 2 }}>{t.year} · year to date</div>
        <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.3px' }}>Taxes</div>
      </div>

      {/* Set-aside estimate */}
      <Card style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Suggested to set aside for {t.year}</div>
        <div style={{ fontSize: 34, fontWeight: 600, color: t.hasData ? 'var(--coral)' : 'var(--text-muted)', letterSpacing: '-1px' }}>
          {money(t.yearTax)}
        </div>
        {t.hasData ? (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.6 }}>
            {money(t.gross)} earned − {money(t.deductions)} deductions = <strong>{money(t.net)}</strong> profit<br/>
            ≈ {money(t.seTax)} self-employment tax + {money(t.incomeSetAside)} income-tax cushion (10%)
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
            No trips logged this year yet. Log trips (with miles) on the <strong>Shift</strong> tab and this fills in automatically.
          </div>
        )}
        <div style={{ marginTop: 12, background: 'var(--gray-50)', borderRadius: 10, padding: '9px 12px', fontSize: 12, display:'flex', justifyContent:'space-between' }}>
          <span style={{ color: 'var(--text-muted)' }}>Next federal estimated payment ({t.nextQuarter})</span>
          <span style={{ fontWeight: 600 }}>{due}</span>
        </div>
      </Card>

      <SectionLabel>Deductions found</SectionLabel>
      <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 10 }}>
        {deductions.map(d => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: '1px solid var(--border)' }}>
            <DeductIcon name={d.icon} color={d.color} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{d.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{d.sub}</div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--teal)' }}>{money(d.amount)}</div>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', background: 'var(--gray-50)' }}>
          <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>Total deductions</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--teal)' }}>{money(t.deductions)}</div>
        </div>
      </Card>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', margin: '-4px 4px 12px', lineHeight: 1.5 }}>
        Using the standard mileage rate means gas, repairs and insurance are already covered by the per-mile amount — they aren't deducted again. Phone and other business costs may also be deductible; ask your tax pro.
      </div>

      <SectionLabel>Mileage log</SectionLabel>
      <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', borderBottom: t.mileLog.length ? '1px solid var(--border)' : 'none' }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Days driven (miles you logged)</div>
          <button onClick={exportTaxCSV} disabled={!t.hasData} style={{ fontSize: 12, color: t.hasData ? 'var(--teal)' : 'var(--text-muted)', background: 'none', border: 'none', cursor: t.hasData ? 'pointer' : 'default', fontWeight: 500 }}>
            ⬇ Export CSV
          </button>
        </div>
        {t.mileLog.length === 0 && <div style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)' }}>No miles logged yet.</div>}
        {t.mileLog.map((m, i) => (
          <div key={m.date} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: i < t.mileLog.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 13 }}>
            <div style={{ color: 'var(--text-muted)', width: 52, flexShrink: 0 }}>{m.date}</div>
            <div style={{ flex: 1 }}>{m.miles} mi driven</div>
            <div style={{ fontWeight: 600, color: 'var(--teal)' }}>+${m.deduct.toFixed(2)}</div>
          </div>
        ))}
      </Card>

      <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5, margin: '0 8px 16px' }}>
        Rough estimates for planning only — not tax, accounting or financial advice. Your real tax depends on your other income, filing status, state and credits. Check with a tax professional before you file.
      </div>
    </div>
  )
}
