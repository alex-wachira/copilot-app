import { useState, useEffect } from 'react'
import { PLATFORMS } from '../lib/platforms'
import { startShift, getActiveShift, logTripToShift, logExpenseToShift, endShift, computeShiftStats, getShiftHistory } from '../lib/shiftService'
import { Card, SectionLabel } from '../components/UI'

const QUICK_PLATFORMS = ['uber','lyft','doordash','ubereats','grubhub']
const EXPENSE_CATS = [['fuel','⛽ Gas'],['tolls','🛣 Tolls'],['parking','🅿️ Parking'],['other','📦 Other']]

export default function ShiftScreen({ driver }) {
  const [shift, setShift]       = useState(getActiveShift())
  const [, forceTick]           = useState(0)
  const [showTripForm, setTrip] = useState(false)
  const [showExpForm, setExp]   = useState(false)
  const [tripPlatform, setTP]   = useState(driver?.platforms?.[0] || 'uber')
  const [tripPayout, setPayout] = useState('')
  const [tripTip, setTipVal]    = useState('')
  const [tripMiles, setMiles]   = useState('')
  const [expCat, setExpCat]     = useState('fuel')
  const [expAmount, setExpAmt]  = useState('')
  const [endSummary, setEndSummary] = useState(null)

  // Live timer tick every 30s
  useEffect(() => {
    if (!shift) return
    const t = setInterval(() => forceTick(x => x + 1), 30000)
    return () => clearInterval(t)
  }, [shift])

  const stats = computeShiftStats(shift)
  const history = getShiftHistory()

  const handleStart = () => { setEndSummary(null); setShift(startShift()) }
  const handleEnd = () => {
    const ended = endShift()
    setEndSummary(computeShiftStats(ended))
    setShift(null)
  }
  const handleLogTrip = () => {
    if (!tripPayout) return
    setShift({ ...logTripToShift({ platform: tripPlatform, payout: tripPayout, tip: tripTip, miles: tripMiles }) })
    setPayout(''); setTipVal(''); setMiles(''); setTrip(false)
  }
  const handleLogExpense = () => {
    if (!expAmount) return
    setShift({ ...logExpenseToShift({ category: expCat, amount: expAmount }) })
    setExpAmt(''); setExp(false)
  }

  return (
    <div className="screen" style={{ padding:'0 16px' }}>
      <div style={{ padding:'20px 0 4px' }}>
        <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:2 }}>live tracking</div>
        <div style={{ fontSize:24, fontWeight:600, letterSpacing:'-0.3px' }}>Shift Tracker</div>
      </div>

      {/* ── No active shift ── */}
      {!shift && !endSummary && (
        <div style={{ background:'#141414', borderRadius:20, padding:'28px 20px', margin:'12px 0 10px', textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:8 }}>🏁</div>
          <div style={{ fontSize:18, fontWeight:600, color:'#fff', marginBottom:6 }}>Ready to drive?</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.45)', marginBottom:18, lineHeight:1.5 }}>
            Track earnings, tips, miles and your TRUE hourly rate — live as you drive.
          </div>
          <button onClick={handleStart} style={{ width:'100%', padding:'15px', borderRadius:14, border:'none', background:'var(--amber)', color:'#141414', fontSize:16, fontWeight:700, cursor:'pointer' }}>
            ▶ Start shift
          </button>
        </div>
      )}

      {/* ── Shift ended summary ── */}
      {endSummary && (
        <div style={{ background:'var(--teal-light)', border:'2px solid var(--teal)', borderRadius:16, padding:'18px', margin:'12px 0 10px' }}>
          <div style={{ fontSize:16, fontWeight:700, color:'var(--teal-dark)', marginBottom:12 }}>✓ Shift complete!</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {[
              ['Gross earned', `$${endSummary.grossEarnings}`],
              ['Duration', endSummary.elapsedLabel],
              ['Trips', endSummary.tripCount],
              ['True $/hr', `$${endSummary.trueHourlyRate}`],
            ].map(([l,v]) => (
              <div key={l} style={{ background:'rgba(255,255,255,0.6)', borderRadius:10, padding:'10px', textAlign:'center' }}>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>{l}</div>
                <div style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)' }}>{v}</div>
              </div>
            ))}
          </div>
          <button onClick={handleStart} style={{ width:'100%', marginTop:12, padding:'12px', borderRadius:11, border:'none', background:'#141414', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>
            Start another shift
          </button>
        </div>
      )}

      {/* ── Active shift dashboard ── */}
      {shift && stats && (
        <>
          {/* Live earnings hero */}
          <div style={{ background:'#141414', borderRadius:20, padding:'20px', margin:'12px 0 10px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:14, right:16, display:'flex', alignItems:'center', gap:5 }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:'#1D9E75', animation:'pulse 2s infinite' }}/>
              <span style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>LIVE · {stats.elapsedLabel}</span>
            </div>
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginBottom:2 }}>Earned this shift</div>
            <div style={{ fontSize:44, fontWeight:700, color:'#fff', letterSpacing:'-1.5px', lineHeight:1 }}>${stats.grossEarnings.toFixed(2)}</div>
            <div style={{ display:'flex', gap:14, marginTop:14 }}>
              <div><div style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>Gross $/hr</div><div style={{ fontSize:17, fontWeight:600, color:'var(--amber)' }}>${stats.grossPerHour.toFixed(2)}</div></div>
              <div><div style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>TRUE $/hr*</div><div style={{ fontSize:17, fontWeight:600, color: stats.trueHourlyRate >= 15 ? '#1D9E75' : '#D85A30' }}>${stats.trueHourlyRate.toFixed(2)}</div></div>
              <div><div style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>Trips</div><div style={{ fontSize:17, fontWeight:600, color:'#fff' }}>{stats.tripCount}</div></div>
              <div><div style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>Miles</div><div style={{ fontSize:17, fontWeight:600, color:'#fff' }}>{stats.totalMiles}</div></div>
            </div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:10 }}>
              *After expenses + est. vehicle cost (${stats.vehicleCostEstimate} @ $0.67/mi IRS rate)
            </div>
          </div>

          {/* Quick actions */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
            <button onClick={() => { setTrip(p=>!p); setExp(false) }} style={{ padding:'13px', borderRadius:12, border:'none', background:'var(--teal)', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>
              + Log trip
            </button>
            <button onClick={() => { setExp(p=>!p); setTrip(false) }} style={{ padding:'13px', borderRadius:12, border:'1px solid var(--border)', background:'var(--surface)', color:'var(--text-primary)', fontSize:14, fontWeight:600, cursor:'pointer' }}>
              + Log expense
            </button>
          </div>

          {/* Trip form */}
          {showTripForm && (
            <Card style={{ marginBottom:10 }}>
              <div style={{ display:'flex', gap:5, marginBottom:10, overflowX:'auto' }}>
                {(driver?.platforms || QUICK_PLATFORMS).map(id => (
                  <button key={id} onClick={()=>setTP(id)} style={{ padding:'5px 11px', borderRadius:20, border: tripPlatform===id?'2px solid #141414':'1px solid var(--border)', background: tripPlatform===id?'#141414':'var(--surface)', color: tripPlatform===id?'#fff':'var(--text-secondary)', fontSize:12, fontWeight:500, cursor:'pointer', flexShrink:0 }}>
                    {PLATFORMS[id]?.name}
                  </button>
                ))}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:10 }}>
                <div><div style={lblStyle}>Payout $</div><input type="number" value={tripPayout} onChange={e=>setPayout(e.target.value)} placeholder="12.50" style={inputStyle}/></div>
                <div><div style={lblStyle}>Tip $</div><input type="number" value={tripTip} onChange={e=>setTipVal(e.target.value)} placeholder="3.00" style={inputStyle}/></div>
                <div><div style={lblStyle}>Miles</div><input type="number" value={tripMiles} onChange={e=>setMiles(e.target.value)} placeholder="4.2" style={inputStyle}/></div>
              </div>
              <button onClick={handleLogTrip} disabled={!tripPayout} style={{ width:'100%', padding:'11px', borderRadius:10, border:'none', background: tripPayout?'var(--teal)':'var(--gray-50)', color: tripPayout?'#fff':'var(--text-muted)', fontSize:14, fontWeight:600, cursor: tripPayout?'pointer':'default' }}>
                Save trip
              </button>
            </Card>
          )}

          {/* Expense form */}
          {showExpForm && (
            <Card style={{ marginBottom:10 }}>
              <div style={{ display:'flex', gap:5, marginBottom:10, flexWrap:'wrap' }}>
                {EXPENSE_CATS.map(([id,label]) => (
                  <button key={id} onClick={()=>setExpCat(id)} style={{ padding:'5px 11px', borderRadius:20, border: expCat===id?'2px solid #141414':'1px solid var(--border)', background: expCat===id?'#141414':'var(--surface)', color: expCat===id?'#fff':'var(--text-secondary)', fontSize:12, fontWeight:500, cursor:'pointer' }}>
                    {label}
                  </button>
                ))}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <input type="number" value={expAmount} onChange={e=>setExpAmt(e.target.value)} placeholder="Amount $" style={{ ...inputStyle, flex:1 }}/>
                <button onClick={handleLogExpense} disabled={!expAmount} style={{ padding:'10px 18px', borderRadius:10, border:'none', background: expAmount?'#141414':'var(--gray-50)', color: expAmount?'#fff':'var(--text-muted)', fontSize:14, fontWeight:600, cursor: expAmount?'pointer':'default' }}>
                  Save
                </button>
              </div>
            </Card>
          )}

          {/* Trips this shift */}
          {shift.trips.length > 0 && (
            <>
              <SectionLabel>Trips this shift</SectionLabel>
              <Card style={{ padding:0, overflow:'hidden', marginBottom:10 }}>
                {[...shift.trips].reverse().map((t,i,arr) => (
                  <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderBottom: i<arr.length-1?'1px solid var(--border)':'none' }}>
                    <span style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:20, background:'var(--gray-50)', color:'var(--text-muted)', flexShrink:0 }}>{PLATFORMS[t.platform]?.logo}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:500 }}>${(t.payout + t.tip).toFixed(2)} {t.tip > 0 && <span style={{ color:'var(--teal)', fontSize:11 }}>(+${t.tip.toFixed(2)} tip)</span>}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)' }}>{t.miles}mi · {new Date(t.loggedAt).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}</div>
                    </div>
                    <div style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)' }}>{t.miles > 0 ? `$${((t.payout+t.tip)/t.miles).toFixed(2)}/mi` : ''}</div>
                  </div>
                ))}
              </Card>
            </>
          )}

          {/* End shift */}
          <button onClick={handleEnd} style={{ width:'100%', padding:'14px', borderRadius:12, border:'2px solid var(--coral)', background:'transparent', color:'var(--coral)', fontSize:15, fontWeight:600, cursor:'pointer', marginBottom:16 }}>
            ■ End shift
          </button>
        </>
      )}

      {/* Shift history */}
      {!shift && history.length > 0 && (
        <>
          <SectionLabel>Recent shifts</SectionLabel>
          <Card style={{ padding:0, overflow:'hidden', marginBottom:16 }}>
            {history.slice(0,5).map((s,i,arr) => {
              const st = computeShiftStats(s)
              return (
                <div key={s.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', borderBottom: i<arr.length-1?'1px solid var(--border)':'none' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:500 }}>{new Date(s.startTime).toLocaleDateString([],{weekday:'short', month:'short', day:'numeric'})}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>{st.elapsedLabel} · {st.tripCount} trips · {st.totalMiles}mi</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:15, fontWeight:600 }}>${st.grossEarnings.toFixed(2)}</div>
                    <div style={{ fontSize:11, color: st.trueHourlyRate >= 15 ? 'var(--teal)':'var(--coral)' }}>${st.trueHourlyRate}/hr true</div>
                  </div>
                </div>
              )
            })}
          </Card>
        </>
      )}
    </div>
  )
}

const lblStyle = { fontSize:11, color:'var(--text-muted)', marginBottom:4 }
const inputStyle = { width:'100%', padding:'9px 11px', borderRadius:9, border:'1px solid var(--border)', background:'var(--bg)', fontSize:14, color:'var(--text-primary)', outline:'none', fontFamily:'DM Sans,sans-serif' }
