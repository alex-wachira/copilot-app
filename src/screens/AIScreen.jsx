import { useState, useRef, useEffect } from 'react'
import { PLATFORMS, PLATFORM_EARNINGS, OPTIMIZATION_SIGNALS } from '../lib/platforms'
import { mockGoal, mockSurgeZones, mockEvents, mockTax } from '../lib/mockData'

function buildSystemPrompt(driver) {
  const platforms = driver?.platforms || ['uber']
  const goal = driver?.weeklyGoal || 1000
  const totalWeek = platforms.reduce((s,id) => s+(PLATFORM_EARNINGS[id]?.week||0), 0)
  const remaining = goal - totalWeek
  const platformNames = platforms.map(id => PLATFORMS[id]?.name).join(', ')
  const isDelivery = platforms.some(id => PLATFORMS[id]?.type === 'delivery')

  const platformDetails = platforms.map(id => {
    const p = PLATFORMS[id]
    const e = PLATFORM_EARNINGS[id]
    if (!p || !e) return ''
    return `${p.name}: $${e.today} today, $${e.week}/wk, $${e.perHour}/hr, ${e.acceptance}% acceptance${e.completion?`, ${e.completion}% completion`:''}${e.avgTip?`, avg tip $${e.avgTip}`:''}${e.avgWait?`, avg wait ${e.avgWait}min`:''}${e.peakPay?`, $${e.peakPay} peak pay earned`:''}${e.missions?`, ${e.missions} missions active`:''}`
  }).join('\n')

  const signals = OPTIMIZATION_SIGNALS.filter(s => platforms.includes(s.platform))
    .map(s => `- ${s.title}: ${s.earnDelta}${s.validUntil?' (until '+s.validUntil+')':''}`)
    .join('\n')

  return `You are Co-Pilot AI, a sharp personal assistant for gig economy drivers. Speak like a knowledgeable friend — warm, direct, practical. Keep answers to 3-5 sentences since drivers check this between jobs.

DRIVER: ${driver?.name||'Driver'} · ${driver?.city||'Chicago'}
PLATFORMS: ${platformNames} (${isDelivery?'includes delivery':'rideshare only'})
WEEKLY GOAL: $${goal} · Earned: $${totalWeek} · Remaining: $${remaining} in 3 days

PLATFORM EARNINGS:
${platformDetails}

LIVE SURGE/HOT ZONES:
${mockSurgeZones.map(z=>`- ${z.name}: ${z.mult} (${z.distance}, ${z.ends})`).join('\n')}

CROSS-PLATFORM SIGNALS:
${signals||'No active signals'}

UPCOMING EVENTS:
${mockEvents.map(e=>`- ${e.title}: ${e.sub}`).join('\n')}

TAX: Q2 estimate $${mockTax.estimate} due ${mockTax.due} · $${mockTax.saved} saved · $${mockTax.deductions.reduce((s,d)=>s+d.amount,0)} deductions found

RULES: Always use real driver data. Never give generic advice. Do the math when asked about goals. For multi-app drivers, give cross-platform optimization advice. Be encouraging but honest.`
}

const QUICK_PROMPTS = [
  { label:'Hit my goal?', text:'Will I hit my weekly goal? What do I need to do today?' },
  { label:'Best app now?', text:'Which app should I be running right now to maximize earnings?' },
  { label:'Best time tonight?', text:'What are the best hours to drive tonight?' },
  { label:'Reduce dead miles', text:'How can I reduce my dead miles this week?' },
  { label:'Tax tips', text:'What tax deductions am I missing?' },
  { label:'Surge strategy', text:'How should I play the current surge zones?' },
]

function TypingIndicator() {
  return (
    <div style={{ display:'flex', gap:4, padding:'4px 0' }}>
      {[0,150,300].map((d,i) => <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'var(--text-muted)', animation:`pulse 1.2s ease-in-out ${d}ms infinite` }}/>)}
      <style>{`@keyframes pulse{0%,80%,100%{opacity:.2}40%{opacity:1}}`}</style>
    </div>
  )
}

