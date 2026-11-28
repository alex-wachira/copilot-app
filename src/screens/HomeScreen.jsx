import { useState } from 'react'
import { PLATFORMS } from '../lib/platforms'
import { Card, SectionLabel, AINudge, ProgressBar } from '../components/UI'
import { getActiveShift, computeShiftStats } from '../lib/shiftService'
import { periodStats, platformToday, streakDays, hoursOnlineToday, allTrips, hourLabel } from '../lib/realStats'
import { demandNow } from '../lib/placesService'

const levelColors = { low:'#E8E7E3', med:'rgba(29,158,117,0.3)', high:'#1D9E75', peak:'#EF9F27' }
const levelLabels = { low:'Slow', med:'Fair', high:'Good', peak:'Peak' }
const HOURS = [6,7,8,9,11,12,13,15,17,18,20,22]
const TYPE_WHY = { downtown:'commuters', airport:'airport runs', nightlife:'bar & nightlife crowd', food:'meal-time delivery orders' }

// Demand pattern by hour (same rules as the map) + the driver's OWN $/hr in that hour, if logged
function buildHours(platforms) {
  const ride = platforms.some(id => PLATFORMS[id]?.type === 'rideshare')
  const food = platforms.some(id => PLATFORMS[id]?.type === 'delivery')
  const types = [...(ride ? ['downtown','nightlife'] : []), ...(food ? ['food'] : [])]  // airport shown on the map instead
  const trips = allTrips()
  const now = new Date()
  return HOURS.map(hr => {
    const at = new Date(now); at.setHours(hr, 30, 0, 0)
    if (hr < 4) at.setDate(at.getDate() + 1)
    const levels = types.map(t => [t, demandNow(t, at)])
    const highs = levels.filter(([,l]) => l === 'high').map(([t]) => t)
    const v = highs.length >= 2 ? 'peak' : highs.length === 1 ? 'high' : levels.some(([,l]) => l === 'medium') ? 'med' : 'low'
    const mine = trips.filter(t => t.at.getHours() === hr)
    const myAvg = mine.length >= 3 ? Math.round(mine.reduce((s,t) => s + t.payout + t.tip, 0) / mine.length) : null
    return {
      l: hourLabel(hr).replace('am','a').replace('pm','p'), hr, v, myAvg,
      why: highs.length ? `Usually busy: ${highs.map(t => TYPE_WHY[t]).join(' + ')}` : v === 'med' ? 'Steady, average demand for this time' : 'Typically one of the slower stretches',
    }
  })
}

function PlatformPill({ id, earnings, active, onClick }) {
  const p = PLATFORMS[id]
  if (!p) return null
  return (
    <button onClick={() => onClick(id)} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'10px 12px', borderRadius:12, cursor:'pointer', flexShrink:0, border: active?'2px solid #141414':'1px solid var(--border)', background: active?'#141414':'var(--surface)', minWidth:72, transition:'all 0.15s' }}>
      <div style={{ fontSize:12, fontWeight:700, color: active?'#fff':'var(--text-muted)' }}>{p.logo}</div>
      <div style={{ fontSize:14, fontWeight:600, color: active?'#EF9F27':'var(--text-primary)' }}>${Math.round(earnings?.gross||0)}</div>
      <div style={{ fontSize:10, color: active?'rgba(255,255,255,0.5)':'var(--text-muted)' }}>today</div>
    </button>
  )
}

