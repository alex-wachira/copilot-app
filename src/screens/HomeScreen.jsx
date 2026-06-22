import { useState } from 'react'
import { PLATFORMS, PLATFORM_EARNINGS, OPTIMIZATION_SIGNALS } from '../lib/platforms'
import { mockGoal } from '../lib/mockData'
import { Card, SectionLabel, AINudge, ProgressBar } from '../components/UI'

const levelColors = { low:'#E8E7E3', med:'rgba(29,158,117,0.3)', high:'#1D9E75', peak:'#EF9F27' }
const mockHours = [{l:'6a',v:'low'},{l:'7',v:'med'},{l:'8',v:'high'},{l:'9',v:'peak'},{l:'10',v:'high'},{l:'11',v:'med'},{l:'12p',v:'low'},{l:'1',v:'low'},{l:'4',v:'med'},{l:'5',v:'peak'},{l:'6',v:'high'},{l:'11p',v:'med'}]

function PlatformPill({ id, earnings, active, onClick }) {
  const p = PLATFORMS[id]
  if (!p) return null
  return (
    <button onClick={() => onClick(id)} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'10px 12px', borderRadius:12, cursor:'pointer', flexShrink:0, border: active?'2px solid #141414':'1px solid var(--border)', background: active?'#141414':'var(--surface)', minWidth:72, transition:'all 0.15s' }}>
      <div style={{ fontSize:12, fontWeight:700, color: active?'#fff':'var(--text-muted)' }}>{p.logo}</div>
      <div style={{ fontSize:14, fontWeight:600, color: active?'#EF9F27':'var(--text-primary)' }}>${earnings?.today||0}</div>
      <div style={{ fontSize:10, color: active?'rgba(255,255,255,0.5)':'var(--text-muted)' }}>today</div>
    </button>
  )
}

function OptSignal({ signal }) {
  const p = PLATFORMS[signal.platform]
  const c = { amber:{bg:'var(--amber-light)',text:'var(--amber-dark)',dot:'#EF9F27'}, coral:{bg:'var(--coral-light)',text:'var(--coral-dark)',dot:'#D85A30'}, teal:{bg:'var(--teal-light)',text:'var(--teal-dark)',dot:'#1D9E75'}, green:{bg:'var(--green-light)',text:'var(--green-dark)',dot:'#639922'} }[signal.color]||{bg:'var(--teal-light)',text:'var(--teal-dark)',dot:'#1D9E75'}
  return (
    <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)' }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
        <div style={{ width:8, height:8, borderRadius:'50%', background:c.dot, flexShrink:0, marginTop:5 }}/>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
            <span style={{ fontSize:13, fontWeight:600 }}>{signal.title}</span>
            <span style={{ fontSize:10, fontWeight:600, padding:'1px 6px', borderRadius:20, background:c.bg, color:c.text }}>{p?.name}</span>
          </div>
          <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.5, marginBottom:4 }}>{signal.detail}</div>
          <div style={{ fontSize:12, fontWeight:600, color:c.dot }}>{signal.earnDelta}</div>
        </div>
        {signal.validUntil && <div style={{ fontSize:10, color:'var(--text-muted)', flexShrink:0, background:'var(--gray-50)', padding:'2px 7px', borderRadius:20 }}>until {signal.validUntil}</div>}
      </div>
    </div>
  )
}

