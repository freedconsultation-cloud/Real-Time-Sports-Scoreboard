import { useState, useEffect } from 'react'
import { useSocket } from '../contexts/SocketContext'
import { useFavorites } from '../contexts/FavoritesContext'
import { useAuth } from '../contexts/AuthContext'
import GameCard from './GameCard'
import GameModal from './GameModal'

const ALL_LEAGUES = ['nfl', 'nba', 'mlb', 'nhl', 'soccer', 'worldcup', 'ncaaf', 'ncaab', 'ncaaw']

function dateLabel(dateStr) {
  const d = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
}

function groupByDate(games) {
  // Live games always float to the top as their own group
  const live = games.filter((g) => g.status === 'live')
  const rest = games.filter((g) => g.status !== 'live')

  const groups = {}
  for (const game of rest) {
    const key = new Date(game.startTime).toDateString()
    if (!groups[key]) groups[key] = { label: dateLabel(game.startTime), date: new Date(game.startTime), games: [] }
    groups[key].games.push(game)
  }

  // Sort each group: final first, then scheduled
  for (const g of Object.values(groups)) {
    g.games.sort((a, b) => {
      if (a.status === b.status) return new Date(a.startTime) - new Date(b.startTime)
      if (a.status === 'final') return -1
      return 1
    })
  }

  const sorted = Object.values(groups).sort((a, b) => a.date - b.date)
  return { live, dateGroups: sorted }
}

function GameGrid({ games, onSelect, onAuthRequired, keyPrefix = '' }) {
  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {games.map((game) => (
        <GameCard
          key={`${keyPrefix}${game.league}-${game.id}`}
          game={game}
          onClick={() => onSelect(game)}
          onAuthRequired={onAuthRequired}
        />
      ))}
    </div>
  )
}

function DateSection({ label, games, onSelect, onAuthRequired }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <h3 className="text-xs font-bold uppercase tracking-widest shrink-0" style={{ color: 'var(--muted)' }}>
          {label}
        </h3>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      </div>
      <GameGrid games={games} onSelect={onSelect} onAuthRequired={onAuthRequired} />
    </div>
  )
}

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
          <p className="text-sm" style={{ color: 'var(--muted)' }}>No upcoming games for your favorite teams.</p>
        </div>
      )
    }

    const { live, dateGroups } = groupByDate(favGames)
    return (
      <>
        <div className="space-y-8">
          {live.length > 0 && (
            <DateSection label="Live Now" games={live} onSelect={setSelected} onAuthRequired={onAuthRequired} />
          )}
          {dateGroups.map(({ label, games }) => (
            <DateSection key={label} label={label} games={games} onSelect={setSelected} onAuthRequired={onAuthRequired} />
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

  const { live, dateGroups } = groupByDate(games)
  return (
    <>
      <div className="space-y-8">
        {live.length > 0 && (
          <DateSection label="Live Now" games={live} onSelect={setSelected} onAuthRequired={onAuthRequired} />
        )}
        {dateGroups.map(({ label, games }) => (
          <DateSection key={label} label={label} games={games} onSelect={setSelected} onAuthRequired={onAuthRequired} />
        ))}
      </div>
      {selected && <GameModal game={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
