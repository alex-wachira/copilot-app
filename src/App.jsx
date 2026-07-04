import { useState, useEffect } from 'react'
import './index.css'
import AuthScreen from './screens/AuthScreen'
import HomeScreen from './screens/HomeScreen'
import MapScreen from './screens/MapScreen'
import EarningsScreen from './screens/EarningsScreen'
import TaxesScreen from './screens/TaxesScreen'
import ProfileScreen from './screens/ProfileScreen'
import AIScreen from './screens/AIScreen'
import NotificationsScreen from './screens/NotificationsScreen'
import ShiftPlannerScreen from './screens/ShiftPlannerScreen'
import LeaderboardScreen from './screens/LeaderboardScreen'
import OfferEvaluatorScreen from './screens/OfferEvaluatorScreen'
import ShiftScreen from './screens/ShiftScreen'
import ResetPasswordScreen from './screens/ResetPasswordScreen'
import PrivacyScreen from './screens/PrivacyScreen'
import { supabase } from './lib/supabase'
import BottomNav from './components/BottomNav'
import SurgeReportPrompt from './components/SurgeReportPrompt'
import { useSurge } from './lib/useSurge'
import { mockNotifications } from './lib/notifications'
import { loadLocalAvatar, loadAvatarUrl, saveAvatarLocally, clearAvatar, uploadAvatarToSupabase } from './lib/avatarService'

export default function App() {
  const [driver, setDriver] = useState(null)
  const [tab, setTab]       = useState('home')
  const [avatar, setAvatar] = useState(() => loadAvatarUrl() || loadLocalAvatar())
  const [recoveryMode, setRecoveryMode] = useState(false)

  // Detect password recovery link from email
  useEffect(() => {
    // Immediate check: recovery links contain type=recovery in the URL hash
    if (window.location.hash.includes('type=recovery')) setRecoveryMode(true)
    // Also listen for the official event
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true)
    })
    return () => sub?.subscription?.unsubscribe()
  }, [])

  // Apply saved theme on load
  useEffect(() => {
    const theme = localStorage.getItem('copilot_theme') || 'light'
    document.documentElement.setAttribute('data-theme', theme)
  }, [])

  const surge = useSurge({
    driverId: driver?.id,
    city:     driver?.city || 'Chicago',
    lat:      41.8781, lng: -87.6298,
  })

  const unreadNotifs = mockNotifications.filter(n => !n.read).length

  useEffect(() => {
    if (driver) {
      const saved = loadAvatarUrl() || loadLocalAvatar()
      if (saved) setAvatar(saved)
    }
  }, [driver])

  const handleAvatarChange = async (file, base64) => {
    setAvatar(base64)
    saveAvatarLocally(base64)
    if (driver?.id) {
      const url = await uploadAvatarToSupabase(file, driver.id)
      if (url) setAvatar(url)
    }
  }

  const handleSignOut = () => {
    clearAvatar()
    setAvatar(null)
    setDriver(null)
    setTab('home')
  }

  if (recoveryMode) return <ResetPasswordScreen onDone={() => { setRecoveryMode(false); window.location.hash = ''; }} />

  if (!driver) return <AuthScreen onAuth={setDriver} />

  const screens = {
    home:      <HomeScreen driver={driver} surge={surge} onTabChange={setTab} avatar={avatar} />,
    map:       <MapScreen surge={surge} driver={driver} />,
    ai:        <AIScreen driver={driver} />,
    shift:     <ShiftScreen driver={driver} />,
    evaluator: <OfferEvaluatorScreen driver={driver} />,
    planner:   <ShiftPlannerScreen driver={driver} />,
    board:     <LeaderboardScreen driver={driver} />,
    earnings:  <EarningsScreen driver={driver} />,
    taxes:     <TaxesScreen />,
    notifs:    <NotificationsScreen />,
    privacy:   <PrivacyScreen driver={driver} onSignOut={handleSignOut} onBack={() => setTab('more')} />,
    more:      <ProfileScreen driver={driver} avatar={avatar} onAvatarChange={handleAvatarChange} onSignOut={handleSignOut} onTabChange={setTab} />,
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>
      {screens[tab] || screens.home}
      <BottomNav active={tab} onChange={setTab} notifCount={unreadNotifs} />
      {surge.showReportPrompt && (
        <SurgeReportPrompt
          detection={surge.pendingDetection}
          isListening={surge.isListening}
          onConfirm={surge.confirmSurge}
          onNoSurge={surge.reportNoSurge}
          onVoice={surge.startVoiceReport}
          onDismiss={surge.dismissPrompt}
        />
      )}
    </div>
  )
}
