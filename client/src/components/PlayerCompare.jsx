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

function PlayerSearch({ slot, league, onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
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

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
        Player {slot}
      </p>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search name…"
        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--fg)' }}
      />
      {searching && <p className="text-xs text-center" style={{ color: 'var(--muted)' }}>Searching…</p>}
      {results.map((p) => (
        <button
          key={p.id}
          onClick={() => { onSelect(p); setQuery(''); setResults([]) }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-left"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
        >
          {p.logo
            ? <img src={p.logo} alt="" className="w-6 h-6 object-contain shrink-0" />
            : <div className="w-6 h-6 rounded-full shrink-0" style={{ background: 'var(--surface)' }} />
          }
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--fg)' }}>{p.name}</p>
            <p className="text-[11px]" style={{ color: 'var(--muted)' }}>{[p.position, p.team].filter(Boolean).join(' · ')}</p>
          </div>
        </button>
      ))}
    </div>
  )
}

function StatBar({ label, v1, v2 }) {
  const n1 = parseFloat(v1) || 0
  const n2 = parseFloat(v2) || 0
  const max = Math.max(n1, n2, 0.01)
  const w1 = Math.round((n1 / max) * 100)
  const w2 = Math.round((n2 / max) * 100)
  const p1Wins = n1 > n2
  const p2Wins = n2 > n1

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-0.5">
        <span className={`text-xs font-black tabular-nums ${p1Wins ? '' : 'opacity-50'}`} style={{ color: 'var(--accent)' }}>{v1}</span>
        <span className="text-[10px]" style={{ color: 'var(--muted)' }}>{label}</span>
        <span className={`text-xs font-black tabular-nums ${p2Wins ? '' : 'opacity-50'}`} style={{ color: 'var(--green)' }}>{v2}</span>
      </div>
      <div className="flex items-center gap-1 h-1.5">
        <div className="flex-1 flex justify-end">
          <div className="h-full rounded-l-full" style={{ width: `${w1}%`, background: 'var(--accent)' }} />
        </div>
        <div className="flex-1">
          <div className="h-full rounded-r-full" style={{ width: `${w2}%`, background: 'var(--green)' }} />
        </div>
      </div>
    </div>
  )
}

export default function PlayerCompare({ onClose }) {
  const [league, setLeague] = useState('nba')
  const [p1, setP1] = useState(null)
  const [p2, setP2] = useState(null)
  const [loading1, setLoading1] = useState(false)
  const [loading2, setLoading2] = useState(false)

  function loadPlayer(p, setLoading, setPlayer) {
    setLoading(true)
    const playerLeague = p.league || league
    fetch(`${SERVER_URL}/api/players/${playerLeague}/${p.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((profile) => setPlayer(profile ? { team: p.team, leagueLabel: p.leagueLabel, ...profile } : p))
      .catch(() => setPlayer(p))
      .finally(() => setLoading(false))
  }

  // Build shared category list for comparison
  const sharedCategories = (() => {
    if (!p1 || !p2) return []
    const cats1 = Object.fromEntries((p1.categories || []).map((c) => [c.name, c]))
    const cats2 = Object.fromEntries((p2.categories || []).map((c) => [c.name, c]))
    const allCats = [...new Set([...Object.keys(cats1), ...Object.keys(cats2)])]
    return allCats.map((catName) => {
      const c1 = cats1[catName]
      const c2 = cats2[catName]
      const labels = [...new Set([...(c1?.stats || []).map((s) => s.label), ...(c2?.stats || []).map((s) => s.label)])]
      const stats1 = Object.fromEntries((c1?.stats || []).map((s) => [s.label, s.value]))
      const stats2 = Object.fromEntries((c2?.stats || []).map((s) => [s.label, s.value]))
      return {
        name: catName,
        rows: labels.map((label) => ({ label, v1: stats1[label] || '–', v2: stats2[label] || '–' })),
      }
    }).filter((c) => c.rows.length > 0)
  })()

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:px-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-base font-black" style={{ color: 'var(--fg)' }}>Compare Players</h2>
          <button onClick={onClose} className="text-lg opacity-60 hover:opacity-100" style={{ color: 'var(--fg)' }}>✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* League selector */}
          <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-hide pb-1">
            {LEAGUE_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setLeague(key); setP1(null); setP2(null) }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0"
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

          {/* Player headers (shown once selected) */}
          {(p1 || p2) && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[{ player: p1, loading: loading1, color: 'var(--accent)', slot: 1, clear: () => setP1(null) },
                { player: p2, loading: loading2, color: 'var(--green)', slot: 2, clear: () => setP2(null) }].map(({ player, loading, color, slot, clear }) => (
                <div key={slot} className="rounded-xl p-3 text-center relative" style={{ background: 'var(--surface-2)', border: `1px solid ${color}44` }}>
                  {player && (
                    <button onClick={clear} className="absolute top-2 right-2 text-xs opacity-50 hover:opacity-100" style={{ color: 'var(--fg)' }}>✕</button>
                  )}
                  {loading && <p className="text-xs" style={{ color: 'var(--muted)' }}>Loading…</p>}
                  {!loading && player && (
                    <>
                      {player.headshot
                        ? <img src={player.headshot} alt={player.name} className="w-12 h-12 rounded-full object-cover mx-auto mb-1" />
                        : <div className="w-12 h-12 rounded-full mx-auto mb-1" style={{ background: 'var(--surface)' }} />
                      }
                      <p className="text-xs font-bold truncate" style={{ color: 'var(--fg)' }}>{player.name}</p>
                      <p className="text-[10px]" style={{ color }}>{player.team || player.leagueLabel}</p>
                    </>
                  )}
                  {!loading && !player && (
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>Player {slot}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Search slots */}
          {(!p1 || !p2) && (
            <div className={`grid gap-4 mb-4 ${!p1 && !p2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
              {!p1 && <PlayerSearch slot={1} league={league} onSelect={(p) => loadPlayer(p, setLoading1, setP1)} />}
              {!p2 && <PlayerSearch slot={2} league={league} onSelect={(p) => loadPlayer(p, setLoading2, setP2)} />}
            </div>
          )}

          {/* Stat comparison */}
          {p1 && p2 && sharedCategories.length > 0 && (
            <div className="space-y-4">
              {sharedCategories.map((cat) => (
                <div key={cat.name} className="rounded-xl p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--muted)' }}>{cat.name}</p>
                  {cat.rows.map((row) => (
                    <StatBar key={row.label} label={row.label} v1={row.v1} v2={row.v2} />
                  ))}
                </div>
              ))}
            </div>
          )}

          {p1 && p2 && !sharedCategories.length && (
            <p className="text-sm text-center py-8" style={{ color: 'var(--muted)' }}>No comparable stats available.</p>
          )}
        </div>
      </div>
    </div>
  )
}
