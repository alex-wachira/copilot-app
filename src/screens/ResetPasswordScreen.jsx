// ============================================================
// Reset Password Screen
// Shown when a user clicks the recovery link in their email.
// Supabase puts a recovery token in the URL hash — supabase-js
// picks it up automatically and fires PASSWORD_RECOVERY.
// ============================================================

import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ResetPasswordScreen({ onDone }) {
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)

  const handleReset = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setSuccess(true)
      setTimeout(() => onDone && onDone(), 2500)
    } catch (err) {
      setError(err.message || 'Could not update password — the link may have expired. Request a new one.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', background:'#111' }}>
      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:'0 24px' }}>
        <div style={{ marginBottom:40 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:'#EF9F27', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#141414" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <span style={{ fontSize:24, fontWeight:700, color:'#fff', letterSpacing:'-0.5px' }}>Co-Pilot</span>
          </div>
          <h1 style={{ fontSize:30, fontWeight:700, color:'#fff', lineHeight:1.2, letterSpacing:'-0.4px', marginBottom:8 }}>
            Set a new password
          </h1>
          <p style={{ fontSize:14, color:'rgba(255,255,255,0.45)' }}>
            Choose a strong password you haven't used before.
          </p>
        </div>
      </div>

      <div style={{ background:'var(--bg)', borderRadius:'24px 24px 0 0', padding:'28px 24px 44px' }}>
        {success ? (
          <div style={{ textAlign:'center', padding:'12px 0' }}>
            <div style={{ width:56, height:56, borderRadius:'50%', background:'var(--teal-light)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div style={{ fontSize:17, fontWeight:600, color:'var(--text-primary)', marginBottom:4 }}>Password updated!</div>
            <div style={{ fontSize:13, color:'var(--text-muted)' }}>Taking you to sign in…</div>
          </div>
        ) : (
          <form onSubmit={handleReset} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ position:'relative' }}>
              <input type={showPass?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="New password" required style={{ ...inputStyle, paddingRight:44 }}/>
              <button type="button" onClick={()=>setShowPass(p=>!p)} style={eyeBtn}>
                {showPass
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
            <input type={showPass?'text':'password'} value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Confirm new password" required style={inputStyle}/>

            {/* Password strength hint */}
            {password && (
              <div style={{ display:'flex', gap:4 }}>
                {[6, 8, 10].map((len, i) => (
                  <div key={i} style={{ flex:1, height:4, borderRadius:2, background: password.length >= len ? ['var(--coral)','var(--amber)','var(--teal)'][i] : 'var(--gray-50)', transition:'background 0.2s' }}/>
                ))}
              </div>
            )}

            {error && <p style={{ fontSize:13, color:'var(--coral)', textAlign:'center', margin:0 }}>{error}</p>}

            <button type="submit" disabled={loading} style={{ width:'100%', padding:'14px', borderRadius:12, border:'none', background:'#141414', color:'#fff', fontSize:15, fontWeight:600, cursor:'pointer', opacity: loading?0.7:1, fontFamily:'DM Sans, sans-serif' }}>
              {loading ? 'Updating…' : 'Update password →'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

const inputStyle = { width:'100%', padding:'13px 14px', borderRadius:12, border:'1px solid var(--border)', background:'#fff', fontSize:15, color:'var(--text-primary)', outline:'none', fontFamily:'DM Sans, sans-serif' }
const eyeBtn = { position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:4 }
