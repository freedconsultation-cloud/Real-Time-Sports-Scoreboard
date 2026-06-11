import { useEffect, useState } from 'react'
import Commentary from './Commentary'
import StatsPanel from './StatsPanel'
import HistoryChart from './HistoryChart'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'
const TABS = ['Score', 'Commentary', 'Stats']

export default function GameModal({ game, onClose }) {
  const [tab, setTab] = useState('Score')
  const [commentary, setCommentary] = useState([])

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
        <div className="px-5 pt-5 pb-3" style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
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
                <span
                  className={`text-4xl font-black tabular-nums ${awayWins ? '' : 'opacity-50'}`}
                  style={{ color: 'var(--fg)' }}
                >{game.awayTeam.score}</span>
                <span className="text-lg" style={{ color: 'var(--muted)' }}>–</span>
                <span
                  className={`text-4xl font-black tabular-nums ${homeWins ? '' : 'opacity-50'}`}
                  style={{ color: 'var(--fg)' }}
                >{game.homeTeam.score}</span>
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
        <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2.5 text-xs font-semibold relative"
              style={{ color: tab === t ? 'var(--accent)' : 'var(--muted)' }}
            >
              {t}
              {tab === t && (
                <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full" style={{ background: 'var(--accent)' }} />
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto">
          {tab === 'Score' && <HistoryChart game={game} />}
          {tab === 'Commentary' && <Commentary plays={commentary} />}
          {tab === 'Stats' && <StatsPanel leaders={game.leaders || []} />}
        </div>
      </div>
    </div>
  )
}
