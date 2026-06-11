import { useState } from 'react'
import { useSocket } from '../contexts/SocketContext'
import { useFavorites } from '../hooks/useFavorites'
import GameCard from './GameCard'
import GameModal from './GameModal'

export default function Scoreboard({ league, showFavOnly, onAuthRequired }) {
  const { gamesByLeague } = useSocket()
  const { isFavorite } = useFavorites()
  const [selected, setSelected] = useState(null)

  const games = gamesByLeague[league] || []

  const visible = showFavOnly
    ? games.filter((g) => isFavorite(g.homeTeam.id) || isFavorite(g.awayTeam.id))
    : games

  if (!games.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-3xl">📡</p>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Waiting for game data…</p>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>Games will appear automatically when the season is active.</p>
      </div>
    )
  }

  if (showFavOnly && !visible.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-3xl">★</p>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>No favourite teams playing today.</p>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>Click the ☆ on any team card to add them.</p>
      </div>
    )
  }

  const live = visible.filter((g) => g.status === 'live')
  const scheduled = visible.filter((g) => g.status === 'scheduled')
  const final = visible.filter((g) => g.status === 'final')
  const ordered = [...live, ...scheduled, ...final]

  return (
    <>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {ordered.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            onClick={() => setSelected(game)}
            onAuthRequired={onAuthRequired}
          />
        ))}
      </div>

      {selected && <GameModal game={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
