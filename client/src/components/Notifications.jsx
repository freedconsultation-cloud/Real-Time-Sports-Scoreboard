import { useEffect, useRef } from 'react'

const LEAGUE_EMOJI = { nfl: '🏈', nba: '🏀', mlb: '⚾', nhl: '🏒', soccer: '⚽' }

export default function Notifications({ events, onDismiss }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-xs w-full">
      {events.map((ev) => (
        <Notification key={ev.id} event={ev} onDismiss={() => onDismiss(ev.id)} />
      ))}
    </div>
  )
}

function Notification({ event, onDismiss }) {
  const timerRef = useRef(null)

  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, 5000)
    return () => clearTimeout(timerRef.current)
  }, [])

  const emoji = LEAGUE_EMOJI[event.league] || '🏆'

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl cursor-pointer"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      onClick={onDismiss}
    >
      <span className="text-xl shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        {event.type === 'score' && (
          <>
            <p className="text-xs font-bold" style={{ color: 'var(--accent)' }}>
              {event.abbr} scored{event.points > 1 ? ` ${event.points} pts` : ''}!
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              {event.score} · {event.period} {event.clock}
            </p>
          </>
        )}
        {event.type === 'final' && (
          <>
            <p className="text-xs font-bold" style={{ color: 'var(--yellow)' }}>Final</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              {event.game.homeTeam.abbr} {event.game.homeTeam.score} – {event.game.awayTeam.score} {event.game.awayTeam.abbr}
            </p>
          </>
        )}
      </div>
      <button className="text-xs shrink-0" style={{ color: 'var(--muted)' }}>✕</button>
    </div>
  )
}
