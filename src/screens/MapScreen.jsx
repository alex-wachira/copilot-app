import { useState } from 'react'
import { PLATFORMS, RESTAURANT_ZONES } from '../lib/platforms'
import { mockSurgeZones, mockEvents } from '../lib/mockData'
import { Card, SectionLabel, Badge, IconBox } from '../components/UI'

const filters = ['Surge zones', 'Hot zones', 'Events']

export default function MapScreen({ surge, driver }) {
  const [activeFilter, setActiveFilter] = useState('Surge zones')
  const driverPlatforms = driver?.platforms || ['uber']
  const hasDelivery = driverPlatforms.some(id => PLATFORMS[id]?.type === 'delivery')

  return (
    <div className="screen">
      <div style={{ position:'relative', height:240, background:'#1e2330', overflow:'hidden' }}>
        <svg width="100%" height="100%" style={{ position:'absolute', inset:0 }}>
          <defs><pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
          <rect x="0" y="55" width="100%" height="4" fill="rgba(255,255,255,0.1)" rx="2"/>
          <rect x="0" y="140" width="100%" height="5" fill="rgba(255,255,255,0.14)" rx="2"/>
          <rect x="80" y="0" width="4" height="100%" fill="rgba(255,255,255,0.1)" rx="2"/>
          <rect x="200" y="0" width="5" height="100%" fill="rgba(255,255,255,0.14)" rx="2"/>
          <circle cx="110" cy="80" r="55" fill="rgba(226,75,74,0.18)"/>
          <circle cx="110" cy="80" r="30" fill="rgba(226,75,74,0.22)"/>
          <circle cx="230" cy="150" r="42" fill="rgba(239,159,39,0.16)"/>
          <circle cx="60" cy="160" r="36" fill="rgba(29,158,117,0.14)"/>
          {hasDelivery && <>
            <circle cx="180" cy="60" r="20" fill="rgba(255,48,8,0.25)"/>
            <circle cx="260" cy="100" r="16" fill="rgba(6,193,103,0.25)"/>
          </>}
          <rect x="55" y="44" width="78" height="18" rx="4" fill="rgba(0,0,0,0.5)"/>
          <text x="64" y="57" fill="#fff" fontSize="10" fontFamily="DM Sans,sans-serif" fontWeight="500">Downtown</text>
          <rect x="196" y="132" width="56" height="18" rx="4" fill="rgba(0,0,0,0.5)"/>
          <text x="205" y="145" fill="#fff" fontSize="10" fontFamily="DM Sans,sans-serif" fontWeight="500">Midtown</text>
          {hasDelivery && <>
            <rect x="155" y="48" width="52" height="16" rx="4" fill="rgba(255,48,8,0.7)"/>
            <text x="162" y="60" fill="#fff" fontSize="9" fontFamily="DM Sans,sans-serif" fontWeight="600">DD Hot Zone</text>
            <rect x="238" y="88" width="46" height="16" rx="4" fill="rgba(6,193,103,0.7)"/>
            <text x="244" y="100" fill="#fff" fontSize="9" fontFamily="DM Sans,sans-serif" fontWeight="600">UE Boost</text>
          </>}
          <rect x="148" y="22" width="64" height="20" rx="10" fill="#EF9F27"/>
          <text x="158" y="36" fill="#141414" fontSize="10" fontFamily="DM Sans,sans-serif" fontWeight="600">2.1x surge</text>
          <circle cx="168" cy="110" r="10" fill="rgba(59,130,246,0.25)"/>
          <circle cx="168" cy="110" r="6" fill="#3b82f6" stroke="#fff" strokeWidth="2"/>
          <rect x="144" y="90" width="28" height="16" rx="3" fill="rgba(0,0,0,0.5)"/>
          <text x="152" y="102" fill="#fff" fontSize="9" fontFamily="DM Sans,sans-serif">You</text>
        </svg>
        <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'linear-gradient(transparent,rgba(0,0,0,0.7))', padding:'20px 12px 10px', display:'flex', gap:7 }}>
          {filters.filter(f => f !== 'Hot zones' || hasDelivery).map(f => (
            <button key={f} onClick={() => setActiveFilter(f)} style={{ fontSize:12, fontWeight:500, padding:'4px 12px', borderRadius:20, border:'none', cursor:'pointer', background: activeFilter===f?'var(--amber)':'rgba(255,255,255,0.18)', color: activeFilter===f?'#141414':'rgba(255,255,255,0.9)', transition:'all 0.15s' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:'0 16px' }}>
        {activeFilter === 'Surge zones' && <>
          <SectionLabel>Live surge zones</SectionLabel>
          <Card style={{ padding:0, overflow:'hidden', marginBottom:10 }}>
            {mockSurgeZones.map((z,i) => (
              <div key={z.name} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', borderBottom: i<mockSurgeZones.length-1?'1px solid var(--border)':'none' }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:z.color, flexShrink:0 }}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:500 }}>{z.name}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>{z.distance} away · {z.ends}</div>
                </div>
                <div style={{ fontSize:15, fontWeight:600, color:z.color }}>{z.mult}</div>
              </div>
            ))}
          </Card>
        </>}

        {activeFilter === 'Hot zones' && hasDelivery && <>
          <SectionLabel>Delivery hot zones</SectionLabel>
          <Card style={{ padding:0, overflow:'hidden', marginBottom:10 }}>
            {RESTAURANT_ZONES.map((z,i) => (
              <div key={z.name} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', borderBottom: i<RESTAURANT_ZONES.length-1?'1px solid var(--border)':'none' }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                    <span style={{ fontSize:13, fontWeight:500 }}>{z.name}</span>
                    <span style={{ fontSize:10, color:'var(--teal)', background:'var(--teal-light)', padding:'1px 6px', borderRadius:20, fontWeight:600 }}>{z.orders}</span>
                  </div>
                  <div style={{ display:'flex', gap:4 }}>
                    {z.platforms.filter(id => driverPlatforms.includes(id)).map(id => (
                      <span key={id} style={{ fontSize:10, padding:'1px 6px', borderRadius:20, background:'var(--gray-50)', color:'var(--text-muted)', fontWeight:500 }}>{PLATFORMS[id]?.name}</span>
                    ))}
                    <span style={{ fontSize:11, color:'var(--text-muted)' }}>· avg wait {z.waitAvg}min</span>
                  </div>
                </div>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--teal)' }}>{z.earning}</div>
              </div>
            ))}
          </Card>
        </>}

        {activeFilter === 'Events' && <>
          <SectionLabel>Upcoming events</SectionLabel>
          <Card style={{ padding:0, overflow:'hidden' }}>
            {mockEvents.map((ev,i) => (
              <div key={ev.title} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', borderBottom: i<mockEvents.length-1?'1px solid var(--border)':'none' }}>
                <IconBox color={ev.color}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {ev.icon==='music'&&<><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></>}
                    {ev.icon==='trophy'&&<><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></>}
                  </svg>
                </IconBox>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:500 }}>{ev.title}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>{ev.sub}</div>
                </div>
                <Badge color={ev.color}>{ev.badge}</Badge>
              </div>
            ))}
          </Card>
        </>}
      </div>
    </div>
  )
}