export default function HomeScreen({ driver, avatar, onTabChange }) {
  const [selectedHour, setSelectedHour] = useState(null)
  const activeShift = getActiveShift()
  const shiftStats = activeShift ? computeShiftStats(activeShift) : null
  const driverPlatforms = driver?.platforms || ['uber']
  const [activePlatform, setActivePlatform] = useState('all')
  const today    = periodStats('today')
  const week     = periodStats('week')
  const byApp    = platformToday(driverPlatforms)
  const apd      = activePlatform !== 'all' ? byApp[activePlatform] : null
  const weekApp  = activePlatform !== 'all' ? periodStats('week', activePlatform) : week
  const goal     = driver?.weeklyGoal || 1000
  const pct      = Math.min(100, Math.round((week.gross/goal)*100))
  const remaining = Math.max(0, goal - week.gross)
  const daysLeft = 7 - ((new Date().getDay() + 6) % 7)   // incl. today, week ends Sunday
  const streak   = streakDays()
  const onlineH  = hoursOnlineToday()
  const hasData  = allTrips().length > 0
  const hours    = buildHours(driverPlatforms)
  const h = new Date().getHours()
  const greeting = h < 12 ? 'good morning' : h < 17 ? 'good afternoon' : 'good evening'
  const fmtH = (x) => `${Math.floor(x)}h ${Math.round((x % 1) * 60)}m`
  const shown = apd || today
  const weekByApp = driverPlatforms.map(id => ({ id, ...periodStats('week', id) })).filter(p => p.jobs > 0)

  return (
    <div className="screen" style={{ padding:'0 16px' }}>
      <div style={{ padding:'20px 0 4px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:2 }}>{greeting}</div>
            <div style={{ fontSize:24, fontWeight:600, letterSpacing:'-0.3px' }}>{driver?.name||'Driver'} 👋</div>
          </div>
          {/* Avatar in header */}
          <div style={{ width:40, height:40, borderRadius:'50%', background: avatar?'transparent':'linear-gradient(135deg, var(--amber), var(--teal))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:600, color:'#fff', overflow:'hidden', border:'2px solid var(--border)', flexShrink:0 }}>
            {avatar
              ? <img src={avatar} alt="profile" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              : (driver?.name||'D')[0]
            }
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:8 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background: activeShift?'var(--teal)':'var(--text-muted)' }}/>
          <span style={{ fontSize:13, color:'var(--text-secondary)' }}>{activeShift ? 'On shift' : 'Off shift'} · {fmtH(onlineH)} today</span>
          {streak >= 2 && <div style={{ marginLeft:'auto', background:'rgba(239,159,39,0.15)', color:'var(--amber-dark)', fontSize:12, fontWeight:600, padding:'3px 10px', borderRadius:20, border:'1px solid rgba(239,159,39,0.3)' }}>🔥 {streak}-day streak</div>}
        </div>
      </div>

      {driverPlatforms.length > 1 && (
        <div style={{ display:'flex', gap:8, overflowX:'auto', padding:'12px 0 4px', scrollbarWidth:'none' }}>
          <button onClick={() => setActivePlatform('all')} style={{ padding:'10px 14px', borderRadius:12, border: activePlatform==='all'?'2px solid #141414':'1px solid var(--border)', background: activePlatform==='all'?'#141414':'var(--surface)', cursor:'pointer', flexShrink:0 }}>
            <div style={{ fontSize:12, fontWeight:700, color: activePlatform==='all'?'#fff':'var(--text-muted)' }}>ALL</div>
            <div style={{ fontSize:14, fontWeight:600, color: activePlatform==='all'?'#EF9F27':'var(--text-primary)' }}>${Math.round(today.gross)}</div>
            <div style={{ fontSize:10, color: activePlatform==='all'?'rgba(255,255,255,0.5)':'var(--text-muted)' }}>today</div>
          </button>
          {driverPlatforms.map(id => <PlatformPill key={id} id={id} earnings={byApp[id]} active={activePlatform===id} onClick={setActivePlatform}/>)}
        </div>
      )}

      {/* Active shift banner */}
      {shiftStats && (
        <div onClick={() => onTabChange && onTabChange('shift')} style={{ background:'#141414', borderRadius:14, padding:'12px 16px', margin:'12px 0 0', display:'flex', alignItems:'center', gap:12, cursor:'pointer' }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'#1D9E75', animation:'pulse 2s infinite', flexShrink:0 }}/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'#fff' }}>Shift live · {shiftStats.elapsedLabel}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>{shiftStats.tripCount} trips · ${shiftStats.grossPerHour}/hr gross</div>
          </div>
          <div style={{ fontSize:18, fontWeight:700, color:'var(--amber)' }}>${shiftStats.grossEarnings.toFixed(2)}</div>
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
        </div>
      )}

      <Card style={{ margin:'12px 0 10px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
          <div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:2 }}>{activePlatform==='all'?'All platforms':PLATFORMS[activePlatform]?.name} · weekly goal</div>
            <div style={{ fontSize:26, fontWeight:600, letterSpacing:'-0.5px' }}>${Math.round(weekApp.gross).toLocaleString()} <span style={{ fontSize:15, fontWeight:400, color:'var(--text-muted)' }}>/ ${goal.toLocaleString()}</span></div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:11, color:'var(--text-muted)' }}>{daysLeft} day{daysLeft>1?'s':''} left</div>
            <div style={{ fontSize:15, fontWeight:600, color:'var(--teal)', marginTop:2 }}>{pct}%</div>
          </div>
        </div>
        <ProgressBar pct={pct} color="linear-gradient(90deg, var(--teal), var(--amber))"/>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text-muted)', marginTop:6 }}>
          <span>{remaining > 0 ? `$${Math.round(remaining).toLocaleString()} to go` : 'Goal reached 🎉'}</span>{remaining > 0 && <span>~${Math.ceil(remaining/daysLeft)}/day needed</span>}
        </div>
      </Card>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
        {[
          { label:'Earnings/hr', value: shown.perHour!=null ? `$${shown.perHour.toFixed(2)}` : '—', note: shown.perHour!=null ? 'today, gross' : 'start a shift to see this' },
          { label:'Today total', value:`$${shown.gross.toFixed(0)}`, note:`${shown.jobs} job${shown.jobs===1?'':'s'}` },
          { label:'Active apps', value:driverPlatforms.length, note:driverPlatforms.map(id=>PLATFORMS[id]?.name).join(', ') },
          { label:'Per mile', value: week.perMile!=null ? `$${week.perMile.toFixed(2)}` : '—', note: week.perMile!=null ? 'this week, gross' : 'log miles on trips' },
        ].map((s,i) => (
          <div key={i} style={{ background:'var(--surface)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)', padding:'10px 12px' }}>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:3 }}>{s.label}</div>
            <div style={{ fontSize:20, fontWeight:600 }}>{s.value}</div>
            <div style={{ fontSize:11, marginTop:2, color: s.up===true?'var(--teal)':s.up===false?'var(--coral)':'var(--text-muted)' }}>{s.note}</div>
          </div>
        ))}
      </div>

      <AINudge>{!hasData
        ? <>No trips logged yet. Tap <strong>Shift</strong> to clock in and log each trip — your real earnings, $/hr and goal progress show up here.</>
        : remaining > 0
          ? <>You need about <strong>${Math.ceil(remaining/daysLeft)}/day</strong> for the next {daysLeft} day{daysLeft>1?'s':''} to hit ${goal.toLocaleString()}.{week.perHour ? (() => { const hrs = Math.ceil((remaining/daysLeft)/week.perHour); return hrs <= 14
              ? <> At your ${week.perHour.toFixed(0)}/hr average that's ~{hrs}h a day.</>
              : <> At your ${week.perHour.toFixed(0)}/hr average that's more hours than a day has — you may want to adjust this week's goal in <strong>More</strong>.</> })() : null}</>
          : <>You've hit your weekly goal — nice work. Anything more this week is a bonus.</>}
      </AINudge>

      {weekByApp.length > 0 && <>
        <SectionLabel>This week by app</SectionLabel>
        <Card style={{ padding:0, overflow:'hidden', marginBottom:10 }}>
          {weekByApp.sort((a,b)=>b.gross-a.gross).map((p,i,arr) => (
            <div key={p.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', borderBottom: i<arr.length-1?'1px solid var(--border)':'none' }}>
              <span style={{ fontSize:11, fontWeight:700, width:30, color:'var(--text-muted)' }}>{PLATFORMS[p.id]?.logo}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:500 }}>{PLATFORMS[p.id]?.name}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>{p.jobs} jobs · ${(p.gross/p.jobs).toFixed(2)} per job{p.perMile!=null?` · $${p.perMile}/mi`:''}</div>
              </div>
              <div style={{ fontSize:15, fontWeight:600 }}>${Math.round(p.gross)}</div>
            </div>
          ))}
        </Card>
      </>}

      <SectionLabel>Best hours today</SectionLabel>
      <Card style={{ marginBottom:16 }}>
        <div style={{ display:'flex', gap:3, alignItems:'flex-end', height:52, marginBottom:6 }}>
          {hours.map((h,i) => {
            const isSelected = selectedHour === i
            const isNow = new Date().getHours() === h.hr
            return (
              <button key={i} onClick={() => setSelectedHour(isSelected ? null : i)} style={{ flex:1, background:'none', border:'none', padding:0, cursor:'pointer', display:'flex', flexDirection:'column', justifyContent:'flex-end', height:'100%', position:'relative' }}>
                {isNow && <div style={{ position:'absolute', top:-2, left:'50%', transform:'translateX(-50%)', fontSize:8, color:'var(--teal)', fontWeight:700 }}>NOW</div>}
                <div style={{
                  width:'100%',
                  height: h.v==='peak'?40:h.v==='high'?30:h.v==='med'?20:9,
                  background: levelColors[h.v],
                  borderRadius:'3px 3px 0 0',
                  transition:'all 0.15s',
                  outline: isSelected ? '2px solid var(--text-primary)' : 'none',
                  outlineOffset: 1,
                  transform: isSelected ? 'scaleY(1.08)' : 'none',
                  transformOrigin:'bottom',
                }}/>
              </button>
            )
          })}
        </div>
        <div style={{ display:'flex', gap:3 }}>
          {hours.map((h,i) => <div key={i} style={{ flex:1, textAlign:'center', fontSize:9, fontWeight: selectedHour===i?700:400, color: selectedHour===i?'var(--text-primary)':'var(--text-muted)' }}>{h.l}</div>)}
        </div>

        {/* Tap detail panel */}
        {selectedHour !== null && (() => {
          const hh = hours[selectedHour]
          return (
            <div style={{ marginTop:10, background: hh.v==='peak'?'var(--amber-light)':hh.v==='high'?'var(--teal-light)':'var(--gray-50)', borderRadius:12, padding:'12px 14px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:15, fontWeight:700 }}>{hourLabel(hh.hr)}</span>
                  <span style={{ fontSize:11, fontWeight:600, padding:'2px 9px', borderRadius:20, background: levelColors[hh.v], color: hh.v==='low'?'var(--text-secondary)':'#fff' }}>{levelLabels[hh.v]}</span>
                </div>
                {hh.myAvg!=null && <div style={{ fontSize:13, fontWeight:700, color: hh.v==='peak'?'var(--amber-dark)':'var(--teal-dark)' }}>you avg ${hh.myAvg}/job</div>}
              </div>
              <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.5 }}>{hh.why}</div>
              {(hh.v==='peak'||hh.v==='high') && (
                <div style={{ fontSize:11, fontWeight:600, color:'var(--teal-dark)', marginTop:6 }}>💡 Set a reminder to be online 15 min before</div>
              )}
            </div>
          )
        })()}

        <div style={{ display:'flex', gap:12, marginTop:10, fontSize:11, color:'var(--text-muted)' }}>
          {[['#EF9F27','Peak'],['#1D9E75','Good'],['rgba(29,158,117,0.3)','Fair']].map(([c,l]) => <span key={l} style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:8, height:8, borderRadius:2, background:c, display:'inline-block' }}/>{l}</span>)}
          <span style={{ marginLeft:'auto' }}>Typical pattern · tap a bar</span>
        </div>
      </Card>
    </div>
  )
}
