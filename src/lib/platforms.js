// ============================================================
// Platform Configuration
// Single source of truth for all supported platforms.
// Every screen reads from here to adapt its UI/copy/metrics.
// ============================================================

export const PLATFORMS = {
  uber: {
    id: 'uber',
    name: 'Uber',
    type: 'rideshare',
    color: '#141414',
    colorLight: '#F1EFE8',
    colorText: '#2C2C2A',
    logo: 'U',
    metrics: ['earnings_per_hour', 'acceptance_rate', 'dead_miles', 'surge_earnings'],
    terminology: { order: 'ride', customer: 'rider', zone: 'surge zone', boost: 'surge' },
  },
  lyft: {
    id: 'lyft',
    name: 'Lyft',
    type: 'rideshare',
    color: '#FF00BF',
    colorLight: '#FBEAF0',
    colorText: '#4B1528',
    logo: 'L',
    metrics: ['earnings_per_hour', 'acceptance_rate', 'primetime_earnings', 'streak_bonus'],
    terminology: { order: 'ride', customer: 'passenger', zone: 'Prime Time zone', boost: 'Prime Time' },
  },
  doordash: {
    id: 'doordash',
    name: 'DoorDash',
    type: 'delivery',
    color: '#FF3008',
    colorLight: '#FCEBEB',
    colorText: '#501313',
    logo: 'DD',
    metrics: ['earnings_per_hour', 'acceptance_rate', 'completion_rate', 'tip_rate'],
    terminology: { order: 'delivery', customer: 'customer', zone: 'hot zone', boost: 'Peak Pay' },
    uniqueMetrics: { hiddenTips: true, completionRate: true, peakPay: true },
  },
  ubereats: {
    id: 'ubereats',
    name: 'Uber Eats',
    type: 'delivery',
    color: '#06C167',
    colorLight: '#EAF3DE',
    colorText: '#173404',
    logo: 'UE',
    metrics: ['earnings_per_hour', 'acceptance_rate', 'wait_time_avg', 'boost_earnings'],
    terminology: { order: 'delivery', customer: 'customer', zone: 'busy area', boost: 'Boost' },
    uniqueMetrics: { restaurantWaitTime: true, boostZones: true },
  },
  grubhub: {
    id: 'grubhub',
    name: 'Grubhub',
    type: 'delivery',
    color: '#F63440',
    colorLight: '#FAECE7',
    colorText: '#4A1B0C',
    logo: 'GH',
    metrics: ['earnings_per_hour', 'acceptance_rate', 'completion_rate', 'tip_rate'],
    terminology: { order: 'delivery', customer: 'customer', zone: 'delivery zone', boost: 'Missions' },
    uniqueMetrics: { missions: true, scheduledBlocks: true },
  },
}

export const PLATFORM_LIST = Object.values(PLATFORMS)
export const DELIVERY_PLATFORMS = PLATFORM_LIST.filter(p => p.type === 'delivery')
export const RIDESHARE_PLATFORMS = PLATFORM_LIST.filter(p => p.type === 'rideshare')

// Per-platform mock earnings data
export const PLATFORM_EARNINGS = {
  uber:      { today: 92, week: 420, month: 1210, rides: 7,  perHour: 24.80, acceptance: 91, deadMiles: 12 },
  lyft:      { today: 56, week: 180, month: 520,  rides: 4,  perHour: 21.40, acceptance: 88, streak: 3 },
  doordash:  { today: 74, week: 310, month: 890,  orders: 11, perHour: 19.20, acceptance: 72, completion: 98, avgTip: 4.20, peakPay: 22 },
  ubereats:  { today: 48, week: 210, month: 610,  orders: 8,  perHour: 17.80, acceptance: 81, avgWait: 8.4, boostEarnings: 14 },
  grubhub:   { today: 38, week: 160, month: 480,  orders: 6,  perHour: 16.40, acceptance: 85, completion: 97, missions: 2 },
}

// Cross-platform optimization signals
export const OPTIMIZATION_SIGNALS = [
  {
    id: 'switch-to-dd',
    priority: 'high',
    platform: 'doordash',
    title: 'Switch to DoorDash now',
    detail: 'Peak Pay active in your zone ($2/order bonus). Lunch rush starting — est. 8-12 orders/hr.',
    earnDelta: '+$4.20/hr vs Uber Eats right now',
    validUntil: '1:30pm',
    color: 'coral',
  },
  {
    id: 'uber-surge',
    priority: 'high',
    platform: 'uber',
    title: 'Uber surge 2.1x downtown',
    detail: 'Concert just ended at Chase Arena. 4,200 people need rides. Dead zone for delivery right now.',
    earnDelta: '+$9.40/hr vs any delivery app',
    validUntil: '11:45pm',
    color: 'amber',
  },
  {
    id: 'avoid-restaurant',
    priority: 'med',
    platform: 'ubereats',
    title: 'Avoid Chipotle on Main',
    detail: 'Avg 22min wait right now. 3 drivers already queued. Not worth it — skip this one.',
    earnDelta: 'Saves ~18 min dead time',
    validUntil: null,
    color: 'teal',
  },
  {
    id: 'grubhub-mission',
    priority: 'med',
    platform: 'grubhub',
    title: 'Grubhub Mission: 5 orders',
    detail: 'Complete 5 more deliveries by 3pm for a $15 bonus. You\'re at 3/5 — 40 min to go.',
    earnDelta: '+$15 bonus within reach',
    validUntil: '3:00pm',
    color: 'green',
  },
]

// Restaurant hot zones for delivery
export const RESTAURANT_ZONES = [
  { name: 'River North', orders: 'High demand', platforms: ['doordash', 'ubereats', 'grubhub'], waitAvg: 6, earning: '$21/hr avg' },
  { name: 'Wicker Park', orders: 'Peak Pay active', platforms: ['doordash'], waitAvg: 4, earning: '$24/hr avg' },
  { name: 'Loop / Downtown', orders: 'Lunch rush', platforms: ['ubereats', 'grubhub'], waitAvg: 9, earning: '$19/hr avg' },
  { name: 'Lincoln Park', orders: 'Steady', platforms: ['doordash', 'ubereats'], waitAvg: 7, earning: '$18/hr avg' },
]