export default function AIScreen({ driver }) {
  const platforms = driver?.platforms || ['uber']
  const [messages, setMessages] = useState([{
    role:'assistant',
    content:`Hey ${driver?.name||'Driver'}! 👋 You're running ${platforms.map(id=>PLATFORMS[id]?.name).join(' + ')}. Weekly goal: $${driver?.weeklyGoal||1000} — you're at $${platforms.reduce((s,id)=>s+(PLATFORM_EARNINGS[id]?.week||0),0)} with 3 days left. ${OPTIMIZATION_SIGNALS.find(s=>platforms.includes(s.platform))?.title||'What do you want to work on?'}`,
    time: new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showChips, setShowChips] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:'smooth'}) }, [messages, loading])

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return
    setShowChips(false)
    const userMsg = { role:'user', content:text.trim(), time:new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}) }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          model:'claude-sonnet-4-20250514',
          max_tokens:300,
          system:buildSystemPrompt(driver),
          messages:updated.filter(m=>m.role!=='system').map(m=>({role:m.role,content:m.content}))
        })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role:'assistant', content:data.content?.[0]?.text||"Hit a snag — try again.", time:new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}) }])
    } catch {
      setMessages(prev => [...prev, { role:'assistant', content:"Connection issue — check back in a moment.", time:new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}) }])
    } finally { setLoading(false) }
  }

  return (
    <div className="screen" style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 64px)', padding:0 }}>
      <div style={{ padding:'16px 16px 12px', borderBottom:'1px solid var(--border)', background:'var(--surface)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'#141414', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF9F27" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4M9 8h6M9 12h4"/>
            </svg>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:16, fontWeight:600 }}>Co-Pilot AI</div>
            <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:1 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--teal)' }}/>
              <span style={{ fontSize:11, color:'var(--text-muted)' }}>Knows your {platforms.length > 1 ? `${platforms.length} apps` : PLATFORMS[platforms[0]]?.name} data</span>
            </div>
          </div>
          <div style={{ display:'flex', gap:4 }}>
            {platforms.map(id => <span key={id} style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20, background:'var(--gray-50)', color:'var(--text-muted)' }}>{PLATFORMS[id]?.logo}</span>)}
          </div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:12 }}>
        {messages.map((msg,i) => (
          <div key={i} style={{ display:'flex', flexDirection:'column', alignSelf:msg.role==='assistant'?'flex-start':'flex-end', maxWidth:'85%', gap:3 }}>
            <div style={{ padding:'10px 13px', borderRadius:msg.role==='assistant'?'16px 16px 16px 4px':'16px 16px 4px 16px', background:msg.role==='assistant'?'var(--surface)':'#141414', border:msg.role==='assistant'?'1px solid var(--border)':'none', color:msg.role==='assistant'?'var(--text-primary)':'#fff', fontSize:14, lineHeight:1.55 }}>
              {msg.content}
            </div>
            <div style={{ fontSize:10, color:'var(--text-muted)', padding:'0 4px', textAlign:msg.role==='assistant'?'left':'right' }}>{msg.time}</div>
          </div>
        ))}
        {loading && <div style={{ alignSelf:'flex-start', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'16px 16px 16px 4px', padding:'12px 14px' }}><TypingIndicator/></div>}
        {showChips && !loading && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginTop:4 }}>
            {QUICK_PROMPTS.map(p => <button key={p.label} onClick={()=>sendMessage(p.text)} style={{ fontSize:12, fontWeight:500, padding:'6px 12px', borderRadius:20, border:'1px solid var(--border)', background:'var(--surface)', color:'var(--text-secondary)', cursor:'pointer' }}>{p.label}</button>)}
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      <div style={{ padding:'10px 12px 16px', background:'var(--surface)', borderTop:'1px solid var(--border)', flexShrink:0 }}>
        <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&sendMessage(input)} placeholder="Ask anything about your shift…" style={{ flex:1, padding:'10px 14px', borderRadius:22, border:'1px solid var(--border)', background:'var(--bg)', fontSize:14, color:'var(--text-primary)', outline:'none', fontFamily:'DM Sans,sans-serif' }}/>
          <button onClick={()=>sendMessage(input)} disabled={!input.trim()||loading} style={{ width:38, height:38, borderRadius:'50%', border:'none', background:input.trim()&&!loading?'#141414':'var(--gray-50)', color:input.trim()&&!loading?'#fff':'var(--text-muted)', cursor:input.trim()&&!loading?'pointer':'default', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
          </button>
        </div>
        <div style={{ fontSize:11, color:'var(--text-muted)', textAlign:'center', marginTop:8 }}>
          Knows your earnings, surge zones, hot zones & taxes
        </div>
      </div>
    </div>
  )
}
