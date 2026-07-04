// ============================================================
// Privacy & Data Screen
// Transparency on what we collect, data export (CCPA/GDPR),
// local data clearing, and full account deletion.
// ============================================================

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Card, SectionLabel } from '../components/UI'
import { getShiftHistory } from '../lib/shiftService'

const DATA_COLLECTED = [
  { icon:'📧', label:'Email address', why:'Account login and password recovery' },
  { icon:'📍', label:'GPS location', why:'Surge maps and zone recommendations. Only while the app is open — never in the background.' },
  { icon:'💵', label:'Earnings & trips you log', why:'Your dashboards, true hourly rate, and tax estimates' },
  { icon:'🧾', label:'Expenses & receipts', why:'Tax deduction tracking' },
  { icon:'📷', label:'Profile photo', why:'Only if you upload one — shown only to you' },
  { icon:'⚡', label:'Surge reports', why:'Shared anonymously with nearby drivers to power the live map' },
]

const THIRD_PARTIES = [
  { name:'Supabase', role:'Database & authentication', data:'Account, trips, expenses (encrypted at rest)' },
  { name:'Anthropic (Claude)', role:'AI assistant', data:'Your questions + earnings context for personalized answers. Not used to train models.' },
  { name:'Vercel', role:'App hosting', data:'Standard web logs (IP, browser type)' },
  { name:'OpenStreetMap', role:'Maps', data:'Map tile requests near your location' },
]

const WE_NEVER = [
  'Sell your data to anyone, ever',
  'Share your earnings with gig platforms (Uber, DoorDash, etc.)',
  'Track your location in the background',
  'Show your identity on leaderboards — always anonymous',
]

