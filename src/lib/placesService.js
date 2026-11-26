// ============================================================
// Places Service — real demand spots for ANY city
// Uses OpenStreetMap (Overpass API) — free, no API key.
// Finds the airport, universities, big venues, hospitals,
// nightlife clusters and restaurant clusters around the city,
// then rates expected demand by time of day.
// Nothing here is a live Uber/Lyft surge number — those come
// only from driver reports (surge_reports table).
// ============================================================

import { searchCities } from './cityService'

const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter']
const CACHE_DAYS = 7
const RADIUS = 14000 // metres around the city centre

// ── City centre: saved city → look up the profile city → Chicago ──
export async function resolveCityCenter(savedCity, profileCity) {
  if (savedCity?.lat && savedCity?.lng) return { lat: savedCity.lat, lng: savedCity.lng, label: savedCity.label }
  if (profileCity) {
    const cacheKey = `copilot_geo:${profileCity}`
    try {
      const hit = JSON.parse(localStorage.getItem(cacheKey) || 'null')
      if (hit) return hit
    } catch {}
    const results = await searchCities(profileCity.split(',')[0])
    const match = results.find(r => r.label === profileCity) || results[0]
    if (match) {
      const c = { lat: match.lat, lng: match.lng, label: match.label }
      try { localStorage.setItem(cacheKey, JSON.stringify(c)) } catch {}
      return c
    }
  }
  return { lat: 41.8781, lng: -87.6298, label: 'Chicago, IL' }
}

// ── Fetch + group real places (cached per city for 7 days) ──────
export async function loadCityPlaces(center) {
  const cacheKey = `copilot_places:${center.lat.toFixed(3)},${center.lng.toFixed(3)}`
  try {
    const hit = JSON.parse(localStorage.getItem(cacheKey) || 'null')
    if (hit && Date.now() - hit.at < CACHE_DAYS * 864e5) return hit.places
  } catch {}

  const a = `(around:${RADIUS},${center.lat},${center.lng})`
  const query = `[out:json][timeout:25];
nwr["aeroway"="aerodrome"]["iata"](around:45000,${center.lat},${center.lng});out center 3;
nwr["amenity"="university"]["name"]${a};out center 12;
(nwr["leisure"="stadium"]["name"]${a};nwr["amenity"~"^(theatre|events_venue|arts_centre|conference_centre|concert_hall)$"]["name"]${a};);out center 40;
nwr["amenity"="hospital"]["name"]${a};out center 12;
node["amenity"~"^(bar|pub|nightclub)$"]${a};out 800;
node["amenity"~"^(restaurant|fast_food)$"]${a};out 2000;
node["place"~"^(neighbourhood|suburb|quarter)$"]["name"]${a};out 400;`

  // Main server first, public mirror if it's busy
  let json = null
  for (const url of OVERPASS) {
    try {
      const res = await fetch(url, { method: 'POST', body: new URLSearchParams({ data: query }) })
      if (res.ok) { json = await res.json(); break }
    } catch {}
  }
  if (!json) throw new Error('Map data service is busy — try again in a minute')
  const places = groupPlaces(json.elements || [], center)
  try { localStorage.setItem(cacheKey, JSON.stringify({ at: Date.now(), places })) } catch {}
  return places
}

function pos(el) {
  return el.lat != null ? { lat: el.lat, lng: el.lon } : { lat: el.center?.lat, lng: el.center?.lon }
}

function groupPlaces(elements, center) {
  const airports = [], universities = [], venues = [], hospitals = [], hoods = [], nightlife = [], food = []
  for (const el of elements) {
    const t = el.tags || {}
    const p = { ...pos(el), name: t.name }
    if (p.lat == null) continue
    if (t.aeroway === 'aerodrome') airports.push(p)
    else if (t.amenity === 'university') {
      // Skip campus offices/buildings tagged as "university" (e.g. "Fleet Services")
      if (/universit|college|campus|institute|academy|school/i.test(t.name || '')) universities.push(p)
    }
    else if (t.leisure === 'stadium' || /^(theatre|events_venue|arts_centre|conference_centre|concert_hall)$/.test(t.amenity || '')) venues.push({ ...p, kind: t.leisure === 'stadium' ? 'stadium' : t.amenity })
    else if (t.amenity === 'hospital') hospitals.push(p)
    else if (t.place) hoods.push(p)
    else if (/^(bar|pub|nightclub)$/.test(t.amenity || '')) nightlife.push(p)
    else if (/^(restaurant|fast_food)$/.test(t.amenity || '')) food.push(p)
  }

  const nearestHood = (pt) => {
    let best = null, bestD = Infinity
    for (const h of hoods) {
      const d = (h.lat - pt.lat) ** 2 + (h.lng - pt.lng) ** 2
      if (d < bestD) { bestD = d; best = h }
    }
    return best && bestD < 0.0004 ? best.name : null // within ~2km
  }

  return {
    center,
    airports: dedupe(airports).slice(0, 2),
    universities: dedupe(universities).slice(0, 4),
    venues: dedupe(venues).slice(0, 12),
    hospitals: dedupe(hospitals).slice(0, 3),
    nightlife: cluster(nightlife, 3).slice(0, 4).map(c => ({ ...c, name: nearestHood(c) || 'Bar district' })),
    food: cluster(food, 6).slice(0, 6).map(c => ({ ...c, name: nearestHood(c) || 'Restaurant cluster' })),
  }
}

