import { useState, useRef, useEffect } from 'react'
import { PLATFORMS } from '../lib/platforms'
import { supabase } from '../lib/supabase'
import { aiSummary, periodStats } from '../lib/realStats'
import { loadCity } from '../lib/cityService'
import { resolveCityCenter, loadCityPlaces, buildDemandZones, buildHotZones, DEMAND_STYLE } from '../lib/placesService'

// Driver facts only — all from the driver's own logged data and real
// places in their city. The AI's instructions and the API key live in
// the ai-chat edge function on Supabase, never in this file.
function buildDriverContext(driver, places) {
  const platforms = driver?.platforms || ['uber']
  const names = platforms.map(id => PLATFORMS[id]?.name).filter(Boolean).join(', ')
  const isDelivery = platforms.some(id => PLATFORMS[id]?.type === 'delivery')
  const now = new Date().toLocaleString('en-US', { weekday:'long', hour:'numeric', minute:'2-digit' })

  let zones = 'Not loaded yet.'
  if (places) {
    const dz = buildDemandZones(places).slice(0, 8).map(z => `- ${z.name}: ${DEMAND_STYLE[z.level].label} (${z.why})`)
    const hz = isDelivery ? buildHotZones(places).slice(0, 4).map(z => `- ${z.name}: ${DEMAND_STYLE[z.level].label} (${z.why})`) : []
    const venues = places.venues.slice(0, 6).map(v => v.name).join(', ')
    zones = [...dz, ...(hz.length ? ['DELIVERY RESTAURANT CLUSTERS:', ...hz] : []), venues ? `BIG VENUES (check schedules): ${venues}` : ''].filter(Boolean).join('\n')
  }

  return `DRIVER: ${driver?.name||'Driver'} · ${driver?.city||'unknown city'} · now: ${now}
APPS: ${names} (${isDelivery?'includes delivery':'rideshare only'})

${aiSummary(driver)}

DEMAND AREAS IN THEIR CITY (estimated from time of day + real places — NOT live surge data; never quote surge multipliers):
${zones}`
}

const QUICK_PROMPTS = [
  { label:'Hit my goal?', text:'Will I hit my weekly goal? What do I need to do today?' },
  { label:'Best app now?', text:'Which app should I be running right now to maximize earnings?' },
  { label:'Best time tonight?', text:'What are the best hours to drive tonight?' },
  { label:'Reduce dead miles', text:'How can I reduce my dead miles this week?' },
  { label:'Tax set-aside', text:'How much should I set aside for taxes, and what can I deduct?' },
  { label:'Where to go now?', text:'Based on the time and the demand areas in my city, where should I position myself right now?' },
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
  const week = periodStats('week')
  const goal = driver?.weeklyGoal || 1000
  const [places, setPlaces] = useState(null)
  useEffect(() => {
    let alive = true
    resolveCityCenter(loadCity(), driver?.city)
      .then(loadCityPlaces).then(p => { if (alive) setPlaces(p) }).catch(() => {})
    return () => { alive = false }
  }, [driver?.city])
  const [messages, setMessages] = useState([{
    role:'assistant',
    content: week.jobs > 0
      ? `Hey ${driver?.name||'Driver'}! 👋 You've made $${Math.round(week.gross)} of your $${goal} goal this week across ${week.jobs} jobs. What do you want to work on?`
      : `Hey ${driver?.name||'Driver'}! 👋 You're set up for ${platforms.map(id=>PLATFORMS[id]?.name).join(' + ')}. Once you log trips on the Shift tab I can coach you on your real numbers — until then, ask me anything about where and when to drive.`,
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
      // Ask the ai-chat robot on Supabase. It checks who you are, counts
      // today's questions, and holds the AI key on the server.
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: updated.map(m => ({ role: m.role, content: m.content })),
          context: buildDriverContext(driver, places),
        },
      })
      let reply
      if (!error && data?.text) {
        reply = data.text
      } else {
        // The robot sends friendly messages for sign-in, daily limit and busy errors
        let serverMsg = data?.error
        try { serverMsg = serverMsg || (await error?.context?.json())?.error } catch {}
        reply = serverMsg ? `⚠️ ${serverMsg}` : "Hit a snag — try again in a moment."
      }
      setMessages(prev => [...prev, { role:'assistant', content:reply, time:new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}) }])
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
          AI can be wrong · not tax or financial advice · never type while driving
        </div>
      </div>
    </div>
  )
}