export default function PrivacyScreen({ driver, onSignOut, onBack }) {
  const [exporting, setExporting]   = useState(false)
  const [cleared, setCleared]       = useState(false)
  const [confirmDelete, setConfirm] = useState(false)
  const [deleting, setDeleting]     = useState(false)
  const [deleteError, setDelError]  = useState('')

  // ── Export all data as JSON (CCPA/GDPR right to access) ──
  const handleExport = async () => {
    setExporting(true)
    const exportData = {
      exportedAt: new Date().toISOString(),
      profile: { name: driver?.name, city: driver?.city, weeklyGoal: driver?.weeklyGoal, platforms: driver?.platforms },
      shiftsLocal: getShiftHistory(),
    }
    // Pull cloud data if signed in
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const tables = ['trips','expenses','mileage_log','offer_evaluations','blacklisted_restaurants']
        for (const t of tables) {
          const { data } = await supabase.from(t).select('*').eq('user_id', user.id)
          exportData[t] = data || []
        }
        exportData.email = user.email
      }
    } catch {}
    // Trigger download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type:'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `copilot-my-data-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  // ── Clear local device data ────────────────────────────────
  const handleClearLocal = () => {
    const keys = ['copilot_active_shift','copilot_shift_history','copilot_avatar','copilot_avatar_url']
    keys.forEach(k => localStorage.removeItem(k))
    setCleared(true)
    setTimeout(() => setCleared(false), 3000)
  }

  // ── Delete account + all data (right to deletion) ─────────
  const handleDeleteAccount = async () => {
    setDeleting(true)
    setDelError('')
    try {
      // Calls the delete_user() RPC (security definer) in Supabase
      const { error } = await supabase.rpc('delete_user')
      if (error) throw error
      localStorage.clear()
      onSignOut && onSignOut()
    } catch (err) {
      setDelError('Deletion failed — contact support@drivercopilot.app and we will delete everything within 48 hours.')
      setDeleting(false)
    }
  }

  return (
    <div className="screen" style={{ padding:'0 16px' }}>
      <div style={{ padding:'20px 0 4px', display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={onBack} style={{ background:'none', border:'1px solid var(--border)', borderRadius:10, width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text-primary)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div>
          <div style={{ fontSize:13, color:'var(--text-muted)' }}>your data, your control</div>
          <div style={{ fontSize:22, fontWeight:600, letterSpacing:'-0.3px' }}>Privacy & Data</div>
        </div>
      </div>

      {/* Promise card */}
      <div style={{ background:'#141414', borderRadius:16, padding:'16px', margin:'12px 0 10px' }}>
        <div style={{ fontSize:14, fontWeight:600, color:'#fff', marginBottom:10 }}>🔒 Our promise — we never:</div>
        {WE_NEVER.map(item => (
          <div key={item} style={{ display:'flex', gap:8, marginBottom:6, alignItems:'flex-start' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D85A30" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink:0, marginTop:2 }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            <span style={{ fontSize:13, color:'rgba(255,255,255,0.75)', lineHeight:1.4 }}>{item}</span>
          </div>
        ))}
      </div>

      {/* What we collect */}
      <SectionLabel>What we collect & why</SectionLabel>
      <Card style={{ padding:0, overflow:'hidden', marginBottom:10 }}>
        {DATA_COLLECTED.map((d,i,arr) => (
          <div key={d.label} style={{ display:'flex', gap:10, padding:'11px 14px', borderBottom: i<arr.length-1?'1px solid var(--border)':'none', alignItems:'flex-start' }}>
            <span style={{ fontSize:18, flexShrink:0 }}>{d.icon}</span>
            <div>
              <div style={{ fontSize:13, fontWeight:500 }}>{d.label}</div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1, lineHeight:1.4 }}>{d.why}</div>
            </div>
          </div>
        ))}
      </Card>

      {/* Third parties */}
      <SectionLabel>Services we use</SectionLabel>
      <Card style={{ padding:0, overflow:'hidden', marginBottom:10 }}>
        {THIRD_PARTIES.map((t,i,arr) => (
          <div key={t.name} style={{ padding:'11px 14px', borderBottom: i<arr.length-1?'1px solid var(--border)':'none' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
              <span style={{ fontSize:13, fontWeight:500 }}>{t.name}</span>
              <span style={{ fontSize:11, color:'var(--teal)', fontWeight:500 }}>{t.role}</span>
            </div>
            <div style={{ fontSize:11, color:'var(--text-muted)', lineHeight:1.4 }}>{t.data}</div>
          </div>
        ))}
      </Card>

      {/* Data controls */}
      <SectionLabel>Your data controls</SectionLabel>
      <Card style={{ padding:0, overflow:'hidden', marginBottom:10 }}>
        {/* Export */}
        <div onClick={handleExport} style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 14px', borderBottom:'1px solid var(--border)', cursor:'pointer' }}>
          <div style={{ width:32, height:32, borderRadius:8, background:'var(--teal-light)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--teal-dark)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:500 }}>{exporting ? 'Preparing download…' : 'Export my data'}</div>
            <div style={{ fontSize:11, color:'var(--text-muted)' }}>Download everything as JSON — trips, expenses, shifts</div>
          </div>
        </div>

        {/* Clear local */}
        <div onClick={handleClearLocal} style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 14px', cursor:'pointer' }}>
          <div style={{ width:32, height:32, borderRadius:8, background:'var(--amber-light)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--amber-dark)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:500 }}>{cleared ? '✓ Local data cleared' : 'Clear data on this device'}</div>
            <div style={{ fontSize:11, color:'var(--text-muted)' }}>Removes cached shifts & photo from this browser only</div>
          </div>
        </div>
      </Card>

      {/* Danger zone */}
      <SectionLabel>Danger zone</SectionLabel>
      <Card style={{ marginBottom:16, border:'1px solid rgba(216,90,48,0.3)' }}>
        {!confirmDelete ? (
          <>
            <div style={{ fontSize:13, fontWeight:500, marginBottom:2 }}>Delete my account & all data</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:10, lineHeight:1.5 }}>
              Permanently erases your account, trips, expenses, tax records, and photo from our servers. This cannot be undone.
            </div>
            <button onClick={()=>setConfirm(true)} style={{ width:'100%', padding:'11px', borderRadius:10, border:'1px solid var(--coral)', background:'transparent', color:'var(--coral)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
              Delete account…
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--coral)', marginBottom:8 }}>Are you absolutely sure?</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:10 }}>All your data will be permanently deleted. Consider exporting first.</div>
            {deleteError && <div style={{ fontSize:12, color:'var(--coral)', marginBottom:8 }}>{deleteError}</div>}
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>setConfirm(false)} style={{ flex:1, padding:'11px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface)', color:'var(--text-primary)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                Cancel
              </button>
              <button onClick={handleDeleteAccount} disabled={deleting} style={{ flex:1, padding:'11px', borderRadius:10, border:'none', background:'var(--coral)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', opacity: deleting?0.7:1 }}>
                {deleting ? 'Deleting…' : 'Yes, delete everything'}
              </button>
            </div>
          </>
        )}
      </Card>

      <div style={{ fontSize:11, color:'var(--text-muted)', textAlign:'center', marginBottom:20, lineHeight:1.6 }}>
        Questions? Email <span style={{ color:'var(--teal)' }}>privacy@drivercopilot.app</span><br/>
        We respond to all data requests within 48 hours.
      </div>
    </div>
  )
}
