// ============================================================
// City Service — search ANY city (US-first, works globally)
// Uses OpenStreetMap Nominatim geocoding — free, no API key.
// Stores city name + coordinates so maps center anywhere.
// ============================================================

const CITY_KEY = 'copilot_city'

// ── Search cities by name (autocomplete) ─────────────────────
export async function searchCities(query, countryCode = 'us') {
  if (!query || query.length < 2) return []
  try {
    const url = `https://nominatim.openstreetmap.org/search?` + new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1',
      limit: '6',
      countrycodes: countryCode,       // 'us' first; pass '' for global
      featureType: 'city',
    })
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
    const data = await res.json()
    return data
      .filter(r => ['city','town','village','hamlet','suburb','municipality'].includes(r.addresstype) || r.class === 'place' || r.type === 'administrative')
      .map(r => ({
        name: r.address?.city || r.address?.town || r.address?.village || r.address?.hamlet || r.name,
        state: r.address?.state || '',
        stateCode: stateAbbrev(r.address?.state),
        country: r.address?.country_code?.toUpperCase() || 'US',
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
        label: buildLabel(r),
      }))
  } catch {
    return []
  }
}

function buildLabel(r) {
  const city = r.address?.city || r.address?.town || r.address?.village || r.address?.hamlet || r.name
  const state = stateAbbrev(r.address?.state) || r.address?.state || ''
  return state ? `${city}, ${state}` : city
}

// ── Save / load the driver's chosen city ─────────────────────
export function saveCity(city) {
  localStorage.setItem(CITY_KEY, JSON.stringify(city))
}

export function loadCity() {
  try {
    const raw = localStorage.getItem(CITY_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

// ── US state abbreviations ───────────────────────────────────
const STATES = {
  'Alabama':'AL','Alaska':'AK','Arizona':'AZ','Arkansas':'AR','California':'CA','Colorado':'CO',
  'Connecticut':'CT','Delaware':'DE','Florida':'FL','Georgia':'GA','Hawaii':'HI','Idaho':'ID',
  'Illinois':'IL','Indiana':'IN','Iowa':'IA','Kansas':'KS','Kentucky':'KY','Louisiana':'LA',
  'Maine':'ME','Maryland':'MD','Massachusetts':'MA','Michigan':'MI','Minnesota':'MN','Mississippi':'MS',
  'Missouri':'MO','Montana':'MT','Nebraska':'NE','Nevada':'NV','New Hampshire':'NH','New Jersey':'NJ',
  'New Mexico':'NM','New York':'NY','North Carolina':'NC','North Dakota':'ND','Ohio':'OH','Oklahoma':'OK',
  'Oregon':'OR','Pennsylvania':'PA','Rhode Island':'RI','South Carolina':'SC','South Dakota':'SD',
  'Tennessee':'TN','Texas':'TX','Utah':'UT','Vermont':'VT','Virginia':'VA','Washington':'WA',
  'West Virginia':'WV','Wisconsin':'WI','Wyoming':'WY','District of Columbia':'DC',
}
function stateAbbrev(state) { return STATES[state] || '' }
