import { useState, useRef } from 'react'
import { PLATFORMS } from '../lib/platforms'
import { Card, SectionLabel } from '../components/UI'

const PRO_FEATURES = [
  { icon: 'bolt', label: 'Live surge zone map', desc: 'Real-time heatmap with multipliers' },
  { icon: 'robot', label: 'Co-Pilot AI assistant', desc: 'Knows your earnings, surge & taxes' },
  { icon: 'calendar', label: 'AI shift planner', desc: '7-day optimized schedule + tip estimator' },
  { icon: 'arrows-exchange', label: 'Cross-platform optimizer', desc: 'Tells you which app pays more right now' },
  { icon: 'receipt-2', label: 'Full tax reports + PDF', desc: 'Auto mileage log + quarterly estimates' },
  { icon: 'trophy', label: 'City leaderboard', desc: 'Compete anonymously with local drivers' },
  { icon: 'bell', label: 'Surge push notifications', desc: 'Alerts when surge hits your area' },
  { icon: 'chart-line', label: 'Advanced earnings analytics', desc: 'Trends, forecasts, per-platform breakdown' },
  { icon: 'coin', label: 'DoorDash tip estimator', desc: 'Predict hidden tips before accepting' },
  { icon: 'map-pin', label: 'Restaurant hot zones', desc: 'Best delivery pickup spots in your city' },
]

const menuItems = [
  { icon: 'chart-bar', label: 'Earnings history', sub: 'Weekly & monthly breakdowns', tab: 'earnings' },
  { icon: 'map', label: 'Surge map', sub: 'Live zones + hot zones', tab: 'map' },
  { icon: 'receipt', label: 'Tax center', sub: 'Deductions, mileage, reports', tab: 'taxes' },
  { icon: 'bell', label: 'Notifications', sub: 'Alerts & updates', tab: 'notifs' },
  { icon: 'trophy', label: 'Leaderboard', sub: 'City rankings', tab: 'board' },
]

