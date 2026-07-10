import { useState } from 'react'
import { VEHICLE_PRESETS, saveVehicle, loadVehicle, getMaintenanceStatus, markMaintenanceDone, getTotalTrackedMiles, exportTaxCSV, computeNetProfit } from '../lib/vehicleService'
import { Card, SectionLabel } from '../components/UI'

export default function VehicleScreen({ onBack }) {
  const [vehicle, setVehicle]   = useState(loadVehicle())
  const [editing, setEditing]   = useState(!loadVehicle())
  const [presetId, setPresetId] = useState(vehicle?.presetId || 'camry')
  const [mpg, setMpg]           = useState(vehicle?.mpg || 32)
  const [gasPrice, setGasPrice] = useState(vehicle?.gasPrice || 3.40)
  const [maint, setMaint]       = useState(getMaintenanceStatus())
  const totalMiles              = getTotalTrackedMiles()

  const selectPreset = (id) => {
    setPresetId(id)
    const p = VEHICLE_PRESETS.find(v => v.id === id)
    if (p && id !== 'custom') setMpg(p.mpg)
  }

  const handleSave = () => {
    const preset = VEHICLE_PRESETS.find(v => v.id === presetId)
    const v = { presetId, label: preset?.label, mpg: Number(mpg), gasPrice: Number(gasPrice), wearRate: preset?.wearRate || 0.10 }
    saveVehicle(v)
    setVehicle(v)
    setEditing(false)
  }

  const handleMaintDone = (id) => {
    markMaintenanceDone(id, totalMiles)
    setMaint(getMaintenanceStatus())
  }

  // Example net profit preview for a typical $10 / 5mi offer
  const preview = vehicle ? computeNetProfit({ payout: 10, miles: 5 }, vehicle) : null
  const dueCount = maint.filter(m => m.due).length

  return (
    <div className="screen" style={{ padding:'0 16px' }}>
      <div style={{ padding:'20px 0 4px', display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={onBack} style={{ background:'none', border:'1px solid var(--border)', borderRadius:10, width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text-primary)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div>
          <div style={{ fontSize:13, color:'var(--text-muted)' }}>your one-person fleet</div>
          <div style={{ fontSize:22, fontWeight:600, letterSpacing:'-0.3px' }}>My Vehicle</div>
        </div>
      </div>

      {/* Vehicle profile */}
      {!editing && vehicle ? (
        <Card style={{ margin:'12px 0 10px', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ fontSize:30 }}>🚗</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:600 }}>{vehicle.label}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{vehicle.mpg} MPG · gas ${vehicle.gasPrice}/gal · wear ${vehicle.wearRate}/mi</div>
          </div>
          <button onClick={()=>setEditing(true)} style={{ fontSize:12, color:'var(--teal)', background:'none', border:'1px solid var(--teal-light)', borderRadius:8, padding:'5px 11px', cursor:'pointer', fontWeight:500 }}>Edit</button>
        </Card>
      ) : (
        <Card style={{ margin:'12px 0 10px' }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>Set up your vehicle</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:12, maxHeight:180, overflowY:'auto' }}>
            {VEHICLE_PRESETS.map(p => (
              <button key={p.id} onClick={()=>selectPreset(p.id)} style={{ padding:'8px 10px', borderRadius:10, textAlign:'left', border: presetId===p.id?'2px solid #141414':'1px solid var(--border)', background: presetId===p.id?'var(--amber-light)':'var(--surface)', cursor:'pointer' }}>
                <div style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)' }}>{p.label}</div>
                <div style={{ fontSize:10, color:'var(--text-muted)' }}>{p.mpg >= 100 ? 'Electric' : `${p.mpg} MPG`}</div>
              </button>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
            <div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:4 }}>MPG (adjust if needed)</div>
              <input type="number" value={mpg} onChange={e=>setMpg(e.target.value)} style={inputStyle}/>
            </div>
            <div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:4 }}>Local gas $/gal</div>
              <input type="number" step="0.01" value={gasPrice} onChange={e=>setGasPrice(e.target.value)} style={inputStyle}/>
            </div>
          </div>
          <button onClick={handleSave} style={{ width:'100%', padding:'12px', borderRadius:11, border:'none', background:'#141414', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>
            Save vehicle
          </button>
        </Card>
      )}

      {/* Cost-per-mile insight */}
      {vehicle && preview && (
        <div style={{ background:'#141414', borderRadius:16, padding:'16px', marginBottom:10 }}>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:8 }}>What a typical $10 / 5-mile offer REALLY pays you:</div>
          <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:10 }}>
            <span style={{ fontSize:15, color:'rgba(255,255,255,0.4)', textDecoration:'line-through' }}>$10.00</span>
            <span style={{ fontSize:28, fontWeight:700, color: preview.netProfit >= 7 ? '#4CC39A' : '#E8845F' }}>${preview.netProfit.toFixed(2)}</span>
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>net</span>
          </div>
          <div style={{ display:'flex', gap:14, fontSize:12, color:'rgba(255,255,255,0.55)' }}>
            <span>⛽ −${preview.gasCost.toFixed(2)} gas</span>
            <span>🔧 −${preview.wearCost.toFixed(2)} wear</span>
            <span style={{ marginLeft:'auto', color:'var(--amber)' }}>${preview.netPerHour}/hr net</span>
          </div>
        </div>
      )}

      {/* Maintenance */}
      <SectionLabel>Maintenance · {totalMiles.toLocaleString()} mi tracked {dueCount > 0 && <span style={{ color:'var(--coral)' }}>· {dueCount} due!</span>}</SectionLabel>
      <Card style={{ padding:0, overflow:'hidden', marginBottom:10 }}>
        {maint.map((m,i,arr) => (
          <div key={m.id} style={{ padding:'11px 14px', borderBottom: i<arr.length-1?'1px solid var(--border)':'none' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
              <span style={{ fontSize:16 }}>{m.icon}</span>
              <div style={{ flex:1 }}>
                <span style={{ fontSize:13, fontWeight:500 }}>{m.label}</span>
                {m.due && <span style={{ fontSize:10, fontWeight:700, color:'#fff', background:'var(--coral)', padding:'1px 7px', borderRadius:20, marginLeft:6 }}>DUE NOW</span>}
                {m.soon && <span style={{ fontSize:10, fontWeight:700, color:'var(--amber-dark)', background:'var(--amber-light)', padding:'1px 7px', borderRadius:20, marginLeft:6 }}>SOON</span>}
              </div>
              <button onClick={()=>handleMaintDone(m.id)} style={{ fontSize:11, color:'var(--teal)', background:'none', border:'1px solid var(--teal-light)', borderRadius:7, padding:'3px 9px', cursor:'pointer', fontWeight:500 }}>
                Done ✓
              </button>
            </div>
            <div style={{ height:5, background:'var(--gray-50)', borderRadius:99, overflow:'hidden', marginBottom:3 }}>
              <div style={{ height:'100%', width:`${m.pct}%`, background: m.due?'var(--coral)':m.soon?'var(--amber)':'var(--teal)', borderRadius:99, transition:'width 0.4s' }}/>
            </div>
            <div style={{ fontSize:11, color:'var(--text-muted)' }}>
              {m.due ? `Overdue by ${Math.abs(m.remaining).toLocaleString()} mi` : `${m.remaining.toLocaleString()} mi until due`} · every {m.intervalMiles.toLocaleString()} mi
            </div>
          </div>
        ))}
      </Card>

      {/* Tax vault */}
      <SectionLabel>Tax vault</SectionLabel>
      <Card style={{ marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:500, marginBottom:2 }}>IRS-ready year export</div>
        <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:10, lineHeight:1.5 }}>
          Every trip, mile, tip, and expense — formatted as a spreadsheet your accountant (or TurboTax) can use directly. Includes the $0.67/mi standard deduction column.
        </div>
        <button onClick={exportTaxCSV} style={{ width:'100%', padding:'12px', borderRadius:11, border:'none', background:'var(--teal)', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>
          📊 Download {new Date().getFullYear()} tax spreadsheet (CSV)
        </button>
      </Card>
    </div>
  )
}

const inputStyle = { width:'100%', padding:'10px 12px', borderRadius:9, border:'1px solid var(--border)', background:'var(--bg)', fontSize:14, color:'var(--text-primary)', outline:'none', fontFamily:'DM Sans,sans-serif' }
