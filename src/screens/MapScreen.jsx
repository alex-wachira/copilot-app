// ============================================================
// Map Screen — real places for the driver's chosen city
// • Surge zones: live driver-reported surges (real multipliers)
//   + demand zones from real places (airport, downtown, bars,
//   campuses, hospitals) rated by time of day
// • Hot zones: real restaurant clusters for delivery drivers
// • Events: real big venues in the city + "see what's on" links
// Data: OpenStreetMap (free) via placesService. No fake numbers.
// ============================================================

import { useState, useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { PLATFORMS } from '../lib/platforms'
import { Card, SectionLabel } from '../components/UI'
import { loadCity } from '../lib/cityService'
import { resolveCityCenter, loadCityPlaces, buildDemandZones, buildHotZones, DEMAND_STYLE } from '../lib/placesService'

const filters = ['Surge zones', 'Hot zones', 'Events']

const VENUE_LABEL = {
  stadium: 'Stadium', theatre: 'Theatre', events_venue: 'Event venue',
  arts_centre: 'Arts centre', conference_centre: 'Convention centre', concert_hall: 'Concert hall',
}

export default function MapScreen({ driver, surge }) {
  const [activeFilter, setActiveFilter] = useState('Surge zones')
  const [userLocation, setUserLocation] = useState(null)
  const [selectedZone, setSelectedZone] = useState(null)
  const [center, setCenter]             = useState(null)
  const [places, setPlaces]             = useState(null)
  const [loadError, setLoadError]       = useState('')
  const mapRef      = useRef(null)
  const mapInstance = useRef(null)
  const layersRef   = useRef([])
  const driverPlatforms = driver?.platforms || ['uber']
  const hasDelivery = driverPlatforms.some(id => PLATFORMS[id]?.type === 'delivery')
  const city = center?.label || driver?.city || '…'

  // 1. Work out where the city is, then fetch its real places
  useEffect(() => {
    let alive = true
    ;(async () => {
      const c = await resolveCityCenter(loadCity(), driver?.city)
      if (!alive) return
      setCenter(c)
      try {
        const p = await loadCityPlaces(c)
        if (alive) setPlaces(p)
      } catch (e) {
        if (alive) setLoadError(e.message || 'Could not load map data')
      }
    })()
    return () => { alive = false }
  }, [driver?.city])

  // 2. Create the map once we know the centre
  useEffect(() => {
    if (!center || mapInstance.current || !mapRef.current) return
    const map = L.map(mapRef.current, { zoomControl: false })
      .setView([center.lat, center.lng], 12)
    map.attributionControl.setPrefix(false)
    // OpenStreetMap street map — free, no key (credit line required by their rules)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    mapInstance.current = map

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
  }, [center])

  const reported   = surge?.liveZones || []
  const demandZones = places ? buildDemandZones(places) : []
  const hotZones    = places ? buildHotZones(places) : []
  const venues      = places?.venues || []

  // 3. Draw the layer for the chosen tab
  useEffect(() => {
    const map = mapInstance.current
    if (!map || !places) return
    layersRef.current.forEach(l => map.removeLayer(l))
    layersRef.current = []
    setSelectedZone(null)

    const pill = (lat, lng, html, w, onClick) => {
      const m = L.marker([lat, lng], { icon: L.divIcon({ className:'', html, iconSize:[w,22], iconAnchor:[w/2,11] }) }).addTo(map)
      if (onClick) m.on('click', onClick)
      layersRef.current.push(m)
    }
    const pts = []

    if (activeFilter === 'Surge zones') {
      demandZones.forEach(z => {
        const color = DEMAND_STYLE[z.level].color
        const circle = L.circle([z.lat, z.lng], { radius: z.radius, color, weight: 2, fillColor: color, fillOpacity: 0.18 }).addTo(map)
        circle.on('click', () => setSelectedZone({ ...z, kind:'demand' }))
        layersRef.current.push(circle)
        pts.push([z.lat, z.lng])
      })
      reported.forEach(r => {
        pill(r.lat, r.lng, `<div style="background:#E24B4A;color:#fff;font-weight:700;font-size:12px;padding:3px 9px;border-radius:14px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-family:sans-serif">${r.multiplier}x</div>`, 44,
          () => setSelectedZone({ name: r.neighborhood || 'Driver report', lat: r.lat, lng: r.lng, kind:'reported', r }))
        pts.push([r.lat, r.lng])
      })
    }

    if (activeFilter === 'Hot zones' && hasDelivery) {
      hotZones.forEach(z => {
        const color = DEMAND_STYLE[z.level].color
        pill(z.lat, z.lng, `<div style="background:${color};color:#fff;font-weight:600;font-size:11px;padding:4px 10px;border-radius:14px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-family:sans-serif">🍔 ${z.name}</div>`, 120,
          () => setSelectedZone({ ...z, kind:'food' }))
        pts.push([z.lat, z.lng])
      })
    }

    if (activeFilter === 'Events') {
      venues.forEach(v => {
        pill(v.lat, v.lng, `<div style="background:#141414;color:#EF9F27;font-weight:600;font-size:11px;padding:4px 10px;border-radius:14px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-family:sans-serif">🎟 ${v.name}</div>`, 120,
          () => setSelectedZone({ ...v, kind:'venue', why: VENUE_LABEL[v.kind] || 'Venue' }))
        pts.push([v.lat, v.lng])
      })
    }

    // Fit the map to what's shown (but don't zoom out to the airport 30 miles away)
    const near = pts.filter(([la, ln]) => Math.abs(la - center.lat) < 0.2 && Math.abs(ln - center.lng) < 0.25)
    if (near.length > 1) map.fitBounds(near, { padding: [30, 30], maxZoom: 14 })
    else map.setView([center.lat, center.lng], 12)
  }, [activeFilter, hasDelivery, places, reported.length])

  const detailLine = (z) => {
    if (z.kind === 'reported') return `${z.r.multiplier}x reported by ${z.r.reportCount} driver${z.r.reportCount>1?'s':''} · ${z.r.minutesAgo} min ago`
    if (z.kind === 'venue') return `${z.why} · check tonight's schedule`
    return `${DEMAND_STYLE[z.level].label} now · ${z.why}`
  }

  return (
    <div className="screen">
      <div style={{ position:'relative', height:300 }}>
        <div ref={mapRef} style={{ height:'100%', width:'100%', zIndex:1, background:'var(--gray-50)' }}/>
        <div style={{ position:'absolute', top:10, left:10, right:10, display:'flex', gap:7, zIndex:500 }}>
          {filters.filter(f => f !== 'Hot zones' || hasDelivery).map(f => (
            <button key={f} onClick={() => setActiveFilter(f)} style={{ fontSize:12, fontWeight:600, padding:'6px 13px', borderRadius:20, border:'none', cursor:'pointer', background: activeFilter===f?'#141414':'rgba(255,255,255,0.92)', color: activeFilter===f?'#EF9F27':'#444', boxShadow:'0 2px 8px rgba(0,0,0,0.15)', transition:'all 0.15s' }}>
              {f}
            </button>
          ))}
        </div>
        <div style={{ position:'absolute', bottom:10, left:10, zIndex:500, background:'rgba(20,20,20,0.85)', borderRadius:20, padding:'4px 11px', fontSize:11, color: userLocation?'#4CC39A':'rgba(255,255,255,0.6)', display:'flex', alignItems:'center', gap:5 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background: userLocation?'#1D9E75':'rgba(255,255,255,0.35)' }}/>
          {userLocation ? 'Live GPS' : city}
        </div>
        {!places && !loadError && (
          <div style={{ position:'absolute', inset:0, zIndex:400, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:'var(--text-muted)', pointerEvents:'none' }}>
            Finding demand spots in {city}…
          </div>
        )}
      </div>

      {selectedZone && (
        <div style={{ margin:'10px 16px 0', background:'var(--amber-light)', border:'1.5px solid var(--amber)', borderRadius:14, padding:'12px 14px', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:600 }}>{selectedZone.name}</div>
            <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:2 }}>{detailLine(selectedZone)}</div>
          </div>
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${selectedZone.lat},${selectedZone.lng}`} target="_blank" rel="noreferrer" style={{ background:'#141414', color:'#fff', fontSize:12, fontWeight:600, padding:'8px 14px', borderRadius:10, textDecoration:'none', flexShrink:0 }}>
            Navigate →
          </a>
        </div>
      )}

      <div style={{ padding:'0 16px' }}>
        {loadError && (
          <Card style={{ margin:'12px 0', fontSize:13, color:'var(--coral)' }}>{loadError}</Card>
        )}

        {activeFilter === 'Surge zones' && places && <>
          {reported.length > 0 && <>
            <SectionLabel>Surge reported by drivers · last 20 min</SectionLabel>
            <Card style={{ padding:0, overflow:'hidden', marginBottom:10 }}>
              {reported.map((r,i) => (
                <Row key={i} last={i===reported.length-1} dot="#E24B4A" title={r.neighborhood || 'Driver report'}
                  sub={`${r.reportCount} report${r.reportCount>1?'s':''} · ${r.minutesAgo} min ago`}
                  right={<span style={{ fontSize:15, fontWeight:600, color:'#E24B4A' }}>{r.multiplier}x</span>}
                  onClick={()=>setSelectedZone({ name:r.neighborhood||'Driver report', lat:r.lat, lng:r.lng, kind:'reported', r })}/>
              ))}
            </Card>
          </>}
          <SectionLabel>Expected demand right now · {city}</SectionLabel>
          <Card style={{ padding:0, overflow:'hidden', marginBottom:10 }}>
            {demandZones.map((z,i) => (
              <Row key={z.name+i} last={i===demandZones.length-1} dot={DEMAND_STYLE[z.level].color} title={z.name} sub={z.why}
                right={<LevelTag level={z.level}/>} onClick={()=>setSelectedZone({ ...z, kind:'demand' })}/>
            ))}
          </Card>
          <Note>Demand is estimated from the time of day and what's in each area. Real surge multipliers appear when drivers report them.</Note>
        </>}

        {activeFilter === 'Hot zones' && hasDelivery && places && <>
          <SectionLabel>Restaurant clusters · {city}</SectionLabel>
          <Card style={{ padding:0, overflow:'hidden', marginBottom:10 }}>
            {hotZones.length === 0 && <div style={{ padding:'12px 14px', fontSize:13, color:'var(--text-muted)' }}>No big restaurant clusters found nearby.</div>}
            {hotZones.map((z,i) => (
              <Row key={i} last={i===hotZones.length-1} dot={DEMAND_STYLE[z.level].color} title={z.name} sub={z.why}
                right={<LevelTag level={z.level}/>} onClick={()=>setSelectedZone({ ...z, kind:'food' })}/>
            ))}
          </Card>
          <Note>Busiest for delivery: lunch 11am–2pm and dinner 5–9pm.</Note>
        </>}

        {activeFilter === 'Events' && places && <>
          <SectionLabel>Big venues · {city}</SectionLabel>
          <Card style={{ padding:0, overflow:'hidden', marginBottom:10 }}>
            {venues.length === 0 && <div style={{ padding:'12px 14px', fontSize:13, color:'var(--text-muted)' }}>No large venues found nearby.</div>}
            {venues.map((v,i) => (
              <Row key={v.name} last={i===venues.length-1} dot="#141414" title={v.name} sub={VENUE_LABEL[v.kind] || 'Venue'}
                right={<a href={`https://www.google.com/search?q=${encodeURIComponent(v.name + ' ' + city.split(',')[0] + ' events today')}`} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{ fontSize:12, fontWeight:600, color:'var(--teal)', textDecoration:'none' }}>What's on →</a>}
                onClick={()=>setSelectedZone({ ...v, kind:'venue', why: VENUE_LABEL[v.kind] || 'Venue' })}/>
            ))}
          </Card>
          <Note>When a show or game lets out, ride demand spikes nearby for 30–60 minutes.</Note>
        </>}
      </div>
    </div>
  )
}

function Row({ title, sub, dot, right, onClick, last }) {
  return (
    <div onClick={onClick} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', borderBottom: last?'none':'1px solid var(--border)', cursor:'pointer' }}>
      <div style={{ width:10, height:10, borderRadius:'50%', background:dot, flexShrink:0 }}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{title}</div>
        <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>{sub}</div>
      </div>
      {right}
    </div>
  )
}

function LevelTag({ level }) {
  const s = DEMAND_STYLE[level]
  return <span style={{ fontSize:11, fontWeight:600, color:s.color, whiteSpace:'nowrap' }}>{s.label}</span>
}

function Note({ children }) {
  return <div style={{ fontSize:11, color:'var(--text-muted)', textAlign:'center', margin:'0 8px 14px', lineHeight:1.5 }}>{children}</div>
}
