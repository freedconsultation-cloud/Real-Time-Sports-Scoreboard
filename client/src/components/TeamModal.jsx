import { useEffect, useState } from 'react'

import { SERVER_URL } from '../config.js'

function formatDate(dateStr) {
  const d = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function GameRow({ game, isUpcoming }) {
  const resultColor = game.winner ? 'var(--green)' : 'var(--red, #ef4444)'
  const resultLabel = game.winner ? 'W' : 'L'

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      {/* Opponent logo */}
      {game.opponent.logo
        ? <img src={game.opponent.logo} alt={game.opponent.abbr} className="w-7 h-7 object-contain shrink-0" />
        : <div className="w-7 h-7 rounded-full shrink-0" style={{ background: 'var(--surface-2)' }} />
      }

      {/* At/vs + opponent */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--fg)' }}>
          <span className="font-normal text-xs mr-1" style={{ color: 'var(--muted)' }}>
            {game.isHome ? 'vs' : '@'}
          </span>
          {game.opponent.name}
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>
          {formatDate(game.date)}
          {isUpcoming && game.broadcasts?.length > 0 && (
            <span className="ml-2 font-bold">{game.broadcasts[0]}</span>
          )}
        </p>
      </div>

      {/* Result or upcoming indicator */}
      {isUpcoming ? (
        <span className="text-[11px] font-semibold shrink-0" style={{ color: 'var(--muted)' }}>–</span>
      ) : (
        <div className="text-right shrink-0">
          <span className="text-sm font-black" style={{ color: resultColor }}>{resultLabel}</span>
          <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
            {game.score}–{game.oppScore}
          </p>
        </div>
      )}
    </div>
  )
}

function SectionHeader({ label }) {
  return (
    <div className="px-4 py-2.5 sticky top-0 z-10" style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>{label}</p>
    </div>
  )
}

function StandingsTable({ standings, activeTeamId }) {
  if (!standings) return null
  const { groupName, entries } = standings
  const usePts = entries[0]?.usePts

  return (
    <section>
      <SectionHeader label={groupName || 'Standings'} />
      <div className="overflow-x-auto">
      <table className="w-full text-xs" style={{ borderCollapse: 'collapse', minWidth: '300px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>
            <th className="text-left px-4 py-1.5 font-semibold w-8">#</th>
            <th className="sticky-col text-left px-2 py-1.5 font-semibold" style={{ background: 'var(--surface)' }}>Team</th>
            <th className="text-center px-2 py-1.5 font-semibold">W</th>
            <th className="text-center px-2 py-1.5 font-semibold">L</th>
            {entries.some((e) => e.ties != null) && (
              <th className="text-center px-2 py-1.5 font-semibold">
                {usePts ? 'OTL' : 'T'}
              </th>
            )}
            <th className="text-center px-2 py-1.5 font-semibold">
              {usePts ? 'PTS' : 'PCT'}
            </th>
            <th className="text-center px-2 py-1.5 font-semibold">GB</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => {
            const isActive = String(e.teamId) === String(activeTeamId)
            return (
              <tr
                key={e.teamId}
                style={{
                  borderBottom: '1px solid var(--border)',
                  background: isActive ? 'var(--accent)18' : 'transparent',
                  fontWeight: isActive ? 700 : 400,
                }}
              >
                <td className="px-4 py-2 tabular-nums" style={{ color: 'var(--muted)' }}>{i + 1}</td>
                <td className="sticky-col px-2 py-2" style={{ background: isActive ? 'var(--surface)' : 'var(--surface)' }}>
                  <div className="flex items-center gap-2">
                    {e.logo && <img src={e.logo} alt={e.abbr} className="w-5 h-5 object-contain shrink-0" />}
                    <span className="truncate" style={{ color: isActive ? 'var(--accent)' : 'var(--fg)' }}>
                      {e.abbr}
                    </span>
                  </div>
                </td>
                <td className="text-center px-2 py-2 tabular-nums" style={{ color: 'var(--fg)' }}>{e.wins}</td>
                <td className="text-center px-2 py-2 tabular-nums" style={{ color: 'var(--fg)' }}>{e.losses}</td>
                {entries.some((x) => x.ties != null) && (
                  <td className="text-center px-2 py-2 tabular-nums" style={{ color: 'var(--fg)' }}>
                    {e.ties ?? '–'}
                  </td>
                )}
                <td className="text-center px-2 py-2 tabular-nums" style={{ color: 'var(--fg)' }}>
                  {usePts ? (e.pts ?? '–') : (e.pct ?? '–')}
                </td>
                <td className="text-center px-2 py-2 tabular-nums" style={{ color: 'var(--muted)' }}>
                  {e.gb != null ? (e.gb === 0 ? '–' : e.gb) : '–'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      </div>
    </section>
  )
}

export default function TeamModal({ league, teamId, teamName, onClose }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`${SERVER_URL}/api/team/${league}/${teamId}`)
      .then((r) => { if (!r.ok) throw new Error('Failed to load'); return r.json() })
      .then(setProfile)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [league, teamId])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center gap-4 px-5 py-4 shrink-0"
          style={{
            background: profile?.color ? `${profile.color}22` : 'var(--surface-2)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          {profile?.logo && (
            <img src={profile.logo} alt={profile.abbr} className="w-14 h-14 object-contain" />
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-black truncate" style={{ color: 'var(--fg)' }}>
              {profile?.name || teamName}
            </h2>
            {profile && (
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>
                  {profile.record} overall
                </span>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--surface)', color: 'var(--fg)', border: '1px solid var(--border)' }}
                >
                  L10: {profile.last10}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-lg shrink-0 opacity-60 hover:opacity-100"
            style={{ color: 'var(--fg)' }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {loading && (
            <p className="text-sm text-center py-12" style={{ color: 'var(--muted)' }}>Loading…</p>
          )}
          {error && (
            <p className="text-sm text-center py-12" style={{ color: '#ef4444' }}>Could not load team data.</p>
          )}

          {profile && (
            <>
              {/* Standings */}
              {profile.standings && (
                <StandingsTable standings={profile.standings} activeTeamId={teamId} />
              )}

              {/* Upcoming games */}
              {profile.upcomingGames.length > 0 && (
                <section>
                  <SectionHeader label="Upcoming" />
                  {profile.upcomingGames.map((g) => (
                    <GameRow key={g.id} game={g} isUpcoming />
                  ))}
                </section>
              )}

              {/* Recent results */}
              {profile.pastGames.length > 0 && (
                <section>
                  <SectionHeader label="Recent Results" />
                  {profile.pastGames.map((g) => (
                    <GameRow key={g.id} game={g} isUpcoming={false} />
                  ))}
                </section>
              )}

              {profile.upcomingGames.length === 0 && profile.pastGames.length === 0 && !profile.standings && (
                <p className="text-sm text-center py-12" style={{ color: 'var(--muted)' }}>No schedule data available.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
