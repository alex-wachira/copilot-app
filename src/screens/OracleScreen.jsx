// ============================================================
// Event Oracle — routes drivers to FUTURE demand, not past.
// Live countdowns to event endings + positioning advice.
// ============================================================

import { useState, useEffect } from 'react'
import { Card, SectionLabel } from '../components/UI'
import { loadCity } from '../lib/cityService'

// Oracle events (production: PredictHQ + flight APIs feed this)
function buildOracleEvents() {
  const now = Date.now()
  return [
    { id:1, icon:'🎵', title:'Concert — Chase Arena', attendance:4200,  endsAt: now + 22*60000,  spot:'Michigan Ave & Madison', driversNearby:4,  boost:'2.5-3x expected', category:'concert' },
    { id:2, icon:'✈️', title:'Flight wave — 6 arrivals', attendance:1100, endsAt: now + 48*60000,  spot:'Airport Terminal 2 lot', driversNearby:11, boost:'Steady queue, 8min waits', category:'flights' },
    { id:3, icon:'🏀', title:'Bulls game — United Center', attendance:20000, endsAt: now + 3.2*3600000, spot:'W Madison staging area', driversNearby:9, boost:'3x+ for 45 min after', category:'sports' },
    { id:4, icon:'🍽', title:'Restaurant week — River North', attendance:800, endsAt: now + 5*3600000, spot:'Clark & Illinois', driversNearby:6, boost:'Delivery orders +40%', category:'dining' },
    { id:5, icon:'🎭', title:'Theater letout — 3 venues', attendance:2600, endsAt: now + 1.4*3600000, spot:'State St theater district', driversNearby:5, boost:'1.8-2.2x for 30 min', category:'theater' },
  ].sort((a,b) => a.endsAt - b.endsAt)
}

function countdown(endsAt) {
  const ms = endsAt - Date.now()
  if (ms <= 0) return { label:'NOW', urgent:true, mins:0 }
  const mins = Math.floor(ms / 60000)
  if (mins < 60) return { label:`${mins}m`, urgent: mins <= 30, mins }
  const h = Math.floor(mins/60)
  return { label:`${h}h ${mins%60}m`, urgent:false, mins }
}

export default function OracleScreen({ driver, onBack }) {
  const [events] = useState(buildOracleEvents())
  const [, tick] = useState(0)
  const city = loadCity()?.label || driver?.city || 'Chicago'

  // Refresh countdowns every 30s
  useEffect(() => {
    const t = setInterval(() => tick(x => x+1), 30000)
    return () => clearInterval(t)
  }, [])

  const nextUp = events.find(e => countdown(e.endsAt).mins <= 45)

  return (
    <div className="screen" style={{ padding:'0 16px' }}>
      <div style={{ padding:'20px 0 4px', display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={onBack} style={{ background:'none', border:'1px solid var(--border)', borderRadius:10, width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text-primary)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div>
          <div style={{ fontSize:13, color:'var(--text-muted)' }}>demand before it happens</div>
          <div style={{ fontSize:22, fontWeight:600, letterSpacing:'-0.3px' }}>🔮 Event Oracle</div>
        </div>
      </div>

      <div style={{ fontSize:13, color:'var(--text-secondary)', margin:'8px 0 4px', lineHeight:1.5 }}>
        Surge maps show the past — by the time you arrive, it's gone. The Oracle routes you to where demand is <em>about to spike</em> in {city}.
      </div>

      {/* Priority alert */}
      {nextUp && (
        <div style={{ background:'#141414', borderRadius:16, padding:'16px', margin:'10px 0', border:'1px solid rgba(239,159,39,0.4)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--amber)', animation:'pulse 1.5s infinite' }}/>
            <span style={{ fontSize:11, fontWeight:700, color:'var(--amber)', letterSpacing:'0.05em' }}>MOVE NOW</span>
            <span style={{ marginLeft:'auto', fontSize:13, fontWeight:700, color:'#fff' }}>ends in {countdown(nextUp.endsAt).label}</span>
          </div>
          <div style={{ fontSize:16, fontWeight:700, color:'#fff', marginBottom:4 }}>{nextUp.icon} {nextUp.title}</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.65)', lineHeight:1.5, marginBottom:10 }}>
            {nextUp.attendance.toLocaleString()} people leaving · only <strong style={{ color:'var(--amber)' }}>{nextUp.driversNearby} drivers</strong> within 2 miles · {nextUp.boost}
          </div>
          <a href={`https://www.google.com/maps/search/${encodeURIComponent(nextUp.spot + ' ' + city)}`} target="_blank" rel="noreferrer" style={{ display:'block', textAlign:'center', background:'var(--amber)', color:'#141414', fontSize:14, fontWeight:700, padding:'12px', borderRadius:11, textDecoration:'none' }}>
            Navigate to {nextUp.spot} →
          </a>
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
        </div>
      )}

      <SectionLabel>Upcoming demand windows</SectionLabel>
      <Card style={{ padding:0, overflow:'hidden', marginBottom:12 }}>
        {events.map((e,i) => {
          const cd = countdown(e.endsAt)
          return (
            <div key={e.id} style={{ padding:'12px 14px', borderBottom: i<events.length-1?'1px solid var(--border)':'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                <span style={{ fontSize:16 }}>{e.icon}</span>
                <span style={{ fontSize:13, fontWeight:600, flex:1 }}>{e.title}</span>
                <span style={{ fontSize:12, fontWeight:700, padding:'2px 9px', borderRadius:20, background: cd.urgent?'var(--amber-light)':'var(--gray-50)', color: cd.urgent?'var(--amber-dark)':'var(--text-muted)' }}>
                  {cd.urgent ? '⏰ ' : ''}{cd.label}
                </span>
              </div>
              <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.5 }}>
                {e.attendance.toLocaleString()} attendees · {e.driversNearby} drivers nearby · {e.boost}
              </div>
              <div style={{ fontSize:11, color:'var(--teal)', fontWeight:500, marginTop:3 }}>📍 Stage at: {e.spot}</div>
            </div>
          )
        })}
      </Card>

      <div style={{ fontSize:11, color:'var(--text-muted)', textAlign:'center', marginBottom:16, lineHeight:1.6 }}>
        Driver-nearby counts are estimates from crowdsourced Co-Pilot data.<br/>Event feed refreshes every 15 minutes.
      </div>
    </div>
  )
}