export default function HomeScreen({ driver }) {
  const driverPlatforms = driver?.platforms || ['uber']
  const [activePlatform, setActivePlatform] = useState('all')
  const totalToday = driverPlatforms.reduce((s,id) => s+(PLATFORM_EARNINGS[id]?.today||0), 0)
  const totalWeek  = driverPlatforms.reduce((s,id) => s+(PLATFORM_EARNINGS[id]?.week||0), 0)
  const goal = driver?.weeklyGoal || mockGoal.weekly
  const pct  = Math.min(100, Math.round((totalWeek/goal)*100))
  const remaining = goal - totalWeek
  const visibleSignals = OPTIMIZATION_SIGNALS.filter(s => driverPlatforms.includes(s.platform) && (activePlatform==='all'||s.platform===activePlatform))
  const apd = activePlatform !== 'all' ? PLATFORM_EARNINGS[activePlatform] : null
  const displayPerHour = apd ? apd.perHour : (totalToday/3.5).toFixed(2)

  return (
    <div className="screen" style={{ padding:'0 16px' }}>
      <div style={{ padding:'20px 0 4px' }}>
        <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:2 }}>good morning</div>
        <div style={{ fontSize:24, fontWeight:600, letterSpacing:'-0.3px' }}>{driver?.name||'Driver'} 👋</div>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:8 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:'var(--teal)' }}/>
          <span style={{ fontSize:13, color:'var(--text-secondary)' }}>Online · 2h 14m today</span>
          <div style={{ marginLeft:'auto', background:'rgba(239,159,39,0.15)', color:'var(--amber-dark)', fontSize:12, fontWeight:600, padding:'3px 10px', borderRadius:20, border:'1px solid rgba(239,159,39,0.3)' }}>🔥 5-day streak</div>
        </div>
      </div>

      {driverPlatforms.length > 1 && (
        <div style={{ display:'flex', gap:8, overflowX:'auto', padding:'12px 0 4px', scrollbarWidth:'none' }}>
          <button onClick={() => setActivePlatform('all')} style={{ padding:'10px 14px', borderRadius:12, border: activePlatform==='all'?'2px solid #141414':'1px solid var(--border)', background: activePlatform==='all'?'#141414':'var(--surface)', cursor:'pointer', flexShrink:0 }}>
            <div style={{ fontSize:12, fontWeight:700, color: activePlatform==='all'?'#fff':'var(--text-muted)' }}>ALL</div>
            <div style={{ fontSize:14, fontWeight:600, color: activePlatform==='all'?'#EF9F27':'var(--text-primary)' }}>${totalToday}</div>
            <div style={{ fontSize:10, color: activePlatform==='all'?'rgba(255,255,255,0.5)':'var(--text-muted)' }}>today</div>
          </button>
          {driverPlatforms.map(id => <PlatformPill key={id} id={id} earnings={PLATFORM_EARNINGS[id]} active={activePlatform===id} onClick={setActivePlatform}/>)}
        </div>
      )}

      <Card style={{ margin:'12px 0 10px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
          <div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:2 }}>{activePlatform==='all'?'All platforms':PLATFORMS[activePlatform]?.name} · weekly goal</div>
            <div style={{ fontSize:26, fontWeight:600, letterSpacing:'-0.5px' }}>${totalWeek.toLocaleString()} <span style={{ fontSize:15, fontWeight:400, color:'var(--text-muted)' }}>/ ${goal.toLocaleString()}</span></div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:11, color:'var(--text-muted)' }}>Fri in 3d</div>
            <div style={{ fontSize:15, fontWeight:600, color:'var(--teal)', marginTop:2 }}>{pct}%</div>
          </div>
        </div>
        <ProgressBar pct={pct} color="linear-gradient(90deg, var(--teal), var(--amber))"/>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text-muted)', marginTop:6 }}>
          <span>${remaining.toLocaleString()} to go</span><span>~${Math.ceil(remaining/3)}/day needed</span>
        </div>
      </Card>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
        {[
          { label:'Earnings/hr', value:`$${Number(displayPerHour).toFixed(2)}`, note:'↑ above avg', up:true },
          { label:'Today total', value:`$${apd?apd.today:totalToday}`, note:`${apd?(apd.orders||apd.rides||0):driverPlatforms.reduce((s,id)=>s+(PLATFORM_EARNINGS[id]?.rides||PLATFORM_EARNINGS[id]?.orders||0),0)} jobs` },
          { label:'Active apps', value:driverPlatforms.length, note:driverPlatforms.map(id=>PLATFORMS[id]?.name).join(', ') },
          { label:'Dead miles', value:'12%', note:'↓ -4% this week', up:false },
        ].map((s,i) => (
          <div key={i} style={{ background:'var(--surface)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)', padding:'10px 12px' }}>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:3 }}>{s.label}</div>
            <div style={{ fontSize:20, fontWeight:600 }}>{s.value}</div>
            <div style={{ fontSize:11, marginTop:2, color: s.up===true?'var(--teal)':s.up===false?'var(--coral)':'var(--text-muted)' }}>{s.note}</div>
          </div>
        ))}
      </div>

      <AINudge>{driverPlatforms.includes('doordash')?<>DoorDash Peak Pay active in Wicker Park (+$2/order). Switch now — est. <strong>+$4.20/hr</strong> vs Uber Eats.</>:<>Airport surge ends at 11am. Head to <strong>Midtown</strong> now — avg $28/hr on Tuesdays.</>}</AINudge>

      {driverPlatforms.length > 1 && visibleSignals.length > 0 && <>
        <SectionLabel>Cross-platform optimizer</SectionLabel>
        <Card style={{ padding:0, overflow:'hidden', marginBottom:10 }}>
          {visibleSignals.map(s => <OptSignal key={s.id} signal={s}/>)}
          <div style={{ padding:'10px 14px', fontSize:12, color:'var(--text-muted)', background:'var(--gray-50)' }}>Updated every 5 min · based on your city + active platforms</div>
        </Card>
      </>}

      <SectionLabel>Best hours today</SectionLabel>
      <Card style={{ marginBottom:16 }}>
        <div style={{ display:'flex', gap:3, alignItems:'flex-end', height:40, marginBottom:6 }}>
          {mockHours.map((h,i) => <div key={i} style={{ flex:1 }}><div style={{ width:'100%', height:h.v==='peak'?36:h.v==='high'?28:h.v==='med'?18:8, background:levelColors[h.v], borderRadius:'3px 3px 0 0' }}/></div>)}
        </div>
        <div style={{ display:'flex', gap:3 }}>
          {mockHours.map((h,i) => <div key={i} style={{ flex:1, textAlign:'center', fontSize:9, color:'var(--text-muted)' }}>{h.l}</div>)}
        </div>
        <div style={{ display:'flex', gap:12, marginTop:10, fontSize:11, color:'var(--text-muted)' }}>
          {[['#EF9F27','Peak'],['#1D9E75','Good'],['rgba(29,158,117,0.3)','Fair']].map(([c,l]) => <span key={l} style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:8, height:8, borderRadius:2, background:c, display:'inline-block' }}/>{l}</span>)}
        </div>
      </Card>
    </div>
  )
}
