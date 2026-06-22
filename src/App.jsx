import { useState } from 'react'
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
import BottomNav from './components/BottomNav'
import SurgeReportPrompt from './components/SurgeReportPrompt'
import { useSurge } from './lib/useSurge'
import { mockNotifications } from './lib/notifications'

export default function App() {
  const [driver, setDriver] = useState(null)
  const [tab, setTab]       = useState('home')

  const surge = useSurge({
    driverId: driver?.id,
    city:     driver?.city || 'Chicago',
    lat:      41.8781, lng: -87.6298,
  })

  const unreadNotifs = mockNotifications.filter(n => !n.read).length

  if (!driver) return <AuthScreen onAuth={setDriver} />

  const screens = {
    home:        <HomeScreen driver={driver} surge={surge} onTabChange={setTab} />,
    map:         <MapScreen surge={surge} driver={driver} />,
    ai:          <AIScreen driver={driver} />,
    planner:     <ShiftPlannerScreen driver={driver} />,
    board:       <LeaderboardScreen driver={driver} />,
    earnings:    <EarningsScreen driver={driver} />,
    taxes:       <TaxesScreen />,
    notifs:      <NotificationsScreen />,
    profile:     <ProfileScreen driver={driver} onSignOut={() => setDriver(null)} onTabChange={setTab} />,
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