function dedupe(list) {
  const seen = new Set()
  return list.filter(p => p.name && !seen.has(p.name) && seen.add(p.name))
}

// Group points into ~1km grid cells; busiest cells first
function cluster(points, minCount) {
  const cells = {}
  for (const p of points) {
    const k = `${Math.round(p.lat * 100)},${Math.round(p.lng * 80)}`
    ;(cells[k] ||= []).push(p)
  }
  return Object.values(cells)
    .filter(c => c.length >= minCount)
    .sort((a, b) => b.length - a.length)
    .map(c => ({
      lat: c.reduce((s, p) => s + p.lat, 0) / c.length,
      lng: c.reduce((s, p) => s + p.lng, 0) / c.length,
      count: c.length,
    }))
}

// ── Expected demand right now, by type of place ────────────────
// Rule of thumb from rideshare patterns — NOT a live surge reading.
export function demandNow(type, date = new Date()) {
  const h = date.getHours(), d = date.getDay() // 0 Sun … 6 Sat
  const weekday = d >= 1 && d <= 5
  const weekendNight = (d === 5 || d === 6) && (h >= 21 || h < 3) || (d === 6 || d === 0) && h < 3
  switch (type) {
    case 'downtown':   return weekday && ((h >= 7 && h < 10) || (h >= 16 && h < 19)) ? 'high' : (h >= 10 && h < 22 ? 'medium' : 'low')
    case 'airport':    return (h >= 5 && h < 9) || (h >= 15 && h < 21) ? 'high' : (h >= 9 && h < 15 ? 'medium' : 'low')
    case 'nightlife':  return weekendNight ? 'high' : (h >= 20 || h < 2 ? 'medium' : 'low')
    case 'university': return (d === 5 || d === 6) && h >= 20 ? 'high' : (h >= 8 && h < 23 ? 'medium' : 'low')
    case 'hospital':   return (h >= 6 && h < 8) || (h >= 18 && h < 20) ? 'medium' : 'low'
    case 'food':       return (h >= 11 && h < 14) || (h >= 17 && h < 21) ? 'high' : (h >= 9 && h < 23 ? 'medium' : 'low')
    default:           return 'medium'
  }
}

export const DEMAND_STYLE = {
  high:   { label: 'High demand',   color: '#E24B4A' },
  medium: { label: 'Medium demand', color: '#EF9F27' },
  low:    { label: 'Quiet now',     color: '#1D9E75' },
}

// Ride-demand zones for the "Surge zones" tab
export function buildDemandZones(places) {
  const zones = [
    { name: `${(places.center.label || 'City').split(',')[0]} downtown`, type: 'downtown', lat: places.center.lat, lng: places.center.lng, radius: 1400, why: 'Commuters & business trips' },
    ...places.airports.map(a => ({ name: a.name, type: 'airport', lat: a.lat, lng: a.lng, radius: 1800, why: 'Flight arrivals & departures' })),
    ...places.nightlife.map(n => ({ name: n.name, type: 'nightlife', lat: n.lat, lng: n.lng, radius: 700, why: `${n.count} bars & clubs nearby` })),
    ...places.universities.map(u => ({ name: u.name, type: 'university', lat: u.lat, lng: u.lng, radius: 900, why: 'Students — busiest Fri/Sat nights' })),
    ...places.hospitals.map(h => ({ name: h.name, type: 'hospital', lat: h.lat, lng: h.lng, radius: 500, why: 'Shift changes 6–8am & 6–8pm' })),
  ]
  const rank = { high: 0, medium: 1, low: 2 }
  return zones
    .map(z => ({ ...z, level: demandNow(z.type) }))
    .sort((a, b) => rank[a.level] - rank[b.level])
}

// Delivery hot zones for the "Hot zones" tab
export function buildHotZones(places) {
  return places.food.map(f => ({ ...f, type: 'food', level: demandNow('food'), why: `${f.count} restaurants within ~1km` }))
}
