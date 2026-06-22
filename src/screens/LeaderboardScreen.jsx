import { useState } from 'react'
import { PLATFORMS } from '../lib/platforms'
import { Card, SectionLabel } from '../components/UI'

const cityLeaders = [
  { rank: 1,  initials: 'MK', platforms: ['uber','doordash'], weekEarnings: 1842, hoursOnline: 58, streak: 12, badge: '👑' },
  { rank: 2,  initials: 'TR', platforms: ['lyft','ubereats','grubhub'], weekEarnings: 1710, hoursOnline: 54, streak: 8, badge: '🥈' },
  { rank: 3,  initials: 'JL', platforms: ['uber','lyft'], weekEarnings: 1634, hoursOnline: 51, streak: 6, badge: '🥉' },
  { rank: 4,  initials: 'AN', platforms: ['doordash','ubereats'], weekEarnings: 1580, hoursOnline: 53, streak: 9, badge: null },
  { rank: 5,  initials: 'RD', platforms: ['uber','doordash','ubereats'], weekEarnings: 1521, hoursOnline: 49, streak: 4, badge: null },
  { rank: 6,  initials: 'SW', platforms: ['lyft','doordash'], weekEarnings: 1488, hoursOnline: 47, streak: 7, badge: null },
  { rank: 7,  initials: 'PB', platforms: ['uber'], weekEarnings: 1420, hoursOnline: 45, streak: 5, badge: null },
  { rank: 8,  initials: 'KO', platforms: ['ubereats','grubhub'], weekEarnings: 1390, hoursOnline: 46, streak: 3, badge: null },
  { rank: 9,  initials: 'FN', platforms: ['uber','lyft','doordash'], weekEarnings: 1340, hoursOnline: 44, streak: 2, badge: null },
  { rank: 23, initials: 'ME', platforms: ['uber','doordash'], weekEarnings: 1028, hoursOnline: 36, streak: 5, badge: null, isYou: true },
]

const tabs = ['Weekly', 'Monthly', 'All Time']

export default function LeaderboardScreen({ driver }) {
  const [activeTab, setActiveTab] = useState('Weekly')
  const [metric, setMetric] = useState('earnings')
  const you = cityLeaders.find(l => l.isYou)

  return (
    <div className="screen" style={{ padding: '0 16px' }}>
      <div style={{ padding: '20px 0 4px' }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 2 }}>anonymous rankings</div>
        <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.3px' }}>Chicago Leaderboard</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>All drivers anonymous. Compete, learn, improve.</div>
      </div>

      {/* Your rank card */}
      <div style={{ background: '#141414', borderRadius: 16, padding: '14px 16px', margin: '12px 0 10px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#141414', flexShrink: 0 }}>
          {(driver?.name || 'ME')[0]}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>Your ranking this week</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>#23 <span style={{ fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>of 847 drivers</span></div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 600, marginBottom: 2 }}>Top 3% ↑</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>$1,028</div>
        </div>
      </div>

      {/* Progress to next rank */}
      <Card style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Distance to #22 (FN · $1,340)</div>
        <div style={{ height: 6, background: 'var(--gray-50)', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{ height: '100%', width: '77%', background: 'linear-gradient(90deg, var(--teal), var(--amber))', borderRadius: 99 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
          <span style={{ color: 'var(--text-muted)' }}>You: $1,028</span>
          <span style={{ color: 'var(--teal)', fontWeight: 600 }}>$312 to move up</span>
        </div>
      </Card>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.06)', borderRadius: 10, padding: 4, marginBottom: 12 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            flex: 1, padding: '7px', borderRadius: 7, border: 'none', fontSize: 13, fontWeight: 500,
            background: activeTab === t ? '#fff' : 'transparent',
            color: activeTab === t ? 'var(--text-primary)' : 'var(--text-muted)',
            boxShadow: activeTab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            cursor: 'pointer', transition: 'all 0.15s'
          }}>{t}</button>
        ))}
      </div>

      {/* Metric toggle */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {[['earnings','Earnings'],['efficiency','$/hr'],['streak','Streak']].map(([k,l]) => (
          <button key={k} onClick={() => setMetric(k)} style={{
            fontSize: 12, fontWeight: 500, padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
            border: '1px solid var(--border)',
            background: metric === k ? '#141414' : 'var(--surface)',
            color: metric === k ? '#fff' : 'var(--text-secondary)',
          }}>{l}</button>
        ))}
      </div>

      {/* Leaderboard list */}
      <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
        {cityLeaders.map((leader, i) => {
          const displayVal = metric === 'earnings' ? `$${leader.weekEarnings.toLocaleString()}` :
                             metric === 'efficiency' ? `$${(leader.weekEarnings / leader.hoursOnline).toFixed(0)}/hr` :
                             `${leader.streak}d 🔥`
          return (
            <div key={leader.rank} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
              borderBottom: i < cityLeaders.length - 1 ? '1px solid var(--border)' : 'none',
              background: leader.isYou ? 'rgba(239,159,39,0.06)' : 'transparent',
            }}>
              <div style={{ width: 24, textAlign: 'center', fontSize: 13, fontWeight: 700, color: leader.rank <= 3 ? 'var(--amber-dark)' : 'var(--text-muted)', flexShrink: 0 }}>
                {leader.badge || `#${leader.rank}`}
              </div>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: leader.isYou ? 'var(--amber)' : 'var(--gray-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: leader.isYou ? '#141414' : 'var(--text-muted)', flexShrink: 0 }}>
                {leader.isYou ? (driver?.name||'ME')[0] : leader.initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: leader.isYou ? 700 : 500, color: 'var(--text-primary)' }}>
                  {leader.isYou ? `${driver?.name || 'You'} (you)` : `Driver ${leader.initials}`}
                </div>
                <div style={{ display: 'flex', gap: 3, marginTop: 2, flexWrap: 'wrap' }}>
                  {leader.platforms.map(id => (
                    <span key={id} style={{ fontSize: 10, padding: '1px 5px', borderRadius: 20, background: 'var(--gray-50)', color: 'var(--text-muted)', fontWeight: 500 }}>
                      {PLATFORMS[id]?.logo}
                    </span>
                  ))}
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{leader.hoursOnline}h online</span>
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: leader.isYou ? 'var(--amber-dark)' : 'var(--text-primary)', flexShrink: 0 }}>
                {displayVal}
              </div>
            </div>
          )
        })}
      </Card>
    </div>
  )
}
