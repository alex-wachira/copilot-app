// ============================================================
// Offer Evaluator Screen
// Driver manually enters offer details to get an instant
// accept/decline recommendation from the automation engine.
// ============================================================

import { useState } from 'react'
import { evaluateOffer, blacklistRestaurant } from '../lib/automationEngine'
import { PLATFORMS } from '../lib/platforms'
import { Card, SectionLabel } from '../components/UI'

const PLATFORM_IDS = ['uber','lyft','doordash','ubereats','grubhub']

export default function OfferEvaluatorScreen({ driver }) {
  const [platform, setPlatform]     = useState('doordash')
  const [payout, setPayout]         = useState('')
  const [miles, setMiles]           = useState('')
  const [restaurant, setRestaurant] = useState('')
  const [pickup, setPickup]         = useState('')
  const [result, setResult]         = useState(null)
  const [history, setHistory]       = useState([])
  const [blacklisted, setBlacklisted] = useState(false)

  const evaluate = () => {
    if (!payout || !miles) return
    const evaluation = evaluateOffer(
      { platform, offeredPayout: Number(payout), offeredMiles: Number(miles), restaurantName: restaurant, pickupLocation: pickup },
      { minimumPerMile: driver?.minimumPerMile || 1.20, targetHourlyRate: driver?.targetHourlyRate || 18 },
      { blacklistedRestaurants: [], activeSurgeZones: [] }
    )
    setResult(evaluation)
    setHistory(prev => [{ ...evaluation, id: Date.now() }, ...prev.slice(0, 9)])
    setBlacklisted(false)
  }

  const handleBlacklist = async () => {
    if (!restaurant || !driver?.id) return
    await blacklistRestaurant(driver.id, { name: restaurant, reason: 'manual', avgWaitMins: 15 })
    setBlacklisted(true)
  }

  const isAccept = result?.decision === 'accepted'

  return (
    <div className="screen" style={{ padding:'0 16px' }}>
      <div style={{ padding:'20px 0 4px' }}>
        <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:2 }}>AI-powered</div>
        <div style={{ fontSize:24, fontWeight:600, letterSpacing:'-0.3px' }}>Offer Evaluator</div>
        <div style={{ fontSize:13, color:'var(--text-secondary)', marginTop:4 }}>Enter offer details — get instant accept/decline advice</div>
      </div>

      {/* Platform selector */}
      <div style={{ display:'flex', gap:6, overflowX:'auto', padding:'12px 0 4px', scrollbarWidth:'none' }}>
        {PLATFORM_IDS.map(id => {
          const p = PLATFORMS[id]
          return (
            <button key={id} onClick={() => setPlatform(id)} style={{ padding:'7px 14px', borderRadius:20, border: platform===id?'2px solid #141414':'1px solid var(--border)', background: platform===id?'#141414':'var(--surface)', color: platform===id?'#fff':'var(--text-secondary)', fontSize:13, fontWeight:500, cursor:'pointer', flexShrink:0, transition:'all 0.15s' }}>
              {p?.name}
            </button>
          )
        })}
      </div>

      {/* Offer inputs */}
      <Card style={{ margin:'12px 0 10px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
          <div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:5 }}>Payout ($) *</div>
            <input type="number" value={payout} onChange={e=>setPayout(e.target.value)} placeholder="e.g. 8.50" style={inputStyle}/>
          </div>
          <div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:5 }}>Miles *</div>
            <input type="number" value={miles} onChange={e=>setMiles(e.target.value)} placeholder="e.g. 3.2" style={inputStyle}/>
          </div>
        </div>
        <div style={{ marginBottom:10 }}>
          <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:5 }}>Restaurant (optional)</div>
          <input type="text" value={restaurant} onChange={e=>setRestaurant(e.target.value)} placeholder="e.g. Chipotle" style={inputStyle}/>
        </div>
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:5 }}>Pickup area (optional)</div>
          <input type="text" value={pickup} onChange={e=>setPickup(e.target.value)} placeholder="e.g. Downtown, River North" style={inputStyle}/>
        </div>
        <button onClick={evaluate} disabled={!payout||!miles} style={{ width:'100%', padding:'13px', borderRadius:12, border:'none', background: payout&&miles?'#141414':'var(--gray-50)', color: payout&&miles?'#fff':'var(--text-muted)', fontSize:15, fontWeight:600, cursor: payout&&miles?'pointer':'default', transition:'all 0.15s' }}>
          Evaluate offer →
        </button>
      </Card>

      {/* Result */}
      {result && (
        <div style={{ background: isAccept?'var(--teal-light)':'var(--coral-light)', border:`2px solid ${isAccept?'var(--teal)':'var(--coral)'}`, borderRadius:16, padding:'16px', marginBottom:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <div style={{ width:40, height:40, borderRadius:'50%', background: isAccept?'var(--teal)':'var(--coral)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {isAccept
                  ? <polyline points="20 6 9 17 4 12"/>
                  : <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                }
              </svg>
            </div>
            <div>
              <div style={{ fontSize:17, fontWeight:700, color: isAccept?'var(--teal-dark)':'var(--coral-dark)' }}>
                {isAccept ? '✓ Accept this offer' : '✗ Decline this offer'}
              </div>
              <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:1 }}>Confidence score: {result.score}/100</div>
            </div>
          </div>
          <div style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:10, lineHeight:1.5 }}>{result.reasoning}</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
            {[
              { label:'$/mile', value:`$${result.metrics.payoutPerMile}` },
              { label:'Implied $/hr', value:`$${result.metrics.impliedHourlyRate}` },
              { label:'Est. time', value:`${result.metrics.estimatedMinutes}min` },
            ].map(m => (
              <div key={m.label} style={{ background:'rgba(255,255,255,0.5)', borderRadius:9, padding:'8px 10px', textAlign:'center' }}>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>{m.label}</div>
                <div style={{ fontSize:15, fontWeight:600, color:'var(--text-primary)' }}>{m.value}</div>
              </div>
            ))}
          </div>
          {/* Blacklist button */}
          {restaurant && !isAccept && (
            <button onClick={handleBlacklist} disabled={blacklisted} style={{ marginTop:10, width:'100%', padding:'9px', borderRadius:9, border:'1px solid var(--coral)', background:'transparent', color: blacklisted?'var(--text-muted)':'var(--coral)', fontSize:13, fontWeight:500, cursor: blacklisted?'default':'pointer' }}>
              {blacklisted ? `✓ ${restaurant} added to blacklist` : `Blacklist ${restaurant}`}
            </button>
          )}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <>
          <SectionLabel>Recent evaluations</SectionLabel>
          <Card style={{ padding:0, overflow:'hidden', marginBottom:16 }}>
            {history.map((h, i) => (
              <div key={h.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderBottom: i<history.length-1?'1px solid var(--border)':'none' }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background: h.decision==='accepted'?'var(--teal)':'var(--coral)', flexShrink:0 }}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:500 }}>{PLATFORMS[h.offer.platform]?.name} · ${h.offer.offeredPayout} · {h.offer.offeredMiles}mi</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>${h.metrics.payoutPerMile}/mi · ${h.metrics.impliedHourlyRate}/hr implied</div>
                </div>
                <div style={{ fontSize:12, fontWeight:600, color: h.decision==='accepted'?'var(--teal)':'var(--coral)' }}>
                  {h.decision === 'accepted' ? 'Accept' : 'Decline'}
                </div>
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  )
}

const inputStyle = { width:'100%', padding:'10px 12px', borderRadius:9, border:'1px solid var(--border)', background:'var(--bg)', fontSize:14, color:'var(--text-primary)', outline:'none', fontFamily:'DM Sans,sans-serif' }
