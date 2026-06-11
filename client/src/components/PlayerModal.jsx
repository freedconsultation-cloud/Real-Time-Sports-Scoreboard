import { useEffect, useRef, useState } from 'react'
import { SERVER_URL } from '../config.js'

const LEAGUE_OPTIONS = [
  { key: 'nba', label: 'NBA' },
  { key: 'nfl', label: 'NFL' },
  { key: 'mlb', label: 'MLB' },
  { key: 'nhl', label: 'NHL' },
  { key: 'ncaab', label: 'NCAAB' },
  { key: 'ncaaf', label: 'CFB' },
]

function PlayerProfile({ player }) {
  return (
    <div>
      <div
        className="flex items-center gap-4 px-5 py-4"
        style={{
          borderBottom: '1px solid var(--border)',
          background: player.teamColor ? `${player.teamColor}18` : 'var(--surface-2)',
        }}
      >
        {player.headshot ? (
          <img
            src={player.headshot}
            alt={player.name}
            className="w-16 h-16 rounded-full object-cover shrink-0"
          />
        ) : player.logo ? (
          <img src={player.logo} alt={player.teamAbbr} className="w-12 h-12 object-contain shrink-0" />
        ) : null}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="text-base font-black" style={{ color: 'var(--fg)' }}>{player.name}</h3>
            {player.jersey && (
              <span className="text-sm font-bold" style={{ color: 'var(--muted)' }}>#{player.jersey}</span>
            )}
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            {[player.position, player.team].filter(Boolean).join(' · ')}
          </p>
          <div className="flex gap-3 mt-1.5 flex-wrap">
            {player.height && <span className="text-xs" style={{ color: 'var(--muted)' }}>{player.height}</span>}
            {player.weight && <span className="text-xs" style={{ color: 'var(--muted)' }}>{player.weight}</span>}
            {player.age && <span className="text-xs" style={{ color: 'var(--muted)' }}>Age {player.age}</span>}
            {player.experience && (
              <span className="text-xs" style={{ color: 'var(--muted)' }}>{player.experience}</span>
            )}
          </div>
        </div>
      </div>

      {player.categories.length > 0 ? (
        <div className="p-4 space-y-5">
          {player.categories.map((cat) => (
            <div key={cat.name}>
              <p
                className="text-[10px] font-bold uppercase tracking-widest mb-2"
                style={{ color: 'var(--muted)' }}
              >
                {cat.name}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {cat.stats.slice(0, 12).map((s) => (
                  <div
                    key={s.label}
                    className="rounded-lg p-2.5 text-center"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                  >
                    <p className="text-base font-black tabular-nums" style={{ color: 'var(--fg)' }}>
                      {s.value}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-center py-12" style={{ color: 'var(--muted)' }}>
          No season stats available.
        </p>
      )}
    </div>
  )
}

export default function PlayerModal({ onClose, initialLeague }) {
  const [league, setLeague] = useState(initialLeague || 'nba')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [player, setPlayer] = useState(null)
  const [loadingPlayer, setLoadingPlayer] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (query.length < 3) { setResults([]); return }
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setSearching(true)
      fetch(`${SERVER_URL}/api/players/search?q=${encodeURIComponent(query)}&league=${league}`)
        .then((r) => (r.ok ? r.json() : []))
        .then(setResults)
        .catch(() => {})
        .finally(() => setSearching(false))
    }, 400)
    return () => clearTimeout(timerRef.current)
  }, [query, league])

  function selectPlayer(p) {
    setLoadingPlayer(true)
    setPlayer(null)
    // Use the player's own league (from search result), not the tab selection
    const playerLeague = p.league || league
    fetch(`${SERVER_URL}/api/players/${playerLeague}/${p.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((profile) => {
        // Merge: search result has team name; profile has bio/stats
        setPlayer(profile ? { team: p.team, leagueLabel: p.leagueLabel, ...profile } : p)
      })
      .catch(() => setPlayer(p))
      .finally(() => setLoadingPlayer(false))
  }

  function back() {
    setPlayer(null)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:px-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2">
            {player && (
              <button
                onClick={back}
                className="text-sm opacity-60 hover:opacity-100 mr-1"
                style={{ color: 'var(--fg)' }}
              >
                ←
              </button>
            )}
            <h2 className="text-base font-black" style={{ color: 'var(--fg)' }}>
              {player ? player.name : 'Player Stats'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-lg opacity-60 hover:opacity-100"
            style={{ color: 'var(--fg)' }}
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingPlayer && (
            <p className="text-xs text-center py-12" style={{ color: 'var(--muted)' }}>
              Loading player stats…
            </p>
          )}

          {!loadingPlayer && player && <PlayerProfile player={player} />}

          {!loadingPlayer && !player && (
            <div className="p-4">
              <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-hide pb-1">
                {LEAGUE_OPTIONS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => { setLeague(key); setQuery(''); setResults([]) }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-colors"
                    style={{
                      background: league === key ? 'var(--accent)' : 'var(--surface-2)',
                      color: league === key ? '#000' : 'var(--muted)',
                      border: `1px solid ${league === key ? 'var(--accent)' : 'var(--border)'}`,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search player name…"
                autoFocus
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--fg)',
                }}
              />

              <div className="mt-3 space-y-1.5">
                {searching && (
                  <p className="text-xs text-center py-4" style={{ color: 'var(--muted)' }}>Searching…</p>
                )}
                {!searching && query.length >= 3 && !results.length && (
                  <p className="text-xs text-center py-4" style={{ color: 'var(--muted)' }}>No players found.</p>
                )}
                {results.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => selectPlayer(p)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:opacity-80 transition-opacity"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                  >
                    {p.logo ? (
                      <img src={p.logo} alt={p.teamAbbr} className="w-8 h-8 object-contain shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full shrink-0" style={{ background: 'var(--surface)' }} />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--fg)' }}>
                        {p.name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>
                        {[p.position, p.team].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    {p.jersey && (
                      <span className="text-xs font-bold shrink-0" style={{ color: 'var(--muted)' }}>
                        #{p.jersey}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
