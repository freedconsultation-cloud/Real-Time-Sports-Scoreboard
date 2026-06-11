import { useEffect, useState } from 'react'
import Commentary from './Commentary'
import StatsPanel from './StatsPanel'
import HistoryChart from './HistoryChart'
import BoxScore from './BoxScore'

import { SERVER_URL } from '../config.js'
const TABS = ['Score', 'Box Score', 'H2H', 'Commentary', 'Stats']

const LEAGUE_SPORT = {
  nfl: 'football', ncaaf: 'football',
  nba: 'basketball', ncaab: 'basketball', ncaaw: 'basketball',
  mlb: 'baseball',
  nhl: 'hockey',
  soccer: 'soccer', worldcup: 'soccer',
}

function getPeriodHeaders(sport, count) {
  if (sport === 'football' || sport === 'basketball') {
    return Array.from({ length: count }, (_, i) => i < 4 ? `Q${i + 1}` : `OT${i > 4 ? i - 3 : ''}`)
  }
  if (sport === 'hockey') {
    return Array.from({ length: count }, (_, i) => i < 3 ? `P${i + 1}` : 'OT')
  }
  if (sport === 'baseball') {
    return Array.from({ length: count }, (_, i) => `${i + 1}`)
  }
  if (sport === 'soccer') {
    return Array.from({ length: count }, (_, i) => i === 0 ? '1H' : i === 1 ? '2H' : `ET${i - 1}`)
  }
  return Array.from({ length: count }, (_, i) => `${i + 1}`)
}

function WinProbBar({ winProb, awayTeam, homeTeam }) {
  if (!winProb) return null
  const { homeWinPct, awayWinPct } = winProb
  return (
    <div className="mb-4 p-3 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
      <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: 'var(--muted)' }}>
        Win Probability
      </p>
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold w-8 text-right tabular-nums" style={{ color: 'var(--fg)' }}>
          {awayWinPct}%
        </span>
        <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <div
            className="h-full rounded-l-full transition-all duration-700"
            style={{
              width: `${awayWinPct}%`,
              background: awayTeam.color || 'var(--accent)',
            }}
          />
        </div>
        <span className="text-xs font-bold w-8 text-left tabular-nums" style={{ color: 'var(--fg)' }}>
          {homeWinPct}%
        </span>
      </div>
      <div className="flex items-center justify-between mt-1 px-10">
        <span className="text-[10px]" style={{ color: 'var(--muted)' }}>{awayTeam.abbr}</span>
        <span className="text-[10px]" style={{ color: 'var(--muted)' }}>{homeTeam.abbr}</span>
      </div>
    </div>
  )
}

