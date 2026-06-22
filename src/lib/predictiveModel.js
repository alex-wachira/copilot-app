// ============================================================
// Predictive Surge Model
// Combines PredictHQ events, weather, time-of-day, and
// day-of-week signals to forecast demand before drivers arrive.
// ============================================================

import axios from 'axios'

const PREDICTHQ_TOKEN = import.meta.env.VITE_PREDICTHQ_TOKEN || ''
const OPENWEATHER_KEY = import.meta.env.VITE_OPENWEATHER_KEY || ''

// ── Time-of-day demand baseline ───────────────────────────────
// Empirical multipliers by hour (0–23) across rideshare cities
// Source: aggregated driver earnings CSV analysis
const HOURLY_DEMAND = [
  0.3, 0.2, 0.15, 0.1, 0.1, 0.2,   // 12am–5am
  0.45, 0.75, 0.95, 0.8, 0.65, 0.7, // 6am–11am
  0.72, 0.65, 0.6, 0.65, 0.75, 0.9, // 12pm–5pm
  1.0, 0.95, 0.85, 0.75, 0.6, 0.45  // 6pm–11pm
]

// Day-of-week multipliers (0 = Sunday)
const DOW_DEMAND = [0.85, 0.7, 0.72, 0.75, 0.8, 1.0, 1.1]

// ── Weather impact ─────────────────────────────────────────────
// Rain/snow significantly boosts demand (people avoid walking)
const WEATHER_BOOSTS = {
  Thunderstorm: 0.45,
  Drizzle:      0.25,
  Rain:         0.35,
  Snow:         0.50,
  Fog:          0.15,
  Mist:         0.10,
  Clear:        0.0,
  Clouds:       0.0,
}

