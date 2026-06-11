import { useState, useEffect } from 'react'
import { useSocket } from '../contexts/SocketContext'
import { useFavorites } from '../contexts/FavoritesContext'
import { useAuth } from '../contexts/AuthContext'
import GameCard from './GameCard'
import GameModal from './GameModal'

const ALL_LEAGUES = ['nfl', 'nba', 'mlb', 'nhl', 'soccer', 'worldcup', 'ncaaf', 'ncaab', 'ncaaw']

export default function Scoreboard({ league, onAuthRequired }) {
  const { gamesByLeague, subscribe, unsubscribe } = useSocket()
  const { isFavorite, favorites } = useFavorites()
  const { user } = useAuth()
  const [selected, setSelected] = useState(null)

  const isFavTab = league === 'favorites'

  useEffect(() => {
    if (isFavTab) {
      ALL_LEAGUES.forEach(subscribe)
      return () => ALL_LEAGUES.forEach(unsubscribe)
    }
    subscribe(league)
    return () => unsubscribe(league)
  }, [league])

  // Favorites tab: gather games across all leagues
  if (isFavTab) {
    if (!user) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-3xl">★</p>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Sign in to see your favorite teams' games.</p>
          <button
            onClick={onAuthRequired}
            className="text-sm px-4 py-2 rounded-lg font-semibold mt-1"
            style={{ background: 'var(--accent)', color: '#000' }}
          >
            Sign in
          </button>
        </div>
      )
    }

    if (!favorites.length) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-3xl">☆</p>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>No favorite teams yet.</p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Use the 🔍 search to find and star teams.</p>
        </div>
      )
    }

    const favGames = ALL_LEAGUES.flatMap((l) =>
      (gamesByLeague[l] || []).filter((g) => isFavorite(g.homeTeam.id) || isFavorite(g.awayTeam.id))
    )

    if (!favGames.length) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-3xl">📅</p>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>No games scheduled for your favorite teams today.</p>
        </div>
      )
    }

    const live = favGames.filter((g) => g.status === 'live')
    const scheduled = favGames.filter((g) => g.status === 'scheduled')
    const final = favGames.filter((g) => g.status === 'final')

    return (
      <>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[...live, ...scheduled, ...final].map((game) => (
            <GameCard key={`${game.league}-${game.id}`} game={game} onClick={() => setSelected(game)} onAuthRequired={onAuthRequired} />
          ))}
        </div>
        {selected && <GameModal game={selected} onClose={() => setSelected(null)} />}
      </>
    )
  }

  // Regular league tab
  const games = gamesByLeague[league] || []

  if (!games.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-3xl">📡</p>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Waiting for game data…</p>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>Games will appear automatically when the season is active.</p>
      </div>
    )
  }

  const live = games.filter((g) => g.status === 'live')
  const scheduled = games.filter((g) => g.status === 'scheduled')
  const final = games.filter((g) => g.status === 'final')

  return (
    <>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {[...live, ...scheduled, ...final].map((game) => (
          <GameCard key={game.id} game={game} onClick={() => setSelected(game)} onAuthRequired={onAuthRequired} />
        ))}
      </div>
      {selected && <GameModal game={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
