import { useEffect, useState } from 'react'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'

function StatTable({ category }) {
  return (
    <div className="mb-5">
      <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--muted)' }}>
        {category.displayName}
      </p>
      <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 'max-content' }}>
          <thead>
            <tr style={{ background: 'var(--surface-2)' }}>
              <th
                className="text-left text-[11px] font-semibold px-3 py-2"
                style={{ color: 'var(--muted)', minWidth: '130px', position: 'sticky', left: 0, background: 'var(--surface-2)' }}
              >
                Player
              </th>
              {category.labels.map((label) => (
                <th
                  key={label}
                  className="text-center text-[11px] font-semibold px-2 py-2"
                  style={{ color: 'var(--muted)', minWidth: '36px', whiteSpace: 'nowrap' }}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {category.athletes.map((athlete, i) => (
              <tr
                key={i}
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <td
                  className="px-3 py-2"
                  style={{ position: 'sticky', left: 0, background: 'var(--surface)', minWidth: '130px' }}
                >
                  <div className="flex items-center gap-2">
                    {athlete.jersey && (
                      <span className="text-[10px] w-4 text-right shrink-0 tabular-nums" style={{ color: 'var(--muted)' }}>
                        {athlete.jersey}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold truncate" style={{ color: 'var(--fg)', maxWidth: '100px' }}>
                        {athlete.name}
                      </p>
                      {athlete.position && (
                        <p className="text-[10px]" style={{ color: 'var(--muted)' }}>{athlete.position}</p>
                      )}
                    </div>
                  </div>
                </td>
                {athlete.stats.map((stat, j) => (
                  <td
                    key={j}
                    className="text-center px-2 py-2 text-[12px] tabular-nums"
                    style={{ color: stat === '--' || stat === '' ? 'var(--muted)' : 'var(--fg)' }}
                  >
                    {stat || '–'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function BoxScore({ league, gameId, game }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [teamIdx, setTeamIdx] = useState(0)

  useEffect(() => {
    setLoading(true)
    setData(null)
    fetch(`${SERVER_URL}/api/games/${league}/${gameId}/boxscore`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [league, gameId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading box score…</p>
      </div>
    )
  }

  if (!data?.teams?.length) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          {game?.status === 'scheduled' ? 'Box score available once the game starts.' : 'No box score available.'}
        </p>
      </div>
    )
  }

  const team = data.teams[teamIdx]

  return (
    <div>
      {/* Team selector tabs */}
      <div
        className="flex mb-4 rounded-lg overflow-hidden"
        style={{ border: '1px solid var(--border)', background: 'var(--surface-2)' }}
      >
        {data.teams.map((t, i) => (
          <button
            key={t.teamId}
            onClick={() => setTeamIdx(i)}
            className="flex-1 py-2 text-xs font-bold transition-colors"
            style={{
              background: teamIdx === i ? 'var(--accent)' : 'transparent',
              color: teamIdx === i ? '#000' : 'var(--muted)',
            }}
          >
            {t.teamAbbr}
          </button>
        ))}
      </div>

      {/* Stat categories */}
      {team.categories.map((cat) => (
        <StatTable key={cat.name} category={cat} />
      ))}
    </div>
  )
}
