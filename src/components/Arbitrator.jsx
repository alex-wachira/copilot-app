// ============================================================
// The Arbitrator — compare up to 3 simultaneous offers
// side-by-side, ranked by TRUE net profit per hour using
// the driver's vehicle profile. (Auto-intercept version
// ships with the native Android build via Accessibility APIs.)
// ============================================================

import { useState } from 'react'
import { PLATFORMS } from '../lib/platforms'
import { computeNetProfit, loadVehicle } from '../lib/vehicleService'
import { Card } from './UI'

const PLATFORM_IDS = ['uber','lyft','doordash','ubereats','grubhub']
const emptyOffer = () => ({ platform:'uber', payout:'', miles:'' })

export default function Arbitrator({ driver, onSetupVehicle }) {
  const [offers, setOffers] = useState([emptyOffer(), emptyOffer()])
  const [results, setResults] = useState(null)
  const vehicle = loadVehicle()

  const update = (i, field, val) => {
    setOffers(prev => prev.map((o,idx) => idx===i ? { ...o, [field]: val } : o))
    setResults(null)
  }

  const addThird = () => setOffers(prev => [...prev, emptyOffer()])
  const removeOffer = (i) => setOffers(prev => prev.filter((_,idx) => idx !== i))

  const compare = () => {
    const valid = offers.filter(o => o.payout && o.miles)
    if (valid.length < 2) return
    const evaluated = valid.map((o,i) => {
      const net = computeNetProfit({ payout: Number(o.payout), miles: Number(o.miles) }, vehicle)
      return { ...o, index: i, net }
    }).sort((a,b) => b.net.netPerHour - a.net.netPerHour)
    setResults(evaluated)
  }

  const canCompare = offers.filter(o => o.payout && o.miles).length >= 2

  return (
    <div>
      {!vehicle && (
        <div onClick={onSetupVehicle} style={{ background:'var(--amber-light)', border:'1px solid var(--amber)', borderRadius:12, padding:'11px 14px', marginBottom:10, fontSize:12, color:'var(--amber-dark)', cursor:'pointer', lineHeight:1.5 }}>
          ⚠️ <strong>Set up your vehicle first</strong> for accurate net profit (using generic 28 MPG defaults for now). Tap to set up →
        </div>
      )}

      {offers.map((o,i) => (
        <Card key={i} style={{ marginBottom:8, padding:'12px 14px', position:'relative' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
            <span style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)' }}>OFFER {i+1}</span>
            {offers.length > 2 && (
              <button onClick={()=>removeOffer(i)} style={{ marginLeft:'auto', background:'none', border:'none', fontSize:16, color:'var(--text-muted)', cursor:'pointer', padding:0 }}>×</button>
            )}
          </div>
          <div style={{ display:'flex', gap:5, marginBottom:8, overflowX:'auto' }}>
            {PLATFORM_IDS.map(id => (
              <button key={id} onClick={()=>update(i,'platform',id)} style={{ padding:'4px 10px', borderRadius:20, border: o.platform===id?'2px solid #141414':'1px solid var(--border)', background: o.platform===id?'#141414':'var(--surface)', color: o.platform===id?'#fff':'var(--text-secondary)', fontSize:11, fontWeight:600, cursor:'pointer', flexShrink:0 }}>
                {PLATFORMS[id]?.logo}
              </button>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <input type="number" value={o.payout} onChange={e=>update(i,'payout',e.target.value)} placeholder="Payout $" style={inputStyle}/>
            <input type="number" value={o.miles} onChange={e=>update(i,'miles',e.target.value)} placeholder="Miles" style={inputStyle}/>
          </div>
        </Card>
      ))}

      <div style={{ display:'flex', gap:8, marginBottom:10 }}>
        {offers.length < 3 && (
          <button onClick={addThird} style={{ flex:1, padding:'11px', borderRadius:11, border:'1px dashed var(--border)', background:'transparent', color:'var(--text-muted)', fontSize:13, fontWeight:500, cursor:'pointer' }}>
            + Third offer
          </button>
        )}
        <button onClick={compare} disabled={!canCompare} style={{ flex:2, padding:'11px', borderRadius:11, border:'none', background: canCompare?'#141414':'var(--gray-50)', color: canCompare?'#fff':'var(--text-muted)', fontSize:14, fontWeight:700, cursor: canCompare?'pointer':'default' }}>
          ⚖️ Arbitrate
        </button>
      </div>

      {results && (
        <div style={{ marginBottom:14 }}>
          {results.map((r, rank) => {
            const isWinner = rank === 0
            return (
              <div key={rank} style={{
                background: isWinner ? 'var(--teal-light)' : 'var(--surface)',
                border: isWinner ? '2px solid var(--teal)' : '1px solid var(--border)',
                borderRadius:14, padding:'13px 14px', marginBottom:8,
                display:'flex', alignItems:'center', gap:12,
                opacity: isWinner ? 1 : 0.75,
              }}>
                <div style={{ fontSize:22, flexShrink:0 }}>{isWinner ? '🏆' : rank === 1 ? '2️⃣' : '3️⃣'}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:14, fontWeight:700 }}>{PLATFORMS[r.platform]?.name}</span>
                    <span style={{ fontSize:12, color:'var(--text-muted)' }}>${r.payout} · {r.miles}mi</span>
                    {isWinner && <span style={{ fontSize:10, fontWeight:700, color:'#fff', background:'var(--teal)', padding:'1px 8px', borderRadius:20 }}>TAKE THIS</span>}
                  </div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:3 }}>
                    ⛽ −${r.net.gasCost} · 🔧 −${r.net.wearCost} = <strong style={{ color: isWinner?'var(--teal-dark)':'var(--text-secondary)' }}>${r.net.netProfit} net</strong>
                  </div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:18, fontWeight:700, color: isWinner?'var(--teal-dark)':'var(--text-secondary)' }}>${r.net.netPerHour}</div>
                  <div style={{ fontSize:10, color:'var(--text-muted)' }}>net/hr</div>
                </div>
              </div>
            )
          })}
          {results.length >= 2 && (
            <div style={{ fontSize:12, color:'var(--text-secondary)', textAlign:'center', padding:'4px 0' }}>
              Taking the winner earns you <strong style={{ color:'var(--teal)' }}>${(results[0].net.netPerHour - results[results.length-1].net.netPerHour).toFixed(2)}/hr more</strong> than the worst option
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const inputStyle = { width:'100%', padding:'9px 11px', borderRadius:9, border:'1px solid var(--border)', background:'var(--bg)', fontSize:14, color:'var(--text-primary)', outline:'none', fontFamily:'DM Sans,sans-serif' }
