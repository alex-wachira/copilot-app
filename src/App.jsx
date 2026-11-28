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
import LegalScreen, { LEGAL_PATHS } from './screens/LegalScreen'
import VehicleScreen from './screens/VehicleScreen'
import OracleScreen from './screens/OracleScreen'
import { supabase } from './lib/supabase'
import BottomNav from './components/BottomNav'
import SurgeReportPrompt from './components/SurgeReportPrompt'
import { useSurge } from './lib/useSurge'
import { buildNotifications } from './lib/realNotifications'
import { loadLocalAvatar, loadAvatarUrl, saveAvatarLocally, clearAvatar, uploadAvatarToSupabase } from './lib/avatarService'
import { checkUpgradeReturn, syncPlanFromSupabase } from './lib/proService'
import { loadCity } from './lib/cityService'
import { setStorageUser, removeLegacyKeys } from './lib/userStorage'
import { loadDriverProfile, saveDriverProfile } from './lib/driverProfile'

export default function App() {
  const [driver, setDriver] = useState(null)
  const [user, setUser]     = useState(null)     // the signed-in Supabase user
  const [booting, setBooting] = useState(true)   // true while we check for a saved login
  const [tab, setTab]       = useState('home')
  const [avatar, setAvatar] = useState(null)
  const [recoveryMode, setRecoveryMode] = useState(false)

  // Open this user's private drawer, then load their profile from the database
  const enterAs = async (authUser) => {
    setStorageUser(authUser.id)
    setUser(authUser)
    const profile = await loadDriverProfile(authUser)
    setDriver(profile)
    setAvatar(loadAvatarUrl() || profile.avatarUrl || loadLocalAvatar())
    const upgraded = await checkUpgradeReturn()
    if (upgraded) alert('🎉 Welcome to Co-Pilot Pro! All features are now unlocked.')
    else syncPlanFromSupabase()
  }

  const leave = () => {
    setStorageUser(null)
    setUser(null)
    setDriver(null)
    setAvatar(null)
    setTab('home')
  }

  useEffect(() => {
    removeLegacyKeys()
    // Recovery links contain type=recovery in the URL hash
    if (window.location.hash.includes('type=recovery')) setRecoveryMode(true)

    // 1. Was someone already signed in on this device? Keep them signed in.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) await enterAs(session.user)
      setBooting(false)
    })

    // 2. React to sign-out (any tab) and password recovery
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true)
      if (event === 'SIGNED_OUT') leave()
    })
    return () => sub?.subscription?.unsubscribe()
  }, [])

  // Apply saved theme on load (theme is a device setting, shared on purpose)
  useEffect(() => {
    const theme = localStorage.getItem('copilot_theme') || 'light'
    document.documentElement.setAttribute('data-theme', theme)
  }, [])

  // Use the driver's chosen city (and its map coordinates) instead of always Chicago
  const savedCity = driver ? loadCity() : null
  const surge = useSurge({
    driverId: driver?.id,
    city:     savedCity?.label || driver?.city || 'Chicago',
    lat:      savedCity?.lat ?? 41.8781,
    lng:      savedCity?.lng ?? -87.6298,
  })

  const [notifTick, setNotifTick] = useState(0)
  const unreadNotifs = driver ? buildNotifications(driver).filter(n => !n.read).length : 0
  void notifTick  // re-count after reading

  const handleAvatarChange = async (file, base64) => {
    setAvatar(base64)
    saveAvatarLocally(base64)
    if (driver?.id) {
      const url = await uploadAvatarToSupabase(file, driver.id)
      if (url) {
        setAvatar(url)
        saveDriverProfile(driver.id, { avatarUrl: url })
      }
    }
  }

  // Profile screen calls this to save name / city / goal / apps
  const handleDriverUpdate = async (changes) => {
    setDriver(prev => ({ ...prev, ...changes }))
    return saveDriverProfile(driver?.id, changes)
  }

  // AuthScreen calls this once the user is signed in (and finished setup)
  const handleAuth = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) await enterAs(authUser)
  }

  const handleSignOut = async () => {
    clearAvatar()
    await supabase.auth.signOut()   // ends the session for real
    leave()
  }

  // Public legal pages work for everyone, signed in or not
  const legalPage = LEGAL_PATHS[window.location.pathname]
  if (legalPage) return <LegalScreen page={legalPage} />

  if (recoveryMode) return <ResetPasswordScreen onDone={() => { setRecoveryMode(false); window.location.hash = ''; }} />

  if (booting) return <div style={{ minHeight:'100vh', background:'#111' }} />

  // Not signed in, or signed in but never finished picking apps + goal
  if (!driver || !driver.onboarded) {
    return <AuthScreen user={user} onAuth={handleAuth} onSaveSetup={handleDriverUpdate} />
  }

  const screens = {
    home:      <HomeScreen driver={driver} surge={surge} onTabChange={setTab} avatar={avatar} />,
    map:       <MapScreen surge={surge} driver={driver} />,
    ai:        <AIScreen driver={driver} />,
    shift:     <ShiftScreen driver={driver} />,
    evaluator: <OfferEvaluatorScreen driver={driver} onTabChange={setTab} />,
    planner:   <ShiftPlannerScreen driver={driver} />,
    board:     <LeaderboardScreen driver={driver} />,
    earnings:  <EarningsScreen driver={driver} />,
    taxes:     <TaxesScreen />,
    notifs:    <NotificationsScreen driver={driver} onTabChange={setTab} onRead={() => setNotifTick(t => t + 1)} />,
    privacy:   <PrivacyScreen driver={driver} onSignOut={handleSignOut} onBack={() => setTab('more')} />,
    vehicle:   <VehicleScreen onBack={() => setTab('more')} />,
    oracle:    <OracleScreen driver={driver} onBack={() => setTab('more')} />,
    more:      <ProfileScreen driver={driver} avatar={avatar} onAvatarChange={handleAvatarChange} onDriverUpdate={handleDriverUpdate} onSignOut={handleSignOut} onTabChange={setTab} />,
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
