const tabs = [
  { id: 'home',     label: 'Home',    icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  { id: 'planner',  label: 'Planner', icon: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' },
  { id: 'ai',       label: 'AI',      icon: null },
  { id: 'board',    label: 'Ranks',   icon: 'M18 20V10M12 20V4M6 20v-6' },
  { id: 'profile',  label: 'More',    icon: 'M4 6h16M4 12h16M4 18h16' },
]

export default function BottomNav({ active, onChange, notifCount = 0 }) {
  return (
    <div style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:430, background:'#141414', display:'flex', padding:'8px 0 calc(8px + env(safe-area-inset-bottom))', zIndex:100 }}>
      {tabs.map(tab => {
        const isActive = active === tab.id
        const isAI = tab.id === 'ai'
        return (
          <button key={tab.id} onClick={() => onChange(tab.id)} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3, background:'none', border:'none', cursor:'pointer', color: isActive?'#EF9F27':'rgba(255,255,255,0.35)', padding:'2px 0', transition:'color 0.15s', position:'relative' }}>
            {isAI ? (
              <div style={{ width:36, height:36, borderRadius:11, background: isActive?'#EF9F27':'rgba(239,159,39,0.15)', border: isActive?'none':'1px solid rgba(239,159,39,0.3)', display:'flex', alignItems:'center', justifyContent:'center', marginTop:-10, transition:'all 0.15s', boxShadow: isActive?'0 0 16px rgba(239,159,39,0.4)':'none' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isActive?'#141414':'#EF9F27'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4M9 8h6M9 12h4"/>
                </svg>
              </div>
            ) : (
              <div style={{ position:'relative' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive?2.2:1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d={tab.icon}/>
                </svg>
                {tab.id === 'home' && notifCount > 0 && (
                  <div style={{ position:'absolute', top:-3, right:-3, width:8, height:8, borderRadius:'50%', background:'#D85A30', border:'1.5px solid #141414' }}/>
                )}
              </div>
            )}
            <span style={{ fontSize:10, fontWeight: isActive?600:400, marginTop: isAI?2:0 }}>{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