export default function ProfileScreen({ driver, onSignOut, onTabChange }) {
  const [avatar, setAvatar]         = useState(null)
  const [showPro, setShowPro]       = useState(false)
  const [editGoal, setEditGoal]     = useState(false)
  const [weeklyGoal, setWeeklyGoal] = useState(driver?.weeklyGoal || 1000)
  const [city, setCity]             = useState(driver?.city || 'Chicago')
  const [notifications, setNotifs]  = useState(true)
  const fileRef                     = useRef(null)
  const platforms                   = driver?.platforms || ['uber']

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => setAvatar(ev.target.result)
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="screen" style={{ padding:'0 16px' }}>
      <div style={{ padding:'20px 0 4px' }}>
        <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:2 }}>account</div>
        <div style={{ fontSize:24, fontWeight:600, letterSpacing:'-0.3px' }}>Profile</div>
      </div>

      {/* Driver card with avatar upload */}
      <Card style={{ marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ position:'relative', flexShrink:0 }}>
            <div onClick={()=>fileRef.current?.click()} style={{ width:60, height:60, borderRadius:'50%', background: avatar?'transparent':'linear-gradient(135deg, var(--amber), var(--teal))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:600, color:'#fff', cursor:'pointer', overflow:'hidden', border:'2px solid var(--border)' }}>
              {avatar
                ? <img src={avatar} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                : (driver?.name||'D')[0]
              }
            </div>
            {/* Camera overlay */}
            <div onClick={()=>fileRef.current?.click()} style={{ position:'absolute', bottom:0, right:0, width:20, height:20, borderRadius:'50%', background:'#141414', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', border:'2px solid var(--bg)' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display:'none' }}/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:17, fontWeight:600 }}>{driver?.name||'Driver'}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>Tap photo to update</div>
            <div style={{ display:'flex', gap:4, marginTop:6, flexWrap:'wrap' }}>
              {platforms.map(id=><span key={id} style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20, background:'var(--gray-50)', color:'var(--text-muted)' }}>{PLATFORMS[id]?.name}</span>)}
            </div>
          </div>
          <div style={{ background:'var(--teal-light)', color:'var(--teal-dark)', fontSize:12, fontWeight:600, padding:'4px 10px', borderRadius:20 }}>Free</div>
        </div>
      </Card>

      {/* Upgrade card */}
      <div style={{ background:'#141414', borderRadius:16, padding:'18px', marginBottom:10, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-20, right:-20, width:120, height:120, borderRadius:'50%', background:'rgba(239,159,39,0.12)' }}/>
        <div style={{ fontSize:11, color:'var(--amber)', fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:4 }}>Go Pro — $12/mo</div>
        <div style={{ fontSize:18, fontWeight:600, color:'#fff', marginBottom:4 }}>Unlock the full Co-Pilot</div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.45)', marginBottom:12 }}>Everything you need to earn more every shift</div>

        {/* Show first 4 features always, rest on expand */}
        {PRO_FEATURES.slice(0, showPro ? PRO_FEATURES.length : 4).map(f=>(
          <div key={f.label} style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:2 }}><polyline points="20 6 9 17 4 12"/></svg>
            <div>
              <span style={{ fontSize:13, color:'rgba(255,255,255,0.85)', fontWeight:500 }}>{f.label}</span>
              <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginLeft:6 }}>{f.desc}</span>
            </div>
          </div>
        ))}

        <button onClick={()=>setShowPro(p=>!p)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', fontSize:12, cursor:'pointer', padding:'4px 0', marginBottom:8 }}>
          {showPro?'Show less ↑':`+ ${PRO_FEATURES.length - 4} more features`}
        </button>

        <button style={{ width:'100%', background:'var(--amber)', color:'#141414', border:'none', borderRadius:10, padding:'13px', fontSize:15, fontWeight:700, cursor:'pointer', marginTop:4 }}>
          Upgrade to Pro — $12/mo
        </button>
        <div style={{ textAlign:'center', fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:8 }}>Cancel anytime · No contracts · Instant access</div>
      </div>

      {/* Settings */}
      <SectionLabel>Settings</SectionLabel>
      <Card style={{ padding:0, overflow:'hidden', marginBottom:10 }}>

        {/* Weekly goal */}
        <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: editGoal?10:0 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:500 }}>Weekly goal</div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>${weeklyGoal.toLocaleString()} / week</div>
            </div>
            <button onClick={()=>setEditGoal(p=>!p)} style={{ fontSize:12, color:'var(--teal)', background:'none', border:'1px solid var(--teal-light)', borderRadius:8, padding:'4px 10px', cursor:'pointer', fontWeight:500 }}>
              {editGoal?'Save':'Edit'}
            </button>
          </div>
          {editGoal&&(
            <div style={{ marginTop:8 }}>
              <input type="range" min={200} max={3000} step={50} value={weeklyGoal} onChange={e=>setWeeklyGoal(Number(e.target.value))} style={{ width:'100%', marginBottom:6 }}/>
              <div style={{ display:'flex', gap:6 }}>
                {[500,1000,1500,2000].map(g=><button key={g} onClick={()=>setWeeklyGoal(g)} style={{ flex:1, padding:'7px', borderRadius:8, border:'1px solid var(--border)', background:weeklyGoal===g?'#141414':'var(--surface)', color:weeklyGoal===g?'#fff':'var(--text-secondary)', fontSize:12, fontWeight:500, cursor:'pointer' }}>${g>=1000?`${g/1000}k`:g}</button>)}
              </div>
            </div>
          )}
        </div>

        {/* Home city */}
        <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:500 }}>Home city</div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>Used for surge predictions</div>
          </div>
          <select value={city} onChange={e=>setCity(e.target.value)} style={{ fontSize:13, border:'1px solid var(--border)', borderRadius:8, padding:'6px 10px', background:'var(--bg)', color:'var(--text-primary)', cursor:'pointer' }}>
            {['Chicago','New York','Los Angeles','Houston','Phoenix','Philadelphia','San Antonio','San Diego','Dallas','San Jose'].map(c=><option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Notifications toggle */}
        <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:500 }}>Surge notifications</div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>Alerts when surge hits your area</div>
          </div>
          <div onClick={()=>setNotifs(p=>!p)} style={{ width:44, height:24, borderRadius:12, background:notifications?'var(--teal)':'var(--gray-50)', border:`1px solid ${notifications?'var(--teal)':'var(--border)'}`, cursor:'pointer', position:'relative', transition:'all 0.2s' }}>
            <div style={{ position:'absolute', top:2, left:notifications?22:2, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}/>
          </div>
        </div>

        {/* Privacy */}
        <div style={{ padding:'12px 14px', display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:500 }}>Privacy & data</div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>Manage your data and permissions</div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </Card>

      {/* Navigate to */}
      <SectionLabel>Navigate to</SectionLabel>
      <Card style={{ padding:0, overflow:'hidden', marginBottom:10 }}>
        {menuItems.map((item,i,arr)=>(
          <div key={item.label} onClick={()=>onTabChange&&onTabChange(item.tab)} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderBottom:i<arr.length-1?'1px solid var(--border)':'none', cursor:'pointer' }}>
            <div style={{ width:32, height:32, borderRadius:8, background:'var(--gray-50)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {item.icon==='chart-bar'&&<><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>}
                {item.icon==='map'&&<><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></>}
                {item.icon==='receipt'&&<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></>}
                {item.icon==='bell'&&<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>}
                {item.icon==='trophy'&&<><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></>}
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
