import { mockDriver } from '../lib/mockData'
import { PLATFORMS } from '../lib/platforms'
import { Card, SectionLabel } from '../components/UI'

const menuItems = [
  { icon: 'chart', label: 'Earnings history', sub: 'Weekly & monthly breakdowns', tab: 'earnings' },
  { icon: 'map', label: 'Surge map', sub: 'Live zones + hot zones', tab: 'map' },
  { icon: 'receipt', label: 'Tax center', sub: 'Deductions, mileage, reports', tab: 'taxes' },
  { icon: 'bell', label: 'Notifications', sub: 'Alerts & updates', tab: 'notifs' },
  { icon: 'trophy', label: 'Leaderboard', sub: 'City rankings', tab: 'board' },
]

export default function ProfileScreen({ driver, onSignOut, onTabChange }) {
  const platforms = driver?.platforms || ['uber']
  const planFeatures = ['Live surge + delivery hot zones','AI shift planner','Cross-platform optimizer','Hidden tip estimator','Full tax reports & PDF export','City leaderboard']

  return (
    <div className="screen" style={{ padding:'0 16px' }}>
      <div style={{ padding:'20px 0 4px' }}>
        <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:2 }}>account</div>
        <div style={{ fontSize:24, fontWeight:600, letterSpacing:'-0.3px' }}>Profile</div>
      </div>

      <Card style={{ marginBottom:10, display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg, var(--amber), var(--teal))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:600, color:'#fff', flexShrink:0 }}>
          {(driver?.name||'D')[0]}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:17, fontWeight:600 }}>{driver?.name||'Driver'}</div>
          <div style={{ display:'flex', gap:4, marginTop:4, flexWrap:'wrap' }}>
            {platforms.map(id => <span key={id} style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20, background:'var(--gray-50)', color:'var(--text-muted)' }}>{PLATFORMS[id]?.name}</span>)}
          </div>
        </div>
        <div style={{ background:'var(--teal-light)', color:'var(--teal-dark)', fontSize:12, fontWeight:600, padding:'4px 10px', borderRadius:20 }}>Free</div>
      </Card>

      {/* Upgrade card */}
      <div style={{ background:'#141414', borderRadius:16, padding:'18px', marginBottom:10, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-20, right:-20, width:120, height:120, borderRadius:'50%', background:'rgba(239,159,39,0.12)' }}/>
        <div style={{ fontSize:11, color:'var(--amber)', fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:6 }}>Go Pro — $12/mo</div>
        <div style={{ fontSize:18, fontWeight:600, color:'#fff', marginBottom:12 }}>Unlock the full Co-Pilot</div>
        {planFeatures.map(f => (
          <div key={f} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <span style={{ fontSize:13, color:'rgba(255,255,255,0.75)' }}>{f}</span>
          </div>
        ))}
        <button style={{ width:'100%', background:'var(--amber)', color:'#141414', border:'none', borderRadius:10, padding:'12px', fontSize:14, fontWeight:700, cursor:'pointer', marginTop:12 }}>
          Upgrade to Pro
        </button>
      </div>

      <SectionLabel>Navigate to</SectionLabel>
      <Card style={{ padding:0, overflow:'hidden', marginBottom:10 }}>
        {menuItems.map((item,i,arr) => (
          <div key={item.label} onClick={() => onTabChange && onTabChange(item.tab)} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderBottom: i<arr.length-1?'1px solid var(--border)':'none', cursor:'pointer' }}>
            <div style={{ width:32, height:32, borderRadius:8, background:'var(--gray-50)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {item.icon==='chart' && <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>}
                {item.icon==='map' && <><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></>}
                {item.icon==='receipt' && <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></>}
                {item.icon==='bell' && <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>}
                {item.icon==='trophy' && <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></>}
              </svg>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:500 }}>{item.label}</div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>{item.sub}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        ))}
      </Card>

      <button onClick={onSignOut} style={{ width:'100%', background:'none', border:'1px solid var(--border)', borderRadius:12, padding:'12px', fontSize:14, fontWeight:500, color:'var(--coral)', cursor:'pointer', marginBottom:20 }}>
        Sign out
      </button>
    </div>
  )
}
