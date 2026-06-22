// ============================================================
// Notifications System
// Surge alerts, goal milestones, mission deadlines,
// tip opportunities, and streak reminders.
// ============================================================

export const NOTIFICATION_TYPES = {
  SURGE:     'surge',
  GOAL:      'goal',
  MISSION:   'mission',
  TIP:       'tip',
  STREAK:    'streak',
  EVENT:     'event',
  OPTIMIZER: 'optimizer',
}

export const mockNotifications = [
  {
    id: 'n1',
    type: 'surge',
    platform: 'uber',
    title: '2.4x surge just hit Downtown',
    body: '3 minutes old · 1.1mi from you · historically lasts 18min',
    time: '2 min ago',
    read: false,
    urgent: true,
    actionLabel: 'Navigate',
    color: 'amber',
  },
  {
    id: 'n2',
    type: 'goal',
    platform: null,
    title: "You're 68% to your weekly goal",
    body: '$320 left · $107/day needed · You got this 💪',
    time: '15 min ago',
    read: false,
    urgent: false,
    actionLabel: 'See plan',
    color: 'teal',
  },
  {
    id: 'n3',
    type: 'mission',
    platform: 'grubhub',
    title: 'Grubhub Mission expires in 40 min',
    body: '2 more deliveries needed for $15 bonus · Clock is ticking',
    time: '22 min ago',
    read: false,
    urgent: true,
    actionLabel: 'Open GH',
    color: 'coral',
  },
  {
    id: 'n4',
    type: 'optimizer',
    platform: 'doordash',
    title: 'Switch to DoorDash — +$4.20/hr',
    body: 'Peak Pay active near you. Lunch rush building. 8-12 orders/hr estimated.',
    time: '30 min ago',
    read: true,
    urgent: false,
    actionLabel: 'Details',
    color: 'coral',
  },
  {
    id: 'n5',
    type: 'event',
    platform: null,
    title: 'Concert ends in 45 min',
    body: 'Chase Arena · 4,200 people · Position on Michigan Ave now for surge',
    time: '1 hr ago',
    read: true,
    urgent: false,
    actionLabel: 'Navigate',
    color: 'purple',
  },
  {
    id: 'n6',
    type: 'streak',
    platform: null,
    title: '5-day streak — keep it going!',
    body: 'Drive at least 1 trip today to extend your streak. 3 drivers in Chicago have longer streaks.',
    time: '2 hr ago',
    read: true,
    urgent: false,
    color: 'amber',
  },
]

// Hidden tip estimator for DoorDash
// DoorDash hides tips > $8 — shows "$8+" but actual can be $20+
// We estimate based on: order size, distance, restaurant type, time of day
export function estimateHiddenTip({ orderTotal, distanceMiles, restaurantType, hourOfDay }) {
  let base = orderTotal * 0.12  // avg 12% tip rate

  // Distance premium — longer deliveries get tipped more
  if (distanceMiles > 4) base *= 1.3
  if (distanceMiles > 7) base *= 1.5

  // Restaurant type adjustments
  const typeMultipliers = {
    'fine_dining': 1.6,
    'sushi': 1.4,
    'italian': 1.3,
    'pizza': 1.1,
    'fast_food': 0.85,
    'chinese': 0.9,
    'default': 1.0,
  }
  base *= (typeMultipliers[restaurantType] || typeMultipliers.default)

  // Late night premium (people order drunk, tip more)
  if (hourOfDay >= 22 || hourOfDay <= 2) base *= 1.35

  // Weekend premium
  const dow = new Date().getDay()
  if (dow === 0 || dow === 6) base *= 1.15

  const estimated = Math.round(base * 10) / 10
  const isHidden = estimated > 8
  const confidence = distanceMiles > 2 ? 'High' : 'Med'

  return {
    estimated,
    isHidden,
    confidence,
    label: isHidden ? `~$${estimated} (shown as "$8+")` : `~$${estimated}`,
    worth: estimated > 5 ? 'accept' : estimated > 3 ? 'consider' : 'skip',
    worthLabel: estimated > 5 ? '✓ Worth it' : estimated > 3 ? '~ Consider' : '✗ Low tip',
    worthColor: estimated > 5 ? 'teal' : estimated > 3 ? 'amber' : 'coral',
  }
}

// Shift planner — recommended windows for the week
export const weekShiftPlan = [
  { day: 'Mon', date: 'Jun 2',  windows: [{ start: '7am', end: '9am', level: 'good', earn: '$42' }, { start: '5pm', end: '8pm', level: 'peak', earn: '$89' }], totalEst: '$131' },
  { day: 'Tue', date: 'Jun 3',  windows: [{ start: '8am', end: '10am', level: 'good', earn: '$38' }, { start: '5pm', end: '7pm', level: 'peak', earn: '$72' }, { start: '11pm', end: '1am', level: 'good', earn: '$44', event: 'Concert' }], totalEst: '$154' },
  { day: 'Wed', date: 'Jun 4',  windows: [{ start: '7am', end: '9am', level: 'good', earn: '$40' }, { start: '12pm', end: '2pm', level: 'fair', earn: '$28' }, { start: '5pm', end: '8pm', level: 'peak', earn: '$85' }], totalEst: '$153' },
  { day: 'Thu', date: 'Jun 5',  windows: [{ start: '5pm', end: '7pm', level: 'good', earn: '$65' }, { start: '9pm', end: '11pm', level: 'peak', earn: '$94', event: 'Bulls Game' }], totalEst: '$159' },
  { day: 'Fri', date: 'Jun 6',  windows: [{ start: '5pm', end: '9pm', level: 'peak', earn: '$142' }, { start: '11pm', end: '2am', level: 'peak', earn: '$88' }], totalEst: '$230' },
  { day: 'Sat', date: 'Jun 7',  windows: [{ start: '10am', end: '2pm', level: 'good', earn: '$76' }, { start: '6pm', end: '11pm', level: 'peak', earn: '$168' }], totalEst: '$244' },
  { day: 'Sun', date: 'Jun 8',  windows: [{ start: '11am', end: '3pm', level: 'good', earn: '$62' }], totalEst: '$62' },
]
