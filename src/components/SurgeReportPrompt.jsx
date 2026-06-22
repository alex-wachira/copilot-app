// ============================================================
// SurgeReportPrompt
// In-car overlay — appears briefly when passive detection
// needs confirmation. Max 2 taps, auto-dismisses in 8s.
// ============================================================

import { useState, useEffect } from 'react'

const MULTIPLIERS = ['1.4x', '1.8x', '2.1x', '2.5x+']
const MULT_VALUES  = { '1.4x': 1.4, '1.8x': 1.8, '2.1x': 2.1, '2.5x+': 2.5 }
const AUTO_DISMISS_SECS = 8

export default function SurgeReportPrompt({
  detection,
  isListening,
  onConfirm,
  onNoSurge,
  onVoice,
  onDismiss,
}) {
  const [step, setStep] = useState('ask')       // 'ask' | 'pick' | 'done'
  const [countdown, setCountdown] = useState(AUTO_DISMISS_SECS)
  const [confirmedVal, setConfirmedVal] = useState(null)

  // Auto-dismiss countdown
  useEffect(() => {
    if (step === 'done') return
    if (countdown <= 0) { onDismiss(); return }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, step, onDismiss])

  // Reset on mount
  useEffect(() => {
    setStep('ask')
    setCountdown(AUTO_DISMISS_SECS)
  }, [])

  const handleYes = () => {
    setStep('pick')
    setCountdown(AUTO_DISMISS_SECS)
  }

  const handlePick = (label) => {
    setConfirmedVal(label)
    setStep('done')
    onConfirm(MULT_VALUES[label])
    setTimeout(onDismiss, 2000)
  }

  if (step === 'done') {
    return (
      <div style={overlayStyle}>
        <div style={sheetStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 4px', gap: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(29,158,117,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div style={{ fontSize: 15, fontWeight: 500, color: '#fff' }}>{confirmedVal} surge logged</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Thanks — helping nearby drivers</div>
          </div>
        </div>
      </div>
    )
  }

  if (isListening) {
    return (
      <div style={overlayStyle}>
        <div style={sheetStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 36 }}>
              {[0, 0.1, 0.2, 0.3, 0.4].map((delay, i) => (
                <div key={i} style={{
                  width: 4, height: 8, background: '#1D9E75', borderRadius: 2,
                  animation: `wave 0.8s ease-in-out ${delay}s infinite`
                }} />
              ))}
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#1D9E75' }}>Listening…</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
              Say the multiplier and area<br />"Two point one downtown"
            </div>
          </div>
        </div>
        <style>{`@keyframes wave { 0%,100%{height:8px} 50%{height:28px} }`}</style>
      </div>
    )
  }

  return (
    <div style={overlayStyle} onClick={onDismiss}>
      <div style={sheetStyle} onClick={e => e.stopPropagation()}>
        {step === 'ask' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 500, color: '#fff' }}>Seeing a surge?</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                  We detected a possible {detection?.detection?.label} — confirm?
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: '2px 8px' }}>
                {countdown}s
              </div>
            </div>

            <button onClick={handleYes} style={{ ...bigBtn, background: '#EF9F27', color: '#141414', marginBottom: 8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              Yes, I'm in a surge
            </button>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={onNoSurge} style={{ ...smallBtn, flex: 1 }}>No surge</button>
              <button onClick={onVoice} style={{ ...smallBtn, flex: 1, color: '#1D9E75', borderColor: 'rgba(29,158,117,0.4)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
                Say it
              </button>
            </div>
          </>
        )}

        {step === 'pick' && (
          <>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 12 }}>What multiplier?</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {MULTIPLIERS.map(m => (
                <button key={m} onClick={() => handlePick(m)} style={{
                  height: 56, borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.07)',
                  color: '#fff', fontSize: 16, fontWeight: 500,
                  cursor: 'pointer', transition: 'background 0.1s'
                }}>
                  {m}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const overlayStyle = {
  position: 'fixed', bottom: 80, left: 0, right: 0,
  display: 'flex', justifyContent: 'center',
  zIndex: 200, padding: '0 16px',
}

const sheetStyle = {
  width: '100%', maxWidth: 398,
  background: '#1e2026', borderRadius: 20,
  border: '1px solid rgba(255,255,255,0.1)',
  padding: '16px',
  boxShadow: '0 -4px 40px rgba(0,0,0,0.4)',
}

const bigBtn = {
  width: '100%', height: 64, borderRadius: 14,
  border: 'none', fontSize: 16, fontWeight: 600,
  cursor: 'pointer', display: 'flex', alignItems: 'center',
  justifyContent: 'center', gap: 8
}

const smallBtn = {
  height: 44, borderRadius: 10, fontSize: 13, fontWeight: 500,
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center'
}
