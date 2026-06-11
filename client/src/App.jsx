import { useState, useCallback, useEffect } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'
import { FavoritesProvider } from './contexts/FavoritesContext'
import Nav from './components/Nav'
import SportTabs from './components/SportTabs'
import Scoreboard from './components/Scoreboard'
import Notifications from './components/Notifications'
import AuthModal from './components/AuthModal'
import LiveTicker from './components/LiveTicker'
import { SERVER_URL } from './config.js'
import TopPerformers from './components/TopPerformers'
import StandingsModal from './components/StandingsModal'
import PlayerModal from './components/PlayerModal'
import PlayerCompare from './components/PlayerCompare'
import DateNav, { todayStr } from './components/DateNav'

const LEAGUE_LABELS = {
  nfl: 'NFL', nba: 'NBA', mlb: 'MLB', nhl: 'NHL',
  soccer: 'Premier League', worldcup: 'World Cup',
  ncaaf: 'CFB', ncaab: 'NCAAB', ncaaw: 'NCAAW',
}

export default function App() {
  const [league, setLeague] = useState('nfl')
  const [events, setEvents] = useState([])
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showStandings, setShowStandings] = useState(false)
  const [showPlayerModal, setShowPlayerModal] = useState(false)
  const [showCompare, setShowCompare] = useState(false)
  const [standingsAvailable, setStandingsAvailable] = useState(false)
  const [date, setDate] = useState(todayStr)

  useEffect(() => {
    if (league === 'favorites') { setStandingsAvailable(false); return }
    setStandingsAvailable(false)
    fetch(`${SERVER_URL}/api/standings/${league}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setStandingsAvailable(Array.isArray(data) && data.length > 0))
      .catch(() => setStandingsAvailable(false))
  }, [league])

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
            <Nav onPlayerSearch={() => setShowPlayerModal(true)} onCompare={() => setShowCompare(true)} />
            <LiveTicker />

            <main className="max-w-6xl mx-auto px-4 py-4">
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <SportTabs active={league} onChange={(l) => { setLeague(l); setShowStandings(false) }} />
                </div>
                {standingsAvailable && (
                  <button
                    onClick={() => setShowStandings(true)}
                    className="text-xs px-3 py-2 rounded-lg shrink-0 font-semibold transition-colors"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--muted)',
                    }}
                    title="View standings"
                  >
                    📊
                    <span className="hidden sm:inline ml-1">Standings</span>
                  </button>
                )}
              </div>
              {league !== 'favorites' && (
                <div className="flex justify-center mt-2">
                  <DateNav date={date} onChange={setDate} />
                </div>
              )}

              <div className="mt-4">
                {league !== 'favorites' && <TopPerformers league={league} />}
                <Scoreboard
                  league={league}
                  date={date}
                  onAuthRequired={() => setShowAuthModal(true)}
                />
              </div>
            </main>

            <Notifications events={events} onDismiss={dismissEvent} />

            {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
            {showStandings && (
              <StandingsModal
                league={league}
                leagueLabel={LEAGUE_LABELS[league] || league.toUpperCase()}
                onClose={() => setShowStandings(false)}
              />
            )}
            {showPlayerModal && (
              <PlayerModal
                onClose={() => setShowPlayerModal(false)}
                initialLeague={league !== 'favorites' ? league : 'nba'}
              />
            )}
            {showCompare && <PlayerCompare onClose={() => setShowCompare(false)} />}
          </div>
        </SocketProvider>
      </FavoritesProvider>
    </AuthProvider>
  )
}
