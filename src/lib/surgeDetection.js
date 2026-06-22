// ============================================================
// Surge Detection Service
// Passively infers surge from accepted fares, no driver input needed.
// Falls back to crowdsource prompt when confidence is low.
// ============================================================

import { supabase } from './supabase'

// Base fare rates per mile by city ($/mile)
// These get refined over time as we collect more fare data
const BASE_RATES = {
  Chicago: 1.42,
  NYC: 1.75,
  LA: 1.38,
  default: 1.45,
}

// Minimum fare uplift % to classify as a surge
const SURGE_THRESHOLD = 0.28  // 28% above base = ~1.3x surge

// Multiplier bands
const MULT_BANDS = [
  { min: 0,    max: 0.28, mult: 1.0,  label: 'No surge' },
  { min: 0.28, max: 0.65, mult: 1.4,  label: '~1.4x' },
  { min: 0.65, max: 1.1,  mult: 1.8,  label: '~1.8x' },
  { min: 1.1,  max: 1.6,  mult: 2.1,  label: '~2.1x' },
  { min: 1.6,  max: 999,  mult: 2.5,  label: '2.5x+' },
]

// ── Passive detection ─────────────────────────────────────────
// Called when a driver accepts a ride. Compares accepted fare
// vs expected base fare for the route distance.
export function detectSurgeFromFare({ acceptedFare, estimatedMiles, city = 'default' }) {
  const baseRate = BASE_RATES[city] || BASE_RATES.default
  const expectedFare = estimatedMiles * baseRate + 1.85  // base fare + booking fee
  const uplift = (acceptedFare - expectedFare) / expectedFare

  const band = MULT_BANDS.find(b => uplift >= b.min && uplift < b.max)
    || MULT_BANDS[0]

  const isSurge = uplift >= SURGE_THRESHOLD
  const confidence = isSurge
    ? Math.min(0.95, 0.6 + (uplift - SURGE_THRESHOLD) * 0.8)
    : 0.9  // high confidence when no surge detected

  return {
    isSurge,
    multiplier: band.mult,
    label: band.label,
    upliftPct: Math.round(uplift * 100),
    confidence,
    needsConfirmation: isSurge && confidence < 0.75,
  }
}

// ── Log surge to Supabase ─────────────────────────────────────
export async function logSurgeReport({
  driverId,
  lat,
  lng,
  city,
  neighborhood,
  multiplier,
  source,         // 'passive' | 'tap' | 'voice'
  confidence,
}) {
  const { error } = await supabase.from('surge_reports').insert({
    driver_id: driverId,
    lat,
    lng,
    city,
    neighborhood,
    multiplier,
    source,
    confidence,
    reported_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString(), // 20min TTL
  })
  if (error) console.error('Surge log error:', error)
}

// ── Fetch live surge zones for a city ────────────────────────
// Aggregates recent reports into heatmap zones
export async function fetchLiveSurgeZones(city) {
  const since = new Date(Date.now() - 20 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('surge_reports')
    .select('lat, lng, multiplier, neighborhood, confidence, reported_at')
    .eq('city', city)
    .gte('reported_at', since)
    .order('reported_at', { ascending: false })

  if (error || !data) return []

  // Group by neighborhood and compute weighted average multiplier
  const grouped = {}
  for (const r of data) {
    const key = r.neighborhood || `${Math.round(r.lat * 100) / 100},${Math.round(r.lng * 100) / 100}`
    if (!grouped[key]) grouped[key] = { reports: [], neighborhood: r.neighborhood, lat: r.lat, lng: r.lng }
    grouped[key].reports.push(r)
  }

  return Object.values(grouped).map(zone => {
    const weightedMult = zone.reports.reduce((sum, r) => sum + r.multiplier * r.confidence, 0)
      / zone.reports.reduce((sum, r) => sum + r.confidence, 0)
    const freshness = Date.now() - new Date(zone.reports[0].reported_at).getTime()
    return {
      neighborhood: zone.neighborhood,
      lat: zone.lat,
      lng: zone.lng,
      multiplier: Math.round(weightedMult * 10) / 10,
      reportCount: zone.reports.length,
      minutesAgo: Math.round(freshness / 60000),
    }
  }).filter(z => z.multiplier >= 1.3)
    .sort((a, b) => b.multiplier - a.multiplier)
}

// ── Voice parsing ─────────────────────────────────────────────
// Parses voice transcript into surge data
// "two point one downtown" → { multiplier: 2.1, neighborhood: 'downtown' }
export function parseVoiceReport(transcript) {
  const text = transcript.toLowerCase()

  // Extract multiplier — handles "two point one", "2.1", "one point eight"
  const wordNums = { one: 1, two: 2, three: 3, four: 4, five: 5 }
  let multiplier = null

  const decimalMatch = text.match(/(\d+\.?\d*)\s*x/)
  if (decimalMatch) {
    multiplier = parseFloat(decimalMatch[1])
  } else {
    const wordMatch = text.match(/(one|two|three|four|five)\s+point\s+(one|two|three|four|five|six|seven|eight|nine)/)
    if (wordMatch) {
      multiplier = wordNums[wordMatch[1]] + wordNums[wordMatch[2]] * 0.1
    }
  }

  // Extract neighborhood (anything after the multiplier)
  const afterMult = text.replace(/[\d.]+x?|(\w+)\s+point\s+\w+/g, '').trim()
  const neighborhood = afterMult.replace(/\b(surge|in|at|near|around|the)\b/g, '').trim() || null

  return {
    multiplier: multiplier ? Math.round(multiplier * 10) / 10 : null,
    neighborhood,
    valid: multiplier !== null,
  }
}

// ── Supabase schema for surge_reports table ──────────────────
// Run this in your Supabase SQL editor:
//
// create table public.surge_reports (
//   id uuid primary key default gen_random_uuid(),
//   driver_id uuid references public.drivers on delete cascade,
//   lat numeric(10,7) not null,
//   lng numeric(10,7) not null,
//   city text not null,
//   neighborhood text,
//   multiplier numeric(4,2) not null,
//   source text not null,  -- 'passive' | 'tap' | 'voice'
//   confidence numeric(4,3) default 0.8,
//   reported_at timestamptz default now(),
//   expires_at timestamptz not null
// );
// alter table public.surge_reports enable row level security;
// create policy "Anyone can read surge reports"
//   on public.surge_reports for select using (true);
// create policy "Drivers insert own reports"
//   on public.surge_reports for insert with check (auth.uid() = driver_id);
// create index on public.surge_reports (city, reported_at desc);
