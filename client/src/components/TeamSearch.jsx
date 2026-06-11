import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useFavorites } from '../hooks/useFavorites'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'

const LEAGUE_BADGE_COLORS = {
  nfl: '#f97316', nba: '#3b82f6', mlb: '#ef4444', nhl: '#60a5fa',
  soccer: '#22c55e', worldcup: '#eab308', ncaaf: '#a855f7', ncaab: '#f97316', ncaaw: '#ec4899',
}

export default function TeamSearch({ onClose, onAuthRequired }) {
  const { user } = useAuth()
  const { isFavorite, toggle } = useFavorites()
  const [query, setQuery] = useState('')
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    fetch(`${SERVER_URL}/api/teams`)
      .then((r) => r.json())
      .then(setTeams)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = query.trim().length < 1 ? [] : teams.filter((t) =>
    t.name.toLowerCase().includes(query.toLowerCase()) ||
    t.abbr.toLowerCase().includes(query.toLowerCase()) ||
    t.leagueLabel.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 20)

  function handleToggle(team) {
    if (!user) { onClose(); onAuthRequired(); return }
    toggle(team.id)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--muted)' }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search teams…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--fg)' }}
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-xs" style={{ color: 'var(--muted)' }}>✕</button>
          )}
        </div>

        {/* Results */}
        <div className="overflow-y-auto" style={{ maxHeight: '60vh' }}>
          {loading && (
            <p className="text-sm text-center py-8" style={{ color: 'var(--muted)' }}>Loading teams…</p>
          )}

          {!loading && query.trim().length < 1 && (
            <p className="text-sm text-center py-8" style={{ color: 'var(--muted)' }}>
              Type a team name, abbreviation, or league
            </p>
          )}

          {!loading && query.trim().length >= 1 && filtered.length === 0 && (
            <p className="text-sm text-center py-8" style={{ color: 'var(--muted)' }}>No teams found</p>
          )}

          {filtered.map((team) => {
            const fav = isFavorite(team.id)
            return (
              <div
                key={`${team.league}-${team.id}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:opacity-80"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                {team.logo
                  ? <img src={team.logo} alt={team.abbr} className="w-8 h-8 object-contain shrink-0" />
                  : <div className="w-8 h-8 rounded-full shrink-0" style={{ background: 'var(--surface-2)' }} />
                }
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--fg)' }}>{team.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--muted)' }}>{team.abbr}</span>
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                      style={{ background: `${LEAGUE_BADGE_COLORS[team.league]}22`, color: LEAGUE_BADGE_COLORS[team.league] }}
                    >
                      {team.leagueLabel}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle(team)}
                  className="text-xl shrink-0 transition-transform hover:scale-110"
                  style={{ color: fav ? 'var(--accent)' : 'var(--muted)' }}
                  title={fav ? 'Remove favorite' : 'Add to favorites'}
                >
                  {fav ? '★' : '☆'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
