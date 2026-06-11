import { useState, useCallback } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'
import { FavoritesProvider } from './contexts/FavoritesContext'
import Nav from './components/Nav'
import SportTabs from './components/SportTabs'
import Scoreboard from './components/Scoreboard'
import Notifications from './components/Notifications'
import AuthModal from './components/AuthModal'

export default function App() {
  const [league, setLeague] = useState('nfl')
  const [events, setEvents] = useState([])
  const [showAuthModal, setShowAuthModal] = useState(false)

  const handleKeyEvent = useCallback((event) => {
    const id = `${Date.now()}-${Math.random()}`
    setEvents((prev) => [...prev.slice(-4), { ...event, id }])
  }, [])

  function dismissEvent(id) {
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }

  return (
    <AuthProvider>
      <FavoritesProvider>
      <SocketProvider onKeyEvent={handleKeyEvent}>
        <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
          <Nav />

          <main className="max-w-6xl mx-auto px-4 py-4">
            <SportTabs active={league} onChange={setLeague} />
            <div className="mt-4">
              <Scoreboard
                league={league}
                onAuthRequired={() => setShowAuthModal(true)}
              />
            </div>
          </main>

          <Notifications events={events} onDismiss={dismissEvent} />

          {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
        </div>
      </SocketProvider>
      </FavoritesProvider>
    </AuthProvider>
  )
}
