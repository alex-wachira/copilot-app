import { useState } from 'react'
import { mockNotifications } from '../lib/notifications'
import { PLATFORMS } from '../lib/platforms'
import { Card, SectionLabel } from '../components/UI'

const typeIcons = {
  surge: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>,
  goal: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>,
  mission: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  tip: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
  streak: <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>,
  event: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  optimizer: <><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></>,
}

const colorMap = {
  amber:  { bg: 'var(--amber-light)',  icon: 'var(--amber-dark)',  dot: '#EF9F27' },
  teal:   { bg: 'var(--teal-light)',   icon: 'var(--teal-dark)',   dot: '#1D9E75' },
  coral:  { bg: 'var(--coral-light)',  icon: 'var(--coral-dark)',  dot: '#D85A30' },
  purple: { bg: 'var(--purple-light)', icon: 'var(--purple-dark)', dot: '#7F77DD' },
  green:  { bg: 'var(--green-light)',  icon: 'var(--green-dark)',  dot: '#639922' },
}

export default function NotificationsScreen() {
  const [notifs, setNotifs] = useState(mockNotifications)
  const unread = notifs.filter(n => !n.read).length

  const markRead = (id) => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })))

  const urgent = notifs.filter(n => n.urgent && !n.read)
  const rest   = notifs.filter(n => !n.urgent || n.read)

  return (
    <div className="screen" style={{ padding: '0 16px' }}>
      <div style={{ padding: '20px 0 4px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 2 }}>alerts & updates</div>
          <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.3px' }}>
            Notifications
            {unread > 0 && <span style={{ marginLeft: 8, fontSize: 14, fontWeight: 600, background: '#D85A30', color: '#fff', padding: '1px 8px', borderRadius: 20, verticalAlign: 'middle' }}>{unread}</span>}
          </div>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} style={{ fontSize: 13, color: 'var(--teal)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, paddingBottom: 4 }}>
            Mark all read
          </button>
        )}
      </div>

      {urgent.length > 0 && (
        <>
          <SectionLabel>Needs attention</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
            {urgent.map(n => <NotifCard key={n.id} notif={n} onRead={markRead} />)}
          </div>
        </>
      )}

      <SectionLabel>Earlier</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {rest.map(n => <NotifCard key={n.id} notif={n} onRead={markRead} />)}
      </div>
    </div>
  )
}

function NotifCard({ notif, onRead }) {
  const c = colorMap[notif.color] || colorMap.teal
  const p = notif.platform ? PLATFORMS[notif.platform] : null

  return (
    <div onClick={() => onRead(notif.id)} style={{
      background: 'var(--surface)',
      border: `1px solid ${notif.read ? 'var(--border)' : c.dot + '44'}`,
      borderLeft: `3px solid ${notif.read ? 'var(--border)' : c.dot}`,
      borderRadius: 'var(--radius-md)',
      padding: '12px 14px',
      cursor: 'pointer',
      opacity: notif.read ? 0.7 : 1,
      transition: 'all 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c.icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {typeIcons[notif.type]}
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 13, fontWeight: notif.read ? 500 : 600, color: 'var(--text-primary)' }}>{notif.title}</span>
            {p && <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 20, background: 'var(--gray-50)', color: 'var(--text-muted)', flexShrink: 0 }}>{p.name}</span>}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{notif.body}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{notif.time}</span>
            {notif.actionLabel && (
              <span style={{ fontSize: 12, fontWeight: 600, color: c.dot }}>{notif.actionLabel} →</span>
            )}
          </div>
        </div>
        {!notif.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.dot, flexShrink: 0, marginTop: 4 }} />}
      </div>
    </div>
  )
}