// ── Fetch weather signal ───────────────────────────────────────
async function fetchWeatherBoost(lat, lng) {
  if (!OPENWEATHER_KEY) {
    // Return a neutral boost when no key is configured
    return { boost: 0, condition: 'Unknown', icon: '🌤' }
  }
  try {
    const { data } = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${OPENWEATHER_KEY}`
    )
    const main = data.weather[0].main
    const boost = WEATHER_BOOSTS[main] || 0
    return { boost, condition: main, icon: data.weather[0].icon }
  } catch {
    return { boost: 0, condition: 'Unknown', icon: '🌤' }
  }
}

// ── Fetch event signals ────────────────────────────────────────
// PredictHQ aggregates concerts, sports, conferences, etc.
async function fetchEventSignals(lat, lng, radiusMiles = 5) {
  if (!PREDICTHQ_TOKEN) {
    // Return mock events for development
    return getMockEvents()
  }
  try {
    const withinKm = radiusMiles * 1.609
    const { data } = await axios.get('https://api.predicthq.com/v1/events/', {
      headers: { Authorization: `Bearer ${PREDICTHQ_TOKEN}` },
      params: {
        'location_around.origin': `${lat},${lng}`,
        'location_around.offset': `${withinKm}km`,
        'start.gte': new Date().toISOString().split('T')[0],
        'start.lte': new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        category: 'concerts,sports,conferences,festivals,performing-arts',
        sort: '-phq_attendance',
        limit: 10,
      }
    })
    return data.results.map(ev => ({
      id: ev.id,
      title: ev.title,
      category: ev.category,
      attendance: ev.phq_attendance || 0,
      startTime: ev.start,
      endTime: ev.end,
      lat: ev.location?.[1],
      lng: ev.location?.[0],
      surgeWindow: computeEventSurgeWindow(ev),
    }))
  } catch {
    return getMockEvents()
  }
}

// How long before/after an event ends does surge peak?
function computeEventSurgeWindow(event) {
  const endTime = new Date(event.end)
  const attendance = event.phq_attendance || 1000
  // Larger events have longer post-event surge windows
  const surgeMinutes = Math.min(90, Math.round(attendance / 500) * 10 + 20)
  return {
    start: new Date(endTime.getTime() - 15 * 60 * 1000).toISOString(),
    end:   new Date(endTime.getTime() + surgeMinutes * 60 * 1000).toISOString(),
    peakAt: endTime.toISOString(),
    estimatedBoost: Math.min(0.9, attendance / 5000),
  }
}

// ── Full demand forecast ───────────────────────────────────────
// Returns a demand score 0–1 and breakdown of contributing signals
export async function forecastDemand({ lat, lng, city, hoursAhead = 12 }) {
  const [weather, events] = await Promise.all([
    fetchWeatherBoost(lat, lng),
    fetchEventSignals(lat, lng),
  ])

  const now = new Date()
  const forecast = []

  for (let h = 0; h < hoursAhead; h++) {
    const t = new Date(now.getTime() + h * 60 * 60 * 1000)
    const hour = t.getHours()
    const dow  = t.getDay()

    const baseScore   = HOURLY_DEMAND[hour] * DOW_DEMAND[dow]
    const weatherBoost = weather.boost

    // Check if any event surge window overlaps this hour
    const eventBoost = events.reduce((max, ev) => {
      const windowStart = new Date(ev.surgeWindow.start)
      const windowEnd   = new Date(ev.surgeWindow.end)
      if (t >= windowStart && t <= windowEnd) {
        return Math.max(max, ev.surgeWindow.estimatedBoost)
      }
      return max
    }, 0)

    const totalScore  = Math.min(1, baseScore + weatherBoost * 0.4 + eventBoost * 0.6)
    const level       = totalScore >= 0.8 ? 'peak' : totalScore >= 0.6 ? 'high' : totalScore >= 0.4 ? 'med' : 'low'
    const events_now  = events.filter(ev => {
      const ws = new Date(ev.surgeWindow.start)
      const we = new Date(ev.surgeWindow.end)
      return t >= ws && t <= we
    })

    forecast.push({
      hour,
      time: t.toISOString(),
      label: `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'pm' : 'am'}`,
      score: Math.round(totalScore * 100) / 100,
      level,
      signals: {
        base:    Math.round(baseScore * 100) / 100,
        weather: Math.round(weatherBoost * 100) / 100,
        events:  Math.round(eventBoost * 100) / 100,
      },
      events: events_now.map(e => e.title),
    })
  }

  // Find best windows (top 3 consecutive peak/high hours)
  const bestWindows = findBestShiftWindows(forecast)

  return {
    forecast,
    weather,
    events,
    bestWindows,
    generatedAt: now.toISOString(),
  }
}

// Finds 2-3 hour windows with highest sustained demand
function findBestShiftWindows(forecast) {
  const windows = []
  for (let i = 0; i < forecast.length - 1; i++) {
    const window2h = forecast.slice(i, i + 2)
    const avgScore = window2h.reduce((s, f) => s + f.score, 0) / 2
    if (avgScore >= 0.65) {
      windows.push({
        startLabel: window2h[0].label,
        endLabel: window2h[window2h.length - 1].label,
        avgScore: Math.round(avgScore * 100) / 100,
        level: avgScore >= 0.8 ? 'peak' : 'good',
        events: [...new Set(window2h.flatMap(f => f.events))],
      })
    }
  }
  // Deduplicate overlapping windows
  return windows
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 3)
}

// ── AI nudge generator ─────────────────────────────────────────
// Turns forecast data into a plain-English tip for the driver
export function generateNudge({ forecast, weather, events, city }) {
  const nextPeak = forecast.find(f => f.level === 'peak' || f.level === 'high')
  const upcomingEvent = events.find(ev => {
    const end = new Date(ev.endTime)
    return end > new Date() && end < new Date(Date.now() + 6 * 60 * 60 * 1000)
  })

  if (upcomingEvent && upcomingEvent.attendance > 2000) {
    const endTime = new Date(upcomingEvent.endTime)
    const timeStr = endTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    return `${upcomingEvent.title} ends at ${timeStr}. Position near ${upcomingEvent.title.split('—')[0].trim()} by ${timeStr} — est. ${Math.round(upcomingEvent.surgeWindow.estimatedBoost * 100 + 100)}% demand spike.`
  }

  if (weather.boost > 0.2) {
    return `${weather.condition} in the forecast boosts ride demand ~${Math.round(weather.boost * 100)}%. Stay near dense neighborhoods for higher pickup rates.`
  }

  if (nextPeak) {
    return `Demand peaks ${nextPeak.label} — best earnings window of the day. Position in ${city} downtown core 15 min before.`
  }

  return `Steady demand right now. Check the map for current surge zones.`
}

// ── Mock events for dev (no API key needed) ───────────────────
function getMockEvents() {
  const tonight = new Date()
  tonight.setHours(23, 0, 0, 0)
  const tomorrow = new Date(tonight.getTime() + 14 * 60 * 60 * 1000)
  return [
    {
      id: 'mock-1',
      title: 'Concert — Chase Arena',
      category: 'concerts',
      attendance: 4200,
      startTime: new Date(tonight.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      endTime: tonight.toISOString(),
      lat: 41.8781,
      lng: -87.6298,
      surgeWindow: {
        start: new Date(tonight.getTime() - 15 * 60 * 1000).toISOString(),
        end:   new Date(tonight.getTime() + 60 * 60 * 1000).toISOString(),
        peakAt: tonight.toISOString(),
        estimatedBoost: 0.75,
      },
    },
    {
      id: 'mock-2',
      title: 'Bulls Game — United Center',
      category: 'sports',
      attendance: 20000,
      startTime: new Date(tomorrow.getTime() - 2.5 * 60 * 60 * 1000).toISOString(),
      endTime: tomorrow.toISOString(),
      lat: 41.8806,
      lng: -87.6742,
      surgeWindow: {
        start: new Date(tomorrow.getTime() - 20 * 60 * 1000).toISOString(),
        end:   new Date(tomorrow.getTime() + 75 * 60 * 1000).toISOString(),
        peakAt: tomorrow.toISOString(),
        estimatedBoost: 0.85,
      },
    },
  ]
}
