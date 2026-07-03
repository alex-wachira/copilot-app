import { useState, useEffect } from 'react'
import { PLATFORMS, RESTAURANT_ZONES } from '../lib/platforms'
import { mockSurgeZones, mockEvents } from '../lib/mockData'
import { Card, SectionLabel, Badge, IconBox } from '../components/UI'

const filters = ['Surge zones', 'Hot zones', 'Events']

// City coordinates for map centering
const CITY_COORDS = {
  'Chicago':       { lat: 41.8781, lng: -87.6298, zoom: 12 },
  'New York':      { lat: 40.7128, lng: -74.0060, zoom: 12 },
  'Los Angeles':   { lat: 34.0522, lng: -118.2437, zoom: 11 },
  'Houston':       { lat: 29.7604, lng: -95.3698, zoom: 11 },
  'Phoenix':       { lat: 33.4484, lng: -112.0740, zoom: 11 },
  'default':       { lat: 41.8781, lng: -87.6298, zoom: 12 },
}

export default function MapScreen({ surge, driver }) {
  const [activeFilter, setActiveFilter] = useState('Surge zones')
  const [userLocation, setUserLocation] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const driverPlatforms = driver?.platforms || ['uber']
  const hasDelivery = driverPlatforms.some(id => PLATFORMS[id]?.type === 'delivery')
  const city = driver?.city || 'Chicago'
  const cityCoords = CITY_COORDS[city] || CITY_COORDS.default

  // Get real GPS location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => setLocationError('Location access denied — showing city center'),
        { timeout: 8000 }
      )
    } else {
      setLocationError('Geolocation not supported')
    }
  }, [])

  const mapCenter = userLocation || cityCoords
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${mapCenter.lng - 0.05},${mapCenter.lat - 0.03},${mapCenter.lng + 0.05},${mapCenter.lat + 0.03}&layer=mapnik&marker=${mapCenter.lat},${mapCenter.lng}`

  return (
    <div className="screen">
      {/* Real map via OpenStreetMap embed */}
      <div style={{ position:'relative', height:240, background:'#1e2330', overflow:'hidden' }}>
        <iframe
          src={mapUrl}
          style={{ width:'100%', height:'100%', border:'none', filter:'saturate(0.8) brightness(0.85)' }}
          title="Driver location map"
          loading="lazy"
        />
        {/* Overlay chips */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'linear-gradient(transparent,rgba(0,0,0,0.75))', padding:'20px 12px 10px', display:'flex', gap:7 }}>
          {filters.filter(f => f !== 'Hot zones' || hasDelivery).map(f => (
            <button key={f} onClick={() => setActiveFilter(f)} style={{ fontSize:12, fontWeight:500, padding:'4px 12px', borderRadius:20, border:'none', cursor:'pointer', background: activeFilter===f?'var(--amber)':'rgba(255,255,255,0.18)', color: activeFilter===f?'#141414':'rgba(255,255,255,0.9)', transition:'all 0.15s' }}>
              {f}
            </button>
          ))}
        </div>
        {/* Location status */}
        <div style={{ position:'absolute', top:8, right:8, background:'rgba(0,0,0,0.6)', borderRadius:20, padding:'3px 10px', fontSize:11, color: userLocation?'#1D9E75':'rgba(255,255,255,0.6)', display:'flex', alignItems:'center', gap:4 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background: userLocation?'#1D9E75':'rgba(255,255,255,0.4)' }}/>
          {userLocation ? `${city} — Live` : locationError || 'Getting location...'}
        </div>
      </div>

      {/* Location info bar */}
      <div style={{ background:'var(--surface)', padding:'8px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
        </svg>
        <span style={{ fontSize:12, color:'var(--text-secondary)' }}>
          {userLocation
            ? `Your location: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
            : `Showing: ${city} city center`
          }
        </span>
        {userLocation && (
          <span style={{ marginLeft:'auto', fontSize:11, color:'var(--teal)', fontWeight:500 }}>● Live GPS</span>
        )}
      </div>

      <div style={{ padding:'0 16px' }}>
        {activeFilter === 'Surge zones' && <>
          <SectionLabel>Live surge zones near {city}</SectionLabel>
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
          <div style={{ fontSize:12, color:'var(--text-muted)', textAlign:'center', marginBottom:10 }}>
            Surge data crowdsourced from Co-Pilot drivers · updates every 3 min
          </div>
        </>}

        {activeFilter === 'Hot zones' && hasDelivery && <>
          <SectionLabel>Delivery hot zones in {city}</SectionLabel>
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
          <SectionLabel>Events driving demand tonight</SectionLabel>
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
