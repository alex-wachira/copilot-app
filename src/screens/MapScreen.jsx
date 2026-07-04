// ============================================================
// Map Screen — real interactive Leaflet map
// Surge zones as geo-accurate colored circles, delivery hot
// zones as markers, live GPS user dot. Tap zones for details.
// ============================================================

import { useState, useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { PLATFORMS } from '../lib/platforms'
import { Card, SectionLabel, Badge, IconBox } from '../components/UI'
import { mockEvents } from '../lib/mockData'

const CITY_COORDS = {
  'Chicago':      { lat: 41.8781, lng: -87.6298 },
  'New York':     { lat: 40.7128, lng: -74.0060 },
  'Los Angeles':  { lat: 34.0522, lng: -118.2437 },
  'Houston':      { lat: 29.7604, lng: -95.3698 },
  'Phoenix':      { lat: 33.4484, lng: -112.0740 },
}

// Geo-accurate zones per city (offsets applied to city center for non-Chicago)
const SURGE_ZONES = [
  { name:'Downtown Core',   dLat: 0.0056,  dLng: 0.0009,  radius: 1400, mult: 2.1, color:'#E24B4A', ends:'~10:45am' },
  { name:'River North',     dLat: 0.0143,  dLng: -0.0043, radius: 1000, mult: 1.6, color:'#EF9F27', ends:'Building now' },
  { name:'Airport zone',    dLat: -0.0913, dLng: -0.1224, radius: 1800, mult: 1.3, color:'#1D9E75', ends:'Steady demand' },
]

const HOT_ZONES = [
  { name:'Wicker Park',  dLat: 0.0307,  dLng: -0.0498, wait: 4, earning:'$24/hr', platforms:['doordash'], peak:true },
  { name:'Lincoln Park', dLat: 0.0433,  dLng: -0.0215, wait: 7, earning:'$18/hr', platforms:['doordash','ubereats'] },
  { name:'The Loop',     dLat: 0.0019,  dLng: -0.0021, wait: 9, earning:'$19/hr', platforms:['ubereats','grubhub'] },
  { name:'West Loop',    dLat: 0.0037,  dLng: -0.0187, wait: 6, earning:'$21/hr', platforms:['doordash','ubereats','grubhub'] },
]

const filters = ['Surge zones', 'Hot zones', 'Events']

export default function MapScreen({ driver }) {
  const [activeFilter, setActiveFilter] = useState('Surge zones')
  const [userLocation, setUserLocation] = useState(null)
  const [selectedZone, setSelectedZone] = useState(null)
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const layersRef = useRef([])
  const driverPlatforms = driver?.platforms || ['uber']
  const hasDelivery = driverPlatforms.some(id => PLATFORMS[id]?.type === 'delivery')
  const city = driver?.city || 'Chicago'
  const center = CITY_COORDS[city] || CITY_COORDS['Chicago']

  // Init map once
  useEffect(() => {
    if (mapInstance.current || !mapRef.current) return
    const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false })
      .setView([center.lat, center.lng], 12)
    // Dark-friendly CARTO tiles (free, no key)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    mapInstance.current = map

    // Live GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(loc)
        const youIcon = L.divIcon({
          className: '',
          html: `<div style="width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 0 6px rgba(59,130,246,0.25)"></div>`,
          iconSize: [16,16], iconAnchor: [8,8],
        })
        L.marker([loc.lat, loc.lng], { icon: youIcon }).addTo(map).bindPopup('You are here')
      }, () => {}, { timeout: 8000 })
    }
    return () => { map.remove(); mapInstance.current = null }
  }, [])

  // Draw layers when filter changes
  useEffect(() => {
    const map = mapInstance.current
    if (!map) return
    // Clear old layers
    layersRef.current.forEach(l => map.removeLayer(l))
    layersRef.current = []
    setSelectedZone(null)

    if (activeFilter === 'Surge zones') {
      SURGE_ZONES.forEach(z => {
        const lat = center.lat + z.dLat, lng = center.lng + z.dLng
        const circle = L.circle([lat, lng], {
          radius: z.radius, color: z.color, weight: 2,
          fillColor: z.color, fillOpacity: 0.22,
        }).addTo(map)
        const label = L.marker([lat, lng], {
          icon: L.divIcon({ className:'', html:`<div style="background:${z.color};color:#fff;font-weight:700;font-size:12px;padding:3px 9px;border-radius:14px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-family:sans-serif">${z.mult}x</div>`, iconSize:[44,22], iconAnchor:[22,11] })
        }).addTo(map)
        circle.on('click', () => setSelectedZone({ ...z, type:'surge' }))
        label.on('click', () => setSelectedZone({ ...z, type:'surge' }))
        layersRef.current.push(circle, label)
      })
      map.setView([center.lat, center.lng], 12)
    }

    if (activeFilter === 'Hot zones' && hasDelivery) {
      HOT_ZONES.forEach(z => {
        const lat = center.lat + z.dLat, lng = center.lng + z.dLng
        const pin = L.marker([lat, lng], {
          icon: L.divIcon({ className:'', html:`<div style="background:${z.peak?'#FF3008':'#1D9E75'};color:#fff;font-weight:600;font-size:11px;padding:4px 10px;border-radius:14px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-family:sans-serif">🍔 ${z.name} · ${z.earning}</div>`, iconSize:[120,24], iconAnchor:[60,12] })
        }).addTo(map)
        pin.on('click', () => setSelectedZone({ ...z, type:'hot' }))
        layersRef.current.push(pin)
      })
      map.setView([center.lat + 0.02, center.lng - 0.02], 12)
    }
  }, [activeFilter, hasDelivery])

  return (
    <div className="screen">
      {/* Interactive map */}
      <div style={{ position:'relative', height:300 }}>
        <div ref={mapRef} style={{ height:'100%', width:'100%', zIndex:1 }}/>
        {/* Filter chips */}
        <div style={{ position:'absolute', top:10, left:10, right:10, display:'flex', gap:7, zIndex:500 }}>
          {filters.filter(f => f !== 'Hot zones' || hasDelivery).map(f => (
            <button key={f} onClick={() => setActiveFilter(f)} style={{ fontSize:12, fontWeight:600, padding:'6px 13px', borderRadius:20, border:'none', cursor:'pointer', background: activeFilter===f?'#141414':'rgba(255,255,255,0.92)', color: activeFilter===f?'#EF9F27':'#444', boxShadow:'0 2px 8px rgba(0,0,0,0.15)', transition:'all 0.15s' }}>
              {f}
            </button>
          ))}
        </div>
        {/* GPS status */}
        <div style={{ position:'absolute', bottom:10, left:10, zIndex:500, background:'rgba(20,20,20,0.85)', borderRadius:20, padding:'4px 11px', fontSize:11, color: userLocation?'#4CC39A':'rgba(255,255,255,0.6)', display:'flex', alignItems:'center', gap:5 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background: userLocation?'#1D9E75':'rgba(255,255,255,0.35)' }}/>
          {userLocation ? 'Live GPS' : city}
        </div>
      </div>

      {/* Selected zone detail */}
      {selectedZone && (
        <div style={{ margin:'10px 16px 0', background: selectedZone.type==='surge'?'var(--amber-light)':'var(--teal-light)', border:`1.5px solid ${selectedZone.type==='surge'?'var(--amber)':'var(--teal)'}`, borderRadius:14, padding:'12px 14px', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:600 }}>{selectedZone.name}</div>
            <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:2 }}>
              {selectedZone.type==='surge'
                ? `${selectedZone.mult}x surge · ${selectedZone.ends}`
                : `${selectedZone.earning} avg · ${selectedZone.wait}min avg wait · ${selectedZone.platforms.map(p=>PLATFORMS[p]?.name).join(', ')}`
              }
            </div>
          </div>
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${center.lat + (selectedZone.dLat||0)},${center.lng + (selectedZone.dLng||0)}`} target="_blank" rel="noreferrer" style={{ background:'#141414', color:'#fff', fontSize:12, fontWeight:600, padding:'8px 14px', borderRadius:10, textDecoration:'none', flexShrink:0 }}>
            Navigate →
          </a>
        </div>
      )}

      <div style={{ padding:'0 16px' }}>
        {activeFilter === 'Surge zones' && <>
          <SectionLabel>Live surge zones · {city}</SectionLabel>
          <Card style={{ padding:0, overflow:'hidden', marginBottom:10 }}>
            {SURGE_ZONES.map((z,i) => (
              <div key={z.name} onClick={()=>setSelectedZone({...z, type:'surge'})} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', borderBottom: i<SURGE_ZONES.length-1?'1px solid var(--border)':'none', cursor:'pointer' }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:z.color, flexShrink:0 }}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:500 }}>{z.name}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>{z.ends}</div>
                </div>
                <div style={{ fontSize:15, fontWeight:600, color:z.color }}>{z.mult}x</div>
              </div>
            ))}
          </Card>
          <div style={{ fontSize:11, color:'var(--text-muted)', textAlign:'center', marginBottom:12 }}>
            Tap a zone on the map or list for details + navigation
          </div>
        </>}

        {activeFilter === 'Hot zones' && hasDelivery && <>
          <SectionLabel>Delivery hot zones · {city}</SectionLabel>
          <Card style={{ padding:0, overflow:'hidden', marginBottom:10 }}>
            {HOT_ZONES.map((z,i) => (
              <div key={z.name} onClick={()=>setSelectedZone({...z, type:'hot'})} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', borderBottom: i<HOT_ZONES.length-1?'1px solid var(--border)':'none', cursor:'pointer' }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                    <span style={{ fontSize:13, fontWeight:500 }}>{z.name}</span>
                    {z.peak && <span style={{ fontSize:10, color:'#fff', background:'#FF3008', padding:'1px 7px', borderRadius:20, fontWeight:600 }}>Peak Pay</span>}
                  </div>
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                    {z.platforms.filter(id=>driverPlatforms.includes(id)).map(id => (
                      <span key={id} style={{ fontSize:10, padding:'1px 6px', borderRadius:20, background:'var(--gray-50)', color:'var(--text-muted)', fontWeight:500 }}>{PLATFORMS[id]?.name}</span>
                    ))}
                    <span style={{ fontSize:11, color:'var(--text-muted)' }}>· {z.wait}min avg wait</span>
                  </div>
                </div>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--teal)' }}>{z.earning}</div>
              </div>
            ))}
          </Card>
        </>}

        {activeFilter === 'Events' && <>
          <SectionLabel>Events driving demand</SectionLabel>
          <Card style={{ padding:0, overflow:'hidden', marginBottom:12 }}>
            {mockEvents.map((ev,i) => (
              <div key={ev.title} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', borderBottom: i<mockEvents.length-1?'1px solid var(--border)':'none' }}>
                <IconBox color={ev.color}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {ev.icon==='music'&&<><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></>}
                    {ev.icon==='trophy'&&<><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></>}
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