function LinescoreTable({ game }) {
  const sport = LEAGUE_SPORT[game.league] || 'generic'
  const homeLS = game.homeTeam.linescores || []
  const awayLS = game.awayTeam.linescores || []
  const count = Math.max(homeLS.length, awayLS.length)
  if (count === 0) return null

  const headers = getPeriodHeaders(sport, count)

  return (
    <div className="overflow-x-auto mb-4 rounded-lg" style={{ border: '1px solid var(--border)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 'max-content' }}>
        <thead>
          <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
            <th className="text-left text-[11px] font-semibold px-3 py-2 w-12" style={{ color: 'var(--muted)' }}> </th>
            {headers.map((h) => (
              <th key={h} className="text-center text-[11px] font-semibold px-2 py-2 w-8" style={{ color: 'var(--muted)' }}>{h}</th>
            ))}
            <th className="text-center text-[11px] font-bold px-3 py-2" style={{ color: 'var(--fg)' }}>T</th>
          </tr>
        </thead>
        <tbody>
          {[
            { team: game.awayTeam, ls: awayLS },
            { team: game.homeTeam, ls: homeLS },
          ].map(({ team, ls }) => (
            <tr key={team.abbr} style={{ borderTop: '1px solid var(--border)' }}>
              <td className="px-3 py-2 text-[12px] font-bold" style={{ color: 'var(--fg)' }}>{team.abbr}</td>
              {headers.map((_, i) => (
                <td key={i} className="text-center px-2 py-2 text-[12px] tabular-nums" style={{ color: 'var(--muted)' }}>
                  {ls[i] != null ? ls[i] : '–'}
                </td>
              ))}
              <td className="text-center px-3 py-2 text-[13px] font-black tabular-nums" style={{ color: 'var(--fg)' }}>
                {team.score}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function GameModal({ game, onClose }) {
  const [tab, setTab] = useState('Score')
  const [commentary, setCommentary] = useState([])
  const [winProb, setWinProb] = useState(null)
  const [h2h, setH2h] = useState([])
  const [h2hLoading, setH2hLoading] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    if (tab !== 'Commentary' || !game) return
    fetch(`${SERVER_URL}/api/games/${game.league}/${game.id}/commentary`)
      .then((r) => r.json())
      .then(setCommentary)
      .catch(() => {})
  }, [tab, game?.id])

  useEffect(() => {
    if (tab !== 'Score' || !game || game.status === 'scheduled') return
    fetch(`${SERVER_URL}/api/games/${game.league}/${game.id}/winprob`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setWinProb)
      .catch(() => {})
  }, [tab, game?.id])

  useEffect(() => {
    if (tab !== 'H2H' || !game) return
    setH2hLoading(true)
    fetch(`${SERVER_URL}/api/h2h/${game.league}/${game.homeTeam.id}/${game.awayTeam.id}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setH2h)
      .catch(() => {})
      .finally(() => setH2hLoading(false))
  }, [tab, game?.id])

  if (!game) return null

  const isLive = game.status === 'live'
  const isFinal = game.status === 'final'
  const homeWins = isFinal && game.homeTeam.score > game.awayTeam.score
  const awayWins = isFinal && game.awayTeam.score > game.homeTeam.score

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 shrink-0" style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: isLive ? 'var(--green)' : 'var(--muted)' }}>
              {isLive && <span className="live-dot" />}
              {isLive ? `${game.periodLabel} ${game.clock}` : isFinal ? 'Final' : (() => {
                const d = new Date(game.startTime)
                const isToday = d.toDateString() === new Date().toDateString()
                return isToday
                  ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                  : d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' · ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
              })()}
            </span>
            {game.broadcasts?.length > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg)' }}>
                {game.broadcasts[0]}
              </span>
            )}
            <button onClick={onClose} className="text-sm" style={{ color: 'var(--muted)' }}>✕</button>
          </div>

          <div className="flex items-center justify-between gap-4">
            {/* Away */}
            <div className="flex-1 flex flex-col items-center gap-1">
              {game.awayTeam.logo && (
                <img src={game.awayTeam.logo} alt={game.awayTeam.abbr} className="w-12 h-12 object-contain" />
              )}
              <p className="text-sm font-bold" style={{ color: 'var(--fg)' }}>{game.awayTeam.abbr}</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>{game.awayTeam.record}</p>
            </div>

            {/* Score */}
            <div className="text-center shrink-0">
              <div className="flex items-center gap-3">
                <span className={`text-4xl font-black tabular-nums ${awayWins ? '' : 'opacity-50'}`} style={{ color: 'var(--fg)' }}>
                  {game.awayTeam.score}
                </span>
                <span className="text-lg" style={{ color: 'var(--muted)' }}>–</span>
                <span className={`text-4xl font-black tabular-nums ${homeWins ? '' : 'opacity-50'}`} style={{ color: 'var(--fg)' }}>
                  {game.homeTeam.score}
                </span>
              </div>
              {game.venue && (
                <p className="text-[10px] mt-1" style={{ color: 'var(--muted)' }}>{game.venue}</p>
              )}
            </div>

            {/* Home */}
            <div className="flex-1 flex flex-col items-center gap-1">
              {game.homeTeam.logo && (
                <img src={game.homeTeam.logo} alt={game.homeTeam.abbr} className="w-12 h-12 object-contain" />
              )}
              <p className="text-sm font-bold" style={{ color: 'var(--fg)' }}>{game.homeTeam.abbr}</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>{game.homeTeam.record}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2.5 text-xs font-semibold relative"
              style={{ color: tab === t ? 'var(--accent)' : 'var(--muted)' }}
            >
              {t}
              {tab === t && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full" style={{ background: 'var(--accent)' }} />
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto flex-1">
          {tab === 'Score' && (
            <>
              <WinProbBar winProb={winProb} awayTeam={game.awayTeam} homeTeam={game.homeTeam} />
              <LinescoreTable game={game} />
              <HistoryChart game={game} />
            </>
          )}
          {tab === 'Box Score' && (
            <BoxScore league={game.league} gameId={game.id} game={game} />
          )}
          {tab === 'H2H' && (
            <div>
              {h2hLoading && (
                <p className="text-sm text-center py-12" style={{ color: 'var(--muted)' }}>Loading…</p>
              )}
              {!h2hLoading && !h2h.length && (
                <p className="text-sm text-center py-12" style={{ color: 'var(--muted)' }}>
                  No previous matchups found.
                </p>
              )}
              {h2h.length > 0 && (
                <>
                  <div
                    className="flex items-center justify-center gap-8 p-4 mb-4 rounded-xl"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                  >
                    <div className="text-center">
                      <p className="text-3xl font-black" style={{ color: 'var(--green)' }}>
                        {h2h.filter((m) => m.t1Won).length}
                      </p>
                      <p className="text-[11px] mt-1" style={{ color: 'var(--muted)' }}>
                        {h2h[0].t1Abbr}
                      </p>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>
                      Last {h2h.length}
                    </p>
                    <div className="text-center">
                      <p className="text-3xl font-black" style={{ color: 'var(--red)' }}>
                        {h2h.filter((m) => !m.t1Won).length}
                      </p>
                      <p className="text-[11px] mt-1" style={{ color: 'var(--muted)' }}>
                        {h2h[0].t2Abbr}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {h2h.map((m, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                        style={{ background: 'var(--surface-2)' }}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="text-xs font-black w-4"
                            style={{ color: m.t1Won ? 'var(--green)' : 'var(--red)' }}
                          >
                            {m.t1Won ? 'W' : 'L'}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--muted)' }}>
                            {m.t1Home ? 'vs' : '@'} {m.t2Abbr}
                          </span>
                        </div>
                        <span
                          className="text-xs font-black tabular-nums"
                          style={{ color: 'var(--fg)' }}
                        >
                          {m.t1Score}–{m.t2Score}
                        </span>
                        <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
                          {new Date(m.date).toLocaleDateString([], {
                            month: 'short', day: 'numeric', year: '2-digit',
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          {tab === 'Commentary' && <Commentary plays={commentary} />}
          {tab === 'Stats' && <StatsPanel leaders={game.leaders || []} />}
        </div>
      </div>
    </div>
  )
}
