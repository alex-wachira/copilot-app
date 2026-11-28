// ============================================================
// Event Oracle — real venues in the driver's city + the times
// crowds usually leave them. No invented events: each venue has
// a "What's on tonight" link to check the real schedule.
// (A live event feed can plug in here later.)
// ============================================================

import { useState, useEffect } from 'react'
import { Card, SectionLabel } from '../components/UI'
import { loadCity } from '../lib/cityService'
import { resolveCityCenter, loadCityPlaces, demandNow, DEMAND_STYLE } from '../lib/placesService'

// When crowds typically leave each kind of venue
const LETOUT = {
  stadium:           { icon:'🏟', when:'Night games & concerts: ~9:30–11pm · day games: ~4–5pm', tip:'Stage 2–3 blocks away from the main exits — pickup zones jam fast.' },
  theatre:           { icon:'🎭', when:'Evening shows: ~10–10:30pm · matinees: ~4–5pm', tip:'Short burst of demand — be close before the curtain falls.' },
  concert_hall:      { icon:'🎵', when:'Most shows end ~10:30–11:30pm', tip:'Rides spike for 30–45 minutes after the show.' },
  events_venue:      { icon:'🎟', when:'Varies by event — check tonight\'s schedule', tip:'Big events can mean 30–60 minutes of steady rides.' },
  arts_centre:       { icon:'🎨', when:'Evening events: ~9–10:30pm', tip:'Smaller crowds; good for short trips nearby.' },
  conference_centre: { icon:'🏢', when:'Weekday conferences: ~5–6:30pm', tip:'Hotel and airport trips — often longer, better-paying rides.' },
}

export default function OracleScreen({ driver, onBack }) {
  const [places, setPlaces] = useState(null)
  const [err, setErr] = useState('')
  const city = loadCity()?.label || driver?.city || 'your city'
  const short = city.split(',')[0]

  useEffect(() => {
    let alive = true
    resolveCityCenter(loadCity(), driver?.city)
      .then(loadCityPlaces)
      .then(p => { if (alive) setPlaces(p) })
      .catch(e => { if (alive) setErr(e.message || 'Could not load venues') })
    return () => { alive = false }
  }, [driver?.city])

  const venues = places?.venues || []
  const airport = places?.airports?.[0]
  const airportLevel = demandNow('airport')
  const nightLevel = demandNow('nightlife')

  return (
    <div className="screen" style={{ padding:'0 16px' }}>
      <div style={{ padding:'20px 0 4px', display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={onBack} style={{ background:'none', border:'1px solid var(--border)', borderRadius:10, width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text-primary)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div>
          <div style={{ fontSize:13, color:'var(--text-muted)' }}>get there before the crowd leaves</div>
          <div style={{ fontSize:22, fontWeight:600, letterSpacing:'-0.3px' }}>🔮 Event Oracle</div>
        </div>
      </div>

      <div style={{ fontSize:13, color:'var(--text-secondary)', margin:'8px 0 4px', lineHeight:1.5 }}>
        Surge shows up <em>after</em> a crowd leaves — by then it's often gone. Check what's on at {short}'s big venues and be nearby when it lets out.
      </div>

      {/* Right now */}
      <SectionLabel>Right now in {short}</SectionLabel>
      <Card style={{ padding:0, overflow:'hidden', marginBottom:10 }}>
        {airport && (
          <Row icon="✈️" title={airport.name} sub="Arrival waves: early morning and late afternoon–evening"
            right={<span style={{ fontSize:11, fontWeight:600, color:DEMAND_STYLE[airportLevel].color }}>{DEMAND_STYLE[airportLevel].label}</span>} />
        )}
        <Row icon="🍸" title="Bars & nightlife" sub="Busiest Fri–Sat, 10pm to 2am" last
          right={<span style={{ fontSize:11, fontWeight:600, color:DEMAND_STYLE[nightLevel].color }}>{DEMAND_STYLE[nightLevel].label}</span>} />
      </Card>

      <SectionLabel>Big venues · check tonight</SectionLabel>
      {err && <Card style={{ marginBottom:10, fontSize:13, color:'var(--coral)' }}>{err}</Card>}
      {!places && !err && <Card style={{ marginBottom:10, fontSize:13, color:'var(--text-muted)' }}>Finding venues in {short}…</Card>}
      {places && venues.length === 0 && <Card style={{ marginBottom:10, fontSize:13, color:'var(--text-muted)' }}>No large venues found near {short}.</Card>}
      {venues.length > 0 && (
        <Card style={{ padding:0, overflow:'hidden', marginBottom:12 }}>
          {venues.map((v,i) => {
            const info = LETOUT[v.kind] || LETOUT.events_venue
            return (
              <div key={v.name} style={{ padding:'12px 14px', borderBottom: i<venues.length-1?'1px solid var(--border)':'none' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:16 }}>{info.icon}</span>
                  <span style={{ fontSize:13, fontWeight:600, flex:1 }}>{v.name}</span>
                  <a href={`https://www.google.com/search?q=${encodeURIComponent(v.name + ' ' + short + ' events today')}`} target="_blank" rel="noreferrer" style={{ fontSize:12, fontWeight:600, color:'var(--teal)', textDecoration:'none', flexShrink:0 }}>What's on →</a>
                </div>
                <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.5 }}>⏰ {info.when}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>💡 {info.tip}</div>
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${v.lat},${v.lng}`} target="_blank" rel="noreferrer" style={{ fontSize:11, color:'var(--teal)', fontWeight:500, marginTop:4, display:'inline-block', textDecoration:'none' }}>📍 Navigate</a>
              </div>
            )
          })}
        </Card>
      )}

      <div style={{ fontSize:11, color:'var(--text-muted)', textAlign:'center', marginBottom:16, lineHeight:1.6 }}>
        Venues from OpenStreetMap. Let-out times are typical patterns, not tonight's schedule — tap "What's on" to check.
      </div>
    </div>
  )
}

function Row({ icon, title, sub, right, last }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', borderBottom: last?'none':'1px solid var(--border)' }}>
      <span style={{ fontSize:16 }}>{icon}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{title}</div>
        <div style={{ fontSize:11, color:'var(--text-muted)' }}>{sub}</div>
      </div>
      {right}
    </div>
  )
}
