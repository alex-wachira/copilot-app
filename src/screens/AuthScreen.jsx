import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { PLATFORMS, PLATFORM_LIST } from '../lib/platforms'

function PlatformBadge({ platform, selected, onToggle }) {
  const p = PLATFORMS[platform]
  return (
    <button onClick={() => onToggle(platform)} style={{
      display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderRadius:14,
      border: selected?`2px solid ${p.color === '#141414' ? '#555' : p.color}`:'1.5px solid var(--border)',
      background: selected?p.colorLight:'var(--surface)', cursor:'pointer', transition:'all 0.15s', textAlign:'left', width:'100%',
    }}>
      <div style={{ width:36, height:36, borderRadius:9, background:selected?p.color:'#F1EFE8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:p.logo.length>1?10:14, fontWeight:700, color:selected?'#fff':'#888780', flexShrink:0, transition:'all 0.15s' }}>
        {p.logo}
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)' }}>{p.name}</div>
        <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>{p.type==='rideshare'?'Rideshare':'Food delivery'}</div>
      </div>
      <div style={{ width:20, height:20, borderRadius:'50%', border:selected?'2px solid #1D9E75':'1.5px solid var(--border)', background:selected?'#1D9E75':'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}>
        {selected&&<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
      </div>
    </button>
  )
}

export default function AuthScreen({ onAuth }) {
  const [step, setStep]             = useState('account')
  const [mode, setMode]             = useState('signup')
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [name, setName]             = useState('')
  const [showPassword, setShowPass] = useState(false)
  const [platforms, setPlatforms]   = useState([])
  const [weeklyGoal, setWeeklyGoal] = useState(1000)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [forgotSent, setForgotSent] = useState(false)

  const togglePlatform = (id) => setPlatforms(prev => prev.includes(id)?prev.filter(p=>p!==id):[...prev,id])

  const handleAccount = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        onAuth({ name: email.split('@')[0], platforms: ['uber'], weeklyGoal: 1000 })
        return
      } else {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { name } } })
        if (error) throw error
      }
    } catch (err) {
      setError(err.message || 'Something went wrong — try again')
      setLoading(false)
      return
    }
    setLoading(false)
    setStep('platforms')
  }

  const handleForgotPassword = async () => {
    if (!email) { setError('Enter your email address first'); return }
    setLoading(true)
    try {
      await supabase.auth.resetPasswordForEmail(email, { redirectTo: 'https://drivercopilot.app/reset' })
      setForgotSent(true)
      setError('')
    } catch { setError('Could not send reset email — try again') }
    setLoading(false)
  }

  const handleFinish = () => onAuth({
    name: name || email.split('@')[0] || 'Driver',
    platforms: platforms.length>0?platforms:['uber'],
    weeklyGoal,
  })

  const steps = ['account','platforms','goal']

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', background:'#111' }}>
      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:'0 24px 0' }}>
        <div style={{ marginBottom:40 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:'#EF9F27', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#141414" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
              </svg>
            </div>
            <span style={{ fontSize:24, fontWeight:700, color:'#fff', letterSpacing:'-0.5px' }}>Co-Pilot</span>
          </div>
          {step==='account'&&<><h1 style={{ fontSize:34, fontWeight:700, color:'#fff', lineHeight:1.15, letterSpacing:'-0.5px', marginBottom:10 }}>Drive smarter.<br/>Earn more.</h1><p style={{ fontSize:15, color:'rgba(255,255,255,0.5)', lineHeight:1.6 }}>Works with Uber, Lyft, DoorDash, Uber Eats & Grubhub — all in one app.</p></>}
          {step==='platforms'&&<><h1 style={{ fontSize:28, fontWeight:700, color:'#fff', lineHeight:1.2, letterSpacing:'-0.3px', marginBottom:8 }}>Which apps do you drive for?</h1><p style={{ fontSize:14, color:'rgba(255,255,255,0.45)' }}>Select all that apply — we'll personalize everything.</p></>}
          {step==='goal'&&<><h1 style={{ fontSize:28, fontWeight:700, color:'#fff', lineHeight:1.2, letterSpacing:'-0.3px', marginBottom:8 }}>Set your weekly target</h1><p style={{ fontSize:14, color:'rgba(255,255,255,0.45)' }}>We'll track progress across all apps and tell you what you need each day.</p></>}
        </div>
      </div>

      <div style={{ background:'var(--bg)', borderRadius:'24px 24px 0 0', padding:'28px 24px 44px' }}>
        <div style={{ display:'flex', gap:6, justifyContent:'center', marginBottom:24 }}>
          {steps.map(s=><div key={s} style={{ height:4, borderRadius:2, transition:'all 0.3s', width:step===s?24:8, background:step===s?'#141414':'var(--border)' }}/>)}
        </div>

        {step==='account'&&(
          <>
            <div style={{ display:'flex', gap:4, background:'rgba(0,0,0,0.06)', borderRadius:10, padding:4, marginBottom:20 }}>
              {['signup','login'].map(m=><button key={m} onClick={()=>{setMode(m);setError('')}} style={{ flex:1, padding:'8px', borderRadius:7, border:'none', fontSize:14, fontWeight:500, background:mode===m?'#fff':'transparent', color:mode===m?'var(--text-primary)':'var(--text-muted)', cursor:'pointer' }}>{m==='signup'?'Create account':'Sign in'}</button>)}
            </div>
            <form onSubmit={handleAccount} style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {mode==='signup'&&<input value={name} onChange={e=>setName(e.target.value)} placeholder="First name" style={inputStyle}/>}
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" required style={inputStyle}/>
              
              {/* Password field with show/hide */}
              <div style={{ position:'relative' }}>
                <input type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" required style={{ ...inputStyle, paddingRight:44 }}/>
                <button type="button" onClick={()=>setShowPass(p=>!p)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:4 }}>
                  {showPassword
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>

              {error&&<p style={{ fontSize:13, color:'var(--coral)', textAlign:'center', margin:0 }}>{error}</p>}
              {forgotSent&&<p style={{ fontSize:13, color:'var(--teal)', textAlign:'center', margin:0 }}>✓ Reset link sent — check your email</p>}

              <button type="submit" disabled={loading} style={{ ...primaryBtn, opacity:loading?0.7:1 }}>
                {loading?'Loading…':mode==='signup'?'Continue →':'Sign in →'}
              </button>

              {/* Forgot password */}
              {mode==='login'&&(
                <button type="button" onClick={handleForgotPassword} disabled={loading} style={{ background:'none', border:'none', fontSize:13, color:'var(--text-muted)', cursor:'pointer', textAlign:'center', padding:'4px 0' }}>
                  Forgot password? {email?'Send reset link':'(enter email above first)'}
                </button>
              )}
            </form>
          </>
        )}

        {step==='platforms'&&(
          <>
            <div style={{ display:'flex', flexDirection:'column', gap:9, marginBottom:16 }}>
              {PLATFORM_LIST.map(p=><PlatformBadge key={p.id} platform={p.id} selected={platforms.includes(p.id)} onToggle={togglePlatform}/>)}
            </div>
            <div style={{ textAlign:'center', fontSize:12, color:'var(--text-muted)', marginBottom:14 }}>
              {platforms.length===0?'Select at least one platform':`${platforms.length} platform${platforms.length>1?'s':''} selected`}
            </div>
            <button onClick={()=>setStep('goal')} disabled={platforms.length===0} style={{ ...primaryBtn, opacity:platforms.length===0?0.4:1 }}>Continue →</button>
          </>
        )}

        {step==='goal'&&(
          <>
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ fontSize:56, fontWeight:700, letterSpacing:'-2px', color:'var(--text-primary)', lineHeight:1 }}>${weeklyGoal.toLocaleString()}</div>
              <div style={{ fontSize:14, color:'var(--text-muted)', marginTop:6 }}>per week across all apps</div>
            </div>
            <input type="range" min={200} max={3000} step={50} value={weeklyGoal} onChange={e=>setWeeklyGoal(Number(e.target.value))} style={{ width:'100%', marginBottom:20 }}/>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:20 }}>
              {[500,1000,1500].map(g=><button key={g} onClick={()=>setWeeklyGoal(g)} style={{ padding:'10px', borderRadius:10, border:'1px solid var(--border)', background:weeklyGoal===g?'#141414':'var(--surface)', color:weeklyGoal===g?'#fff':'var(--text-secondary)', fontSize:14, fontWeight:500, cursor:'pointer' }}>${g.toLocaleString()}</button>)}
            </div>
            <button onClick={handleFinish} style={primaryBtn}>Let's go 🚀</button>
          </>
        )}
      </div>
    </div>
  )
}

const inputStyle = { width:'100%', padding:'13px 14px', borderRadius:12, border:'1px solid var(--border)', background:'#fff', fontSize:15, color:'var(--text-primary)', outline:'none', fontFamily:'DM Sans, sans-serif' }
const primaryBtn = { width:'100%', padding:'14px', borderRadius:12, border:'none', background:'#141414', color:'#fff', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans, sans-serif' }
