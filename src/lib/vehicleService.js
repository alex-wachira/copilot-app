// ============================================================
// Vehicle Service
// Vehicle-specific net profit: gas + wear costs per mile.
// Maintenance interval tracking + IRS tax vault export.
// ============================================================

import { getShiftHistory } from './shiftService'

const VEHICLE_KEY = 'copilot_vehicle'
const MAINT_KEY = 'copilot_maintenance'

// Popular gig vehicles with real-world MPG + wear class
export const VEHICLE_PRESETS = [
  { id:'prius',    label:'Toyota Prius',      mpg:52, wearRate:0.08 },
  { id:'corolla',  label:'Toyota Corolla',    mpg:35, wearRate:0.08 },
  { id:'camry',    label:'Toyota Camry',      mpg:32, wearRate:0.09 },
  { id:'civic',    label:'Honda Civic',       mpg:36, wearRate:0.08 },
  { id:'accord',   label:'Honda Accord',      mpg:33, wearRate:0.09 },
  { id:'crv',      label:'Honda CR-V',        mpg:30, wearRate:0.10 },
  { id:'model3',   label:'Tesla Model 3 (EV)',mpg:120,wearRate:0.07 }, // MPGe → ~4¢/mi energy
  { id:'altima',   label:'Nissan Altima',     mpg:32, wearRate:0.09 },
  { id:'fusion',   label:'Ford Fusion',       mpg:27, wearRate:0.10 },
  { id:'f150',     label:'Ford F-150',        mpg:20, wearRate:0.13 },
  { id:'xt6',      label:'Cadillac XT6',      mpg:18, wearRate:0.16 },
  { id:'suburban', label:'Chevy Suburban',    mpg:16, wearRate:0.17 },
  { id:'custom',   label:'Custom / Other',    mpg:28, wearRate:0.10 },
]

export function saveVehicle(vehicle) {
  localStorage.setItem(VEHICLE_KEY, JSON.stringify(vehicle))
}

export function loadVehicle() {
  try {
    const raw = localStorage.getItem(VEHICLE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

// ── True net profit for an offer, based on THIS vehicle ──────
export function computeNetProfit({ payout, miles, estimatedMinutes }, vehicle) {
  const v = vehicle || loadVehicle() || { mpg: 28, gasPrice: 3.40, wearRate: 0.10 }
  const gasCost  = v.mpg >= 100
    ? miles * 0.04                              // EV: ~4¢/mile energy
    : (miles / v.mpg) * (v.gasPrice || 3.40)
  const wearCost = miles * (v.wearRate || 0.10) // maintenance + depreciation
  const netProfit = payout - gasCost - wearCost
  const hours = (estimatedMinutes || (miles / 15) * 60 + 5) / 60
  return {
    gasCost: r2(gasCost),
    wearCost: r2(wearCost),
    totalCost: r2(gasCost + wearCost),
    netProfit: r2(netProfit),
    netPerHour: r2(netProfit / hours),
    netPerMile: miles > 0 ? r2(netProfit / miles) : 0,
    grossPerHour: r2(payout / hours),
  }
}

function r2(n) { return Math.round(n * 100) / 100 }

// ── Maintenance tracking ──────────────────────────────────────
export const MAINTENANCE_ITEMS = [
  { id:'oil',     label:'Oil change',       icon:'🛢', intervalMiles: 5000 },
  { id:'tires',   label:'Tire rotation',    icon:'🔄', intervalMiles: 7500 },
  { id:'air',     label:'Air filter',       icon:'💨', intervalMiles: 15000 },
  { id:'brakes',  label:'Brake inspection', icon:'🛑', intervalMiles: 20000 },
  { id:'coolant', label:'Coolant flush',    icon:'🧊', intervalMiles: 30000 },
]

export function loadMaintenance() {
  try {
    return JSON.parse(localStorage.getItem(MAINT_KEY) || '{}')
  } catch { return {} }
}

export function markMaintenanceDone(itemId, atMiles) {
  const m = loadMaintenance()
  m[itemId] = { doneAtMiles: atMiles, doneAt: new Date().toISOString() }
  localStorage.setItem(MAINT_KEY, JSON.stringify(m))
  return m
}

// Total tracked miles across all shifts
export function getTotalTrackedMiles() {
  const history = getShiftHistory()
  return r2(history.reduce((sum, s) =>
    sum + s.trips.reduce((ts, t) => ts + (t.miles || 0), 0), 0))
}

export function getMaintenanceStatus() {
  const totalMiles = getTotalTrackedMiles()
  const done = loadMaintenance()
  return MAINTENANCE_ITEMS.map(item => {
    const lastDone = done[item.id]?.doneAtMiles ?? 0
    const milesSince = totalMiles - lastDone
    const remaining = item.intervalMiles - milesSince
    return {
      ...item,
      milesSince: r2(milesSince),
      remaining: r2(remaining),
      pct: Math.min(100, Math.round((milesSince / item.intervalMiles) * 100)),
      due: remaining <= 0,
      soon: remaining > 0 && remaining <= item.intervalMiles * 0.15,
    }
  })
}

// ── Tax vault: IRS-ready CSV export ──────────────────────────
export function exportTaxCSV() {
  const history = getShiftHistory()
  const rows = [['Date','Type','Platform','Description','Miles','Amount ($)','Mileage Deduction ($0.67/mi)']]
  history.forEach(s => {
    const date = new Date(s.startTime).toLocaleDateString('en-US')
    s.trips.forEach(t => {
      rows.push([date,'Income',t.platform,'Trip earnings',t.miles,(t.payout+t.tip).toFixed(2),(t.miles*0.67).toFixed(2)])
    })
    s.expenses.forEach(e => {
      rows.push([date,'Expense','-',e.category,'',(-e.amount).toFixed(2),''])
    })
  })
  const totalMiles = getTotalTrackedMiles()
  rows.push([])
  rows.push(['TOTALS','','','',totalMiles,'',(totalMiles*0.67).toFixed(2)])
  const csv = rows.map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type:'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `copilot-tax-vault-${new Date().getFullYear()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
