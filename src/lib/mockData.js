export const mockDriver = {
  name: 'Marcus',
  city: 'Chicago',
  rating: 4.91,
  streak: 5,
  onlineSince: '7:27 AM',
  hoursToday: '2h 14m',
}

export const mockGoal = {
  weekly: 1000,
  earned: 680,
  daysLeft: 3,
  dailyNeeded: 106,
}

export const mockStats = {
  earningsPerHour: 24.80,
  earningsPerHourDelta: 3.20,
  acceptanceRate: 91,
  deadMilesPct: 12,
  deadMilesDelta: -4,
  ridesToday: 7,
  ridesAvg: 11,
}

export const mockSignals = [
  { id: 1, icon: 'zap', color: 'amber', title: 'Surge zone: Downtown', sub: '2.1x · ends ~10:45am · 1.2mi away', badge: 'Live', badgeColor: 'amber' },
  { id: 2, icon: 'alert-triangle', color: 'coral', title: 'Avoid Westside Blvd', sub: 'Heavy congestion · adds 18 min avg', badge: 'Avoid', badgeColor: 'coral' },
  { id: 3, icon: 'calendar', color: 'teal', title: 'Concert ends at 11pm', sub: 'Chase Arena · est. +$40–60 opportunity', badge: 'Tonight', badgeColor: 'teal' },
  { id: 4, icon: 'receipt', color: 'green', title: 'Mileage logged: 48.2 mi', sub: '~$26.50 tax deduction today', badge: null },
]

export const mockHours = [
  { label: '6a', level: 'low' }, { label: '7', level: 'med' }, { label: '8', level: 'high' },
  { label: '9', level: 'peak' }, { label: '10', level: 'high' }, { label: '11', level: 'med' },
  { label: '12p', level: 'low' }, { label: '1', level: 'low' }, { label: '4', level: 'med' },
  { label: '5', level: 'peak' }, { label: '6', level: 'high' }, { label: '11p', level: 'med' },
]

export const mockSurgeZones = [
  { name: 'Downtown Core', distance: '1.2mi', ends: '~10:45am', mult: '2.1x', color: '#E24B4A', intensity: 'high' },
  { name: 'Midtown', distance: '0.8mi', ends: 'Building now', mult: '1.6x', color: '#EF9F27', intensity: 'med' },
  { name: 'Airport pickup zone', distance: '3.1mi', ends: 'Steady demand', mult: '1.3x', color: '#1D9E75', intensity: 'low' },
]

export const mockEvents = [
  { icon: 'music', color: 'purple', title: 'Concert — Chase Arena', sub: 'Ends 11pm · est. 4,200 leaving', badge: 'Tonight' },
  { icon: 'trophy', color: 'amber', title: 'Game — Civic Stadium', sub: 'Thu 9pm · surge expected +45 min', badge: 'Thu' },
]

export const mockEarnings = {
  month: { total: 1847, label: 'This month', breakdown: { base: 1210, surge: 387, tips: 250 }, rides: 84, surgeRides: 18, tipRate: 61 },
  week: { total: 680, label: 'This week', breakdown: { base: 490, surge: 130, tips: 60 }, rides: 28, surgeRides: 5, tipRate: 58 },
  today: { total: 148, label: 'Today', breakdown: { base: 102, surge: 30, tips: 16 }, rides: 7, surgeRides: 2, tipRate: 57 },
}

export const mockInsights = [
  { label: 'Best day', value: 'Friday', note: 'avg $312', up: true },
  { label: 'Best hour', value: '5–7pm', note: 'avg $31/hr', up: true },
  { label: 'Longest streak', value: '8 days', note: 'current: 5', up: false },
  { label: 'Avg rides/day', value: '13.4', note: '+2.1 vs last mo', up: true },
]

export const mockWeekBars = [
  { label: 'Mon', val: 88 }, { label: 'Tue', val: 124 }, { label: 'Wed', val: 96 },
  { label: 'Thu', val: 142 }, { label: 'Fri', val: 168 }, { label: 'Sat', val: 192 }, { label: 'Sun', val: 62 },
]

export const mockTax = {
  quarter: 'Q2 2026',
  estimate: 1240,
  due: 'June 15',
  netIncome: 8420,
  saved: 680,
  deductions: [
    { icon: 'car', color: 'teal', label: 'Mileage', sub: '3,842 mi · $0.67/mi', amount: 2574 },
    { icon: 'fuel', color: 'amber', label: 'Fuel', sub: 'Logged 18 fill-ups', amount: 486 },
    { icon: 'wrench', color: 'purple', label: 'Maintenance', sub: 'Oil change, tires', amount: 310 },
    { icon: 'smartphone', color: 'coral', label: 'Phone plan (80%)', sub: 'Business use portion', amount: 96 },
  ],
  mileLog: [
    { date: 'Today', miles: 48.2, deduct: 32.29 },
    { date: 'Mon', miles: 61.7, deduct: 41.34 },
    { date: 'Sun', miles: 38.4, deduct: 25.73 },
    { date: 'Sat', miles: 74.1, deduct: 49.65 },
    { date: 'Fri', miles: 81.3, deduct: 54.47 },
  ],
}
