export function Card({ children, style = {} }) {
  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border)', padding: '14px',
      ...style
    }}>
      {children}
    </div>
  )
}

export function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
      letterSpacing: '0.06em', textTransform: 'uppercase',
      margin: '16px 0 8px'
    }}>
      {children}
    </div>
  )
}

export function Badge({ children, color = 'amber' }) {
  const colors = {
    amber: { bg: 'var(--amber-light)', text: 'var(--amber-dark)' },
    teal: { bg: 'var(--teal-light)', text: 'var(--teal-dark)' },
    coral: { bg: 'var(--coral-light)', text: 'var(--coral-dark)' },
    green: { bg: 'var(--green-light)', text: 'var(--green-dark)' },
    purple: { bg: 'var(--purple-light)', text: 'var(--purple-dark)' },
  }
  const c = colors[color] || colors.amber
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '3px 8px',
      borderRadius: 20, background: c.bg, color: c.text,
      whiteSpace: 'nowrap'
    }}>
      {children}
    </span>
  )
}

export function IconBox({ color = 'amber', size = 32, children }) {
  const colors = {
    amber: { bg: 'var(--amber-light)', text: 'var(--amber-dark)' },
    teal: { bg: 'var(--teal-light)', text: 'var(--teal-dark)' },
    coral: { bg: 'var(--coral-light)', text: 'var(--coral-dark)' },
    green: { bg: 'var(--green-light)', text: 'var(--green-dark)' },
    purple: { bg: 'var(--purple-light)', text: 'var(--purple-dark)' },
  }
  const c = colors[color] || colors.amber
  return (
    <div style={{
      width: size, height: size, borderRadius: 9,
      background: c.bg, color: c.text,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0
    }}>
      {children}
    </div>
  )
}

export function StatCard({ label, value, note, noteUp }) {
  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--border)', padding: '10px 12px'
    }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
      {note && (
        <div style={{ fontSize: 11, marginTop: 2, color: noteUp === false ? 'var(--coral)' : noteUp ? 'var(--teal)' : 'var(--text-muted)' }}>
          {note}
        </div>
      )}
    </div>
  )
}

export function ProgressBar({ pct, color = 'var(--teal)' }) {
  return (
    <div style={{ height: 7, background: 'var(--gray-50)', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 99, transition: 'width 0.6s ease' }} />
    </div>
  )
}

export function AINudge({ children }) {
  return (
    <div style={{
      background: 'rgba(29,158,117,0.07)', border: '1px solid rgba(29,158,117,0.2)',
      borderRadius: 'var(--radius-sm)', padding: '10px 12px',
      display: 'flex', alignItems: 'flex-start', gap: 8,
      fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
        <path d="M9 8h6M9 12h4"/>
      </svg>
      <span>{children}</span>
    </div>
  )
}
