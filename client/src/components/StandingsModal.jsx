import { useEffect, useState } from 'react'
import { SERVER_URL } from '../config.js'

function StandingsGroup({ group }) {
  const usePts = group.entries[0]?.usePts
  const hasTies = group.entries.some((e) => e.ties != null)

  return (
    <section className="mb-1">
      <div
        className="px-4 py-2"
        style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
          {group.name}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs" style={{ borderCollapse: 'collapse', minWidth: '280px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>
              <th className="text-left px-4 py-1.5 font-semibold w-6">#</th>
              <th className="sticky-col text-left px-2 py-1.5 font-semibold" style={{ background: 'var(--surface)' }}>Team</th>
              <th className="text-center px-2 py-1.5 font-semibold">W</th>
              <th className="text-center px-2 py-1.5 font-semibold">L</th>
              {hasTies && (
                <th className="text-center px-2 py-1.5 font-semibold">{usePts ? 'OTL' : 'T'}</th>
              )}
              <th className="text-center px-2 py-1.5 font-semibold">{usePts ? 'PTS' : 'PCT'}</th>
              <th className="text-center px-2 py-1.5 font-semibold">GB</th>
            </tr>
          </thead>
          <tbody>
            {group.entries.map((e, i) => (
              <tr key={e.teamId} style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="px-4 py-2 tabular-nums" style={{ color: 'var(--muted)' }}>{i + 1}</td>
                <td className="sticky-col px-2 py-2" style={{ background: 'var(--surface)' }}>
                  <div className="flex items-center gap-2">
                    {e.logo && (
                      <img src={e.logo} alt={e.abbr} className="w-5 h-5 object-contain shrink-0" />
                    )}
                    <span className="truncate" style={{ color: 'var(--fg)' }}>{e.abbr}</span>
                  </div>
                </td>
                <td className="text-center px-2 py-2 tabular-nums" style={{ color: 'var(--fg)' }}>{e.wins}</td>
                <td className="text-center px-2 py-2 tabular-nums" style={{ color: 'var(--fg)' }}>{e.losses}</td>
                {hasTies && (
                  <td className="text-center px-2 py-2 tabular-nums" style={{ color: 'var(--fg)' }}>
                    {e.ties ?? '–'}
                  </td>
                )}
                <td className="text-center px-2 py-2 tabular-nums font-semibold" style={{ color: 'var(--fg)' }}>
                  {usePts ? (e.pts ?? '–') : (e.pct ?? '–')}
                </td>
                <td className="text-center px-2 py-2 tabular-nums" style={{ color: 'var(--muted)' }}>
                  {e.gb != null ? (e.gb === 0 ? '–' : e.gb) : '–'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default function StandingsModal({ league, leagueLabel, onClose }) {
  const [groups, setGroups] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`${SERVER_URL}/api/standings/${league}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setGroups)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [league])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}
        >
          <h2 className="text-base font-black" style={{ color: 'var(--fg)' }}>
            {leagueLabel} Standings
          </h2>
          <button
            onClick={onClose}
            className="text-lg opacity-60 hover:opacity-100"
            style={{ color: 'var(--fg)' }}
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading && (
            <p className="text-sm text-center py-12" style={{ color: 'var(--muted)' }}>Loading…</p>
          )}
          {!loading && !groups && (
            <p className="text-sm text-center py-12" style={{ color: 'var(--muted)' }}>
              No standings available.
            </p>
          )}
          {groups?.map((group, i) => (
            <StandingsGroup key={i} group={group} />
          ))}
        </div>
      </div>
    </div>
  )
}
